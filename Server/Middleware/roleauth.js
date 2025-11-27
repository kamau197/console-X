// middleware/roleAuth.js
module.exports = function(allowed = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowed.length) return next();
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    return next();
  };
};
