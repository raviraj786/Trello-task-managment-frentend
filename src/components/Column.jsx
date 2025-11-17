// components/Column.jsx
import React from "react";
import { Paper, Typography, IconButton, Box, Chip } from "@mui/material";
import { Add } from "@mui/icons-material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks, onAddTask, onDeleteTask, onEditTask, onAddComment }) {
  const ids = tasks.map(t => t._id);

  return (
    <Paper sx={{ minWidth: 250, flex: 1, p: 1, minHeight: 400, overflowY: "auto", border: "1px solid #ddd" }}>
      <Typography variant="subtitle1" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{column.title}<Chip label={tasks.length} size="small" sx={{ ml: 1 }} /></span>
        <IconButton size="small" onClick={() => onAddTask(column.key)}><Add /></IconButton>
      </Typography>

      <SortableContext id={column.key} items={ids} strategy={verticalListSortingStrategy}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onComment={onAddComment}
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
}
