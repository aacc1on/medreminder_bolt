const express = require('express');
const patientController = require('../controllers/patientController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply patient role requirement to all routes
router.use(requireRole('patient'));

// Routes
router.get('/dashboard', patientController.renderDashboard);
router.get('/connect-bot', patientController.renderConnectBot);
router.post('/disconnect-bot', patientController.disconnectBot);
router.get('/medications', patientController.renderMedications);
router.get('/appointments', patientController.renderAppointments);

module.exports = router;