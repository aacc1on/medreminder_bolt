const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

const checkUser = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      res.locals.user = user;
      req.user = user;
    } catch (error) {
      console.error('Error checking user:', error);
      res.locals.user = null;
      req.user = null;
    }
  } else {
    res.locals.user = null;
    req.user = null;
  }
  next();
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).render('403', { 
        title: 'Access Denied',
        message: `This page is only accessible to ${role}s` 
      });
    }
    next();
  };
};

module.exports = {
  requireAuth,
  checkUser,
  requireRole
};