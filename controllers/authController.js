const User = require('../models/User');
const { validationResult } = require('express-validator');

const renderLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Login - MediRemind',
    errors: [],
    formData: {}
  });
};

const renderRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Register - MediRemind',
    errors: [],
    formData: {}
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('auth/login', {
      title: 'Login - MediRemind',
      errors: errors.array(),
      formData: req.body
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, isActive: true });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', {
        title: 'Login - MediRemind',
        errors: [{ msg: 'Invalid email or password' }],
        formData: req.body
      });
    }

    req.session.userId = user._id;
    
    // Redirect based on role
    if (user.role === 'doctor') {
      res.redirect('/doctor/dashboard');
    } else {
      res.redirect('/patient/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - MediRemind',
      errors: [{ msg: 'An error occurred. Please try again.' }],
      formData: req.body
    });
  }
};

const register = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('auth/register', {
      title: 'Register - MediRemind',
      errors: errors.array(),
      formData: req.body
    });
  }

  const { name, email, password, role, clinicName } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register - MediRemind',
        errors: [{ msg: 'Email already registered' }],
        formData: req.body
      });
    }

    // Create new user
    const userData = { name, email, password, role };
    if (role === 'doctor') {
      userData.clinicName = clinicName;
    }

    const user = new User(userData);
    await user.save();

    req.session.userId = user._id;
    
    // Redirect based on role
    if (user.role === 'doctor') {
      res.redirect('/doctor/dashboard');
    } else {
      res.redirect('/patient/dashboard');
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register - MediRemind',
      errors: [{ msg: 'An error occurred. Please try again.' }],
      formData: req.body
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

module.exports = {
  renderLogin,
  renderRegister,
  login,
  register,
  logout
};