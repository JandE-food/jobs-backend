import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Conversation, Post } from '../types';
import { posts as seedPosts } from '../data/posts';
import { conversations as seedConversations } from '../data/messages';

type AppStateValue = {
  posts: Post[];
  addPost: (text: string, kind: Post['kind']) => void;
  toggleLike: (id: string) => void;
  toggleSavePost: (id: string) => void;
  savedJobIds: string[];
  toggleSaveJob: (id: string) => void;
  appliedJobIds: string[];
  applyToJob: (id: string) => void;
  followedIds: string[];
  toggleFollow: (id: string) => void;
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  votePoll: (postId: string, option: number) => void;
  pollVotes: Record<string, number>;
  likedReels: string[];
  toggleReelLike: (id: string) => void;
  endorsedReels: string[];
  toggleEndorse: (id: string) => void;
  shortlist: string[];
  toggleShortlist: (id: string) => void;
  reelReplies: Record<string, {id: string;author: string;initials: string;tone: string;text: string;time: string;}[]>;
  addReelReply: (reelId: string, text: string) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: {children: React.ReactNode;}) {
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(['j1', 'j5']);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(['j2', 'j3', 'j5', 'j6']);
  const [followedIds, setFollowedIds] = useState<string[]>(['p1', 'p3', 'p6']);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [endorsedReels, setEndorsedReels] = useState<string[]>(['r1']);
  const [shortlist, setShortlist] = useState<string[]>(['r5']);
  const [reelReplies, setReelReplies] = useState<
    Record<string, {id: string;author: string;initials: string;tone: string;text: string;time: string;}[]>>(
    {});
  const [muted, setMuted] = useState(true);

  const toggleReelLike = useCallback((id: string) => {
    setLikedReels((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const toggleEndorse = useCallback((id: string) => {
    setEndorsedReels((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const toggleShortlist = useCallback((id: string) => {
    setShortlist((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }, []);

  const addReelReply = useCallback((reelId: string, text: string) => {
    setReelReplies((prev) => ({
      ...prev,
      [reelId]: [
      ...(prev[reelId] ?? []),
      { id: `rr-${Date.now()}`, author: 'Amara Okafor', initials: 'AO', tone: 'bg-brand-600', text, time: 'now' }]

    }));
  }, []);

  const addPost = useCallback((text: string, kind: Post['kind']) => {
    setPosts((prev) => [
    {
      id: `new-${Date.now()}`,
      authorId: 'me',
      kind,
      time: 'now',
      text,
      likes: 0,
      comments: 0,
      reposts: 0
    },
    ...prev]
    );
  }, []);

  const toggleLike = useCallback((id: string) => {
    setPosts((prev) =>
    prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)
    );
  }, []);

  const toggleSavePost = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
  }, []);

  const toggleSaveJob = useCallback((id: string) => {
    setSavedJobIds((prev) => prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]);
  }, []);

  const applyToJob = useCallback((id: string) => {
    setAppliedJobIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const toggleFollow = useCallback((id: string) => {
    setFollowedIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    setConversations((prev) =>
    prev.map((c) =>
    c.id === conversationId ?
    {
      ...c,
      last: text,
      time: 'now',
      messages: [...c.messages, { id: `m-${Date.now()}`, from: 'me', text, time: 'now' }]
    } :
    c
    )
    );
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unread: 0 } : c));
  }, []);

  const votePoll = useCallback((postId: string, option: number) => {
    setPollVotes((prev) => prev[postId] === undefined ? { ...prev, [postId]: option } : prev);
  }, []);

  const value = useMemo(
    () => ({
      posts,
      addPost,
      toggleLike,
      toggleSavePost,
      savedJobIds,
      toggleSaveJob,
      appliedJobIds,
      applyToJob,
      followedIds,
      toggleFollow,
      conversations,
      sendMessage,
      markConversationRead,
      votePoll,
      pollVotes,
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
    }),
    [
    likedReels,
    toggleReelLike,
    endorsedReels,
    toggleEndorse,
    shortlist,
    toggleShortlist,
    reelReplies,
    addReelReply,
    muted,
    posts,
    addPost,
    toggleLike,
    toggleSavePost,
    savedJobIds,
    toggleSaveJob,
    appliedJobIds,
    applyToJob,
    followedIds,
    toggleFollow,
    conversations,
    sendMessage,
    markConversationRead,
    votePoll,
    pollVotes]

  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}