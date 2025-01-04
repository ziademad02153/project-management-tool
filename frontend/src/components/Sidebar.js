import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Assessment as AnalyticsIcon,
  Person as ProfileIcon
} from '@mui/icons-material';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { text: 'لوحة التحكم', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'المهام', icon: <AssignmentIcon />, path: '/tasks' },
    { text: 'الإشعارات', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'التحليلات', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'الملف الشخصي', icon: <ProfileIcon />, path: '/profile' }
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          نظام إدارة المشاريع
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="تسجيل الخروج" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
