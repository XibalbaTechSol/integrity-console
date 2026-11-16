import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Registration v3 Phase 4 PR 4.5 acceptance, as a test that can fail: no console source may
// reference the legacy `POST /v1/agent/register` (4.6 deletes it from the Oracle).
// `/v1/agent/register/offchain` is the v3 route and is allowed: the pattern needs the path
// to END after `register`. Same regex as the plan's
// `git grep -nE "agent/register([^/]|$)" -- integrity-dashboard/src ':!src/generated'`.
const LEGACY = /agent\/register([^/]|$)/m;
const SRC = join(__dirname, '..');

function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === 'generated' ? [] : sources(path);
        return /\.(ts|tsx)$/.test(name) && path !== __filename ? [path] : [];
    });
}

describe('legacy /v1/agent/register route', () => {
    it('is not referenced anywhere in the dashboard source', () => {
        const hits = sources(SRC).flatMap((file) =>
            readFileSync(file, 'utf8').split('\n')
                .map((line, i) => (LEGACY.test(line) ? `${relative(SRC, file)}:${i + 1}: ${line.trim()}` : null))
                .filter((h): h is string => h !== null),
        );
        expect(hits).toEqual([]);
    });

    it('the pattern catches the legacy call and spares the v3 route (guards the guard)', () => {
        expect(LEGACY.test("post('/v1/agent/register', req)")).toBe(true);
        expect(LEGACY.test('`${ORACLE_URL}/v1/agent/register`')).toBe(true);
        expect(LEGACY.test("post('/v1/agent/register/offchain', req)")).toBe(false);
    });
});
