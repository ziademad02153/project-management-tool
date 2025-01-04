const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const Notification = require('../models/Notification');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userPath = path.join(__dirname, '../../uploads', req.user.id.toString());
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true });
    }
    cb(null, userPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

// Get all files
router.get('/', auth, async (req, res) => {
  try {
    const { path = '/' } = req.query;
    const files = await File.find({
      user: req.user.id,
      path: new RegExp(`^${path}[^/]*$`) // Get files only in current directory
    }).sort({ type: -1, name: 1 }); // Sort folders first, then by name

    res.json(files);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Upload files
router.post('/upload', auth, upload.array('files'), async (req, res) => {
  try {
    const { path = '/' } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const newFile = new File({
        name: file.originalname,
        path: path,
        type: 'file',
        size: file.size,
        mimeType: file.mimetype,
        user: req.user.id,
        project: req.body.project,
        team: req.body.team
      });

      await newFile.save();
      uploadedFiles.push(newFile);
    }

    // Create notification
    if (req.body.team) {
      const notification = new Notification({
        user: req.user.id,
        title: 'ملفات جديدة',
        message: `تم إضافة ${uploadedFiles.length} ملفات جديدة`,
        type: 'file'
      });
      await notification.save();
    }

    res.json(uploadedFiles);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create folder
router.post('/folder', auth, async (req, res) => {
  try {
    const { path, name } = req.body;
    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;

    const existingFolder = await File.findOne({
      user: req.user.id,
      path: fullPath,
      type: 'folder'
    });

    if (existingFolder) {
      return res.status(400).json({ msg: 'المجلد موجود بالفعل' });
    }

    const folder = new File({
      name,
      path: path,
      type: 'folder',
      size: 0,
      mimeType: 'folder',
      user: req.user.id
    });

    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Download file
router.get('/download/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    if (file.user.toString() !== req.user.id && 
        !file.sharedWith.some(share => 
          share.user.toString() === req.user.id)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const filePath = path.join(
      __dirname,
      '../../uploads',
      file.user.toString(),
      file.name
    );

    res.download(filePath, file.name);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete file or folder
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    if (file.type === 'folder') {
      // Delete all files in folder
      await File.deleteMany({
        user: req.user.id,
        path: new RegExp(`^${file.path}${file.name}/`)
      });

      // Delete physical folder
      const folderPath = path.join(
        __dirname,
        '../../uploads',
        req.user.id.toString(),
        file.name
      );
      if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath, { recursive: true });
      }
    } else {
      // Delete physical file
      const filePath = path.join(
        __dirname,
        '../../uploads',
        req.user.id.toString(),
        file.name
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await file.remove();
    res.json({ msg: 'File removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Share file
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { users, permission } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Add new shares
    const newShares = users.map(userId => ({
      user: userId,
      permission
    }));

    file.sharedWith.push(...newShares);
    await file.save();

    // Create notifications for shared users
    const notifications = users.map(userId => ({
      user: userId,
      title: 'مشاركة ملف',
      message: `تمت مشاركة الملف ${file.name} معك`,
      type: 'file',
      reference: file._id
    }));

    await Notification.insertMany(notifications);

    res.json(file);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
