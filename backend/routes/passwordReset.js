const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Token = require('../models/Token');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'Email not registered' });
    }

    // Create token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await Token.create({
      userId: user._id,
      token: hash,
      expiresAt: Date.now() + 3600000 // expires in 1 hour
    });

    // Send reset link to user
    const resetUrl = `https://z-project-management-tool.netlify.app/reset-password/${resetToken}`;
    res.json({ 
      msg: 'Password reset link created',
      resetUrl: resetUrl,
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const token = await Token.findOne({ token: resetToken, expiresAt: { $gt: Date.now() } });

    if (!token) {
      return res.status(400).json({ msg: 'Invalid or expired reset link' });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update password
    user.password = req.body.password;
    await user.save();

    // Delete token
    await token.deleteOne();

    res.json({ msg: 'Password changed successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
