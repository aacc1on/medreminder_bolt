const express = require('express');
const { body } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply doctor role requirement to all routes
router.use(requireRole('doctor'));

// Validation rules
const prescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Medication name is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('timesPerDay').notEmpty().withMessage('Times per day are required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
];

const appointmentValidation = [
  body('patientId').notEmpty().withMessage('Patient is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
  body('location').trim().isLength({ min: 3 }).withMessage('Location is required')
];

const addPatientValidation = [
  body('patientEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
];

// Routes
router.get('/dashboard', doctorController.renderDashboard);
router.get('/patients', doctorController.renderPatients);
router.post('/patients', addPatientValidation, doctorController.addPatient);

router.get('/new-prescription', doctorController.renderNewPrescription);
router.post('/new-prescription', prescriptionValidation, doctorController.createPrescription);

router.get('/new-appointment', doctorController.renderNewAppointment);
router.post('/new-appointment', appointmentValidation, doctorController.createAppointment);

module.exports = router;