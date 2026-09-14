import React from 'react';
import { TrendingUpIcon } from 'lucide-react';

const topics = [
{ tag: 'CareerSwitch', posts: '3,214 posts' },
{ tag: 'HiringInLondon', posts: '1,880 posts' },
{ tag: 'FourDayWeek', posts: '972 posts' },
{ tag: 'PortfolioReview', posts: '640 posts' }];


export function TrendingTopics() {
  return (
    <section aria-label="Trending topics" className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-ink">
        <TrendingUpIcon className="h-4 w-4 text-brand-600" />
        Trending this week
      </h2>
      <ul className="space-y-2.5">
        {topics.map((t) =>
        <li key={t.tag}>
            <button type="button" className="text-left">
              <span className="block text-[13px] font-extrabold text-ink hover:text-brand-700">#{t.tag}</span>
              <span className="block text-[11px] text-ink-faint">{t.posts}</span>
            </button>
          </li>
        )}
      </ul>
    </section>);

}