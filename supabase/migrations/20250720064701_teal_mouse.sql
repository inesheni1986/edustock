-- Création de la base de données et des tables

-- Table des lycées
CREATE TABLE IF NOT EXISTS lycees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des laboratoires
CREATE TABLE IF NOT EXISTS laboratories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lycee_id INTEGER REFERENCES lycees(id) ON DELETE CASCADE,
    description TEXT,
    responsible_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor', 'auditor')),
    lycee_id INTEGER REFERENCES lycees(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison utilisateurs-laboratoires
CREATE TABLE IF NOT EXISTS user_laboratories (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    laboratory_id INTEGER REFERENCES laboratories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, laboratory_id)
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    siret VARCHAR(14),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des articles
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    min_stock INTEGER NOT NULL DEFAULT 0,
    max_stock INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    laboratory_id INTEGER REFERENCES laboratories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    laboratory_id INTEGER REFERENCES laboratories(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des demandes de réapprovisionnement
CREATE TABLE IF NOT EXISTS supply_requests (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    laboratory_id INTEGER REFERENCES laboratories(id) ON DELETE CASCADE,
    requested_quantity INTEGER NOT NULL,
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'cancelled')),
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    order_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des audits
CREATE TABLE IF NOT EXISTS audits (
    id SERIAL PRIMARY KEY,
    laboratory_id INTEGER REFERENCES laboratories(id) ON DELETE CASCADE,
    audit_type VARCHAR(20) NOT NULL CHECK (audit_type IN ('inventory', 'quality', 'compliance')),
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    audited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des résultats d'audit
CREATE TABLE IF NOT EXISTS audit_findings (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    expected_quantity INTEGER NOT NULL,
    actual_quantity INTEGER NOT NULL,
    discrepancy INTEGER NOT NULL,
    reason TEXT,
    action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_articles_laboratory ON articles(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_articles_supplier ON articles(supplier_id);
CREATE INDEX IF NOT EXISTS idx_movements_article ON stock_movements(article_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_supply_requests_status ON supply_requests(status);
CREATE INDEX IF NOT EXISTS idx_audits_laboratory ON audits(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_lycees_updated_at BEFORE UPDATE ON lycees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laboratories_updated_at BEFORE UPDATE ON laboratories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_requests_updated_at BEFORE UPDATE ON supply_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();