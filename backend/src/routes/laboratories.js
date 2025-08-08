const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { getPool, sql } = require('../database/connection');
const {validateLaboratory, validateId} = require("../middleware/validation");
const router = express.Router();

// Get all laboratories
router.get('/', authenticateToken, async (req, res) => {
   try {
    const { lycee_id } = req.query;

    let query = `
      SELECT 
        l.*,
        ly.name as lycee_name,
        u.first_name + ' ' + u.last_name as responsible_name,
        COUNT(DISTINCT a.id) as article_count,
        COUNT(DISTINCT ul.user_id) as user_count
      FROM laboratories l
      LEFT JOIN lycees ly ON l.lycee_id = ly.id
      LEFT JOIN users u ON l.responsible_user_id = u.id
      LEFT JOIN articles a ON l.id = a.laboratory_id AND a.is_active = 1
      LEFT JOIN user_laboratories ul ON l.id = ul.laboratory_id
      WHERE 1=1
    `;

    const request = await getPool().request();

    if (lycee_id) {
      query += ` AND l.lycee_id = @lycee_id`;
      request.input('lycee_id', sql.Int, lycee_id);
    }

    // Filtrer selon les permissions utilisateur
    if (req.user.role === 'professor') {
      query += ` AND l.id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @user_id
      )`;
      request.input('user_id', sql.Int, req.user.id);
    }

    query += ` GROUP BY l.id, l.name, l.lycee_id, l.description, l.responsible_user_id, l.created_at, l.updated_at, ly.name, u.first_name, u.last_name ORDER BY l.name`;

    const result = await request.query(query);

    const laboratories = result.recordset.map(lab => ({
      id: lab.id,
      name: lab.name,
      lyceeId: lab.lycee_id,
      lyceeName: lab.lycee_name,
      description: lab.description,
      responsibleUserId: lab.responsible_user_id,
      responsibleName: lab.responsible_name,
      articleCount: parseInt(lab.article_count) || 0,
      userCount: parseInt(lab.user_count) || 0,
      createdAt: lab.created_at,
      updatedAt: lab.updated_at
    }));

    res.json(laboratories);
  } catch (error) {
    console.error('Erreur lors de la récupération des laboratoires:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Get laboratory by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          l.*,
          ly.name as lycee_name,
          u.first_name + ' ' + u.last_name as responsible_name,
          COUNT(DISTINCT a.id) as article_count,
          COUNT(DISTINCT ul.user_id) as user_count,
          COALESCE(SUM(a.current_stock * a.unit_price), 0) as total_stock_value
        FROM laboratories l
        LEFT JOIN lycees ly ON l.lycee_id = ly.id
        LEFT JOIN users u ON l.responsible_user_id = u.id
        LEFT JOIN articles a ON l.id = a.laboratory_id AND a.is_active = 1
        LEFT JOIN user_laboratories ul ON l.id = ul.laboratory_id
        WHERE l.id = @id
        GROUP BY l.id, l.name, l.lycee_id, l.description, l.responsible_user_id, l.created_at, l.updated_at, ly.name, u.first_name, u.last_name
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Laboratoire non trouvé' });
    }

    const lab = result.recordset[0];

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const accessResult = await getPool().request()
        .input('userId', sql.Int, req.user.id)
        .input('labId', sql.Int, id)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @labId');

      if (accessResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé à ce laboratoire' });
      }
    }

    // Récupérer les utilisateurs assignés
    const usersResult = await getPool().request()
      .input('labId', sql.Int, id)
      .query(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.role
        FROM users u
        INNER JOIN user_laboratories ul ON u.id = ul.user_id
        WHERE ul.laboratory_id = @labId AND u.is_active = 1
        ORDER BY u.last_name, u.first_name
      `);

    res.json({
      id: lab.id,
      name: lab.name,
      lyceeId: lab.lycee_id,
      lyceeName: lab.lycee_name,
      description: lab.description,
      responsibleUserId: lab.responsible_user_id,
      responsibleName: lab.responsible_name,
      articleCount: parseInt(lab.article_count) || 0,
      userCount: parseInt(lab.user_count) || 0,
      totalStockValue: parseFloat(lab.total_stock_value) || 0,
      assignedUsers: usersResult.recordset.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      })),
      createdAt: lab.created_at,
      updatedAt: lab.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du laboratoire:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Create laboratory
router.post('/', authenticateToken, authorizeRoles('admin'), validateLaboratory, async (req, res) => {
 try {
    const { name, lycee_id, description, responsible_user_id } = req.body;

    const result = await getPool().request()
      .input('name', sql.NVarChar, name)
      .input('lycee_id', sql.Int, lycee_id)
      .input('description', sql.NVarChar, description || null)
      .input('responsible_user_id', sql.Int, responsible_user_id || null)
      .query(`
        INSERT INTO laboratories (name, lycee_id, description, responsible_user_id)
        OUTPUT INSERTED.*
        VALUES (@name, @lycee_id, @description, @responsible_user_id)
      `);

    const laboratory = result.recordset[0];
    res.status(201).json({
      id: laboratory.id,
      name: laboratory.name,
      lyceeId: laboratory.lycee_id,
      description: laboratory.description,
      responsibleUserId: laboratory.responsible_user_id,
      articleCount: 0,
      userCount: 0,
      createdAt: laboratory.created_at,
      updatedAt: laboratory.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création du laboratoire:', error);

    if (error.number === 547) { // Violation de clé étrangère
      return res.status(400).json({ error: 'Lycée ou utilisateur responsable invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Update laboratory
router.put('/:id', authenticateToken, authorizeRoles('admin'), validateId, validateLaboratory, async (req, res) => {
  try {
    const { id } = req.params;
   // const { name, lycee_id, description, responsible_user_id } = req.body;

     if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de laboratoire invalide' });
      }

    const pool = await getPool();
    const request = pool.request();

    const fields = [];

     request.input('id', sql.Int, id);

    if (req.body.name !== undefined) {
      fields.push('name = @name');
      request.input('name', sql.NVarChar, req.body.name);
    }

    if (req.body.lycee_id !== undefined) {
      fields.push('lycee_id = @lycee_id');
      request.input('lycee_id', sql.Int, req.body.lycee_id);
    }

    if (req.body.description !== undefined) {
      fields.push('description = @description');
      request.input('description', sql.NVarChar, req.body.description);
    }

    if (req.body.responsible_user_id !== undefined) {
      fields.push('responsible_user_id = @responsible_user_id');
      request.input('responsible_user_id', sql.Int, req.body.responsible_user_id);
    }

     if (fields.length === 0) {
      return res.status(400).json({ message: 'Aucun champ à mettre à jour' });
    }

     const updateQuery = `
      UPDATE laboratories
      SET ${fields.join(', ')}, updated_at = GETDATE()
      WHERE id = @id;
      
      SELECT id, name, lycee_id, description, responsible_user_id
      FROM laboratories WHERE id = @id;
    `

        const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Laboratoire non trouvé' });
    }

    const laboratory = result.recordset[0];
    res.json({
      id: laboratory.id,
      name: laboratory.name,
      lyceeId: laboratory.lycee_id,
      description: laboratory.description,
      responsibleUserId: laboratory.responsible_user_id,
      createdAt: laboratory.created_at,
      updatedAt: laboratory.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du laboratoire:', error);

    if (error.number === 547) {
      return res.status(400).json({ error: 'Lycée ou utilisateur responsable invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Delete laboratory
router.delete('/:id', authenticateToken, authorizeRoles('admin'),validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des articles associés
    const articleResult = await getPool().request()
      .input('id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM articles WHERE laboratory_id = @id AND is_active = 1');

    const articleCount = articleResult.recordset[0].count;

    if (articleCount > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer ce laboratoire car il contient ${articleCount} article(s)`,
        articleCount: articleCount
      });
    }

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .query('DELETE FROM laboratories WHERE id = @id; SELECT @@ROWCOUNT as affected');

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Laboratoire non trouvé' });
    }

    res.json({ message: 'Laboratoire supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression du laboratoire:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer les articles d'un laboratoire
router.get('/:id/articles', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, low_stock } = req.query;

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const accessResult = await getPool().request()
        .input('userId', sql.Int, req.user.id)
        .input('labId', sql.Int, id)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @labId');

      if (accessResult.recordset.length === 0) {
        return res.status(403).json({ error: 'Accès non autorisé à ce laboratoire' });
      }
    }

    let query = `
      SELECT 
        a.*,
        s.name as supplier_name
      FROM articles a
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      WHERE a.laboratory_id = @id AND a.is_active = 1
    `;

    const request = getPool().request().input('id', sql.Int, id);

    if (category) {
      query += ` AND a.category = @category`;
      request.input('category', sql.NVarChar, category);
    }

    if (low_stock === 'true') {
      query += ` AND a.current_stock <= a.min_stock`;
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

// Assigner des utilisateurs à un laboratoire (admin seulement)
router.post('/:id/users', authenticateToken, requireRole(['admin']), validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids)) {
      return res.status(400).json({ error: 'user_ids doit être un tableau' });
    }

    const pool = getPool();

    try {
      await pool.request().query('BEGIN TRANSACTION');

      // Supprimer les anciennes assignations
      await pool.request()
        .input('labId', sql.Int, id)
        .query('DELETE FROM user_laboratories WHERE laboratory_id = @labId');

      // Ajouter les nouvelles assignations
      for (const userId of user_ids) {
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('labId', sql.Int, id)
          .query('INSERT INTO user_laboratories (user_id, laboratory_id) VALUES (@userId, @labId)');
      }

      await pool.request().query('COMMIT TRANSACTION');

      res.json({ message: 'Utilisateurs assignés avec succès' });

    } catch (error) {
      await pool.request().query('ROLLBACK TRANSACTION');
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de l\'assignation des utilisateurs:', error);

    if (error.number === 547) {
      return res.status(400).json({ error: 'Utilisateur ou laboratoire invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;