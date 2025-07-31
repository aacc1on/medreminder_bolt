const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes'); 
const patientRoutes = require('./routes/patientRoutes');

// Import middleware
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Չմիանամ հավելվածը եթե MongoDB-ին չի միացել
  process.exit(1);
});

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration with better error handling
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global middleware to check user on all routes
app.use('*', checkUser);

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'MediRemind - Medical Reminder System',
    user: res.locals.user || null
  });
});

app.use('/auth', authRoutes);
app.use('/doctor', requireAuth, doctorRoutes);
app.use('/patient', requireAuth, patientRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    user: res.locals.user || null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
    title: 'Server Error',
    user: res.locals.user || null
  });
});

// Start the scheduler only after successful DB connection
mongoose.connection.once('open', () => {
  try {
    require('./utils/scheduler');
    console.log('✅ Scheduler started');
  } catch (schedulerError) {
    console.error('⚠️ Scheduler failed to start:', schedulerError.message);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MediRemind server running on http://localhost:${PORT}`);
  console.log(`📱 Don't forget to start the Telegram bot: npm run bot`);
});