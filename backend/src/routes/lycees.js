const express = require('express');
const { getPool, sql } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {validateLycee} = require("../middleware/validation");

const router = express.Router();

// Get all lycees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, name, address, city, postal_code, phone, email, created_at, updated_at
      FROM lycees
      ORDER BY name
    `);

    const lycees = result.recordset.map(lycee => ({
      id: lycee.id,
      name: lycee.name,
      address: lycee.address,
      city: lycee.city,
      postalCode: lycee.postal_code,
      phone: lycee.phone,
      email: lycee.email,
      createdAt: lycee.created_at,
      updatedAt: lycee.updated_at
    }));

    res.json(lycees);

  } catch (error) {
    console.error('Erreur lors de la récupération des lycées:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get lycee by ID
router.get('/:id', authenticateToken, (req, res) => {
  const lycee = lycees.find(l => l.id === parseInt(req.params.id));
  if (!lycee) {
    return res.status(404).json({ message: 'Lycée non trouvé' });
  }
  res.json(lycee);
});

// Create lycee
router.post('/', authenticateToken, authorizeRoles('admin'), validateLycee, async (req, res) => {
  const { name, address, city, postalCode, phone, email } = req.body;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('postal_code', sql.NVarChar, postalCode)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .query(`
        INSERT INTO lycees (name, address, city, postal_code, phone, email, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@name, @address, @city, @postal_code, @phone, @email, GETDATE(), GETDATE())
      `);

    const lycee = result.recordset[0];

    res.status(201).json({
      id: lycee.id,
      name: lycee.name,
      address: lycee.address,
      city: lycee.city,
      postalCode: lycee.postal_code,
      phone: lycee.phone,
      email: lycee.email,
      createdAt: lycee.created_at,
      updatedAt: lycee.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création du lycée:', error);

    if (error.number === 2627) { // Contrainte d'unicité sur email
      return res.status(400).json({ error: 'Email déjà utilisé pour un lycée.' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update lycee
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const lyceeId = parseInt(req.params.id);
  if (isNaN(lyceeId)) {
    return res.status(400).json({ message: 'ID de lycée invalide' });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.Int, lyceeId);

    // Construction dynamique de la requête UPDATE selon les champs reçus
    const fields = [];
    if (req.body.name !== undefined) {
      fields.push('name = @name');
      request.input('name', sql.NVarChar, req.body.name);
    }
    if (req.body.address !== undefined) {
      fields.push('address = @address');
      request.input('address', sql.NVarChar, req.body.address);
    }
    if (req.body.city !== undefined) {
      fields.push('city = @city');
      request.input('city', sql.NVarChar, req.body.city);
    }
    if (req.body.postalCode !== undefined) {
      fields.push('postal_code = @postal_code');
      request.input('postal_code', sql.NVarChar, req.body.postalCode);
    }
    if (req.body.phone !== undefined) {
      fields.push('phone = @phone');
      request.input('phone', sql.NVarChar, req.body.phone);
    }
    if (req.body.email !== undefined) {
      fields.push('email = @email');
      request.input('email', sql.NVarChar, req.body.email);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    const updateQuery = `
      UPDATE lycees
      SET ${fields.join(', ')}, updated_at = GETDATE()
      WHERE id = @id;
      
      SELECT id, name, address, city, postal_code, phone, email, created_at, updated_at
      FROM lycees WHERE id = @id;
    `;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Lycée non trouvé' });
    }

    const lycee = result.recordset[0];

    res.json({
      id: lycee.id,
      name: lycee.name,
      address: lycee.address,
      city: lycee.city,
      postalCode: lycee.postal_code,
      phone: lycee.phone,
      email: lycee.email,
      createdAt: lycee.created_at,
      updatedAt: lycee.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du lycée :', error);

    if (error.number === 2627) { // Contrainte d'unicité (email)
      return res.status(400).json({ message: 'Email déjà utilisé par un autre lycée.' });
    }

    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Delete lycee
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {

  const lyceeId = parseInt(req.params.id);

  if (isNaN(lyceeId)) {
    return res.status(400).json({ message: 'ID de lycée invalide' });
  }

  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, lyceeId)
      .query('DELETE FROM lycees WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Lycée non trouvé' });
    }

    res.status(204).send(); // Suppression réussie, pas de contenu retourné

  } catch (error) {
    console.error('Erreur lors de la suppression du lycée:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

module.exports = router;