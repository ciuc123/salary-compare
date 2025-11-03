import { randomBytes } from 'crypto';
import slugify from 'slugify';

export function salaryPerSecond(annual: number) {
  const secondsPerYear = 365 * 24 * 60 * 60;
  return annual / secondsPerYear;
}

function base62(buffer: Buffer) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let num = BigInt('0x' + buffer.toString('hex'));
  let out = '';
  while (num > 0) {
    const rem = Number(num % BigInt(alphabet.length));
    out = alphabet[rem] + out;
    num = num / BigInt(alphabet.length);
  }
  return out || '0';
}

export function safeSlug(nameA: string, nameB: string) {
  const canonical = slugify(`${nameA}-vs-${nameB}`, { lower: true, strict: true }).slice(0, 50);
  const suffix = base62(randomBytes(4)).slice(0, 6);
  return `${canonical}-${suffix}`;
}
