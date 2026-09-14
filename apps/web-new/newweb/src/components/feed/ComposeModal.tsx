import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BriefcaseIcon, ImageIcon, ListChecksIcon, TrophyIcon, XIcon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { me } from '../../data/people';
import { useAppState } from '../../contexts/AppState';
import { PostKind } from '../../types';
import { cn } from '../../utils/cn';

const kinds: {value: PostKind;label: string;icon: typeof ImageIcon;}[] = [
{ value: 'update', label: 'Update', icon: ImageIcon },
{ value: 'hiring', label: 'Hiring', icon: BriefcaseIcon },
{ value: 'milestone', label: 'Milestone', icon: TrophyIcon },
{ value: 'question', label: 'Question', icon: ListChecksIcon }];


export function ComposeModal({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const { addPost } = useAppState();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<PostKind>('update');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function submit() {
    if (!text.trim()) return;
    addPost(text.trim(), kind);
    setText('');
    setKind('update');
    onClose();
  }

  return (
    <AnimatePresence>
      {open ?
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[10vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        onClick={onClose}>
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Create a post"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-pop">
          
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-base font-extrabold text-ink">Create a post</h2>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-mute transition-colors duration-150 hover:bg-canvas">
              
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex gap-3">
                <Avatar initials={me.initials} tone={me.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink">{me.name}</p>
                  <p className="text-xs text-ink-mute">Posting to your network · 842 people</p>
                  <label htmlFor="compose-text" className="sr-only">
                    What do you want to share?
                  </label>
                  <textarea
                  id="compose-text"
                  autoFocus
                  rows={5}
                  maxLength={280}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share an update, a role you are hiring for, or ask your network something…"
                  className="mt-3 w-full resize-none text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none" />
                
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {kinds.map((k) => {
                const Icon = k.icon;
                const active = kind === k.value;
                return (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setKind(k.value)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-150',
                      active ?
                      'border-brand-200 bg-brand-50 text-brand-700' :
                      'border-line text-ink-soft hover:bg-canvas'
                    )}>
                    
                      <Icon className="h-3.5 w-3.5" />
                      {k.label}
                    </button>);

              })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-xs text-ink-faint">{280 - text.length} characters left</p>
              <button
              type="button"
              onClick={submit}
              disabled={!text.trim()}
              className="h-9 rounded-full bg-brand-600 px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-200">
              
                Post
              </button>
            </div>
          </motion.div>
        </motion.div> :
      null}
    </AnimatePresence>);

}