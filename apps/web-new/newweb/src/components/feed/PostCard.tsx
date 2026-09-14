import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  Repeat2Icon,
  SendIcon } from
'lucide-react';
import { Post } from '../../types';
import { personById, me } from '../../data/people';
import { jobById } from '../../data/jobs';
import { Avatar } from '../ui/Avatar';
import { useAppState } from '../../contexts/AppState';
import { cn, compact } from '../../utils/cn';

const kindLabel: Record<Post['kind'], {label: string;className: string;} | null> = {
  update: null,
  hiring: { label: 'Hiring', className: 'bg-brand-50 text-brand-700' },
  milestone: { label: 'Milestone', className: 'bg-amber-50 text-warn' },
  question: { label: 'Asking the network', className: 'bg-canvas text-ink-soft' }
};

export function PostCard({ post, density = 'comfortable' }: {post: Post;density?: 'comfortable' | 'compact';}) {
  const author = personById(post.authorId);
  const job = post.jobId ? jobById(post.jobId) : undefined;
  const { toggleLike, toggleSavePost, votePoll, pollVotes } = useAppState();
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const badge = kindLabel[post.kind];
  const pad = density === 'compact' ? 'px-4 py-3' : 'px-5 py-4';
  const voted = pollVotes[post.id];

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <header className={cn('flex items-start gap-3', pad)}>
        <Link to={post.authorId === 'me' ? '/profile' : '/network'} aria-label={author.name}>
          <Avatar initials={author.initials} tone={author.tone} size={density === 'compact' ? 'sm' : 'md'} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <span className="text-[15px] font-extrabold leading-tight text-ink">{author.name}</span>
            {author.verified ? <BadgeCheckIcon className="h-4 w-4 text-brand-600" aria-label="Verified" /> : null}
            {badge ?
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide', badge.className)}>
                {badge.label}
              </span> :
            null}
          </div>
          <p className="truncate text-[13px] text-ink-mute">
            {author.role} · {author.company} · {post.time}
          </p>
        </div>
        <button
          type="button"
          aria-label="Post options"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-mute transition-colors duration-150 hover:bg-canvas">
          
          <MoreHorizontalIcon className="h-5 w-5" />
        </button>
      </header>

      <div className={cn('pb-3', density === 'compact' ? 'px-4' : 'px-5')}>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{post.text}</p>
        {post.tags?.length ?
        <p className="mt-2 flex flex-wrap gap-x-2 text-[13px] font-bold text-brand-600">
            {post.tags.map((t) =>
          <span key={t}>#{t.replace(/\s/g, '')}</span>
          )}
          </p> :
        null}
      </div>

      {post.poll ?
      <div className={cn('pb-4', density === 'compact' ? 'px-4' : 'px-5')}>
          <fieldset className="rounded-xl border border-line p-3">
            <legend className="px-1 text-xs font-extrabold uppercase tracking-wide text-ink-mute">
              {post.poll.question}
            </legend>
            <div className="mt-1 space-y-1.5">
              {post.poll.options.map((opt, i) => {
              const total = post.poll!.options.reduce((s, o) => s + o.votes, 0) + (voted !== undefined ? 1 : 0);
              const votes = opt.votes + (voted === i ? 1 : 0);
              const pct = Math.round(votes / total * 100);
              const chosen = voted === i;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => votePoll(post.id, i)}
                  className={cn(
                    'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors duration-150',
                    chosen ? 'border-brand-300 text-brand-700' : 'border-line text-ink-soft hover:border-brand-200'
                  )}>
                  
                    {voted !== undefined ?
                  <motion.span
                    aria-hidden="true"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                    className={cn('absolute inset-y-0 left-0', chosen ? 'bg-brand-50' : 'bg-canvas')} /> :

                  null}
                    <span className="relative flex justify-between">
                      <span>{opt.label}</span>
                      {voted !== undefined ? <span className="tabular-nums">{pct}%</span> : null}
                    </span>
                  </button>);

            })}
            </div>
            <p className="mt-2 px-1 text-[11px] text-ink-faint">
              {voted !== undefined ? 'Thanks — results are live.' : 'Tap an option to vote.'}
            </p>
          </fieldset>
        </div> :
      null}

      {job ?
      <div className={cn('pb-4', density === 'compact' ? 'px-4' : 'px-5')}>
          <Link
          to={`/jobs/${job.id}`}
          className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50/60">
          
            <Avatar initials={job.companyInitials} tone={job.tone} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-ink">{job.title}</span>
              <span className="block truncate text-xs text-ink-mute">
                {job.company} · {job.location} · {job.salary}
              </span>
            </span>
            <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-brand-600" />
          </Link>
        </div> :
      null}

      {post.media ?
      <img
        src={post.media}
        alt=""
        className="aspect-[3/2] w-full border-y border-line object-cover"
        loading="lazy" /> :

      null}

      <div className={cn('flex items-center gap-1 pt-2', density === 'compact' ? 'px-2.5' : 'px-3.5')}>
        <ActionButton
          label={compact(post.likes)}
          srLabel={post.liked ? 'Unlike' : 'Like'}
          active={post.liked}
          onClick={() => toggleLike(post.id)}
          icon={<HeartIcon className={cn('h-5 w-5', post.liked && 'fill-current')} strokeWidth={2.1} />}
          activeClass="text-rose-600" />
        
        <ActionButton
          label={compact(post.comments)}
          srLabel="Comment"
          onClick={() => setCommentOpen((v) => !v)}
          icon={<MessageCircleIcon className="h-5 w-5" strokeWidth={2.1} />} />
        
        <ActionButton
          label={compact(post.reposts)}
          srLabel="Repost"
          icon={<Repeat2Icon className="h-5 w-5" strokeWidth={2.1} />} />
        
        <div className="ml-auto">
          <ActionButton
            srLabel={post.saved ? 'Remove from saved' : 'Save post'}
            active={post.saved}
            onClick={() => toggleSavePost(post.id)}
            icon={<BookmarkIcon className={cn('h-5 w-5', post.saved && 'fill-current')} strokeWidth={2.1} />}
            activeClass="text-brand-700" />
          
        </div>
      </div>

      {post.topComment ?
      <div className={cn('flex gap-2.5 pt-2', density === 'compact' ? 'px-4' : 'px-5')}>
          <Avatar initials={personById(post.topComment.authorId).initials} tone={personById(post.topComment.authorId).tone} size="xs" />
          <p className="text-[13px] leading-relaxed text-ink-soft">
            <span className="font-extrabold text-ink">{personById(post.topComment.authorId).name}</span>{' '}
            {post.topComment.text}
          </p>
        </div> :
      null}

      {commentOpen ?
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setComment('');
          setCommentOpen(false);
        }}
        className={cn('flex items-center gap-2.5 py-3', density === 'compact' ? 'px-4' : 'px-5')}>
        
          <Avatar initials={me.initials} tone={me.tone} size="xs" />
          <label htmlFor={`comment-${post.id}`} className="sr-only">
            Add a comment
          </label>
          <input
          id={`comment-${post.id}`}
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          className="h-9 flex-1 rounded-full border border-line bg-canvas px-3.5 text-sm placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:outline-none" />
        
          <button
          type="submit"
          disabled={!comment.trim()}
          aria-label="Send comment"
          className="flex h-9 w-9 items-center justify-center rounded-full text-brand-600 transition-colors duration-150 hover:bg-brand-50 disabled:text-ink-faint">
          
            <SendIcon className="h-4 w-4" />
          </button>
        </form> :

      <div className="h-3" />
      }
    </article>);

}

function ActionButton({
  icon,
  label,
  srLabel,
  active,
  onClick,
  activeClass







}: {icon: React.ReactNode;label?: string;srLabel: string;active?: boolean;onClick?: () => void;activeClass?: string;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition-colors duration-150',
        active ? activeClass : 'text-ink-soft hover:bg-canvas'
      )}>
      
      {icon}
      {label ? <span className="tabular-nums">{label}</span> : null}
    </button>);

}