import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import { AccountCircle, Dashboard } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 0, 
            mr: 4,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => navigate('/')}
        >
          📋 TrelloClone
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/')}
            sx={{ 
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/projects')}
            sx={{ 
              backgroundColor: isActive('/projects') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Projects
          </Button>
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Hello, {user?.name}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;