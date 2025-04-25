function verifyPassword(plainPassword, storedHash, storedSalt) {
  // Convert salt from hex to buffer if stored as hex string
  const saltBuffer = typeof storedSalt === 'string' ? 
    Buffer.from(storedSalt, 'hex') : storedSalt;
  
  // Use the same hashing parameters as during registration
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(plainPassword, saltBuffer, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      
      // Convert derivedKey to hex string if needed
      const calculatedHash = derivedKey.toString('hex');
      
      // Debug logs that can be removed in production
      console.log("Hash comparison details:", {
        inputPassword: plainPassword,
        salt: storedSalt,
        calculatedHash: calculatedHash.substring(0, 10) + "...", 
        storedHash: storedHash.substring(0, 10) + "...",
        matches: calculatedHash === storedHash
      });
      
      resolve(calculatedHash === storedHash);
    });
  });
}

// Verify this function exists and works properly
function generateAuthToken(user) {
  // This should create a signed JWT or other token
  // Example:
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
}

// Make sure this function is exported and imported in auth.js
module.exports = {
  verifyPassword,
  generateAuthToken
}; 