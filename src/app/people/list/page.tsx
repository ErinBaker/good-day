'use client';

import { useEffect, useState } from 'react';

type Person = {
  id: string | number;
  name: string;
  relationship?: string | null;
  createdAt: string;
  updatedAt: string;
};

function EditPersonModal({ person, open, onClose, onSave }: { person: Person | null, open: boolean, onClose: () => void, onSave: (updated: Person) => void }) {
  const [name, setName] = useState(person?.name || '');
  const [relationship, setRelationship] = useState(person?.relationship || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setName(person?.name || '');
    setRelationship(person?.relationship || '');
    setError(null);
    setSuccess(null);
  }, [person, open]);

  if (!open || !person) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
          query: `mutation UpdatePerson($id: ID!, $input: PersonInput!) { updatePerson(id: $id, input: $input) { id name relationship createdAt updatedAt } }`,
          variables: { id: person.id, input: { name: trimmedName, relationship: relationship || null } },
        }),
      });
      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setError(json.errors[0].message);
      } else {
        setSuccess('Person updated successfully!');
        onSave(json.data.updatePerson);
        onClose();
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400 }}>
        <h2>Edit Person</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="edit-name">Name *</label><br />
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <label htmlFor="edit-relationship">Relationship</label><br />
            <input
              id="edit-relationship"
              type="text"
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        </form>
      </div>
    </div>
  );
}

// Simple Toast implementation
function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      background: type === 'error' ? '#f44336' : '#4caf50',
      color: '#fff',
      padding: '16px 32px',
      borderRadius: 8,
      zIndex: 2000,
      minWidth: 240,
      textAlign: 'center',
      fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 16, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Close</button>
    </div>
  );
}

export default function PeopleListPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'confirm', onConfirm?: () => void } | null>(null);

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query People($sortBy: String) { people(sortBy: $sortBy) { id name relationship createdAt updatedAt } }`,
            variables: { sortBy },
          }),
        });
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          setError(json.errors[0].message);
        } else {
          setPeople(json.data.people || []);
        }
      } catch {
        setError('Failed to fetch people.');
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, [sortBy]);

  const filteredPeople = people
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.relationship || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      switch (sortBy) {
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'relationship':
          valA = a.relationship || '';
          valB = b.relationship || '';
          break;
        case 'createdAt':
          valA = a.createdAt;
          valB = b.createdAt;
          break;
        case 'updatedAt':
          valA = a.updatedAt;
          valB = b.updatedAt;
          break;
        default:
          break;
      }
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleEditClick = (person: Person) => {
    setEditPerson(person);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditPerson(null);
  };

  const handlePersonSave = (updated: Person) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteClick = (person: Person) => {
    setToast({
      message: `Delete ${person.name}? This cannot be undone.`,
      type: 'confirm',
      onConfirm: async () => {
        setToast(null);
        try {
          const res = await fetch('/api/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `mutation DeletePerson($id: ID!) { deletePerson(id: $id) }`,
              variables: { id: person.id },
            }),
          });
          const json = await res.json();
          if (json.errors && json.errors.length > 0) {
            setToast({ message: json.errors[0].message, type: 'error' });
          } else if (json.data.deletePerson) {
            setPeople(prev => prev.filter(p => p.id !== person.id));
            setToast({ message: 'Person deleted.', type: 'success' });
          } else {
            setToast({ message: 'Failed to delete person.', type: 'error' });
          }
        } catch {
          setToast({ message: 'An unexpected error occurred.', type: 'error' });
        }
      }
    });
  };

  return (
    <main>
      <h1>People List</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name or relationship"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <label>Sort by: </label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} title="Sort by">
          <option value="name">Name</option>
          <option value="relationship">Relationship</option>
          <option value="createdAt">Created At</option>
          <option value="updatedAt">Updated At</option>
        </select>
        <button onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))} style={{ marginLeft: 8 }}>
          {sortOrder === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', maxWidth: 800 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.length === 0 ? (
              <tr><td colSpan={5}>No people found.</td></tr>
            ) : (
              filteredPeople.map(person => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.relationship || '-'}</td>
                  <td>{new Date(person.createdAt).toLocaleString()}</td>
                  <td>{new Date(person.updatedAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => handleEditClick(person)}>Edit</button>
                    <button onClick={() => handleDeleteClick(person)} style={{ marginLeft: 8, color: '#f44336' }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <EditPersonModal
        person={editPerson}
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handlePersonSave}
      />
      {toast && toast.type === 'confirm' && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2001, background: '#333', color: '#fff', padding: 24, borderRadius: 8, minWidth: 280, textAlign: 'center', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {toast.message}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button onClick={toast.onConfirm} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}>Delete</button>
            <button onClick={() => setToast(null)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {toast && toast.type !== 'confirm' && (
        <Toast message={toast.message} type={toast.type as 'success' | 'error'} onClose={() => setToast(null)} />
      )}
    </main>
  );
} 