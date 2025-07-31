const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['doctor', 'patient']).withMessage('Invalid role'),
  body('clinicName').custom((value, { req }) => {
    if (req.body.role === 'doctor' && !value) {
      throw new Error('Clinic name is required for doctors');
    }
    return true;
  })
];

// Routes
router.get('/login', authController.renderLogin);
router.post('/login', loginValidation, authController.login);

router.get('/register', authController.renderRegister);
router.post('/register', registerValidation, authController.register);

router.get('/logout', authController.logout);

module.exports = router;