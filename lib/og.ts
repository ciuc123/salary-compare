import { Compare } from '@prisma/client';

export function formatPerSec(perSec: number) {
  // show per-second with 3 decimal places, but if very small show scientific or compact
  if (!isFinite(perSec)) return '0';
  if (perSec >= 1) return perSec.toFixed(2) + '/s';
  if (perSec >= 0.001) return perSec.toFixed(3) + '/s';
  return perSec.toExponential(3) + '/s';
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateOgSvg(item: Partial<Compare>) {
  const nameA = escapeHtml(item.nameA || 'A');
  const nameB = escapeHtml(item.nameB || 'B');
  const perA = formatPerSec(item.perSecA || 0);
  const perB = formatPerSec(item.perSecB || 0);

  const width = 1200;
  const height = 630;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0f172a" />
  <g transform="translate(80,120)">
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="48" fill="#ffffff">${nameA}</text>
    <text x="0" y="64" font-family="Inter, Roboto, Arial, sans-serif" font-size="36" fill="#a5b4fc">${perA}</text>
  </g>
  <g transform="translate(640,120)">
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="48" fill="#ffffff">${nameB}</text>
    <text x="0" y="64" font-family="Inter, Roboto, Arial, sans-serif" font-size="36" fill="#7dd3fc">${perB}</text>
  </g>
  <g transform="translate(80,520)">
    <text x="0" y="0" font-family="Inter, Roboto, Arial, sans-serif" font-size="24" fill="#cbd5e1">Salary counters grow live — open to watch them grow!</text>
  </g>
</svg>`;
}

