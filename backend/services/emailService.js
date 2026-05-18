const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to, subject, html
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
    // Don't throw — email failure shouldn't break the API
  }
};

const sendWelcomeEmail = async (employee, password, managerName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e94560; margin: 0; font-size: 28px;">TaskFlow</h1>
        <p style="color: #aaa; margin: 5px 0 0;">Team Task Management</p>
      </div>
      <h2 style="color: #333;">Welcome to TaskFlow, ${employee.name}! 🎉</h2>
      <p style="color: #555;">Your account has been created by <strong>${managerName}</strong>. Here are your login credentials:</p>
      <div style="background: #fff; border: 2px solid #e94560; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${employee.email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
      </div>
      <p style="color: #555;">Please log in and change your password immediately.</p>
      <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #e94560; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Login to TaskFlow</a>
      <p style="color: #999; font-size: 12px; margin-top: 25px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  await sendEmail({ to: employee.email, subject: 'Welcome to TaskFlow - Your Account Details', html });
};

const sendTaskAssignedEmail = async (employee, task, managerName) => {
  const priorityColors = { low: '#28a745', medium: '#ffc107', high: '#fd7e14', critical: '#dc3545' };
  const color = priorityColors[task.priority] || '#007bff';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <h1 style="color: #e94560; margin: 0; font-size: 28px;">TaskFlow</h1>
      </div>
      <h2 style="color: #333;">📋 New Task Assigned, ${employee.name}!</h2>
      <p style="color: #555;">Your manager <strong>${managerName}</strong> has assigned you a new task:</p>
      <div style="background: #fff; border-left: 4px solid ${color}; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 10px; color: #1a1a2e;">${task.title}</h3>
        ${task.description ? `<p style="color: #555; margin: 0 0 10px;">${task.description}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="background: ${color}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">${task.priority}</span></p>
        ${task.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>` : ''}
        ${task.category ? `<p style="margin: 5px 0;"><strong>Category:</strong> ${task.category}</p>` : ''}
      </div>
      <p style="color: #555;">Log in to TaskFlow to pick up this task and get started.</p>
      <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #e94560; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open TaskFlow</a>
    </div>
  `;
  await sendEmail({ to: employee.email, subject: `[TaskFlow] New Task: ${task.title}`, html });
};

module.exports = { sendEmail, sendWelcomeEmail, sendTaskAssignedEmail };
