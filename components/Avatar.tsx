import React from 'react';
import { dicebearUrl } from '../lib/avatar';

export default function Avatar({ name, src, size = 96 }: { name: string; src?: string; size?: number }) {
  const fallback = dicebearUrl(name, { size });
  const imageSrc = src || fallback;
  return <img src={imageSrc} alt={name} width={size} height={size} style={{ borderRadius: 8, objectFit: 'cover' }} />;
}

