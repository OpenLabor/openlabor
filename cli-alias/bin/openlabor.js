#!/usr/bin/env node

/**
 * `@openlabor/cli` — the old scoped name, kept working.
 *
 * The CLI is published as `openlabor` now, because that is what every README,
 * every launch post and every person types. This package exists so that
 * anything already pinned to the scoped name — a Dockerfile, a CI step, an
 * existing global install — keeps working and stops being stuck on 2.2.0,
 * whose catalog commands all threw.
 *
 * It ships no logic. It resolves the real CLI and hands over, so there is one
 * implementation and one place to fix a bug. The real entry point reads
 * process.argv itself, so importing it is enough.
 */

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { join } from 'path';

const TARGET = 'openlabor/bin/openlabor.js';

/**
 * Resolve from several bases, not just this file.
 *
 * A normal npm install puts this package in the same node_modules as its
 * dependency, so import.meta.url is enough. `npm link` and a local
 * `npm i ../cli-alias` both symlink the package into the source tree instead,
 * where the dependency is not resolvable — so the invoked path and the working
 * directory are tried as well.
 */
function resolveCli() {
  const bases = [
    import.meta.url,
    process.argv[1] ? pathToFileURL(process.argv[1]).href : null,
    pathToFileURL(join(process.cwd(), 'index.js')).href,
  ].filter(Boolean);

  for (const base of bases) {
    try {
      return createRequire(base).resolve(TARGET);
    } catch {
      // try the next base
    }
  }
  return null;
}

const entry = resolveCli();

if (!entry) {
  console.error('@openlabor/cli: could not find the openlabor package.');
  console.error('This package is a deprecated alias. Install the real one:');
  console.error('  npm install -g openlabor');
  process.exit(1);
}

await import(pathToFileURL(entry).href);
