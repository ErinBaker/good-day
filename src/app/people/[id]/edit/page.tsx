"use client";
import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const PERSON_QUERY = gql`
  query Person($id: ID!) {
    person(id: $id) {
      id
      name
      relationship
    }
  }
`;

export default function EditPersonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(PERSON_QUERY, { variables: { id } });
  const person = data?.person;

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name || '');
      setRelationship(person.relationship || '');
    }
  }, [person]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation UpdatePerson($id: ID!, $input: PersonInput!) { updatePerson(id: $id, input: $input) { id name relationship } }`,
          variables: { id, input: { name: trimmedName, relationship: relationship || null } },
        }),
      });
      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setFormError(json.errors[0].message);
      } else {
        setSuccess('Person updated successfully!');
        setTimeout(() => router.push(`/people/${id}`), 1200);
      }
    } catch {
      setFormError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Error loading person: {error.message}</Alert>;
  if (!person) return <Alert severity="warning">Person not found.</Alert>;

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>Edit Person</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          id="name"
          label="Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          fullWidth
          error={!!formError && !name.trim()}
          helperText={!!formError && !name.trim() ? formError : ''}
          autoFocus
        />
        <TextField
          id="relationship"
          label="Relationship"
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          fullWidth
        />
        {formError && name.trim() && (
          <Alert severity="error">{formError}</Alert>
        )}
        {success && (
          <Alert severity="success">{success}</Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save Changes'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => router.push(`/people/${id}`)} disabled={saving}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
} 