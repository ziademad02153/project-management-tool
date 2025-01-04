const mongoose = require('mongoose');
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const User = require('../models/User');

class AnalyticsService {
  // تحليل الإنتاجية
  static async getProductivityMetrics(userId, startDate, endDate) {
    const timeEntries = await TimeEntry.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalHours: { $sum: '$duration' },
          billableHours: {
            $sum: {
              $cond: [{ $eq: ['$billable', true] }, '$duration', 0]
            }
          },
          tasks: { $addToSet: '$task' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const tasks = await Task.aggregate([
      {
        $match: {
          assignedTo: mongoose.Types.ObjectId(userId),
          updatedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      timeTracking: timeEntries,
      taskCompletion: tasks,
      summary: {
        totalHours: timeEntries.reduce((sum, day) => sum + day.totalHours, 0),
        billableHours: timeEntries.reduce((sum, day) => sum + day.billableHours, 0),
        completedTasks: tasks.reduce((sum, day) => sum + day.completed, 0),
        totalTasks: tasks.reduce((sum, day) => sum + day.total, 0)
      }
    };
  }

  // تحليل أداء المشروع
  static async getProjectPerformance(projectId, startDate, endDate) {
    const project = await Project.findById(projectId);
    const tasks = await Task.find({ project: projectId });
    const timeEntries = await TimeEntry.find({
      project: projectId,
      startTime: { $gte: startDate, $lte: endDate }
    });

    const teamPerformance = await TimeEntry.aggregate([
      {
        $match: {
          project: mongoose.Types.ObjectId(projectId),
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalHours: { $sum: '$duration' },
          tasksWorkedOn: { $addToSet: '$task' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      }
    ]);

    const taskDistribution = {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };

    const timeTracking = {
      totalHours: timeEntries.reduce((sum, entry) => sum + entry.duration, 0),
      billableHours: timeEntries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration, 0)
    };

    return {
      projectDetails: project,
      taskDistribution,
      timeTracking,
      teamPerformance,
      progress: {
        totalTasks: tasks.length,
        completedTasks: taskDistribution.completed,
        percentageComplete: (taskDistribution.completed / tasks.length) * 100
      }
    };
  }

  // تحليل الموارد والتكاليف
  static async getResourceAnalytics(projectId) {
    const timeEntries = await TimeEntry.aggregate([
      {
        $match: { project: mongoose.Types.ObjectId(projectId) }
      },
      {
        $group: {
          _id: '$user',
          totalHours: { $sum: '$duration' },
          billableHours: {
            $sum: {
              $cond: [{ $eq: ['$billable', true] }, '$duration', 0]
            }
          },
          cost: {
            $sum: {
              $multiply: ['$duration', { $ifNull: ['$hourlyRate', 0] }]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      }
    ]);

    return {
      resourceUtilization: timeEntries,
      totalCost: timeEntries.reduce((sum, resource) => sum + resource.cost, 0),
      totalHours: timeEntries.reduce((sum, resource) => sum + resource.totalHours, 0)
    };
  }

  // تحليل الاتجاهات والتوقعات
  static async getTrendsAndForecasts(projectId) {
    const tasks = await Task.find({ project: projectId });
    const timeEntries = await TimeEntry.find({ project: projectId });

    // حساب معدل إكمال المهام
    const taskCompletionRates = tasks
      .filter(task => task.status === 'completed')
      .map(task => {
        const createdDate = task.createdAt;
        const completedDate = task.updatedAt;
        return (completedDate - createdDate) / (1000 * 60 * 60 * 24); // بالأيام
      });

    const averageCompletionTime = taskCompletionRates.reduce((a, b) => a + b, 0) / taskCompletionRates.length;

    // حساب الاتجاهات في استخدام الوقت
    const timeUsageTrends = await TimeEntry.aggregate([
      {
        $match: { project: mongoose.Types.ObjectId(projectId) }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            week: { $week: '$startTime' }
          },
          totalHours: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]);

    return {
      taskMetrics: {
        averageCompletionTime,
        standardDeviation: this.calculateStandardDeviation(taskCompletionRates),
        forecast: this.calculateForecast(taskCompletionRates)
      },
      timeUsageTrends,
      predictions: {
        estimatedCompletion: this.estimateProjectCompletion(tasks, averageCompletionTime),
        riskFactors: this.analyzeRiskFactors(tasks, timeEntries)
      }
    };
  }

  // دوال مساعدة
  static calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  static calculateForecast(values) {
    // استخدام نموذج بسيط للتنبؤ الخطي
    const n = values.length;
    if (n < 2) return null;

    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    const xValues = Array.from({ length: n }, (_, i) => i);
    const slope = xValues.reduce((acc, x, i) => {
      return acc + (x - xMean) * (values[i] - yMean);
    }, 0) / xValues.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0);

    const intercept = yMean - slope * xMean;

    return {
      slope,
      intercept,
      nextValue: slope * n + intercept
    };
  }

  static estimateProjectCompletion(tasks, averageCompletionTime) {
    const remainingTasks = tasks.filter(task => task.status !== 'completed').length;
    const estimatedDays = remainingTasks * averageCompletionTime;
    
    return {
      remainingTasks,
      estimatedDays,
      estimatedCompletionDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
    };
  }

  static analyzeRiskFactors(tasks, timeEntries) {
    const risks = [];
    
    // تحليل المهام المتأخرة
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.deadline && 
      new Date(task.deadline) < new Date()
    );

    if (overdueTasks.length > tasks.length * 0.2) {
      risks.push({
        type: 'high_overdue_tasks',
        severity: 'high',
        description: 'نسبة عالية من المهام المتأخرة'
      });
    }

    // تحليل توزيع العمل
    const userWorkload = {};
    timeEntries.forEach(entry => {
      userWorkload[entry.user] = (userWorkload[entry.user] || 0) + entry.duration;
    });

    const workloadValues = Object.values(userWorkload);
    const avgWorkload = workloadValues.reduce((a, b) => a + b, 0) / workloadValues.length;
    const maxWorkload = Math.max(...workloadValues);

    if (maxWorkload > avgWorkload * 2) {
      risks.push({
        type: 'uneven_workload',
        severity: 'medium',
        description: 'توزيع غير متوازن للعمل بين أعضاء الفريق'
      });
    }

    return risks;
  }
}

module.exports = AnalyticsService;
