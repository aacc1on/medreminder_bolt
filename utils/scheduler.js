const cron = require('node-cron');
const moment = require('moment');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const { sendMedicationReminder, sendAppointmentReminder } = require('../telegram-bot/bot');

console.log('🕒 Scheduler started - checking for reminders every 5 minutes');

// Check for medication reminders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔍 Checking for medication reminders...');
    
    const currentTime = moment().format('HH:mm');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Find active medications for today
    const medications = await Medication.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('patientId', 'name telegramId');

    let remindersSent = 0;

    for (const medication of medications) {
      // Skip if patient doesn't have Telegram connected
      if (!medication.patientId.telegramId) continue;

      // Check if any of the scheduled times match current time
      const shouldRemind = medication.timesPerDay.some(scheduledTime => {
        const [schedHour, schedMin] = scheduledTime.split(':');
        const [currHour, currMin] = currentTime.split(':');
        
        // Check if within 5-minute window
        const schedMinutes = parseInt(schedHour) * 60 + parseInt(schedMin);
        const currMinutes = parseInt(currHour) * 60 + parseInt(currMin);
        
        return Math.abs(schedMinutes - currMinutes) <= 2; // 2 minute tolerance
      });

      if (shouldRemind) {
        // Check if reminder was already sent today
        const today = new Date();
        const lastReminded = medication.lastReminded;
        
        if (!lastReminded || !moment(lastReminded).isSame(today, 'day')) {
          const success = await sendMedicationReminder(
            medication.patientId.telegramId, 
            medication
          );
          
          if (success) {
            medication.lastReminded = new Date();
            await medication.save();
            remindersSent++;
            console.log(`📨 Medication reminder sent to ${medication.patientId.name} for ${medication.name}`);
          }
        }
      }
    }

    if (remindersSent > 0) {
      console.log(`✅ Sent ${remindersSent} medication reminders`);
    }

  } catch (error) {
    console.error('Error in medication reminder cron:', error);
  }
});

// Check for appointment reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔍 Checking for appointment reminders...');
    
    // Find appointments for tomorrow that haven't been reminded
    const appointments = await Appointment.findAppointmentsForTomorrow();
    
    let remindersSent = 0;

    for (const appointment of appointments) {
      // Skip if patient doesn't have Telegram connected
      if (!appointment.patientId.telegramId) continue;

      const success = await sendAppointmentReminder(
        appointment.patientId.telegramId,
        appointment
      );

      if (success) {
        appointment.reminderSent = true;
        await appointment.save();
        remindersSent++;
        console.log(`📨 Appointment reminder sent to ${appointment.patientId.name}`);
      }
    }

    if (remindersSent > 0) {
      console.log(`✅ Sent ${remindersSent} appointment reminders`);
    } else {
      console.log('📅 No appointment reminders to send today');
    }

  } catch (error) {
    console.error('Error in appointment reminder cron:', error);
  }
});

// Health check - runs every hour
cron.schedule('0 * * * *', () => {
  console.log(`💓 Scheduler health check - ${new Date().toISOString()}`);
});