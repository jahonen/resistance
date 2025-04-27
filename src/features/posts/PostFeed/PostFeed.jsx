import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import PostItem from '../PostItem/PostItem';
import './PostFeed.scss';

/**
 * Displays a feed of posts fetched from Firestore.
 */
const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { passkeyHash } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);

    const postsCollectionRef = collection(db, 'posts');
    // Order posts by creation time, newest first
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
        setLoading(false);
      }, 
      (err) => {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <div className="feed-status loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="feed-status error">{error}</div>;
  }

  return (
    <div className="post-feed-container">
      {posts.length === 0 ? (
        <p className="feed-status empty">No posts yet. Be the first!</p>
      ) : (
        posts.map(post => (
          <PostItem 
              key={post.id} 
              post={post} 
              currentUserPasskeyHash={passkeyHash} // Pass the current user's HASH
          />
        ))
      )}
    </div>
  );
};

export default PostFeed;