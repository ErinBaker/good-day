import React, { useRef, useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function FileUpload({ onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.');
      setSelectedFile(null);
      return;
    }
    setError('');
    setSelectedFile(file);
    setResult(null);
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

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setResult(null);
    const formData = new FormData();
    formData.append('photo', selectedFile);
    try {
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Upload failed.';
        // Multer error mapping
        if (msg.includes('File too large')) {
          msg = 'The selected image is too large. Maximum size is 5MB.';
        } else if (msg.includes('Only JPEG, PNG, and WebP images are allowed')) {
          msg = 'Only JPEG, PNG, and WebP images are allowed.';
        } else if (msg.toLowerCase().includes('image processing failed')) {
          msg = 'There was a problem processing your image. Please try another file.';
        }
        setError(msg);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 2,
          border: dragOver ? '2px solid #1976d2' : '2px dashed #aaa',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#e3f2fd' : '#fafafa',
          transition: 'border 0.2s, background 0.2s',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current.click()}
      >
        <Typography variant="body1" gutterBottom>
          Drag & drop an image here, or click to select
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleChange}
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
          <Typography color="error" variant="body2" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>
      <Box display="flex" alignItems="center" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
        >
          Choose Image
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </Box>
      {result &&
        (() => {
          // Use folder and baseFilename from result
          const { folder, baseFilename } = result;
          return (
            <Box mt={3}>
              <Typography variant="subtitle1">Uploaded Images:</Typography>
              <Box display="flex" gap={2} mt={1}>
                <Box>
                  <Typography variant="caption">Original</Typography>
                  <img
                    src={`/api/photos/${folder}/${baseFilename}?size=original`}
                    alt="Original"
                    style={{ maxWidth: 200, borderRadius: 8, display: 'block' }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption">Medium</Typography>
                  <img
                    src={`/api/photos/${folder}/${baseFilename}?size=medium`}
                    alt="Medium"
                    style={{ maxWidth: 120, borderRadius: 8, display: 'block' }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption">Thumbnail</Typography>
                  <img
                    src={`/api/photos/${folder}/${baseFilename}?size=thumbnail`}
                    alt="Thumbnail"
                    style={{ maxWidth: 80, borderRadius: 8, display: 'block' }}
                  />
                </Box>
              </Box>
            </Box>
          );
        })()}
    </Box>
  );
}

export default FileUpload;
