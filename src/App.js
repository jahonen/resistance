import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import AppHeader from './components/AppHeader/AppHeader'; 
import CreatePostForm from './features/posts/CreatePostForm/CreatePostForm';
import PostFeed from './features/posts/PostFeed/PostFeed'; 
import './App.scss';

function App() {
  return (
    <AuthProvider> 
      <div className="App">
        <AppHeader /> 
        <nav className="main-nav"> 
          <Link to="/">Feed</Link>
          <Link to="/create">New Post</Link>
        </nav>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<PostFeed />} /> 
            <Route path="/create" element={<CreatePostForm />} />
            {/* Define other routes here */}
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
