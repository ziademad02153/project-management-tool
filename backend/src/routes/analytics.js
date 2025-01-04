const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Get project statistics
router.get('/projects', auth, async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments({ members: req.user.id });
    const projectsByStatus = await Project.aggregate([
      { $match: { members: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const activeProjects = await Project.find({
      members: req.user.id,
      status: 'active'
    }).select('name tasks').populate('tasks');

    const projectProgress = activeProjects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        projectId: project._id,
        projectName: project.name,
        totalTasks,
        completedTasks,
        progress: Math.round(progress)
      };
    });

    res.json({
      totalProjects,
      projectsByStatus,
      projectProgress
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get task statistics
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasksByStatus = await Task.aggregate([
      { $match: { assignedTo: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: { assignedTo: req.user.id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const upcomingDeadlines = await Task.find({
      assignedTo: req.user.id,
      status: { $ne: 'completed' },
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ deadline: 1 })
      .populate('project', 'name')
      .limit(5);

    const overdueTasks = await Task.find({
      assignedTo: req.user.id,
      status: { $ne: 'completed' },
      deadline: { $lt: new Date() }
    })
      .sort({ deadline: 1 })
      .populate('project', 'name');

    res.json({
      tasksByStatus,
      tasksByPriority,
      upcomingDeadlines,
      overdueTasks,
      totalOverdue: overdueTasks.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get productivity metrics
router.get('/productivity', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const completedTasksOverTime = await Task.aggregate([
      {
        $match: {
          assignedTo: req.user.id,
          status: 'completed',
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const averageTaskCompletionTime = await Task.aggregate([
      {
        $match: {
          assignedTo: req.user.id,
          status: 'completed',
          createdAt: { $exists: true },
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$completionTime' }
        }
      }
    ]);

    res.json({
      completedTasksOverTime,
      averageTaskCompletionTime: averageTaskCompletionTime[0]?.averageTime || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
