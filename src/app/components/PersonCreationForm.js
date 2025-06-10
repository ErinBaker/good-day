'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, Typography } from '@mui/material';

export default function PersonCreationForm() {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreatePerson($input: PersonInput!) { createPerson(input: $input) { id name relationship } }`,
          variables: { input: { name: trimmedName, relationship: relationship || null } },
        }),
      });
      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setError(json.errors[0].message);
      } else {
        setSuccess('Person created successfully!');
        setName('');
        setRelationship('');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, my: 2, p: 2, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>Add a Person</Typography>
      <TextField
        id="name"
        label="Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        fullWidth
        margin="normal"
        error={!!error && !name.trim()}
        helperText={!!error && !name.trim() ? error : ''}
        autoFocus
      />
      <TextField
        id="relationship"
        label="Relationship"
        value={relationship}
        onChange={e => setRelationship(e.target.value)}
        fullWidth
        margin="normal"
      />
      {error && name.trim() && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null}>
          Create Person
        </Button>
      </Box>
    </Box>
  );
} 