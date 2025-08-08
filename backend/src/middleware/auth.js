const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, decoded.id)
      .query('SELECT * FROM users WHERE id = @userId AND is_active = 1');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      lyceeId: decoded.lyceeId,
      laboratories: decoded.laboratories || []
    };
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }
    next();
  };
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole, authorizeRoles };