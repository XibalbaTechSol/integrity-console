import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Registration v3 Phase 4 PR 4.5 acceptance, as a test that can fail: no console source may
// reference the legacy v2 registration route (4.6 deletes it from the Oracle). The v3
// `.../register/offchain` route is allowed: the pattern needs the path to END after
// `register`. Same regex as the plan's acceptance `git grep` over src (minus src/generated).
// The route is assembled from parts so this file does not match its own grep.
const ROUTE = ['agent', 'register'].join('/');
const LEGACY = new RegExp(`${ROUTE}([^/]|$)`, 'm');
const SRC = join(__dirname, '..');

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === 'generated' ? [] : sources(path);
        return /\.(ts|tsx)$/.test(name) && path !== __filename ? [path] : [];
    });
}

describe('legacy v2 registration route', () => {
    it('is not referenced anywhere in the dashboard source', () => {
        const hits = sources(SRC).flatMap((file) =>
            readFileSync(file, 'utf8').split('\n')
                .map((line, i) => (LEGACY.test(line) ? `${relative(SRC, file)}:${i + 1}: ${line.trim()}` : null))
                .filter((h): h is string => h !== null),
        );
        expect(hits).toEqual([]);
    });

    it('the pattern catches the legacy call and spares the v3 route (guards the guard)', () => {
        expect(LEGACY.test(`post('/v1/${ROUTE}', req)`)).toBe(true);
        expect(LEGACY.test(`fetch(\`\${ORACLE_URL}/v1/${ROUTE}\`)`)).toBe(true);
        expect(LEGACY.test(`post('/v1/${ROUTE}/offchain', req)`)).toBe(false);
    });
});
