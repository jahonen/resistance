import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './VoteButtons.scss';

// Get Firebase Functions instance
const functions = getFunctions();
const processVote = httpsCallable(functions, 'processVote');

/**
 * Component with upvote and downvote buttons for a post.
 *
 * @param {object} props - Component props.
 * @param {string} props.postId - The ID of the post being voted on.
 * @param {string} props.postAuthorHash - The hash of the post's author (to prevent self-voting).
 * @param {Array<string>} props.postHashtags - The hashtags associated with the post.
 * @param {string} props.currentUserPasskeyHash - The hash of the currently authenticated user's passkey (REQUIRED).
 */
const VoteButtons = ({ postId, postAuthorHash, postHashtags, currentUserPasskeyHash }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // TODO: Add state to track user's current vote (up/down/none) for visual feedback

  const handleVote = useCallback(async (direction) => {
    setError(null);
    // Use the hash directly from props
    if (!currentUserPasskeyHash) {
      setError('Please enter passkey in header to vote.');
      // Optionally disable buttons or show a login prompt
      return;
    }
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);

    try {
      const voterHash = currentUserPasskeyHash; // Use the hash directly

      if (voterHash === postAuthorHash) {
        setError('You cannot vote on your own post.');
        setIsLoading(false);
        return;
      }

      // Call the Cloud Function for each tag associated with the post
      const votePromises = postHashtags.map(tag => {
        return processVote({ 
            postId,
            voterHash,
            newDirection: direction,
            tag
        });
      });

      // Wait for all vote processing calls to complete
      const results = await Promise.all(votePromises);

      // Check results (optional, basic logging for now)
      results.forEach((result, index) => {
        if (result.data.success) {
            console.log(`Vote processed for tag #${postHashtags[index]}`);
        } else {
            console.error(`Error processing vote for tag #${postHashtags[index]}:`, result.data.message);
            // Aggregate errors? For now, just log.
        }
      });
       // TODO: Update local vote state visually after success

    } catch (err) {
      console.error('Error calling processVote function:', err);
      setError(`Failed to process vote: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [postId, postAuthorHash, postHashtags, currentUserPasskeyHash, isLoading]);

  return (
    <div className="vote-buttons-container">
      <button 
        className={`vote-button up ${isLoading ? 'loading' : ''}`} 
        onClick={() => handleVote(1)}
        disabled={isLoading || !currentUserPasskeyHash}
        aria-label="Upvote"
      >
        ▲
      </button>
      <button 
        className={`vote-button down ${isLoading ? 'loading' : ''}`}
        onClick={() => handleVote(-1)}
        disabled={isLoading || !currentUserPasskeyHash}
        aria-label="Downvote"
      >
        ▼
      </button>
      {error && <p className="vote-error-message">{error}</p>}
    </div>
  );
};

VoteButtons.propTypes = {
  postId: PropTypes.string.isRequired,
  postAuthorHash: PropTypes.string.isRequired,
  postHashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentUserPasskeyHash: PropTypes.string, // Can be null/undefined if user not logged in
};

VoteButtons.defaultProps = {
    currentUserPasskeyHash: null, 
};

export default VoteButtons;