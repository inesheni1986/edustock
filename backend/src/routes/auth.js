const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../database/connection');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const pool = getPool();
    
    // Rechercher l'utilisateur
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT u.*, l.name as lycee_name 
        FROM users u 
        LEFT JOIN lycees l ON u.lycee_id = l.id 
        WHERE u.email = @email AND u.is_active = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.recordset[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Récupérer les laboratoires de l'utilisateur
    const labsResult = await pool.request()
      .input('userId', sql.Int, user.id)
      .query(`
        SELECT l.id, l.name 
        FROM laboratories l
        INNER JOIN user_laboratories ul ON l.id = ul.laboratory_id
        WHERE ul.user_id = @userId
      `);

    const laboratories = labsResult.recordset;

    // Mettre à jour la dernière connexion
    await pool.request()
      .input('userId', sql.Int, user.id)
      .query('UPDATE users SET last_login = GETDATE() WHERE id = @userId');

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        lyceeId: user.lycee_id,
        laboratories: laboratories.map(lab => lab.id)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        lyceeId: user.lycee_id,
        lyceeName: user.lycee_name,
        laboratories: laboratories,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Vérification du token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pool = getPool();
    const result = await pool.request()
      .input('userId', sql.Int, decoded.id)
      .query(`
        SELECT u.*, l.name as lycee_name 
        FROM users u 
        LEFT JOIN lycees l ON u.lycee_id = l.id 
        WHERE u.id = @userId AND u.is_active = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.recordset[0];

    // Récupérer les laboratoires
    const labsResult = await pool.request()
      .input('userId', sql.Int, user.id)
      .query(`
        SELECT l.id, l.name 
        FROM laboratories l
        INNER JOIN user_laboratories ul ON l.id = ul.laboratory_id
        WHERE ul.user_id = @userId
      `);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        lyceeId: user.lycee_id,
        lyceeName: user.lycee_name,
        laboratories: labsResult.recordset,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;