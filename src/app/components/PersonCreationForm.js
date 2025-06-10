'use client';

import React, { useState } from 'react';

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
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '1em 0' }}>
      <div>
        <label htmlFor="name">Name *</label><br />
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <label htmlFor="relationship">Relationship</label><br />
        <input
          id="relationship"
          type="text"
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Creating...' : 'Create Person'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
    </form>
  );
} 