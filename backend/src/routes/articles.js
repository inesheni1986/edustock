const express = require('express');
const { getPool, sql } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateArticle, validateId } = require('../middleware/validation');

const router = express.Router();

// Récupérer tous les articles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { laboratory_id, category, low_stock } = req.query;
    
    let query = `
      SELECT 
        a.*,
        l.name as laboratory_name,
        s.name as supplier_name
      FROM articles a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      WHERE a.is_active = 1
    `;
    
    const request = getPool().request();
    let paramCount = 1;

    if (laboratory_id) {
      query += ` AND a.laboratory_id = @laboratory_id`;
      request.input('laboratory_id', sql.Int, laboratory_id);
    }

    if (category) {
      query += ` AND a.category = @category`;
      request.input('category', sql.NVarChar, category);
    }

    if (low_stock === 'true') {
      query += ` AND a.current_stock <= a.min_stock`;
    }

    // Filtrer selon les permissions utilisateur
    if (req.user.role === 'professor') {
      query += ` AND a.laboratory_id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @user_id
      )`;
      request.input('user_id', sql.Int, req.user.id);
    }

    query += ` ORDER BY a.name`;

    const result = await request.query(query);

    const articles = result.recordset.map(article => ({
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
      supplierName: article.supplier_name,
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

// Récupérer un article par ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          a.*,
          l.name as laboratory_name,
          s.name as supplier_name
        FROM articles a
        LEFT JOIN laboratories l ON a.laboratory_id = l.id
        LEFT JOIN suppliers s ON a.supplier_id = s.id
        WHERE a.id = @id AND a.is_active = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const article = result.recordset[0];
    res.json({
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
      supplierName: article.supplier_name,
      laboratoryId: article.laboratory_id,
      laboratoryName: article.laboratory_name,
      isActive: article.is_active,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un nouvel article
router.post('/', authenticateToken, validateArticle, async (req, res) => {
  try {
    const { 
      name, reference, description, category, unit, 
      min_stock, max_stock, current_stock, unit_price, 
      supplier_id, laboratory_id 
    } = req.body;

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const labAccessResult = await getPool().request()
        .input('userId', sql.Int, req.user.id)
        .input('laboratoryId', sql.Int, laboratory_id)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @laboratoryId');
      
      if (labAccessResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé à ce laboratoire' });
      }
    }

    const result = await getPool().request()
      .input('name', sql.NVarChar, name)
      .input('reference', sql.NVarChar, reference)
      .input('description', sql.NVarChar, description || null)
      .input('category', sql.NVarChar, category)
      .input('unit', sql.NVarChar, unit)
      .input('min_stock', sql.Int, min_stock)
      .input('max_stock', sql.Int, max_stock)
      .input('current_stock', sql.Int, current_stock)
      .input('unit_price', sql.Decimal(10, 2), unit_price)
      .input('supplier_id', sql.Int, supplier_id || null)
      .input('laboratory_id', sql.Int, laboratory_id)
      .query(`
        INSERT INTO articles (
          name, reference, description, category, unit, 
          min_stock, max_stock, current_stock, unit_price, 
          supplier_id, laboratory_id
        )
        OUTPUT INSERTED.*
        VALUES (@name, @reference, @description, @category, @unit,
                @min_stock, @max_stock, @current_stock, @unit_price,
                @supplier_id, @laboratory_id)
      `);

    const article = result.recordset[0];
    res.status(201).json({
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
      isActive: article.is_active,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    
    if (error.number === 2627) { // Violation de contrainte unique
      return res.status(409).json({ error: 'Cette référence existe déjà' });
    }
    
    if (error.number === 547) { // Violation de clé étrangère
      return res.status(400).json({ error: 'Laboratoire ou fournisseur invalide' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour un article
router.put('/:id', authenticateToken, validateId, validateArticle, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, reference, description, category, unit, 
      min_stock, max_stock, current_stock, unit_price, 
      supplier_id, laboratory_id 
    } = req.body;

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const labAccessResult = await getPool().request()
        .input('userId', sql.Int, req.user.id)
        .input('laboratoryId', sql.Int, laboratory_id)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @laboratoryId');
      
      if (labAccessResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé à ce laboratoire' });
      }
    }

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('reference', sql.NVarChar, reference)
      .input('description', sql.NVarChar, description || null)
      .input('category', sql.NVarChar, category)
      .input('unit', sql.NVarChar, unit)
      .input('min_stock', sql.Int, min_stock)
      .input('max_stock', sql.Int, max_stock)
      .input('current_stock', sql.Int, current_stock)
      .input('unit_price', sql.Decimal(10, 2), unit_price)
      .input('supplier_id', sql.Int, supplier_id || null)
      .input('laboratory_id', sql.Int, laboratory_id)
      .execute('sp_update_article');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const article = result.recordset[0];
    res.json({
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
      isActive: article.is_active,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    
    if (error.number === 2627) {
      return res.status(409).json({ error: 'Cette référence existe déjà' });
    }
    
    if (error.number === 547) {
      return res.status(400).json({ error: 'Laboratoire ou fournisseur invalide' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un article (désactivation)
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const articleResult = await getPool().request()
        .input('id', sql.Int, id)
        .query('SELECT laboratory_id FROM articles WHERE id = @id');
      
      if (articleResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Article non trouvé' });
      }

      const labAccessResult = await getPool().request()
        .input('userId', sql.Int, req.user.id)
        .input('laboratoryId', sql.Int, articleResult.recordset[0].laboratory_id)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @laboratoryId');
      
      if (labAccessResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .execute('sp_deactivate_article');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    res.json({ message: 'Article supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer les articles en stock faible
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        a.*,
        l.name as laboratory_name,
        s.name as supplier_name
      FROM articles a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      WHERE a.is_active = 1 AND a.current_stock <= a.min_stock
    `;

    const request = getPool().request();

    // Filtrer selon les permissions utilisateur
    if (req.user.role === 'professor') {
      query += ` AND a.laboratory_id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @user_id
      )`;
      request.input('user_id', sql.Int, req.user.id);
    }

    query += ` ORDER BY (CAST(a.current_stock AS FLOAT) / NULLIF(a.min_stock, 0)) ASC`;

    const result = await request.query(query);

    const articles = result.recordset.map(article => ({
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
      supplierName: article.supplier_name,
      laboratoryId: article.laboratory_id,
      laboratoryName: article.laboratory_name,
      isActive: article.is_active,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    }));

    res.json(articles);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles en stock faible:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;