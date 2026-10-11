import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY as csp } from './csp';

const directive = (name: string) =>
  csp
    .split('; ')
    .find((part) => part.startsWith(`${name} `))
    ?.split(' ')
    .slice(1) ?? [];

describe('content security policy', () => {
  it('never allows eval, inline scripts or a wildcard script source', () => {
    const scripts = directive('script-src');
    expect(scripts).toContain("'self'");
    expect(scripts).not.toContain("'unsafe-eval'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts.some((source) => source === '*' || source.startsWith('http'))).toBe(false);
  });

  it('blocks plugins, base tag changes and form posts to other sites', () => {
    expect(directive('object-src')).toEqual(["'none'"]);
    expect(directive('base-uri')).toEqual(["'self'"]);
    expect(directive('form-action')).toEqual(["'self'"]);
  });

  it('falls back to this site only', () => {
    expect(directive('default-src')).toEqual(["'self'"]);
  });

  it('limits outside connections to the optional explanation-model hosts, over https', () => {
    const outside = directive('connect-src').filter(
      (source) => !source.startsWith("'") && source !== 'blob:',
    );
    expect(outside.length).toBeGreaterThan(0);
    for (const source of outside) {
      expect(source).toMatch(/^https:\/\/(\*\.)?[a-z.]+$/);
      expect(source).toMatch(/huggingface\.co|hf\.co|githubusercontent\.com/);
    }
  });
});
