import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  useTheme,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';
import AnalyticsChart from '../components/Charts/AnalyticsChart';

const Analytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectStats, setProjectStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [productivityStats, setProductivityStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'x-auth-token': token };

      const [projectRes, taskRes, productivityRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/projects', { headers }),
        axios.get('http://localhost:5000/api/analytics/tasks', { headers }),
        axios.get('http://localhost:5000/api/analytics/productivity', { headers })
      ]);

      setProjectStats(projectRes.data);
      setTaskStats(taskRes.data);
      setProductivityStats(productivityRes.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching analytics data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const MotionCard = motion(Card);

  if (loading) {
    return (
      <Layout title="Analytics">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Analytics">
        <Alert severity="error">{error}</Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Projects" />
          <Tab label="Tasks" />
          <Tab label="Productivity" />
        </Tabs>
      </Box>

      {/* Projects Tab */}
      {activeTab === 0 && projectStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Project Status Distribution</Typography>
                <AnalyticsChart
                  data={projectStats.projectsByStatus.map(item => ({
                    name: item._id,
                    value: item.count
                  }))}
                  xKey="name"
                  yKey="value"
                />
              </CardContent>
            </MotionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Project Progress</Typography>
                {projectStats.projectProgress.map((project, index) => (
                  <Box key={project.projectId} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{project.projectName}</Typography>
                    <Box display="flex" alignItems="center">
                      <Box width="100%" mr={1}>
                        <LinearProgress
                          variant="determinate"
                          value={project.progress}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                      <Box minWidth={35}>
                        <Typography variant="body2" color="textSecondary">
                          {`${Math.round(project.progress)}%`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}

      {/* Tasks Tab */}
      {activeTab === 1 && taskStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Task Status Distribution</Typography>
                <AnalyticsChart
                  data={taskStats.tasksByStatus.map(item => ({
                    name: item._id,
                    value: item.count
                  }))}
                  xKey="name"
                  yKey="value"
                />
              </CardContent>
            </MotionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
                <List>
                  {taskStats.upcomingDeadlines.map((task, index) => (
                    <React.Fragment key={task._id}>
                      <ListItem>
                        <ListItemIcon>
                          {task.priority === 'high' ? (
                            <FlagIcon color="error" />
                          ) : (
                            <ScheduleIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={new Date(task.deadline).toLocaleDateString()}
                        />
                      </ListItem>
                      {index < taskStats.upcomingDeadlines.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}

      {/* Productivity Tab */}
      {activeTab === 2 && productivityStats && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>Task Completion Trend</Typography>
                <AnalyticsChart
                  data={productivityStats.completedTasksOverTime}
                  xKey="date"
                  yKey="count"
                />
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}
    </Layout>
  );
};

export default Analytics;
