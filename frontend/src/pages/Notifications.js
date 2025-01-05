import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Box,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Assignment as AssignmentIcon,
  Folder as FolderIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { 'x-auth-token': token }
      });
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      setError('An error occurred while fetching notifications');
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setSuccess('Notification deleted successfully');
      setNotifications(notifications.filter(notification => notification._id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('An error occurred while deleting the notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task':
        return <AssignmentIcon color="primary" />;
      case 'project':
        return <FolderIcon color="success" />;
      case 'comment':
        return <CommentIcon color="info" />;
      default:
        return <NotificationsIcon color="warning" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task':
        return 'primary';
      case 'project':
        return 'success';
      case 'comment':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Layout title="Notifications">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Notifications">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2 }}>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography color="textSecondary">
              No new notifications
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification._id}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {getNotificationIcon(notification.type)}
                </Box>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ar
                        })}
                      </Typography>
                      <Chip
                        label={notification.type === 'task' ? 'Task' : notification.type === 'project' ? 'Project' : 'Comment'}
                        size="small"
                        color={getNotificationColor(notification.type)}
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteNotification(notification._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Layout>
  );
};

export default Notifications;
