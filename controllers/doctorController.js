const User = require('../models/User');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

const renderDashboard = async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Get doctor's patients
    const patients = await User.find({ doctorId, role: 'patient' });
    
    // Get recent medications and appointments
    const recentMedications = await Medication.find({ doctorId })
      .populate('patientId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
      
    const upcomingAppointments = await Appointment.find({ 
      doctorId,
      date: { $gte: new Date() },
      status: 'scheduled'
    })
      .populate('patientId', 'name')
      .sort({ date: 1 })
      .limit(5);

    const stats = {
      totalPatients: patients.length,
      activeMedications: await Medication.countDocuments({ doctorId, isActive: true }),
      upcomingAppointments: upcomingAppointments.length,
      connectedPatients: patients.filter(p => p.telegramId).length
    };

    res.render('doctor/dashboard', {
      title: 'Doctor Dashboard - MediRemind',
      patients,
      recentMedications,
      upcomingAppointments,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const renderPatients = async (req, res) => {
  try {
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    }).sort({ createdAt: -1 });

    res.render('doctor/patients', {
      title: 'My Patients - MediRemind',
      patients
    });
  } catch (error) {
    console.error('Patients error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const addPatient = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { patientEmail } = req.body;

  try {
    const patient = await User.findOne({ 
      email: patientEmail, 
      role: 'patient' 
    });

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    if (patient.doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient already has a doctor assigned' 
      });
    }

    patient.doctorId = req.user._id;
    await patient.save();

    res.json({ 
      success: true, 
      message: 'Patient added successfully',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Add patient error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const renderNewPrescription = async (req, res) => {
  try {
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });

    res.render('doctor/new-prescription', {
      title: 'New Prescription - MediRemind',
      patients,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('New prescription error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const createPrescription = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });
    
    return res.render('doctor/new-prescription', {
      title: 'New Prescription - MediRemind',
      patients,
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { patientId, name, dosage, timesPerDay, startDate, endDate, instructions } = req.body;
    
    // Parse times from comma-separated string
    const times = timesPerDay.split(',').map(time => time.trim());

    const medication = new Medication({
      patientId,
      doctorId: req.user._id,
      name,
      dosage,
      timesPerDay: times,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instructions
    });

    await medication.save();
    res.redirect('/doctor/dashboard?success=prescription-created');
  } catch (error) {
    console.error('Create prescription error:', error);
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });
    
    res.render('doctor/new-prescription', {
      title: 'New Prescription - MediRemind',
      patients,
      errors: [{ msg: 'An error occurred. Please try again.' }],
      formData: req.body
    });
  }
};

const renderNewAppointment = async (req, res) => {
  try {
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });

    res.render('doctor/new-appointment', {
      title: 'Schedule Appointment - MediRemind',
      patients,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('New appointment error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const createAppointment = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });
    
    return res.render('doctor/new-appointment', {
      title: 'Schedule Appointment - MediRemind',
      patients,
      errors: errors.array(),
      formData: req.body
    });
  }

  try {
    const { patientId, date, time, location, notes } = req.body;

    const appointment = new Appointment({
      patientId,
      doctorId: req.user._id,
      date: new Date(date),
      time,
      location,
      notes
    });

    await appointment.save();
    res.redirect('/doctor/dashboard?success=appointment-created');
  } catch (error) {
    console.error('Create appointment error:', error);
    const patients = await User.find({ 
      doctorId: req.user._id, 
      role: 'patient' 
    });
    
    res.render('doctor/new-appointment', {
      title: 'Schedule Appointment - MediRemind',
      patients,
      errors: [{ msg: 'An error occurred. Please try again.' }],
      formData: req.body
    });
  }
};

module.exports = {
  renderDashboard,
  renderPatients,
  addPatient,
  renderNewPrescription,
  createPrescription,
  renderNewAppointment,
  createAppointment
};