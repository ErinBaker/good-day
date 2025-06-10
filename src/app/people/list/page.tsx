'use client';

import { useEffect, useState } from 'react';

type Person = {
  id: string | number;
  name: string;
  relationship?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function PeopleListPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    <button disabled title="Edit coming soon">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </main>
  );
} 