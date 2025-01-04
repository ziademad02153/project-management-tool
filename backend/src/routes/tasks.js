const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'username')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, deadline } = req.body;
    
    // Check if project exists and user is a member
    const project = await Project.findOne({
      _id: projectId,
      'members.user': req.user.id
    });
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found or not authorized' });
    }
    
    const newTask = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      deadline
    });
    
    const task = await newTask.save();
    await task.populate('assignedTo', 'username');
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, assignedTo, priority, deadline } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user has access to the project
    const project = await Project.findOne({
      _id: task.project,
      'members.user': req.user.id
    });
    
    if (!project) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.assignedTo = assignedTo || task.assignedTo;
    task.priority = priority || task.priority;
    task.deadline = deadline || task.deadline;
    
    await task.save();
    await task.populate('assignedTo', 'username');
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user has access to the project
    const project = await Project.findOne({
      _id: task.project,
      'members.user': req.user.id
    });
    
    if (!project) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await task.remove();
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
