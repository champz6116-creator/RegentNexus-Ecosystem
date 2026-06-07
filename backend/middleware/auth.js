const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Validates incoming JSON Web Tokens, extracts structural identification metrics,
 * and sets rich contextual user profiles directly into the execution lifecycle.
 */
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Core Upgrade: Hydrate the complete profile payload while filtering sensitive hashes
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Backwards-Compatibility Safety Net: Preserve current standard key bindings
    req.userId = decoded.id;
    req.role = req.user.role; // Synced safely with fresh database values
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Your session has expired. Please log in again.' });
  }
}

/**
 * Restricts route clearance mappings based on granular system access profiles.
 * Accommodates explicit arrays for multiple permitted user groupings.
 * @param {string|string[]} role - The permitted authorization classification(s)
 */
function requireRole(role) {
  return (req, res, next) => {
    // Falls back gracefully on legacy role structures or freshly hydrated database vectors
    const activeRole = req.user?.role || req.role;

    if (Array.isArray(role)) {
      if (!role.includes(activeRole)) {
        return res.status(403).json({ 
          message: `You don't have permission to view this page.` 
        });
      }
    } else if (activeRole !== role) {
      return res.status(403).json({ 
        message: `You don't have permission to view this page.` 
      });
    }
    
    next();
  };
}

module.exports = { verifyToken, requireRole };