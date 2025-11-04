import React, { useEffect, useRef, useState } from 'react';

type Props = {
  client?: string; // ca-pub-...
  slot?: string; // ad slot id
  style?: React.CSSProperties;
  testMode?: boolean; // render test ad attribute (overridden by env if present)
  refreshIntervalSeconds?: number | null; // optional auto-refresh interval
};

export default function AdSense({ client, slot, style, testMode = false, refreshIntervalSeconds }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = client || (process.env.NEXT_PUBLIC_ADSENSE_CLIENT as string | undefined) || '';
  const slotId = slot || (process.env.NEXT_PUBLIC_ADSENSE_SLOT as string | undefined) || '';
  // env-driven test mode: allows enabling test mode from env for preview deploys
  const envTest = process.env.NEXT_PUBLIC_ADSENSE_TESTMODE === '1' || process.env.NEXT_PUBLIC_ADSENSE_TESTMODE === 'true';
  const effectiveTestMode = envTest || testMode;
  const [blocked, setBlocked] = useState(false);
  const [impressionSent, setImpressionSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mountKey, setMountKey] = useState(0);

  // allow auto-refresh via env var if not passed explicitly
  const envRefresh = process.env.NEXT_PUBLIC_ADSENSE_REFRESH_SECONDS ? Number(process.env.NEXT_PUBLIC_ADSENSE_REFRESH_SECONDS) : undefined;
  const refreshSeconds = refreshIntervalSeconds ?? envRefresh ?? null;
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setLoading(true);

    // If there's no client ID, show fallback immediately
    if (!clientId) {
      setBlocked(true);
      setLoading(false);
      return;
    }

    // Inject the AdSense script if not already present
    let scriptAppended = false;
    if (!document.querySelector('script[data-ads-client]')) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ads-client', clientId);
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
      scriptAppended = true;
    }

    // create ins element
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', clientId);
    if (slotId) ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    if (effectiveTestMode) ins.setAttribute('data-adtest', 'on');

    containerRef.current.appendChild(ins);

    // request rendering
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore push failure - may indicate blocked
    }

    // Better detection: intersection observer + mutation observer
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    const handleBlocked = (reason?: string) => {
      setBlocked(true);
      setLoading(false);
      try {
        fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'ad-block-detected', adClient: clientId, adSlot: slotId, reason }) });
      } catch (e) {
        // ignore
      }
    };

    // IntersectionObserver checks whether the container is visible in viewport
    try {
      io = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (e && !e.isIntersecting) {
          // not visible; don't treat as blocked, but note
        }
      });
      io.observe(containerRef.current);
    } catch (e) {
      // ignore
    }

    // MutationObserver watches for script removal or direct DOM changes indicating blocking
    try {
      mo = new MutationObserver((mutations) => {
        const scriptGone = !document.querySelector('script[data-ads-client]');
        const hasIns = !!containerRef.current?.querySelector('ins.adsbygoogle');
        if (scriptGone || !hasIns) {
          handleBlocked(scriptGone ? 'script-removed' : 'ins-missing');
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {
      // ignore
    }

    // listen for ad-highlight custom events to animate the container briefly
    let highlightTimer: number | null = null;
    const onHighlight = (ev: Event) => {
      const el = containerRef.current;
      if (!el) return;
      const prev = el.style.boxShadow;
      el.style.transition = 'box-shadow 220ms ease';
      el.style.boxShadow = '0 0 0 4px rgba(255,200,0,0.35)';
      if (highlightTimer) window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => {
        el.style.boxShadow = prev || '';
      }, 800) as unknown as number;
    };
    containerRef.current.addEventListener('ad-highlight', onHighlight as EventListener);

    // After a short delay, detect adblock if the ins has no children or script removed
    const detect = window.setTimeout(() => {
      const removed = !document.querySelector('script[data-ads-client]');
      const hasIns = !!containerRef.current?.querySelector('ins.adsbygoogle');
      const isHidden = containerRef.current ? containerRef.current.offsetHeight === 0 && containerRef.current.offsetWidth === 0 : true;
      if (removed || !hasIns || isHidden) {
        handleBlocked(removed ? 'script-removed-detect' : (!hasIns ? 'ins-missing-detect' : 'hidden'));
      } else {
        setBlocked(false);
        // send impression beacon once
        if (!impressionSent) {
          try {
            fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'ad-impression', adClient: clientId, adSlot: slotId }) });
          } catch (e) {
            // ignore network errors
          }
          setImpressionSent(true);
        }
      }
      setLoading(false);
    }, 1200);

    return () => {
      clearTimeout(detect);
      if (mo) mo.disconnect();
      if (io) io.disconnect();
      if (highlightTimer) window.clearTimeout(highlightTimer);
      if (containerRef.current) {
        try { containerRef.current.removeEventListener('ad-highlight', onHighlight as EventListener); } catch (e) {}
        containerRef.current.innerHTML = '';
      }
      // do not remove the script tag; leave it for other instances
    };
  }, [clientId, slotId, effectiveTestMode, impressionSent, mountKey]);

  useEffect(() => {
    // set up auto-refresh if requested
    if (refreshSeconds && refreshSeconds > 10) {
      refreshTimerRef.current = window.setInterval(() => {
        // bump mountKey to remount ad
        setMountKey((k) => k + 1);
      }, refreshSeconds * 1000) as unknown as number;
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      };
    }
    return;
  }, [refreshSeconds]);

  const onFallbackClick = () => {
    if (typeof window !== 'undefined') {
      window.open('mailto:ads@example.com?subject=Sponsor%20Ad%20Slot', '_blank');
    }
  };

  const onRefresh = () => {
    setLoading(true);
    setMountKey((k) => k + 1);
  };

  return (
    <div style={style || { minHeight: 90 }}>
      <div key={mountKey} id="adsense-container" ref={containerRef} />
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        {loading && <div style={{ fontSize: 12, color: '#666' }}>Loading ad…</div>}
        <button onClick={onRefresh} style={{ padding: '6px 10px' }} aria-label="Refresh ad">Refresh ad</button>
      </div>
      {blocked && (
        <div id="ad-fallback" style={{ border: '1px dashed #ccc', padding: 12, marginTop: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Ad slot blocked or not available</div>
          <button onClick={onFallbackClick} style={{ padding: '8px 12px', cursor: 'pointer' }}>Sponsor this slot</button>
        </div>
      )}
    </div>
  );
}
