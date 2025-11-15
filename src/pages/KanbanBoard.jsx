import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert
} from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { projectAPI } from '../services/api';
import DragDropKanban from '../components/DragDropKanban';
import toast from 'react-hot-toast';

const KanbanBoardPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjects();
      if (response.success) {
        const currentProject = response.data.find(p => p._id === id);
        setProject(currentProject);
        
        if (!currentProject) {
          toast.error('Project not found');
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Project not found or you don't have access to it.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/projects" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          Projects
        </Link>
        <Typography color="text.primary">{project.title}</Typography>
      </Breadcrumbs>

      {/* Project Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {project.title}
        </Typography>
        {project.description && (
          <Typography variant="body1" color="text.secondary">
            {project.description}
          </Typography>
        )}
      </Box>

      {/* Drag & Drop Kanban Board */}
      <DragDropKanban projectId={id} />
    </Container>
  );
};

export default KanbanBoardPage;