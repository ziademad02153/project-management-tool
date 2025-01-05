const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Token = require('../models/Token');

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

    // إرسال رابط إعادة تعيين كلمة المرور مباشرة للمستخدم
    const resetUrl = `https://z-project-management-tool.netlify.app/reset-password/${resetToken}`;
    res.json({ 
      msg: 'تم إنشاء رابط إعادة تعيين كلمة المرور',
      resetUrl: resetUrl,
      email: user.email
    });

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
