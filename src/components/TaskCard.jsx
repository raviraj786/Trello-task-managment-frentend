// components/TaskCard.jsx
import React from "react";
import { Card, CardContent, Typography, Box, IconButton, Chip, Avatar } from "@mui/material";
import { Delete, Edit, Comment } from "@mui/icons-material";

export default function TaskCard({ task, onDelete, onEdit, onComment, listeners, attributes, setNodeRef, isDragging }) {
  const style = {
    transform: attributes && attributes.style ? attributes.style.transform : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  const stop = (e) => {
    e.stopPropagation();
    if (e.nativeEvent?.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div ref={setNodeRef} style={style} {...(attributes || {})} {...(listeners || {})}>
      <Card sx={{ mb: 1, cursor: "grab" }}>
        <CardContent sx={{ p: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {task.title}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (ID: {task._id})
            </Typography>
          </Typography>

          {task.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {task.description}
            </Typography>
          )}

          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            {task.assignee && <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>{task.assignee.name?.[0] || "U"}</Avatar>}
            {task.dueDate && <Chip label={new Date(task.dueDate).toLocaleDateString()} size="small" />}
            {task.isLocal && <Chip label="Unsynced" size="small" color="secondary" />}
          </Box>

          <Box display="flex" justifyContent="space-between" mt={1} alignItems="center">
            <Box>
              <IconButton
                size="small"
                onPointerDown={stop}
                onMouseDown={stop}
                onClick={(e) => { stop(e); onComment?.(task); }}
                title="Comment"
              >
                <Comment fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onPointerDown={stop}
                onMouseDown={stop}
                onClick={(e) => { stop(e); onEdit?.(task); }}
                title="Edit"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Box>

            <IconButton
              size="small"
              color="error"
              onPointerDown={stop}
              onMouseDown={stop}
              onClick={(e) => { stop(e); onDelete?.(task._id, task.status); }}
              title="Delete"
            >
              <Delete fontSize="large" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
