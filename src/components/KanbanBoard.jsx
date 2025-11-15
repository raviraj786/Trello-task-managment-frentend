import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Avatar
} from '@mui/material';
import { Add, Delete, Person } from '@mui/icons-material';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TaskDetails from './TaskDetails';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false); // for creating new task
  const [selectedTask, setSelectedTask] = useState(null); // for editing/viewing task
  const [formData, setFormData] = useState({
    title: '', description: '', assignee: '', dueDate: '', status: 'todo'
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks(projectId);
      if (response.success) setTasks(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Task title is required');
    try {
      const response = await taskAPI.createTask(projectId, formData);
      if (response.success) {
        setTasks(prev => ({
          ...prev,
          [formData.status]: [...prev[formData.status], response.data]
        }));
        setOpenDialog(false);
        setFormData({ title: '', description: '', assignee: '', dueDate: '', status: 'todo' });
        toast.success('Task created successfully!');
      }
    } catch (error) { toast.error(error.message); }
  };

  const handleDeleteTask = async (taskId, status) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await taskAPI.deleteTask(projectId, taskId);
      if (response.success) {
        setTasks(prev => ({
          ...prev,
          [status]: prev[status].filter(t => t._id !== taskId)
        }));
        toast.success('Task deleted successfully!');
      }
    } catch (error) { toast.error(error.message); }
  };

  const handleTaskUpdate = (updatedTask) => {
    const status = updatedTask.status;
    // Remove task from all columns first
    const newTasks = { todo: [], inprogress: [], done: [] };
    Object.keys(tasks).forEach(col => {
      newTasks[col] = tasks[col].filter(t => t._id !== updatedTask._id);
    });
    // Add updated task to its status column
    newTasks[status].push(updatedTask);
    setTasks(newTasks);
    setSelectedTask(null);
  };

  const columns = [
    { key: 'todo', title: 'To Do', color: 'warning' },
    { key: 'inprogress', title: 'In Progress', color: 'info' },
    { key: 'done', title: 'Done', color: 'success' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Project Board</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
          Add Task
        </Button>
      </Box>

      {/* Kanban Columns */}
      <Box display="flex" gap={2} sx={{ overflowX: 'auto', pb: 2 }}>
        {columns.map(column => (
          <Paper key={column.key} sx={{ minWidth: 300, flex: 1, p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom sx={{ color: `${column.color}.main`, display: 'flex', alignItems: 'center', gap: 1 }}>
              {column.title}
              <Chip label={tasks[column.key]?.length || 0} size="small" color={column.color} />
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tasks[column.key]?.map(task => (
                <Card
                  key={task._id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }
                  }}
                  onClick={() => setSelectedTask(task)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>{task.description || 'No description'}</Typography>

                    <Box display="flex" flexDirection="column" gap={1}>
                      {task.assignee && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" color="action" />
                          <Typography variant="caption">{task.assignee.name}</Typography>
                        </Box>
                      )}
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <Box display="flex" justifyContent="flex-end" p={1}>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id, column.key); }}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <form onSubmit={handleCreateTask}>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Task Title" fullWidth variant="outlined"
              value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <TextField margin="dense" label="Description" fullWidth variant="outlined" multiline rows={3}
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            <TextField margin="dense" label="Status" fullWidth select
              value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
            <TextField margin="dense" label="Due Date" fullWidth type="date"
              InputLabelProps={{ shrink: true }} value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Task</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetails
          open={Boolean(selectedTask)}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          projectId={projectId}
        />
      )}
    </Box>
  );
};

export default KanbanBoard;
