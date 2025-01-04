import React from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, trend, color = 'primary', isLoading = false }) => {
  const theme = useTheme();

  const getIconColor = () => {
    if (trend > 0) return theme.palette.success.main;
    if (trend < 0) return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        component={motion.div}
        whileHover={{ 
          scale: 1.02,
          boxShadow: theme.shadows[8]
        }}
        sx={{
          p: 3,
          boxShadow: 0,
          textAlign: 'center',
          color: theme.palette[color].darker,
          bgcolor: theme.palette[color].lighter,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.12)} 0%, ${alpha(
              theme.palette[color].main,
              0.06
            )} 100%)`,
            borderRadius: 'inherit'
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
                position: 'relative'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    borderRadius: 1.5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette[color].dark,
                    bgcolor: alpha(theme.palette[color].main, 0.16),
                  }}
                >
                  <Icon />
                </Box>
              </motion.div>
              
              {trend !== undefined && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: getIconColor(),
                    }}
                  >
                    <TrendIcon sx={{ mr: 0.5, width: 20, height: 20 }} />
                    <Typography variant="subtitle2">
                      {trend > 0 ? '+' : ''}{trend}%
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </Box>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Typography variant="h3" sx={{ opacity: 0.72, mb: 1 }}>
                {value}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.64 }}>
                {title}
              </Typography>
            </motion.div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default StatsCard;
