import PersonCreationForm from '../components/PersonCreationForm.js';
import Link from 'next/link';

export default function PeoplePage() {
  return (
    <main>
      <h1>Person Management</h1>
      <PersonCreationForm />
      <Link href="/people/list">
        <button style={{ marginTop: 16 }}>View All People</button>
      </Link>
      {/* Future: Add person list and management features here */}
    </main>
  );
} 