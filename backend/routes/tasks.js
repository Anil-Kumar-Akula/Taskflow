const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, managerOnly } = require('../middleware/auth');
const { sendTaskAssignedEmail } = require('../services/emailService');

const router = express.Router();

// Manager: Create/assign task
router.post('/', auth, managerOnly, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, category } = req.body;
    const employee = await User.findOne({ _id: assignedTo, managerId: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const task = await Task.create({
      title, description, assignedTo, assignedBy: req.user._id,
      priority, dueDate, category
    });

    // Send email notification
    await sendTaskAssignedEmail(employee, task, req.user.name);
    await Task.findByIdAndUpdate(task._id, { emailSent: true });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tasks (manager sees all their team's tasks; employee sees their own)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query.assignedBy = req.user._id;
    } else {
      query.assignedTo = req.user._id;
    }

    const { status, priority, employeeId } = req.query;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (employeeId && req.user.role === 'manager') query.assignedTo = employeeId;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee: Pick up task (pending → in_progress)
router.put('/:id/pickup', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id, status: 'pending' });
    if (!task) return res.status(404).json({ message: 'Task not found or not in pending state' });

    task.status = 'in_progress';
    task.pickedUpAt = new Date();
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Employee: Mark task as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { completionNote } = req.body;
    const task = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id, status: 'in_progress' });
    if (!task) return res.status(404).json({ message: 'Task not found or not in progress' });

    task.status = 'completed';
    task.completionNote = completionNote || '';
    task.completedAt = new Date();
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager: Approve or reject task
router.put('/:id/review', auth, managerOnly, async (req, res) => {
  try {
    const { action, managerNote } = req.body; // action: 'approve' | 'reject'
    const task = await Task.findOne({ _id: req.params.id, assignedBy: req.user._id, status: 'completed' });
    if (!task) return res.status(404).json({ message: 'Task not found or not completed yet' });

    task.status = action === 'approve' ? 'approved' : 'rejected';
    task.managerNote = managerNote || '';
    task.approvedAt = action === 'approve' ? new Date() : null;
    await task.save();

    // If rejected, put back to in_progress for employee to redo
    if (action === 'reject') {
      task.status = 'in_progress';
      await task.save();
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager: Update task details
router.put('/:id', auth, managerOnly, async (req, res) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedBy: req.user._id },
      { title, description, priority, dueDate, category },
      { new: true }
    ).populate('assignedTo', 'name email').populate('assignedBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
