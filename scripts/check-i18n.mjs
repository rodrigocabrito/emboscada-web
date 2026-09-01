// i18n drift guard. Translations are keyed by the exact Portuguese source string
// (see i18n.jsx), so editing a PT string in content.js (or a component) without
// updating its key silently breaks the lookup and the text falls back to PT.
//
// This check flags every translation key that no longer appears verbatim in any
// content/component source — i.e. stale keys left behind by such an edit. Run via
// `npm run check:i18n`; it also runs at the start of `npm run build` (and CI).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/features/public/', import.meta.url));
const I18N = join(ROOT, 'i18n.jsx');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const sources = walk(ROOT).filter((f) => /\.(js|jsx)$/.test(f));
const i18nText = readFileSync(I18N, 'utf8');

// Extract the PT keys of the T dictionary: lines like `  'KEY': { en: … }`.
const keys = [];
const re = /^\s*'((?:\\.|[^'\\])*)':\s*\{\s*en:/gm;
let m;
while ((m = re.exec(i18nText))) keys.push(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));

// Corpus = every public source file except i18n.jsx (where the key trivially lives).
const corpus = sources
  .filter((f) => f !== I18N)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

const orphans = keys.filter((k) => !corpus.includes(k));

if (orphans.length) {
  console.error(`✗ i18n check: ${orphans.length} translation key(s) not referenced by any content/component string.`);
  console.error('  A key like this is usually stale — the PT source string was edited but its i18n key was not.');
  console.error('  Fix: update the key in i18n.jsx to match the current PT string, or delete the unused key.\n');
  orphans.forEach((k) => console.error(`  • ${k}`));
  process.exit(1);
}

console.log(`✓ i18n check: all ${keys.length} translation keys are referenced.`);
