import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const TaskList = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    deadline: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/tasks/project/${projectId}`,
        {
          headers: { 'x-auth-token': token }
        }
      );
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { 'x-auth-token': token }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpen = (task = null) => {
    if (task) {
      setEditTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo?._id || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : ''
      });
    } else {
      setEditTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        deadline: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        ...formData,
        project: projectId
      };

      if (editTask) {
        await axios.put(
          `http://localhost:5000/api/tasks/${editTask._id}`,
          taskData,
          {
            headers: { 'x-auth-token': token }
          }
        );
      } else {
        await axios.post('http://localhost:5000/api/tasks', taskData, {
          headers: { 'x-auth-token': token }
        });
      }
      fetchTasks();
      handleClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
          headers: { 'x-auth-token': token }
        });
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          New Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" component="h2">
                    {task.title}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpen(task)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(task._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {task.description}
                </Typography>
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                    <Chip
                      icon={<PriorityIcon />}
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </Box>
                  {task.deadline && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(task.deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {task.assignedTo && (
                    <Typography variant="body2" color="textSecondary">
                      Assigned to: {task.assignedTo.username}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Title"
              type="text"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Assigned To</InputLabel>
              <Select
                value={formData.assignedTo}
                label="Assigned To"
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <MenuItem value="">Not Assigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default TaskList;
