const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail } = require('./emailService');

const generateWeeklyReport = async (managerId) => {
  const manager = await User.findById(managerId);
  const employees = await User.find({ managerId, isActive: true });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date();

  const weekTasks = await Task.find({
    assignedBy: managerId,
    createdAt: { $gte: weekStart, $lte: weekEnd }
  }).populate('assignedTo', 'name email department');

  const allTasks = await Task.find({ assignedBy: managerId });

  const employeeReports = await Promise.all(employees.map(async (emp) => {
    const empWeekTasks = weekTasks.filter(t => t.assignedTo?._id?.toString() === emp._id.toString());
    const empAllTasks = allTasks.filter(t => t.assignedTo?.toString() === emp._id.toString());
    return {
      name: emp.name,
      email: emp.email,
      department: emp.department,
      weeklyAssigned: empWeekTasks.length,
      weeklyCompleted: empWeekTasks.filter(t => ['completed', 'approved'].includes(t.status)).length,
      weeklyApproved: empWeekTasks.filter(t => t.status === 'approved').length,
      totalAllTime: empAllTasks.length,
      totalApproved: empAllTasks.filter(t => t.status === 'approved').length,
      completionRate: empAllTasks.length > 0
        ? Math.round((empAllTasks.filter(t => t.status === 'approved').length / empAllTasks.length) * 100)
        : 0,
      tasksSummary: empWeekTasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate
      }))
    };
  }));

  return {
    manager,
    weekStart,
    weekEnd,
    weeklyOverall: {
      total: weekTasks.length,
      completed: weekTasks.filter(t => ['completed', 'approved'].includes(t.status)).length,
      approved: weekTasks.filter(t => t.status === 'approved').length,
      pending: weekTasks.filter(t => t.status === 'pending').length,
      inProgress: weekTasks.filter(t => t.status === 'in_progress').length,
    },
    employeeReports
  };
};

const generateReportHTML = (report) => {
  const dateRange = `${new Date(report.weekStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })} - ${new Date(report.weekEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  const statusBadge = (status) => {
    const colors = { pending: '#ffc107', in_progress: '#17a2b8', completed: '#28a745', approved: '#007bff', rejected: '#dc3545' };
    const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', approved: 'Approved', rejected: 'Rejected' };
    return `<span style="background:${colors[status]||'#6c757d'};color:white;padding:2px 8px;border-radius:10px;font-size:11px;">${labels[status]||status}</span>`;
  };

  const employeeRows = report.employeeReports.map(emp => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px;">${emp.name}<br><small style="color:#999;">${emp.department || 'N/A'}</small></td>
      <td style="padding: 12px; text-align:center;">${emp.weeklyAssigned}</td>
      <td style="padding: 12px; text-align:center;">${emp.weeklyCompleted}</td>
      <td style="padding: 12px; text-align:center;">${emp.weeklyApproved}</td>
      <td style="padding: 12px; text-align:center;">
        <div style="background:#e0e0e0;border-radius:10px;height:8px;width:80px;display:inline-block;vertical-align:middle;">
          <div style="background:#28a745;height:8px;border-radius:10px;width:${emp.completionRate}%;"></div>
        </div>
        <span style="margin-left:5px;">${emp.completionRate}%</span>
      </td>
    </tr>
  `).join('');

  const taskDetailSections = report.employeeReports
    .filter(e => e.tasksSummary.length > 0)
    .map(emp => `
      <div style="margin-bottom: 20px;">
        <h4 style="color:#1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 5px;">${emp.name}</h4>
        ${emp.tasksSummary.map(t => `
          <div style="background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:500;">${t.title}</span>
            <span>${statusBadge(t.status)}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f0f0f0; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: #1a1a2e; padding: 30px; text-align: center;">
      <h1 style="color: #e94560; margin: 0; font-size: 32px;">TaskFlow</h1>
      <p style="color: #aaa; margin: 5px 0 0;">Weekly Performance Report</p>
      <p style="color: #ccc; margin: 10px 0 0; font-size: 14px;">📅 ${dateRange}</p>
    </div>

    <div style="padding: 30px;">
      <h2 style="color: #1a1a2e;">Hello ${report.manager.name},</h2>
      <p style="color: #555;">Here's your team's weekly performance summary.</p>

      <div style="display: grid; grid-template-columns: repeat(4,1fr); gap: 15px; margin: 20px 0;">
        ${[
          ['Total Assigned', report.weeklyOverall.total, '#e94560'],
          ['Approved', report.weeklyOverall.approved, '#28a745'],
          ['In Progress', report.weeklyOverall.inProgress, '#17a2b8'],
          ['Pending', report.weeklyOverall.pending, '#ffc107']
        ].map(([label, val, color]) => `
          <div style="background:${color}15;border:2px solid ${color};border-radius:8px;padding:15px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:${color};">${val}</div>
            <div style="font-size:12px;color:#555;">${label}</div>
          </div>
        `).join('')}
      </div>

      <h3 style="color:#1a1a2e;border-bottom:2px solid #e94560;padding-bottom:8px;">Team Performance</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:25px;">
        <thead>
          <tr style="background:#1a1a2e;color:white;">
            <th style="padding:12px;text-align:left;">Employee</th>
            <th style="padding:12px;text-align:center;">Assigned</th>
            <th style="padding:12px;text-align:center;">Completed</th>
            <th style="padding:12px;text-align:center;">Approved</th>
            <th style="padding:12px;text-align:center;">All-time Rate</th>
          </tr>
        </thead>
        <tbody>${employeeRows}</tbody>
      </table>

      ${taskDetailSections ? `
        <h3 style="color:#1a1a2e;border-bottom:2px solid #e94560;padding-bottom:8px;">Task Details This Week</h3>
        ${taskDetailSections}
      ` : '<p style="color:#999;">No tasks were assigned this week.</p>'}
    </div>

    <div style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;margin:0;font-size:12px;">Generated automatically by TaskFlow | Do not reply to this email</p>
    </div>
  </div>
</body>
</html>
  `;
};

const sendWeeklyReports = async (specificManagerId = null) => {
  try {
    let managers;
    if (specificManagerId) {
      managers = await User.find({ _id: specificManagerId, role: 'manager' });
    } else {
      managers = await User.find({ role: 'manager', isActive: true });
    }

    for (const manager of managers) {
      const report = await generateWeeklyReport(manager._id);
      const html = generateReportHTML(report);
      await sendEmail({
        to: manager.email,
        subject: `📊 TaskFlow Weekly Report - Week of ${new Date(report.weekStart).toLocaleDateString('en-IN')}`,
        html
      });
    }
    console.log(`Weekly reports sent for ${managers.length} manager(s)`);
  } catch (err) {
    console.error('Weekly report error:', err);
  }
};

module.exports = { sendWeeklyReports, generateWeeklyReport };
