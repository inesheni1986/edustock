const bcrypt = require('bcryptjs');
const { connectDB, sql } = require('./connection');

async function seed() {
  try {
    console.log('🌱 Début de l\'insertion des données de test...');
    
    await connectDB();
    
    // Vérifier si des données existent déjà
    const existingUsers = await sql.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers.recordset[0].count > 0) {
      console.log('⚠️ Des données existent déjà, arrêt du seeding');
      return;
    }
    
    // Hachage du mot de passe par défaut
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Insertion des lycées
    const lyceeResult = await sql.query(`
      INSERT INTO lycees (name, address, city, postal_code, phone, email)
      OUTPUT INSERTED.id
      VALUES 
        ('Lycée Technique Voltaire', '123 Rue de la Science', 'Paris', '75001', '01.23.45.67.89', 'contact@voltaire.edu'),
        ('Lycée Professionnel Edison', '456 Avenue de l''Électricité', 'Lyon', '69000', '04.78.90.12.34', 'contact@edison.edu')
    `);
    
    const lyceeIds = lyceeResult.recordset.map(row => row.id);
    console.log('✅ Lycées créés:', lyceeIds);
    
    // Insertion des laboratoires
    const labResult = await sql.query(`
      INSERT INTO laboratories (name, lycee_id, description)
      OUTPUT INSERTED.id
      VALUES 
        ('Laboratoire Électrotechnique', ${lyceeIds[0]}, 'Laboratoire principal pour les cours d''électrotechnique'),
        ('Laboratoire Électronique', ${lyceeIds[0]}, 'Laboratoire spécialisé en électronique'),
        ('Laboratoire Automatisme', ${lyceeIds[1]}, 'Laboratoire d''automatisme industriel')
    `);
    
    const labIds = labResult.recordset.map(row => row.id);
    console.log('✅ Laboratoires créés:', labIds);
    
    // Insertion des utilisateurs
    const userResult = await sql.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, lycee_id)
      OUTPUT INSERTED.id
      VALUES 
        ('admin@lycee.fr', '${hashedPassword}', 'Admin', 'System', 'admin', NULL),
        ('prof@lycee.fr', '${hashedPassword}', 'Jean', 'Dupont', 'professor', ${lyceeIds[0]}),
        ('auditeur@lycee.fr', '${hashedPassword}', 'Marie', 'Martin', 'auditor', ${lyceeIds[0]}),
        ('prof2@lycee.fr', '${hashedPassword}', 'Pierre', 'Durand', 'professor', ${lyceeIds[1]})
    `);
    
    const userIds = userResult.recordset.map(row => row.id);
    console.log('✅ Utilisateurs créés:', userIds);
    
    // Liaison utilisateurs-laboratoires
    await sql.query(`
      INSERT INTO user_laboratories (user_id, laboratory_id)
      VALUES 
        (${userIds[1]}, ${labIds[0]}),
        (${userIds[2]}, ${labIds[0]}),
        (${userIds[2]}, ${labIds[1]}),
        (${userIds[3]}, ${labIds[2]})
    `);
    
    // Insertion des fournisseurs
    const supplierResult = await sql.query(`
      INSERT INTO suppliers (name, contact_name, email, phone, address, city, postal_code, siret)
      OUTPUT INSERTED.id
      VALUES 
        ('TechnoElec Distribution', 'Pierre Électron', 'commandes@technoelec.fr', '01.44.55.66.77', '789 Rue des Composants', 'Paris', '75010', '12345678901234'),
        ('Résistance & Cie', 'Anne Ampère', 'vente@resistance-cie.fr', '02.33.44.55.66', '321 Boulevard des Ohms', 'Nantes', '44000', '98765432109876')
    `);
    
    const supplierIds = supplierResult.recordset.map(row => row.id);
    console.log('✅ Fournisseurs créés:', supplierIds);
    
    // Insertion des articles
    await sql.query(`
      INSERT INTO articles (name, reference, description, category, unit, min_stock, max_stock, current_stock, unit_price, supplier_id, laboratory_id)
      VALUES 
        ('Résistance 1kΩ', 'R1K-01', 'Résistance 1/4W 5% axiale', 'Composants passifs', 'pièce', 100, 500, 150, 0.05, ${supplierIds[0]}, ${labIds[0]}),
        ('Condensateur 100μF', 'C100-01', 'Condensateur électrolytique 25V', 'Composants passifs', 'pièce', 50, 200, 30, 0.15, ${supplierIds[0]}, ${labIds[0]}),
        ('Multimètre numérique', 'MULTI-001', 'Multimètre 3½ digits avec affichage LCD', 'Instruments de mesure', 'pièce', 5, 20, 8, 45.00, ${supplierIds[1]}, ${labIds[0]}),
        ('LED Rouge 5mm', 'LED-R5', 'LED rouge 5mm standard', 'Composants actifs', 'pièce', 200, 1000, 450, 0.10, ${supplierIds[0]}, ${labIds[1]}),
        ('Breadboard 830 points', 'BB-830', 'Plaque d''essai 830 points', 'Outillage', 'pièce', 10, 50, 25, 8.50, ${supplierIds[1]}, ${labIds[1]})
    `);
    
    console.log('✅ Articles créés');
    
    console.log('🎉 Seeding terminé avec succès!');
    console.log('📧 Comptes de test créés:');
    console.log('   - Admin: admin@lycee.fr / password123');
    console.log('   - Professeur: prof@lycee.fr / password123');
    console.log('   - Auditeur: auditeur@lycee.fr / password123');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seed;