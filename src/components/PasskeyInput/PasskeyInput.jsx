import React, { useState } from 'react';
// Import RebelAvatar from its new component location
import RebelAvatar from '../RebelAvatar/RebelAvatar';
// Import utility functions from their new location
import { generateRandomPasskey, measurePasskeyStrength } from '../../utils/passkeyUtils.js'; 
import './PasskeyInput.scss';

/**
 * Passkey input component with generation, validation and avatar preview
 * 
 * @param {Object} props Component props
 * @param {string} props.value Current passkey value
 * @param {function} props.onChange Handler for passkey changes
 * @param {boolean} props.showStrengthMeter Whether to show strength meter
 * @returns {JSX.Element} Passkey input with avatar
 */
const PasskeyInput = ({ value = '', onChange, showStrengthMeter = true }) => {
  const [showPasskey, setShowPasskey] = useState(false);
  
  const handleChange = (e) => {
    onChange(e.target.value);
  };
  
  const handleRandomize = () => {
    onChange(generateRandomPasskey());
  };
  
  const strength = measurePasskeyStrength(value);
  
  const getStrengthLabel = () => {
    if (strength >= 80) return 'Very Strong';
    if (strength >= 60) return 'Strong';
    if (strength >= 40) return 'Moderate';
    if (strength >= 20) return 'Weak';
    return 'Very Weak';
  };
  
  const getStrengthColor = () => {
    if (strength >= 80) return '#22c55e'; // Emerald 500
    if (strength >= 60) return '#84cc16'; // Lime 500
    if (strength >= 40) return '#eab308'; // Yellow 500
    if (strength >= 20) return '#f97316'; // Orange 500
    return '#ef4444'; // Red 500
  };
  
  return (
    <div className="passkey-input-container">
      {(value.length >= 15 || value.length === 25) && showStrengthMeter && (
        <div className="avatar-preview">
          <RebelAvatar 
            passkey={value.padEnd(25, '0')} // Pad if not full length for preview
            size={80} 
          />
        </div>
      )}
      
      <div className="input-controls">
        <div className="passkey-field-wrapper">
          <input 
            type={showPasskey ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            placeholder="Enter or generate passkey (25 chars)"
            maxLength={25} // Enforce max length based on spec
            className="passkey-input"
          />
          <button 
            type="button" 
            onClick={() => setShowPasskey(!showPasskey)} 
            className="toggle-visibility"
            aria-label={showPasskey ? "Hide passkey" : "Show passkey"}
          >
            {showPasskey ? '👁️‍🗨️' : '👁️'} 
          </button>
        </div>

        <button type="button" onClick={handleRandomize} className="randomize-button">
          Generate Random
        </button>
        
        {showStrengthMeter && (
          <div className="strength-meter-container">
            <div className="strength-bar-wrapper">
              <div 
                className="strength-bar"
                style={{ width: `${strength}%`, backgroundColor: getStrengthColor() }}
              ></div>
            </div>
            <span className="strength-label" style={{ color: getStrengthColor() }}>
              {getStrengthLabel()} ({Math.round(strength)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasskeyInput;