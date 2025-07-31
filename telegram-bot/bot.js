const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 MediRemind Telegram Bot started');

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🏥 Welcome to MediRemind Bot!

I'll help you remember your medications and appointments.

To connect your account, please use the command:
/connect your_email@example.com

Replace "your_email@example.com" with the email you used to register on MediRemind.
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Connect command
bot.onText(/\/connect (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const email = match[1].trim().toLowerCase();

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      bot.sendMessage(chatId, '❌ Please provide a valid email address.');
      return;
    }

    // Find user by email
    const user = await User.findOne({ email, role: 'patient' });
    
    if (!user) {
      bot.sendMessage(chatId, '❌ No patient account found with this email. Please register first on the MediRemind website.');
      return;
    }

    if (user.telegramId) {
      bot.sendMessage(chatId, '⚠️ This account is already connected to another Telegram account.');
      return;
    }

    // Update user with Telegram ID
    user.telegramId = chatId.toString();
    await user.save();

    bot.sendMessage(chatId, `✅ Successfully connected! 

Welcome ${user.name}! 

I'll now send you reminders for:
💊 Medication times
🏥 Doctor appointments (1 day before)

You can use /status to check your connection anytime.`);

  } catch (error) {
    console.error('Connect error:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
});

// Status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramId: chatId.toString() });
    
    if (!user) {
      bot.sendMessage(chatId, '❌ No account connected. Use /connect your_email@example.com to connect your account.');
      return;
    }

    const statusMessage = `
✅ Account Status: Connected
👤 Name: ${user.name}
📧 Email: ${user.email}
🔗 Account Type: ${user.role}

Your account is successfully connected! I'll send you reminders as scheduled by your doctor.
    `;

    bot.sendMessage(chatId, statusMessage);

  } catch (error) {
    console.error('Status error:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
});

// Disconnect command
bot.onText(/\/disconnect/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramId: chatId.toString() });
    
    if (!user) {
      bot.sendMessage(chatId, '❌ No account is currently connected.');
      return;
    }

    user.telegramId = null;
    await user.save();

    bot.sendMessage(chatId, '✅ Account disconnected successfully. You will no longer receive reminders.');

  } catch (error) {
    console.error('Disconnect error:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🤖 MediRemind Bot Commands:

/start - Start the bot and see welcome message
/connect <email> - Connect your MediRemind account
/status - Check your connection status
/disconnect - Disconnect your account
/help - Show this help message

📱 What I do:
• Send medication reminders at scheduled times
• Remind you about doctor appointments (1 day before)
• Help you stay on track with your treatment

For support, contact your doctor or visit the MediRemind website.
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Function to send medication reminder
const sendMedicationReminder = async (telegramId, medication) => {
  const message = `
💊 Medication Reminder

🔔 Time to take: ${medication.name}
💉 Dosage: ${medication.dosage}
⏰ Scheduled time: ${new Date().toLocaleTimeString('en-US', { 
  timeZone: 'Asia/Yerevan',
  hour: '2-digit', 
  minute: '2-digit' 
})}

${medication.instructions ? `📝 Instructions: ${medication.instructions}` : ''}

Take care! 🌟
  `;

  try {
    await bot.sendMessage(telegramId, message);
    return true;
  } catch (error) {
    console.error('Error sending medication reminder:', error);
    return false;
  }
};

// Function to send appointment reminder
const sendAppointmentReminder = async (telegramId, appointment) => {
  const appointmentDate = new Date(appointment.date);
  const message = `
🏥 Appointment Reminder

📅 You have a doctor visit tomorrow!
👨‍⚕️ Doctor: ${appointment.doctorId.name}
🏢 Clinic: ${appointment.doctorId.clinicName}
⏰ Time: ${appointment.time}
📍 Location: ${appointment.location}
📅 Date: ${appointmentDate.toLocaleDateString('en-US', { 
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

${appointment.notes ? `📝 Notes: ${appointment.notes}` : ''}

Don't forget! 📋
  `;

  try {
    await bot.sendMessage(telegramId, message);
    return true;
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    return false;
  }
};

// Export functions for use in scheduler
module.exports = {
  sendMedicationReminder,
  sendAppointmentReminder
};

// Handle errors
bot.on('error', (error) => {
  console.error('Telegram bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Telegram bot polling error:', error);
});