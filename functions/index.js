/* eslint-disable max-len */
/* eslint-disable object-curly-spacing */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// Initialize Firebase Admin SDK (runs with service account privileges)
admin.initializeApp();
const db = admin.firestore();

// --- Configuration Constants ---
// These should match or be sourced consistently with your client-side
const POINTS_FOR_POSTING = 1; // Example: Points earned per post for each tag used
const MIN_REP_SCORE = 0; // Minimum reputation score
// -----------------------------

/**
 * Cloud Function triggered when a new document is created in 'posts'.
 * Handles updating user reputation and marking hashtag founders.
 */
exports.updateReputationOnPostCreate = onDocumentCreated({
  document: "posts/{postId}",
  region: "europe-west3",
}, async (event) => {
  // Get the snapshot and params from the event object
  const snap = event.data;
  if (!snap) {
    functions.logger.error("Event data (snapshot) is missing!");
    return null;
  }
  const postId = event.params.postId;

  // Original logic starts here, using snap and postId
  const postData = snap.data();

  functions.logger.log(`Processing post creation: ${postId}`, { postData });

  if (!postData || !postData.authorHash || !postData.hashtags) {
    functions.logger.error("Post data missing authorHash or hashtags.", {
      postId,
    });
    return null; // Exit if essential data is missing
  }

  const authorHash = postData.authorHash;
  // Ensure hashtags is an array, default to empty if not present or null
  const hashtags = Array.isArray(postData.hashtags) ? postData.hashtags : [];

  if (hashtags.length === 0) {
    functions.logger.log("Post has no hashtags, skipping reputation update.", {
      postId,
    });
    return null;
  }

  const userProfileRef = db.collection("userProfiles").doc(authorHash);

  try {
    // Use a transaction to ensure atomic updates
    await db.runTransaction(async (transaction) => {
      // 1. Get the current user profile (if it exists)
      const userProfileDoc = await transaction.get(userProfileRef);
      const userProfileData = userProfileDoc.exists ?
        userProfileDoc.data() :
        null;

      // Initialize reputation map if it doesn't exist on the profile
      const currentReputationMap = userProfileData?.reputationByHashtag || {};
      // Prepare base update object
      const userProfileUpdates = {
        // Always update last active time when they post
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      };
        // Initialize reputation map within updates if not already there
      if (!userProfileUpdates.reputationByHashtag) {
        userProfileUpdates.reputationByHashtag = { ...currentReputationMap };
      }
      const needsProfileUpdate = true; // Assume profile needs update initially

      // If the profile doesn't exist at all, create it minimally.
      if (!userProfileDoc.exists) {
        functions.logger.warn(
            `User profile for hash ${authorHash} not found. Creating profile.`,
        ); // eslint-disable-line max-len
        // Set initial fields for a new profile within the transaction
        userProfileUpdates.passkeyHash = authorHash;
        userProfileUpdates.createdAt =
            admin.firestore.FieldValue.serverTimestamp();
        // Initialize foundedHashtags directly in updates
        userProfileUpdates.foundedHashtags = [];
      } else {
        // Ensure foundedHashtags array exists if profile exists
        userProfileUpdates.foundedHashtags = Array.isArray(
            userProfileData.foundedHashtags,
        ) ?
            [...userProfileData.foundedHashtags] :
            []; // Initialize if missing or not an array
      }

      // 2. Process each hashtag
      for (const tag of hashtags) {
        if (!tag || typeof tag !== "string") continue; // Skip invalid tags

        const tagRef = db.collection("hashtags").doc(tag);
        const tagDoc = await transaction.get(tagRef);
        let isNewFounder = false;

        // Check/Set Founder Status for Hashtag
        if (!tagDoc.exists) {
          // Create tag doc and set founder
          functions.logger.log(
              `Hashtag #${tag} doc missing. Creating & setting founder.`,
          ); // eslint-disable-line max-len
          transaction.set(tagRef, {
            founderUserHash: authorHash,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          isNewFounder = true;
        } else if (!tagDoc.data()?.founderUserHash) {
          // Hashtag exists but has no founder - this user claims it!
          functions.logger.log(`Setting founder for existing hashtag #${tag}.`);
          transaction.update(tagRef, { founderUserHash: authorHash });
          isNewFounder = true;
        }

        // Add tag to user's founded list if they are the new founder
        // and it's not already in the list being updated
        if (isNewFounder &&
            !userProfileUpdates.foundedHashtags.includes(tag)) {
          userProfileUpdates.foundedHashtags.push(tag);
        }

        // Update User Reputation for this tag
        const currentRep = currentReputationMap[tag] || 0;
        const newRep = Math.max(MIN_REP_SCORE, currentRep + POINTS_FOR_POSTING);
        userProfileUpdates.reputationByHashtag[tag] = newRep;
        functions.logger.log(
            `Updated rep for tag #${tag}: ${currentRep} -> ${newRep}`,
        );
      }

      // 3. Apply updates to the user profile document using set with merge
      if (needsProfileUpdate) {
        transaction.set(userProfileRef, userProfileUpdates, { merge: true });
        functions.logger.log(
            `Committing updates for user profile: ${authorHash}`,
        ); // eslint-disable-line max-len
      } else {
        functions.logger.log(
            `No necessary updates for user profile: ${authorHash}`,
        ); // eslint-disable-line max-len
      }
    }); // End Transaction

    functions.logger.log("Transaction completed successfully.", { postId });
    return null;
  } catch (error) {
    functions.logger.error("Error processing post creation transaction:", {
      postId,
      error: error.message,
      stack: error.stack, // eslint-disable-line comma-dangle
    });
    // Consider adding error reporting integration here
    return null; // Prevent function from retrying indefinitely
  }
});
