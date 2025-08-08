-- Création de la base de données et des tables pour SQL Server

-- Table des lycées
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='lycees' AND xtype='U')
CREATE TABLE lycees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(10) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des laboratoires
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='laboratories' AND xtype='U')
CREATE TABLE laboratories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    lycee_id INT REFERENCES lycees(id) ON DELETE CASCADE,
    description NVARCHAR(MAX),
    responsible_user_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des utilisateurs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor', 'auditor')),
    lycee_id INT REFERENCES lycees(id) ON DELETE SET NULL,
    is_active BIT DEFAULT 1,
    last_login DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table de liaison utilisateurs-laboratoires
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_laboratories' AND xtype='U')
CREATE TABLE user_laboratories (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, laboratory_id)
);

-- Table des fournisseurs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='suppliers' AND xtype='U')
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
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des articles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='articles' AND xtype='U')
CREATE TABLE articles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    reference NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    category NVARCHAR(100) NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    min_stock INT NOT NULL DEFAULT 0,
    max_stock INT NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des mouvements de stock
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='stock_movements' AND xtype='U')
CREATE TABLE stock_movements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    article_id INT REFERENCES articles(id) ON DELETE CASCADE,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    type NVARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INT NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    reference NVARCHAR(100),
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Table des demandes de réapprovisionnement
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='supply_requests' AND xtype='U')
CREATE TABLE supply_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    article_id INT REFERENCES articles(id) ON DELETE CASCADE,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    requested_quantity INT NOT NULL,
    urgency NVARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    reason NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'cancelled')),
    requested_by INT REFERENCES users(id) ON DELETE SET NULL,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    order_reference NVARCHAR(100),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des audits
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audits' AND xtype='U')
CREATE TABLE audits (
    id INT IDENTITY(1,1) PRIMARY KEY,
    laboratory_id INT REFERENCES laboratories(id) ON DELETE CASCADE,
    audit_type NVARCHAR(20) NOT NULL CHECK (audit_type IN ('inventory', 'quality', 'compliance')),
    status NVARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    audited_by INT REFERENCES users(id) ON DELETE SET NULL,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Table des résultats d'audit
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_findings' AND xtype='U')
CREATE TABLE audit_findings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    audit_id INT REFERENCES audits(id) ON DELETE CASCADE,
    article_id INT REFERENCES articles(id) ON DELETE CASCADE,
    expected_quantity INT NOT NULL,
    actual_quantity INT NOT NULL,
    discrepancy INT NOT NULL,
    reason NVARCHAR(MAX),
    action NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Index pour optimiser les performances
CREATE NONCLUSTERED INDEX IX_articles_laboratory ON articles(laboratory_id);
CREATE NONCLUSTERED INDEX IX_articles_supplier ON articles(supplier_id);
CREATE NONCLUSTERED INDEX IX_movements_article ON stock_movements(article_id);
CREATE NONCLUSTERED INDEX IX_movements_date ON stock_movements(created_at);
CREATE NONCLUSTERED INDEX IX_supply_requests_status ON supply_requests(status);
CREATE NONCLUSTERED INDEX IX_audits_laboratory ON audits(laboratory_id);
CREATE NONCLUSTERED INDEX IX_users_email ON users(email);