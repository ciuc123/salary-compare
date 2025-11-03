import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateOgSvg } from '../lib/og';
import { prisma } from '../lib/prisma';

describe('OG generation', () => {
  let slug: string;
  beforeAll(async () => {
    const created = await prisma.compare.create({ data: {
      slug: 'test-og-abc123', nameA: 'A', nameB: 'B', annualA: 1000, annualB: 2000, perSecA: 1, perSecB: 2
    }});
    slug = created.slug;
  });
  afterAll(async () => {
    await prisma.compare.deleteMany({ where: { slug: { contains: 'test-og' } } });
  });

  it('generateOgSvg returns an SVG string', async () => {
    const svg = generateOgSvg({ nameA: 'Alice', nameB: 'Bob', perSecA: 0.5, perSecB: 1.2 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Alice');
    expect(svg).toContain('Bob');
  });

  it('prisma findUnique + generateOgSvg flow works for existing slug', async () => {
    const item = await prisma.compare.findUnique({ where: { slug } });
    expect(item).toBeTruthy();
    const svg = generateOgSvg(item!);
    expect(svg).toContain('<svg');
    expect(svg).toContain('A');
    expect(svg).toContain('B');
  });
});
