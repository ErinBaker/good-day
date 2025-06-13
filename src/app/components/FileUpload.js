import React, { useRef, useState } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function FileUpload({ onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.');
      setSelectedFile(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 5MB.');
      setSelectedFile(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }
    setError('');
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          border: dragOver
            ? `2px solid ${theme.palette.primary.main}`
            : `2px dashed ${isDark ? theme.palette.divider : '#aaa'}`,
          textAlign: 'center',
          cursor: 'pointer',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'border 0.2s, background 0.2s',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current.click()}
        aria-label="File upload dropzone"
      >
        <Typography
          variant="body1"
          gutterBottom
          sx={{
            color: theme.palette.text.secondary,
            opacity: 0.85,
            fontWeight: 500,
            fontSize: 16,
          }}
        >
          Drag & drop an image here, or click to select
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleChange}
          aria-label="Choose image file"
        />
        {selectedFile && (
          <Box mt={2}>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
            />
            <Typography variant="caption" display="block" mt={1}>
              {selectedFile.name}
            </Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </Paper>
    </Box>
  );
}

export default FileUpload;
