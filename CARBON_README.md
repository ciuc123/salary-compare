# Carbon Ads integration (quick start)

This project includes a placeholder component for Carbon Ads. Carbon Ads requires a script from their dashboard.

Steps to integrate Carbon Ads into Next.js:

1. Get your Carbon Ads script snippet from https://carbonads.net/ (they provide a script + a div container).

2. Create a React component to inject the script on the client only. Example:

```tsx
import { useEffect } from 'react';

export default function CarbonAd() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.carbonads.com/carbon.js?serve=YOUR_SERVE_ID&placement=YOUR_PLACEMENT';
    script.async = true;
    script.type = 'text/javascript';
    document.getElementById('carbon-container')?.appendChild(script);
    return () => {
      // cleanup
      const container = document.getElementById('carbon-container');
      if (container) container.innerHTML = '';
    };
  }, []);

  return <div id="carbon-container" style={{ minHeight: 90 }}></div>;
}
```

3. Add the component between or below the counters. To refresh the ad every X seconds, you can unmount/remount the component (toggle a key) or clear and re-append the script.

Caveats
- Ad blockers may hide Carbon Ads during development. Test with adblock disabled.
- Carbon's policies and script may change; follow their dashboard instructions.
- Consider privacy and GDPR compliance depending on your audience.


