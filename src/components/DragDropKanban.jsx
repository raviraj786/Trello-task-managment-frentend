import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Add, Delete, Sync, Comment, Edit, BugReport } from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { taskAPI } from "../services/api";
import toast from "react-hot-toast";
import { saveTasksToLocal, loadTasksFromLocal } from "../utils/localTaskSync";

/* ---------- Sortable Task Card ---------- */
const SortableTaskCard = ({ task, onDelete, onAddComment, onEditTask }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ 
    id: task._id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e) => {
    console.log("Dddddddddddddddddddddddddddd")
    e.stopPropagation();
    console.log("🔄 DELETE BUTTON CLICKED:", { 
      taskId: task._id, 
      status: task.status,
      taskTitle: task.title 
    });
    onDelete(task._id, task.status);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    console.log("🔄 EDIT BUTTON CLICKED:", { 
      taskId: task._id, 
      task 
    });
    onEditTask(task);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    console.log("🔄 COMMENT BUTTON CLICKED:", { 
      taskId: task._id 
    });
    onAddComment(task);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <Card 
        sx={{ 
          mb: 1, 
          cursor: "grab", 
          "&:hover": { boxShadow: 3 }, 
          fontSize: "0.8rem",
          border: isDragging ? "2px solid blue" : "none"
        }}
      >
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {task.title}
            <Typography 
              component="span" 
              variant="caption" 
              color="text.secondary" 
              sx={{ ml: 1 }}
            >
              (ID: {task._id})
            </Typography>
          </Typography>
          
          {task.description && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mt: 0.5, display: 'block' }}
            >
              {task.description}
            </Typography>
          )}
          
          {task.assignee && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <Avatar sx={{ width: 20, height: 20, fontSize: "0.65rem" }}>
                {task.assignee.name?.[0] || "U"}
              </Avatar>
              <Typography variant="caption">{task.assignee.name}</Typography>
            </Box>
          )}
          
          {task.dueDate && (
            <Chip
              label={new Date(task.dueDate).toLocaleDateString()}
              size="small"
              color={new Date(task.dueDate) < new Date() ? "error" : "default"}
              sx={{ mt: 0.5 }}
            />
          )}
          
          {task.isLocal && (
            <Chip 
              label="Unsynced" 
              size="small" 
              color="secondary" 
              sx={{ mt: 0.5 }} 
            />
          )}
        </CardContent>
        
        <Box display="flex" justifyContent="space-between" p={0.5}>
          <Box>
            <IconButton 
              size="small" 
              onClick={handleComment}
              title="Add Comment"
            >
              <Comment fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={handleEdit}
              title="Edit Task"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Box>
          <IconButton 
            size="small" 
            color="error" 
            onClick={handleDelete}
            title="Delete Task"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Card>
    </div>
  );
};

/* ---------- Column ---------- */
const SortableColumn = ({ column, tasks, onDeleteTask, onAddTask, onAddComment, onEditTask }) => {
  const taskIds = tasks.map((t) => t._id);

  console.log(`📊 Column ${column.key} tasks:`, tasks);

  return (
    <Paper
      sx={{
        minWidth: 250,
        flex: 1,
        p: 1,
        backgroundColor: "grey.50",
        minHeight: 400,
        maxHeight: "80vh",
        overflowY: "auto",
        border: "1px solid #ddd"
      }}
    >
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: `${column.color}.main`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span>
          {column.title}
          <Chip label={tasks.length} size="small" color={column.color} sx={{ ml: 1 }} />
        </span>
        <IconButton 
          size="small" 
          onClick={() => {
            console.log(`➕ ADD TASK TO COLUMN: ${column.key}`);
            onAddTask(column.key);
          }}
        >
          <Add />
        </IconButton>
      </Typography>

      <SortableContext id={column.key} items={taskIds} strategy={verticalListSortingStrategy}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {tasks.map((task) => (
            <SortableTaskCard 
              key={task._id} 
              task={task} 
              onDelete={onDeleteTask} 
              onAddComment={onAddComment}
              onEditTask={onEditTask}
            />
          ))}
          {tasks.length === 0 && (
            <Box sx={{ border: "2px dashed grey", borderRadius: 1, p: 1.5, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">Drop tasks here</Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Paper>
  );
};

/* ---------- Main Kanban ---------- */
const DragDropKanban = ({ projectId }) => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    status: "todo",
    _id: null 
  });
  const [commentTask, setCommentTask] = useState(null);
  const [commentText, setCommentText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    console.log("🚀 Kanban Component Mounted with projectId:", projectId);
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      console.log("📥 Loading tasks for project:", projectId);
      
      // Try to load from local storage first
      const localTasks = loadTasksFromLocal(projectId);
      if (localTasks) {
        console.log("📂 Loaded from local storage:", localTasks);
        setTasks(localTasks);
        setHasUnsyncedChanges(true);
      }

      // Then try to fetch from server
      console.log("🌐 Fetching from server...");
      const { success, data } = await taskAPI.getTasks(projectId);
      if (success && data) {
        const normalized = {
          todo: data.todo || [],
          inprogress: data.inprogress || [],
          done: data.done || [],
        };
        console.log("✅ Server data received:", normalized);
        setTasks(normalized);
        saveTasksToLocal(projectId, normalized);
        setHasUnsyncedChanges(false);
      }
    } catch (error) {
      console.log("❌ Error loading tasks:", error.message);
      console.log("📦 Using local tasks only");
    } finally {
      setLoading(false);
      console.log("📊 Final tasks state:", tasks);
    }
  };

  const saveAndMark = (newTasks) => {
    console.log("💾 Saving tasks:", newTasks);
    setTasks(newTasks);
    saveTasksToLocal(projectId, newTasks);
    setHasUnsyncedChanges(true);
  };

  /* Debug Functions */
  const debugTasks = () => {
    console.log("🐛 === DEBUG TASKS ===");
    console.log("📋 All Tasks:", tasks);
    console.log("📊 Task Counts:", {
      todo: tasks.todo.length,
      inprogress: tasks.inprogress.length,
      done: tasks.done.length,
      total: tasks.todo.length + tasks.inprogress.length + tasks.done.length
    });
    
    // Show all task IDs
    const allTasks = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    console.log("🆔 All Task IDs:", allTasks.map(t => ({ id: t._id, title: t.title, status: t.status })));
    
    // Check for duplicates
    const taskIds = allTasks.map(t => t._id);
    const duplicates = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn("⚠️ DUPLICATE TASK IDs:", duplicates);
    }
  };

  const addTestTask = () => {
    console.log("🧪 Adding test task...");
    const testTask = {
      _id: `test_${Date.now()}`,
      title: `Test Task ${tasks.todo.length + 1}`,
      description: "This is a test task for debugging",
      status: "todo",
      isLocal: true,
      comments: []
    };
    
    const updatedTasks = {
      ...tasks,
      todo: [...tasks.todo, testTask]
    };
    
    saveAndMark(updatedTasks);
    toast.success("Test task added");
  };

  /* Drag & Drop */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    console.log("🎯 Drag End:", { active: active?.id, over: over?.id });
    
    setActiveTask(null);
    if (!over) {
      console.log("❌ No drop target");
      return;
    }

    const activeId = active.id;
    
    // Find source column and task
    let sourceCol = null;
    let task = null;
    
    Object.entries(tasks).forEach(([colKey, colTasks]) => {
      const foundTask = colTasks.find(t => t._id === activeId);
      if (foundTask) {
        sourceCol = colKey;
        task = foundTask;
      }
    });

    console.log("🔍 Found task:", { sourceCol, task: task?.title });

    if (!task) {
      console.log("❌ Task not found");
      return;
    }

    const targetCol = over.data?.current?.sortable?.containerId || over.id || sourceCol;
    console.log("🎯 Target column:", targetCol);

    if (sourceCol === targetCol) {
      // Reorder within same column
      const oldIndex = tasks[sourceCol].findIndex(t => t._id === activeId);
      const newIndex = tasks[sourceCol].findIndex(t => t._id === over.id);
      
      console.log("🔄 Reordering:", { sourceCol, oldIndex, newIndex });
      
      if (oldIndex !== newIndex && newIndex !== -1) {
        const newCol = arrayMove(tasks[sourceCol], oldIndex, newIndex);
        saveAndMark({ ...tasks, [sourceCol]: newCol });
        console.log("✅ Reorder completed");
      }
    } else {
      // Move to different column
      console.log("🚚 Moving to different column:", { sourceCol, targetCol });
      
      const sourceTasks = tasks[sourceCol].filter(t => t._id !== activeId);
      const targetTasks = [...tasks[targetCol]];
      const updatedTask = { ...task, status: targetCol };
      
      targetTasks.push(updatedTask);
      saveAndMark({ 
        ...tasks, 
        [sourceCol]: sourceTasks, 
        [targetCol]: targetTasks 
      });
      
      console.log("✅ Move completed");
    }
  };

  /* Add/Edit Task */
  const handleAddOrUpdateTask = (e) => {
    e.preventDefault();
    console.log("📝 Form submitted:", formData);
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      isLocal: true
    };

    if (formData._id) {
      // Update existing task
      console.log("✏️ Updating task:", formData._id);
      
      const updatedTasks = { ...tasks };
      
      // Remove from current column
      Object.keys(updatedTasks).forEach(col => {
        const originalLength = updatedTasks[col].length;
        updatedTasks[col] = updatedTasks[col].filter(t => t._id !== formData._id);
        console.log(`🗑️ Column ${col}: ${originalLength} -> ${updatedTasks[col].length}`);
      });
      
      // Add to new column with updated data
      const existingTask = [...tasks.todo, ...tasks.inprogress, ...tasks.done]
        .find(t => t._id === formData._id);
      
      const updatedTask = { 
        ...existingTask, 
        ...taskData 
      };
      
      updatedTasks[formData.status] = [...updatedTasks[formData.status], updatedTask];
      
      console.log("✅ Final updated tasks:", updatedTasks);
      saveAndMark(updatedTasks);
      toast.success("Task updated locally");
    } else {
      // Add new task
      console.log("🆕 Adding new task");
      const newTask = {
        ...taskData,
        _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        comments: []
      };
      
      const updatedTasks = {
        ...tasks,
        [formData.status]: [...tasks[formData.status], newTask]
      };
      
      console.log("✅ New task added:", newTask);
      saveAndMark(updatedTasks);
      toast.success("Task added locally");
    }

    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      description: "", 
      status: "todo",
      _id: null 
    });
  };

  const handleEditTask = (task) => {
    console.log("✏️ Edit task triggered:", task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      _id: task._id
    });
    setOpenDialog(true);
  };

  const handleAddTask = (status = "todo") => {
    console.log("➕ Add task to column:", status);
    setFormData({ 
      title: "", 
      description: "", 
      status: status,
      _id: null 
    });
    setOpenDialog(true);
  };

  /* Delete Task */
  const handleDeleteTask = (taskId, status) => {
    console.log("🗑️ DELETE TRIGGERED:", { 
      taskId, 
      status, 
      currentTasks: tasks[status] 
    });
    
    if (window.confirm("Are you sure you want to delete this task?")) {
      const updatedTasks = {
        ...tasks,
        [status]: tasks[status].filter(task => {
          const shouldKeep = task._id !== taskId;
          console.log(`🔍 Checking task ${task._id}: ${shouldKeep ? "KEEP" : "DELETE"}`);
          return shouldKeep;
        })
      };
      
      console.log("✅ Tasks after deletion:", updatedTasks[status]);
      saveAndMark(updatedTasks);
      toast.success("Task deleted locally");
    } else {
      console.log("❌ Delete cancelled by user");
    }
  };

  /* Comments */
  const handleAddComment = (task) => {
    console.log("💬 Add comment to task:", task._id);
    setCommentTask(task);
    setCommentText("");
  };

  const submitComment = () => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    console.log("💬 Submitting comment:", commentText);
    
    const updatedTasks = { ...tasks };
    const newComment = { 
      text: commentText.trim(), 
      user: { name: "You" },
      createdAt: new Date().toISOString()
    };

    Object.keys(updatedTasks).forEach(col => {
      updatedTasks[col] = updatedTasks[col].map(task => 
        task._id === commentTask._id 
          ? { 
              ...task, 
              comments: [...(task.comments || []), newComment] 
            }
          : task
      );
    });

    saveAndMark(updatedTasks);
    setCommentTask(null);
    setCommentText("");
    toast.success("Comment added locally");
  };

  /* Sync */
  const handleSyncToServer = async () => {
    console.log("🔄 Syncing to server...");
    setSyncing(true);
    try {
      const allTasks = [
        ...tasks.todo.map((t, i) => ({ ...t, position: i })),
        ...tasks.inprogress.map((t, i) => ({ ...t, position: i })),
        ...tasks.done.map((t, i) => ({ ...t, position: i })),
      ].map(({ isLocal, ...task }) => task); // Remove isLocal flag

      console.log("📤 Sending tasks to server:", allTasks);
      
      const { success, data } = await taskAPI.bulkUpdateTasks(projectId, allTasks);
      if (success) {
        const normalized = { 
          todo: data.todo || [], 
          inprogress: data.inprogress || [], 
          done: data.done || [] 
        };
        console.log("✅ Server response:", normalized);
        setTasks(normalized);
        saveTasksToLocal(projectId, normalized);
        setHasUnsyncedChanges(false);
        toast.success("Synced successfully!");
      }
    } catch (error) {
      console.error("❌ Sync failed:", error);
      toast.error("Sync failed, tasks saved locally");
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    { key: "todo", title: "To Do", color: "warning" },
    { key: "inprogress", title: "In Progress", color: "info" },
    { key: "done", title: "Done", color: "success" },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading tasks…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Project Board (Debug Mode)</Typography>
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            startIcon={<Add />} 
            onClick={() => handleAddTask()}
          >
            Add Task
          </Button>
          
          {/* Debug Buttons */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BugReport />}
            onClick={debugTasks}
          >
            Debug
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={addTestTask}
          >
            Add Test Task
          </Button>
          
          <Button
            variant="contained"
            color={hasUnsyncedChanges ? "secondary" : "primary"}
            onClick={handleSyncToServer}
            disabled={syncing || !hasUnsyncedChanges}
            startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
          >
            {syncing ? "Syncing..." : hasUnsyncedChanges ? "Sync Now" : "Synced"}
          </Button>
        </Box>
      </Box>

      {/* Task Count Summary */}
      <Box display="flex" gap={2} mb={2}>
        <Chip label={`To Do: ${tasks.todo.length}`} color="warning" variant="outlined" />
        <Chip label={`In Progress: ${tasks.inprogress.length}`} color="info" variant="outlined" />
        <Chip label={`Done: ${tasks.done.length}`} color="success" variant="outlined" />
        <Chip 
          label={hasUnsyncedChanges ? "Unsynced Changes" : "All Synced"} 
          color={hasUnsyncedChanges ? "secondary" : "primary"} 
        />
      </Box>

      {/* Kanban Board */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={(e) => {
          console.log("🎯 Drag Start:", e.active.id);
          setActiveTask(e.active.id);
        }} 
        onDragEnd={handleDragEnd}
      >
        <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 2 }}>
          {columns.map((col) => (
            <SortableColumn
              key={col.key}
              column={col}
              tasks={tasks[col.key] || []}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
              onAddComment={handleAddComment}
              onEditTask={handleEditTask}
            />
          ))}
        </Box>
        <DragOverlay>
          {activeTask && (
            <Card sx={{ width: 220, boxShadow: 6, opacity: 0.8 }}>
              <CardContent>
                <Typography variant="subtitle2">
                  {[...tasks.todo, ...tasks.inprogress, ...tasks.done]
                    .find(t => t._id === activeTask)?.title || "…"}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Task Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{formData._id ? "Edit Task" : "Create Task"}</DialogTitle>
        <form onSubmit={handleAddOrUpdateTask}>
          <DialogContent>
            <TextField 
              autoFocus 
              label="Title" 
              fullWidth 
              required 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              sx={{ mb: 2 }}
            />
            <TextField 
              label="Description" 
              fullWidth 
              multiline 
              rows={3} 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              sx={{ mb: 2 }}
            />
            <TextField 
              select 
              label="Status" 
              fullWidth 
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenDialog(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" variant="contained">
              {formData._id ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={!!commentTask} onClose={() => setCommentTask(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment to "{commentTask?.title}"</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus 
            label="Comment" 
            fullWidth 
            multiline 
            rows={3} 
            value={commentText} 
            onChange={(e) => setCommentText(e.target.value)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentTask(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitComment}>Add Comment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DragDropKanban;