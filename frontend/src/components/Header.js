import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'task',
      message: 'New task assigned: Update project documentation',
      time: '5 minutes ago',
      icon: TaskIcon,
      color: theme.palette.primary.main
    },
    {
      id: 2,
      type: 'reminder',
      message: 'Meeting with team in 30 minutes',
      time: '25 minutes ago',
      icon: ScheduleIcon,
      color: theme.palette.warning.main
    },
    {
      id: 3,
      type: 'update',
      message: 'Project status updated to "In Progress"',
      time: '1 hour ago',
      icon: TaskIcon,
      color: theme.palette.info.main
    }
  ]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    // Handle notification click based on type
    switch (notification.type) {
      case 'task':
        navigate('/tasks');
        break;
      case 'reminder':
        navigate('/calendar');
        break;
      case 'update':
        navigate('/projects');
        break;
      default:
        break;
    }
    handleMenuClose();
  };

  return (
    <>
      <AppBar 
        position="fixed"
        component={motion.div}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpenSidebar(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Sidebar
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate('/profile');
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate('/settings');
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <React.Fragment key={notification.id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: notification.color 
                      }}
                    >
                      <Icon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={notification.message}
                    secondary={notification.time}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { mb: 0.5 }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { color: theme.palette.text.secondary }
                    }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
          <ListItem 
            button 
            onClick={() => {
              handleMenuClose();
              navigate('/notifications');
            }}
            sx={{
              justifyContent: 'center',
              color: theme.palette.primary.main
            }}
          >
            <Typography variant="body2">
              View All Notifications
            </Typography>
          </ListItem>
        </List>
      </Menu>
    </>
  );
};

export default Header;
