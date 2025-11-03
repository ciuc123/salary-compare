import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { isClient } from '../../lib/env';
import { prisma } from '../../lib/prisma';
import AdSense from '../../components/AdSense';

function fmt(value: number, currency = 'EUR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default function ComparePage({ initialData, baseUrl }: { initialData?: any, baseUrl?: string }) {
  const router = useRouter();
  const { slug } = router.query;
  const [data, setData] = useState<any | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const baseARef = useRef(0);
  const baseBRef = useRef(0);
  const [displayA, setDisplayA] = useState(0);
  const [displayB, setDisplayB] = useState(0);

  // fetch only on client if no initialData
  useEffect(() => {
    if (!isClient) return;
    if (initialData) return; // already have server data
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

  // initialize base values when initialData is provided
  useEffect(() => {
    if (!initialData) return;
    const d = initialData;
    setData(d);
    const createdAt = new Date(d.createdAt).getTime();
    const now = Date.now();
    const elapsed = (now - createdAt) / 1000;
    baseARef.current = d.perSecA * elapsed;
    baseBRef.current = d.perSecB * elapsed;
    setDisplayA(baseARef.current);
    setDisplayB(baseBRef.current);
    startRef.current = Date.now();
  }, [initialData]);

  // animation loop: only run on client
  useEffect(() => {
    if (!isClient) return;
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

  // ensure absolute og:image URL when possible
  const slugForImage = typeof slug === 'string' ? slug : data.slug;
  const ogBase = baseUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  const ogUrl = ogBase ? `${ogBase.replace(/\/$/, '')}/api/og/${slugForImage}` : `/api/og/${slugForImage}`;

  return (
    <>
      <Head>
        <title>{data.nameA} vs {data.nameB} — Salary Compare</title>
        <meta property="og:title" content={`${data.nameA} vs ${data.nameB}`} />
        <meta property="og:description" content="Watch salaries grow live — who earns more per second?" />
        <meta property="og:image" content={ogUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
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
            if (isClient && navigator.share) navigator.share({ title: `${data.nameA} vs ${data.nameB}`, url: window.location.href });
            else if (isClient) navigator.clipboard.writeText(window.location.href).then(() => alert('Copied to clipboard'));
          }}>Share</button>
        </div>

        <div style={{ marginTop: 24 }}>
          <AdSense />
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const slug = context.params?.slug;
  if (!slug || typeof slug !== 'string') return { notFound: true };
  const item = await prisma.compare.findUnique({ where: { slug } });
  if (!item) return { notFound: true };

  // compute a baseUrl from request headers when available for absolute og:image
  const host = context.req?.headers?.host;
  const forwardedProto = context.req?.headers?.['x-forwarded-proto'] as string | undefined;
  const proto = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || '';

  // Serialize Dates to strings for Next.js
  const serializable = {
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
  };

  return { props: { initialData: serializable, baseUrl } };
}
