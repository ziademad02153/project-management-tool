import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  Fade,
  Grow
} from '@mui/material';
import {
  Add as AddIcon,
  AccessTime as TimeIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import AnalyticsChart from '../components/Charts/AnalyticsChart';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectStats, setProjectStats] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        axios.get('http://localhost:5000/api/stats', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/projects', {
          headers: { 'x-auth-token': token }
        }),
        axios.get('http://localhost:5000/api/tasks', {
          headers: { 'x-auth-token': token }
        })
      ]);

      setStats(statsRes.data);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);

      const stats = {};
      projectsRes.data.forEach(project => {
        const projectTasks = tasksRes.data.filter(task => task.project === project._id);
        stats[project._id] = {
          totalTasks: projectTasks.length,
          completedTasks: projectTasks.filter(t => t.status === 'completed').length,
          pendingTasks: projectTasks.filter(t => t.status === 'pending').length,
          progress: projectTasks.length > 0
            ? (projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100
            : 0
        };
      });
      setProjectStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <Grid container spacing={3}>
        <Fade in timeout={1000}>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Total Projects"
              value={projects.length}
              icon={AddIcon}
              trend={12}
            />
          </Grid>
        </Fade>
        <Fade in timeout={1200}>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Active Tasks"
              value={tasks.filter(t => t.status !== 'completed').length}
              icon={TimeIcon}
              color="warning"
              trend={-5}
            />
          </Grid>
        </Fade>
        <Fade in timeout={1400}>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Completed Tasks"
              value={tasks.filter(t => t.status === 'completed').length}
              icon={TimeIcon}
              color="success"
              trend={8}
            />
          </Grid>
        </Fade>
        <Fade in timeout={1600}>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Completion Rate"
              value={`${Math.round((tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100)}%`}
              icon={TimeIcon}
              color="info"
              trend={3}
            />
          </Grid>
        </Fade>

        <Grid item xs={12} md={8}>
          <Grow in timeout={2000}>
            <div>
              <AnalyticsChart
                title="Project Progress"
                subheader="Last 30 days"
                data={projects.map(project => ({
                  name: project.name,
                  value: projectStats[project._id].progress
                }))}
                xKey="name"
                yKey="value"
              />
            </div>
          </Grow>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grow in timeout={2000}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Projects</Typography>
                <Button
                  startIcon={<AddIcon />}
                  color="primary"
                  component={motion.button}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  New Project
                </Button>
              </Box>
              <Grid container spacing={2}>
                {projects.slice(0, 3).map((project, index) => (
                  <Fade in timeout={2000 + (index * 200)} key={project._id}>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1">{project.name}</Typography>
                          <IconButton size="small">
                            <MoreIcon />
                          </IconButton>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {project.description}
                          </Typography>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item>
                            <Chip
                              icon={<TimeIcon />}
                              label={`Completed: ${projectStats[project._id].completedTasks}`}
                              color="success"
                            />
                          </Grid>
                          <Grid item>
                            <Chip
                              icon={<TimeIcon />}
                              label={`Pending: ${projectStats[project._id].pendingTasks}`}
                              color="warning"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Fade>
                ))}
              </Grid>
            </Paper>
          </Grow>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard;
