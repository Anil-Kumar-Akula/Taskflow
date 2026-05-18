const express = require('express');
const User = require('../models/User');
const { auth, managerOnly } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Get all employees under this manager
router.get('/', auth, managerOnly, async (req, res) => {
  try {
    const users = await User.find({ managerId: req.user._id }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create employee
router.post('/', auth, managerOnly, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const employee = await User.create({
      name, email, password,
      department: department || '',
      role: 'employee',
      managerId: req.user._id
    });

    await sendWelcomeEmail(employee, password, req.user.name);
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update employee
router.put('/:id', auth, managerOnly, async (req, res) => {
  try {
    const { name, department, isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user._id },
      { name, department, isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single employee
router.get('/:id', auth, managerOnly, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, managerId: req.user._id });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
