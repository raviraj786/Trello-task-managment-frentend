import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button
} from '@mui/material';
import { Folder, Task, Group } from '@mui/icons-material'; // ✅ Correct icons
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    {
      icon: <Folder sx={{ fontSize: 40 }} />,
      title: 'Projects',
      description: 'Manage your projects and teams',
      action: 'View Projects',
      onClick: () => navigate('/projects'),
      color: 'primary'
    },
    {
      icon: <Task sx={{ fontSize: 40 }} />,
      title: 'Tasks',
      description: 'Track and manage your tasks',
      action: 'View Tasks',
      onClick: () => navigate('/projects'),
      color: 'secondary'
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Team',
      description: 'Collaborate with your team members',
      action: 'Manage Team',
      onClick: () => navigate('/projects'),
      color: 'success'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your projects and tasks efficiently
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <Box sx={{ color: `${stat.color}.main`, mb: 2 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {stat.description}
                </Typography>
                <Button 
                  variant="contained" 
                  color={stat.color}
                  onClick={stat.onClick}
                  sx={{ mt: 2 }}
                >
                  {stat.action}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Get Started
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create your first project and start organizing your work
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/projects')}
          sx={{ px: 4 }}
        >
          Create New Project
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard;