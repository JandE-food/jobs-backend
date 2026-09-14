import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStateProvider } from './contexts/AppState';
import { AppShell } from './components/layout/AppShell';
import { Home } from './pages/Home';
import { Feed } from './pages/Feed';
import { Companies } from './pages/Companies';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
import { Applications } from './pages/Applications';
import { Network } from './pages/Network';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Saved } from './pages/Saved';
import { Settings } from './pages/Settings';

type AppProps = {
  feedDensity?: 'comfortable' | 'compact';
  showRightRail?: boolean;
};

export function App({ feedDensity = 'comfortable', showRightRail = true }: AppProps) {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home showRail={showRightRail} />} />
            <Route path="/feed" element={<Feed density={feedDensity} showRail={showRightRail} />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/network" element={<Network />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>);

}