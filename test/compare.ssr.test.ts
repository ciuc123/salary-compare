import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { getServerSideProps } from '../pages/compare/[slug]';

describe('compare page SSR', () => {
  const slug = 'ssr-test-12345';
  beforeAll(async () => {
    await prisma.compare.create({ data: { slug, nameA: 'SSRA', nameB: 'SSRB', annualA: 10000, annualB: 20000, perSecA: 1, perSecB: 2 } });
  });
  afterAll(async () => {
    await prisma.compare.deleteMany({ where: { slug: { contains: 'ssr-test' } } });
  });

  it('getServerSideProps returns initialData and baseUrl', async () => {
    const context: any = { params: { slug }, req: { headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' } } };
    const res = await getServerSideProps(context as any) as any;
    expect(res).toBeTruthy();
    expect(res.props).toBeTruthy();
    expect(res.props.initialData).toBeTruthy();
    expect(res.props.initialData.slug).toBe(slug);
    // baseUrl should be computed from headers
    expect(res.props.baseUrl).toBe('http://localhost:3000');
  });
});

