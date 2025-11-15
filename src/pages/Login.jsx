import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // debug: show what we're sending
      console.log('Submitting login payload:', { email: formData.email, password: formData.password });

      const result = await login(formData.email, formData.password);
      console.log('Login result from AuthContext:', result);

      // If your login returns standardized object: { success: true/false, message? }
      if (result?.success) {
        toast.success(result.message || 'Login successful');
        navigate('/projects');
        return;
      }

      // If result exists but success is false — show message
      const msg = result?.message || 'Invalid credentials';
      toast.error(msg);

      // If backend returns field-specific errors object: { errors: { email: '...' } }
      if (result?.errors && typeof result.errors === 'object') {
        setErrors((p) => ({ ...p, ...result.errors }));
      } else {
        // generic inline error for password/email
        setErrors((p) => ({ ...p, password: 'Invalid email or password' }));
      }
    } catch (err) {
      // err may be thrown by api wrapper; try to extract useful info
      console.error('Login catch error:', err);
      const serverMsg = err?.message || err?.payload?.message || 'Server error during login';
      toast.error(serverMsg);

      // If server responds with 400 and message 'Invalid credentials' mark password error
      if (err?.status === 400 || /invalid/i.test(serverMsg)) {
        setErrors((p) => ({ ...p, password: 'Invalid email or password' }));
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Trello Clone
          </Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="large">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
