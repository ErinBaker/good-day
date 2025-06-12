'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, Typography } from '@mui/material';
import { gql, useMutation } from '@apollo/client';

const CREATE_PERSON = gql`
  mutation CreatePerson($input: PersonInput!) {
    createPerson(input: $input) {
      id
      name
      relationship
    }
  }
`;

export default function PersonCreationForm({ onCreated }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createPerson, { loading }] = useMutation(CREATE_PERSON);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    try {
      const { data } = await createPerson({
        variables: { input: { name: trimmedName, relationship: relationship || null } },
        // Optionally, refetchQueries or update cache here
      });
      if (data?.createPerson) {
        setSuccess('Person created successfully!');
        setName('');
        setRelationship('');
        if (onCreated) onCreated(data.createPerson);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
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