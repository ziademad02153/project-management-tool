const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // في الدقائق
    default: 0
  },
  description: String,
  tags: [String],
  billable: {
    type: Boolean,
    default: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['running', 'paused', 'completed'],
    default: 'running'
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number,
    reason: String
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, {
  timestamps: true
});

// حساب المدة الإجمالية
timeEntrySchema.methods.calculateDuration = function() {
  if (this.endTime) {
    let totalDuration = (this.endTime - this.startTime) / 1000 / 60; // تحويل إلى دقائق
    
    // طرح وقت الاستراحات
    if (this.breaks && this.breaks.length > 0) {
      const breaksDuration = this.breaks.reduce((total, break_) => {
        return total + (break_.duration || 0);
      }, 0);
      totalDuration -= breaksDuration;
    }
    
    this.duration = totalDuration;
    return totalDuration;
  }
  return 0;
};

// حساب التكلفة
timeEntrySchema.methods.calculateCost = function() {
  if (this.billable && this.hourlyRate > 0) {
    return (this.duration / 60) * this.hourlyRate;
  }
  return 0;
};

// إضافة مؤشرات للبحث السريع
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
timeEntrySchema.index({ task: 1, startTime: -1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
