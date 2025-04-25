// Ensure this function uses the same hashing parameters as verification
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    crypto.randomBytes(16, (err, salt) => {
      if (err) return reject(err);
      
      // Use PBKDF2 with the same parameters as in verification
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        
        resolve({
          salt: salt.toString('hex'),
          hash: derivedKey.toString('hex')
        });
      });
    });
  });
} 