const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'WCT0004\\MSSQLSERVER2022',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'lab_stock_management',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'ordiges',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connexion à SQL Server établie');
    }
    return pool;
  } catch (error) {
    console.error('❌ Erreur de connexion à SQL Server:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Base de données non connectée. Appelez connectDB() d\'abord.');
  }
  return pool;
};

module.exports = { connectDB, getPool, sql };