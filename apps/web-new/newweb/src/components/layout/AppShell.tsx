import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { MobileTabBar } from './MobileTabBar';
import { ComposeModal } from '../feed/ComposeModal';
import { CookieBanner } from '../CookieBanner';

export function AppShell() {
  const [composeOpen, setComposeOpen] = useState(false);
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-full w-full bg-canvas">
      <TopBar onCompose={() => setComposeOpen(true)} />

      <div className="mx-auto flex w-full max-w-[1440px] gap-8 px-4">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-5 no-scrollbar">
            <SideNav />
          </div>
        </aside>

        <main className={pathname === '/' ? 'min-w-0 flex-1 pt-3' : 'min-w-0 flex-1 pb-24 pt-5 lg:pb-12'}>
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
      <CookieBanner />
    </div>);

}