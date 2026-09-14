import React, { useEffect, useState } from 'react';
import { SendIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { Avatar } from '../components/ui/Avatar';
import { personById } from '../data/people';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

export function Messages() {
  const { conversations, sendMessage, markConversationRead } = useAppState();
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? '');
  const [draft, setDraft] = useState('');

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (activeId) markConversationRead(activeId);
  }, [activeId, markConversationRead]);

  return (
    <PageFrame width="wide">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Messages</h1>
        <p className="mt-1 text-sm text-ink-mute">Conversations with recruiters, founders and your network.</p>
      </header>

      <div className="grid overflow-hidden rounded-2xl border border-line bg-white shadow-card md:grid-cols-[280px_minmax(0,1fr)]">
        <ul className="max-h-[560px] overflow-y-auto border-b border-line md:border-b-0 md:border-r">
          {conversations.map((c) => {
            const person = personById(c.personId);
            const isActive = c.id === activeId;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  aria-current={isActive}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150',
                    isActive ? 'bg-brand-50' : 'hover:bg-canvas'
                  )}>
                  
                  <Avatar initials={person.initials} tone={person.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-extrabold text-ink">{person.name}</span>
                      <span className="shrink-0 text-[11px] text-ink-faint">{c.time}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-ink-mute">{c.last}</span>
                  </span>
                  {c.unread ?
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label={`${c.unread} unread`} /> :
                  null}
                </button>
              </li>);

          })}
        </ul>

        {active ?
        <div className="flex max-h-[560px] min-h-[420px] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Avatar initials={personById(active.personId).initials} tone={personById(active.personId).tone} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-ink">{personById(active.personId).name}</p>
                <p className="truncate text-[12px] text-ink-mute">
                  {personById(active.personId).role} · {personById(active.personId).company}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
              {active.messages.map((m) =>
            <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                  <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed',
                  m.from === 'me' ?
                  'rounded-br-md bg-brand-600 text-white' :
                  'rounded-bl-md border border-line bg-white text-ink-soft'
                )}>
                
                    {m.text}
                    <span
                  className={cn('mt-1 block text-[10px]', m.from === 'me' ? 'text-brand-100' : 'text-ink-faint')}>
                  
                      {m.time}
                    </span>
                  </div>
                </div>
            )}
            </div>

            <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              sendMessage(active.id, draft.trim());
              setDraft('');
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3">
            
              <label htmlFor="message-input" className="sr-only">
                Write a message
              </label>
              <input
              id="message-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="h-10 flex-1 rounded-full border border-line bg-canvas px-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:outline-none" />
            
              <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition-colors duration-150 hover:bg-brand-700 disabled:bg-brand-200">
              
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </div> :

        <div className="flex min-h-[420px] items-center justify-center p-10 text-center">
            <p className="text-sm text-ink-mute">Pick a conversation to get started.</p>
          </div>
        }
      </div>
    </PageFrame>);

}