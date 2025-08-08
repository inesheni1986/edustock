const express = require('express');
const { getPool, sql } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateAudit, validateId } = require('../middleware/validation');

const router = express.Router();

// Récupérer tous les audits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, audit_type, laboratory_id } = req.query;

    let query = `
      SELECT 
        a.*,
        l.name as laboratory_name,
        u.first_name + ' ' + u.last_name as audited_by_name,
        COUNT(af.id) as findings_count
      FROM audits a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN users u ON a.audited_by = u.id
      LEFT JOIN audit_findings af ON a.id = af.audit_id
      WHERE 1=1
    `;

    const request = getPool().request();

    if (status) {
      query += ` AND a.status = @status`;
      request.input('status', sql.NVarChar, status);
    }

    if (audit_type) {
      query += ` AND a.audit_type = @audit_type`;
      request.input('audit_type', sql.NVarChar, audit_type);
    }

    if (laboratory_id) {
      query += ` AND a.laboratory_id = @laboratory_id`;
      request.input('laboratory_id', sql.Int, laboratory_id);
    }

    // Filtrer selon les permissions utilisateur
    if (req.user.role === 'professor') {
      query += ` AND a.laboratory_id IN (
        SELECT laboratory_id FROM user_laboratories WHERE user_id = @user_id
      )`;
      request.input('user_id', sql.Int, req.user.id);
    }

    query += ` GROUP BY a.id, a.laboratory_id, a.audit_type, a.status, a.scheduled_date, a.completed_date, a.audited_by, a.notes, a.created_at, a.updated_at, l.name, u.first_name, u.last_name ORDER BY a.created_at DESC`;

    const result = await request.query(query);

    const audits = result.recordset.map(audit => ({
      id: audit.id,
      laboratoryId: audit.laboratory_id,
      laboratoryName: audit.laboratory_name,
      auditType: audit.audit_type,
      status: audit.status,
      scheduledDate: audit.scheduled_date,
      completedDate: audit.completed_date,
      auditedBy: audit.audited_by,
      auditedByName: audit.audited_by_name,
      findingsCount: parseInt(audit.findings_count) || 0,
      findings: [],
      notes: audit.notes,
      createdAt: audit.created_at,
      updatedAt: audit.updated_at
    }));

    res.json(audits);
  } catch (error) {
    console.error('Erreur lors de la récupération des audits:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Récupérer un audit par ID avec ses résultats
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'audit
    const auditResult = await getPool().request()
      .input('id', sql.Int, id)
      .query(`
      SELECT 
        a.*,
        l.name as laboratory_name,
        u.first_name + ' ' + u.last_name as audited_by_name
      FROM audits a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN users u ON a.audited_by = u.id
      WHERE a.id = @id
    `);

    if (auditResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Audit non trouvé' });
    }

    // Récupérer les résultats de l'audit
    const findingsResult = await getPool().request()
      .input('id', sql.Int, id)
      .query(`
      SELECT 
        af.*,
        a.name as article_name,
        a.reference as article_reference
      FROM audit_findings af
      LEFT JOIN articles a ON af.article_id = a.id
      WHERE af.audit_id = @id
      ORDER BY af.created_at
    `);

    const audit = auditResult.recordset[0];
    const findings = findingsResult.recordset.map(finding => ({
      id: finding.id,
      articleId: finding.article_id,
      articleName: finding.article_name,
      articleReference: finding.article_reference,
      expectedQuantity: finding.expected_quantity,
      actualQuantity: finding.actual_quantity,
      discrepancy: finding.discrepancy,
      reason: finding.reason,
      action: finding.action,
      createdAt: finding.created_at
    }));

    res.json({
      id: audit.id,
      laboratoryId: audit.laboratory_id,
      laboratoryName: audit.laboratory_name,
      auditType: audit.audit_type,
      status: audit.status,
      scheduledDate: audit.scheduled_date,
      completedDate: audit.completed_date,
      auditedBy: audit.audited_by,
      auditedByName: audit.audited_by_name,
      findings,
      notes: audit.notes,
      createdAt: audit.created_at,
      updatedAt: audit.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audit:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Créer un nouvel audit (admin seulement)
router.post('/', validateAudit, authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { laboratoryId, auditType, scheduledDate, auditedBy, notes } = req.body;

    const result = await getPool().request()
      .input('laboratory_id', sql.Int, laboratoryId)
      .input('audit_type', sql.NVarChar, auditType)
      .input('scheduled_date', sql.Date, scheduledDate)
      .input('audited_by', sql.Int, auditedBy)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
      INSERT INTO audits (laboratory_id, audit_type, scheduled_date, audited_by, notes)
      OUTPUT INSERTED.*
      VALUES (@laboratory_id, @audit_type, @scheduled_date, @audited_by, @notes)
    `);

    const audit = result.recordset[0];
    res.status(201).json({
      id: audit.id,
      laboratoryId: audit.laboratory_id,
      auditType: audit.audit_type,
      status: audit.status,
      scheduledDate: audit.scheduled_date,
      auditedBy: audit.audited_by,
      findings: [],
      notes: audit.notes,
      createdAt: audit.created_at,
      updatedAt: audit.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'audit:', error);

    if (error.number === 547) { // Violation de clé étrangère
      return res.status(400).json({ error: 'Laboratoire ou auditeur invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Mettre à jour un audit
router.put('/:id', authenticateToken, validateId, validateAudit, async (req, res) => {
  try {
    const { id } = req.params;
    const { laboratory_id, audit_type, scheduled_date, audited_by, notes } = req.body;

    // Vérifier les permissions
    if (req.user.role !== 'admin') {
      const auditResult = await getPool().request()
        .input('id', sql.Int, id)
        .query('SELECT audited_by FROM audits WHERE id = @id');
      if (auditResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Audit non trouvé' });
      }
      if (auditResult.recordset[0].audited_by !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const result = await getPool().request()
      .input('laboratory_id', sql.Int, laboratory_id)
      .input('audit_type', sql.NVarChar, audit_type)
      .input('scheduled_date', sql.Date, scheduled_date)
      .input('audited_by', sql.Int, audited_by)
      .input('notes', sql.NVarChar, notes || null)
      .input('id', sql.Int, id)
      .query(`
      UPDATE audits 
      SET laboratory_id = @laboratory_id, audit_type = @audit_type, scheduled_date = @scheduled_date, 
          audited_by = @audited_by, notes = @notes, updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Audit non trouvé' });
    }

    const audit = result.recordset[0];
    res.json({
      id: audit.id,
      laboratoryId: audit.laboratory_id,
      auditType: audit.audit_type,
      status: audit.status,
      scheduledDate: audit.scheduled_date,
      completedDate: audit.completed_date,
      auditedBy: audit.audited_by,
      notes: audit.notes,
      createdAt: audit.created_at,
      updatedAt: audit.updated_at
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'audit:', error);

    if (error.number === 547) {
      return res.status(400).json({ error: 'Laboratoire ou auditeur invalide' });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Changer le statut d'un audit
router.patch('/:id/status', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['planned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin') {
      const auditResult = await getPool().request()
        .input('id', sql.Int, id)
        .query('SELECT audited_by FROM audits WHERE id = @id');
      if (auditResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Audit non trouvé' });
      }
      if (auditResult.recordset[0].audited_by !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    let query = 'UPDATE audits SET status = @status, updated_at = GETDATE()';
    const request = await getPool().request()
      .input('status', sql.NVarChar, status)
      .input('id', sql.Int, id);

    if (status === 'completed') {
      query += ', completed_date = CAST(GETDATE() AS DATE)';
    }

    query += ' WHERE id = ' + id;

    const result = await request.query(query);

    /*if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Audit non trouvé' });
    }*/
    const auditResult = await getPool().request().query('SELECT id, status, completed_date, updated_at FROM audits where id = ' + id);

    const audit = auditResult.recordset[0];
    res.json({
      id: audit.id,
      status: audit.status,
      completedDate: audit.completed_date,
      updatedAt: audit.updated_at
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Ajouter des résultats à un audit
router.post('/:id/findings', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { findings } = req.body;

    if (!Array.isArray(findings) || findings.length === 0) {
      return res.status(400).json({ error: 'Les résultats sont requis' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin') {
      const auditResult = await getPool().request()
        .input('id', sql.Int, id)
        .query('SELECT audited_by FROM audits WHERE id = @id');
      if (auditResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Audit non trouvé' });
      }
      if (auditResult.recordset[0].audited_by !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const pool = getPool();

    try {
      await pool.request().query('BEGIN TRANSACTION');

      // Supprimer les anciens résultats
      await pool.request()
        .input('audit_id', sql.Int, id)
        .query('DELETE FROM audit_findings WHERE audit_id = @audit_id');

      // Ajouter les nouveaux résultats
      const insertedFindings = [];
      for (const finding of findings) {
        const result = await pool.request()
          .input('audit_id', sql.Int, id)
          .input('article_id', sql.Int, finding.article_id)
          .input('expected_quantity', sql.Int, finding.expected_quantity)
          .input('actual_quantity', sql.Int, finding.actual_quantity)
          .input('discrepancy', sql.Int, finding.discrepancy)
          .input('reason', sql.NVarChar, finding.reason || null)
          .input('action', sql.NVarChar, finding.action || null)
          .query(`
          INSERT INTO audit_findings (
            audit_id, article_id, expected_quantity, actual_quantity, 
            discrepancy, reason, action
          )
          OUTPUT INSERTED.*
          VALUES (@audit_id, @article_id, @expected_quantity, @actual_quantity, @discrepancy, @reason, @action)
        `);

        insertedFindings.push(result.recordset[0]);
      }

      await pool.request().query('COMMIT TRANSACTION');

      res.json({
        message: 'Résultats d\'audit ajoutés avec succès',
        findings: insertedFindings.map(finding => ({
          id: finding.id,
          articleId: finding.article_id,
          expectedQuantity: finding.expected_quantity,
          actualQuantity: finding.actual_quantity,
          discrepancy: finding.discrepancy,
          reason: finding.reason,
          action: finding.action,
          createdAt: finding.created_at
        }))
      });

    } catch (error) {
      await pool.request().query('ROLLBACK TRANSACTION');
      throw error;
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout des résultats:', error);

    if (error.number === 547) {
      return res.status(400).json({ error: 'Article invalide dans les résultats' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Supprimer un audit (admin seulement)
router.delete('/:id', requireRole(['admin']), validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM audits WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit non trouvé' });
    }

    res.json({ message: 'Audit supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'audit:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;