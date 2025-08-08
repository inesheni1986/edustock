const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'database',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: 'master', // Se connecter à master d'abord
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'StrongPassword123!',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const waitForDatabase = async () => {
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Tentative de connexion à la base de données (${i + 1}/${maxRetries})...`);
      
      const pool = await sql.connect(config);
      
      // Vérifier si la base de données existe
      const result = await pool.request()
        .query("SELECT name FROM sys.databases WHERE name = 'lab_stock_management'");
      
      if (result.recordset.length === 0) {
        console.log('📦 Création de la base de données...');
        await pool.request().query("CREATE DATABASE lab_stock_management");
      }
      
      await pool.close();
      
      console.log('✅ Base de données prête !');
      return true;
    } catch (error) {
      console.log(`❌ Échec de la connexion: ${error.message}`);
      
      if (i === maxRetries - 1) {
        console.error('💥 Impossible de se connecter à la base de données après', maxRetries, 'tentatives');
        process.exit(1);
      }
      
      console.log(`⏳ Nouvelle tentative dans ${retryDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

if (require.main === module) {
  waitForDatabase();
}

module.exports = waitForDatabase;