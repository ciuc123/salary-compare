import React, { useEffect, useState } from 'react';

type Props = {
  serve?: string;
  placement?: string;
  refreshIntervalSeconds?: number | null;
};

export default function CarbonAd({ serve, placement, refreshIntervalSeconds = null }: Props) {
  const [key, setKey] = useState(0);
  const serveId = serve || (process.env.NEXT_PUBLIC_CARBON_SERVE as string | undefined) || '';
  const placementId = placement || (process.env.NEXT_PUBLIC_CARBON_PLACEMENT as string | undefined) || '';

  useEffect(() => {
    // Only run on client
    let mounted = true;
    const container = document.getElementById('carbon-container');
    if (!container) return;

    // Inject Carbon script
    const script = document.createElement('script');
    script.src = `https://cdn.carbonads.com/carbon.js?serve=${serveId}&placement=${placementId}`;
    script.async = true;
    script.type = 'text/javascript';
    container.appendChild(script);

    return () => {
      // cleanup: remove script and clear container
      if (!mounted) return;
      mounted = false;
      container.innerHTML = '';
    };
  }, [key, serveId, placementId]);

  useEffect(() => {
    if (!refreshIntervalSeconds) return;
    const t = setInterval(() => setKey((k) => k + 1), refreshIntervalSeconds * 1000);
    return () => clearInterval(t);
  }, [refreshIntervalSeconds]);

  return <div id="carbon-container" style={{ minHeight: 90 }} data-carbon-key={key}></div>;
}
