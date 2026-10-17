// Copies the Decap CMS browser bundle into <outDir>/admin so the editor is served
// from this site (no CDN). The npm tarball is pinned by version and sha512.
// Decap CMS is MIT licensed (see its package.json).
// Usage: node scripts/fetch-decap.mjs <outDir>
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const VERSION = '3.17.1';
const INTEGRITY = 'sha512-0epqKYflLqinF/UKYXQkOkQf3g3oSfc+Dy5tqDmzWhQuLTgrOEXadp7fS16Mo4kA9j2+du/nVhus1J8XWssPDg==';
const TARBALL = `https://registry.npmjs.org/decap-cms/-/decap-cms-${VERSION}.tgz`;

const outDir = resolve(process.argv[2] ?? 'dist', 'admin');
const cacheDir = resolve('node_modules/.cache/decap-cms', VERSION);
const tgzPath = join(cacheDir, 'decap-cms.tgz');
const sha512 = (buf) => `sha512-${createHash('sha512').update(buf).digest('base64')}`;

let tgz = existsSync(tgzPath) ? readFileSync(tgzPath) : null;
if (!tgz || sha512(tgz) !== INTEGRITY) {
  console.log(`[decap] downloading decap-cms@${VERSION}`);
  const res = await fetch(TARBALL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  tgz = Buffer.from(await res.arrayBuffer());
  if (sha512(tgz) !== INTEGRITY) throw new Error('decap-cms tarball integrity check failed');
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(tgzPath, tgz);
}

// Minimal ustar reader: 512-byte headers, octal sizes, data padded to 512 bytes.
const tar = gunzipSync(tgz);
const wanted = /^package\/dist\/((?:\d+\.)?decap-cms\.js)$/;
const field = (off, len) => tar.subarray(off, off + len).toString('utf8').replace(/\0.*$/s, '');
mkdirSync(outDir, { recursive: true });
let n = 0;
for (let off = 0; off + 512 <= tar.length; ) {
  const name = field(off, 100);
  if (!name) break;
  const prefix = field(off + 345, 155);
  const full = prefix ? `${prefix}/${name}` : name;
  const size = parseInt(field(off + 124, 12).trim() || '0', 8);
  const type = String.fromCharCode(tar[off + 156] || 48);
  const start = off + 512;
  const m = (type === '0' || type === '\0') && wanted.exec(full);
  if (m) {
    writeFileSync(join(outDir, m[1]), tar.subarray(start, start + size));
    n++;
  }
  off = start + Math.ceil(size / 512) * 512;
}
if (n < 2) throw new Error(`Expected the Decap bundle in the tarball, found ${n} files`);
console.log(`[decap] copied ${n} files to ${outDir}`);
