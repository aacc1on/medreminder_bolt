const User = require('../models/User');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');

const renderDashboard = async (req, res) => {
  try {
    const patientId = req.user._id;
    
    // Get patient's medications
    const medications = await Medication.find({ 
      patientId, 
      isActive: true 
    }).populate('doctorId', 'name clinicName').sort({ createdAt: -1 });
    
    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patientId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }).populate('doctorId', 'name clinicName').sort({ date: 1 });

    // Get today's medications
    const today = new Date();
    const todaysMedications = medications.filter(med => {
      return med.startDate <= today && med.endDate >= today;
    });

    const stats = {
      activeMedications: medications.length,
      upcomingAppointments: upcomingAppointments.length,
      todaysMedications: todaysMedications.length,
      telegramConnected: !!req.user.telegramId
    };

    res.render('patient/dashboard', {
      title: 'Patient Dashboard - MediRemind',
      medications,
      upcomingAppointments,
      todaysMedications,
      stats
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const renderConnectBot = (req, res) => {
  res.render('patient/connect-bot', {
    title: 'Connect Telegram Bot - MediRemind',
    telegramConnected: !!req.user.telegramId
  });
};

const disconnectBot = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { 
      telegramId: null 
    });
    
    res.redirect('/patient/connect-bot?success=disconnected');
  } catch (error) {
    console.error('Disconnect bot error:', error);
    res.redirect('/patient/connect-bot?error=disconnect-failed');
  }
};

const renderMedications = async (req, res) => {
  try {
    const medications = await Medication.find({ 
      patientId: req.user._id 
    }).populate('doctorId', 'name clinicName').sort({ createdAt: -1 });

    res.render('patient/medications', {
      title: 'My Medications - MediRemind',
      medications
    });
  } catch (error) {
    console.error('Medications error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

const renderAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ 
      patientId: req.user._id 
    }).populate('doctorId', 'name clinicName').sort({ date: -1 });

    res.render('patient/appointments', {
      title: 'My Appointments - MediRemind',
      appointments
    });
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).render('500', { title: 'Server Error' });
  }
};

module.exports = {
  renderDashboard,
  renderConnectBot,
  disconnectBot,
  renderMedications,
  renderAppointments
};