import React, { createContext, useState, useContext, useMemo } from 'react';
import { generateHash } from '../utils/passkeyUtils'; // Assuming this path

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUserPasskey, setCurrentUserPasskey] = useState('');
  const [passkeyHash, setPasskeyHash] = useState('');

  // Function to update the passkey and its hash
  const setPasskey = (newPasskey) => {
    const trimmedKey = (newPasskey || '').trim(); // Handle null/undefined and trim
    setCurrentUserPasskey(trimmedKey); 
    if (trimmedKey && trimmedKey.length === 25) { // Only generate hash if valid
      const hash = generateHash(trimmedKey);
      setPasskeyHash(hash);
      console.log('Passkey set, hash:', hash); // For debugging
    } else {
      setPasskeyHash(''); // Clear hash if passkey is invalid or cleared
      if (trimmedKey && trimmedKey.length !== 25) {
           console.warn('Invalid passkey length. Must be 25 characters.');
      }
    }
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ 
      currentUserPasskey,
      passkeyHash, 
      setPasskey
  }), [currentUserPasskey, passkeyHash]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
