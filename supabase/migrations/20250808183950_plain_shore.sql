-- =====================================================
-- Schéma de base de données pour GestiLab
-- Système de gestion des stocks pour laboratoires
-- Base de données: SQL Server
-- =====================================================

-- Création de la base de données
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'lab_stock_management')
BEGIN
    CREATE DATABASE lab_stock_management;
END
GO

USE lab_stock_management;
GO

-- Suppression des tables existantes (dans l'ordre inverse des dépendances)
IF OBJECT_ID('audit_findings', 'U') IS NOT NULL DROP TABLE audit_findings;
IF OBJECT_ID('audits', 'U') IS NOT NULL DROP TABLE audits;
IF OBJECT_ID('supply_requests', 'U') IS NOT NULL DROP TABLE supply_requests;
IF OBJECT_ID('stock_movements', 'U') IS NOT NULL DROP TABLE stock_movements;
IF OBJECT_ID('articles', 'U') IS NOT NULL DROP TABLE articles;
IF OBJECT_ID('suppliers', 'U') IS NOT NULL DROP TABLE suppliers;
IF OBJECT_ID('user_laboratories', 'U') IS NOT NULL DROP TABLE user_laboratories;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('laboratories', 'U') IS NOT NULL DROP TABLE laboratories;
IF OBJECT_ID('lycees', 'U') IS NOT NULL DROP TABLE lycees;
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
    CONSTRAINT UQ_lycees_email UNIQUE (email)
);
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
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Clés étrangères
    CONSTRAINT FK_laboratories_lycee FOREIGN KEY (lycee_id) REFERENCES lycees(id) ON DELETE CASCADE
);
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
    
    -- Clés étrangères
    CONSTRAINT FK_users_lycee FOREIGN KEY (lycee_id) REFERENCES lycees(id) ON DELETE SET NULL
);
GO

-- Mise à jour de la contrainte pour responsible_user_id
ALTER TABLE laboratories 
ADD CONSTRAINT FK_laboratories_responsible_user 
FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL;
GO

-- =====================================================
-- Table de liaison utilisateurs-laboratoires
-- =====================================================
CREATE TABLE user_laboratories (
    user_id INT NOT NULL,
    laboratory_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Clé primaire composite
    CONSTRAINT PK_user_laboratories PRIMARY KEY (user_id, laboratory_id),
    
    -- Clés étrangères
    CONSTRAINT FK_user_laboratories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT FK_user_laboratories_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
);
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
    CONSTRAINT UQ_suppliers_email UNIQUE (email)
);
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
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT UQ_articles_reference UNIQUE (reference),
    CONSTRAINT CK_articles_min_stock CHECK (min_stock >= 0),
    CONSTRAINT CK_articles_max_stock CHECK (max_stock >= min_stock),
    CONSTRAINT CK_articles_current_stock CHECK (current_stock >= 0),
    CONSTRAINT CK_articles_unit_price CHECK (unit_price >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_articles_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT FK_articles_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE
);
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
    reference NVARCHAR(100),
    user_id INT,
    supplier_id INT,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_stock_movements_type CHECK (type IN ('in', 'out')),
    CONSTRAINT CK_stock_movements_quantity CHECK (quantity > 0),
    
    -- Clés étrangères
    CONSTRAINT FK_stock_movements_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT FK_stock_movements_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_stock_movements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_stock_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
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
    supplier_id INT,
    order_reference NVARCHAR(100),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_supply_requests_urgency CHECK (urgency IN ('low', 'medium', 'high')),
    CONSTRAINT CK_supply_requests_status CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'cancelled')),
    CONSTRAINT CK_supply_requests_quantity CHECK (requested_quantity > 0),
    
    -- Clés étrangères
    CONSTRAINT FK_supply_requests_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT FK_supply_requests_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_supply_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_supply_requests_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT FK_supply_requests_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);
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
    completed_date DATE,
    audited_by INT,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_audits_type CHECK (audit_type IN ('inventory', 'quality', 'compliance')),
    CONSTRAINT CK_audits_status CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT CK_audits_dates CHECK (completed_date IS NULL OR completed_date >= scheduled_date),
    
    -- Clés étrangères
    CONSTRAINT FK_audits_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
    CONSTRAINT FK_audits_audited_by FOREIGN KEY (audited_by) REFERENCES users(id) ON DELETE SET NULL
);
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
    reason NVARCHAR(MAX),
    action NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Contraintes
    CONSTRAINT CK_audit_findings_expected CHECK (expected_quantity >= 0),
    CONSTRAINT CK_audit_findings_actual CHECK (actual_quantity >= 0),
    
    -- Clés étrangères
    CONSTRAINT FK_audit_findings_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT FK_audit_findings_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
GO

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index sur les tables principales
CREATE NONCLUSTERED INDEX IX_laboratories_lycee ON laboratories(lycee_id);
CREATE NONCLUSTERED INDEX IX_users_lycee ON users(lycee_id);
CREATE NONCLUSTERED INDEX IX_users_role ON users(role);
CREATE NONCLUSTERED INDEX IX_users_active ON users(is_active);

-- Index sur les articles
CREATE NONCLUSTERED INDEX IX_articles_laboratory ON articles(laboratory_id);
CREATE NONCLUSTERED INDEX IX_articles_supplier ON articles(supplier_id);
CREATE NONCLUSTERED INDEX IX_articles_category ON articles(category);
CREATE NONCLUSTERED INDEX IX_articles_reference ON articles(reference);
CREATE NONCLUSTERED INDEX IX_articles_low_stock ON articles(current_stock, min_stock);

-- Index sur les mouvements
CREATE NONCLUSTERED INDEX IX_stock_movements_article ON stock_movements(article_id);
CREATE NONCLUSTERED INDEX IX_stock_movements_laboratory ON stock_movements(laboratory_id);
CREATE NONCLUSTERED INDEX IX_stock_movements_date ON stock_movements(created_at DESC);
CREATE NONCLUSTERED INDEX IX_stock_movements_type ON stock_movements(type);
CREATE NONCLUSTERED INDEX IX_stock_movements_user ON stock_movements(user_id);

-- Index sur les demandes
CREATE NONCLUSTERED INDEX IX_supply_requests_article ON supply_requests(article_id);
CREATE NONCLUSTERED INDEX IX_supply_requests_laboratory ON supply_requests(laboratory_id);
CREATE NONCLUSTERED INDEX IX_supply_requests_status ON supply_requests(status);
CREATE NONCLUSTERED INDEX IX_supply_requests_urgency ON supply_requests(urgency);
CREATE NONCLUSTERED INDEX IX_supply_requests_requested_by ON supply_requests(requested_by);
CREATE NONCLUSTERED INDEX IX_supply_requests_date ON supply_requests(created_at DESC);

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

-- Index sur les fournisseurs
CREATE NONCLUSTERED INDEX IX_suppliers_active ON suppliers(is_active);
CREATE NONCLUSTERED INDEX IX_suppliers_city ON suppliers(city);

PRINT 'Schéma de base de données créé avec succès !';