const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get the token from the 'Authorization' header
  const token = req.header('Authorization');

  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Handle 'Bearer' token format
  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
    return res.status(400).json({ message: 'Invalid token format' });
  }

  try {
    // Verify the token using the secret key
    const verified = jwt.verify(tokenParts[1], process.env.JWT_SECRET);
    req.user = verified; // Attach verified user info to the request
    next(); // Pass control to the next middleware
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' }); // Return 403 for invalid token
  }
};
