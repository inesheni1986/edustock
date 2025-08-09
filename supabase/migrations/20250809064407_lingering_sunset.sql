-- =====================================================
-- Schéma de base de données pour GestiLab
-- Système de gestion des stocks pour laboratoires
-- Base de données: SQL Server
-- =====================================================

-- Vérification et création de la base de données
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'lab_stock_management')
BEGIN
    CREATE DATABASE lab_stock_management;
    PRINT 'Base de données lab_stock_management créée';
END
ELSE
BEGIN
    PRINT 'Base de données lab_stock_management existe déjà';
END
GO

USE lab_stock_management;
GO

-- Suppression des tables existantes (dans l'ordre inverse des dépendances)
IF OBJECT_ID('audit_findings', 'U') IS NOT NULL 
BEGIN
    DROP TABLE audit_findings;
    PRINT 'Table audit_findings supprimée';
END
GO

IF OBJECT_ID('audits', 'U') IS NOT NULL 
BEGIN
    DROP TABLE audits;
    PRINT 'Table audits supprimée';
END
GO

IF OBJECT_ID('supply_requests', 'U') IS NOT NULL 
BEGIN
    DROP TABLE supply_requests;
    PRINT 'Table supply_requests supprimée';
END
GO

IF OBJECT_ID('stock_movements', 'U') IS NOT NULL 
BEGIN
    DROP TABLE stock_movements;
    PRINT 'Table stock_movements supprimée';
END
GO

IF OBJECT_ID('articles', 'U') IS NOT NULL 
BEGIN
    DROP TABLE articles;
    PRINT 'Table articles supprimée';
END
GO

IF OBJECT_ID('suppliers', 'U') IS NOT NULL 
BEGIN
    DROP TABLE suppliers;
    PRINT 'Table suppliers supprimée';
END
GO

IF OBJECT_ID('user_laboratories', 'U') IS NOT NULL 
BEGIN
    DROP TABLE user_laboratories;
    PRINT 'Table user_laboratories supprimée';
END
GO

IF OBJECT_ID('users', 'U') IS NOT NULL 
BEGIN
    DROP TABLE users;
    PRINT 'Table users supprimée';
END
GO

IF OBJECT_ID('laboratories', 'U') IS NOT NULL 
BEGIN
    DROP TABLE laboratories;
    PRINT 'Table laboratories supprimée';
END
GO

IF OBJECT_ID('lycees', 'U') IS NOT NULL 
BEGIN
    DROP TABLE lycees;
    PRINT 'Table lycees supprimée';
END
GO

-- =====================================================
-- Table des lycées/établissements
-- =====================================================
CREATE TABLE lycees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(10) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_lycees_email UNIQUE (email),
    CONSTRAINT CK_lycees_postal_code CHECK (LEN(postal_code) = 5 AND postal_code NOT LIKE '%[^0-9]%')
);
GO

PRINT 'Table lycees créée';
GO

-- =====================================================
-- Table des laboratoires
-- =====================================================
CREATE TABLE laboratories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    lycee_id INT NOT NULL,
    description NVARCHAR(MAX),
    responsible_user_id INT,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Clés étrangères
    CONSTRAINT FK_laboratories_lycee FOREIGN KEY (lycee_id) REFERENCES lycees(id) ON DELETE CASCADE
);
GO

PRINT 'Table laboratories créée';
GO

-- =====================================================
-- Table des utilisateurs
-- =====================================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) NOT NULL,
    lycee_id INT,
    is_active BIT DEFAULT 1,
    last_login DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CK_users_role CHECK (role IN ('admin', 'professor', 'auditor')),
    CONSTRAINT CK_users_email_format CHECK (email LIKE '%@%.%'),
    
    -- Clés étrangères
    CONSTRAINT FK_users_lycee FOREIGN KEY (lycee_id) REFERENCES lycees(id) ON DELETE SET NULL
);
GO

PRINT 'Table users créée';
GO

-- Mise à jour de la contrainte pour responsible_user_id
ALTER TABLE laboratories 
ADD CONSTRAINT FK_laboratories_responsible_user 
FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL;
GO

PRINT 'Contrainte FK_laboratories_responsible_user ajoutée';
GO

-- =====================================================
-- Table de liaison utilisateurs-laboratoires
-- =====================================================
CREATE TABLE user_laboratories (
    user_id INT NOT NULL,
    laboratory_id INT NOT NULL,
    assigned_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Clé primaire composite
    CONSTRAINT PK_user_laboratories PRIMARY KEY (user_id, laboratory_id),
    
    -- Clés étrangères
    CONSTRAINT FK_user_laboratories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_user_laboratories_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
);
GO

PRINT 'Table user_laboratories créée';
GO

-- =====================================================
-- Table des fournisseurs
-- =====================================================
CREATE TABLE suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    contact_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(10) NOT NULL,
    siret NVARCHAR(14),
    website NVARCHAR(255),
    notes NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_suppliers_email UNIQUE (email),
    CONSTRAINT UQ_suppliers_siret UNIQUE (siret),
    CONSTRAINT CK_suppliers_email_format CHECK (email LIKE '%@%.%'),
    CONSTRAINT CK_suppliers_postal_code CHECK (LEN(postal_code) = 5 AND postal_code NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_suppliers_siret_format CHECK (siret IS NULL OR (LEN(siret) = 14 AND siret NOT LIKE '%[^0-9]%'))
);
GO

PRINT 'Table suppliers créée';
GO

-- =====================================================
-- Table des articles
-- =====================================================
CREATE TABLE articles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    reference NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100) NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    min_stock INT NOT NULL DEFAULT 0,
    max_stock INT NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id INT,
    laboratory_id INT NOT NULL,
    location NVARCHAR(255), -- Emplacement physique dans le laboratoire
    barcode NVARCHAR(100), -- Code-barres pour scan
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_articles_reference UNIQUE (reference),
    CONSTRAINT UQ_articles_barcode UNIQUE (barcode),
    CONSTRAINT CK_articles_min_stock CHECK (min_stock >= 0),
    CONSTRAINT CK_articles_max_stock CHECK (max_stock >= min_stock),
    CONSTRAINT CK_articles_current_stock CHECK (current_stock >= 0),
    CONSTRAINT CK_articles_unit_price CHECK (unit_price >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_articles_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT FK_articles_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
);
GO

PRINT 'Table articles créée';
GO

-- =====================================================
-- Table des mouvements de stock
-- =====================================================
CREATE TABLE stock_movements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    article_id INT NOT NULL,
    laboratory_id INT NOT NULL,
    type NVARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    reference NVARCHAR(100), -- Référence bon de commande, facture, etc.
    user_id INT,
    supplier_id INT,
    notes NVARCHAR(MAX),
    previous_stock INT, -- Stock avant le mouvement
    new_stock INT, -- Stock après le mouvement
    unit_cost DECIMAL(10,2), -- Coût unitaire pour ce mouvement
    total_cost AS (quantity * unit_cost) PERSISTED, -- Coût total calculé
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_stock_movements_type CHECK (type IN ('in', 'out')),
    CONSTRAINT CK_stock_movements_quantity CHECK (quantity > 0),
    CONSTRAINT CK_stock_movements_previous_stock CHECK (previous_stock >= 0),
    CONSTRAINT CK_stock_movements_new_stock CHECK (new_stock >= 0),
    CONSTRAINT CK_stock_movements_unit_cost CHECK (unit_cost IS NULL OR unit_cost >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_stock_movements_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT FK_stock_movements_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_stock_movements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_stock_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
GO

PRINT 'Table stock_movements créée';
GO

-- =====================================================
-- Table des demandes de réapprovisionnement
-- =====================================================
CREATE TABLE supply_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    article_id INT NOT NULL,
    laboratory_id INT NOT NULL,
    requested_quantity INT NOT NULL,
    urgency NVARCHAR(10) NOT NULL,
    reason NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by INT,
    approved_by INT,
    approved_at DATETIME2,
    supplier_id INT,
    order_reference NVARCHAR(100),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    delivery_date DATE,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_supply_requests_urgency CHECK (urgency IN ('low', 'medium', 'high')),
    CONSTRAINT CK_supply_requests_status CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'cancelled')),
    CONSTRAINT CK_supply_requests_quantity CHECK (requested_quantity > 0),
    CONSTRAINT CK_supply_requests_estimated_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    CONSTRAINT CK_supply_requests_actual_cost CHECK (actual_cost IS NULL OR actual_cost >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_supply_requests_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT FK_supply_requests_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_supply_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_supply_requests_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_supply_requests_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
GO

PRINT 'Table supply_requests créée';
GO

-- =====================================================
-- Table des audits
-- =====================================================
CREATE TABLE audits (
    id INT IDENTITY(1,1) PRIMARY KEY,
    laboratory_id INT NOT NULL,
    audit_type NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'planned',
    scheduled_date DATE NOT NULL,
    started_at DATETIME2,
    completed_date DATE,
    audited_by INT,
    notes NVARCHAR(MAX),
    findings_summary NVARCHAR(MAX), -- Résumé des conclusions
    total_discrepancies INT DEFAULT 0, -- Nombre total d'écarts
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_audits_type CHECK (audit_type IN ('inventory', 'quality', 'compliance')),
    CONSTRAINT CK_audits_status CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT CK_audits_dates CHECK (completed_date IS NULL OR completed_date >= scheduled_date),
    CONSTRAINT CK_audits_total_discrepancies CHECK (total_discrepancies >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_audits_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_audits_audited_by FOREIGN KEY (audited_by) REFERENCES users(id) ON DELETE SET NULL
);
GO

PRINT 'Table audits créée';
GO

-- =====================================================
-- Table des résultats d'audit
-- =====================================================
CREATE TABLE audit_findings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    audit_id INT NOT NULL,
    article_id INT NOT NULL,
    expected_quantity INT NOT NULL,
    actual_quantity INT NOT NULL,
    discrepancy AS (actual_quantity - expected_quantity) PERSISTED,
    discrepancy_percentage AS (
        CASE 
            WHEN expected_quantity = 0 THEN 0
            ELSE CAST((actual_quantity - expected_quantity) AS FLOAT) / expected_quantity * 100
        END
    ) PERSISTED,
    reason NVARCHAR(MAX),
    action NVARCHAR(MAX),
    severity NVARCHAR(10) DEFAULT 'minor', -- minor, major, critical
    resolved BIT DEFAULT 0,
    resolved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_audit_findings_expected CHECK (expected_quantity >= 0),
    CONSTRAINT CK_audit_findings_actual CHECK (actual_quantity >= 0),
    CONSTRAINT CK_audit_findings_severity CHECK (severity IN ('minor', 'major', 'critical')),
    
    -- Clés étrangères
    CONSTRAINT FK_audit_findings_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT FK_audit_findings_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
GO

PRINT 'Table audit_findings créée';
GO

-- =====================================================
-- Table des catégories d'articles (référentiel)
-- =====================================================
CREATE TABLE article_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    parent_category_id INT,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_article_categories_name UNIQUE (name),
    CONSTRAINT FK_article_categories_parent FOREIGN KEY (parent_category_id) REFERENCES article_categories(id)
);
GO

PRINT 'Table article_categories créée';
GO

-- =====================================================
-- Table des unités de mesure (référentiel)
-- =====================================================
CREATE TABLE measurement_units (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    symbol NVARCHAR(10) NOT NULL,
    type NVARCHAR(20) NOT NULL, -- quantity, weight, volume, length, etc.
    conversion_factor DECIMAL(10,4) DEFAULT 1, -- Facteur de conversion vers l'unité de base
    base_unit_id INT,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_measurement_units_name UNIQUE (name),
    CONSTRAINT UQ_measurement_units_symbol UNIQUE (symbol),
    CONSTRAINT CK_measurement_units_type CHECK (type IN ('quantity', 'weight', 'volume', 'length', 'area', 'time')),
    CONSTRAINT CK_measurement_units_conversion_factor CHECK (conversion_factor > 0),
    CONSTRAINT FK_measurement_units_base FOREIGN KEY (base_unit_id) REFERENCES measurement_units(id)
);
GO

PRINT 'Table measurement_units créée';
GO

-- =====================================================
-- Table des alertes système
-- =====================================================
CREATE TABLE system_alerts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(20) NOT NULL,
    severity NVARCHAR(10) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    entity_type NVARCHAR(50), -- article, laboratory, user, etc.
    entity_id INT,
    is_read BIT DEFAULT 0,
    is_resolved BIT DEFAULT 0,
    resolved_by INT,
    resolved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2,
    
    -- Contraintes
    CONSTRAINT CK_system_alerts_type CHECK (type IN ('low_stock', 'expired_item', 'audit_required', 'system_maintenance', 'user_action')),
    CONSTRAINT CK_system_alerts_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Clés étrangères
    CONSTRAINT FK_system_alerts_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);
GO

PRINT 'Table system_alerts créée';
GO

-- =====================================================
-- Table des logs d'activité
-- =====================================================
CREATE TABLE activity_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id INT,
    old_values NVARCHAR(MAX), -- JSON des anciennes valeurs
    new_values NVARCHAR(MAX), -- JSON des nouvelles valeurs
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_activity_logs_action CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
        'STOCK_IN', 'STOCK_OUT', 'APPROVE_REQUEST', 'REJECT_REQUEST',
        'START_AUDIT', 'COMPLETE_AUDIT', 'EXPORT_DATA'
    )),
    CONSTRAINT CK_activity_logs_entity_type CHECK (entity_type IN (
        'user', 'lycee', 'laboratory', 'supplier', 'article', 
        'stock_movement', 'supply_request', 'audit'
    )),
    
    -- Clés étrangères
    CONSTRAINT FK_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
GO

PRINT 'Table activity_logs créée';
GO

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index sur les tables principales
CREATE NONCLUSTERED INDEX IX_laboratories_lycee ON laboratories(lycee_id);
CREATE NONCLUSTERED INDEX IX_laboratories_active ON laboratories(is_active);
CREATE NONCLUSTERED INDEX IX_users_lycee ON users(lycee_id);
CREATE NONCLUSTERED INDEX IX_users_role ON users(role);
CREATE NONCLUSTERED INDEX IX_users_active ON users(is_active);
CREATE NONCLUSTERED INDEX IX_users_email ON users(email);

-- Index sur les articles
CREATE NONCLUSTERED INDEX IX_articles_laboratory ON articles(laboratory_id);
CREATE NONCLUSTERED INDEX IX_articles_supplier ON articles(supplier_id);
CREATE NONCLUSTERED INDEX IX_articles_category ON articles(category);
CREATE NONCLUSTERED INDEX IX_articles_reference ON articles(reference);
CREATE NONCLUSTERED INDEX IX_articles_low_stock ON articles(current_stock, min_stock) WHERE is_active = 1;
CREATE NONCLUSTERED INDEX IX_articles_active ON articles(is_active);
CREATE NONCLUSTERED INDEX IX_articles_barcode ON articles(barcode) WHERE barcode IS NOT NULL;

-- Index sur les mouvements
CREATE NONCLUSTERED INDEX IX_stock_movements_article ON stock_movements(article_id);
CREATE NONCLUSTERED INDEX IX_stock_movements_laboratory ON stock_movements(laboratory_id);
CREATE NONCLUSTERED INDEX IX_stock_movements_date ON stock_movements(created_at DESC);
CREATE NONCLUSTERED INDEX IX_stock_movements_type ON stock_movements(type);
CREATE NONCLUSTERED INDEX IX_stock_movements_user ON stock_movements(user_id);
CREATE NONCLUSTERED INDEX IX_stock_movements_supplier ON stock_movements(supplier_id);

-- Index sur les demandes
CREATE NONCLUSTERED INDEX IX_supply_requests_article ON supply_requests(article_id);
CREATE NONCLUSTERED INDEX IX_supply_requests_laboratory ON supply_requests(laboratory_id);
CREATE NONCLUSTERED INDEX IX_supply_requests_status ON supply_requests(status);
CREATE NONCLUSTERED INDEX IX_supply_requests_urgency ON supply_requests(urgency);
CREATE NONCLUSTERED INDEX IX_supply_requests_requested_by ON supply_requests(requested_by);
CREATE NONCLUSTERED INDEX IX_supply_requests_date ON supply_requests(created_at DESC);
CREATE NONCLUSTERED INDEX IX_supply_requests_approved_by ON supply_requests(approved_by);

-- Index sur les audits
CREATE NONCLUSTERED INDEX IX_audits_laboratory ON audits(laboratory_id);
CREATE NONCLUSTERED INDEX IX_audits_status ON audits(status);
CREATE NONCLUSTERED INDEX IX_audits_type ON audits(audit_type);
CREATE NONCLUSTERED INDEX IX_audits_scheduled_date ON audits(scheduled_date);
CREATE NONCLUSTERED INDEX IX_audits_audited_by ON audits(audited_by);

-- Index sur les résultats d'audit
CREATE NONCLUSTERED INDEX IX_audit_findings_audit ON audit_findings(audit_id);
CREATE NONCLUSTERED INDEX IX_audit_findings_article ON audit_findings(article_id);
CREATE NONCLUSTERED INDEX IX_audit_findings_discrepancy ON audit_findings(discrepancy);
CREATE NONCLUSTERED INDEX IX_audit_findings_severity ON audit_findings(severity);
CREATE NONCLUSTERED INDEX IX_audit_findings_resolved ON audit_findings(resolved);

-- Index sur les fournisseurs
CREATE NONCLUSTERED INDEX IX_suppliers_active ON suppliers(is_active);
CREATE NONCLUSTERED INDEX IX_suppliers_city ON suppliers(city);
CREATE NONCLUSTERED INDEX IX_suppliers_email ON suppliers(email);

-- Index sur les alertes
CREATE NONCLUSTERED INDEX IX_system_alerts_type ON system_alerts(type);
CREATE NONCLUSTERED INDEX IX_system_alerts_severity ON system_alerts(severity);
CREATE NONCLUSTERED INDEX IX_system_alerts_read ON system_alerts(is_read);
CREATE NONCLUSTERED INDEX IX_system_alerts_resolved ON system_alerts(is_resolved);
CREATE NONCLUSTERED INDEX IX_system_alerts_created ON system_alerts(created_at DESC);
CREATE NONCLUSTERED INDEX IX_system_alerts_expires ON system_alerts(expires_at);

-- Index sur les logs
CREATE NONCLUSTERED INDEX IX_activity_logs_user ON activity_logs(user_id);
CREATE NONCLUSTERED INDEX IX_activity_logs_action ON activity_logs(action);
CREATE NONCLUSTERED INDEX IX_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE NONCLUSTERED INDEX IX_activity_logs_date ON activity_logs(created_at DESC);

PRINT 'Index créés';
GO

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les articles avec informations complètes
CREATE VIEW v_articles_complete AS
SELECT 
    a.id,
    a.name,
    a.reference,
    a.description,
    a.category,
    a.unit,
    a.min_stock,
    a.max_stock,
    a.current_stock,
    a.unit_price,
    a.current_stock * a.unit_price AS stock_value,
    a.location,
    a.barcode,
    CASE 
        WHEN a.current_stock <= a.min_stock THEN 'low'
        WHEN a.current_stock >= a.max_stock THEN 'high'
        ELSE 'normal'
    END AS stock_status,
    CASE 
        WHEN a.current_stock = 0 THEN 'out_of_stock'
        WHEN a.current_stock <= a.min_stock THEN 'low_stock'
        WHEN a.current_stock >= a.max_stock THEN 'overstock'
        ELSE 'normal'
    END AS stock_alert_level,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    s.name AS supplier_name,
    s.contact_name AS supplier_contact,
    a.is_active,
    a.created_at,
    a.updated_at
FROM articles a
    LEFT JOIN laboratories l ON a.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN suppliers s ON a.supplier_id = s.id;
GO

PRINT 'Vue v_articles_complete créée';
GO

-- Vue pour les mouvements avec informations complètes
CREATE VIEW v_stock_movements_complete AS
SELECT 
    sm.id,
    sm.type,
    sm.quantity,
    sm.reason,
    sm.reference,
    sm.notes,
    sm.previous_stock,
    sm.new_stock,
    sm.unit_cost,
    sm.total_cost,
    sm.created_at,
    a.name AS article_name,
    a.reference AS article_reference,
    a.unit AS article_unit,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    u.first_name + ' ' + u.last_name AS user_name,
    s.name AS supplier_name
FROM stock_movements sm
    LEFT JOIN articles a ON sm.article_id = a.id
    LEFT JOIN laboratories l ON sm.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN users u ON sm.user_id = u.id
    LEFT JOIN suppliers s ON sm.supplier_id = s.id;
GO

PRINT 'Vue v_stock_movements_complete créée';
GO

-- Vue pour les demandes avec informations complètes
CREATE VIEW v_supply_requests_complete AS
SELECT 
    sr.id,
    sr.requested_quantity,
    sr.urgency,
    sr.reason,
    sr.status,
    sr.order_reference,
    sr.estimated_cost,
    sr.actual_cost,
    sr.delivery_date,
    sr.notes,
    sr.created_at,
    sr.updated_at,
    sr.approved_at,
    a.name AS article_name,
    a.reference AS article_reference,
    a.current_stock,
    a.min_stock,
    a.unit_price,
    a.unit AS article_unit,
    sr.requested_quantity * a.unit_price AS calculated_cost,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    u1.first_name + ' ' + u1.last_name AS requested_by_name,
    u2.first_name + ' ' + u2.last_name AS approved_by_name,
    s.name AS supplier_name,
    s.contact_name AS supplier_contact
FROM supply_requests sr
    LEFT JOIN articles a ON sr.article_id = a.id
    LEFT JOIN laboratories l ON sr.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN users u1 ON sr.requested_by = u1.id
    LEFT JOIN users u2 ON sr.approved_by = u2.id
    LEFT JOIN suppliers s ON sr.supplier_id = s.id;
GO

PRINT 'Vue v_supply_requests_complete créée';
GO

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer la valeur totale du stock d'un laboratoire
CREATE FUNCTION fn_laboratory_stock_value(@laboratory_id INT)
RETURNS DECIMAL(15,2)
AS
BEGIN
    DECLARE @total_value DECIMAL(15,2);
    
    SELECT @total_value = ISNULL(SUM(current_stock * unit_price), 0)
    FROM articles 
    WHERE laboratory_id = @laboratory_id AND is_active = 1;
    
    RETURN ISNULL(@total_value, 0);
END;
GO

PRINT 'Fonction fn_laboratory_stock_value créée';
GO

-- Fonction pour compter les articles en stock faible d'un laboratoire
CREATE FUNCTION fn_laboratory_low_stock_count(@laboratory_id INT)
RETURNS INT
AS
BEGIN
    DECLARE @count INT;
    
    SELECT @count = COUNT(*)
    FROM articles 
    WHERE laboratory_id = @laboratory_id 
      AND is_active = 1 
      AND current_stock <= min_stock;
    
    RETURN ISNULL(@count, 0);
END;
GO

PRINT 'Fonction fn_laboratory_low_stock_count créée';
GO

-- Fonction pour calculer le pourcentage de stock
CREATE FUNCTION fn_stock_percentage(@current_stock INT, @min_stock INT, @max_stock INT)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @percentage DECIMAL(5,2);
    
    IF @max_stock = @min_stock OR @max_stock = 0
        RETURN 0;
    
    SET @percentage = CAST((@current_stock - @min_stock) AS FLOAT) / (@max_stock - @min_stock) * 100;
    
    RETURN CASE 
        WHEN @percentage < 0 THEN 0
        WHEN @percentage > 100 THEN 100
        ELSE @percentage
    END;
END;
GO

PRINT 'Fonction fn_stock_percentage créée';
GO

-- =====================================================
-- TRIGGERS POUR AUDIT ET MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER tr_lycees_updated_at ON lycees
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE lycees 
    SET updated_at = GETDATE()
    FROM lycees l
    INNER JOIN inserted i ON l.id = i.id;
END;
GO

CREATE TRIGGER tr_laboratories_updated_at ON laboratories
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE laboratories 
    SET updated_at = GETDATE()
    FROM laboratories l
    INNER JOIN inserted i ON l.id = i.id;
END;
GO

CREATE TRIGGER tr_users_updated_at ON users
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users 
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END;
GO

CREATE TRIGGER tr_suppliers_updated_at ON suppliers
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE suppliers 
    SET updated_at = GETDATE()
    FROM suppliers s
    INNER JOIN inserted i ON s.id = i.id;
END;
GO

CREATE TRIGGER tr_articles_updated_at ON articles
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE articles 
    SET updated_at = GETDATE()
    FROM articles a
    INNER JOIN inserted i ON a.id = i.id;
END;
GO

CREATE TRIGGER tr_supply_requests_updated_at ON supply_requests
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE supply_requests 
    SET updated_at = GETDATE()
    FROM supply_requests sr
    INNER JOIN inserted i ON sr.id = i.id;
END;
GO

CREATE TRIGGER tr_audits_updated_at ON audits
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE audits 
    SET updated_at = GETDATE()
    FROM audits a
    INNER JOIN inserted i ON a.id = i.id;
END;
GO

-- Trigger pour créer des alertes automatiques
CREATE TRIGGER tr_articles_low_stock_alert ON articles
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Créer des alertes pour les articles en stock faible
    INSERT INTO system_alerts (type, severity, title, message, entity_type, entity_id)
    SELECT 
        'low_stock',
        CASE 
            WHEN i.current_stock = 0 THEN 'critical'
            WHEN i.current_stock <= i.min_stock * 0.5 THEN 'error'
            ELSE 'warning'
        END,
        'Stock faible: ' + i.name,
        'L''article ' + i.name + ' (' + i.reference + ') a un stock de ' + CAST(i.current_stock AS NVARCHAR) + ' unités (minimum: ' + CAST(i.min_stock AS NVARCHAR) + ')',
        'article',
        i.id
    FROM inserted i
    INNER JOIN deleted d ON i.id = d.id
    WHERE i.current_stock <= i.min_stock 
      AND d.current_stock > d.min_stock
      AND i.is_active = 1;
END;
GO

PRINT 'Triggers créés';
GO

-- =====================================================
-- PROCÉDURES STOCKÉES UTILES
-- =====================================================

-- Procédure pour créer un mouvement de stock et mettre à jour le stock
CREATE PROCEDURE sp_create_stock_movement
    @article_id INT,
    @laboratory_id INT,
    @type NVARCHAR(10),
    @quantity INT,
    @reason NVARCHAR(255),
    @user_id INT,
    @reference NVARCHAR(100) = NULL,
    @supplier_id INT = NULL,
    @notes NVARCHAR(MAX) = NULL,
    @unit_cost DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        DECLARE @current_stock INT, @new_stock INT;
        
        -- Récupérer le stock actuel
        SELECT @current_stock = current_stock FROM articles WHERE id = @article_id AND is_active = 1;
        
        IF @current_stock IS NULL
        BEGIN
            RAISERROR('Article non trouvé ou inactif', 16, 1);
            RETURN;
        END
        
        -- Calculer le nouveau stock
        IF @type = 'in'
            SET @new_stock = @current_stock + @quantity;
        ELSE
        BEGIN
            IF @current_stock < @quantity
            BEGIN
                RAISERROR('Stock insuffisant pour effectuer cette sortie (Stock actuel: %d, Quantité demandée: %d)', 16, 1, @current_stock, @quantity);
                RETURN;
            END
            SET @new_stock = @current_stock - @quantity;
        END
        
        -- Créer le mouvement
        INSERT INTO stock_movements (
            article_id, laboratory_id, type, quantity, reason, user_id, 
            reference, supplier_id, notes, previous_stock, new_stock, unit_cost
        )
        VALUES (
            @article_id, @laboratory_id, @type, @quantity, @reason, @user_id,
            @reference, @supplier_id, @notes, @current_stock, @new_stock, @unit_cost
        );
        
        DECLARE @movement_id INT = SCOPE_IDENTITY();
        
        -- Mettre à jour le stock de l'article
        UPDATE articles 
        SET current_stock = @new_stock, updated_at = GETDATE()
        WHERE id = @article_id;
        
        -- Log de l'activité
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values)
        VALUES (@user_id, 'STOCK_' + UPPER(@type), 'stock_movement', @movement_id, 
                '{"quantity":' + CAST(@quantity AS NVARCHAR) + ',"new_stock":' + CAST(@new_stock AS NVARCHAR) + '}');
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS result, @movement_id AS movement_id, @new_stock AS new_stock;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Procédure sp_create_stock_movement créée';
GO

-- Procédure pour obtenir les statistiques du dashboard
CREATE PROCEDURE sp_get_dashboard_stats
    @user_id INT = NULL,
    @lycee_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @total_articles INT,
            @low_stock_items INT,
            @out_of_stock_items INT,
            @pending_requests INT,
            @recent_movements INT,
            @total_laboratories INT,
            @active_suppliers INT,
            @total_stock_value DECIMAL(15,2),
            @pending_audits INT;
    
    -- Construire les filtres selon les permissions
    DECLARE @lab_filter NVARCHAR(MAX) = '';
    IF @lycee_id IS NOT NULL
        SET @lab_filter = ' AND l.lycee_id = ' + CAST(@lycee_id AS NVARCHAR(10));
    
    -- Total articles actifs
    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT @count = COUNT(*)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @total_articles OUTPUT;
    
    -- Articles en stock faible
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1 AND a.current_stock <= a.min_stock' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @low_stock_items OUTPUT;
    
    -- Articles en rupture
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1 AND a.current_stock = 0' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @out_of_stock_items OUTPUT;
    
    -- Demandes en attente
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM supply_requests sr
        INNER JOIN laboratories l ON sr.laboratory_id = l.id
        WHERE sr.status = ''pending''' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @pending_requests OUTPUT;
    
    -- Mouvements récents (7 derniers jours)
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM stock_movements sm
        INNER JOIN laboratories l ON sm.laboratory_id = l.id
        WHERE sm.created_at >= DATEADD(day, -7, GETDATE())' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @recent_movements OUTPUT;
    
    -- Total laboratoires
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM laboratories l
        WHERE l.is_active = 1' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @total_laboratories OUTPUT;
    
    -- Valeur totale du stock
    SET @sql = N'
        SELECT @value = ISNULL(SUM(a.current_stock * a.unit_price), 0)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@value DECIMAL(15,2) OUTPUT', @value = @total_stock_value OUTPUT;
    
    -- Fournisseurs actifs
    SELECT @active_suppliers = COUNT(*) FROM suppliers WHERE is_active = 1;
    
    -- Audits en attente
    SET @sql = N'
        SELECT @count = COUNT(*)
        FROM audits au
        INNER JOIN laboratories l ON au.laboratory_id = l.id
        WHERE au.status IN (''planned'', ''in_progress'')' + @lab_filter;
    
    EXEC sp_executesql @sql, N'@count INT OUTPUT', @count = @pending_audits OUTPUT;
    
    -- Retourner les résultats
    SELECT 
        @total_articles AS total_articles,
        @low_stock_items AS low_stock_items,
        @out_of_stock_items AS out_of_stock_items,
        @pending_requests AS pending_requests,
        @recent_movements AS recent_movements,
        @total_laboratories AS total_laboratories,
        @active_suppliers AS active_suppliers,
        @total_stock_value AS total_stock_value,
        @pending_audits AS pending_audits;
END;
GO

PRINT 'Procédure sp_get_dashboard_stats créée';
GO

-- Procédure pour mettre à jour un article
CREATE PROCEDURE sp_update_article
    @id INT,
    @name NVARCHAR(255),
    @reference NVARCHAR(100),
    @description NVARCHAR(MAX),
    @category NVARCHAR(100),
    @unit NVARCHAR(50),
    @min_stock INT,
    @max_stock INT,
    @current_stock INT,
    @unit_price DECIMAL(10,2),
    @supplier_id INT,
    @laboratory_id INT,
    @location NVARCHAR(255) = NULL,
    @barcode NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE articles 
    SET name = @name,
        reference = @reference,
        description = @description,
        category = @category,
        unit = @unit,
        min_stock = @min_stock,
        max_stock = @max_stock,
        current_stock = @current_stock,
        unit_price = @unit_price,
        supplier_id = @supplier_id,
        laboratory_id = @laboratory_id,
        location = @location,
        barcode = @barcode,
        updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @id AND is_active = 1;
END;
GO

PRINT 'Procédure sp_update_article créée';
GO

-- Procédure pour désactiver un article (suppression logique)
CREATE PROCEDURE sp_deactivate_article
    @id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE articles 
    SET is_active = 0, updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @id;
    
    -- Log de l'activité
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
    VALUES (@user_id, 'DELETE', 'article', @id);
END;
GO

PRINT 'Procédure sp_deactivate_article créée';
GO

-- =====================================================
-- INSERTION DES DONNÉES DE RÉFÉRENCE
-- =====================================================

-- Catégories d'articles par défaut
INSERT INTO article_categories (name, description) VALUES
('Composants passifs', 'Résistances, condensateurs, inductances'),
('Composants actifs', 'Transistors, diodes, circuits intégrés'),
('Instruments de mesure', 'Multimètres, oscilloscopes, générateurs'),
('Outillage', 'Tournevis, pinces, fers à souder'),
('Câbles et connecteurs', 'Fils, câbles, connecteurs divers'),
('Alimentation', 'Alimentations stabilisées, batteries'),
('Sécurité', 'Équipements de protection individuelle'),
('Consommables', 'Étain, flux, produits chimiques');
GO

PRINT 'Catégories d''articles insérées';
GO

-- Unités de mesure par défaut
INSERT INTO measurement_units (name, symbol, type) VALUES
('Pièce', 'pcs', 'quantity'),
('Mètre', 'm', 'length'),
('Centimètre', 'cm', 'length'),
('Millimètre', 'mm', 'length'),
('Kilogramme', 'kg', 'weight'),
('Gramme', 'g', 'weight'),
('Litre', 'L', 'volume'),
('Millilitre', 'mL', 'volume'),
('Boîte', 'box', 'quantity'),
('Rouleau', 'roll', 'quantity'),
('Sachet', 'bag', 'quantity'),
('Tube', 'tube', 'quantity');
GO

PRINT 'Unités de mesure insérées';
GO

-- =====================================================
-- VUES POUR LES RAPPORTS
-- =====================================================

-- Vue pour le rapport d'inventaire
CREATE VIEW v_inventory_report AS
SELECT 
    a.id,
    a.name,
    a.reference,
    a.category,
    a.unit,
    a.current_stock,
    a.min_stock,
    a.max_stock,
    a.unit_price,
    a.current_stock * a.unit_price AS stock_value,
    a.location,
    CASE 
        WHEN a.current_stock = 0 THEN 'Rupture'
        WHEN a.current_stock <= a.min_stock THEN 'Stock faible'
        WHEN a.current_stock >= a.max_stock THEN 'Surstock'
        ELSE 'Normal'
    END AS stock_status,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    s.name AS supplier_name,
    a.updated_at AS last_updated
FROM articles a
    LEFT JOIN laboratories l ON a.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN suppliers s ON a.supplier_id = s.id
WHERE a.is_active = 1;
GO

PRINT 'Vue v_inventory_report créée';
GO

-- Vue pour les alertes actives
CREATE VIEW v_active_alerts AS
SELECT 
    sa.id,
    sa.type,
    sa.severity,
    sa.title,
    sa.message,
    sa.entity_type,
    sa.entity_id,
    sa.created_at,
    sa.expires_at,
    CASE sa.entity_type
        WHEN 'article' THEN a.name
        WHEN 'laboratory' THEN l.name
        WHEN 'user' THEN u.first_name + ' ' + u.last_name
        ELSE 'N/A'
    END AS entity_name
FROM system_alerts sa
    LEFT JOIN articles a ON sa.entity_type = 'article' AND sa.entity_id = a.id
    LEFT JOIN laboratories l ON sa.entity_type = 'laboratory' AND sa.entity_id = l.id
    LEFT JOIN users u ON sa.entity_type = 'user' AND sa.entity_id = u.id
WHERE sa.is_resolved = 0 
  AND (sa.expires_at IS NULL OR sa.expires_at > GETDATE());
GO

PRINT 'Vue v_active_alerts créée';
GO

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Création d'un rôle pour l'application
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'lab_stock_app_role')
BEGIN
    CREATE ROLE lab_stock_app_role;
    PRINT 'Rôle lab_stock_app_role créé';
END
GO

-- Attribution des permissions au rôle
GRANT SELECT, INSERT, UPDATE, DELETE ON lycees TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON laboratories TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_laboratories TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON articles TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_movements TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON supply_requests TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON audits TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_findings TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_alerts TO lab_stock_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_logs TO lab_stock_app_role;
GRANT SELECT ON article_categories TO lab_stock_app_role;
GRANT SELECT ON measurement_units TO lab_stock_app_role;

-- Permissions sur les vues
GRANT SELECT ON v_articles_complete TO lab_stock_app_role;
GRANT SELECT ON v_stock_movements_complete TO lab_stock_app_role;
GRANT SELECT ON v_supply_requests_complete TO lab_stock_app_role;
GRANT SELECT ON v_inventory_report TO lab_stock_app_role;
GRANT SELECT ON v_active_alerts TO lab_stock_app_role;

-- Permissions sur les procédures stockées
GRANT EXECUTE ON sp_create_stock_movement TO lab_stock_app_role;
GRANT EXECUTE ON sp_get_dashboard_stats TO lab_stock_app_role;
GRANT EXECUTE ON sp_update_article TO lab_stock_app_role;
GRANT EXECUTE ON sp_deactivate_article TO lab_stock_app_role;

-- Permissions sur les fonctions
GRANT EXECUTE ON fn_laboratory_stock_value TO lab_stock_app_role;
GRANT EXECUTE ON fn_laboratory_low_stock_count TO lab_stock_app_role;
GRANT EXECUTE ON fn_stock_percentage TO lab_stock_app_role;

PRINT 'Permissions accordées au rôle lab_stock_app_role';
GO

-- =====================================================
-- CONFIGURATION DE LA BASE DE DONNÉES
-- =====================================================

-- Configuration pour optimiser les performances
ALTER DATABASE lab_stock_management SET RECOVERY SIMPLE;
ALTER DATABASE lab_stock_management SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE lab_stock_management SET AUTO_UPDATE_STATISTICS ON;
ALTER DATABASE lab_stock_management SET AUTO_UPDATE_STATISTICS_ASYNC ON;

PRINT 'Configuration de la base de données optimisée';
GO

-- =====================================================
-- RÉSUMÉ DE LA CRÉATION
-- =====================================================

PRINT '=====================================================';
PRINT 'SCHÉMA DE BASE DE DONNÉES CRÉÉ AVEC SUCCÈS !';
PRINT '=====================================================';
PRINT '';
PRINT 'Tables principales créées:';
PRINT '  - lycees (établissements)';
PRINT '  - laboratories (laboratoires)';
PRINT '  - users (utilisateurs)';
PRINT '  - user_laboratories (liaison utilisateurs-laboratoires)';
PRINT '  - suppliers (fournisseurs)';
PRINT '  - articles (articles/matériels)';
PRINT '  - stock_movements (mouvements de stock)';
PRINT '  - supply_requests (demandes de réapprovisionnement)';
PRINT '  - audits (audits et inventaires)';
PRINT '  - audit_findings (résultats d''audit)';
PRINT '';
PRINT 'Tables de référence:';
PRINT '  - article_categories (catégories d''articles)';
PRINT '  - measurement_units (unités de mesure)';
PRINT '  - system_alerts (alertes système)';
PRINT '  - activity_logs (logs d''activité)';
PRINT '';
PRINT 'Vues créées:';
PRINT '  - v_articles_complete';
PRINT '  - v_stock_movements_complete';
PRINT '  - v_supply_requests_complete';
PRINT '  - v_inventory_report';
PRINT '  - v_active_alerts';
PRINT '';
PRINT 'Fonctions utilitaires:';
PRINT '  - fn_laboratory_stock_value';
PRINT '  - fn_laboratory_low_stock_count';
PRINT '  - fn_stock_percentage';
PRINT '';
PRINT 'Procédures stockées:';
PRINT '  - sp_create_stock_movement';
PRINT '  - sp_get_dashboard_stats';
PRINT '  - sp_update_article';
PRINT '  - sp_deactivate_article';
PRINT '';
PRINT 'Index et triggers créés pour optimiser les performances';
PRINT 'Rôle de sécurité lab_stock_app_role configuré';
PRINT '';
PRINT 'La base de données est prête à être utilisée !';
PRINT '=====================================================';