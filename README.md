# Resistance Feed: Secure Comms for the Sparks of Rebellion

```
        _______
       //  \\\\
      //____\\\\
     //      \\\\
    //________\\\\
   //__________\\\\
  //            \\\\
 =====================
```

**Status:** Alpha Build - Operational but requires field testing.

## Mission Briefing

In times when bloated regimes, more concerned with gaudy aesthetics and self-aggrandizing rallies than effective governance, attempt to control the narrative, secure communication becomes paramount. The old channels are compromised, monitored by bureaucratic droids and forces led by figures whose pronouncements often border on the absurd – a sort of 'Galactic Empire' run by a committee seemingly inspired by inept Bond villains demanding loyalty oaths on oversized starships.

This **Resistance Feed** is an experiment in decentralized, pseudo-anonymous communication. It's a place to share intel, coordinate actions, and build reputation without revealing your core identity to every passing probe droid or data-mining operation.

## Core Features

*   **Passkey Identity:** Generate or use a unique 25-character passkey. This is your comm signal for the session, hashing into a unique identifier and generating your visual signature (Avatar). **Guard it well.** Losing it means losing access to that specific identity's history and reputation.
*   **Universal Header:** Enter your passkey once in the main header to authenticate for your session.
*   **Anonymous Posting:** Transmit messages associated only with your passkey hash.
*   **Hashtag System:** Tag messages with relevant topics (`#AlderaanStrong`, `#ScruffyLookingNerfHerder`).
*   **Reputation via Action (Cloud Function Backend):**
    *   Creating posts contributes to your standing.
    *   Founding a *new* hashtag grants founder status (visible eventually).
    *   Reputation logic runs securely in the Firebase Cloud Nebula.
*   **Voting Mechanism (Cloud Function Backend):** Upvote/Downvote posts to signal importance. Votes influence reputation (logic handled server-side by `processVote` function).
*   **Real-Time Feed:** See new transmissions as they arrive via Firestore stream.

## Tech Stack - Our Alliance Toolkit

*   **Frontend:** React (via Create React App)
*   **Styling:** SCSS
*   **State Management:** React Context API (`AuthContext` for passkey)
*   **Backend & Database:** Firebase Cloud Firestore, Firebase Cloud Functions (v2), Firebase Hosting
*   **Hashing:** crypto-js (SHA-256 for passkey hashing)
*   **Utilities:** date-fns (for timestamps)

## Getting Started - Joining the Network

1.  **Clone the Holonet Relay:**
    ```bash
    git clone https://github.com/jahonen/resistance.git
    cd resistance
    ```
2.  **Install Power Converters (Dependencies):**
    ```bash
    npm install
    cd functions && npm install && cd ..
    ```
3.  **Configure Firebase:**
    *   Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`) and are logged in (`firebase login`).
    *   Connect this local repo to your Firebase project (if not done already): `firebase use --add` (Select your Firebase project, e.g., `rebel-d4a51`).
    *   Create a `.env` file in the root directory based on `.env.sample` (if one exists) or configure `src/firebase/config.js` directly with your Firebase project's web app configuration details.
4.  **Deploy Cloud Functions:**
    *   Make sure the necessary Cloud APIs are enabled in your Google Cloud Project (`cloudfunctions`, `cloudbuild`, `artifactregistry`, `run`, `eventarc`, `pubsub`, `storage`).
    *   Deploy the backend logic:
        ```bash
        firebase deploy --only functions
        ```
5.  **Launch Local Monitor:**
    ```bash
    npm start
    ```

## Security & Anonymity Protocol

This system uses passkeys for pseudo-anonymity. Your identity *within the feed* is tied to the SHA-256 hash of your passkey. 

*   **Don't reuse passkeys** from other systems.
*   **Keep your passkey secret.** Anyone with your passkey can post as you within this system.
*   This **does not** hide your network activity (IP address etc.) from the underlying hosting provider (Firebase/Google Cloud) or potentially sophisticated network eavesdroppers. True operational security requires additional layers (VPNs, Tor, etc.) beyond the scope of this app.

## Join the Resistance!

This is an early build. Bugs are expected, features are planned. Feel free to fork, contribute, and help build a communication network worthy of the Rebel Alliance.

*May the Force (and good code) be with you.*
