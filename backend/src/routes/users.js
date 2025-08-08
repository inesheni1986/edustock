const express = require('express');
const { getPool, sql } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {validateUser} = require("../middleware/validation");
const bcrypt = require("bcryptjs");
const router = express.Router();

// Mock data
let users = [
];

// Get all users
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Exemple : on peut ajouter un filtre optionnel sur le rôle ou l'établissement
    const { role, lyceeId, is_active } = req.query;

    let query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.lycee_id,
        l.name AS lycee_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        STUFF((
              SELECT ',' + CAST(ul2.laboratory_id AS VARCHAR)
              FROM user_laboratories ul2
              WHERE ul2.user_id = u.id
              FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS laboratory_ids      FROM users u
      LEFT JOIN lycees l ON u.lycee_id = l.id
      LEFT JOIN user_laboratories ul ON u.id = ul.user_id
      WHERE 1=1
    `;

    const request = getPool().request();

    if (role) {
      query += ` AND u.role = @role`;
      request.input('role', sql.NVarChar, role);
    }

    if (lyceeId) {
      query += ` AND u.lycee_id = @lycee_id`;
      request.input('lycee_id', sql.Int, parseInt(lyceeId));
    }

    if (is_active !== undefined) {
      query += ` AND u.is_active = @is_active`;
      request.input('is_active', sql.Bit, is_active === 'true');
    }

    // Tri par date de création décroissante
    query += ` GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.lycee_id, l.name, u.is_active, u.last_login, u.created_at, u.updated_at
ORDER BY u.created_at DESC;`;

    const result = await request.query(query);

    // Formatage de la réponse
    const users = result.recordset.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      lyceeId: user.lycee_id,
      lyceeName: user.lycee_name,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      laboratoryIds: user.laboratory_ids ? user.laboratory_ids.split(',').map(id => parseInt(id)) : []
    }));

    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  res.json(user);
});

// Create user
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const {
      email,
      password,  // idéalement, côté backend tu reçois déjà un hash ou tu le génères ici
      firstName,
      lastName,
      role,
      lyceeId,
      laboratoryIds
    } = req.body;

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const hashed = await hashPassword(password);
    const result = await request
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, hashed)
      .input('first_name', sql.NVarChar, firstName)
      .input('last_name', sql.NVarChar, lastName)
      .input('role', sql.NVarChar, role)
      .input('lycee_id', sql.Int, lyceeId || null)
      .query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, lycee_id)
        OUTPUT INSERTED.*
        VALUES (@email, @password_hash, @first_name, @last_name, @role, @lycee_id)
      `);

    const user = result.recordset[0];

    const newUserId = user.id;

    // Insertion des relations user-laboratories
    if (Array.isArray(laboratoryIds) && laboratoryIds.length > 0) {

      for (const labId of laboratoryIds) {
        const requestLink = new sql.Request(transaction);
        await requestLink
          .input('user_id', sql.Int, newUserId)
          .input('laboratory_id', sql.Int, labId)
          .query(`
            INSERT INTO user_laboratories (user_id, laboratory_id, created_at)
            VALUES (@user_id, @laboratory_id, GETDATE())
          `);
      }
    }

    await transaction.commit();

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      //lyceeId: user.lycee_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);

    if (error.number === 2627) { // Violation contrainte d'unicité (email unique)
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

async function hashPassword(password) {
  const saltRounds = 10; // nombre de rounds de sel, 10 est un bon compromis sécurité/performance
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (err) {
    console.error('Erreur lors du hash du mot de passe:', err);
    throw err;
  }
}

// Update user
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();
  try {
    const userId = parseInt(req.params.id);
    const {
      email,
      passwordHash, // si modifiable
      firstName,
      lastName,
      role,
      lyceeId,
      laboratoryIds
    } = req.body;

    //const pool = await getPool();
   // const request = pool.request();
    const request = new sql.Request(transaction);
    request.input('id', sql.Int, userId);
    if (email !== undefined) request.input('email', sql.NVarChar, email);
    if (passwordHash !== undefined) request.input('password_hash', sql.NVarChar, passwordHash);
    if (firstName !== undefined) request.input('first_name', sql.NVarChar, firstName);
    if (lastName !== undefined) request.input('last_name', sql.NVarChar, lastName);
    if (role !== undefined) request.input('role', sql.NVarChar, role);
    if (lyceeId !== undefined) request.input('lycee_id', sql.Int, lyceeId);

    // Construction dynamique de la requête UPDATE en fonction des champs présents
    let updateParts = [];
    if (email !== undefined) updateParts.push('email = @email');
    if (passwordHash !== undefined) updateParts.push('password_hash = @password_hash');
    if (firstName !== undefined) updateParts.push('first_name = @first_name');
    if (lastName !== undefined) updateParts.push('last_name = @last_name');
    if (role !== undefined) updateParts.push('role = @role');
    if (lyceeId !== undefined) updateParts.push('lycee_id = @lycee_id');

    if (updateParts.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    const updateQuery = `
      UPDATE users
      SET ${updateParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `;


    await request.query(updateQuery);

    // Mise à jour des laboratoires associés si tableau fourni
      if (Array.isArray(laboratoryIds)) {
        // Suppression des anciennes liaisons
        await new sql.Request(transaction)
          .input('user_id', sql.Int, userId)
          .query('DELETE FROM user_laboratories WHERE user_id = @user_id');

        // Réinsertion des nouvelles liaisons
        for (const labId of laboratoryIds) {
          await new sql.Request(transaction)
            .input('user_id', sql.Int, userId)
            .input('laboratory_id', sql.Int, labId)
            .query(`
              INSERT INTO user_laboratories (user_id, laboratory_id, created_at)
              VALUES (@user_id, @laboratory_id, GETDATE())
            `);
        }
      }

    const selectResult = await request.query(`
      SELECT id, email, first_name, last_name, role, lycee_id, is_active, last_login, created_at, updated_at
      FROM users WHERE id = @id
    `);

      // Requête pour récupérer les laboratoires liés à l'utilisateur
    const labsResult = await request.query(`
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @id
      `);

    if (selectResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    const laboratoryIds2 = labsResult.recordset.map(row => row.laboratory_id);

    await transaction.commit();

    const user = selectResult.recordset[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      lyceeId: user.lycee_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      laboratoryIds: laboratoryIds2
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);

    if (error.number === 2627) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query('DELETE FROM users WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(204).send();

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;