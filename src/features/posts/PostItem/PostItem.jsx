import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom'; // For linking hashtags
import { formatDistanceToNow } from 'date-fns'; // For human-readable timestamps
import RebelAvatar from '../../../components/RebelAvatar/RebelAvatar';
import VoteButtons from '../../voting/VoteButtons/VoteButtons'; // Import VoteButtons
import './PostItem.scss';

/**
 * Displays a single post item.
 *
 * @param {object} props - Component props.
 * @param {object} props.post - The post data object from Firestore.
 * @param {string} props.post.id - The document ID of the post.
 * @param {string} props.post.content - The text content of the post.
 * @param {string} props.post.author_hash - The SHA-256 hash of the author's passkey.
 * @param {string} props.post.author_avatar_seed - The seed (passkey) for the author's avatar.
 * @param {Array<string>} props.post.hashtags - An array of hashtags associated with the post.
 * @param {object} props.post.created_at - Firestore Timestamp object.
 * @param {number} props.post.upvotesCount - Number of upvotes.
 * @param {number} props.post.downvotesCount - Number of downvotes.
 * @param {string|null} props.currentUserPasskeyHash - The hash of the currently logged-in user's passkey, or null.
 */
const PostItem = ({ post, currentUserPasskeyHash }) => {

  // Format timestamp
  const timeAgo = post.created_at?.toDate ? 
    formatDistanceToNow(post.created_at.toDate(), { addSuffix: true }) : 
    'just now';

  return (
    <article className="post-item">
      <div className="post-header">
        <div className="author-avatar">
          {/* Pass the seed (passkey) to generate the consistent avatar */}
          <RebelAvatar passkey={post.author_avatar_seed} size={40} />
        </div>
        <div className="post-meta">
          {/* We don't show the hash directly, avatar is the identifier */}
          {/* Optionally fetch and display founder status/reputation later */}
          <span className="timestamp">{timeAgo}</span>
        </div>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
      </div>

      <div className="post-footer">
        <div className="hashtags-container">
          {post.hashtags?.map(tag => (
            // TODO: Create actual hashtag feed routes
            <Link to={`/tag/${tag}`} key={tag} className="hashtag-link">
              #{tag}
            </Link>
          ))}
        </div>
        <div className="vote-section">
          {/* Replace placeholders with VoteButtons component */}
          <VoteButtons 
              postId={post.id}
              postAuthorHash={post.author_hash}
              postHashtags={post.hashtags || []} // Ensure it's an array
              currentUserPasskeyHash={currentUserPasskeyHash} // Pass the HASH
          />
          {/* Display counts separately for clarity */}
          <span className="vote-count up">▲ {post.upvotesCount || 0}</span>
          <span className="vote-count down">▼ {post.downvotesCount || 0}</span>
        </div>
      </div>
    </article>
  );
};

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    author_hash: PropTypes.string.isRequired,
    author_avatar_seed: PropTypes.string.isRequired,
    hashtags: PropTypes.arrayOf(PropTypes.string),
    created_at: PropTypes.object, // Firestore Timestamp
    upvotesCount: PropTypes.number,
    downvotesCount: PropTypes.number,
  }).isRequired,
  currentUserPasskeyHash: PropTypes.string, // Hash can be null if not logged in
};

PostItem.defaultProps = {
    currentUserPasskeyHash: null, // Default to null
};

export default PostItem;