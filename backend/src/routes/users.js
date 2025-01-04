const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/avatars',
  filename: function(req, file, cb) {
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('avatar');

// Check File Type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, position, phone, bio } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (position) user.position = position;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload avatar
router.post('/avatar', auth, upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload a file' });
    }

    const user = await User.findById(req.user.id);
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments({ members: req.user.id });
    const completedTasks = await Task.countDocuments({ 
      assignedTo: req.user.id,
      status: 'completed'
    });
    const pendingTasks = await Task.countDocuments({ 
      assignedTo: req.user.id,
      status: { $ne: 'completed' }
    });

    res.json({
      totalProjects,
      completedTasks,
      pendingTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
