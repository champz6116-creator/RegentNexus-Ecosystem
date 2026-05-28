const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Validates incoming JSON Web Tokens, extracts structural identification metrics,
 * and sets rich contextual user profiles directly into the execution lifecycle.
 */
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication verification frame dropped: Token Missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Core Upgrade: Hydrate the complete profile payload while filtering sensitive hashes
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(404).json({ message: 'Identity profile missing from active environment nodes.' });
    }

    // Backwards-Compatibility Safety Net: Preserve current standard key bindings
    req.userId = decoded.id;
    req.role = req.user.role; // Synced safely with fresh database values
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Security payload compromised: Token Invalid.' });
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
          message: `Access Blocked: High-level [${role.join('/')}] clearance constraints mandatory.` 
        });
      }
    } else if (activeRole !== role) {
      return res.status(403).json({ 
        message: `Access Blocked: High-level [${role}] clearance constraints mandatory.` 
      });
    }
    
    next();
  };
}

module.exports = { verifyToken, requireRole };