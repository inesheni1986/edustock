const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
});

module.exports = router;