import React, { useEffect, useRef } from 'react';

type Props = {
  client?: string; // ca-pub-...
  slot?: string; // ad slot id
  style?: React.CSSProperties;
};

export default function AdSense({ client, slot, style }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = client || (process.env.NEXT_PUBLIC_ADSENSE_CLIENT as string | undefined) || '';
  const slotId = slot || (process.env.NEXT_PUBLIC_ADSENSE_SLOT as string | undefined) || '';

  useEffect(() => {
    if (!containerRef.current) return;
    // Ensure client id exists before injecting
    if (!clientId) return;

    // Inject the AdSense script if it's not present
    if (!document.querySelector('script[data-ads-client]')) {
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-ads-client', clientId);
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    // Create ins element
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', clientId);
    if (slotId) ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    containerRef.current.appendChild(ins);

    // @ts-ignore
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
      // console.warn('adsbygoogle push failed', e);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [clientId, slotId]);

  return <div id="adsense-container" ref={containerRef} style={style || { minHeight: 90 }} />;
}

