// Drift guard for docs/api.md (#26). Reads backend/index.ts and the doc as plain text (it does not
// import the app, so it needs no Firebase or emulator) and checks that the names match both ways:
// REST routes, Socket.IO events (client to server and server to client) and GameState fields.
// It checks names only, not payload shapes: read the handler when you change behavior.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.resolve(here, '../index.ts'), 'utf8');
const doc = fs.readFileSync(path.resolve(here, '../../docs/api.md'), 'utf8');

const HOW_TO_FIX =
  'Update docs/api.md (see "Adding or changing an event" at the top of that file).';

/** The text of a `## ` section of the doc, up to the next `## ` heading. */
function section(title: string): string {
  const start = doc.indexOf(`\n## ${title}\n`);
  if (start === -1) throw new Error(`docs/api.md has no "## ${title}" section`);
  const body = doc.slice(start + 1);
  const next = body.indexOf('\n## ', 1);
  return next === -1 ? body : body.slice(0, next);
}

function matches(text: string, re: RegExp): string[] {
  return [...text.matchAll(re)].map((m) => m[1]);
}

const unique = (names: string[]) => [...new Set(names)].sort();

function expectSameNames(kind: string, inCode: string[], inDoc: string[]) {
  expect(
    inCode.length,
    `no ${kind} found in the code: the test patterns need updating`,
  ).toBeGreaterThan(0);
  const undocumented = inCode.filter((n) => !inDoc.includes(n));
  const stale = inDoc.filter((n) => !inCode.includes(n));
  expect(
    { undocumented, stale },
    `${kind}: "undocumented" exist in backend/index.ts but not in docs/api.md, "stale" are documented but not in the code. ${HOW_TO_FIX}`,
  ).toEqual({ undocumented: [], stale: [] });
}

describe('docs/api.md matches backend/index.ts', () => {
  it('documents every REST route', () => {
    const inCode = unique(
      [...code.matchAll(/app\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)].map(
        (m) => `${m[1].toUpperCase()} ${m[2]}`,
      ),
    );
    const inDoc = unique(matches(section('REST routes'), /^\| `([A-Z]+ \/[^`]*)`/gm));
    expectSameNames('REST routes', inCode, inDoc);
  });

  it('documents every client to server event', () => {
    const inCode = unique([
      ...matches(code, /onSafe\(socket,\s*'([a-z-]+)'/g),
      ...matches(code, /socket\.on\('([a-z-]+)'/g),
    ]);
    const inDoc = unique(matches(section('Socket.IO: client to server'), /^### `([a-z-]+)`/gm));
    expectSameNames('client to server events', inCode, inDoc);
  });

  it('documents every server to client event', () => {
    const inCode = unique(matches(code, /\.emit\('([a-z-]+)'/g));
    const inDoc = unique(matches(section('Socket.IO: server to client'), /^### `([a-z-]+)`/gm));
    expectSameNames('server to client events', inCode, inDoc);
  });

  it('documents every GameState field', () => {
    const start = code.indexOf('const GameStateSchema = z');
    const end = code.indexOf('.strict();', start);
    expect(start, 'GameStateSchema not found in backend/index.ts').toBeGreaterThan(-1);
    const inCode = unique(matches(code.slice(start, end), /^ {4}(\w+): /gm));
    const inDoc = unique(matches(section('GameState'), /^\| `(\w+)`\s*\|/gm));
    expectSameNames('GameState fields', inCode, inDoc);
  });
});
