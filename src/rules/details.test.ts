import { describe, expect, it } from 'vitest';
import { findDetails } from './details';

describe('findDetails', () => {
  it('finds nothing in an ordinary message', () => {
    expect(findDetails('Hi, lunch at 12? Bring 500 pesos for the share.')).toEqual([]);
    expect(findDetails('Your order 20260412 ships on 2026-04-15.')).toEqual([]);
  });

  it('treats a wallet number next to a payment verb as a payment account', () => {
    expect(findDetails('Send the fee to GCash 0917-123-4567 (Juan D.) today')).toEqual([
      { kind: 'payment_account', value: '0917 123 4567', channel: 'GCash', askedToPay: true },
    ]);
    expect(findDetails('Pa-gcash na lang po sa +63 917 123 4567')[0]).toMatchObject({
      kind: 'payment_account',
      value: '0917 123 4567',
      channel: 'GCash',
    });
  });

  it('keeps a plain mobile number as a phone number', () => {
    expect(findDetails('Text me at 09171234567 when you arrive.')).toEqual([
      { kind: 'phone_ph', value: '0917 123 4567', askedToPay: false },
    ]);
  });

  it('finds a bank account number and the bank next to it', () => {
    expect(findDetails('Deposit the reservation fee to BDO account number 0012 3456 7890')).toEqual(
      [{ kind: 'payment_account', value: '0012 3456 7890', channel: 'BDO', askedToPay: true }],
    );
  });

  it('finds an overseas number and ignores amounts with a plus sign', () => {
    expect(findDetails('Call us on +44 7911 123456 now')).toEqual([
      { kind: 'phone_foreign', value: '+44 7911 123456', askedToPay: false },
    ]);
    expect(findDetails('Earn +5000 daily, +100 bonus')).toEqual([]);
  });

  it('removes duplicates and caps the list', () => {
    const many = Array.from({ length: 9 }, (_, i) => `0917 123 45${10 + i}`).join(' / ');
    expect(findDetails(`${many} ${many}`)).toHaveLength(5);
    expect(findDetails('0917 123 4567 or 0917-123-4567')).toHaveLength(1);
  });
});
