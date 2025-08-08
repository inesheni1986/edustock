const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erreurs de validation',
      details: errors.array()
    });
  }
  next();
};

// Validations pour les utilisateurs
const validateUser = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('role').isIn(['admin', 'professor', 'auditor']).withMessage('Rôle invalide'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('password').optional().isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('last_name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('role').optional().isIn(['admin', 'professor', 'auditor']).withMessage('Rôle invalide'),
  handleValidationErrors
];

// Validations pour les lycées
const validateLycee = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('address').notEmpty().withMessage('L\'adresse est requise'),
  body('city').notEmpty().withMessage('La ville est requise'),
  body('postalCode').notEmpty().withMessage('Le code postal est requis'),
  body('phone').notEmpty().withMessage('Le téléphone est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  handleValidationErrors
];

// Validations pour les laboratoires
const validateLaboratory = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('lycee_id').isInt({ min: 1 }).withMessage('ID lycée invalide'),
  handleValidationErrors
];

// Validations pour les fournisseurs
const validateSupplier = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('contactName').notEmpty().withMessage('Le nom du contact est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('phone').notEmpty().withMessage('Le téléphone est requis'),
  body('address').notEmpty().withMessage('L\'adresse est requise'),
  body('city').notEmpty().withMessage('La ville est requise'),
  body('postalCode').notEmpty().withMessage('Le code postal est requis'),
  handleValidationErrors
];

// Validations pour les articles
const validateArticle = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('reference').notEmpty().withMessage('La référence est requise'),
  body('category').notEmpty().withMessage('La catégorie est requise'),
  body('unit').notEmpty().withMessage('L\'unité est requise'),
  body('min_stock').isInt({ min: 0 }).withMessage('Stock minimum invalide')
    .custom((value, { req }) => {
      if (req.body.max_stock && value > req.body.max_stock) {
        throw new Error('Le stock minimum ne peut pas être supérieur au stock maximum');
      }
      return true;
    }),
  body('max_stock').isInt({ min: 0 }).withMessage('Stock maximum invalide')
    .custom((value, { req }) => {
      if (req.body.min_stock && value < req.body.min_stock) {
        throw new Error('Le stock maximum ne peut pas être inférieur au stock minimum');
      }
      return true;
    }),
  body('current_stock').isInt({ min: 0 }).withMessage('Stock actuel invalide'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Prix unitaire invalide'),
  body('laboratory_id').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('supplier_id').optional().isInt({ min: 1 }).withMessage('ID fournisseur invalide'),
  handleValidationErrors
];

// Validations pour les mouvements
const validateMovement = [
  body('articleId').isInt({ min: 1 }).withMessage('ID article invalide'),
  body('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('type').isIn(['in', 'out']).withMessage('Type de mouvement invalide'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('reason').notEmpty().withMessage('La raison est requise'),
  handleValidationErrors
];

// Validations pour les demandes de réapprovisionnement
const validateSupplyRequest = [
  body('articleId').isInt({ min: 1 }).withMessage('ID article invalide'),
  body('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('requestedQuantity').isInt({ min: 1 }).withMessage('Quantité demandée invalide'),
  body('urgency').isIn(['low', 'medium', 'high']).withMessage('Urgence invalide'),
  body('reason').notEmpty().withMessage('La raison est requise'),
  handleValidationErrors
];

// Validations pour les audits
const validateAudit = [
  body('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('auditType').isIn(['inventory', 'quality', 'compliance']).withMessage('Type d\'audit invalide'),
  body('scheduledDate').isISO8601().withMessage('Date invalide'),
  body('auditedBy').isInt({ min: 1 }).withMessage('ID auditeur invalide'),
  handleValidationErrors
];

// Validations pour les paramètres
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateUserUpdate,
  validateLycee,
  validateLaboratory,
  validateSupplier,
  validateArticle,
  validateMovement,
  validateSupplyRequest,
  validateAudit,
  validateId,
  handleValidationErrors
};