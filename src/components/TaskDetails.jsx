import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Avatar,
  Divider,
  IconButton
} from '@mui/material';
import { Close, Edit, Save, Cancel } from '@mui/icons-material';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskDetails = ({ open, task, onClose, onUpdate, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (task) {
      setEditedTask(task);
    }
  }, [task]);

  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setLoading(true);
      const response = await taskAPI.updateTask(projectId, task._id, {
        title: editedTask.title,
        description: editedTask.description,
        status: editedTask.status,
        dueDate: editedTask.dueDate
      });

      if (response.success) {
        onUpdate(response.data);
        setIsEditing(false);
        toast.success('Task updated successfully!');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'warning';
      case 'inprogress': return 'info';
      case 'done': return 'success';
      default: return 'default';
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {isEditing ? (
            <TextField
              value={editedTask?.title || ''}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              fullWidth
              variant="standard"
            />
          ) : (
            <Typography variant="h5">{task.title}</Typography>
          )}
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Status */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Status
          </Typography>
          {isEditing ? (
            <TextField
              select
              fullWidth
              value={editedTask?.status || 'todo'}
              onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </TextField>
          ) : (
            <Chip 
              label={task.status?.toUpperCase()} 
              color={getStatusColor(task.status)}
              variant="filled"
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Description */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Description
          </Typography>
          {isEditing ? (
            <TextField
              multiline
              rows={4}
              fullWidth
              value={editedTask?.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="Add a description..."
            />
          ) : (
            <Typography variant="body1">
              {task.description || 'No description provided'}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Due Date */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Due Date
          </Typography>
          {isEditing ? (
            <TextField
              type="date"
              fullWidth
              value={editedTask?.dueDate ? editedTask.dueDate.split('T')[0] : ''}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          ) : (
            <Typography variant="body1">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </Typography>
          )}
        </Box>

        {/* Assignee */}
        {task.assignee && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assignee
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {task.assignee.name?.charAt(0)}
                </Avatar>
                <Typography variant="body1">
                  {task.assignee.name}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        {isEditing ? (
          <>
            <Button onClick={handleCancel} startIcon={<Cancel />}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              startIcon={<Save />}
              disabled={loading}
            >
              Save
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} startIcon={<Edit />}>
            Edit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetails;