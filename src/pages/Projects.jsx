import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add, Delete, Dashboard } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjects();
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrors({ title: 'Project title is required' });
      return;
    }

    try {
      const response = await projectAPI.createProject(formData);
      if (response.success) {
        setProjects([response.data, ...projects]);
        setOpenDialog(false);
        setFormData({ title: '', description: '' });
        toast.success('Project created successfully!');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await projectAPI.deleteProject(projectId);
      if (response.success) {
        setProjects(projects.filter(p => p._id !== projectId));
        toast.success('Project deleted successfully!');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={4} gap={2}>
        <Typography variant="h4" component="h1" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          My Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ alignSelf: { xs: 'center', sm: 'auto' } }}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          You don't have any projects yet. Create your first project to get started!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {project.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {project.description || 'No description'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created by: {project.createdBy?.name || 'Unknown'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<Dashboard />}
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    Open Board
                  </Button>
                  {project.createdBy?._id === user?._id && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteProject(project._id)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <form onSubmit={handleCreateProject}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={!!errors.title}
              helperText={errors.title}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create Project
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Projects;
