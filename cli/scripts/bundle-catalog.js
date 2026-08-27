#!/usr/bin/env node

/**
 * bundle-catalog.js
 *
 * Copies ../employees/ and ../skills/ into cli/catalog/ so the published npm
 * package carries the catalog with it.
 *
 * Without this the CLI can only read the catalog from a git clone. Installed
 * from npm there is no repo above node_modules/@openlabor/cli, so every
 * `list` / `install` / `search` command has nothing to read. Runs from
 * `prepack`, so `npm publish` and `npm pack` both pick it up.
 */

import { cpSync, rmSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const CATALOG_OUT = resolve(__dirname, '../catalog');

/** Never ship these into the package. */
const SKIP = new Set(['.DS_Store', 'node_modules', '.git', '__pycache__']);

const DIRS = ['employees', 'skills'];

rmSync(CATALOG_OUT, { recursive: true, force: true });

let total = 0;
for (const name of DIRS) {
  const src = join(REPO_ROOT, name);
  if (!existsSync(src)) {
    console.error(`bundle-catalog: ${name}/ not found at ${src}`);
    process.exit(1);
  }
  cpSync(src, join(CATALOG_OUT, name), {
    recursive: true,
    filter: (path) => !SKIP.has(path.split('/').pop()),
  });
  const count = readdirSync(join(CATALOG_OUT, name), { withFileTypes: true })
    .filter((e) => e.isDirectory()).length;
  console.log(`bundle-catalog: ${name}/ — ${count} entries`);
  total += count;
}

console.log(`bundle-catalog: ${total} entries written to catalog/`);
