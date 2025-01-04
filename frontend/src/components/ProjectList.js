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
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleOpen = (project = null) => {
    if (project) {
      setEditProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status
      });
    } else {
      setEditProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editProject) {
        await axios.put(
          `http://localhost:5000/api/projects/${editProject._id}`,
          formData,
          {
            headers: { 'x-auth-token': token }
          }
        );
      } else {
        await axios.post('http://localhost:5000/api/projects', formData, {
          headers: { 'x-auth-token': token }
        });
      }
      fetchProjects();
      handleClose();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/projects/${projectId}`, {
          headers: { 'x-auth-token': token }
        });
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'on-hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" component="h2">
                    {project.name}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpen(project)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(project._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {project.description}
                </Typography>
                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                  <Box display="flex" alignItems="center">
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {project.members?.length || 1} members
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <TextField
              select
              margin="dense"
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              SelectProps={{
                native: true
              }}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editProject ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ProjectList;
