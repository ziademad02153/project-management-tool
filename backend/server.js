const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// SQLite Database Connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Define Models
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resetToken: {
    type: DataTypes.STRING
  },
  resetTokenExpiry: {
    type: DataTypes.DATE
  }
});

const Project = sequelize.define('Project', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  }
});

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  dueDate: DataTypes.DATE
});

const Notification = sequelize.define('Notification', {
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'info'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Define Relationships
Project.belongsTo(User, { as: 'owner' });
Project.belongsToMany(User, { through: 'ProjectMembers', as: 'members' });
Task.belongsTo(Project);
Task.belongsTo(User, { as: 'assignee' });
Notification.belongsTo(User, { as: 'recipient' });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
    process.exit(1);
  });

// Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const user = await User.create({ name, email, password });
    res.json({ message: 'User registered successfully', userId: user.id });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: 'An error occurred while creating the account' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(400).json({ message: 'An error occurred while logging in' });
  }
});

app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }
    
    // Generate reset token
    const resetToken = Math.random().toString(36).substring(7);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    await user.update({
      resetToken,
      resetTokenExpiry
    });
    
    // Here you would typically send an email with the reset link
    // For now, we'll just return the token in the response
    res.json({ 
      message: 'Password reset instructions have been sent to your email',
      resetToken // In production, remove this
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'An error occurred while processing your request' });
  }
});

app.post('/api/users/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    await user.update({
      password,
      resetToken: null,
      resetTokenExpiry: null
    });
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ message: 'An error occurred while resetting your password' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, ownerId } = req.body;
    const project = await Project.create({
      name,
      description,
      ownerId
    });
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner' },
        { model: User, as: 'members' }
      ]
    });
    res.json(projects);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority, dueDate } = req.body;
    const task = await Task.create({
      title,
      description,
      projectId,
      assigneeId,
      priority,
      dueDate
    });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: Project },
        { model: User, as: 'assignee' }
      ]
    });
    res.json(tasks);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to our routes
app.set('io', io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    version: '1.0.0',
    environment: 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Process error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
