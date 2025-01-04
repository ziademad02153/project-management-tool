import React from 'react';
import { Card, CardHeader, Box, Typography, IconButton, useTheme } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const AnalyticsChart = ({
  title,
  subheader,
  data,
  xKey,
  yKey,
  color = 'primary',
}) => {
  const theme = useTheme();

  const MotionCard = motion(Card);

  const chartAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" color={theme.palette[color].main}>
            {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <MotionCard
      initial="hidden"
      animate="visible"
      variants={chartAnimation}
      sx={{
        boxShadow: theme.shadows[2],
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            {title}
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {subheader}
          </Typography>
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
      />
      <Box 
        sx={{ 
          p: 3, 
          pb: 1,
          bgcolor: theme.palette.background.neutral
        }} 
        dir="ltr"
      >
        <ResponsiveContainer width="100%" height={364}>
          <AreaChart
            data={data}
            margin={{
              top: 16,
              right: 16,
              bottom: 0,
              left: 24,
            }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette[color].main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette[color].main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey={xKey}
              stroke={theme.palette.text.secondary}
              style={theme.typography.body2}
              tickLine={false}
              axisLine={{ strokeWidth: 1 }}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={theme.typography.body2}
              tickLine={false}
              axisLine={{ strokeWidth: 1 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={theme.palette[color].main}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </MotionCard>
  );
};

export default AnalyticsChart;
