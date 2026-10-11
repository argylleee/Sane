import { describe, expect, it } from 'vitest';
import { CONTACTS, rankContacts } from './contacts';

describe('contacts', () => {
  it('has copy in all three languages and a way to reach every contact', () => {
    for (const contact of CONTACTS) {
      for (const lang of ['en', 'fil', 'taglish'] as const) {
        expect(contact.when[lang].trim()).not.toBe('');
        expect(contact.when[lang]).not.toContain('—');
      }
      expect(
        Boolean(contact.telText || contact.site || contact.email || contact.id === 'your_bank'),
      ).toBe(true);
      if (contact.tel) expect(contact.tel).toMatch(/^\+?\d{4,}$/);
      expect(contact.source.trim()).not.toBe('');
    }
  });

  it('lists the wallet that was named first', () => {
    expect(rankContacts(['Maya'], false)[0].id).toBe('maya');
    expect(rankContacts(['GCash'], true)[0].id).toBe('gcash');
  });

  it('puts reporting first normally and money help first after a payment', () => {
    expect(rankContacts([], false)[0].group).toBe('report');
    expect(rankContacts([], true)[0].group).toBe('paid');
    expect(rankContacts([], true)).toHaveLength(CONTACTS.length);
  });
});
