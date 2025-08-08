const express = require('express');
const pool = require('../database/connection');

const router = express.Router();

// Rapport d'inventaire
router.get('/inventory', async (req, res) => {
  try {
    const { laboratory_id, supplier_id, category, low_stock_only } = req.query;
    
    let query = `
      SELECT 
        a.*,
        l.name as laboratory_name,
        s.name as supplier_name,
        (a.current_stock * a.unit_price) as stock_value,
        CASE 
          WHEN a.current_stock <= a.min_stock THEN 'low'
          WHEN a.current_stock >= a.max_stock THEN 'high'
          ELSE 'normal'
        END as stock_status
      FROM articles a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      WHERE a.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;

    if (laboratory_id) {
      query += ` AND a.laboratory_id = $${paramCount}`;
      params.push(laboratory_id);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND a.supplier_id = $${paramCount}`;
      params.push(supplier_id);
      paramCount++;
    }

    if (category) {
      query += ` AND a.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (low_stock_only === 'true') {
      query += ` AND a.current_stock <= a.min_stock`;
    }

    query += ` ORDER BY a.name`;

    const result = await pool.query(query, params);

    const inventory = result.rows.map(item => ({
      id: item.id,
      name: item.name,
      reference: item.reference,
      category: item.category,
      unit: item.unit,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      maxStock: item.max_stock,
      unitPrice: parseFloat(item.unit_price),
      stockValue: parseFloat(item.stock_value),
      stockStatus: item.stock_status,
      laboratoryName: item.laboratory_name,
      supplierName: item.supplier_name,
      updatedAt: item.updated_at
    }));

    // Calculer les statistiques
    const totalValue = inventory.reduce((sum, item) => sum + item.stockValue, 0);
    const lowStockCount = inventory.filter(item => item.stockStatus === 'low').length;
    const totalItems = inventory.length;

    res.json({
      inventory,
      statistics: {
        totalItems,
        totalValue,
        lowStockCount,
        averageValue: totalItems > 0 ? totalValue / totalItems : 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport d\'inventaire:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Rapport des mouvements
router.get('/movements', async (req, res) => {
  try {
    const { start_date, end_date, laboratory_id, type, article_id } = req.query;
    
    let query = `
      SELECT 
        sm.*,
        a.name as article_name,
        a.reference as article_reference,
        l.name as laboratory_name,
        u.first_name || ' ' || u.last_name as user_name,
        s.name as supplier_name
      FROM stock_movements sm
      LEFT JOIN articles a ON sm.article_id = a.id
      LEFT JOIN laboratories l ON sm.laboratory_id = l.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND sm.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sm.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (laboratory_id) {
      query += ` AND sm.laboratory_id = $${paramCount}`;
      params.push(laboratory_id);
      paramCount++;
    }

    if (type) {
      query += ` AND sm.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (article_id) {
      query += ` AND sm.article_id = $${paramCount}`;
      params.push(article_id);
      paramCount++;
    }

    query += ` ORDER BY sm.created_at DESC`;

    const result = await pool.query(query, params);

    const movements = result.rows.map(movement => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      notes: movement.notes,
      articleName: movement.article_name,
      articleReference: movement.article_reference,
      laboratoryName: movement.laboratory_name,
      userName: movement.user_name,
      supplierName: movement.supplier_name,
      createdAt: movement.created_at
    }));

    // Calculer les statistiques
    const totalIn = movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0);
    const netMovement = totalIn - totalOut;

    res.json({
      movements,
      statistics: {
        totalMovements: movements.length,
        totalIn,
        totalOut,
        netMovement
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport des mouvements:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Rapport des demandes de réapprovisionnement
router.get('/supply-requests', async (req, res) => {
  try {
    const { start_date, end_date, status, urgency, laboratory_id } = req.query;
    
    let query = `
      SELECT 
        sr.*,
        a.name as article_name,
        a.reference as article_reference,
        l.name as laboratory_name,
        u1.first_name || ' ' || u1.last_name as requested_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name,
        s.name as supplier_name
      FROM supply_requests sr
      LEFT JOIN articles a ON sr.article_id = a.id
      LEFT JOIN laboratories l ON sr.laboratory_id = l.id
      LEFT JOIN users u1 ON sr.requested_by = u1.id
      LEFT JOIN users u2 ON sr.approved_by = u2.id
      LEFT JOIN suppliers s ON sr.supplier_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND sr.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sr.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

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

    query += ` ORDER BY sr.created_at DESC`;

    const result = await pool.query(query, params);

    const requests = result.rows.map(request => ({
      id: request.id,
      requestedQuantity: request.requested_quantity,
      urgency: request.urgency,
      reason: request.reason,
      status: request.status,
      orderReference: request.order_reference,
      notes: request.notes,
      articleName: request.article_name,
      articleReference: request.article_reference,
      laboratoryName: request.laboratory_name,
      requestedByName: request.requested_by_name,
      approvedByName: request.approved_by_name,
      supplierName: request.supplier_name,
      createdAt: request.created_at,
      updatedAt: request.updated_at
    }));

    // Calculer les statistiques
    const statusCounts = {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      ordered: requests.filter(r => r.status === 'ordered').length,
      delivered: requests.filter(r => r.status === 'delivered').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length
    };

    const urgencyCounts = {
      low: requests.filter(r => r.urgency === 'low').length,
      medium: requests.filter(r => r.urgency === 'medium').length,
      high: requests.filter(r => r.urgency === 'high').length
    };

    res.json({
      requests,
      statistics: {
        totalRequests: requests.length,
        statusCounts,
        urgencyCounts
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport des demandes:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Rapport des audits
router.get('/audits', async (req, res) => {
  try {
    const { start_date, end_date, status, audit_type, laboratory_id } = req.query;
    
    let query = `
      SELECT 
        a.*,
        l.name as laboratory_name,
        u.first_name || ' ' || u.last_name as audited_by_name,
        COUNT(af.id) as findings_count,
        COALESCE(SUM(ABS(af.discrepancy)), 0) as total_discrepancy
      FROM audits a
      LEFT JOIN laboratories l ON a.laboratory_id = l.id
      LEFT JOIN users u ON a.audited_by = u.id
      LEFT JOIN audit_findings af ON a.id = af.audit_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND a.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND a.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (audit_type) {
      query += ` AND a.audit_type = $${paramCount}`;
      params.push(audit_type);
      paramCount++;
    }

    if (laboratory_id) {
      query += ` AND a.laboratory_id = $${paramCount}`;
      params.push(laboratory_id);
      paramCount++;
    }

    query += ` GROUP BY a.id, l.name, u.first_name, u.last_name ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);

    const audits = result.rows.map(audit => ({
      id: audit.id,
      auditType: audit.audit_type,
      status: audit.status,
      scheduledDate: audit.scheduled_date,
      completedDate: audit.completed_date,
      laboratoryName: audit.laboratory_name,
      auditedByName: audit.audited_by_name,
      findingsCount: parseInt(audit.findings_count),
      totalDiscrepancy: parseInt(audit.total_discrepancy),
      notes: audit.notes,
      createdAt: audit.created_at,
      updatedAt: audit.updated_at
    }));

    // Calculer les statistiques
    const statusCounts = {
      planned: audits.filter(a => a.status === 'planned').length,
      in_progress: audits.filter(a => a.status === 'in_progress').length,
      completed: audits.filter(a => a.status === 'completed').length,
      cancelled: audits.filter(a => a.status === 'cancelled').length
    };

    const typeCounts = {
      inventory: audits.filter(a => a.auditType === 'inventory').length,
      quality: audits.filter(a => a.auditType === 'quality').length,
      compliance: audits.filter(a => a.auditType === 'compliance').length
    };

    const totalFindings = audits.reduce((sum, a) => sum + a.findingsCount, 0);
    const totalDiscrepancy = audits.reduce((sum, a) => sum + a.totalDiscrepancy, 0);

    res.json({
      audits,
      statistics: {
        totalAudits: audits.length,
        statusCounts,
        typeCounts,
        totalFindings,
        totalDiscrepancy
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du rapport des audits:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;