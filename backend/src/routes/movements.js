const express = require('express');
const { getPool, sql } = require('../database/connection');
const { requireRole, authenticateToken} = require('../middleware/auth');
const { validateMovement, validateId } = require('../middleware/validation');

const router = express.Router();

// Récupérer tous les mouvements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { laboratory_id, article_id, type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        sm.*,
        a.name as article_name,
        a.reference as article_reference,
        l.name as laboratory_name,
        u.first_name + ' ' + u.last_name as user_name,
        s.name as supplier_name
      FROM stock_movements sm
      LEFT JOIN articles a ON sm.article_id = a.id
      LEFT JOIN laboratories l ON sm.laboratory_id = l.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE 1=1
    `;

    const request = getPool().request();

    if (laboratory_id) {
      query += ` AND sm.laboratory_id = @laboratory_id`;
      request.input('laboratory_id', sql.Int, laboratory_id);
    }

    if (article_id) {
      query += ` AND sm.article_id = @article_id`;
      request.input('article_id', sql.Int, article_id);
    }

    if (type) {
      query += ` AND sm.type = @type`;
      request.input('type', sql.NVarChar, type);
    }

    if (start_date) {
      query += ` AND sm.created_at >= @start_date`;
      request.input('start_date', sql.DateTime2, start_date);
    }

    if (end_date) {
      query += ` AND sm.created_at <= @end_date`;
      request.input('end_date', sql.DateTime2, end_date);
    }

    // Filtrer selon les permissions utilisateur
    if (req.user.role === 'professor') {
      query += ` AND sm.laboratory_id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @user_id
      )`;
      request.input('user_id', sql.Int, req.user.id);
    }

    query += ` ORDER BY sm.created_at DESC`;

    const result = await request.query(query);

    const movements = result.recordset.map(movement => ({
      id: movement.id,
      articleId: movement.article_id,
      articleName: movement.article_name,
      articleReference: movement.article_reference,
      laboratoryId: movement.laboratory_id,
      laboratoryName: movement.laboratory_name,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      userId: movement.user_id,
      userName: movement.user_name,
      supplierId: movement.supplier_id,
      supplierName: movement.supplier_name,
      notes: movement.notes,
      createdAt: movement.created_at
    }));

    res.json(movements);
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer un mouvement par ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getPool().request()
      .input('id', sql.Int, id)
      .query(`
      SELECT 
        sm.*,
        a.name as article_name,
        a.reference as article_reference,
        l.name as laboratory_name,
        u.first_name + ' ' + u.last_name as user_name,
        s.name as supplier_name
      FROM stock_movements sm
      LEFT JOIN articles a ON sm.article_id = a.id
      LEFT JOIN laboratories l ON sm.laboratory_id = l.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE sm.id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Mouvement non trouvé' });
    }

    const movement = result.recordset[0];
    res.json({
      id: movement.id,
      articleId: movement.article_id,
      articleName: movement.article_name,
      articleReference: movement.article_reference,
      laboratoryId: movement.laboratory_id,
      laboratoryName: movement.laboratory_name,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      userId: movement.user_id,
      userName: movement.user_name,
      supplierId: movement.supplier_id,
      supplierName: movement.supplier_name,
      notes: movement.notes,
      createdAt: movement.created_at
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du mouvement:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un nouveau mouvement
router.post('/', authenticateToken, validateMovement, async (req, res) => {
  const pool = getPool();
  //const transaction = new sql.Transaction(pool);
  try {
    //await transaction.begin();
    //const request = new sql.Request(transaction);

    const {
      articleId, laboratoryId, notes, quantity, reason, reference, type, userId
    } = req.body;

    // Vérifier les permissions pour les professeurs
    if (req.user.role === 'professor') {
      const labAccessResult = await pool.request()
        .input('userId', sql.Int, userId)//req.user.id)
        .input('laboratoryId', sql.Int, laboratoryId)
        .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @laboratoryId');

      if (labAccessResult.recordset.length === 0) {
       // await request.query('ROLLBACK TRANSACTION');
        return res.status(403).json({ error: 'Accès non autorisé à ce laboratoire' });
      }
    }

    // Vérifier que l'article existe et récupérer son stock actuel
    const articleResult = await pool.request()
      .input('article_id', sql.Int, articleId)
      .query('SELECT current_stock FROM articles WHERE id = @article_id AND is_active = 1');

    if (articleResult.recordset.length === 0) {
      //await request.query('ROLLBACK TRANSACTION');
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const currentStock = articleResult.recordset[0].current_stock;

    // Vérifier qu'il y a assez de stock pour une sortie
    if (type === 'out' && currentStock < quantity) {
     // await request.query('ROLLBACK TRANSACTION');
      return res.status(400).json({
        error: 'Stock insuffisant',
        currentStock,
        requestedQuantity: quantity
      });
    }

    // Créer le mouvement
    const movementResult = await pool.request()
      .input('article_id', sql.Int, articleId)
      .input('laboratory_id', sql.Int, laboratoryId)
      .input('type', sql.NVarChar, type)
      .input('quantity', sql.Int, quantity)
      .input('reason', sql.NVarChar, reason)
      .input('reference', sql.NVarChar, reference || null)
      .input('user_id', sql.Int, req.user.id)
      //.input('supplier_id', sql.Int, supplier_id || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
      INSERT INTO stock_movements (
        article_id, laboratory_id, type, quantity, reason, 
        reference, user_id, notes
      )
      OUTPUT INSERTED.*
      VALUES (@article_id, @laboratory_id, @type, @quantity, @reason,
              @reference, @user_id, @notes)
    `);

    // Mettre à jour le stock de l'article
    const newStock = type === 'in' ? currentStock + quantity : currentStock - quantity;
    await pool.request()
      .input('newStock', sql.Int, newStock)
      .input('article_id', sql.Int, articleId)
      .query('UPDATE articles SET current_stock = @newStock WHERE id = @article_id');

   // await request.query('COMMIT TRANSACTION');

    const movement = movementResult.recordset[0];
    res.status(201).json({
      id: movement.id,
      articleId: movement.article_id,
      laboratoryId: movement.laboratory_id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      userId: movement.user_id,
      supplierId: movement.supplier_id,
      notes: movement.notes,
      createdAt: movement.created_at
    });

  } catch (error) {
   // await request.query('ROLLBACK TRANSACTION');
    console.error('Erreur lors de la création du mouvement:', error);

    if (error.number === 547) { // Violation de clé étrangère
      return res.status(400).json({ error: 'Article, laboratoire ou fournisseur invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un mouvement (admin seulement)
router.delete('/:id', requireRole(['admin']), validateId, async (req, res) => {
  const pool = getPool();

  try {
    await pool.request().query('BEGIN TRANSACTION');

    const { id } = req.params;

    // Récupérer les détails du mouvement
    const movementResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM stock_movements WHERE id = @id');

    if (movementResult.recordset.length === 0) {
      await pool.request().query('ROLLBACK TRANSACTION');
      return res.status(404).json({ error: 'Mouvement non trouvé' });
    }

    const movement = movementResult.recordset[0];

    // Récupérer le stock actuel de l'article
    const articleResult = await pool.request()
      .input('article_id', sql.Int, movement.article_id)
      .query('SELECT current_stock FROM articles WHERE id = @article_id');

    if (articleResult.recordset.length === 0) {
      await pool.request().query('ROLLBACK TRANSACTION');
      return res.status(404).json({ error: 'Article associé non trouvé' });
    }

    const currentStock = articleResult.recordset[0].current_stock;

    // Calculer le nouveau stock (inverse du mouvement)
    const newStock = movement.type === 'in'
      ? currentStock - movement.quantity
      : currentStock + movement.quantity;

    if (newStock < 0) {
      await pool.request().query('ROLLBACK TRANSACTION');
      return res.status(400).json({
        error: 'Impossible de supprimer ce mouvement car cela rendrait le stock négatif',
        currentStock,
        movementQuantity: movement.quantity
      });
    }

    // Supprimer le mouvement
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM stock_movements WHERE id = @id');

    // Mettre à jour le stock
    await pool.request()
      .input('newStock', sql.Int, newStock)
      .input('article_id', sql.Int, movement.article_id)
      .query('UPDATE articles SET current_stock = @newStock WHERE id = @article_id');

    await pool.request().query('COMMIT TRANSACTION');

    res.json({ message: 'Mouvement supprimé avec succès' });

  } catch (error) {
    await pool.request().query('ROLLBACK TRANSACTION');
    console.error('Erreur lors de la suppression du mouvement:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;