import React, { useEffect, useRef, useState } from 'react';

type Props = {
  client?: string; // ca-pub-...
  slot?: string; // ad slot id
  style?: React.CSSProperties;
  testMode?: boolean; // render test ad attribute
};

export default function AdSense({ client, slot, style, testMode = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = client || (process.env.NEXT_PUBLIC_ADSENSE_CLIENT as string | undefined) || '';
  const slotId = slot || (process.env.NEXT_PUBLIC_ADSENSE_SLOT as string | undefined) || '';
  const [blocked, setBlocked] = useState(false);
  const [impressionSent, setImpressionSent] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    // If there's no client ID, show fallback immediately
    if (!clientId) {
      setBlocked(true);
      return;
    }

    // Inject the AdSense script once
    if (!document.querySelector('script[data-ads-client]')) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ads-client', clientId);
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    // create ins element
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', clientId);
    if (slotId) ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    if (testMode) ins.setAttribute('data-adtest', 'on');

    containerRef.current.appendChild(ins);

    // request rendering
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore push failure - may indicate blocked
    }

    // After a short delay, detect adblock if the ins has no children or script removed
    const detect = setTimeout(() => {
      const removed = !document.querySelector('script[data-ads-client]');
      const hasIns = !!containerRef.current?.querySelector('ins.adsbygoogle');
      const isHidden = containerRef.current ? containerRef.current.offsetHeight === 0 && containerRef.current.offsetWidth === 0 : true;
      if (removed || !hasIns || isHidden) {
        setBlocked(true);
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
    }, 1200);

    return () => {
      clearTimeout(detect);
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [clientId, slotId, testMode, impressionSent]);

  const onFallbackClick = () => {
    // simple CTA: open mailto or link to contact
    if (typeof window !== 'undefined') {
      window.open('mailto:ads@example.com?subject=Sponsor%20Ad%20Slot', '_blank');
    }
  };

  return (
    <div style={style || { minHeight: 90 }}>
      <div id="adsense-container" ref={containerRef} />
      {blocked && (
        <div id="ad-fallback" style={{ border: '1px dashed #ccc', padding: 12, marginTop: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Ad slot blocked or not available</div>
          <button onClick={onFallbackClick} style={{ padding: '8px 12px', cursor: 'pointer' }}>Sponsor this slot</button>
        </div>
      )}
    </div>
  );
}
