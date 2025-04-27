import sha256 from 'crypto-js/sha256'; // Import sha256

/**
 * Generates a secure random passkey of specified length
 * 
 * @param {number} length The length of the passkey (default: 25)
 * @returns {string} A random passkey with appropriate entropy
 */
export const generateRandomPasskey = (length = 25) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues); // Use browser's crypto API for secure random numbers
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(randomValues[i] % charset.length);
  }
  
  return result;
};

/**
 * Measures entropy of a passkey (simplified strength indicator)
 * 
 * @param {string} passkey The passkey to measure
 * @returns {number} A score from 0-100 representing passkey strength
 */
export const measurePasskeyStrength = (passkey) => {
  if (!passkey) return 0;
  
  // Character set diversity bonus points
  let diversityBonus = 0;
  if (/[a-z]/.test(passkey)) diversityBonus += 26;
  if (/[A-Z]/.test(passkey)) diversityBonus += 26;
  if (/[0-9]/.test(passkey)) diversityBonus += 10;
  if (/[^A-Za-z0-9]/.test(passkey)) diversityBonus += 33; // Based on OWASP recommendation
  
  // Calculate bits of entropy (simplified)
  // log2(pool^length)
  const entropy = passkey.length * Math.log2(diversityBonus || 1); // Use 1 if no diversity to avoid log2(0)

  // Normalize to a 0-100 scale
  // Aiming for ~128 bits as a good target for 'Very Strong' (100%)
  const score = Math.min((entropy / 128) * 100, 100);

  // Penalize for very short lengths despite diversity
  if (passkey.length < 12) {
    return Math.max(0, score * (passkey.length / 12));
  }
  if (passkey.length < 8) {
     return 0; // Too short
  }

  // Penalize for low uniqueness (repetition)
  const uniqueChars = new Set(passkey.split('')).size;
  const uniquenessFactor = uniqueChars / passkey.length;
  
  return Math.max(0, score * uniquenessFactor);
};

// Function to generate SHA-256 hash from a passkey
export const generateHash = (passkey) => {
  if (!passkey) return ''; // Return empty string if no passkey
  return sha256(passkey).toString();
};
