export function dicebearUrl(name: string, opts?: { style?: string; background?: string; size?: number }) {
  const style = opts?.style || 'initials';
  const background = opts?.background || 'b6e3f4';
  const size = opts?.size || 128;
  const seed = encodeURIComponent(name || 'user');
  // Use DiceBear v6 initials style (SVG)
  return `https://api.dicebear.com/6.x/${style}/svg?seed=${seed}&backgroundColor=${background}&size=${size}`;
}

