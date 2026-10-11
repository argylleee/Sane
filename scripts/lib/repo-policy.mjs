import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export const specKitNames = [
  'speckit-analyze',
  'speckit-checklist',
  'speckit-clarify',
  'speckit-constitution',
  'speckit-converge',
  'speckit-implement',
  'speckit-plan',
  'speckit-specify',
  'speckit-tasks',
  'speckit-taskstoissues',
];
const remotionNames = [
  'remotion-best-practices',
  'remotion-create',
  'remotion-docs',
  'remotion-markup',
  'remotion-multimedia',
  'remotion-render',
  'remotion-studio',
  'remotion-upgrade',
];
export const vendorNames = [
  'grill-me',
  'grilling',
  'impeccable',
  ...specKitNames,
  ...remotionNames,
];
export function isVendoredFile(file) {
  return (
    vendorNames.some((name) => file.startsWith(`.agents/skills/${name}/`)) ||
    /^\.specify\/(scripts|templates|presets|workflows|integrations)\//.test(file)
  );
}

export function isPrivateFile(file) {
  const name = file.split('/').at(-1);
  return (
    ((name === '.env' || name.startsWith('.env.')) && name !== '.env.example') ||
    /\.(pem|key)$/i.test(name) ||
    /^credentials.*\.json$/i.test(name)
  );
}

export function isApplicationFile(file) {
  if (/^(\.claude|\.agent)\/skills\//.test(file)) return false;
  if (
    /^(scripts|docs|\.agents|\.specify|\.github|\.githooks|\.local|\.cache|\.worktrees)\//.test(
      file,
    )
  )
    return false;
  if (file === 'eslint.config.mjs') return false;
  return /\.(js|mjs|cjs|jsx|ts|tsx|py|go|rs|java|kt|swift|php|rb|cs|html|css|scss|vue|svelte)$/i.test(
    file,
  );
}

export function applicationScripts(config, pkg, files) {
  const app = config.application;
  if (!app || !['not-selected', 'configured'].includes(app.status) || !Array.isArray(app.scripts)) {
    throw new Error('Invalid application validation configuration.');
  }
  const sources = files.filter(isApplicationFile);
  if (app.status === 'not-selected') {
    if (app.scripts.length || sources.length) {
      throw new Error(
        'Application source exists or checks are listed. Configure application checks in validation.config.json first.',
      );
    }
    return [];
  }
  if (!app.scripts.length)
    throw new Error(
      'Configured application needs real lint/test/build scripts (and typecheck where relevant).',
    );
  const forbidden = new Set(['validate', 'format', 'setup', 'vendor:record']);
  for (const script of app.scripts) {
    if (typeof script !== 'string' || forbidden.has(script) || !pkg.scripts?.[script]?.trim()) {
      throw new Error(`Invalid application check: ${String(script)}`);
    }
  }
  return app.scripts;
}

export function treeDigest(folder) {
  const hash = createHash('sha256');
  function visit(relative = '') {
    const entries = readdirSync(join(folder, relative), { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const entry of entries) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (path === 'scripts/bin') continue; // machine-specific engine; launcher pins its version
      if (entry.isSymbolicLink()) throw new Error(`Vendor symlink is not portable: ${path}`);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) {
        hash.update(`${path}\0`);
        const bytes = readFileSync(join(folder, path));
        const content = bytes.includes(0) ? bytes : bytes.toString('utf8').replaceAll('\r\n', '\n');
        hash.update(createHash('sha256').update(content).digest('hex'));
        hash.update('\n');
      }
    }
  }
  visit();
  return hash.digest('hex');
}

export function isStructuredFile(file) {
  return ['.json', '.yaml', '.yml'].includes(extname(file));
}
