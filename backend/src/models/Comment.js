const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: Date
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'celebrate', 'support', 'insightful']
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }]
}, {
  timestamps: true
});

// إضافة مؤشرات للبحث السريع
commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ projectId: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

// دالة لاستخراج المستخدمين المذكورين في التعليق
commentSchema.methods.extractMentions = function(content) {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      userId: match[2]
    });
  }
  
  return mentions;
};

module.exports = mongoose.model('Comment', commentSchema);
