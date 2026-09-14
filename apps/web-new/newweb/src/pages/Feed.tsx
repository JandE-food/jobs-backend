import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import { PageFrame } from '../components/layout/PageFrame';
import { SpotlightRail } from '../components/feed/SpotlightRail';
import { Composer } from '../components/feed/Composer';
import { ComposeModal } from '../components/feed/ComposeModal';
import { PostCard } from '../components/feed/PostCard';
import { ProfileStrength } from '../components/rails/ProfileStrength';
import { MatchedJobs } from '../components/rails/MatchedJobs';
import { SuggestedPeople } from '../components/rails/SuggestedPeople';
import { TrendingTopics } from '../components/rails/TrendingTopics';
import { RailFooter } from '../components/rails/RailFooter';
import { useAppState } from '../contexts/AppState';
import { cn } from '../utils/cn';

type Tab = 'For you' | 'Following' | 'Hiring' | 'Questions';
const tabs: Tab[] = ['For you', 'Following', 'Hiring', 'Questions'];

type FeedProps = {
  density?: 'comfortable' | 'compact';
  showRail?: boolean;
};

export function Feed({ density = 'comfortable', showRail = true }: FeedProps) {
  const { posts, followedIds } = useAppState();
  const [tab, setTab] = useState<Tab>('For you');
  const [composeOpen, setComposeOpen] = useState(false);
  const [visible, setVisible] = useState(5);

  const filtered = useMemo(() => {
    if (tab === 'Following') return posts.filter((p) => followedIds.includes(p.authorId) || p.authorId === 'me');
    if (tab === 'Hiring') return posts.filter((p) => p.kind === 'hiring');
    if (tab === 'Questions') return posts.filter((p) => p.kind === 'question');
    return posts;
  }, [posts, tab, followedIds]);

  const shown = filtered.slice(0, visible);

  return (
    <PageFrame
      rail={
      showRail ?
      <>
            <ProfileStrength />
            <MatchedJobs />
            <SuggestedPeople />
            <TrendingTopics />
            <RailFooter />
          </> :
      undefined
      }>
      
      <header className="mb-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Network feed</h1>
        <p className="mt-1 text-sm text-ink-mute">Updates, roles and questions from the people you follow.</p>
      </header>

      <div className="space-y-4">
        <SpotlightRail />
        <Composer onOpen={() => setComposeOpen(true)} />

        <div className="sticky top-14 z-20 -mx-1 bg-canvas/95 px-1 py-2 backdrop-blur">
          <div
            role="tablist"
            aria-label="Feed filter"
            className="flex items-center gap-1 rounded-full border border-line bg-white p-1 shadow-card">
            
            {tabs.map((t) =>
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setVisible(5);
              }}
              className={cn(
                'relative flex-1 rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors duration-150',
                tab === t ? 'text-white' : 'text-ink-soft hover:text-ink'
              )}>
              
                {tab === t ?
              <motion.span
                layoutId="feed-tab"
                className="absolute inset-0 rounded-full bg-brand-600"
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} /> :

              null}
                <span className="relative">{t}</span>
              </button>
            )}
          </div>
        </div>

        {shown.length === 0 ?
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <SparklesIcon className="mx-auto h-6 w-6 text-ink-faint" />
            <p className="mt-2 text-sm font-extrabold text-ink">Nothing here yet</p>
            <p className="mt-1 text-sm text-ink-mute">
              Follow a few more people in your field and this tab will fill up quickly.
            </p>
          </div> :

        <div className="space-y-4">
            {shown.map((post, i) =>
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1], delay: Math.min(i, 4) * 0.04 }}>
            
                <PostCard post={post} density={density} />
              </motion.div>
          )}
          </div>
        }

        {visible < filtered.length ?
        <button
          type="button"
          onClick={() => setVisible((v) => v + 5)}
          className="h-11 w-full rounded-full border border-line bg-white text-sm font-bold text-ink transition-colors duration-150 hover:border-brand-200 hover:text-brand-700">
          
            Show more posts
          </button> :

        <p className="py-4 text-center text-xs text-ink-faint">You are all caught up.</p>
        }
      </div>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </PageFrame>);

}