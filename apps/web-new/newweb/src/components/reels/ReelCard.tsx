import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheckIcon,
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  SendIcon,
  Share2Icon,
  ThumbsUpIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon } from
'lucide-react';
import { TalentReel } from '../../types';
import { reelComments } from '../../data/reels';
import { useAppState } from '../../contexts/AppState';
import { cn, compact } from '../../utils/cn';

type ReelCardProps = {
  reel: TalentReel;
  active: boolean;
};

export function ReelCard({ reel, active }: ReelCardProps) {
  const {
    likedReels,
    toggleReelLike,
    endorsedReels,
    toggleEndorse,
    shortlist,
    toggleShortlist,
    reelReplies,
    addReelReply,
    muted,
    setMuted
  } = useAppState();

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [draft, setDraft] = useState('');

  const liked = likedReels.includes(reel.id);
  const endorsed = endorsedReels.includes(reel.id);
  const listed = shortlist.includes(reel.id);
  const thread = [...(reelComments[reel.id] ?? []), ...(reelReplies[reel.id] ?? [])];

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setCommentsOpen(false);
      return;
    }
    if (!playing) return;
    const step = 100 / (reel.duration * 10);
    const id = window.setInterval(() => setProgress((p) => p + step >= 100 ? 0 : p + step), 100);
    return () => window.clearInterval(id);
  }, [active, playing, reel.duration]);

  useEffect(() => {
    if (!shared) return;
    const id = window.setTimeout(() => setShared(false), 1800);
    return () => window.clearTimeout(id);
  }, [shared]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black shadow-pop">
      <motion.img
        src={reel.media}
        alt={`${reel.name}, ${reel.role}`}
        className="absolute inset-0 h-full w-full object-cover"
        animate={{ scale: active && playing ? 1.06 : 1 }}
        transition={{ duration: 10, ease: 'linear' }} />
      

      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? `Pause ${reel.name}'s reel` : `Play ${reel.name}'s reel`}
        className="absolute inset-0 z-10 cursor-default" />
      

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />

      <AnimatePresence>
        {!playing ?
        <motion.span
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
          
            <PlayIcon className="ml-1 h-7 w-7 fill-current" />
          </motion.span> :
        null}
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <span className="rounded-lg bg-black/45 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
          Talent reel
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-black/45 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur">
            {reel.duration}s
          </span>
          <button
            type="button"
            aria-label={`More options for ${reel.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors duration-150 hover:bg-black/65">
            
            <MoreHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-16 z-20 p-4 pb-6 sm:right-20">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white ring-2 ring-white/70',
              reel.tone
            )}
            aria-hidden="true">
            
            {reel.initials}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[15px] font-extrabold leading-tight text-white">
              <span className="truncate">{reel.name}</span>
              {reel.verified ? <BadgeCheckIcon className="h-4 w-4 shrink-0 text-sky-300" aria-label="Verified" /> : null}
              <span className="shrink-0 font-semibold text-white/70">· {reel.experience}</span>
            </p>
            <p className="truncate text-[13px] text-white/75">
              {reel.role} · {reel.location}
            </p>
          </div>
        </div>

        <p className="mt-3 text-[15px] font-extrabold leading-snug text-white">{reel.pitch}</p>

        <ul className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <li className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-brand-700">
            {reel.match}% match
          </li>
          <li className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {reel.category} · {reel.rating}★
          </li>
          <li className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {reel.salary}
          </li>
        </ul>

        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          {reel.availability}
        </p>

        <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-white/70">{reel.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/network"
            className="h-9 rounded-full bg-white px-4 text-[13px] font-extrabold leading-9 text-ink transition-colors duration-150 hover:bg-white/90">
            
            View full profile
          </Link>
          <button
            type="button"
            onClick={() => toggleShortlist(reel.id)}
            aria-pressed={listed}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-extrabold transition-colors duration-150',
              listed ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white/20 text-white backdrop-blur hover:bg-white/30'
            )}>
            
            <BookmarkIcon className={cn('h-4 w-4', listed && 'fill-current')} />
            {listed ? 'Shortlisted' : 'Shortlist'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-24 right-2.5 z-20 flex flex-col items-center gap-3.5 sm:bottom-28 sm:right-4">
        <RailAction
          label="Endorse"
          caption={endorsed ? 'Endorsed' : 'Endorse'}
          active={endorsed}
          activeClass="text-sky-300"
          onClick={() => toggleEndorse(reel.id)}
          icon={<ThumbsUpIcon className={cn('h-6 w-6', endorsed && 'fill-current')} />} />
        
        <RailAction
          label={liked ? 'Unlike' : 'Like'}
          caption={compact(reel.likes + (liked ? 1 : 0))}
          active={liked}
          activeClass="text-rose-500"
          onClick={() => toggleReelLike(reel.id)}
          icon={<HeartIcon className={cn('h-6 w-6', liked && 'fill-current')} />} />
        
        <RailAction
          label="Comments"
          caption={compact(thread.length)}
          onClick={() => setCommentsOpen(true)}
          icon={<MessageCircleIcon className="h-6 w-6" />} />
        
        <RailAction
          label="Share"
          caption={shared ? 'Copied' : 'Share'}
          onClick={() => setShared(true)}
          icon={<Share2Icon className="h-6 w-6" />} />
        
        <RailAction
          label={playing ? 'Pause' : 'Play'}
          caption={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying((p) => !p)}
          icon={playing ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />} />
        
        <RailAction
          label={muted ? 'Unmute' : 'Mute'}
          caption={muted ? 'Muted' : 'Sound'}
          onClick={() => setMuted(!muted)}
          icon={muted ? <VolumeXIcon className="h-6 w-6" /> : <Volume2Icon className="h-6 w-6" />} />
        
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/20">
        <div
          className="h-full bg-white"
          style={{ width: `${active ? progress : 0}%` }}
          role="progressbar"
          aria-label="Reel progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100} />
        
      </div>

      <AnimatePresence>
        {commentsOpen ?
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-x-0 bottom-0 z-30 flex h-[62%] flex-col rounded-t-2xl bg-white"
          role="dialog"
          aria-label={`Comments on ${reel.name}'s reel`}>
          
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-sm font-extrabold text-ink">{thread.length} comments</h3>
              <button
              type="button"
              onClick={() => setCommentsOpen(false)}
              aria-label="Close comments"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-mute transition-colors duration-150 hover:bg-canvas">
              
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {thread.length === 0 ?
            <p className="pt-6 text-center text-sm text-ink-mute">
                  No notes yet. Leave one for the rest of the hiring panel.
                </p> :

            thread.map((c) =>
            <div key={c.id} className="flex gap-2.5">
                    <span
                aria-hidden="true"
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white',
                  c.tone
                )}>
                
                      {c.initials}
                    </span>
                    <p className="text-[13px] leading-relaxed text-ink-soft">
                      <span className="font-extrabold text-ink">{c.author}</span>{' '}
                      <span className="text-[11px] text-ink-faint">{c.time}</span>
                      <br />
                      {c.text}
                    </p>
                  </div>
            )
            }
            </div>

            <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              addReelReply(reel.id, draft.trim());
              setDraft('');
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-3">
            
              <label htmlFor={`reel-comment-${reel.id}`} className="sr-only">
                Add a note
              </label>
              <input
              id={`reel-comment-${reel.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note for your hiring panel…"
              className="h-10 flex-1 rounded-full border border-line bg-canvas px-4 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:outline-none" />
            
              <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Post note"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition-colors duration-150 hover:bg-brand-700 disabled:bg-brand-200">
              
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </motion.div> :
        null}
      </AnimatePresence>
    </div>);

}

function RailAction({
  icon,
  caption,
  label,
  active,
  activeClass,
  onClick







}: {icon: React.ReactNode;caption: string;label: string;active?: boolean;activeClass?: string;onClick?: () => void;}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex w-14 flex-col items-center gap-1">
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-colors duration-150 hover:bg-black/60',
          active ? activeClass : 'text-white'
        )}>
        
        {icon}
      </span>
      <span className="text-[11px] font-bold text-white drop-shadow">{caption}</span>
    </button>);

}