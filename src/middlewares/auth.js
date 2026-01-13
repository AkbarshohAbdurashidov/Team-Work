const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const parts = auth.split(' ');
  if (parts.length < 2) return res.status(401).json({ error: 'Missing token' });
  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const verifyOptions = {
      issuer: process.env.JWT_ISSUER || 'team-work',
      audience: process.env.JWT_AUDIENCE || 'team-work-users',
      algorithms: ['HS256'],
    };
    const payload = jwt.verify(token, secret, verifyOptions);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
