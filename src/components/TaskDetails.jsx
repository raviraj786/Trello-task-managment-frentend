import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button, Box, Chip, Avatar, IconButton, Divider, Select, MenuItem, FormControl } from "@mui/material";
import { Close, Edit, Save, Cancel, Person, Label as LabelIcon } from "@mui/icons-material";
import { taskAPI } from "../services/api";
import toast from "react-hot-toast";

const TaskDetails = ({ open, task, onClose, onUpdate, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const colors = ["#f44336", "#ff9800", "#4caf50", "#2196f3", "#9c27b0", "#00bcd4"];

  useEffect(() => {
    if (task) setEditedTask({ ...task, members: task.members || [], labels: task.labels || [] });
  }, [task]);

  const handleSave = async () => {
    if (!editedTask.title.trim()) return toast.error("Title required");
    try {
      const res = await taskAPI.updateTask(projectId, task._id, editedTask);
      if (res.success) { onUpdate(res.data); setIsEditing(false); toast.success("Updated!"); }
    } catch (err) { toast.error(err.message); }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {isEditing ? <TextField value={editedTask?.title} onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })} fullWidth variant="standard" /> : <Typography variant="h5">{task.title}</Typography>}
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Status, Description, Due Date, Members, Labels - same as before */}
      </DialogContent>
      <DialogActions>
        {isEditing ? (
          <>
            <Button onClick={() => { setEditedTask(task); setIsEditing(false); }} startIcon={<Cancel />}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" startIcon={<Save />}>Save</Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} startIcon={<Edit />}>Edit</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetails;