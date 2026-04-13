const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./authController');

const authRequired = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Требуется авторизация.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Недействительный токен.' });
  }
};

const rolesAllowed = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав.' });
  }
  next();
};

module.exports = { authRequired, rolesAllowed };
