const express = require('express');
const pool = require('../database/connection');
const { requireRole, authenticateToken, authorizeRoles} = require('../middleware/auth');
const { validateSupplier, validateId } = require('../middleware/validation');
const {getPool, sql} = require("../database/connection");

const router = express.Router();

// Récupérer tous les fournisseurs
router.get('/', async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT 
        s.id, s.name, s.email,s.phone, s.address,s.city,s.siret,s.website,s.contact_name,s.postal_code,
        COUNT(a.id) as article_count,
        COALESCE(SUM(a.current_stock * a.unit_price), 0) as total_stock_value
      FROM suppliers s
      LEFT JOIN articles a ON s.id = a.supplier_id AND a.is_active = 1
      WHERE s.is_active = 1
      GROUP BY s.id, s.name, s.email,s.phone, s.address,s.city,s.siret,s.website,s.contact_name,s.postal_code
      ORDER BY s.name
    `);

    const suppliers = result.recordset.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postalCode: supplier.postalCode,
      siret: supplier.siret,
      website: supplier.website,
     // notes: supplier.notes,
    //  isActive: supplier.is_active,
     // articleCount: parseInt(supplier.article_count),
     // totalStockValue: parseFloat(supplier.total_stock_value),
    //  createdAt: supplier.created_at,
     // updatedAt: supplier.updated_at
    }));

    res.json(suppliers);
  } catch (error) {
    console.error('Erreur lors de la récupération des fournisseurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer un fournisseur par ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getPool().query(`
      SELECT 
        s.*,
        COUNT(a.id) as article_count,
        COALESCE(SUM(a.current_stock * a.unit_price), 0) as total_stock_value
      FROM suppliers s
      LEFT JOIN articles a ON s.id = a.supplier_id AND a.is_active = true
      WHERE s.id = $1 AND s.is_active = true
      GROUP BY s.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    const supplier = result.rows[0];
    res.json({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postalCode: supplier.postalCode,
      siret: supplier.siret,
      website: supplier.website,
      notes: supplier.notes,
      articleCount: parseInt(supplier.article_count),
      totalStockValue: parseFloat(supplier.total_stock_value),
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du fournisseur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un nouveau fournisseur
router.post('/', authenticateToken, authorizeRoles('admin'), validateSupplier, async (req, res) => {
  try {
    const { name, contactName, email, phone, address, city, postalCode, siret, website, notes } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('contact_name', sql.NVarChar, contactName)
      .input('email', sql.NVarChar, email)
      .input('postal_code', sql.NVarChar, postalCode)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('siret', sql.NVarChar, siret)
      .input('website', sql.NVarChar, website)
      .input('notes', sql.NVarChar, notes)
      .query(`
        INSERT INTO suppliers (name, contact_name, email, phone, address, city, postal_code, siret, website, notes, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@name, @contact_name, @postal_code, @phone, @email, @address, @city, @siret, @website, @notes, GETDATE(), GETDATE())
      `);


    const supplier = result.recordset[0];
    res.status(201).json({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postalCode: supplier.postalCode,
      siret: supplier.siret,
      website: supplier.website,
      notes: supplier.notes,
      articleCount: 0,
      totalStockValue: 0,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création du fournisseur:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour un fournisseur
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const supplierId = parseInt(req.params.id);
  if (isNaN(supplierId)) {
    return res.status(400).json({ message: 'ID de fournisseur invalide' });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.Int, supplierId);

    const fields = [];
    if (req.body.name !== undefined) {
      fields.push('name = @name');
      request.input('name', sql.NVarChar, req.body.name);
    }
    if (req.body.contactName !== undefined) {
      fields.push('contact_name = @contact_name');
      request.input('contact_name', sql.NVarChar, req.body.contactName);
    }
    if (req.body.email !== undefined) {
      fields.push('email = @email');
      request.input('email', sql.NVarChar, req.body.email);
    }
    if (req.body.phone !== undefined) {
      fields.push('phone = @phone');
      request.input('phone', sql.NVarChar, req.body.phone);
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
    if (req.body.siret !== undefined) {
      fields.push('siret = @siret');
      request.input('siret', sql.NVarChar, req.body.siret || null);
    }
    if (req.body.website !== undefined) {
      fields.push('website = @website');
      request.input('website', sql.NVarChar, req.body.website || null);
    }
    if (req.body.notes !== undefined) {
      fields.push('notes = @notes');
      request.input('notes', sql.NVarChar, req.body.notes || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

    const updateQuery = `
      UPDATE suppliers
      SET ${fields.join(', ')}, updated_at = GETDATE()
      WHERE id = @id AND is_active = 1;

      SELECT id, name, contact_name AS contactName, email, phone, address, city, postal_code AS postalCode,
             siret, website, notes, created_at AS createdAt, updated_at AS updatedAt
      FROM suppliers
      WHERE id = @id;
    `;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    const supplier = result.recordset[0];

    res.json({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postalCode: supplier.postalCode,
      siret: supplier.siret,
      website: supplier.website,
      notes: supplier.notes,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du fournisseur :', error);

    if (error.number === 2627) { // Violation d'unicité (email)
      return res.status(400).json({ message: 'Email déjà utilisé par un autre fournisseur.' });
    }

    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Supprimer un fournisseur (désactivation)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID du fournisseur invalide' });
  }
  try {
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE suppliers SET is_active = 0 WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    res.json({ message: 'Fournisseur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression du fournisseur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer les articles d'un fournisseur
router.get('/:id/articles', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getPool().query(`
      SELECT 
        a.*,
        l.name as laboratory_name
      FROM articles a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      WHERE a.supplier_id = $1 AND a.is_active = true
      ORDER BY a.name
    `, [id]);

    const articles = result.rows.map(article => ({
      id: article.id,
      name: article.name,
      reference: article.reference,
      description: article.description,
      category: article.category,
      unit: article.unit,
      minStock: article.min_stock,
      maxStock: article.max_stock,
      currentStock: article.current_stock,
      unitPrice: parseFloat(article.unit_price),
      supplierId: article.supplier_id,
      laboratoryId: article.laboratory_id,
      laboratoryName: article.laboratory_name,
      isActive: article.is_active,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    }));

    res.json(articles);

  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;