import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function fmt(value: number, currency = 'EUR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default function ComparePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const baseARef = useRef(0);
  const baseBRef = useRef(0);
  const [displayA, setDisplayA] = useState(0);
  const [displayB, setDisplayB] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/compare/${slug}`).then((r) => r.json()).then((d) => {
      if (d?.error) return setError(d.error);
      setData(d);
      const createdAt = new Date(d.createdAt).getTime();
      const now = Date.now();
      const elapsed = (now - createdAt) / 1000;
      baseARef.current = d.perSecA * elapsed;
      baseBRef.current = d.perSecB * elapsed;
      setDisplayA(baseARef.current);
      setDisplayB(baseBRef.current);
      startRef.current = Date.now();
    }).catch((e) => setError('Fetch error'));
  }, [slug]);

  useEffect(() => {
    function tick() {
      if (!running) return;
      const now = Date.now();
      const since = startRef.current ? (now - startRef.current) / 1000 : 0;
      const a = baseARef.current + (data?.perSecA || 0) * since;
      const b = baseBRef.current + (data?.perSecB || 0) * since;
      setDisplayA(a);
      setDisplayB(b);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data, running]);

  const toggle = () => {
    if (running) {
      setRunning(false);
    } else {
      // resume: adjust startRef so we continue from current display
      startRef.current = Date.now();
      baseARef.current = displayA;
      baseBRef.current = displayB;
      setRunning(true);
    }
  };

  const replayLocal = () => {
    startRef.current = Date.now();
    baseARef.current = 0;
    baseBRef.current = 0;
    setDisplayA(0);
    setDisplayB(0);
    setRunning(true);
  };

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>{data.nameA} vs {data.nameB}</h1>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24 }}>{data.nameA}</div>
          <div style={{ fontSize: 20 }}>{fmt(displayA, data.currency)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24 }}>{data.nameB}</div>
          <div style={{ fontSize: 20 }}>{fmt(displayB, data.currency)}</div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={toggle}>{running ? 'Pause' : 'Resume'}</button>
        <button onClick={replayLocal}>Replay (local)</button>
        <button onClick={() => {
          if (navigator.share) navigator.share({ title: `${data.nameA} vs ${data.nameB}`, url: window.location.href });
          else navigator.clipboard.writeText(window.location.href).then(() => alert('Copied to clipboard'));
        }}>Share</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ border: '1px solid #ddd', padding: 12, minHeight: 90 }}>
          Carbon Ads placeholder
        </div>
      </div>
    </main>
  );
}

