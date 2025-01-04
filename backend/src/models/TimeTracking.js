const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  description: String,
  tags: [String],
  category: {
    type: String,
    enum: ['development', 'design', 'meeting', 'research', 'other'],
    default: 'other'
  },
  isManual: {
    type: Boolean,
    default: false
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  productivity: {
    type: Number, // 1-100
    default: 100
  }
});

const productivityGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  targetHours: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  startDate: Date,
  endDate: Date,
  categories: [{
    name: String,
    targetHours: Number
  }],
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number, // percentage
      default: 80
    }
  }
});

const workScheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workDays: [{
    day: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    startTime: String, // HH:mm format
    endTime: String,
    breaks: [{
      startTime: String,
      endTime: String
    }]
  }],
  timezone: String,
  workHoursPerDay: Number,
  flexibleHours: {
    type: Boolean,
    default: false
  },
  overtimeAllowed: {
    type: Boolean,
    default: true
  },
  maxOvertimeHours: {
    type: Number,
    default: 2
  }
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
const ProductivityGoal = mongoose.model('ProductivityGoal', productivityGoalSchema);
const WorkSchedule = mongoose.model('WorkSchedule', workScheduleSchema);

module.exports = { TimeEntry, ProductivityGoal, WorkSchedule };
