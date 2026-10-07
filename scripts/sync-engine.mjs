// Copie le moteur (packages/engine/src) dans supabase/functions/_shared/engine pour les Edge Functions.
// Les imports sont déjà en `.ts` explicites : Deno les lit tels quels. Tests exclus.
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'packages/engine/src');
const dest = join(root, 'supabase/functions/_shared/engine');

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, {
  recursive: true,
  filter: (path) => !path.endsWith('.test.ts') && !path.endsWith('test-utils.ts'),
});
console.log(`Moteur copié dans ${dest}`);
