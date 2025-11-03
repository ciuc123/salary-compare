import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [nameA, setNameA] = useState('Alex');
  const [nameB, setNameB] = useState('Maria');
  const [annualA, setAnnualA] = useState('50000');
  const [annualB, setAnnualB] = useState('80000');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameA, nameB, annualA, annualB }),
    });
    const data = await res.json();
    setLoading(false);
    if (data?.slug) {
      router.push(`/compare/${data.slug}`);
    } else {
      alert('Failed to create');
    }
  };

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Salary Compare</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <label>
          Name A
          <input value={nameA} onChange={(e) => setNameA(e.target.value)} />
        </label>
        <label>
          Annual A
          <input value={annualA} onChange={(e) => setAnnualA(e.target.value)} />
        </label>
        <label>
          Name B
          <input value={nameB} onChange={(e) => setNameB(e.target.value)} />
        </label>
        <label>
          Annual B
          <input value={annualB} onChange={(e) => setAnnualB(e.target.value)} />
        </label>
        <button disabled={loading} type="submit">{loading ? 'Creating...' : 'Create Comparison'}</button>
      </form>
    </main>
  );
}

