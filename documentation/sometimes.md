# Deprecated: `documentation/sometimes.md`

This file was merged into `documentation/sometime.md` (single consolidated doc).

Please view `documentation/sometime.md` for headshot, ad notes (Carbon archived), AdSense config, and Vercel deployment checklist.

---

## Carbon Ads notes (moved here)

The project originally included a `CARBON_README.md` which is now archived here. Carbon Ads requires a script from their dashboard and a placement/serve id. Below is the quick-start guidance (previously in `CARBON_README.md`):

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

Caveats
- Ad blockers may hide Carbon Ads during development. Test with adblock disabled.
- Carbon's policies and script may change; follow their dashboard instructions.
- Consider privacy and GDPR compliance depending on your audience.
