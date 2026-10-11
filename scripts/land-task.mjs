import { spawnSync } from 'node:child_process';

const CHECKS = ['lint', 'format:check', 'typecheck', 'test:app'];
// Run npm through node so no shell is needed (avoids DEP0190 on Windows).
const npmBin = process.execPath;
const npmCli = process.env.npm_execpath;

function run(command, args, { inherit = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  });
  if (result.error) throw result.error;
  return {
    status: result.status,
    out: (result.stdout || '').trim(),
    err: (result.stderr || '').trim(),
  };
}
function git(...args) {
  const r = run('git', args);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.err || r.out}`);
  return r.out;
}

try {
  if (!npmCli) throw new Error('Run through npm: npm run task:land.');
  const branch = git('branch', '--show-current');
  if (!branch || branch === 'main') throw new Error('Run from a task branch worktree, not main.');
  if (git('status', '--porcelain'))
    throw new Error('Commit your owned changes first (dirty tree).');
  if (run('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD']).status === 0)
    throw new Error('A merge is in progress; resolve and commit it, then rerun.');

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    git('fetch', 'origin', '--quiet');
    const merge = run('git', ['merge', '--no-edit', 'origin/main']);
    if (merge.status !== 0) {
      const files = git('diff', '--name-only', '--diff-filter=U').split('\n').filter(Boolean);
      console.error(
        `MERGE CONFLICT in ${files.length} file(s):\n  ${files.join('\n  ')}\n` +
          "Resolve keeping BOTH sides' intent (load resolve-conflict), git add, git commit --no-edit, then rerun npm run task:land. Never discard or force-push.",
      );
      process.exitCode = 2;
      break;
    }
    // CI rejects any pushed commit whose message breaks docs/git-conventions.md; catch it here first.
    console.log('\n> npm run check:git -- range origin/main');
    if (
      run(npmBin, [npmCli, 'run', 'check:git', '--', 'range', 'origin/main'], { inherit: true })
        .status !== 0
    )
      throw new Error('A commit message breaks docs/git-conventions.md; reword it, then rerun.');
    for (const script of CHECKS) {
      console.log(`\n> npm run ${script}`);
      if (run(npmBin, [npmCli, 'run', script], { inherit: true }).status !== 0)
        throw new Error(`Check "${script}" failed on the merged result; fix it, commit, rerun.`);
    }
    const push = run('git', ['push', 'origin', `HEAD:refs/heads/main`]);
    if (push.status === 0) {
      run('git', ['push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`]);
      console.log(`LANDED ${branch} on main at ${git('rev-parse', '--short', 'HEAD')}.`);
      break;
    }
    console.warn(
      `Push to main rejected (attempt ${attempt}/3); main moved, re-merging.\n${push.err}`,
    );
    if (attempt === 3) throw new Error('Could not land after 3 attempts; rerun later.');
  }
} catch (error) {
  console.error(`Task land failed: ${error.message}`);
  process.exitCode = 1;
}
