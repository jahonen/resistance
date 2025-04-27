import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; 
import { db } from '../../../firebase/config'; 
import { 
    collection, addDoc, doc, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore'; 
import './CreatePostForm.scss'; 
 
/**
 * Component for creating new posts with passkey authentication
 */
const CreatePostForm = () => {
  const [content, setContent] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { passkeyHash } = useAuth(); 
  const navigate = useNavigate();
  
  const extractHashtags = (text) => {
    const hashtagRegex = /#([\w\u0590-\u05ff]+)/g; 
    const matches = text.matchAll(hashtagRegex);
    const uniqueTags = new Set();
    for (const match of matches) {
      uniqueTags.add(match[1]); 
    }
    return Array.from(uniqueTags); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Check if passkeyHash is available from context
    if (!passkeyHash) {
      setError('Please enter a valid 25-character passkey in the header first.');
      return;
    }
    
    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const authorHash = passkeyHash; 
      const extractedHashtags = extractHashtags(hashtagsInput);
      const authorProfileRef = doc(db, 'userProfiles', authorHash);
      const postsCollectionRef = collection(db, 'posts');

      // --- Check and Create User Profile (if needed) --- 
      const userProfileSnap = await getDoc(authorProfileRef);
      if (!userProfileSnap.exists()) {
          console.log(`Creating profile for user hash: ${authorHash}`);
          await setDoc(authorProfileRef, { 
              passkeyHash: authorHash, // Store the hash itself
              createdAt: serverTimestamp(),
              // Add any other default profile fields if needed
          });
      } else {
          console.log(`Profile already exists for user hash: ${authorHash}`);
      }

      // --- Check and Create Hashtag Docs (if needed) --- 
      for (const tag of extractedHashtags) {
          const tagRef = doc(db, 'hashtags', tag);
          const tagSnap = await getDoc(tagRef);
          if (!tagSnap.exists()) {
              console.log(`Creating document for hashtag: #${tag}`);
              await setDoc(tagRef, {
                  createdAt: serverTimestamp()
                  // No founder, no count - just mark its existence
              });
          }
      }

      // --- Create the Post Document --- 
      await addDoc(postsCollectionRef, {
        authorHash: authorHash, // Identify author by hash
        text: content,
        hashtags: extractedHashtags,
        createdAt: serverTimestamp(),
      });

      console.log('Post created successfully!');
      
      navigate('/'); // Navigate home after success

    } catch (err) {
      console.error('Error creating post:', err);
      setError(`Failed to create post: ${err.message}`);
      setIsSubmitting(false);
    } 
    // Don't set isSubmitting to false here if navigation happens
  };
  
  return (
    <div className="create-post-form-container">
      <h2>Create New Resistance Post</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="content-section">
          <label htmlFor="content">Message:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind, rebel?" 
            rows={5}
            required
          />
        </div>

        <div className="hashtags-section">
          <label htmlFor="hashtags">Hashtags (e.g., #starwars #rebellion):</label>
          <input
            type="text"
            id="hashtags"
            value={hashtagsInput}
            onChange={(e) => setHashtagsInput(e.target.value)}
            placeholder="Add relevant tags separated by spaces or commas"
          />
        </div>

        {error && <div className="error-message">Error: {error}</div>}

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Broadcasting...' : 'Transmit Message'}
        </button>
      </form>
    </div>
  );
};

export default CreatePostForm;