import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openNewTask, setOpenNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    status: 'pending',
    dueDate: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks', {
        headers: { 'x-auth-token': token }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: { 'x-auth-token': token }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tasks', newTask, {
        headers: { 'x-auth-token': token }
      });
      setOpenNewTask(false);
      setNewTask({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'pending',
        dueDate: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/tasks/${taskId}`, 
        { status: newStatus },
        { headers: { 'x-auth-token': token }}
      );
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'in-progress': return <ScheduleIcon color="warning" />;
      case 'pending': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  return (
    <Layout title="Tasks">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewTask(true)}
        >
          New Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} md={6} key={task._id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{task.title}</Typography>
                <Box>
                  {getStatusIcon(task.status)}
                  <Chip 
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </Box>
              
              <Typography color="textSecondary" paragraph>
                {task.description}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Due Date: {new Date(task.dueDate).toLocaleDateString('en-US')}
                </Typography>
                
                <Box>
                  <IconButton 
                    onClick={() => handleUpdateTaskStatus(task._id, 'completed')}
                    color={task.status === 'completed' ? 'success' : 'default'}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                  <IconButton>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openNewTask} onClose={() => setOpenNewTask(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Task Description"
            fullWidth
            multiline
            rows={4}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Project</InputLabel>
            <Select
              value={newTask.project}
              onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
            >
              {projects.map((project) => (
                <MenuItem key={project._id} value={project._id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTask(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Tasks;
