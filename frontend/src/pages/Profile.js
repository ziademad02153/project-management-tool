import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Box,
  Divider,
  Alert,
  IconButton,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';

const Profile = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    position: '',
    bio: '',
    avatar: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { 'x-auth-token': token }
      });
      setProfile(response.data);
    } catch (error) {
      setError('Error fetching profile data');
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/stats', {
        headers: { 'x-auth-token': token }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/profile', profile, {
        headers: { 'x-auth-token': token }
      });
      setSuccess('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error updating profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/api/users/avatar', formData, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        setProfile({ ...profile, avatar: response.data.avatar });
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Error updating profile picture');
      }
    }
  };

  const MotionCard = motion(Card);

  return (
    <Layout title="Profile">
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ p: 3 }}
          >
            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', textAlign: 'center' }}>
              <Avatar
                src={profile.avatar || '/default-avatar.png'}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mb: 2, 
                  mx: 'auto',
                  border: `4px solid ${theme.palette.primary.main}`,
                  boxShadow: theme.shadows[3]
                }}
              />
              {editMode && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: '50%',
                    transform: 'translateX(60px)',
                    backgroundColor: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.dark' }
                  }}
                  component="label"
                >
                  <PhotoCameraIcon sx={{ color: 'white' }} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </IconButton>
              )}
            </Box>
            <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
              {profile.fullName || profile.username}
            </Typography>
            <Typography color="textSecondary" gutterBottom align="center">
              {profile.position || 'Position not set'}
            </Typography>
            {!editMode ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                  variant="outlined"
                  color="error"
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            )}
          </MotionCard>

          <MotionCard 
            sx={{ mt: 2 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Typography variant="h4" color="primary" align="center">
                      {stats.totalProjects}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Projects
                    </Typography>
                  </motion.div>
                </Grid>
                <Grid item xs={4}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Typography variant="h4" color="success.main" align="center">
                      {stats.completedTasks}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Completed
                    </Typography>
                  </motion.div>
                </Grid>
                <Grid item xs={4}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Typography variant="h4" color="warning.main" align="center">
                      {stats.pendingTasks}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" align="center">
                      Pending
                    </Typography>
                  </motion.div>
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Profile Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position"
                    name="position"
                    value={profile.position}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Profile;
