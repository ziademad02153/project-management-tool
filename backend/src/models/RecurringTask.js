const mongoose = require('mongoose');

const recurringTaskSchema = new mongoose.Schema({
  baseTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  customFrequency: {
    days: [Number], // أيام الأسبوع (0-6)
    dates: [Number], // أيام الشهر (1-31)
    months: [Number], // أشهر السنة (0-11)
    time: String // وقت محدد للتكرار
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  lastGenerated: Date,
  nextGeneration: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  generatedTasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    generatedFor: Date,
    status: String
  }],
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    advance: {
      type: Number,
      default: 24 // ساعات قبل الموعد
    }
  },
  autoAssign: {
    enabled: {
      type: Boolean,
      default: false
    },
    rotation: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      order: Number
    }],
    currentIndex: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// دالة لحساب موعد التكرار القادم
recurringTaskSchema.methods.calculateNextGeneration = function() {
  const now = new Date();
  let next = new Date(now);

  switch (this.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      if (this.customFrequency) {
        // حساب التاريخ القادم بناءً على التكرار المخصص
        next = this.calculateCustomNextDate();
      }
  }

  this.nextGeneration = next;
  return next;
};

// دالة لإنشاء مهمة جديدة
recurringTaskSchema.methods.generateNewTask = async function() {
  const Task = mongoose.model('Task');
  const baseTask = await Task.findById(this.baseTask);
  
  if (!baseTask) return null;

  // إنشاء مهمة جديدة بنفس خصائص المهمة الأساسية
  const newTask = new Task({
    ...baseTask.toObject(),
    _id: undefined,
    status: 'pending',
    createdAt: new Date(),
    deadline: this.calculateTaskDeadline()
  });

  // تعيين المهمة تلقائياً إذا كان التعيين التلقائي مفعلاً
  if (this.autoAssign.enabled && this.autoAssign.rotation.length > 0) {
    const nextAssignee = this.autoAssign.rotation[this.autoAssign.currentIndex];
    newTask.assignedTo = nextAssignee.user;
    
    // تحديث مؤشر التعيين التلقائي
    this.autoAssign.currentIndex = (this.autoAssign.currentIndex + 1) % this.autoAssign.rotation.length;
  }

  await newTask.save();
  
  // تحديث قائمة المهام المنشأة
  this.generatedTasks.push({
    task: newTask._id,
    generatedFor: new Date(),
    status: 'pending'
  });

  this.lastGenerated = new Date();
  this.calculateNextGeneration();
  await this.save();

  return newTask;
};

// إضافة مؤشرات للبحث السريع
recurringTaskSchema.index({ project: 1, status: 1 });
recurringTaskSchema.index({ nextGeneration: 1 });
recurringTaskSchema.index({ 'generatedTasks.generatedFor': 1 });

module.exports = mongoose.model('RecurringTask', recurringTaskSchema);
