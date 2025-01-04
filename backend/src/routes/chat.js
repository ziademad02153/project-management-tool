const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { Message, Conversation } = require('../models/Chat');
const User = require('../models/User');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/chat'));
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

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'username avatar')
    .populate('lastMessage')
    .sort('-updatedAt');

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );

      return {
        _id: conv._id,
        name: conv.type === 'group' ? conv.name : otherParticipant.username,
        avatar: conv.type === 'group' ? conv.avatar : otherParticipant.avatar,
        lastMessage: conv.lastMessage,
        type: conv.type,
        updatedAt: conv.updatedAt
      };
    });

    res.json(formattedConversations);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get messages for a conversation
router.get('/messages/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'المحادثة غير موجودة' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'غير مصرح' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate('sender', 'username avatar')
    .sort('createdAt');

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Send a message
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversation, content, type = 'text' } = req.body;

    const conv = await Conversation.findById(conversation);
    if (!conv) {
      return res.status(404).json({ msg: 'المحادثة غير موجودة' });
    }

    // Check if user is participant
    if (!conv.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'غير مصرح' });
    }

    const message = new Message({
      conversation,
      sender: req.user.id,
      content,
      type,
      readBy: [{ user: req.user.id }]
    });

    await message.save();

    // Update conversation
    conv.lastMessage = message._id;
    conv.updatedAt = new Date();
    await conv.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.json(message);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { conversation } = req.body;
    const file = req.file;

    const conv = await Conversation.findById(conversation);
    if (!conv) {
      return res.status(404).json({ msg: 'المحادثة غير موجودة' });
    }

    // Check if user is participant
    if (!conv.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'غير مصرح' });
    }

    const type = file.mimetype.startsWith('image/') ? 'image' : 'file';
    const content = `/uploads/chat/${file.filename}`;

    const message = new Message({
      conversation,
      sender: req.user.id,
      content,
      type,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      readBy: [{ user: req.user.id }]
    });

    await message.save();

    // Update conversation
    conv.lastMessage = message._id;
    conv.updatedAt = new Date();
    await conv.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.json(message);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create new conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participants, type = 'direct', name } = req.body;

    // Validate participants
    if (!participants || participants.length === 0) {
      return res.status(400).json({ msg: 'يجب تحديد المشاركين' });
    }

    // Add current user to participants
    const allParticipants = [...new Set([...participants, req.user.id])];

    // Check if direct conversation already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const existingConv = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants }
      });

      if (existingConv) {
        return res.json(existingConv);
      }
    }

    const conversation = new Conversation({
      participants: allParticipants,
      type,
      name: type === 'group' ? name : undefined,
      admin: type === 'group' ? req.user.id : undefined
    });

    await conversation.save();
    await conversation.populate('participants', 'username avatar');

    res.json(conversation);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete conversation
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ msg: 'المحادثة غير موجودة' });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: 'غير مصرح' });
    }

    // For group chats, only admin can delete
    if (conversation.type === 'group' && 
        conversation.admin.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'فقط المسؤول يمكنه حذف المجموعة' });
    }

    // Delete all messages
    await Message.deleteMany({ conversation: req.params.id });
    await conversation.remove();

    res.json({ msg: 'تم حذف المحادثة' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
