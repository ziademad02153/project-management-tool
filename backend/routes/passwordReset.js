const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Token = require('../models/Token');

// إعداد Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// طلب إعادة تعيين كلمة المرور
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'البريد الإلكتروني غير مسجل' });
    }

    // إنشاء توكن
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await Token.create({
      userId: user._id,
      token: hash,
      expiresAt: Date.now() + 3600000 // ينتهي بعد ساعة
    });

    // إرسال البريد الإلكتروني
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور',
      html: `
        <h1>طلب إعادة تعيين كلمة المرور</h1>
        <p>لإعادة تعيين كلمة المرور الخاصة بك، انقر على الرابط التالي:</p>
        <a href="${resetUrl}">إعادة تعيين كلمة المرور</a>
        <p>هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'حدث خطأ في الخادم' });
  }
});

// إعادة تعيين كلمة المرور
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const token = await Token.findOne({ token: resetToken, expiresAt: { $gt: Date.now() } });

    if (!token) {
      return res.status(400).json({ msg: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية' });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }

    // تحديث كلمة المرور
    user.password = req.body.password;
    await user.save();

    // حذف التوكن
    await token.deleteOne();

    res.json({ msg: 'تم تغيير كلمة المرور بنجاح' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'حدث خطأ في الخادم' });
  }
});

module.exports = router;
