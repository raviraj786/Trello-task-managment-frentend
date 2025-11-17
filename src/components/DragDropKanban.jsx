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
import {
  Add,
  Delete,
  Sync,
  Comment,
  Edit,
  BugReport,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
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

/* ---------- Sortable Task Card (unchanged logic but smaller & styled) ---------- */
const SortableTaskCard = ({ task, onDelete, onAddComment, onEditTask }) => {
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
    opacity: isDragging ? 0.6 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task._id, task.status);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEditTask(task);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    onAddComment(task);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        sx={{
          mb: 1,
          cursor: "grab",
          fontSize: "0.76rem",
          borderRadius: 2,
          boxShadow: 2,
          overflow: "visible",
        }}
      >
        <CardContent sx={{ p: 1 }}>
          <Typography variant="subtitle2" fontWeight="700" noWrap>
            {task.title}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1 }}
            >
              {task.isLocal
                ? "(local)"
                : `(id:${String(task._id).slice(0, 6)})`}
            </Typography>
          </Typography>

          {task.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.4, display: "block" }}
              noWrap
            >
              {task.description}
            </Typography>
          )}

          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            <Avatar sx={{ width: 20, height: 20, fontSize: "0.65rem" }}>
              {task.assignee?.name?.[0] || "U"}
            </Avatar>
            <Typography variant="caption" sx={{ mr: 1 }}>
              {task.assignee?.name || "Unassigned"}
            </Typography>
            {task.dueDate && (
              <Chip
                label={new Date(task.dueDate).toLocaleDateString()}
                size="small"
                sx={{ ml: "auto" }}
              />
            )}
          </Box>
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
            <IconButton size="small" onClick={handleEdit} title="Edit Task">
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

/* ---------- Column (smaller + colorful) ---------- */
const SortableColumn = ({
  column,
  tasks,
  onDeleteTask,
  onAddTask,
  onAddComment,
  onEditTask,
}) => {
  const taskIds = tasks.map((t) => t._id);

  return (
    <Paper
      sx={{
        minWidth: 220,
        maxWidth: 320,
        flex: "0 0 280px",
        p: 1,
        background: `linear-gradient(180deg, ${column.bgStart}, ${column.bgEnd})`,
        minHeight: 320,
        maxHeight: "72vh",
        overflowY: "auto",
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: column.dot,
            }}
          />
          <strong>{column.title}</strong>
          <Chip label={tasks.length} size="small" sx={{ ml: 1 }} />
        </span>
        <IconButton
          size="small"
          onClick={() => onAddTask(column.key)}
          title="Add Task"
        >
          <Add />
        </IconButton>
      </Typography>

      <SortableContext
        id={column.key}
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
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
            <Box
              sx={{
                border: "2px dashed rgba(255,255,255,0.4)",
                borderRadius: 1,
                p: 1.5,
                textAlign: "center",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <Typography variant="caption">Drop tasks here</Typography>
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
    _id: null,
  });
  const [commentTask, setCommentTask] = useState(null);
  const [commentText, setCommentText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    console.log("🚀 Kanban mounted for project:", projectId);
    loadTasks();
    // eslint-disable-next-line
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const localTasks = loadTasksFromLocal(projectId);
      if (localTasks) {
        console.log("📂 loaded local tasks", localTasks);
        setTasks(localTasks);
        setHasUnsyncedChanges(true);
      }

      const { success, data } = await taskAPI.getTasks(projectId);


      if (success && data) {
        const normalized = {
          todo: data.todo || [],
          inprogress: data.inprogress || [],
          done: data.done || [],
        };
        setTasks(normalized);
        saveTasksToLocal(projectId, normalized);
        setHasUnsyncedChanges(false);
        console.log("🌐 loaded server task ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,s", normalized);
      } else {
        console.warn("⚠ no server tasks or API returned failure");
      }
    } catch (err) {
      console.error("❌ loadTasks error:", err);
      toast.error("Could not load from server — using local data if present");
    } finally {
      setLoading(false);
    }
  };

  const saveAndMark = (newTasks) => {
    setTasks(newTasks);
    saveTasksToLocal(projectId, newTasks);
    setHasUnsyncedChanges(true);
    console.log("💾 saved local state,     unsynced");
  };

  const addTestTask = () => {
    const newTask = {
      _id: `local_${Date.now()}`,
      title: `Test ${Date.now().toString().slice(-4)}`,
      description: "quick test",
      status: "todo",
      isLocal: true,
      comments: [],
    };
    const updated = { ...tasks, todo: [...tasks.todo, newTask] };
    saveAndMark(updated);
    toast.success("Local test task added");
  };

  /* Drag & Drop */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;
    const activeId = active.id;
    // find source & target col
    let sourceCol = null;
    let task = null;
    Object.entries(tasks).forEach(([colKey, colTasks]) => {
      const found = colTasks.find((t) => t._id === activeId);
      if (found) {
        sourceCol = colKey;
        task = found;
      }
    });
    if (!task) {
      console.warn("task not found on drag end:", activeId);
      return;
    }

    const targetCol =
      over.data?.current?.sortable?.containerId || over.id || sourceCol;

    if (sourceCol === targetCol) {
      // reorder within same column
      const oldIndex = tasks[sourceCol].findIndex((t) => t._id === activeId);
      const newIndex = tasks[sourceCol].findIndex((t) => t._id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCol = arrayMove(tasks[sourceCol], oldIndex, newIndex);
        const updated = { ...tasks, [sourceCol]: newCol };
        saveAndMark(updated);
        console.log("🔀 reordered in", sourceCol, activeId);
      }
    } else {
      // move between columns
      const sourceTasks = tasks[sourceCol].filter((t) => t._id !== activeId);
      const updatedTask = { ...task, status: targetCol };
      const targetTasks = [...tasks[targetCol], updatedTask];
      const updated = {
        ...tasks,
        [sourceCol]: sourceTasks,
        [targetCol]: targetTasks,
      };
      saveAndMark(updated);
      console.log("➡ moved", activeId, "from", sourceCol, "to", targetCol);
    }
  };

  /* Add/Edit Task (local) */
  const handleAddOrUpdateTask = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title required");
      return;
    }
    const td = formData.status || "todo";
    if (formData._id) {
      // update
      const updatedTasks = { ...tasks };
      // remove old instance
      Object.keys(updatedTasks).forEach((col) => {
        updatedTasks[col] = updatedTasks[col].filter(
          (t) => t._id !== formData._id
        );
      });
      const prev =
        [...tasks.todo, ...tasks.inprogress, ...tasks.done].find(
          (t) => t._id === formData._id
        ) || {};
      const updatedTask = { ...prev, ...formData, isLocal: true };
      updatedTasks[td] = [...updatedTasks[td], updatedTask];
      saveAndMark(updatedTasks);
      toast.success("Updated locally");
    } else {
      // create
      const newTask = {
        _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: formData.title.trim(),
        description: formData.description || "",
        status: td,
        isLocal: true,
        comments: [],
      };
      const updated = { ...tasks, [td]: [...tasks[td], newTask] };
      saveAndMark(updated);
      toast.success("Created locally");
    }
    setOpenDialog(false);
    setFormData({ title: "", description: "", status: "todo", _id: null });
  };

  const handleEditTask = (task) => {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      _id: task._id,
    });
    setOpenDialog(true);
  };

  const handleAddTask = (status = "todo") => {
    setFormData({ title: "", description: "", status, _id: null });
    setOpenDialog(true);
  };

  /* Delete */
  const handleDeleteTask = (taskId, status) => {
    if (!window.confirm("Delete this task?")) return;
    const updated = {
      ...tasks,
      [status]: tasks[status].filter((t) => t._id !== taskId),
    };
    saveAndMark(updated);
    toast.success("Deleted locally");
  };

  /* Comments */
  const handleAddComment = (task) => {
    setCommentTask(task);
    setCommentText("");
  };

  const submitComment = () => {
    if (!commentText.trim()) {
      toast.error("Comment empty");
      return;
    }
    const updated = { ...tasks };
    const newComment = {
      text: commentText.trim(),
      user: { name: "You" },
      createdAt: new Date().toISOString(),
    };
    Object.keys(updated).forEach((col) => {
      updated[col] = updated[col].map((t) =>
        t._id === commentTask._id
          ? {
              ...t,
              comments: [...(t.comments || []), newComment],
              isLocal: true,
            }
          : t
      );
    });
    saveAndMark(updated);
    setCommentTask(null);
    setCommentText("");
    toast.success("Comment saved locally");
  };

  /* Sync to server - bulk update (replace server board) */
  const handleSyncToServer = async () => {
    setSyncing(true);
    try {
      // flatten and send positions
      const allTasks = [
        ...tasks.todo.map((t, i) => ({ ...t, position: i })),
        ...tasks.inprogress.map((t, i) => ({ ...t, position: i })),
        ...tasks.done.map((t, i) => ({ ...t, position: i })),
      ].map(({ isLocal, ...task }) => task); // strip isLocal marker

      console.log("📤 Sync payload:", allTasks.length, "tasks");
      const { success, data } = await taskAPI.bulkUpdateTasks(
        projectId,
        allTasks
      );
      if (success && data) {
        const normalized = {
          todo: data.todo || [],
          inprogress: data.inprogress || [],
          done: data.done || [],
        };
        setTasks(normalized);
        saveTasksToLocal(projectId, normalized);
        setHasUnsyncedChanges(false);
        toast.success("Synced successfully");
        console.log("✅ sync result", normalized);
      } else {
        throw new Error("sync returned failure");
      }
    } catch (err) {
      console.error("❌ sync error:", err);
      toast.error("Sync failed — local changes preserved");
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      key: "todo",
      title: "To Do",
      bgStart: "#FFFAE6",
      bgEnd: "#FFF7D6",
      dot: "#FFA726",
    },
    {
      key: "inprogress",
      title: "In Progress",
      bgStart: "#E8F7FF",
      bgEnd: "#DFF3FF",
      dot: "#29B6F6",
    },
    {
      key: "done",
      title: "Done",
      bgStart: "#E8FFED",
      bgEnd: "#DFFFE3",
      dot: "#66BB6A",
    },
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Project Board</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => handleAddTask()}
          >
            Add Task
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BugReport />}
            onClick={() =>
              console.table([...tasks.todo, ...tasks.inprogress, ...tasks.done])
            }
          >
            Debug
          </Button>
          <Button variant="outlined" onClick={addTestTask}>
            Add Test Task
          </Button>
          <Button
            variant="contained"
            color={hasUnsyncedChanges ? "secondary" : "primary"}
            onClick={handleSyncToServer}
            disabled={syncing || !hasUnsyncedChanges}
            startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
          >
            {syncing
              ? "Syncing..."
              : hasUnsyncedChanges
              ? "Sync Now"
              : "Synced"}
          </Button>
        </Box>
      </Box>

      {/* Counts */}
      <Box display="flex" gap={2} mb={2}>
        <Chip label={`To Do: ${tasks.todo.length}`} />
        <Chip label={`In Progress: ${tasks.inprogress.length}`} />
        <Chip label={`Done: ${tasks.done.length}`} />
        <Chip
          label={hasUnsyncedChanges ? "Unsynced" : "All Synced"}
          color={hasUnsyncedChanges ? "secondary" : "primary"}
        />
      </Box>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveTask(e.active.id)}
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
            <Card sx={{ width: 220, boxShadow: 8, opacity: 0.9 }}>
              <CardContent>
                <Typography variant="subtitle2">
                  {[...tasks.todo, ...tasks.inprogress, ...tasks.done].find(
                    (t) => t._id === activeTask
                  )?.title || "…"}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setFormData({
            title: "",
            description: "",
            status: "todo",
            _id: null,
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{formData._id ? "Edit Task" : "Create Task"}</DialogTitle>
        <form onSubmit={handleAddOrUpdateTask}>
          <DialogContent>
            <TextField
              autoFocus
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenDialog(false);
                setFormData({
                  title: "",
                  description: "",
                  status: "todo",
                  _id: null,
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {formData._id ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Comment */}
      <Dialog
        open={!!commentTask}
        onClose={() => setCommentTask(null)}
        maxWidth="sm"
        fullWidth
      >
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
          <Button variant="contained" onClick={submitComment}>
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DragDropKanban;
