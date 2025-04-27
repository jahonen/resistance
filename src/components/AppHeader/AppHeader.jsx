import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RebelAvatar from '../RebelAvatar/RebelAvatar'; // Adjust path if needed
import './AppHeader.scss';

const AppHeader = () => {
  const { currentUserPasskey, passkeyHash, setPasskey } = useAuth();

  const handlePasskeyChange = (event) => {
    // Directly update context on change
    setPasskey(event.target.value);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <RebelAvatar passkeyHash={passkeyHash || ''} />
      </div>
      <div className="header-right">
        <label htmlFor="passkey-input">Passkey:</label>
        <input
          id="passkey-input"
          type="text" // Consider type="password" if needed later
          value={currentUserPasskey}
          onChange={handlePasskeyChange}
          placeholder="Enter 25-char passkey"
          maxLength="25"
          className="passkey-input"
          aria-label="Enter your 25-character passkey"
        />
         {/* Optionally show hash for debugging - remove later */}
         {/* {passkeyHash && <span className="hash-display">Hash: {passkeyHash}</span>} */}
      </div>
    </header>
  );
};

export default AppHeader;
