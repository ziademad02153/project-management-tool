import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Description as ReportIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('week');
  const [reportType, setReportType] = useState('tasks');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchStats();
  }, [period, reportType]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/reports/${reportType}?period=${period}`, {
        headers: { 'x-auth-token': token }
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      setError('An error occurred while fetching statistics');
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/reports/download/${reportType}?period=${period}`,
        {
          headers: { 'x-auth-token': token },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${period}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('An error occurred while downloading the report');
    }
  };

  if (loading) {
    return (
      <Layout title="Reports & Statistics">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Reports & Statistics">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="tasks">Tasks</MenuItem>
                <MenuItem value="projects">Projects</MenuItem>
                <MenuItem value="teams">Teams</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                label="Time Period"
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={downloadReport}
              fullWidth
            >
              Download Report
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <PieChart width={400} height={300}>
                <Pie
                  data={stats?.statusDistribution || []}
                  cx={200}
                  cy={150}
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Activity Over Period
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <BarChart
                width={400}
                height={300}
                data={stats?.timelineData || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#00C49F" />
                <Bar dataKey="pending" name="Pending" fill="#FFBB28" />
              </BarChart>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistics Summary
            </Typography>
            <Grid container spacing={3}>
              {stats?.summary.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {item.label}
                      </Typography>
                      <Typography variant="h4">
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color={item.change >= 0 ? 'success.main' : 'error.main'}>
                        {item.change >= 0 ? '+' : ''}{item.change}% compared to previous period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Reports;
