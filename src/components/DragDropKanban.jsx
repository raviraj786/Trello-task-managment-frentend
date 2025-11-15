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
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Sortable Task Card
const SortableTaskCard = ({ task, onDelete, status }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        sx={{
          mb: 2,
          cursor: "grab",
          transition: "all 0.2s ease",
          "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
          "&:active": { cursor: "grabbing" },
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
            {task.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            paragraph
            sx={{ fontSize: "0.875rem" }}
          >
            {task.description || "No description"}
          </Typography>

          {/* Assignee and Due Date */}
          <Box display="flex" flexDirection="column" gap={1}>
            {task.assignee && (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                  {task.assignee.name?.charAt(0) || "U"}
                </Avatar>
                <Typography variant="caption">{task.assignee.name}</Typography>
              </Box>
            )}
            {task.dueDate && (
              <Chip
                label={new Date(task.dueDate).toLocaleDateString()}
                size="small"
                variant="outlined"
                color={
                  new Date(task.dueDate) < new Date() ? "error" : "default"
                }
              />
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        <Box display="flex" justifyContent="flex-end" p={1}>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id, status);
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Card>
    </div>
  );
};

// Sortable Column
const SortableColumn = ({ column, tasks, onDeleteTask, onAddTask }) => {
  const taskIds = tasks.map((task) => task._id);

  return (
    <Paper
      sx={{
        minWidth: 300,
        flex: 1,
        p: 2,
        backgroundColor: "grey.50",
        minHeight: 400,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: `${column.color}.main`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          {column.title}
          <Chip
            label={tasks.length}
            size="small"
            color={column.color}
            sx={{ ml: 1 }}
          />
        </span>
        <IconButton
          size="small"
          onClick={() => onAddTask(column.key)}
          sx={{ color: `${column.color}.main` }}
        >
          <Add />
        </IconButton>
      </Typography>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minHeight: 200,
          }}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              status={column.key}
              onDelete={onDeleteTask}
            />
          ))}
          {tasks.length === 0 && (
            <Box
              sx={{
                border: "2px dashed",
                borderColor: "grey.300",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Drop tasks here
              </Typography>
            </Box>
          )}
        </Box>
      </SortableContext>
    </Paper>
  );
};

// Main Kanban Component
const DragDropKanban = ({ projectId }) => {
  const [tasks, setTasks] = useState({ todo: [], inprogress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    status: "todo",
  });
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleDragStart = (event) => {
    setActiveTask(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find task and source column
    let sourceColumn = null,
      task = null;
    for (const [key, columnTasks] of Object.entries(tasks)) {
      const t = columnTasks.find((t) => t._id === activeId);
      if (t) {
        sourceColumn = key;
        task = t;
        break;
      }
    }
    if (!task) return;

    const overColumn =
      Object.keys(tasks).find((key) =>
        tasks[key].some((t) => t._id === overId)
      ) || sourceColumn;

    if (sourceColumn === overColumn) {
      // Same column reorder
      const oldIndex = tasks[sourceColumn].findIndex((t) => t._id === activeId);
      const newIndex = tasks[sourceColumn].findIndex((t) => t._id === overId);
      if (oldIndex !== newIndex) {
        const newTasks = {
          ...tasks,
          [sourceColumn]: arrayMove(tasks[sourceColumn], oldIndex, newIndex),
        };
        setTasks(newTasks);
        try {
          await taskAPI.updateTaskPosition(projectId, activeId, {
            status: overColumn,
            position: newIndex,
          });
        } catch {
          toast.error("Failed to update task position");
          fetchTasks();
        }
      }
    } else {
      // Move to different column
      const sourceTasks = tasks[sourceColumn].filter((t) => t._id !== activeId);
      const destTasks = [...tasks[overColumn]];
      const movedTask = { ...task, status: overColumn };
      const newIndex = destTasks.findIndex((t) => t._id === overId);
      if (newIndex >= 0) destTasks.splice(newIndex, 0, movedTask);
      else destTasks.push(movedTask);
      const newTasks = {
        ...tasks,
        [sourceColumn]: sourceTasks,
        [overColumn]: destTasks,
      };
      setTasks(newTasks);

      try {
        await taskAPI.updateTaskPosition(projectId, activeId, {
          status: overColumn,
          position: newIndex >= 0 ? newIndex : destTasks.length - 1,
        });
        toast.success(`Task moved to ${overColumn}`);
      } catch {
        toast.error("Failed to move task");
        fetchTasks();
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Task title is required");

    const payload = { ...formData };
    if (!payload.assignee.trim()) delete payload.assignee;

    try {
      const response = await taskAPI.createTask(projectId, payload);
      if (response.success) {
        setTasks((prev) => ({
          ...prev,
          [payload.status]: [...prev[payload.status], response.data],
        }));
        setOpenDialog(false);
        setFormData({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          status: "todo",
        });
        toast.success("Task created successfully!");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteTask = async (taskId, status) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await taskAPI.deleteTask(projectId, taskId);
      if (response.success) {
        setTasks((prev) => ({
          ...prev,
          [status]: prev[status].filter((t) => t._id !== taskId),
        }));
        toast.success("Task deleted successfully!");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openAddTaskDialog = (status = "todo") => {
    setFormData((prev) => ({ ...prev, status }));
    setOpenDialog(true);
  };

  const getActiveTask = () => {
    const allTasks = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
    return allTasks.find((t) => t._id === activeTask);
  };

  const columns = [
    { key: "todo", title: "To Do", color: "warning" },
    { key: "inprogress", title: "In Progress", color: "info" },
    { key: "done", title: "Done", color: "success" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Project Board</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openAddTaskDialog()}
        >
          Add Task
        </Button>
      </Box>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          display="flex"
          gap={2}
          sx={{ overflowX: "auto", pb: 2, minHeight: 500 }}
        >
          {columns.map((col) => (
            <SortableColumn
              key={col.key}
              column={col}
              tasks={tasks[col.key] || []}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTaskDialog}
            />
          ))}
        </Box>

        <DragOverlay>
          {activeTask && (
            <Card sx={{ width: 280, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6">
                  {getActiveTask()?.title || "Task"}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Task Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <form onSubmit={handleCreateTask}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <TextField
              margin="dense"
              label="Status"
              fullWidth
              select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              label="Due Date"
              fullWidth
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create Task
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DragDropKanban;
