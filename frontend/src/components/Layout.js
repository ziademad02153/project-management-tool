import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';

const Layout = ({ children, title }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Header title={title} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
