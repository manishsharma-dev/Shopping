import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generate, check, review, staleGuides, scan } from './docs.mjs';

function fixture(t) {
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, 'shopping-docs-test-'));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    if (path.dirname(resolved) !== base || !path.basename(resolved).startsWith('shopping-docs-test-')) throw new Error('Unsafe fixture cleanup path');
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  write('docs/guide.md', '# Fixture guide\n\nCurrent behavior.\n');
  write('docs/backend/database.md', '# Database fixture\n');
  write('docs/manifest.json', JSON.stringify({ groups: [{ id: 'fixture', prefixes: ['apps/backend/'], docs: ['docs/guide.md'] }] }));
  write('apps/backend/src/example.ts', "@Entity('examples')\nexport class Example { @Column() name: string; method(input: string): string { return input; } }\n");
  return { root, write };
}

test('generates per-file declarations/entity mappings and is deterministic', t => {
  const { root } = fixture(t);
  const first = generate(root);
  review(root, ['fixture']);
  assert.deepEqual(check(root), []);
  const reference = fs.readFileSync(path.join(root, 'docs/backend/generated/files/src/example.ts.md'), 'utf8');
  assert.match(reference, /method/);
  assert.match(reference, /@Column/);
  assert.match(fs.readFileSync(path.join(root, 'docs/backend/generated/entities.md'), 'utf8'), /Example/);
  assert.deepEqual([...generate(root).output], [...first.output]);
});

test('source edits update references but never silently acknowledge guide reviews', t => {
  const { root, write } = fixture(t);
  generate(root); review(root, ['fixture']);
  write('apps/backend/src/example.ts', 'export const changedBehavior = true;\n');
  assert.ok(check(root).some(error => error.includes('Stale/missing')));
  generate(root);
  assert.deepEqual(staleGuides(root), ['fixture']);
  assert.ok(check(root).some(error => error.includes('Guide review required')));
  review(root, ['fixture']);
  assert.deepEqual(check(root), []);
});

test('new and deleted files are discovered and obsolete references removed', t => {
  const { root, write } = fixture(t);
  generate(root); review(root, ['fixture']);
  write('apps/backend/src/new.ts', 'export const added = 1;\n');
  generate(root);
  const generated = path.join(root, 'docs/backend/generated/files/src/new.ts.md');
  assert.ok(fs.existsSync(generated));
  fs.unlinkSync(path.join(root, 'apps/backend/src/new.ts'));
  assert.ok(check(root).some(error => error.includes('Obsolete')));
  generate(root);
  assert.equal(fs.existsSync(generated), false);
});

test('unowned source fails instead of disappearing from coverage', t => {
  const { root, write } = fixture(t);
  write('apps/shop/src/unowned.ts', 'export const uncovered = true;\n');
  assert.throws(() => generate(root), /Undocumented source/);
});

test('authored edits need review and broken links fail independently', t => {
  const { root, write } = fixture(t);
  generate(root); review(root, ['fixture']);
  write('docs/guide.md', '# Revised\n\n[Missing](missing.md)\n');
  assert.deepEqual(staleGuides(root), ['fixture']);
  review(root, ['fixture']);
  assert.ok(check(root).some(error => error.includes('broken link')));
});

test('private environments, binaries and build output are excluded', t => {
  const { root, write } = fixture(t);
  write('apps/backend/.env', 'SECRET=not-for-docs\n');
  write('apps/backend/src/.env.local', 'SECRET=not-for-docs\n');
  write('apps/backend/dist/compiled.js', 'secret');
  write('apps/backend/src/picture.png', 'binary');
  const files = scan(root);
  assert.equal(files.some(file => file.includes('.env') || file.includes('dist/') || file.endsWith('.png')), false);
  const rendered = [...generate(root).output.values()].join('\n');
  assert.equal(rendered.includes('not-for-docs'), false);
});

test('unknown review IDs and missing guide files fail explicitly', t => {
  const { root } = fixture(t);
  assert.throws(() => review(root, ['typo']), /Unknown guide group/);
  fs.unlinkSync(path.join(root, 'docs/guide.md'));
  assert.throws(() => generate(root), /Missing guide/);
});
