// OWNER: frontend. Result-page cards that explain and back up the verdict. They only read the
// verdict; none of them changes the level.
import { CircleAlert, Globe, Mail, Phone, ShieldCheck } from 'lucide-react';
import archetypeData from '../data/archetypes.json';
import { CONTACTS_CHECKED, rankContacts } from '../data/contacts';
import { SCAM_TYPES } from '../data/scamTypes';
import { buildBreakdown } from '../explain/breakdown';
import type { RequestSummary } from '../privacy/networkProof';
import type { Lang, Verdict } from '../types';
import { extraCopyFor } from './copyExtra';

const PANEL = 'clay-panel rounded-2xl p-6 space-y-4';
const archetypeNames = new Map(
  (archetypeData.archetypes as { id: string; name: Record<Lang, string> }[]).map((a) => [
    a.id,
    a.name,
  ]),
);

export function WhyCard({ verdict, lang }: { verdict: Verdict; lang: Lang }) {
  const text = extraCopyFor(lang);
  const why = buildBreakdown(verdict);
  return (
    <section className={PANEL} aria-labelledby="why-title">
      <h3 id="why-title" className="font-bold text-text">
        {text.whyTitle}
      </h3>
      <p className="text-sm text-secondary leading-relaxed">{text.whyIntro}</p>

      <div className="space-y-2">
        <h4 className="text-sm text-secondary">{text.whyCode}</h4>
        {why.flags.length === 0 ? (
          <p className="text-sm text-text/80">{text.whyNoFlags}</p>
        ) : (
          <ul className="space-y-2">
            {why.flags.map((flag, index) => (
              <li
                key={`${flag.label}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm text-text"
              >
                <span>{flag.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-caution">+{flag.weight}</span>
              </li>
            ))}
          </ul>
        )}
        {why.calming.length > 0 && (
          <p className="text-sm text-good">
            {text.whyCalming}: {why.calming.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm text-secondary">{text.whyMeaning}</h4>
        {why.meaning.length > 0 ? (
          <ul className="space-y-2">
            {why.meaning.map(({ archetypeId, percent }) => (
              <li key={archetypeId} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm text-text">
                  <span>{archetypeNames.get(archetypeId)?.[lang] ?? archetypeId}</span>
                  <span className="tabular-nums text-secondary">{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text/80">{text.whyMeaningNone}</p>
        )}
      </div>

      <p className="text-xs italic text-secondary">
        {why.usedWriter ? text.whyWriter : text.whyNoWriter}
      </p>
    </section>
  );
}

export function DetailsCard({ verdict, lang }: { verdict: Verdict; lang: Lang }) {
  const text = extraCopyFor(lang);
  const findings = verdict.findings ?? [];
  if (findings.length === 0) return null;
  return (
    <section className={PANEL} aria-labelledby="details-title">
      <h3 id="details-title" className="font-bold text-text">
        {text.detailsTitle}
      </h3>
      <ul className="space-y-3">
        {findings.map((finding) => (
          <li
            key={`${finding.kind}-${finding.value}`}
            className="space-y-1 rounded-lg border border-border bg-surface p-3 text-sm"
          >
            <p className="flex flex-wrap items-center gap-2 text-text">
              <Phone size={16} className="shrink-0 text-secondary" aria-hidden="true" />
              <span className="font-semibold">
                {finding.kind === 'phone_ph'
                  ? text.detailPhone
                  : finding.kind === 'phone_foreign'
                    ? text.detailForeign
                    : text.detailPayment(finding.channel)}
              </span>
              <span className="font-mono tabular-nums">{finding.value}</span>
            </p>
            {finding.askedToPay && (
              <p className="flex items-start gap-2 font-medium text-high">
                <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  {text.detailAskedToPay} {text.detailPayHint}
                </span>
              </p>
            )}
            {finding.kind === 'phone_foreign' && (
              <p className="text-secondary">{text.detailForeignHint}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs italic text-secondary">{text.detailNote}</p>
    </section>
  );
}

export function ScamTypeCard({ verdict, lang }: { verdict: Verdict; lang: Lang }) {
  const text = extraCopyFor(lang);
  const type = verdict.archetypeId ? SCAM_TYPES[verdict.archetypeId] : undefined;
  if (!type || !verdict.archetypeId) return null;
  return (
    <section className={PANEL} aria-labelledby="scamtype-title">
      <h3 id="scamtype-title" className="font-bold text-text">
        {text.scamTypeTitle}: {archetypeNames.get(verdict.archetypeId)?.[lang]}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-text/90">
        <p>
          <span className="font-bold text-text">{text.scamTypeTell}: </span>
          {type.tell[lang]}
        </p>
        <p>
          <span className="font-bold text-text">{text.scamTypeDo}: </span>
          {type.doThis[lang]}
        </p>
      </div>
    </section>
  );
}

export function HelpCard({ verdict, lang }: { verdict: Verdict; lang: Lang }) {
  const text = extraCopyFor(lang);
  const findings = verdict.findings ?? [];
  const channels = findings.flatMap(({ channel }) => (channel ? [channel] : []));
  const paid = findings.some(({ askedToPay }) => askedToPay);
  const contacts = rankContacts(channels, paid);
  const groups: { title: string; group: 'report' | 'paid' }[] = paid
    ? [
        { title: text.helpPaid, group: 'paid' },
        { title: text.helpReport, group: 'report' },
      ]
    : [
        { title: text.helpReport, group: 'report' },
        { title: text.helpPaid, group: 'paid' },
      ];
  return (
    <section className={PANEL} aria-labelledby="help-title">
      <h3 id="help-title" className="font-bold text-text">
        {text.helpTitle}
      </h3>
      <p className="text-sm font-medium text-text">{text.helpNever}</p>
      {groups.map(({ title, group }) => (
        <div key={group} className="space-y-2">
          <h4 className="text-sm text-secondary">{title}</h4>
          <ul className="space-y-3">
            {contacts
              .filter((contact) => contact.group === group)
              .map((contact) => (
                <li
                  key={contact.id}
                  className="space-y-2 rounded-lg border border-border bg-surface p-3 text-sm"
                >
                  <p className="display-text text-text">{contact.name}</p>
                  <p className="leading-relaxed text-text/80">{contact.when[lang]}</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.tel && (
                      <a
                        href={`tel:${contact.tel}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-bold text-on-primary"
                      >
                        <Phone size={16} aria-hidden="true" />
                        {text.helpCall} {contact.telText}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 font-semibold text-text"
                      >
                        <Mail size={16} aria-hidden="true" />
                        {contact.email}
                      </a>
                    )}
                    {contact.site && (
                      <a
                        href={`https://${contact.site}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 font-semibold text-text"
                      >
                        <Globe size={16} aria-hidden="true" />
                        {contact.site}
                      </a>
                    )}
                  </div>
                  {contact.note && <p className="text-xs text-secondary">{contact.note[lang]}</p>}
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="text-xs italic text-secondary">{text.helpChecked(CONTACTS_CHECKED)}</p>
    </section>
  );
}

export function PrivacyProofCard({ proof, lang }: { proof: RequestSummary | null; lang: Lang }) {
  const text = extraCopyFor(lang);
  if (!proof) return null;
  return (
    <section className={PANEL} aria-labelledby="proof-title">
      <h3 id="proof-title" className="flex items-center gap-2 font-bold text-text">
        <ShieldCheck size={18} className="text-good" aria-hidden="true" />
        {text.proofTitle}
      </h3>
      <p className="text-sm font-medium text-text" role="status">
        {proof.count === 0 ? text.proofNone : text.proofSome(proof.count, proof.external)}
      </p>
      {proof.count > 0 && (
        <ul className="space-y-1 font-mono text-xs text-secondary">
          {proof.items.slice(0, 8).map((item, index) => (
            <li key={`${item.host}-${index}`}>
              {item.sameOrigin ? text.proofOwnSite : item.host} ({item.type})
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs italic text-secondary">{text.proofNote}</p>
    </section>
  );
}
