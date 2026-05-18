const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, managerOnly } = require('../middleware/auth');

const router = express.Router();

// Manager dashboard overview
router.get('/manager', auth, managerOnly, async (req, res) => {
  try {
    const managerId = req.user._id;
    const employees = await User.find({ managerId, isActive: true });
    const employeeIds = employees.map(e => e._id);

    const allTasks = await Task.find({ assignedBy: managerId });
    const summary = {
      totalEmployees: employees.length,
      totalTasks: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      approved: allTasks.filter(t => t.status === 'approved').length,
      awaitingApproval: allTasks.filter(t => t.status === 'completed').length,
    };

    // Per-employee performance
    const employeeStats = await Promise.all(employees.map(async (emp) => {
      const tasks = allTasks.filter(t => t.assignedTo.toString() === emp._id.toString());
      const approved = tasks.filter(t => t.status === 'approved').length;
      const total = tasks.length;
      const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      return {
        employee: { _id: emp._id, name: emp.name, email: emp.email, department: emp.department },
        total, pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        approved, completionRate
      };
    }));

    // Monthly task trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentTasks = allTasks.filter(t => new Date(t.createdAt) >= sixMonthsAgo);

    const monthlyData = {};
    recentTasks.forEach(task => {
      const month = new Date(task.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) monthlyData[month] = { assigned: 0, approved: 0 };
      monthlyData[month].assigned++;
      if (task.status === 'approved') monthlyData[month].approved++;
    });

    res.json({ summary, employeeStats, monthlyData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee dashboard
router.get('/employee', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ assignedTo: userId });

    const summary = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      approved: tasks.filter(t => t.status === 'approved').length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'approved').length / tasks.length) * 100)
        : 0
    };

    // Weekly tasks (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const weekTasks = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d >= start && d < end;
      });
      weeklyData.push({
        week: `Week ${4 - i}`,
        assigned: weekTasks.length,
        approved: weekTasks.filter(t => t.status === 'approved').length
      });
    }

    // Recent tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ summary, weeklyData, recentTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee performance detail (for manager to view per employee)
router.get('/employee/:id', auth, managerOnly, async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const tasks = await Task.find({ assignedTo: req.params.id, assignedBy: req.user._id })
      .sort({ createdAt: -1 });

    const summary = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      approved: tasks.filter(t => t.status === 'approved').length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'approved').length / tasks.length) * 100)
        : 0
    };

    // Monthly breakdown
    const monthlyData = {};
    tasks.forEach(task => {
      const month = new Date(task.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) monthlyData[month] = { assigned: 0, approved: 0 };
      monthlyData[month].assigned++;
      if (task.status === 'approved') monthlyData[month].approved++;
    });

    res.json({ employee, summary, monthlyData, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
