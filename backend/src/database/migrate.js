const fs = require('fs');
const path = require('path');
const { connectDB, sql } = require('./connection');

async function migrate() {
  try {
    console.log('🔄 Début de la migration de la base de données...');
    
    // Connexion à la base de données
    await connectDB();
    
    // Lecture et exécution du schéma
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Diviser le schéma en requêtes individuelles
    const queries = schema.split('GO').filter(query => query.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        await sql.query(query);
      }
    }
    
    console.log('✅ Migration terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();