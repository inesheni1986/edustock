const express = require('express');
const cors = require('cors');
const { connectDB } = require('./database/connection');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const lyceesRoutes = require('./routes/lycees');
const laboratoriesRoutes = require('./routes/laboratories');
const dashboardRoutes = require('./routes/dashboard');
const suppliersRoutes = require('./routes/suppliers');
const articlesRoutes = require('./routes/articles');
const movementsRoutes = require('./routes/movements');
const supplyRequestsRoutes = require('./routes/supplyRequests');
const auditsRoutes = require('./routes/audits');
const reportsRoutes = require('./routes/reports');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Connexion à la base de données
connectDB().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lycees', lyceesRoutes);
app.use('/api/laboratories', laboratoriesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/supply-requests', supplyRequestsRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});