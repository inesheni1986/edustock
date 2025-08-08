const express = require('express');
const {getPool, sql} = require('../database/connection');
const {requireRole, authenticateToken} = require('../middleware/auth');
const {validateSupplyRequest, validateId} = require('../middleware/validation');

const router = express.Router();

// Récupérer toutes les demandes de réapprovisionnement
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {status, urgency, laboratory_id, requested_by} = req.query;

        let query = `
            SELECT sr.*,
                   a.name                                   as article_name,
                   a.reference                              as article_reference,
                   a.current_stock,
                   a.min_stock,
                   l.name                                   as laboratory_name,
                   CONCAT(u1.first_name, ' ', u1.last_name) as requested_by_name,
                   CONCAT(u2.first_name, ' ', u2.last_name) as approved_by_name,
                   s.name                                   as supplier_name
            FROM supply_requests sr
                     LEFT JOIN articles a ON sr.article_id = a.id
                     LEFT JOIN laboratories l ON sr.laboratory_id = l.id
                     LEFT JOIN users u1 ON sr.requested_by = u1.id
                     LEFT JOIN users u2 ON sr.approved_by = u2.id
                     LEFT JOIN suppliers s ON sr.supplier_id = s.id
            WHERE 1 = 1
        `;

        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` AND sr.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (urgency) {
            query += ` AND sr.urgency = $${paramCount}`;
            params.push(urgency);
            paramCount++;
        }

        if (laboratory_id) {
            query += ` AND sr.laboratory_id = $${paramCount}`;
            params.push(laboratory_id);
            paramCount++;
        }

        if (requested_by) {
            query += ` AND sr.requested_by = $${paramCount}`;
            params.push(requested_by);
            paramCount++;
        }

        // Filtrer selon les permissions utilisateur
        if (req.user.role === 'professor') {
            query += ` AND (sr.requested_by = $${paramCount} OR sr.laboratory_id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = $${paramCount}
      ))`;
            params.push(req.user.id);
            paramCount++;
        }

        query += ` ORDER BY sr.created_at DESC`;

        const result = await getPool().request().query(query);

        const requests = result.recordset.map(request => ({
            id: request.id,
            articleId: request.article_id,
            articleName: request.article_name,
            articleReference: request.article_reference,
            currentStock: request.current_stock,
            minStock: request.min_stock,
            laboratoryId: request.laboratory_id,
            laboratoryName: request.laboratory_name,
            requestedQuantity: request.requested_quantity,
            urgency: request.urgency,
            reason: request.reason,
            status: request.status,
            requestedBy: request.requested_by,
            requestedByName: request.requested_by_name,
            approvedBy: request.approved_by,
            approvedByName: request.approved_by_name,
            supplierId: request.supplier_id,
            supplierName: request.supplier_name,
            orderReference: request.order_reference,
            notes: request.notes,
            createdAt: request.created_at,
            updatedAt: request.updated_at
        }));

        res.json(requests);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});

// Récupérer une demande par ID
router.get('/:id', validateId, async (req, res) => {
    try {
        const {id} = req.params;

        const result = await pool.query(`
            SELECT sr.*,
                   a.name                               as article_name,
                   a.reference                          as article_reference,
                   a.current_stock,
                   a.min_stock,
                   l.name                               as laboratory_name,
                   u1.first_name || ' ' || u1.last_name as requested_by_name,
                   u2.first_name || ' ' || u2.last_name as approved_by_name,
                   s.name                               as supplier_name
            FROM supply_requests sr
                     LEFT JOIN articles a ON sr.article_id = a.id
                     LEFT JOIN laboratories l ON sr.laboratory_id = l.id
                     LEFT JOIN users u1 ON sr.requested_by = u1.id
                     LEFT JOIN users u2 ON sr.approved_by = u2.id
                     LEFT JOIN suppliers s ON sr.supplier_id = s.id
            WHERE sr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({error: 'Demande non trouvée'});
        }

        const request = result.rows[0];

        // Vérifier les permissions
        if (req.user.role === 'professor' && request.requested_by !== req.user.id) {
            // Vérifier si l'utilisateur a accès au laboratoire
            const labAccessResult = await pool.query(
                'SELECT 1 FROM user_laboratories WHERE user_id = $1 AND laboratory_id = $2',
                [req.user.id, request.laboratory_id]
            );

            if (labAccessResult.rows.length === 0) {
                return res.status(403).json({error: 'Accès non autorisé à cette demande'});
            }
        }

        res.json({
            id: request.id,
            articleId: request.articleId,
            articleName: request.article_name,
            articleReference: request.article_reference,
            currentStock: request.current_stock,
            minStock: request.min_stock,
            laboratoryId: request.laboratory_id,
            laboratoryName: request.laboratory_name,
            requestedQuantity: request.requestedQuantity,
            urgency: request.urgency,
            reason: request.reason,
            status: request.status,
            requestedBy: request.requested_by,
            requestedByName: request.requested_by_name,
            approvedBy: request.approved_by,
            approvedByName: request.approved_by_name,
            supplierId: request.supplier_id,
            supplierName: request.supplier_name,
            orderReference: request.order_reference,
            notes: request.notes,
            createdAt: request.created_at,
            updatedAt: request.updated_at
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la demande:', error);
        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});

// Créer une nouvelle demande
router.post('/', authenticateToken, validateSupplyRequest, async (req, res) => {
    try {
        const {
            articleId, laboratoryId, requestedQuantity, urgency,
            reason, supplierId, notes
        } = req.body;

        // Vérifier que l'utilisateur a accès au laboratoire
        if (req.user.role === 'professor') {
            const labAccessResult = await getPool().request()
                .input('userId', sql.Int, req.user.id)
                .input('laboratoryId', sql.Int, laboratory_id)
                .query('SELECT 1 FROM user_laboratories WHERE user_id = @userId AND laboratory_id = @laboratoryId');

            if (labAccessResult.recordset.length === 0) {
                return res.status(403).json({error: 'Accès non autorisé à ce laboratoire'});
            }
        }

        const result = await getPool().request()
            .input('article_id', sql.Int, articleId)
            .input('laboratory_id', sql.Int, laboratoryId)
            .input('requested_quantity', sql.Int, requestedQuantity)
            .input('urgency', sql.NVarChar, urgency)
            .input('reason', sql.NVarChar, reason)
            .input('requested_by', sql.Int, req.user.id)
            .input('supplier_id', sql.Int, supplierId || null)
            .input('notes', sql.NVarChar, notes || null)
            .query(`
                INSERT INTO supply_requests (article_id, laboratory_id, requested_quantity, urgency,
                                             reason, requested_by, supplier_id, notes)
                    OUTPUT INSERTED.*
                VALUES (@article_id, @laboratory_id, @requested_quantity, @urgency, @reason, @requested_by, @supplier_id, @notes)
            `);

        const request = result.recordset[0];
        res.status(201).json({
            id: request.id,
            articleId: request.articleId,
            laboratoryId: request.laboratoryId,
            requestedQuantity: request.requestedQuantity,
            urgency: request.urgency,
            reason: request.reason,
            status: request.status,
            requestedBy: request.requested_by,
            supplierId: request.supplier_id,
            notes: request.notes,
            createdAt: request.created_at,
            updatedAt: request.updated_at
        });

    } catch (error) {
        console.error('Erreur lors de la création de la demande:', error);

        if (error.number === 547) { // Violation de clé étrangère
            return res.status(400).json({error: 'Article, laboratoire ou fournisseur invalide'});
        }

        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});


// Mettre à jour une demande
router.put('/:id', validateId, validateSupplyRequest, async (req, res) => {
    try {
        const {id} = req.params;
        const {
            article_id, laboratory_id, requested_quantity, urgency,
            reason, supplier_id, notes
        } = req.body;

        // Vérifier que la demande existe et les permissions
        const existingResult = await pool.query(
            'SELECT requested_by, status FROM supply_requests WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({error: 'Demande non trouvée'});
        }

        const existing = existingResult.rows[0];

        // Seul le demandeur peut modifier sa demande (et seulement si elle est en attente)
        if (req.user.role !== 'admin' && existing.requested_by !== req.user.id) {
            return res.status(403).json({error: 'Accès non autorisé'});
        }

        if (existing.status !== 'pending') {
            return res.status(400).json({error: 'Impossible de modifier une demande qui n\'est plus en attente'});
        }

        const result = await pool.query(`
            UPDATE supply_requests
            SET article_id         = $1,
                laboratory_id      = $2,
                requested_quantity = $3,
                urgency            = $4,
                reason             = $5,
                supplier_id        = $6,
                notes              = $7
            WHERE id = $8 RETURNING *
        `, [
            article_id, laboratory_id, requested_quantity, urgency,
            reason, supplier_id || null, notes || null, id
        ]);

        const request = result.rows[0];
        res.json({
            id: request.id,
            articleId: request.article_id,
            laboratoryId: request.laboratory_id,
            requestedQuantity: request.requested_quantity,
            urgency: request.urgency,
            reason: request.reason,
            status: request.status,
            requestedBy: request.requested_by,
            supplierId: request.supplier_id,
            notes: request.notes,
            createdAt: request.created_at,
            updatedAt: request.updated_at
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande:', error);

        if (error.code === '23503') {
            return res.status(400).json({error: 'Article, laboratoire ou fournisseur invalide'});
        }

        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});

// Changer le statut d'une demande (admin seulement)
router.patch('/:id/status', authenticateToken, requireRole(['admin']), validateId, async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        const {id} = req.params;
        const {status, order_reference} = req.body;

        if (!['pending', 'approved', 'ordered', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({error: 'Statut invalide'});
        }

        await transaction.begin();
        const request = new sql.Request(transaction);

        request
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status);

        let query = 'UPDATE supply_requests SET status = @status';

        if (status === 'approved') {
            query += ', approved_by = @approved_by';
            request.input('approved_by', sql.Int, req.user.id);
        }

        if (order_reference) {
            query += ', order_reference = @order_reference';
            request.input('order_reference', sql.NVarChar, order_reference);
        }

        query += ' WHERE id = @id';

        const result = await request.query(query);

        /* if (result.recordset.length === 0) {
           return res.status(404).json({ error: 'Demande non trouvée' });
         }*/

        const selectResult = await request.query(`
            SELECT id,
                   status,
                   approved_by,
                   order_reference,
                   updated_at,
                   article_id,
                   laboratory_id,
                   supplier_id,
                   requested_quantity
            FROM supply_requests
            WHERE id = @id
        `)
        const updatedRequest = selectResult.recordset[0];

        if (status === 'delivered') {
            const movementRequest = new sql.Request(transaction);
            // Créer le mouvement
            const movementResult = await movementRequest
                .input('article_id', sql.Int, updatedRequest.article_id)
                .input('laboratory_id', sql.Int, updatedRequest.laboratory_id)
                .input('type', sql.NVarChar, 'in')
                .input('quantity', sql.Int, updatedRequest.requested_quantity)
                .input('reason', sql.NVarChar, 'Réapprovisionnement')
                // .input('reference', sql.NVarChar, reference || null)
                .input('user_id', sql.Int, req.user.id)
                .input('supplier_id', sql.Int, updatedRequest.supplier_id || null)
                .input('notes', sql.NVarChar, `Réapprovisionnement de la demande #${updatedRequest.id}`)
                .query(`
                    INSERT INTO stock_movements (article_id, laboratory_id, type, quantity, reason,
                                                 user_id, supplier_id,  notes)
                        OUTPUT INSERTED.*
                    VALUES (@article_id, @laboratory_id, @type, @quantity, @reason, @user_id, @supplier_id, @notes)
                `);

            const selArticleRequest = new sql.Request(transaction);
            const articleResult = await selArticleRequest
                .input('id', sql.Int, updatedRequest.article_id)
                .query('SELECT current_stock FROM articles WHERE id = @id');

            // Mettre à jour le stock de l'article
            const newStock = articleResult.recordset[0].current_stock + updatedRequest.requested_quantity;
            const updArticleRequest = new sql.Request(transaction);
            await updArticleRequest
                .input('newStock', sql.Int, newStock)
                .input('article_id', sql.Int, updatedRequest.article_id)
                .query('UPDATE articles SET current_stock = @newStock WHERE id = @article_id');
        }

        await transaction.commit();

        res.json({
            id: updatedRequest.id,
            status: updatedRequest.status,
            approvedBy: updatedRequest.approved_by,
            orderReference: updatedRequest.order_reference,
            updatedAt: updatedRequest.updated_at
        });

    } catch (error) {
         await transaction.rollback();
        console.error('Erreur lors du changement de statut:', error);
        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});

// Supprimer une demande
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
    try {
        const {id} = req.params;

        // Vérifier que la demande existe et les permissions
        const existingResult = await getPool().request()
            .input('id', sql.Int, id)
            .query('SELECT requested_by, status FROM supply_requests WHERE id = @id');

        if (existingResult.recordset.length === 0) {
            return res.status(404).json({error: 'Demande non trouvée'});
        }

        const existing = existingResult.recordset[0];

        // Seul l'admin ou le demandeur peut supprimer (et seulement si en attente)
        if (req.user.role !== 'admin' && existing.requested_by !== req.user.id) {
            return res.status(403).json({error: 'Accès non autorisé'});
        }

        if (existing.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({error: 'Impossible de supprimer une demande qui n\'est plus en attente'});
        }

        await getPool().request()
            .input('id', sql.Int, id)
            .query('DELETE FROM supply_requests WHERE id = @id');

        res.json({message: 'Demande supprimée avec succès'});

    } catch (error) {
        console.error('Erreur lors de la suppression de la demande:', error);
        res.status(500).json({error: 'Erreur interne du serveur'});
    }
});


module.exports = router;