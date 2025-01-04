const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id })
      .populate('tasks')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({
      name,
      description,
      user: req.user.id
    });

    await project.save();

    // Create notification
    const notification = new Notification({
      user: req.user.id,
      title: 'مشروع جديد',
      message: `تم إنشاء مشروع جديد: ${name}`,
      type: 'project'
    });
    await notification.save();

    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    project.name = name;
    project.description = description;
    await project.save();

    // Create notification
    const notification = new Notification({
      user: req.user.id,
      title: 'تحديث مشروع',
      message: `تم تحديث المشروع: ${name}`,
      type: 'project'
    });
    await notification.save();

    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });

    // Delete the project
    await project.remove();

    // Create notification
    const notification = new Notification({
      user: req.user.id,
      title: 'حذف مشروع',
      message: `تم حذف المشروع: ${project.name}`,
      type: 'project'
    });
    await notification.save();

    res.json({ msg: 'Project removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get project statistics
router.get('/stats/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const tasks = await Task.find({ project: req.params.id });

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      pendingTasks: tasks.filter(task => task.status === 'pending').length,
      inProgressTasks: tasks.filter(task => task.status === 'in-progress').length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
