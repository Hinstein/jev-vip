import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('all application brand entrypoints use the shared logo', () => {
  for (const path of ['app/(dashboard)/layout.tsx', 'app/(dashboard)/dashboard/layout.tsx', 'app/(login)/login.tsx']) {
    assert.match(readFileSync(path, 'utf8'), /<BrandLogo[\s/>]/);
  }
  assert.doesNotMatch(readFileSync('app/(login)/login.tsx', 'utf8'), /<Gauge/);
});

test('SVG is self-contained and shared by UI, static docs and favicon', () => {
  const svg = readFileSync('public/brand/jev-mark.svg', 'utf8');
  assert.match(svg, /viewBox="0 0 96 96"/);
  assert.doesNotMatch(svg, /<script|<image|<foreignObject|href=/);
  for (const path of ['components/jev/brand-logo.tsx', 'app/layout.tsx', 'public/docs/quickstart.html']) {
    assert.ok(readFileSync(path, 'utf8').includes('/brand/jev-mark.svg'));
  }
});
