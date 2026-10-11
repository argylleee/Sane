import { describe, expect, it } from 'vitest';
import type { Lang } from '../types';
import { analyze } from './analyze';

// Ordinary courier and shop notices. Paying the rider on delivery is how cash on delivery works, so
// "pay", "COD", "delivery" or "online" alone must not raise concern, and nothing may be highlighted.
// Filipino and Taglish wording awaits native-speaker review.
const notices: [Lang, string][] = [
  [
    'en',
    'J&T Express: Hi! Your parcel 812345678901 from Shopee is out for delivery today. Please prepare PHP 1,250.00 for COD payment. You may also pay online via GCash or Maya in the J&T app. Thank you!',
  ],
  [
    'en',
    'J&T Express: Good day! Your COD parcel (Waybill 812345678901) will be delivered today. Amount to pay: PHP 899.00. Please prepare the exact amount. Rider: Mark 09171234567.',
  ],
  [
    'en',
    'Hello from J&T Express. Your package is scheduled for delivery today. Kindly prepare PHP 560 cash on delivery. Online payment is also available upon delivery.',
  ],
  [
    'en',
    'Your J&T parcel is out for delivery. Please pay PHP 1,250 to the rider upon delivery. Thank you for choosing J&T Express.',
  ],
  [
    'en',
    'LBC: Your shipment 123456789 will arrive today. Please prepare PHP 450 for COD. Track at lbcexpress.com.',
  ],
  [
    'en',
    "Flash Express: Your order from Lazada will be delivered today. COD amount: PHP 329. Please keep your phone open for the rider's call.",
  ],
  [
    'en',
    'Your Shopee order will be delivered today. Please prepare PHP 1,299.00 if Cash on Delivery.',
  ],
  [
    'en',
    'Lazada: Your package is out for delivery. COD amount ₱499. Please prepare exact change. You can also pay via GCash QR upon delivery.',
  ],
  [
    'en',
    'Ninja Van: Your parcel will arrive today between 1PM and 5PM. COD: PHP 780. Please prepare the exact amount before the rider arrives.',
  ],
  [
    'en',
    'J&T Express: Your parcel 812345678901 is out for delivery today. Rider: Mark 09171234567.',
  ],
  [
    'fil',
    'J&T Express: Reminder! May COD parcel ka na ide-deliver ngayong araw. Halagang babayaran: PHP 1,250.00. Pakihanda ang eksaktong halaga. Salamat!',
  ],
  [
    'fil',
    'J&T Express: Magandang araw! Ang inyong parcel ay ide-deliver ngayon. Pakihanda ang PHP 750 para sa COD. Maaari ring magbayad online sa pamamagitan ng GCash.',
  ],
  ['fil', 'Ang iyong padala ay darating bukas. Pakihanda ang ₱650 para sa cash on delivery.'],
  ['fil', 'J&T Express: Ang parcel mo ay darating ngayong araw. Rider: Jun 09181234567. Salamat!'],
  [
    'taglish',
    'J&T: Hi po! Out for delivery na ang parcel mo today. Paki-prepare ang PHP 899 for COD. Pwede rin mag-pay online via GCash pagdating ng rider. Thank you!',
  ],
  [
    'taglish',
    'Hi po, ito po si Kuya rider ng J&T. Nasa labas na po ako, COD po PHP 450. Paki-ready na lang po ng bayad.',
  ],
];

// Scams that impersonate couriers or reuse COD wording. They must stay flagged.
const scams: [Lang, string][] = [
  [
    'en',
    'J&T Express: Your COD parcel is on hold. Pay PHP 50 now or it will be returned to sender.',
  ],
  ['en', 'J&T COD: Please pay PHP 1,250 via this link before delivery: jt-cod-pay.top'],
  ['en', 'Your COD parcel is out for delivery. Kindly send the OTP to the rider to confirm.'],
  [
    'en',
    'J&T Express: For your COD parcel, please provide your full name, address and valid ID to the rider via Telegram.',
  ],
  [
    'en',
    "Your COD parcel will be delivered. Pay PHP 899 to the rider's personal GCash 09171234567 before he arrives.",
  ],
  [
    'en',
    'J&T: Hi, COD parcel. Rider: Mark 09171234567. Please pay PHP 899 to this number via GCash.',
  ],
  [
    'en',
    'Hi! Your parcel is out for delivery. Please confirm your COD order by clicking jtexpress.ph.verify-cod.com',
  ],
  [
    'en',
    'J&T Express: Your parcel is on hold due to incomplete address. Pay the redelivery fee of PHP 35 at https://jnt-ph-redelivery.top to avoid return to sender.',
  ],
  [
    'en',
    'J&T Express: Your COD parcel is ready. To release it, send PHP 500 deposit to GCash 09981234567 first.',
  ],
  [
    'en',
    'J&T Express: Your package is held at the warehouse. Pay the handling fee today or it will be disposed.',
  ],
  [
    'en',
    'Your parcel is out for delivery. Please pay online via jtexpress-pay.xyz to avoid delay.',
  ],
  [
    'en',
    'J&T: Your COD order needs confirmation. Reply with your full address and birthday to the rider.',
  ],
  [
    'en',
    'Your COD parcel will arrive today. To avoid cancellation, pay a PHP 99 insurance fee via GCash to 09171234567.',
  ],
  [
    'en',
    'J&T: Your COD parcel is out for delivery. Pay PHP 899 upon delivery. URGENT: confirm now or your order will be cancelled.',
  ],
  [
    'fil',
    'J&T Express: May unpaid customs fee ang parcel mo. Magbayad ng PHP 150 sa GCash 09171234567 ngayon na para hindi ibalik.',
  ],
  [
    'taglish',
    'J&T: COD parcel mo ay ready. Mag-send muna ng PHP 200 sa GCash 09171234567 bago i-deliver.',
  ],
  [
    'taglish',
    'COD parcel mo ay darating. Magbayad ng P150 shipping fee muna sa link: bit.ly/xyz12',
  ],
  [
    'taglish',
    'Kuya rider po ito ng J&T. COD po ang parcel ninyo, pero i-transfer na lang po ang PHP 1,200 sa GCash ko 09171234567 para iwan ko na lang sa gate.',
  ],
  [
    'taglish',
    'J&T Express: Hi! COD parcel mo is out for delivery. Paki-click ang link para ma-confirm: https://jtexpress-ph.vip/confirm',
  ],
];

const flagged = ['likely_scam', 'suspicious'];

describe('courier and cash-on-delivery notices', () => {
  it.each(notices)('[%s] gets no warning and no highlight: %s', async (lang, text) => {
    const verdict = await analyze({ text }, { lang, useLLM: false });
    expect(verdict.level).toBe('probably_fine');
    expect(verdict.signals.filter(({ weight }) => weight > 0)).toEqual([]);
  });

  it.each(scams)('[%s] still flags a courier scam: %s', async (lang, text) => {
    const verdict = await analyze({ text }, { lang, useLLM: false });
    expect(flagged).toContain(verdict.level);
  });

  it('explains a COD reminder from the evidence and says the sender is unconfirmed', async () => {
    const { explanation, signals } = await analyze(
      { text: notices[0][1] },
      { lang: 'en', useLLM: false },
    );
    expect(signals.map(({ id }) => id)).toEqual(['cod_notice']);
    expect(explanation.headline).toMatch(/cash-on-delivery reminder/);
    expect(explanation.headline).toMatch(/cannot confirm who sent it/);
    const text = `${explanation.headline} ${explanation.steps.join(' ')}`;
    expect(text).not.toMatch(/\b(?:link|fee|threat)/i);
  });

  it('flags paying in advance or to a personal number as an unusual COD instruction', async () => {
    const verdict = await analyze({ text: scams[15][1] }, { lang: 'taglish', useLLM: false });
    expect(verdict.level).toBe('likely_scam');
    expect(verdict.signals.map(({ id }) => id)).toContain('cod_unusual_payment');
  });

  it('does not show the COD reassurance when the message also asks for personal details', async () => {
    const verdict = await analyze({ text: scams[11][1] }, { lang: 'en', useLLM: false });
    expect(verdict.signals.map(({ id }) => id)).not.toContain('cod_notice');
    expect(verdict.explanation.headline).not.toMatch(/cash-on-delivery reminder/);
  });

  it('treats a courier lookalike link as a brand impersonation', async () => {
    const verdict = await analyze({ text: scams[10][1] }, { lang: 'en', useLLM: false });
    expect(verdict.signals.map(({ id }) => id)).toContain('lookalike_domain');
  });

  it.each(['fil', 'taglish'] as const)('explains a COD reminder in %s', async (lang) => {
    const { explanation } = await analyze({ text: notices[10][1] }, { lang, useLLM: false });
    expect(explanation.headline).toMatch(/COD|cash on delivery/i);
  });
});
