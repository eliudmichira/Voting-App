// Login route handler
app.post('/api/login', async (req, res) => {
  try {
    const { nationalId, password, walletAddress } = req.body;
    
    // Get user from database
    const user = await getUserByNationalId(nationalId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // IMPORTANT: Remove development override for production
    const isPasswordValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    
    // Remove this condition for production
    // if (!isPasswordValid && process.env.NODE_ENV !== 'development') {
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // After successful login:
    if (isPasswordValid) {
      // Set proper session data
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.authenticated = true;
      
      // Set appropriate cookies or tokens
      const token = generateAuthToken(user); // Ensure this function exists
      
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          role: user.role,
          name: user.name
        },
        token: token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 