import React, { useState } from 'react';
import { CreditCardIcon, ShieldCheckIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { RailFooter } from '../components/rails/RailFooter';
import { me } from '../data/people';
import { cn } from '../utils/cn';

type Toggle = {id: string;label: string;description: string;on: boolean;};

const initialToggles: Toggle[] = [
{ id: 't1', label: 'Open to work', description: 'Show recruiters that you are available.', on: true },
{ id: 't2', label: 'Job match emails', description: 'A daily digest of roles above 70% match.', on: true },
{ id: 't3', label: 'Post reactions', description: 'Notify me when someone reacts to my posts.', on: true },
{ id: 't4', label: 'Recruiter messages', description: 'Allow verified recruiters to message me directly.', on: true },
{ id: 't5', label: 'Profile visible to my employer', description: 'Hide activity from your current company.', on: false }];


export function Settings() {
  const [toggles, setToggles] = useState(initialToggles);

  return (
    <PageFrame rail={<RailFooter />}>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-mute">Account, privacy and billing.</p>
      </header>

      <section aria-label="Account" className="mb-4 rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-ink-mute">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" defaultValue={me.name} />
          <Field label="Username" defaultValue={`@${me.handle}`} />
          <Field label="Email address" defaultValue="amara@okafor.design" type="email" />
          <Field label="Headline" defaultValue={me.role} />
        </div>
        <button
          type="button"
          className="mt-4 h-10 rounded-full bg-brand-600 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700">
          
          Save changes
        </button>
      </section>

      <section aria-label="Preferences" className="mb-4 rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-mute">Preferences & privacy</h2>
        <ul className="divide-y divide-line">
          {toggles.map((t) =>
          <li key={t.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">{t.label}</p>
                <p className="text-[13px] text-ink-mute">{t.description}</p>
              </div>
              <button
              type="button"
              role="switch"
              aria-checked={t.on}
              aria-label={t.label}
              onClick={() =>
              setToggles((prev) => prev.map((x) => x.id === t.id ? { ...x, on: !x.on } : x))
              }
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150',
                t.on ? 'bg-brand-600' : 'bg-line'
              )}>
              
                <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out',
                  t.on ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
                )} />
              
              </button>
            </li>
          )}
        </ul>
      </section>

      <section aria-label="Billing" className="mb-4 rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-mute">
          <CreditCardIcon className="h-4 w-4" />
          Billing
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-4">
          <div>
            <p className="text-[15px] font-extrabold text-ink">BEJELI Pro</p>
            <p className="text-[13px] text-ink-mute">£12 / month · renews 3 October 2026</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-9 rounded-full border border-line bg-white px-4 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas">
              
              Manage plan
            </button>
            <button
              type="button"
              className="h-9 rounded-full border border-line bg-white px-4 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas">
              
              Invoices
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Data" className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-ink-mute">
          <ShieldCheckIcon className="h-4 w-4" />
          Your data
        </h2>
        <p className="text-[14px] leading-relaxed text-ink-soft">
          Your profile data is encrypted and stored in UK data zones. You can export everything we hold, or close your
          account permanently.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="h-9 rounded-full border border-line px-4 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas">
            
            Download my data
          </button>
          <button
            type="button"
            className="h-9 rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-600 transition-colors duration-150 hover:bg-rose-50">
            
            Delete account
          </button>
        </div>
      </section>
    </PageFrame>);

}

function Field({ label, defaultValue, type = 'text' }: {label: string;defaultValue: string;type?: string;}) {
  const id = label.toLowerCase().replace(/\s/g, '-');
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-brand-300 focus:outline-none" />
      
    </div>);

}