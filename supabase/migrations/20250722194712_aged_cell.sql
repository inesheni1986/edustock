-- =====================================================
-- Schéma de base de données pour GestiLab
-- Système de gestion des stocks pour laboratoires
-- Base de données: SQL Server
-- =====================================================

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
    CONSTRAINT UQ_suppliers_email UNIQUE (email),
    CONSTRAINT UQ_suppliers_siret UNIQUE (siret)
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
    CASE 
        WHEN a.current_stock <= a.min_stock THEN 'low'
        WHEN a.current_stock >= a.max_stock THEN 'high'
        ELSE 'normal'
    END AS stock_status,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    s.name AS supplier_name,
    a.is_active,
    a.created_at,
    a.updated_at
FROM articles a
    LEFT JOIN laboratories l ON a.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN suppliers s ON a.supplier_id = s.id;
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
    sm.created_at,
    a.name AS article_name,
    a.reference AS article_reference,
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

-- Vue pour les demandes avec informations complètes
CREATE VIEW v_supply_requests_complete AS
SELECT 
    sr.id,
    sr.requested_quantity,
    sr.urgency,
    sr.reason,
    sr.status,
    sr.order_reference,
    sr.notes,
    sr.created_at,
    sr.updated_at,
    a.name AS article_name,
    a.reference AS article_reference,
    a.current_stock,
    a.min_stock,
    a.unit_price,
    sr.requested_quantity * a.unit_price AS estimated_cost,
    l.name AS laboratory_name,
    ly.name AS lycee_name,
    u1.first_name + ' ' + u1.last_name AS requested_by_name,
    u2.first_name + ' ' + u2.last_name AS approved_by_name,
    s.name AS supplier_name
FROM supply_requests sr
    LEFT JOIN articles a ON sr.article_id = a.id
    LEFT JOIN laboratories l ON sr.laboratory_id = l.id
    LEFT JOIN lycees ly ON l.lycee_id = ly.id
    LEFT JOIN users u1 ON sr.requested_by = u1.id
    LEFT JOIN users u2 ON sr.approved_by = u2.id
    LEFT JOIN suppliers s ON sr.supplier_id = s.id;
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
    
    RETURN @total_value;
END;
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
    
    RETURN @count;
END;
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
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Vérifier le stock disponible pour les sorties
        IF @type = 'out'
        BEGIN
            DECLARE @current_stock INT;
            SELECT @current_stock = current_stock FROM articles WHERE id = @article_id;
            
            IF @current_stock < @quantity
            BEGIN
                RAISERROR('Stock insuffisant pour effectuer cette sortie', 16, 1);
                RETURN;
            END
        END
        
        -- Créer le mouvement
        INSERT INTO stock_movements (article_id, laboratory_id, type, quantity, reason, user_id, reference, supplier_id, notes)
        VALUES (@article_id, @laboratory_id, @type, @quantity, @reason, @user_id, @reference, @supplier_id, @notes);
        
        -- Mettre à jour le stock
        IF @type = 'in'
            UPDATE articles SET current_stock = current_stock + @quantity WHERE id = @article_id;
        ELSE
            UPDATE articles SET current_stock = current_stock - @quantity WHERE id = @article_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'SUCCESS' AS result, SCOPE_IDENTITY() AS movement_id;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
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
            @pending_requests INT,
            @recent_movements INT,
            @total_laboratories INT,
            @active_suppliers INT;
    
    -- Filtres selon les permissions utilisateur
    DECLARE @lab_filter NVARCHAR(MAX) = '';
    IF @lycee_id IS NOT NULL
        SET @lab_filter = ' AND l.lycee_id = ' + CAST(@lycee_id AS NVARCHAR(10));
    
    -- Total articles
    EXEC sp_executesql N'
        SELECT @count = COUNT(*)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1' + @lab_filter,
        N'@count INT OUTPUT',
        @count = @total_articles OUTPUT;
    
    -- Articles en stock faible
    EXEC sp_executesql N'
        SELECT @count = COUNT(*)
        FROM articles a
        INNER JOIN laboratories l ON a.laboratory_id = l.id
        WHERE a.is_active = 1 AND a.current_stock <= a.min_stock' + @lab_filter,
        N'@count INT OUTPUT',
        @count = @low_stock_items OUTPUT;
    
    -- Demandes en attente
    EXEC sp_executesql N'
        SELECT @count = COUNT(*)
        FROM supply_requests sr
        INNER JOIN laboratories l ON sr.laboratory_id = l.id
        WHERE sr.status = ''pending''' + @lab_filter,
        N'@count INT OUTPUT',
        @count = @pending_requests OUTPUT;
    
    -- Mouvements récents (7 derniers jours)
    EXEC sp_executesql N'
        SELECT @count = COUNT(*)
        FROM stock_movements sm
        INNER JOIN laboratories l ON sm.laboratory_id = l.id
        WHERE sm.created_at >= DATEADD(day, -7, GETDATE())' + @lab_filter,
        N'@count INT OUTPUT',
        @count = @recent_movements OUTPUT;
    
    -- Total laboratoires
    EXEC sp_executesql N'
        SELECT @count = COUNT(*)
        FROM laboratories l
        WHERE 1=1' + @lab_filter,
        N'@count INT OUTPUT',
        @count = @total_laboratories OUTPUT;
    
    -- Fournisseurs actifs
    SELECT @active_suppliers = COUNT(*) FROM suppliers WHERE is_active = 1;
    
    -- Retourner les résultats
    SELECT 
        @total_articles AS total_articles,
        @low_stock_items AS low_stock_items,
        @pending_requests AS pending_requests,
        @recent_movements AS recent_movements,
        @total_laboratories AS total_laboratories,
        @active_suppliers AS active_suppliers;
END;
GO

PRINT 'Schéma de base de données créé avec succès !';
PRINT 'Tables créées: lycees, laboratories, users, user_laboratories, suppliers, articles, stock_movements, supply_requests, audits, audit_findings';
PRINT 'Vues créées: v_articles_complete, v_stock_movements_complete, v_supply_requests_complete';
PRINT 'Fonctions créées: fn_laboratory_stock_value, fn_laboratory_low_stock_count';
PRINT 'Procédures créées: sp_create_stock_movement, sp_get_dashboard_stats';
PRINT 'Index et triggers créés pour optimiser les performances';