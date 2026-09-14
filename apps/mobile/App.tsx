import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer, type VideoSource } from "expo-video";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  Image,
  Linking,
  Modal,
  NativeModules,
  PanResponder,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { BussInAuthProvider, useBussInAuth } from "./src/auth";
import {
  feed,
  jobs,
  me,
  parsedResume,
  people,
  type FeedAttachment,
  type FeedItem,
  type Job,
  type FeedMediaLayout,
  type Person,
  AVATARS,
} from "./src/data/mock";
import { colors, spacing } from "./src/theme";

const sfProTextFamily = Platform.select({
  ios: "SF Pro Text",
  android: "sans-serif",
  default: undefined,
});
const sfProDisplayFamily = Platform.select({
  ios: "SF Pro Display",
  android: "sans-serif-medium",
  default: sfProTextFamily,
});
const TextWithDefaults = Text as typeof Text & { defaultProps?: { style?: unknown } };
const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

if (sfProTextFamily) {
  TextWithDefaults.defaultProps = TextWithDefaults.defaultProps ?? {};
  TextWithDefaults.defaultProps.style = [
    TextWithDefaults.defaultProps.style,
    { fontFamily: sfProTextFamily },
  ];

  TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps ?? {};
  TextInputWithDefaults.defaultProps.style = [
    TextInputWithDefaults.defaultProps.style,
    { fontFamily: sfProTextFamily },
  ];
}

type AppRoute =
  | "feed"
  | "jobs"
  | "network"
  | "profile"
  | "availability"
  | "creator-profile"
  | "recruiter-dashboard"
  | "recruiter-feed"
  | "recruiter-candidates"
  | "recruiter-companies"
  | "recruiter-shortlists"
  | "resume"
  | "search"
  | "notifications"
  | "login"
  | "signup";
type MainRoute = Exclude<
  AppRoute,
  "login" | "signup" | "search" | "notifications" | "creator-profile" | "availability"
>;
const swipeableMainRoutes = ["feed", "jobs", "network", "profile"] as const;
type SwipeableMainRoute = (typeof swipeableMainRoutes)[number];
type AuthAudience = "professional" | "company";
type WorkerMode = "professional" | "gig";
type Phase = "idle" | "parsing" | "done";
type SearchResult = {
  id: string;
  kind: "job" | "person" | "post";
  title: string;
  subtitle: string;
  detail: string;
  route: AppRoute;
  icon: keyof typeof Ionicons.glyphMap;
};
type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  route: AppRoute;
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};
type DiscoveryLocationFilter = "All" | "Near me" | "Remote";
type DiscoverySectorFilter = "All" | "Product" | "Logistics" | "Care";
type DiscoveryRatingFilter = "All" | "4.0+" | "4.5+";
type MediaCompressionPreset = "balanced" | "low-data" | "hd";
type MediaFilterTone = "none" | "clarity" | "warm" | "mono";
type MediaUploadStage = "idle" | "compressing" | "filtering" | "queued" | "uploading" | "ready";
type AvailabilityMatrix = Record<string, boolean>;
type GigDispatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  day: string;
  hour: number;
  durationHours: number;
  pay: string;
  sector: Exclude<DiscoverySectorFilter, "All" | "Product"> | "Logistics";
  ratingRequired: number;
};
type DiscoveryMeta = {
  sector: Exclude<DiscoverySectorFilter, "All">;
  rating: number;
  locationMode: "near" | "remote" | "regional";
  workerModes: WorkerMode[];
  momentumBoost: number;
  note: string;
};
type ProfileExperienceItem = {
  id: string;
  role: string;
  company: string;
  period: string;
  impact: string;
};
type ProfileEducationItem = {
  id: string;
  school: string;
  degree: string;
  period: string;
};
type ProfileEditingSection = "basics" | "skills" | "experience" | "education";
type RecruiterDashboardPayload = {
  stats: {
    companies: number;
    jobs: number;
    shortlists: number;
    candidates: number;
  };
  recentJobs: Array<{
    id: number;
    title: string;
    status: string;
    featured: boolean;
    location: string;
    salary_range: string;
    company_name: string;
  }>;
  shortlists: Array<{
    id: number;
    name: string;
    candidate_count: number;
  }>;
};
type RecruiterCandidate = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  education: string[];
  experience_years: number;
};
type RecruiterShortlistSummary = {
  id: number;
  name: string;
  candidate_count: number;
};
type RecruiterShortlistDetail = {
  id: number;
  name: string;
  candidate_count: number;
  candidates: Array<{
    candidate_user_id: number;
    note: string | null;
    added_at: string;
    full_name: string;
    headline: string;
    location: string;
    summary: string;
    skills: string[];
    experience_years: number;
  }>;
};
type RecruiterCompany = {
  id: number;
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  verification_status: string;
  ad_headline: string;
  ad_copy: string;
  job_count: number;
  queued_jobs: number;
};
type RecruiterJob = {
  id: number;
  company_id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  status: string;
  featured: boolean;
  company_name: string;
};
type MobileProfileDraft = {
  name: string;
  headline: string;
  location: string;
  avatarUri?: string;
  skills: string[];
  experience: ProfileExperienceItem[];
  education: ProfileEducationItem[];
};
type FeedComposerMode = "update" | "media" | "ai";
type FeedComment = {
  id: string;
  authorName: string;
  text: string;
  time: string;
  isMe?: boolean;
};
type ComposerDraftSnapshot = {
  id: string;
  text: string;
  mode: FeedComposerMode;
  attachments: FeedAttachment[];
  mediaLayout: FeedMediaLayout;
  savedAtLabel: string;
};
type StoredFeedState = {
  feedItems: FeedItem[];
  likedIds: Record<string, boolean>;
  counts: Record<string, number>;
  commentCounts: Record<string, number>;
  commentsByPost: Record<string, FeedComment[]>;
  sharedIds: Record<string, boolean>;
  appliedMatchIds: Record<string, boolean>;
  referredHiringIds: Record<string, boolean>;
  viewedHiringIds: Record<string, boolean>;
  composerText: string;
  composerMode: FeedComposerMode;
  composerAttachments: FeedAttachment[];
  composerMediaLayout: FeedMediaLayout;
  composerOpen: boolean;
  recentComposerDrafts: ComposerDraftSnapshot[];
};

type SyncedFeedMedia = {
  kind: "image" | "video";
  uri: string;
  alt?: string;
  fileName?: string;
};

type SyncedFeedPost = {
  id: string;
  channel: "Work" | "Showcase" | "Local";
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  authorName: string;
  authorTitle: string;
  authorLocation: string;
  authorAvatarUri?: string;
  media: SyncedFeedMedia[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const envApiUrl = (
  globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env?.EXPO_PUBLIC_API_URL;
const defaultApiUrl = "https://135.125.184.123.sslip.io/api";

function normalizeApiUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function resolveMobileApiUrl() {
  if (envApiUrl?.trim()) {
    return normalizeApiUrl(envApiUrl);
  }

  return defaultApiUrl;
}

const apiUrl = resolveMobileApiUrl();
const mobileProfileStorageKey = "bussin-mobile-profile";
const mobileFeedStateStorageKey = "bussin-mobile-feed-state";
const mobileWorkerModeStorageKey = "bussin-mobile-worker-mode";
const mobileAvailabilityStorageKey = "bussin-mobile-availability";
const mobileBookedDispatchesStorageKey = "bussin-mobile-booked-dispatches";
const mobileAuthAudienceStorageKey = "bejeli-mobile-auth-audience";
const discoveryLocationOptions: DiscoveryLocationFilter[] = ["All", "Near me", "Remote"];
const discoverySectorOptions: DiscoverySectorFilter[] = ["All", "Product", "Logistics", "Care"];
const discoveryRatingOptions: DiscoveryRatingFilter[] = ["All", "4.0+", "4.5+"];
const availabilityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const availabilityHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
const gigDispatches: GigDispatch[] = [
  {
    id: "dispatch-1",
    title: "Morning warehouse cover",
    company: "SwiftDrop",
    location: "Birmingham, UK",
    day: "Mon",
    hour: 8,
    durationHours: 4,
    pay: "£17/hr",
    sector: "Logistics",
    ratingRequired: 4.2,
  },
  {
    id: "dispatch-2",
    title: "Lunch rush rider block",
    company: "QuickCart",
    location: "London, UK",
    day: "Tue",
    hour: 12,
    durationHours: 3,
    pay: "£15/hr + surge",
    sector: "Logistics",
    ratingRequired: 4.0,
  },
  {
    id: "dispatch-3",
    title: "Evening care support",
    company: "CareCircle",
    location: "London, UK",
    day: "Wed",
    hour: 18,
    durationHours: 4,
    pay: "£21/hr",
    sector: "Care",
    ratingRequired: 4.6,
  },
  {
    id: "dispatch-4",
    title: "Weekend home visit shift",
    company: "CareCircle",
    location: "Manchester, UK",
    day: "Sat",
    hour: 9,
    durationHours: 6,
    pay: "£22/hr",
    sector: "Care",
    ratingRequired: 4.5,
  },
];
const recruiterTalentShowcaseTemplates: Array<{
  layout: FeedMediaLayout;
  note: string;
  attachments: Array<Omit<FeedAttachment, "id">>;
}> = [
  {
    layout: "scroll",
    note: "Video intro and work sample ready for fast recruiter review.",
    attachments: [
      {
        kind: "video",
        fileName: "talent-intro-1.mp4",
        mimeType: "video/mp4",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        sizeLabel: "18.4 MB",
        previewSource: AVATARS.cover,
      },
    ],
  },
  {
    layout: "collage",
    note: "Portfolio visuals and shift snapshots packaged as a quick talent reel.",
    attachments: [
      {
        kind: "image",
        fileName: "talent-collage-1.jpg",
        previewSource: AVATARS.person1,
      },
      {
        kind: "image",
        fileName: "talent-collage-2.jpg",
        previewSource: AVATARS.person2,
      },
      {
        kind: "image",
        fileName: "talent-collage-3.jpg",
        previewSource: AVATARS.cover,
      },
    ],
  },
  {
    layout: "scroll",
    note: "Short-form talent clip optimized for mobile review and shortlist decisions.",
    attachments: [
      {
        kind: "video",
        fileName: "talent-intro-2.mp4",
        mimeType: "video/mp4",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        sizeLabel: "12.7 MB",
        previewSource: AVATARS.person3,
      },
    ],
  },
];
const skillSuggestionPool = Array.from(
  new Set([
    ...parsedResume.skills,
    "Product Strategy",
    "Mobile Design",
    "Leadership",
    "Mentoring",
    "Journey Mapping",
    "Interaction Design",
    "Cross-functional Collaboration",
    "Visual Design",
  ]),
);
const resumeSteps = [
  "Reading document structure",
  "Protecting contact details",
  "Normalising impact statements",
  "Mapping skills to our taxonomy",
  "Scoring open roles",
];
const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "New high-confidence role match",
    body: "Lead Product Designer at Kora Health is still trending for your profile.",
    time: "Just now",
    route: "jobs",
    unread: true,
    icon: "sparkles-outline",
  },
  {
    id: "n2",
    title: "Profile activity picked up",
    body: "James Whitfield and 3 recruiters viewed your profile this morning.",
    time: "24m",
    route: "network",
    unread: true,
    icon: "people-outline",
  },
  {
    id: "n3",
    title: "Resume insights refreshed",
    body: "Your CV parsing summary is ready to review and sync.",
    time: "1h",
    route: "resume",
    unread: false,
    icon: "document-text-outline",
  },
  {
    id: "n4",
    title: "Feed post is getting traction",
    body: "Your latest hiring-signal post picked up new reactions and comments.",
    time: "2h",
    route: "feed",
    unread: false,
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "n5",
    title: "Profile readiness reminder",
    body: "Add a few more details to make your professional profile stronger.",
    time: "Today",
    route: "profile",
    unread: true,
    icon: "person-outline",
  },
];
const initialFeedComments: Record<string, FeedComment[]> = {
  f1: [
    {
      id: "f1-c1",
      authorName: "Amara Okonkwo",
      text: "Exactly the kind of quality signal candidates want to see instead of mass outreach.",
      time: "52m",
      isMe: true,
    },
    {
      id: "f1-c2",
      authorName: "Priya Nair",
      text: "The trust layer matters. Better funnels beat louder funnels every time.",
      time: "31m",
    },
  ],
  f2: [
    {
      id: "f2-c1",
      authorName: "James Whitfield",
      text: "This is the right framing. Format polish should never outweigh real impact.",
      time: "1h",
    },
  ],
};

function formatAttachmentSize(size?: number | null) {
  if (!size || size <= 0) {
    return undefined;
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function encodeBase64(bytes: Uint8Array) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    output += alphabet[(chunk >> 18) & 63];
    output += alphabet[(chunk >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? alphabet[chunk & 63] : "=";
  }

  return output;
}

async function readAssetAsDataUrl(uri?: string, mimeType?: string | null) {
  if (!uri) {
    return undefined;
  }

  if (uri.startsWith("data:")) {
    return uri;
  }

  try {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const resolvedMimeType = mimeType ?? response.headers.get("content-type") ?? "image/jpeg";

    return `data:${resolvedMimeType};base64,${encodeBase64(new Uint8Array(buffer))}`;
  } catch {
    return uri;
  }
}

function inferAttachmentKind(mimeType?: string | null, fileName?: string) {
  if (mimeType?.startsWith("video/")) {
    return "video" as const;
  }

  if (mimeType?.startsWith("image/")) {
    return "image" as const;
  }

  const normalizedName = fileName?.toLowerCase() ?? "";

  if (/\.(mp4|mov|m4v|avi|webm)$/.test(normalizedName)) {
    return "video" as const;
  }

  return "image" as const;
}

async function buildAttachmentFromAsset(asset: {
  name: string;
  mimeType?: string | null;
  size?: number | null;
  uri?: string;
}): Promise<FeedAttachment> {
  const kind = inferAttachmentKind(asset.mimeType, asset.name);
  const persistedUri =
    kind === "image" ? await readAssetAsDataUrl(asset.uri, asset.mimeType) : asset.uri;

  return {
    id: `attachment-${asset.name}-${Date.now()}`,
    kind,
    fileName: asset.name,
    mimeType: asset.mimeType ?? undefined,
    uri: persistedUri,
    sizeLabel: formatAttachmentSize(asset.size),
    previewSource: persistedUri ? ({ uri: persistedUri } as ImageSourcePropType) : undefined,
  };
}

function buildInitialProfileDraft(user?: { fullName?: string }) {
  return {
    name: user?.fullName ?? me.name,
    headline: me.headline,
    location: me.location,
    avatarUri: undefined,
    skills: [...parsedResume.skills],
    experience: parsedResume.experience.map((item, index) => ({
      id: `experience-${index}`,
      role: item.role,
      company: item.company,
      period: item.period,
      impact: item.impact,
    })),
    education: parsedResume.education.map((item, index) => ({
      id: `education-${index}`,
      school: item.school,
      degree: item.degree,
      period: item.period,
    })),
  } satisfies MobileProfileDraft;
}

function normalizeProfileDraft(
  parsed: Partial<MobileProfileDraft> | undefined,
  user?: { fullName?: string },
): MobileProfileDraft {
  const base = buildInitialProfileDraft(user);

  return {
    name: parsed?.name?.trim() || user?.fullName || base.name,
    headline: parsed?.headline?.trim() || base.headline,
    location: parsed?.location?.trim() || base.location,
    avatarUri: parsed?.avatarUri || undefined,
    skills:
      parsed?.skills?.map((skill) => skill.trim()).filter(Boolean) && parsed.skills.length
        ? Array.from(new Set(parsed.skills.map((skill) => skill.trim()).filter(Boolean)))
        : base.skills,
    experience:
      parsed?.experience?.length
        ? parsed.experience.map((item, index) => ({
            id: item.id || `experience-${index}`,
            role: item.role?.trim() || "",
            company: item.company?.trim() || "",
            period: item.period?.trim() || "",
            impact: item.impact?.trim() || "",
          }))
        : base.experience,
    education:
      parsed?.education?.length
        ? parsed.education.map((item, index) => ({
            id: item.id || `education-${index}`,
            school: item.school?.trim() || "",
            degree: item.degree?.trim() || "",
            period: item.period?.trim() || "",
          }))
        : base.education,
  };
}

function normalizeFeedItems(items: FeedItem[]) {
  return items.map((item) => {
    if (item.kind !== "post") {
      return item;
    }

    const legacyItem = item as FeedItem & { attachment?: FeedAttachment };
    const attachments =
      item.attachments ?? (legacyItem.attachment ? [legacyItem.attachment] : undefined);
    const imageCount = attachments?.filter((attachment) => attachment.kind === "image").length ?? 0;

    return {
      ...item,
      attachments,
      mediaLayout: item.mediaLayout ?? (imageCount > 1 ? "collage" : "scroll"),
    };
  });
}

function buildDefaultAvailabilityMatrix(): AvailabilityMatrix {
  const matrix: AvailabilityMatrix = {};

  for (const day of availabilityDays) {
    for (const hour of availabilityHours) {
      matrix[`${day}-${hour}`] = false;
    }
  }

  matrix["Mon-8"] = true;
  matrix["Tue-12"] = true;
  matrix["Wed-18"] = true;
  matrix["Sat-9"] = true;
  return matrix;
}

function buildAvailabilityKey(day: string, hour: number) {
  return `${day}-${hour}`;
}

function buildApiHeaders(token?: string, extraHeaders?: Record<string, string>) {
  const headers = new Headers(extraHeaders);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

async function readMobileJson<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

function isRecruiterUserRole(role?: "professional" | "recruiter" | "admin") {
  return role === "recruiter" || role === "admin";
}

function formatAvailabilityHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}${suffix}`;
}

function parseAttachmentSizeToMb(sizeLabel?: string) {
  if (!sizeLabel) {
    return 8;
  }

  const match = sizeLabel.match(/([\d.]+)\s*(KB|MB|GB)/i);

  if (!match) {
    return 8;
  }

  const value = Number(match[1]);
  const unit = match[2].toUpperCase();

  if (unit === "KB") {
    return value / 1024;
  }

  if (unit === "GB") {
    return value * 1024;
  }

  return value;
}

function estimateAttachmentPayloadMb(
  attachments: FeedAttachment[],
  preset: MediaCompressionPreset,
  networkMode: "standard" | "low-bandwidth",
) {
  const rawPayload = attachments.reduce((sum, attachment) => {
    const fallback = attachment.kind === "video" ? 18 : 4;
    return sum + (attachment.sizeLabel ? parseAttachmentSizeToMb(attachment.sizeLabel) : fallback);
  }, 0);
  const compressionRatio =
    preset === "low-data" ? 0.38 : preset === "balanced" ? 0.58 : 0.82;
  const networkRatio = networkMode === "low-bandwidth" ? 0.86 : 1;

  return {
    rawPayload,
    optimizedPayload: Math.max(0.4, rawPayload * compressionRatio * networkRatio),
  };
}

function getDiscoveryMeta(post: Extract<FeedItem, { kind: "post" }>): DiscoveryMeta {
  const lowerTags = post.tags.map((tag) => tag.toLowerCase());
  const lowerBody = post.body.toLowerCase();

  if (lowerTags.some((tag) => tag.includes("logistics")) || lowerBody.includes("warehouse")) {
    return {
      sector: "Logistics",
      rating: 4.4,
      locationMode: post.author.location.includes("London") ? "near" : "regional",
      workerModes: ["gig"],
      momentumBoost: 18,
      note: "Fast-response logistics crews are converting strongly nearby.",
    };
  }

  if (lowerTags.some((tag) => tag.includes("care")) || lowerBody.includes("care")) {
    return {
      sector: "Care",
      rating: 4.8,
      locationMode: post.author.location.includes("London") ? "near" : "regional",
      workerModes: ["gig"],
      momentumBoost: 22,
      note: "Reliability-rated carers are being booked directly from video intros.",
    };
  }

  return {
    sector: "Product",
    rating: post.author.location.toLowerCase().includes("remote") ? 4.5 : 4.7,
    locationMode: post.author.location.toLowerCase().includes("remote") ? "remote" : "regional",
    workerModes: ["professional"],
    momentumBoost: 16,
    note: "High-trust employers are prioritizing short-form portfolio walkthroughs.",
  };
}

function matchesDiscoveryFilters(
  meta: DiscoveryMeta,
  locationFilter: DiscoveryLocationFilter,
  sectorFilter: DiscoverySectorFilter,
  ratingFilter: DiscoveryRatingFilter,
) {
  if (locationFilter === "Near me" && meta.locationMode !== "near") {
    return false;
  }

  if (locationFilter === "Remote" && meta.locationMode !== "remote") {
    return false;
  }

  if (sectorFilter !== "All" && meta.sector !== sectorFilter) {
    return false;
  }

  if (ratingFilter === "4.5+" && meta.rating < 4.5) {
    return false;
  }

  if (ratingFilter === "4.0+" && meta.rating < 4.0) {
    return false;
  }

  return true;
}

function computeDiscoveryScore(
  post: Extract<FeedItem, { kind: "post" }>,
  meta: DiscoveryMeta,
  workerMode: WorkerMode,
  viewerProfile: MobileProfileDraft,
  counts: Record<string, number>,
  commentCounts: Record<string, number>,
) {
  const engagementScore = Math.min(
    24,
    Math.round(((counts[post.id] ?? post.likes) + (commentCounts[post.id] ?? post.comments)) / 8),
  );
  const locationScore =
    meta.locationMode === "near"
      ? viewerProfile.location.toLowerCase().includes("london")
        ? 18
        : 12
      : meta.locationMode === "remote"
        ? 14
        : 9;
  const skillSignal = viewerProfile.skills.some((skill) =>
    `${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(skill.toLowerCase()),
  )
    ? 10
    : 0;
  const modeBoost = meta.workerModes.includes(workerMode) ? 20 : -100;

  return Math.max(
    0,
    48 + Math.round(meta.rating * 6) + meta.momentumBoost + engagementScore + locationScore + skillSignal + modeBoost,
  );
}

function recruiterHomeRouteForRole(role?: "professional" | "recruiter" | "admin"): MainRoute {
  return isRecruiterUserRole(role) ? "recruiter-feed" : "feed";
}

function isRecruiterPublishedStatus(status?: string) {
  return status === "published" || status === "live";
}

function buildRecruiterCandidatePerson(candidate: RecruiterCandidate, index: number): Person {
  const candidateAvatars = [AVATARS.person1, AVATARS.person2, AVATARS.person3, AVATARS.cover];

  return {
    id: `recruiter-candidate-${candidate.id}`,
    name: candidate.full_name,
    title: candidate.headline || candidate.role || "Potential hire",
    company: "Open to work",
    location: candidate.location || "Location pending",
    avatar: candidateAvatars[index % candidateAvatars.length],
    mutuals: Math.max(1, Math.min(24, candidate.skills.length + candidate.experience_years)),
  };
}

function buildRecruiterTalentShowcase(candidate: RecruiterCandidate, index: number) {
  const template =
    recruiterTalentShowcaseTemplates[index % recruiterTalentShowcaseTemplates.length];

  return {
    layout: template.layout,
    note: template.note,
    attachments: template.attachments.map((attachment, attachmentIndex) => ({
      ...attachment,
      id: `candidate-${candidate.id}-showcase-${attachmentIndex}`,
    })),
  };
}

function computeRecruiterTalentFitScore(candidate: RecruiterCandidate) {
  return Math.min(
    98,
    68 +
      Math.min(candidate.experience_years * 4, 18) +
      Math.min(candidate.skills.length * 2, 10) +
      Math.min(candidate.education.length * 2, 6),
  );
}

function buildRecruiterTalentPost(input: {
  candidate: RecruiterCandidate;
  person: Person;
  showcase: ReturnType<typeof buildRecruiterTalentShowcase>;
  fitScore: number;
}): Extract<FeedItem, { kind: "post" }> {
  const { candidate, person, showcase, fitScore } = input;

  return {
    kind: "post",
    id: `recruiter-talent-${candidate.id}`,
    channel: candidate.location?.toLowerCase().includes("remote") ? "Work" : "Showcase",
    author: person,
    time: `${Math.max(candidate.experience_years, 1)}y exp`,
    body:
      candidate.summary ||
      `${candidate.headline || candidate.role || "Worker profile"} with ${candidate.experience_years} years of experience and strengths in ${candidate.skills.slice(0, 2).join(", ")}.`,
    tags: [
      "Talent reel",
      "Open shortlist",
      candidate.skills[0] || "Worker spotlight",
      candidate.location || "Ready to hire",
    ],
    likes: Math.max(72, fitScore * 2),
    comments: Math.max(8, candidate.skills.length + candidate.education.length + 2),
    liked: fitScore >= 90,
    attachments: showcase.attachments,
    mediaLayout: showcase.layout,
  };
}

function buildRecruiterTalentComments(candidate: RecruiterCandidate): FeedComment[] {
  const primarySkill = candidate.skills[0] || "execution";
  const location = candidate.location || "Flexible";

  return [
    {
      id: `recruiter-comment-${candidate.id}-1`,
      authorName: "Hiring ops",
      text: `Strong ${primarySkill.toLowerCase()} signal. Keeping this profile warm for upcoming roles.`,
      time: "2h",
    },
    {
      id: `recruiter-comment-${candidate.id}-2`,
      authorName: "Talent partner",
      text: `Location fit looks good for ${location}. Worth a deeper review.`,
      time: "52m",
    },
  ];
}

function resolveAttachmentSource(attachment: FeedAttachment): ImageSourcePropType | null {
  if (attachment.previewSource) {
    return attachment.previewSource;
  }

  if (attachment.uri) {
    return { uri: attachment.uri };
  }

  return null;
}

function resolveVideoSource(attachment?: FeedAttachment | null): VideoSource {
  if (!attachment || attachment.kind !== "video" || !attachment.uri) {
    return null;
  }

  return {
    uri: attachment.uri,
    metadata: {
      title: attachment.fileName,
    },
    useCaching: true,
  };
}

function isReleasedVideoPlayerError(error: unknown) {
  return (
    error instanceof Error &&
    /already released|cannot be cast to type class expo\.modules\.video\.player\.videoplayer/i.test(
      error.message,
    )
  );
}

function safelyControlVideoPlayer(
  player: ReturnType<typeof useVideoPlayer>,
  action: (player: ReturnType<typeof useVideoPlayer>) => void,
) {
  try {
    action(player);
    return true;
  } catch (error) {
    if (isReleasedVideoPlayerError(error)) {
      return false;
    }

    throw error;
  }
}

async function safelyReplaceVideoPlayerSource(
  player: ReturnType<typeof useVideoPlayer>,
  source: VideoSource,
) {
  try {
    await player.replaceAsync(source);
    return true;
  } catch (error) {
    if (isReleasedVideoPlayerError(error)) {
      return false;
    }

    throw error;
  }
}

function extractUriFromImageSource(source: ImageSourcePropType | undefined) {
  if (!source || Array.isArray(source) || typeof source === "number") {
    return undefined;
  }

  return typeof source.uri === "string" ? source.uri : undefined;
}

function formatSyncedPostTime(timestamp: string) {
  const createdAt = new Date(timestamp).getTime();

  if (!Number.isFinite(createdAt)) {
    return "Just now";
  }

  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function mapMobilePostToSyncedPost(item: Extract<FeedItem, { kind: "post" }>): SyncedFeedPost {
  return {
    id: item.id,
    channel: item.channel,
    body: item.body,
    tags: item.tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    edited: Boolean(item.edited),
    authorName: item.author.name,
    authorTitle: item.author.title,
    authorLocation: item.author.location,
    authorAvatarUri: extractUriFromImageSource(item.author.avatar),
    media: (item.attachments ?? [])
      .filter((attachment) => Boolean(attachment.uri))
      .map((attachment) => ({
        kind: attachment.kind,
        uri: attachment.uri!,
        alt: attachment.kind === "video" ? "Video post" : "Feed image",
        fileName: attachment.fileName,
      })),
  };
}

function mapSyncedPostToMobileItem(post: SyncedFeedPost): Extract<FeedItem, { kind: "post" }> {
  const attachments = post.media.map((media, index) => ({
    id: `${post.id}-media-${index}`,
    kind: media.kind,
    fileName: media.fileName ?? `${media.kind}-${index + 1}`,
    uri: media.uri,
    previewSource: media.uri ? ({ uri: media.uri } as ImageSourcePropType) : undefined,
  }));

  return {
    kind: "post",
    id: post.id,
    channel: post.channel,
    author: {
      id: me.id,
      name: post.authorName,
      title: post.authorTitle,
      company: "BEJELI",
      location: post.authorLocation,
      avatar: post.authorAvatarUri ? { uri: post.authorAvatarUri } : me.avatar,
    },
    time: formatSyncedPostTime(post.updatedAt || post.createdAt),
    body: post.body,
    tags: post.tags,
    likes: 0,
    comments: 0,
    attachments: attachments.length ? attachments : undefined,
    mediaLayout:
      attachments.filter((attachment) => attachment.kind === "image").length > 1
        ? "collage"
        : "scroll",
    edited: post.edited,
  };
}

async function fetchSyncedFeedPosts(token: string) {
  const response = await fetch(`${apiUrl}/feed/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load synced posts.");
  }

  const payload = (await response.json()) as { posts?: SyncedFeedPost[] };
  return payload.posts ?? [];
}

async function upsertSyncedFeedPost(token: string, post: SyncedFeedPost) {
  await fetch(`${apiUrl}/feed/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post }),
  });
}

async function deleteSyncedFeedPost(token: string, postId: string) {
  await fetch(`${apiUrl}/feed/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function openAttachmentInSystemViewer(uri?: string) {
  if (!uri) {
    return false;
  }

  const candidateUris = [uri];

  if (Platform.OS === "android" && uri.startsWith("file://")) {
    try {
      const fileSystem = require("./node_modules/expo/node_modules/expo-file-system/build/legacy/FileSystem") as {
        getContentUriAsync?: (fileUri: string) => Promise<string>;
      };

      if (fileSystem.getContentUriAsync) {
        const contentUri = await fileSystem.getContentUriAsync(uri);

        if (contentUri && contentUri !== uri) {
          candidateUris.unshift(contentUri);
        }
      }
    } catch {
      // Fall back to the original URI if the nested Expo file-system helper is unavailable.
    }
  }

  for (const candidateUri of candidateUris) {
    try {
      await Linking.openURL(candidateUri);
      return true;
    } catch {
      // Try the next URI candidate.
    }
  }

  return false;
}

function resolveProfileAvatarSource(avatarUri?: string): ImageSourcePropType {
  return avatarUri ? { uri: avatarUri } : me.avatar;
}

function deriveProfileTitle(headline: string) {
  return headline
    .split("·")[0]
    ?.trim()
    .replace(/\s+/g, " ") || me.title;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BussInAuthProvider>
        <BussInApp />
      </BussInAuthProvider>
    </SafeAreaProvider>
  );
}

function BussInApp() {
  const { hydrated, token, user } = useBussInAuth();
  const [route, setRoute] = useState<AppRoute>("feed");
  const [lastMainRoute, setLastMainRoute] = useState<MainRoute>("feed");
  const [authAudience, setAuthAudience] = useState<AuthAudience>("professional");
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<Person | null>(null);
  const [workerMode, setWorkerMode] = useState<WorkerMode>("professional");
  const [availabilityMatrix, setAvailabilityMatrix] = useState<AvailabilityMatrix>(
    buildDefaultAvailabilityMatrix(),
  );
  const [bookedDispatchIds, setBookedDispatchIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [feedPlaybackState, setFeedPlaybackState] = useState({
    paused: false,
    hasVideo: true,
  });
  const [recruiterFeedPlaybackState, setRecruiterFeedPlaybackState] = useState({
    paused: false,
    hasVideo: true,
  });
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const [didRunFeedNavIntro, setDidRunFeedNavIntro] = useState(false);
  const [didRunRecruiterFeedNavIntro, setDidRunRecruiterFeedNavIntro] = useState(false);
  const loadingScale = useLoopingScale();
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );
  const isRecruiterUser = isRecruiterUserRole(user?.role);
  const canSwipeBetweenMainRoutes =
    !isRecruiterUser && swipeableMainRoutes.includes(route as SwipeableMainRoute);
  const immersiveFeedShell = !isRecruiterUser && route === "feed";

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          canSwipeBetweenMainRoutes &&
          Math.abs(gestureState.dx) > 26 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3,
        onPanResponderRelease: (_, gestureState) => {
          if (!canSwipeBetweenMainRoutes || Math.abs(gestureState.dx) < 54) {
            return;
          }

          const currentIndex = swipeableMainRoutes.indexOf(route as SwipeableMainRoute);

          if (currentIndex === -1) {
            return;
          }

          const nextIndex =
            gestureState.dx > 0
              ? Math.min(currentIndex + 1, swipeableMainRoutes.length - 1)
              : Math.max(currentIndex - 1, 0);

          setRoute(swipeableMainRoutes[nextIndex]);
        },
      }),
    [canSwipeBetweenMainRoutes, route],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user && !isAuthRoute(route)) {
      setRoute("login");
      return;
    }

    if (user && isAuthRoute(route)) {
      setRoute(recruiterHomeRouteForRole(user.role));
      return;
    }

    if (user && isRecruiterUser && isProfessionalOnlyRoute(route)) {
      setRoute("recruiter-feed");
      return;
    }

    if (user && !isRecruiterUser && isRecruiterRoute(route)) {
      setRoute("feed");
    }
  }, [hydrated, isRecruiterUser, route, user]);

  useEffect(() => {
    if (isMainRoute(route)) {
      setLastMainRoute(route);
    }
  }, [route]);

  useEffect(() => {
    let active = true;

    async function hydrateWorkbenchState() {
      const [
        storedWorkerMode,
        storedAvailability,
        storedBookedDispatches,
        storedAuthAudience,
      ] = await Promise.all([
        AsyncStorage.getItem(mobileWorkerModeStorageKey),
        AsyncStorage.getItem(mobileAvailabilityStorageKey),
        AsyncStorage.getItem(mobileBookedDispatchesStorageKey),
        AsyncStorage.getItem(mobileAuthAudienceStorageKey),
      ]);

      if (!active) {
        return;
      }

      if (storedWorkerMode === "professional" || storedWorkerMode === "gig") {
        setWorkerMode(storedWorkerMode);
      }

      if (storedAuthAudience === "professional" || storedAuthAudience === "company") {
        setAuthAudience(storedAuthAudience);
      }

      if (storedAvailability) {
        try {
          setAvailabilityMatrix({
            ...buildDefaultAvailabilityMatrix(),
            ...(JSON.parse(storedAvailability) as AvailabilityMatrix),
          });
        } catch {
          setAvailabilityMatrix(buildDefaultAvailabilityMatrix());
        }
      }

      if (storedBookedDispatches) {
        try {
          setBookedDispatchIds(JSON.parse(storedBookedDispatches) as string[]);
        } catch {
          setBookedDispatchIds([]);
        }
      }
    }

    void hydrateWorkbenchState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(mobileWorkerModeStorageKey, workerMode);
  }, [workerMode]);

  useEffect(() => {
    void AsyncStorage.setItem(mobileAuthAudienceStorageKey, authAudience);
  }, [authAudience]);

  useEffect(() => {
    void AsyncStorage.setItem(mobileAvailabilityStorageKey, JSON.stringify(availabilityMatrix));
  }, [availabilityMatrix]);

  useEffect(() => {
    void AsyncStorage.setItem(
      mobileBookedDispatchesStorageKey,
      JSON.stringify(bookedDispatchIds),
    );
  }, [bookedDispatchIds]);

  useEffect(() => {
    if (!user) {
      setBottomNavVisible(false);
      return;
    }

    if (isRecruiterUser) {
      if (!isRecruiterMainRoute(route)) {
        setBottomNavVisible(false);
        return;
      }

      if (route !== "recruiter-feed") {
        setBottomNavVisible(true);
        return;
      }

      if (!didRunRecruiterFeedNavIntro) {
        setBottomNavVisible(true);

        const introTimeout = setTimeout(() => {
          setDidRunRecruiterFeedNavIntro(true);
          setBottomNavVisible(
            recruiterFeedPlaybackState.paused || !recruiterFeedPlaybackState.hasVideo,
          );
        }, 1350);

        return () => clearTimeout(introTimeout);
      }

      setBottomNavVisible(
        recruiterFeedPlaybackState.paused || !recruiterFeedPlaybackState.hasVideo,
      );
      return;
    }

    if (!swipeableMainRoutes.includes(route as SwipeableMainRoute)) {
      setBottomNavVisible(false);
      return;
    }

    if (route !== "feed") {
      setBottomNavVisible(true);
      return;
    }

    if (!didRunFeedNavIntro) {
      setBottomNavVisible(true);

      const introTimeout = setTimeout(() => {
        setDidRunFeedNavIntro(true);
        setBottomNavVisible(feedPlaybackState.paused || !feedPlaybackState.hasVideo);
      }, 1350);

      return () => clearTimeout(introTimeout);
    }

    setBottomNavVisible(feedPlaybackState.paused || !feedPlaybackState.hasVideo);
  }, [
    didRunFeedNavIntro,
    didRunRecruiterFeedNavIntro,
    feedPlaybackState.hasVideo,
    feedPlaybackState.paused,
    isRecruiterUser,
    recruiterFeedPlaybackState.hasVideo,
    recruiterFeedPlaybackState.paused,
    route,
    user,
  ]);

  function openSearch() {
    setRoute("search");
  }

  function openNotifications() {
    setRoute("notifications");
  }

  function closeUtilityScreen() {
    setRoute(lastMainRoute);
  }

  function openCreatorProfile(person: Person) {
    if (person.id === me.id) {
      setRoute("profile");
      return;
    }

    setSelectedCreatorProfile(person);
    setRoute("creator-profile");
  }

  function closeCreatorProfile() {
    setSelectedCreatorProfile(null);
    setRoute(lastMainRoute);
  }

  function openAvailability() {
    setRoute("availability");
  }

  function toggleWorkerMode() {
    setWorkerMode((current) => (current === "professional" ? "gig" : "professional"));
  }

  function toggleAvailabilitySlot(day: string, hour: number) {
    const key = buildAvailabilityKey(day, hour);
    setAvailabilityMatrix((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleDispatchBooking(dispatchId: string) {
    setBookedDispatchIds((current) =>
      current.includes(dispatchId)
        ? current.filter((entry) => entry !== dispatchId)
        : [...current, dispatchId],
    );
  }

  function navigateToMainRoute(nextRoute: MainRoute) {
    setRoute(nextRoute);
  }

  function openNotification(item: NotificationItem) {
    setNotifications((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)),
    );
    setRoute(item.route);
  }

  function toggleNotificationRead(id: string) {
    setNotifications((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, unread: !entry.unread } : entry,
      ),
    );
  }

  function markAllNotificationsRead() {
    setNotifications((current) =>
      current.map((entry) => (entry.unread ? { ...entry, unread: false } : entry)),
    );
  }

  if (!hydrated) {
    return (
      <SafeAreaView
        style={[styles.safeArea, immersiveFeedShell && styles.safeAreaImmersive]}
        edges={["left", "right", "bottom"]}
      >
        <StatusBar style={immersiveFeedShell ? "light" : "dark"} />
        <View style={styles.loadingScreen}>
          <Animated.View style={{ transform: [{ scale: loadingScale }] }}>
            <View style={styles.loadingLogo}>
              <MaterialCommunityIcons name="briefcase-variant-outline" size={22} color="#fff" />
            </View>
          </Animated.View>
          <Animated.Text style={[styles.loadingTitle, { transform: [{ scale: loadingScale }] }]}>
            BEJELI
          </Animated.Text>
          <ActivityIndicator color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.safeArea, immersiveFeedShell && styles.safeAreaImmersive]}
        edges={["left", "right", "bottom"]}
      >
        <StatusBar style={immersiveFeedShell ? "light" : "dark"} />
        <ScreenTransition screenKey={route} style={styles.flexOne}>
          {route === "signup" ? (
            <SignupScreen
              audience={authAudience}
              onSetAudience={setAuthAudience}
              onSwitch={() => setRoute("login")}
            />
          ) : (
            <LoginScreen
              audience={authAudience}
              onSetAudience={setAuthAudience}
              onSwitch={() => setRoute("signup")}
              onSignedIn={() => undefined}
            />
          )}
        </ScreenTransition>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, immersiveFeedShell && styles.safeAreaImmersive]}
      edges={["left", "right", "bottom"]}
    >
      <StatusBar style={immersiveFeedShell ? "light" : "dark"} />
      <View style={[styles.appShell, immersiveFeedShell && styles.appShellImmersive]}>
        {isRecruiterUser ? (
          <RecruiterTopBar
            route={route}
            onOpenCompanies={() => setRoute("recruiter-companies")}
            onOpenNotifications={openNotifications}
            unreadNotifications={unreadNotifications}
          />
        ) : (
          <TopBar
            onOpenResume={() => setRoute("resume")}
            onOpenAvailability={openAvailability}
            onOpenSearch={openSearch}
            onOpenNotifications={openNotifications}
            unreadNotifications={unreadNotifications}
            workerMode={workerMode}
            onToggleWorkerMode={toggleWorkerMode}
          />
        )}
        <View
          style={[styles.screenArea, immersiveFeedShell && styles.screenAreaImmersive]}
          {...(canSwipeBetweenMainRoutes ? swipeResponder.panHandlers : {})}
        >
          <ScreenTransition screenKey={route} style={styles.flexOne}>
            {!isRecruiterUser && route === "feed" ? (
              <FeedScreen
                onOpenResume={() => setRoute("resume")}
                onOpenJobs={() => setRoute("jobs")}
                onOpenAvailability={openAvailability}
                onOpenCreatorProfile={openCreatorProfile}
                onPlaybackStateChange={setFeedPlaybackState}
                workerMode={workerMode}
              />
            ) : null}
            {!isRecruiterUser && route === "jobs" ? (
              <JobsScreen
                workerMode={workerMode}
                availabilityMatrix={availabilityMatrix}
                bookedDispatchIds={bookedDispatchIds}
                onOpenAvailability={openAvailability}
                onToggleDispatchBooking={toggleDispatchBooking}
              />
            ) : null}
            {!isRecruiterUser && route === "network" ? <NetworkScreen /> : null}
            {!isRecruiterUser && route === "search" ? (
              <SearchScreen
                onBack={closeUtilityScreen}
                onNavigate={setRoute}
                workerMode={workerMode}
              />
            ) : null}
            {!isRecruiterUser && route === "availability" ? (
              <AvailabilityScreen
                availabilityMatrix={availabilityMatrix}
                bookedDispatchIds={bookedDispatchIds}
                workerMode={workerMode}
                onBack={closeUtilityScreen}
                onToggleSlot={toggleAvailabilitySlot}
                onToggleDispatchBooking={toggleDispatchBooking}
              />
            ) : null}
            {isRecruiterUser && route === "recruiter-dashboard" ? (
              <RecruiterDashboardScreen
                token={token ?? undefined}
                onOpenFeed={() => setRoute("recruiter-feed")}
                onOpenCompanies={() => setRoute("recruiter-companies")}
                onOpenShortlists={() => setRoute("recruiter-shortlists")}
              />
            ) : null}
            {isRecruiterUser && route === "recruiter-feed" ? (
              <RecruiterTalentFeedScreen
                token={token ?? undefined}
                onOpenCreatorProfile={openCreatorProfile}
                onOpenCandidates={() => setRoute("recruiter-candidates")}
                onOpenShortlists={() => setRoute("recruiter-shortlists")}
                onPlaybackStateChange={setRecruiterFeedPlaybackState}
              />
            ) : null}
            {isRecruiterUser && route === "recruiter-candidates" ? (
              <RecruiterCandidatesScreen
                token={token ?? undefined}
                onOpenShortlists={() => setRoute("recruiter-shortlists")}
              />
            ) : null}
            {isRecruiterUser && route === "recruiter-companies" ? (
              <RecruiterCompaniesScreen
                token={token ?? undefined}
              />
            ) : null}
            {isRecruiterUser && route === "recruiter-shortlists" ? (
              <RecruiterShortlistsScreen
                token={token ?? undefined}
                onOpenCandidates={() => setRoute("recruiter-candidates")}
              />
            ) : null}
            {route === "notifications" ? (
              <NotificationsScreen
                notifications={notifications}
                unreadNotifications={unreadNotifications}
                onBack={closeUtilityScreen}
                onOpenNotification={openNotification}
                onToggleRead={toggleNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
              />
            ) : null}
            {route === "creator-profile" && selectedCreatorProfile ? (
              <CreatorProfileScreen person={selectedCreatorProfile} onBack={closeCreatorProfile} />
            ) : null}
            {route === "profile" ? (
              <ProfileScreen
                onOpenResume={() => setRoute("resume")}
                onOpenAvailability={openAvailability}
                onSignedOut={() => setRoute("login")}
                workerMode={workerMode}
                onSetWorkerMode={setWorkerMode}
                availabilityMatrix={availabilityMatrix}
              />
            ) : null}
            {!isRecruiterUser && route === "resume" ? (
              <ResumeScreen onDone={() => setRoute("profile")} />
            ) : null}
          </ScreenTransition>
        </View>
        {isRecruiterUser ? (
          <RecruiterBottomNav
            route={route}
            onNavigate={setRoute}
            visible={bottomNavVisible}
          />
        ) : (
          <BottomNav
            route={route}
            onNavigate={setRoute}
            visible={bottomNavVisible}
            immersive={immersiveFeedShell}
            workerMode={workerMode}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function isAuthRoute(route: AppRoute) {
  return route === "login" || route === "signup";
}

function isRecruiterRoute(route: AppRoute) {
  return (
    route === "recruiter-dashboard" ||
    route === "recruiter-feed" ||
    route === "recruiter-candidates" ||
    route === "recruiter-companies" ||
    route === "recruiter-shortlists"
  );
}

function isRecruiterMainRoute(route: AppRoute) {
  return isRecruiterRoute(route) || route === "profile";
}

function isProfessionalOnlyRoute(route: AppRoute) {
  return (
    route === "feed" ||
    route === "jobs" ||
    route === "network" ||
    route === "availability" ||
    route === "resume" ||
    route === "search"
  );
}

function isMainRoute(route: AppRoute): route is MainRoute {
  return (
    route === "feed" ||
    route === "jobs" ||
    route === "network" ||
    route === "recruiter-dashboard" ||
    route === "recruiter-feed" ||
    route === "recruiter-candidates" ||
    route === "recruiter-companies" ||
    route === "recruiter-shortlists" ||
    route === "profile" ||
    route === "resume"
  );
}

function useLoopingScale(from = 1, to = 1.06, duration = 1500) {
  const scale = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: to,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: from,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [duration, from, scale, to]);

  return scale;
}

function ScreenTransition({
  children,
  screenKey,
  style,
}: {
  children: ReactNode;
  screenKey: string;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.99)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(18);
    scale.setValue(0.99);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, screenKey, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function AnimatedEntrance({
  children,
  index = 0,
  enterKey = "default",
  style,
}: {
  children: ReactNode;
  index?: number;
  enterKey?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    const delay = index * 55;

    opacity.setValue(0);
    translateY.setValue(16);
    scale.setValue(0.985);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterKey, index, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function TopBar({
  onOpenResume,
  onOpenAvailability,
  onOpenSearch,
  onOpenNotifications,
  unreadNotifications,
  workerMode,
  onToggleWorkerMode,
}: {
  onOpenResume: () => void;
  onOpenAvailability: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotifications: number;
  workerMode: WorkerMode;
  onToggleWorkerMode: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="briefcase-variant-outline" size={18} color="#fff" />
        </View>
        <View>
          <Text style={styles.brandText}>BEJELI</Text>
          <Pressable
            style={({ pressed }) => [
              styles.modeSwitchPill,
              workerMode === "gig" && styles.modeSwitchPillGig,
              pressed && styles.pressablePressedSoft,
            ]}
            onPress={onToggleWorkerMode}
          >
            <Text style={styles.modeSwitchLabel}>
              {workerMode === "professional" ? "Professional mode" : "Gig mode"}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.topBarActions}>
        <Pressable
          style={({ pressed }) => [
            styles.topTextAction,
            styles.resumeAction,
            pressed && styles.pressablePressedSoft,
          ]}
          onPress={workerMode === "gig" ? onOpenAvailability : onOpenResume}
        >
          <Feather
            name={workerMode === "gig" ? "calendar" : "file-text"}
            size={16}
            color={colors.brandDark}
          />
          <Text style={styles.topTextActionLabel}>
            {workerMode === "gig" ? "Availability" : "Resume"}
          </Text>
        </Pressable>
        <IconBubble onPress={onOpenSearch} accessibilityLabel="Open search">
          <Feather name="search" size={18} color={colors.inkMuted} />
        </IconBubble>
        <IconBubble
          onPress={onOpenNotifications}
          accessibilityLabel={
            unreadNotifications > 0
              ? `Open notifications, ${unreadNotifications} unread`
              : "Open notifications"
          }
          showDot={unreadNotifications > 0}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.inkMuted} />
        </IconBubble>
      </View>
    </View>
  );
}

function BottomNavItem({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.97)).current;
  const lift = useRef(new Animated.Value(active ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.04 : 1,
        friction: 7,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: active ? -2 : 0,
        friction: 7,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, lift, scale]);

  return (
    <Pressable
      style={({ pressed }) => [styles.bottomNavItem, pressed && styles.pressablePressedNav]}
      onPress={onPress}
    >
      <Animated.View
        style={{
          alignItems: "center",
          gap: 4,
          transform: [{ translateY: lift }, { scale }],
        }}
      >
        <Ionicons
          name={active ? (icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : icon}
          size={20}
          color={active ? colors.brand : colors.inkMuted}
        />
        <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{label}</Text>
      </Animated.View>
      {active ? <View style={styles.bottomNavGlow} /> : null}
    </Pressable>
  );
}

function BottomNav({
  route,
  onNavigate,
  visible,
  immersive,
  workerMode,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  visible: boolean;
  immersive: boolean;
  workerMode: WorkerMode;
}) {
  const translateY = useRef(new Animated.Value(86)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const items: Array<{ route: AppRoute; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { route: "feed", label: "Feed", icon: "home-outline" },
    {
      route: "jobs",
      label: workerMode === "gig" ? "Dispatch" : "Matches",
      icon: workerMode === "gig" ? "flash-outline" : "sparkles-outline",
    },
    { route: "network", label: "Network", icon: "people-outline" },
    { route: "profile", label: "Profile", icon: "person-outline" },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : 92,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.96,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.bottomNav,
        immersive && styles.bottomNavImmersive,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {items.map((item) => {
        const active = route === item.route;

        return (
          <BottomNavItem
            key={item.route}
            active={active}
            icon={item.icon}
            label={item.label}
            onPress={() => onNavigate(item.route)}
          />
        );
      })}
    </Animated.View>
  );
}

function AuthAudienceSwitch({
  audience,
  onChange,
}: {
  audience: AuthAudience;
  onChange: (audience: AuthAudience) => void;
}) {
  return (
    <View style={styles.authAudienceSwitch}>
      {([
        ["professional", "Talent"],
        ["company", "Company"],
      ] as const).map(([value, label]) => {
        const active = audience === value;

        return (
          <Pressable
            key={value}
            style={({ pressed }) => [
              styles.authAudienceChip,
              active && styles.authAudienceChipActive,
              pressed && styles.pressablePressedSoft,
            ]}
            onPress={() => onChange(value)}
          >
            <Text
              style={[
                styles.authAudienceChipText,
                active && styles.authAudienceChipTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RecruiterTopBar({
  route,
  onOpenCompanies,
  onOpenNotifications,
  unreadNotifications,
}: {
  route: AppRoute;
  onOpenCompanies: () => void;
  onOpenNotifications: () => void;
  unreadNotifications: number;
}) {
  const routeLabel =
    route === "recruiter-feed"
      ? "Talent feed"
      : route === "recruiter-candidates"
      ? "Candidate search"
      : route === "recruiter-companies"
        ? "Company workflows"
        : route === "recruiter-shortlists"
          ? "Shortlists"
          : route === "profile"
            ? "Account"
            : "Recruiter command center";

  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="office-building-outline" size={18} color="#fff" />
        </View>
        <View>
          <Text style={styles.brandText}>BEJELI</Text>
          <Text style={styles.recruiterTopBarLabel}>{routeLabel}</Text>
        </View>
      </View>
      <View style={styles.topBarActions}>
        <Pressable
          style={({ pressed }) => [
            styles.topTextAction,
            styles.resumeAction,
            pressed && styles.pressablePressedSoft,
          ]}
          onPress={onOpenCompanies}
        >
          <Feather name="briefcase" size={16} color={colors.brandDark} />
          <Text style={styles.topTextActionLabel}>Companies</Text>
        </Pressable>
        <IconBubble
          onPress={onOpenNotifications}
          accessibilityLabel={
            unreadNotifications > 0
              ? `Open notifications, ${unreadNotifications} unread`
              : "Open notifications"
          }
          showDot={unreadNotifications > 0}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.inkMuted} />
        </IconBubble>
      </View>
    </View>
  );
}

function RecruiterBottomNav({
  route,
  onNavigate,
  visible,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  visible: boolean;
}) {
  const translateY = useRef(new Animated.Value(86)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const items: Array<{ route: AppRoute; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { route: "recruiter-feed", label: "Feed", icon: "play-circle-outline" },
    { route: "recruiter-dashboard", label: "Home", icon: "grid-outline" },
    { route: "recruiter-companies", label: "Companies", icon: "business-outline" },
    { route: "recruiter-shortlists", label: "Shortlists", icon: "bookmark-outline" },
    { route: "profile", label: "Account", icon: "person-outline" },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : 92,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.96,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY, visible]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.bottomNav,
        styles.recruiterBottomNav,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {items.map((item) => (
        <BottomNavItem
          key={item.route}
          active={route === item.route}
          icon={item.icon}
          label={item.label}
          onPress={() => onNavigate(item.route)}
        />
      ))}
    </Animated.View>
  );
}

function LoginScreen({
  audience,
  onSetAudience,
  onSwitch,
  onSignedIn,
}: {
  audience: AuthAudience;
  onSetAudience: (audience: AuthAudience) => void;
  onSwitch: () => void;
  onSignedIn: () => void;
}) {
  const { signIn } = useBussInAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(google = false) {
    if (!email.trim() || !password.trim()) {
      setError("Enter both your email and password to continue.");
      return;
    }

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    if (google) {
      setError("Google sign-in is not connected yet.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as {
        token?: string;
        user?: {
          id: number;
          fullName: string;
          email: string;
          role: "professional" | "recruiter" | "admin";
        };
        message?: string;
      };

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.message ?? "Unable to sign in.");
      }

      if (audience === "company" && !isRecruiterUserRole(payload.user.role)) {
        throw new Error(
          "This account is registered as talent. Switch to Talent or sign in with a recruiter account.",
        );
      }

      onSetAudience(isRecruiterUserRole(payload.user.role) ? "company" : "professional");
      await signIn({
        token: payload.token,
        user: payload.user,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to sign in.",
      );
      return;
    }

    onSignedIn();
  }

  return (
    <AuthLayout>
      <View style={styles.loginContent}>
        <AnimatedEntrance enterKey="login-head" index={0}>
          <View style={styles.loginHeaderBlock}>
            <Text style={styles.eyebrow}>
              {audience === "company" ? "Company access" : "Welcome back"}
            </Text>
            <Text style={styles.authTitle}>Sign in to BEJELI</Text>
            <Text style={styles.authSubtitle}>
              {audience === "company"
                ? "Access recruiter workflows, company pages, candidate search, and hiring queues."
                : "Pick up where you left off with your network and tailored role matches."}
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance enterKey="login-audience" index={1}>
          <AuthAudienceSwitch audience={audience} onChange={onSetAudience} />
        </AnimatedEntrance>

        {error ? (
          <AnimatedEntrance enterKey={`login-error-${error}`} index={2}>
            <View style={[styles.messageCard, styles.errorCard]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </AnimatedEntrance>
        ) : null}

        <View style={styles.loginFormBlock}>
          <AnimatedEntrance enterKey="login-email" index={3}>
            <LabeledInput
              label="Email address"
              icon={<Feather name="mail" size={18} color={colors.inkMuted} />}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="login-password" index={4}>
            <LabeledInput
              label="Password"
              icon={<Feather name="lock" size={18} color={colors.inkMuted} />}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
              rightAction={
                <Pressable
                  style={({ pressed }) => [styles.inputAction, pressed && styles.pressablePressedSoft]}
                  onPress={() => setShowPassword((value) => !value)}
                >
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.inkMuted} />
                </Pressable>
              }
            />
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance enterKey="login-actions" index={5}>
          <View style={styles.loginInlineActionRow}>
            <Pressable onPress={() => setError("Password reset is unavailable in this prototype.")}>
              <Text style={styles.linkInline}>Forgot password?</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>

        <View style={styles.loginPrimaryActions}>
          <AnimatedEntrance enterKey="login-button" index={6}>
            <Button
              label={audience === "company" ? "Enter recruiter suite" : "Sign in"}
              onPress={() => void handleSignIn()}
              fullWidth
            />
          </AnimatedEntrance>
          <AnimatedEntrance enterKey="login-divider" index={7}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
          </AnimatedEntrance>
          <AnimatedEntrance enterKey="login-google" index={8}>
            <Button
              label="Continue with Google"
              onPress={() => void handleSignIn(true)}
              fullWidth
              variant="outline"
            />
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance enterKey="login-switch" index={9}>
          <View style={styles.loginFooterBlock}>
            <View style={styles.footerLine}>
              <Text style={styles.footerText}>
                {audience === "company" ? "New company to BEJELI?" : "New to BEJELI?"}
              </Text>
              <Pressable onPress={onSwitch}>
                <Text style={styles.footerLink}>
                  {audience === "company" ? "Create a recruiter account" : "Create an account"}
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedEntrance>
      </View>
    </AuthLayout>
  );
}

function SignupScreen({
  audience,
  onSetAudience,
  onSwitch,
}: {
  audience: AuthAudience;
  onSetAudience: (audience: AuthAudience) => void;
  onSwitch: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim() || !emailPattern.test(email) || password.length < 8) {
      setError("Add your name, a valid email, and a password with at least 8 characters.");
      return;
    }

    if (!agreed) {
      setError("Please accept the Terms and Privacy Notice to continue.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          password,
          role: audience === "company" ? "recruiter" : "professional",
        }),
      });
      const payload = (await response.json()) as {
        token?: string;
        user?: {
          id: number;
          fullName: string;
          email: string;
          role: "professional" | "recruiter" | "admin";
        };
        message?: string;
      };

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.message ?? "Unable to create account.");
      }

      onSwitch();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create account.",
      );
      return;
    }
  }

  return (
    <AuthLayout>
      <View style={styles.signupContent}>
        <AnimatedEntrance enterKey="signup-head" index={0}>
          <View style={styles.signupHeaderBlock}>
            <Text style={styles.eyebrow}>
              {audience === "company" ? "Launch your hiring lane" : "Build your professional signal"}
            </Text>
            <Text style={styles.authTitle}>Create your account</Text>
            <Text style={styles.authSubtitle}>
              {audience === "company"
                ? "Create a recruiter account for candidate search, shortlists, and company workflows."
                : "Join a network built for meaningful connections and credible opportunities."}
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance enterKey="signup-audience" index={1}>
          <AuthAudienceSwitch audience={audience} onChange={onSetAudience} />
        </AnimatedEntrance>

        <AnimatedEntrance enterKey="signup-bullets" index={2}>
          <View style={styles.bulletCard}>
            {audience === "company" ? (
              <>
                <Bullet text="Company pages and verification queue" />
                <Bullet text="Candidate search and shortlist tooling" />
              </>
            ) : (
              <>
                <Bullet text="No recruiter spam" />
                <Bullet text="AI-powered profile matching" />
              </>
            )}
          </View>
        </AnimatedEntrance>

        {error ? (
          <AnimatedEntrance enterKey={`signup-error-${error}`} index={3}>
            <View style={[styles.messageCard, styles.errorCard]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </AnimatedEntrance>
        ) : null}

        <View style={styles.signupFormBlock}>
          <AnimatedEntrance enterKey="signup-name" index={4}>
            <LabeledInput
              label={audience === "company" ? "Hiring lead name" : "Full name"}
              icon={<Feather name="user" size={18} color={colors.inkMuted} />}
              value={name}
              onChangeText={setName}
              placeholder={audience === "company" ? "Recruiter or hiring lead" : "Your name"}
            />
          </AnimatedEntrance>
          <AnimatedEntrance enterKey="signup-email" index={5}>
            <LabeledInput
              label="Email address"
              icon={<Feather name="mail" size={18} color={colors.inkMuted} />}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
          </AnimatedEntrance>
          <AnimatedEntrance enterKey="signup-password" index={6}>
            <LabeledInput
              label="Create password"
              icon={<Feather name="lock" size={18} color={colors.inkMuted} />}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="At least 8 characters"
              rightAction={
                <Pressable
                  style={({ pressed }) => [styles.inputAction, pressed && styles.pressablePressedSoft]}
                  onPress={() => setShowPassword((value) => !value)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.inkMuted}
                  />
                </Pressable>
              }
            />
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance enterKey="signup-agree" index={7}>
          <View style={styles.signupConsentBlock}>
            <Pressable
              style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressablePressedSoft]}
              onPress={() => setAgreed((value) => !value)}
              hitSlop={10}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              accessibilityLabel="Agree to the Terms and Privacy Notice"
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed ? <Feather name="check" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.checkboxText}>I agree to the Terms and Privacy Notice.</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>

        <View style={styles.signupPrimaryActions}>
          <AnimatedEntrance enterKey="signup-button" index={8}>
            <Button
              label={audience === "company" ? "Create recruiter account" : "Create account"}
              onPress={() => void handleCreate()}
              fullWidth
            />
          </AnimatedEntrance>
        </View>

        <AnimatedEntrance enterKey="signup-switch" index={9}>
          <View style={styles.signupFooterBlock}>
            <View style={styles.footerLine}>
              <Text style={styles.footerText}>
                {audience === "company"
                  ? "Already have a recruiter account?"
                  : "Already have an account?"}
              </Text>
              <Pressable onPress={onSwitch}>
                <Text style={styles.footerLink}>
                  {audience === "company" ? "Sign in to company tools" : "Sign in"}
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedEntrance>
      </View>
    </AuthLayout>
  );
}

function RecruiterDashboardScreen({
  token,
  onOpenFeed,
  onOpenCompanies,
  onOpenShortlists,
}: {
  token?: string;
  onOpenFeed: () => void;
  onOpenCompanies: () => void;
  onOpenShortlists: () => void;
}) {
  const [dashboard, setDashboard] = useState<RecruiterDashboardPayload | null>(null);
  const [companies, setCompanies] = useState<RecruiterCompany[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function loadDashboard() {
      setError("");

      try {
        const [dashboardResponse, companiesResponse] = await Promise.all([
          fetch(`${apiUrl}/recruiter/dashboard`, {
            headers: buildApiHeaders(token),
          }),
          fetch(`${apiUrl}/recruiter/companies`, {
            headers: buildApiHeaders(token),
          }),
        ]);
        const dashboardPayload = await readMobileJson<
          RecruiterDashboardPayload & { error?: string; message?: string }
        >(dashboardResponse);
        const companiesPayload = await readMobileJson<{
          companies?: RecruiterCompany[];
          error?: string;
          message?: string;
        }>(companiesResponse);

        if (!dashboardResponse.ok || !companiesResponse.ok) {
          throw new Error(
            dashboardPayload.message ||
              dashboardPayload.error ||
              companiesPayload.message ||
              companiesPayload.error ||
              "Unable to load recruiter dashboard.",
          );
        }

        if (!active) {
          return;
        }

        setDashboard(dashboardPayload);
        setCompanies(companiesPayload.companies ?? []);
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load recruiter dashboard.",
        );
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  const stats = dashboard?.stats ?? {
    companies: 0,
    jobs: 0,
    shortlists: 0,
    candidates: 0,
  };

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="recruiter-dashboard-hero" index={0}>
        <Card style={styles.recruiterHeroCard}>
          <Text style={styles.eyebrow}>Recruiter Command Center</Text>
          <Text style={styles.sectionCardTitle}>
            Run hiring, validation, and company workflows from mobile
          </Text>
          <Text style={styles.bodyTextSmall}>
            Track company momentum, open talent search, manage shortlist pipelines, and keep the
            posting queue moving without leaving the mobile app.
          </Text>
          <View style={styles.gridButtonsTight}>
            <Button label="Talent feed" size="sm" onPress={onOpenFeed} />
            <Button
              label="Company workflows"
              size="sm"
              variant="outline"
              onPress={onOpenCompanies}
            />
          </View>
        </Card>
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance enterKey={`recruiter-dashboard-error-${error}`} index={1}>
          <View style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance enterKey="recruiter-dashboard-stats" index={2}>
        <View style={styles.statGrid}>
          {[
            { label: "Companies", value: `${stats.companies}` },
            { label: "Live + queued jobs", value: `${stats.jobs}` },
            { label: "Shortlists", value: `${stats.shortlists}` },
            { label: "Candidate pool", value: `${stats.candidates}` },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </Card>
          ))}
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-dashboard-jobs" index={3}>
        <Card>
          <View style={styles.titleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionHeading}>Posting queue</Text>
              <Text style={styles.metaText}>
                Featured roles, queued jobs, and recruiter-owned hiring lanes.
              </Text>
            </View>
            <Button label="Shortlists" size="sm" variant="outline" onPress={onOpenShortlists} />
          </View>
          <View style={styles.stack10}>
            {(dashboard?.recentJobs ?? []).map((job) => (
              <View key={job.id} style={styles.recruiterPanelCard}>
                <View style={styles.titleRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardAuthor}>{job.title}</Text>
                    <Text style={styles.metaText}>
                      {job.company_name} · {job.location}
                    </Text>
                  </View>
                  <View style={styles.tagRow}>
                    {job.featured ? <Badge tone="amber" label="Featured" /> : null}
                    <Badge
                      tone={isRecruiterPublishedStatus(job.status) ? "emerald" : "slate"}
                      label={job.status}
                    />
                  </View>
                </View>
                <Text style={styles.bodyTextTiny}>{job.salary_range || "Compensation on request"}</Text>
              </View>
            ))}
            {!dashboard?.recentJobs?.length ? (
              <Text style={styles.emptyText}>No recruiter jobs are published yet.</Text>
            ) : null}
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-dashboard-panels" index={4}>
        <View style={styles.stack12}>
          <Card>
            <View style={styles.titleRow}>
              <Text style={styles.sectionHeading}>Shortlist momentum</Text>
              <Button label="Open" size="sm" variant="ghost" onPress={onOpenShortlists} />
            </View>
            <View style={styles.stack10}>
              {(dashboard?.shortlists ?? []).map((shortlist) => (
                <View key={shortlist.id} style={styles.recruiterPanelCard}>
                  <Text style={styles.cardAuthor}>{shortlist.name}</Text>
                  <Text style={styles.metaText}>
                    {shortlist.candidate_count} candidate
                    {shortlist.candidate_count === 1 ? "" : "s"}
                  </Text>
                </View>
              ))}
              {!dashboard?.shortlists?.length ? (
                <Text style={styles.emptyText}>Create your first shortlist from candidate search.</Text>
              ) : null}
            </View>
          </Card>

          <Card>
            <View style={styles.titleRow}>
              <Text style={styles.sectionHeading}>Company validation queue</Text>
              <Button label="Manage" size="sm" variant="ghost" onPress={onOpenCompanies} />
            </View>
            <View style={styles.stack10}>
              {companies.slice(0, 3).map((company) => (
                <View key={company.id} style={styles.recruiterPanelCard}>
                  <View style={styles.titleRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardAuthor}>{company.name}</Text>
                      <Text style={styles.metaText}>
                        {company.industry || "General"} · {company.location || "Location pending"}
                      </Text>
                    </View>
                    <Badge
                      tone={company.verification_status === "verified" ? "emerald" : "amber"}
                      label={company.verification_status}
                    />
                  </View>
                  <Text style={styles.bodyTextTiny}>
                    {company.job_count} live jobs · {company.queued_jobs} queued
                  </Text>
                </View>
              ))}
              {!companies.length ? (
                <Text style={styles.emptyText}>
                  No companies yet. Create one from the company workflows screen.
                </Text>
              ) : null}
            </View>
          </Card>
        </View>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function RecruiterTalentFeedScreen({
  token,
  onOpenCreatorProfile,
  onOpenCandidates,
  onOpenShortlists,
  onPlaybackStateChange,
}: {
  token?: string;
  onOpenCreatorProfile: (person: Person) => void;
  onOpenCandidates: () => void;
  onOpenShortlists: () => void;
  onPlaybackStateChange: (state: { paused: boolean; hasVideo: boolean }) => void;
}) {
  const { user } = useBussInAuth();
  const viewerAvatarSource = resolveProfileAvatarSource();
  const [query] = useState("");
  const [skills] = useState("");
  const [location] = useState("");
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [shortlists, setShortlists] = useState<RecruiterShortlistSummary[]>([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shortsViewportHeight, setShortsViewportHeight] = useState(0);
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [endorsedIds, setEndorsedIds] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [pausedShortIds, setPausedShortIds] = useState<Record<string, boolean>>({});
  const [shortsMutedIds, setShortsMutedIds] = useState<Record<string, boolean>>({});
  const [sharedIds, setSharedIds] = useState<Record<string, boolean>>({});

  async function loadCandidates() {
    if (!token) {
      return;
    }

    setError("");

    try {
      const searchParams = new URLSearchParams();

      if (query.trim()) {
        searchParams.set("query", query.trim());
      }
      if (skills.trim()) {
        searchParams.set("skills", skills.trim());
      }
      if (location.trim()) {
        searchParams.set("location", location.trim());
      }

      const response = await fetch(
        `${apiUrl}/recruiter/candidates?${searchParams.toString()}`,
        {
          headers: buildApiHeaders(token),
        },
      );
      const payload = await readMobileJson<{ candidates?: RecruiterCandidate[]; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load talent feed.");
      }

      setCandidates(payload.candidates ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load talent feed.",
      );
    }
  }

  async function loadShortlists() {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/recruiter/shortlists`, {
        headers: buildApiHeaders(token),
      });
      const payload = await readMobileJson<{ shortlists?: RecruiterShortlistSummary[] }>(response);

      if (!response.ok) {
        throw new Error("Unable to load shortlists.");
      }

      const nextShortlists = payload.shortlists ?? [];
      setShortlists(nextShortlists);
      setSelectedShortlistId((current) =>
        current && nextShortlists.some((shortlist) => shortlist.id === current)
          ? current
          : nextShortlists[0]?.id ?? null,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load shortlists.",
      );
    }
  }

  useEffect(() => {
    void loadCandidates();
    void loadShortlists();
  }, [token]);

  async function addToShortlist(candidateUserId: number) {
    if (!token || !selectedShortlistId) {
      onOpenShortlists();
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiUrl}/recruiter/shortlists/${selectedShortlistId}/items`,
        {
          method: "POST",
          headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
          body: JSON.stringify({ candidateUserId }),
        },
      );
      const payload = await readMobileJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error || "Unable to add candidate to shortlist.");
      }

      const targetShortlist =
        shortlists.find((shortlist) => shortlist.id === selectedShortlistId) ?? null;
      setMessage(
        targetShortlist
          ? `Added to ${targetShortlist.name}.`
          : "Candidate added to shortlist.",
      );
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add candidate to shortlist.",
      );
    }
  }

  const talentEntries = useMemo(
    () =>
      candidates.map((candidate, index) => {
        const person = buildRecruiterCandidatePerson(candidate, index);
        const showcase = buildRecruiterTalentShowcase(candidate, index);
        const fitScore = computeRecruiterTalentFitScore(candidate);

        return {
          candidate,
          person,
          showcase,
          fitScore,
          post: buildRecruiterTalentPost({
            candidate,
            person,
            showcase,
            fitScore,
          }),
        };
      }),
    [candidates],
  );

  const talentPosts = useMemo(() => talentEntries.map((entry) => entry.post), [talentEntries]);
  const seededCommentsByPost = useMemo(
    () =>
      Object.fromEntries(
        talentEntries.map(({ candidate, post }) => [post.id, buildRecruiterTalentComments(candidate)]),
      ),
    [talentEntries],
  );
  const selectedShortlistName =
    shortlists.find((shortlist) => shortlist.id === selectedShortlistId)?.name ?? "";
  const activeTalentPost = talentPosts[activeShortIndex] ?? null;
  const activeTalentHasVideo = Boolean(
    activeTalentPost?.attachments?.some((attachment) => attachment.kind === "video"),
  );
  const activeTalentPaused = activeTalentPost
    ? Boolean(pausedShortIds[activeTalentPost.id])
    : false;

  useEffect(() => {
    if (!talentPosts.length) {
      if (activeShortIndex !== 0) {
        setActiveShortIndex(0);
      }
      return;
    }

    if (activeShortIndex > talentPosts.length - 1) {
      setActiveShortIndex(talentPosts.length - 1);
    }
  }, [activeShortIndex, talentPosts.length]);

  useEffect(() => {
    if (!message && !error) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 2200);

    return () => clearTimeout(timer);
  }, [error, message]);

  useEffect(() => {
    setCommentsByPost((current) => {
      let changed = false;
      const next = { ...current };

      Object.entries(seededCommentsByPost).forEach(([postId, comments]) => {
        if (!next[postId]) {
          next[postId] = comments;
          changed = true;
        }
      });

      return changed ? next : current;
    });

    setCommentCounts((current) => {
      let changed = false;
      const next = { ...current };

      talentPosts.forEach((post) => {
        if (typeof next[post.id] !== "number") {
          next[post.id] = seededCommentsByPost[post.id]?.length ?? post.comments;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [seededCommentsByPost, talentPosts]);

  useEffect(() => {
    onPlaybackStateChange({
      paused: activeTalentPaused,
      hasVideo: activeTalentHasVideo,
    });
  }, [activeTalentHasVideo, activeTalentPaused, onPlaybackStateChange]);

  function toggleShortPlayback(postId: string) {
    setPausedShortIds((current) => ({
      ...current,
      [postId]: !current[postId],
    }));
  }

  function toggleShortMute(postId: string) {
    setShortsMutedIds((current) => ({
      ...current,
      [postId]: !current[postId],
    }));
  }

  function likeShort(post: Extract<FeedItem, { kind: "post" }>) {
    const wasLiked = likedIds[post.id] ?? Boolean(post.liked);
    const nextLiked = !wasLiked;
    const currentCount = likeCounts[post.id] ?? post.likes;

    setLikedIds((current) => ({ ...current, [post.id]: nextLiked }));
    setLikeCounts((current) => ({
      ...current,
      [post.id]: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
    }));

    if (nextLiked) {
      setMessage("Saved to your recruiter radar.");
    }
  }

  function toggleEndorsement(post: Extract<FeedItem, { kind: "post" }>) {
    const nextEndorsed = !(endorsedIds[post.id] ?? false);

    setEndorsedIds((current) => ({ ...current, [post.id]: nextEndorsed }));
    setMessage(
      nextEndorsed
        ? `${post.author.name} added to your endorsement list.`
        : `${post.author.name} removed from your endorsement list.`,
    );
  }

  function promptEndorsement(post: Extract<FeedItem, { kind: "post" }>) {
    const alreadyEndorsed = endorsedIds[post.id] ?? false;

    Alert.alert(
      alreadyEndorsed ? "Remove endorsement?" : "Endorse this creator?",
      alreadyEndorsed
        ? `Do you want to remove your endorsement for ${post.author.name}?`
        : `Do you want to endorse ${post.author.name} for future opportunities?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: alreadyEndorsed ? "Remove" : "Endorse",
          onPress: () => toggleEndorsement(post),
        },
      ],
    );
  }

  function openCommentSheet(postId: string) {
    setCommentSheetPostId(postId);
  }

  function closeCommentSheet() {
    setCommentSheetPostId(null);
  }

  function submitComment(post: Extract<FeedItem, { kind: "post" }>) {
    const text = commentDrafts[post.id]?.trim();

    if (!text) {
      return;
    }

    const nextComment: FeedComment = {
      id: `${post.id}-recruiter-comment-${Date.now()}`,
      authorName: user?.fullName || "Recruiter",
      text,
      time: "Just now",
      isMe: true,
    };

    setCommentsByPost((current) => ({
      ...current,
      [post.id]: [...(current[post.id] ?? []), nextComment],
    }));
    setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    setCommentCounts((current) => ({
      ...current,
      [post.id]: (current[post.id] ?? post.comments) + 1,
    }));
    setMessage("Comment posted to the talent reel.");
  }

  function handleOpenTalentMenu(
    post: Extract<FeedItem, { kind: "post" }>,
    person: Person,
    candidate: RecruiterCandidate,
  ) {
    Alert.alert(person.name, "Choose an action.", [
      {
        text: "View profile",
        onPress: () => onOpenCreatorProfile(person),
      },
      {
        text: "Comments",
        onPress: () => openCommentSheet(post.id),
      },
      {
        text: "Add to shortlist",
        onPress: () => {
          void addToShortlist(candidate.id);
        },
      },
      {
        text: "Share",
        onPress: () => {
          void shareTalent(post);
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  async function shareTalent(post: Extract<FeedItem, { kind: "post" }>) {
    try {
      const result = await Share.share({
        message: `${post.author.name} · ${post.author.title}\n${post.body}`,
        title: `${post.author.name} talent reel`,
      });

      if (result.action === Share.sharedAction) {
        setSharedIds((current) => ({ ...current, [post.id]: true }));
        setMessage("Talent reel shared.");
      }
    } catch {
      setError("Unable to share this talent reel right now.");
    }
  }

  return (
    <View style={styles.careerShortsScreen}>
      <AnimatedEntrance enterKey="recruiter-feed-shell" index={0} style={styles.flexOne}>
        <View style={styles.careerShortsShell}>
          <View
            style={styles.careerShortsPagerShell}
            onLayout={(event) => setShortsViewportHeight(event.nativeEvent.layout.height)}
          >
            {talentPosts.length ? (
              <ScrollView
                pagingEnabled
                decelerationRate="fast"
                disableIntervalMomentum
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                snapToInterval={shortsViewportHeight || undefined}
                snapToAlignment="start"
                contentContainerStyle={styles.careerShortsPagerContent}
                onMomentumScrollEnd={(event) => {
                  if (!shortsViewportHeight) {
                    return;
                  }

                  const nextIndex = Math.round(
                    event.nativeEvent.contentOffset.y / shortsViewportHeight,
                  );
                  const boundedIndex = Math.max(0, Math.min(talentPosts.length - 1, nextIndex));

                  if (boundedIndex !== activeShortIndex) {
                    setActiveShortIndex(boundedIndex);
                  }
                }}
              >
                {talentEntries.map(({ candidate, person, fitScore, post, showcase }, index) => (
                  <View
                    key={post.id}
                    style={[styles.careerShortsSlide, { height: shortsViewportHeight || 1 }]}
                  >
                    <CareerShortCard
                      item={post}
                      active={index === activeShortIndex}
                      paused={Boolean(pausedShortIds[post.id])}
                      endorsed={Boolean(endorsedIds[post.id])}
                      liked={likedIds[post.id] ?? Boolean(post.liked)}
                      likeCount={likeCounts[post.id] ?? post.likes}
                      commentCount={commentCounts[post.id] ?? post.comments}
                      shared={Boolean(sharedIds[post.id])}
                      muted={shortsMutedIds[post.id] ?? false}
                      onTogglePlayback={() => toggleShortPlayback(post.id)}
                      onToggleMute={() => toggleShortMute(post.id)}
                      onEndorse={() => toggleEndorsement(post)}
                      onPromptEndorse={() => promptEndorsement(post)}
                      onLike={() => likeShort(post)}
                      onComment={() => openCommentSheet(post.id)}
                      onShare={() => {
                        void shareTalent(post);
                      }}
                      onOpenMenu={() => handleOpenTalentMenu(post, person, candidate)}
                      onOpenCreatorProfile={() => onOpenCreatorProfile(person)}
                      onOpenJobs={() => {
                        void addToShortlist(candidate.id);
                      }}
                      recommendationScore={fitScore}
                      recommendationNote={`${showcase.note}${candidate.education[0] ? ` Certification: ${candidate.education[0]}.` : ""}`}
                      recommendationSector="Product"
                      recommendationRating={Math.min(5, 4 + candidate.experience_years / 10)}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.careerShortsEmptyState}>
                <Text style={styles.careerShortsEmptyTitle}>No talent reels yet</Text>
                <Text style={styles.careerShortsEmptyText}>
                  Talent videos and worker showcases will appear here once candidates are available.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.careerShortsHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.careerShortsEyebrow}>FOR YOUR NEXT HIRE</Text>
              <Text style={styles.careerShortsTitle}>TalentShorts</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.careerShortsModePill,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={() => void loadCandidates()}
            >
              <Ionicons name="refresh-outline" size={14} color="#dbe4ff" />
              <Text style={styles.careerShortsModeText}>Refresh</Text>
            </Pressable>
          </View>

          <View style={styles.discoveryFilterDock}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discoveryFilterRow}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.discoveryActionChip,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onOpenCandidates}
              >
                <Ionicons name="search-outline" size={14} color="#dbeafe" />
                <Text style={styles.discoveryActionChipText}>Candidate search</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.discoveryActionChip,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onOpenShortlists}
              >
                <Ionicons name="bookmark-outline" size={14} color="#dbeafe" />
                <Text style={styles.discoveryActionChipText}>
                  {selectedShortlistName ? `To ${selectedShortlistName}` : "Shortlists"}
                </Text>
              </Pressable>
              {shortlists.map((shortlist) => (
                <Pressable
                  key={shortlist.id}
                  style={({ pressed }) => [
                    styles.discoveryChip,
                    selectedShortlistId === shortlist.id && styles.discoveryChipActive,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => setSelectedShortlistId(shortlist.id)}
                >
                  <Text
                    style={[
                      styles.discoveryChipText,
                      selectedShortlistId === shortlist.id && styles.discoveryChipTextActive,
                    ]}
                  >
                    {shortlist.name}
                  </Text>
                </Pressable>
              ))}
              {message ? (
                <View style={styles.discoveryActionChip}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#dbeafe" />
                  <Text style={styles.discoveryActionChipText}>{message}</Text>
                </View>
              ) : null}
              {error ? (
                <View style={styles.discoveryActionChip}>
                  <Ionicons name="alert-circle-outline" size={14} color="#dbeafe" />
                  <Text style={styles.discoveryActionChipText}>{error}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </AnimatedEntrance>

      <ShortCommentsSheet
        post={commentSheetPostId ? talentPosts.find((item) => item.id === commentSheetPostId) ?? null : null}
        viewerAvatarSource={viewerAvatarSource}
        commentsByPost={commentsByPost}
        draftValue={commentSheetPostId ? commentDrafts[commentSheetPostId] ?? "" : ""}
        onChangeDraft={(value) => {
          if (!commentSheetPostId) {
            return;
          }

          setCommentDrafts((current) => ({ ...current, [commentSheetPostId]: value }));
        }}
        onClose={closeCommentSheet}
        onSubmit={(post) => {
          submitComment(post);
          closeCommentSheet();
        }}
      />
    </View>
  );
}

function RecruiterCandidatesScreen({
  token,
  onOpenShortlists,
}: {
  token?: string;
  onOpenShortlists: () => void;
}) {
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [certification, setCertification] = useState("");
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [shortlists, setShortlists] = useState<RecruiterShortlistSummary[]>([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState<number | null>(null);
  const [newShortlistName, setNewShortlistName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCandidates() {
    if (!token) {
      return;
    }

    setError("");
    try {
      const searchParams = new URLSearchParams();

      if (query.trim()) {
        searchParams.set("query", query.trim());
      }
      if (skills.trim()) {
        searchParams.set("skills", skills.trim());
      }
      if (location.trim()) {
        searchParams.set("location", location.trim());
      }
      if (certification.trim()) {
        searchParams.set("certification", certification.trim());
      }

      const response = await fetch(
        `${apiUrl}/recruiter/candidates?${searchParams.toString()}`,
        { headers: buildApiHeaders(token) },
      );
      const payload = await readMobileJson<{ candidates?: RecruiterCandidate[] }>(response);

      if (!response.ok) {
        throw new Error("Unable to load candidates.");
      }

      setCandidates(payload.candidates ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load candidates.",
      );
    }
  }

  async function loadShortlists() {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/recruiter/shortlists`, {
        headers: buildApiHeaders(token),
      });
      const payload = await readMobileJson<{ shortlists?: RecruiterShortlistSummary[] }>(response);

      if (!response.ok) {
        throw new Error("Unable to load shortlists.");
      }

      const nextShortlists = payload.shortlists ?? [];
      setShortlists(nextShortlists);
      setSelectedShortlistId((current) =>
        current && nextShortlists.some((shortlist) => shortlist.id === current)
          ? current
          : nextShortlists[0]?.id ?? null,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load shortlists.",
      );
    }
  }

  useEffect(() => {
    void loadCandidates();
    void loadShortlists();
  }, [token]);

  async function createShortlist() {
    if (!token || !newShortlistName.trim()) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/recruiter/shortlists`, {
        method: "POST",
        headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ name: newShortlistName.trim() }),
      });
      const payload = await readMobileJson<{ shortlist?: RecruiterShortlistSummary; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create shortlist.");
      }

      setMessage("Shortlist created.");
      setNewShortlistName("");
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to create shortlist.",
      );
    }
  }

  async function addToShortlist(candidateUserId: number) {
    if (!token || !selectedShortlistId) {
      onOpenShortlists();
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiUrl}/recruiter/shortlists/${selectedShortlistId}/items`,
        {
          method: "POST",
          headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
          body: JSON.stringify({ candidateUserId }),
        },
      );
      const payload = await readMobileJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error || "Unable to add candidate to shortlist.");
      }

      const targetShortlist =
        shortlists.find((shortlist) => shortlist.id === selectedShortlistId) ?? null;
      setMessage(
        targetShortlist
          ? `Candidate added to ${targetShortlist.name}.`
          : "Candidate added to shortlist.",
      );
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to add candidate to shortlist.",
      );
    }
  }

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="recruiter-candidates-hero" index={0}>
        <Card style={styles.recruiterHeroCard}>
          <Text style={styles.eyebrow}>Algorithmic talent search</Text>
          <Text style={styles.sectionCardTitle}>
            Find candidates without turning the network into spam
          </Text>
          <Text style={styles.bodyTextSmall}>
            Filter by query, skills, location, and certification, then drop high-fit talent into
            the right shortlist.
          </Text>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-candidate-filters" index={1}>
        <Card>
          <View style={styles.stack10}>
            <LabeledInput
              label="Query"
              icon={<Feather name="search" size={18} color={colors.inkMuted} />}
              value={query}
              onChangeText={setQuery}
              placeholder="Product designer, growth, frontend..."
            />
            <LabeledInput
              label="Skills"
              icon={<Feather name="code" size={18} color={colors.inkMuted} />}
              value={skills}
              onChangeText={setSkills}
              placeholder="React, Figma, Operations"
            />
            <LabeledInput
              label="Location"
              icon={<Feather name="map-pin" size={18} color={colors.inkMuted} />}
              value={location}
              onChangeText={setLocation}
              placeholder="London, Lagos, Remote"
            />
            <LabeledInput
              label="Certification"
              icon={<Feather name="award" size={18} color={colors.inkMuted} />}
              value={certification}
              onChangeText={setCertification}
              placeholder="BSc, MSc, AWS, PhD"
            />
            <View style={styles.gridButtonsTight}>
              <Button label="Run search" size="sm" onPress={() => void loadCandidates()} />
              <Button
                label="Shortlists"
                size="sm"
                variant="outline"
                onPress={onOpenShortlists}
              />
            </View>
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-shortlist-bar" index={2}>
        <Card>
          <View style={styles.titleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionHeading}>Active shortlists</Text>
              <Text style={styles.metaText}>
                {shortlists.length} pipeline{shortlists.length === 1 ? "" : "s"} ready
              </Text>
            </View>
            <Button label="Open" size="sm" variant="ghost" onPress={onOpenShortlists} />
          </View>
          <View style={styles.stack10}>
            <LabeledInput
              label="Create shortlist"
              icon={<Feather name="bookmark" size={18} color={colors.inkMuted} />}
              value={newShortlistName}
              onChangeText={setNewShortlistName}
              placeholder="Senior Design Bench"
            />
            <View style={styles.gridButtonsTight}>
              <Button label="Create" size="sm" onPress={() => void createShortlist()} />
              {selectedShortlistId ? (
                <Button
                  label="Selected shortlist"
                  size="sm"
                  variant="outline"
                  onPress={onOpenShortlists}
                />
              ) : null}
            </View>
            {shortlists.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {shortlists.map((shortlist) => {
                  const active = shortlist.id === selectedShortlistId;

                  return (
                    <Pressable
                      key={shortlist.id}
                      style={({ pressed }) => [
                        styles.recruiterShortlistChip,
                        active && styles.recruiterShortlistChipActive,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() => setSelectedShortlistId(shortlist.id)}
                    >
                      <Text
                        style={[
                          styles.recruiterShortlistChipText,
                          active && styles.recruiterShortlistChipTextActive,
                        ]}
                      >
                        {shortlist.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </Card>
      </AnimatedEntrance>

      {message ? (
        <AnimatedEntrance enterKey={`recruiter-candidate-message-${message}`} index={3}>
          <View style={[styles.messageCard, styles.profileInfoCard]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.profileInfoText}>{message}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {error ? (
        <AnimatedEntrance enterKey={`recruiter-candidate-error-${error}`} index={4}>
          <View style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {candidates.map((candidate, index) => (
        <AnimatedEntrance key={candidate.id} enterKey="recruiter-candidate-card" index={index + 5}>
          <Card>
            <View style={styles.stack10}>
              <View style={styles.titleRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.sectionCardTitle}>{candidate.full_name}</Text>
                  <Text style={styles.metaText}>
                    {candidate.headline || candidate.email}
                  </Text>
                </View>
                <Badge tone="indigo" label={`${candidate.experience_years} yrs`} />
              </View>
              <InlineMeta
                icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />}
                text={candidate.location || "Location not set"}
              />
              <Text style={styles.bodyTextSmall}>
                {candidate.summary || "No summary provided yet."}
              </Text>
              <View style={styles.tagRow}>
                {candidate.skills.slice(0, 4).map((skill, skillIndex) => (
                  <Badge key={`${candidate.id}-${skill}-${skillIndex}`} label={skill} />
                ))}
              </View>
              <View style={styles.gridButtonsTight}>
                <Button
                  label={
                    selectedShortlistId
                      ? `Add to ${shortlists.find((item) => item.id === selectedShortlistId)?.name ?? "shortlist"}`
                      : "Open shortlists"
                  }
                  size="sm"
                  onPress={() => void addToShortlist(candidate.id)}
                />
                <Button label="Shortlists" size="sm" variant="outline" onPress={onOpenShortlists} />
              </View>
            </View>
          </Card>
        </AnimatedEntrance>
      ))}

      {!candidates.length ? (
        <AnimatedEntrance enterKey="recruiter-candidate-empty" index={5}>
          <Card>
            <Text style={styles.emptyText}>No candidates match the current search yet.</Text>
          </Card>
        </AnimatedEntrance>
      ) : null}
    </ScreenScroll>
  );
}

function RecruiterCompaniesScreen({ token }: { token?: string }) {
  const scrollRef = useRef<ScrollView | null>(null);
  const companyFormOffsetRef = useRef(0);
  const jobFormOffsetRef = useRef(0);
  const [companies, setCompanies] = useState<RecruiterCompany[]>([]);
  const [jobsList, setJobsList] = useState<RecruiterJob[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    slug: "",
    website: "",
    industry: "",
    size: "",
    location: "",
    description: "",
    adHeadline: "",
    adCopy: "",
  });
  const [jobForm, setJobForm] = useState({
    companyId: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    salaryRange: "",
    status: "queued",
    featured: false,
  });
  const primaryCompany = companies[0] ?? null;
  const canCreateAnotherCompany = companies.length === 0 || editingCompanyId !== null;

  function resetCompanyForm() {
    setCompanyForm({
      name: "",
      slug: "",
      website: "",
      industry: "",
      size: "",
      location: "",
      description: "",
      adHeadline: "",
      adCopy: "",
    });
    setEditingCompanyId(null);
  }

  function resetJobForm(companyId = "") {
    setJobForm({
      companyId,
      title: "",
      description: "",
      requirements: "",
      location: "",
      salaryRange: "",
      status: "queued",
      featured: false,
    });
    setEditingJobId(null);
  }

  function scrollToEditor(target: "company" | "job") {
    const offset = target === "company" ? companyFormOffsetRef.current : jobFormOffsetRef.current;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, offset - 20),
        animated: true,
      });
    });
  }

  async function loadData() {
    if (!token) {
      return;
    }

    setError("");
    try {
      const companiesResponse = await fetch(`${apiUrl}/recruiter/companies`, {
        headers: buildApiHeaders(token),
      });
      const companiesPayload = await readMobileJson<{
        companies?: RecruiterCompany[];
        error?: string;
      }>(companiesResponse);

      if (!companiesResponse.ok) {
        throw new Error(companiesPayload.error || "Unable to load company workflows.");
      }

      let jobsResponse = await fetch(`${apiUrl}/recruiter/jobs`, {
        headers: buildApiHeaders(token),
      });
      let jobsPayload = await readMobileJson<{ jobs?: RecruiterJob[]; error?: string }>(
        jobsResponse,
      );

      if (!jobsResponse.ok) {
        jobsResponse = await fetch(`${apiUrl}/jobs`, {
          headers: buildApiHeaders(token),
        });
        jobsPayload = await readMobileJson<{ jobs?: RecruiterJob[]; error?: string }>(
          jobsResponse,
        );
      }

      if (!jobsResponse.ok) {
        throw new Error(jobsPayload.error || "Unable to load company workflows.");
      }

      const recruiterCompanies = companiesPayload.companies ?? [];
      const recruiterCompanyIds = new Set(recruiterCompanies.map((company) => company.id));
      const recruiterCompanyNames = new Set(recruiterCompanies.map((company) => company.name));
      const recruiterJobs = (jobsPayload.jobs ?? []).filter(
        (job) =>
          recruiterCompanyIds.has(job.company_id) || recruiterCompanyNames.has(job.company_name),
      );

      setCompanies(recruiterCompanies);
      setJobsList(recruiterJobs);
      setJobForm((current) => ({
        ...current,
        companyId:
          current.companyId ||
          `${recruiterJobs[0]?.company_id ?? recruiterCompanies[0]?.id ?? ""}`,
      }));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load company workflows.",
      );
    }
  }

  useEffect(() => {
    void loadData();
  }, [token]);

  async function createCompanyRecord() {
    if (!token) {
      return;
    }

    if (!editingCompanyId && companies.length > 0) {
      setError(
        "Your recruiter account already has a company. Delete it before creating another one.",
      );
      setMessage("");
      scrollToEditor("company");
      return;
    }

    setError("");
    setMessage("");

    const response = await fetch(
      editingCompanyId ? `${apiUrl}/companies/${editingCompanyId}` : `${apiUrl}/companies`,
      {
        method: editingCompanyId ? "PUT" : "POST",
        headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(companyForm),
      },
    );
    const payload = await readMobileJson<{ error?: string }>(response);

    if (!response.ok) {
      setError(
        payload.error || (editingCompanyId ? "Unable to update company." : "Unable to create company."),
      );
      return;
    }

    setMessage(
      editingCompanyId
        ? "Company updated in the queue."
        : "Company created and sent to verification queue.",
    );
    resetCompanyForm();
    await loadData();
  }

  function startEditingCompany(company: RecruiterCompany) {
    setEditingJobId(null);
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      slug: company.slug,
      website: company.website ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      location: company.location ?? "",
      description: company.description ?? "",
      adHeadline: company.ad_headline ?? "",
      adCopy: company.ad_copy ?? "",
    });
    setMessage(`Editing ${company.name}. Update the company form above, then save.`);
    setError("");
    scrollToEditor("company");
  }

  function confirmDeleteCompany(company: RecruiterCompany) {
    Alert.alert(
      "Delete company?",
      `Are you sure you want to delete ${company.name}? This also removes its jobs from the posting queue.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteCompanyRecord(company.id);
          },
        },
      ],
    );
  }

  async function deleteCompanyRecord(companyId: number) {
    if (!token) {
      return;
    }

    setError("");
    setMessage("");

    const response = await fetch(`${apiUrl}/companies/${companyId}`, {
      method: "DELETE",
      headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
    });
    const payload = await readMobileJson<{ error?: string }>(response);

    if (!response.ok) {
      setError(payload.error || "Unable to delete company.");
      return;
    }

    if (editingCompanyId === companyId) {
      resetCompanyForm();
    }
    setMessage("Company deleted.");
    await loadData();
  }

  async function createJobRecord() {
    if (!token) {
      return;
    }

    setError("");
    setMessage("");

    const response = await fetch(
      editingJobId ? `${apiUrl}/jobs/${editingJobId}` : `${apiUrl}/jobs`,
      {
        method: editingJobId ? "PUT" : "POST",
        headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...jobForm,
          companyId: Number(jobForm.companyId),
        }),
      },
    );
    const payload = await readMobileJson<{ error?: string }>(response);

    if (!response.ok) {
      setError(payload.error || (editingJobId ? "Unable to update job." : "Unable to create job."));
      return;
    }

    setMessage(
      editingJobId
        ? "Job updated in the posting queue."
        : "Job created and added to the posting queue.",
    );
    resetJobForm(jobForm.companyId);
    await loadData();
  }

  function startEditingJob(job: RecruiterJob) {
    setEditingCompanyId(null);
    setEditingJobId(job.id);
    setJobForm({
      companyId: `${job.company_id}`,
      title: job.title,
      description: job.description ?? "",
      requirements: job.requirements ?? "",
      location: job.location ?? "",
      salaryRange: job.salary_range ?? "",
      status: job.status || "queued",
      featured: Boolean(job.featured),
    });
    setMessage(`Editing ${job.title}. Update the posting form above, then save.`);
    setError("");
    scrollToEditor("job");
  }

  function confirmDeleteJob(job: RecruiterJob) {
    Alert.alert(
      "Delete job?",
      `Are you sure you want to delete ${job.title}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteJobRecord(job.id);
          },
        },
      ],
    );
  }

  async function deleteJobRecord(jobId: number) {
    if (!token) {
      return;
    }

    setError("");
    setMessage("");

    const response = await fetch(`${apiUrl}/jobs/${jobId}`, {
      method: "DELETE",
      headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
    });
    const payload = await readMobileJson<{ error?: string }>(response);

    if (!response.ok) {
      setError(payload.error || "Unable to delete job.");
      return;
    }

    if (editingJobId === jobId) {
      resetJobForm(jobForm.companyId);
    }
    setMessage("Job deleted.");
    await loadData();
  }

  return (
    <ScreenScroll scrollRef={scrollRef}>
      <AnimatedEntrance enterKey="recruiter-companies-hero" index={0}>
        <Card style={styles.recruiterHeroCard}>
          <Text style={styles.eyebrow}>Company validation and SaaS directory management</Text>
          <Text style={styles.sectionCardTitle}>
            Stand up company pages and publish hiring inventory
          </Text>
          <Text style={styles.bodyTextSmall}>
            Create company records, queue ad copy, and push jobs into the recruiter posting lane.
          </Text>
        </Card>
      </AnimatedEntrance>

      {message ? (
        <AnimatedEntrance enterKey={`recruiter-company-message-${message}`} index={1}>
          <View style={[styles.messageCard, styles.profileInfoCard]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.profileInfoText}>{message}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {error ? (
        <AnimatedEntrance enterKey={`recruiter-company-error-${error}`} index={2}>
          <View style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance enterKey="recruiter-company-form" index={3}>
        <Card onLayout={(event) => (companyFormOffsetRef.current = event.nativeEvent.layout.y)}>
          <Text style={styles.sectionHeading}>
            {editingCompanyId
              ? "Edit company page"
              : companies.length
                ? "Company page locked"
                : "Create company page"}
          </Text>
          <View style={styles.stack10}>
            {primaryCompany && !editingCompanyId ? (
              <View style={[styles.messageCard, styles.profileInfoCard]}>
                <Ionicons name="business-outline" size={18} color={colors.brandDark} />
                <Text style={styles.profileInfoText}>
                  This recruiter account already owns `{primaryCompany.name}`. Edit or delete it
                  before creating another company. You can still create multiple jobs below.
                </Text>
              </View>
            ) : null}
            <LabeledInput
              label="Company name"
              icon={<Feather name="briefcase" size={18} color={colors.inkMuted} />}
              value={companyForm.name}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, name: value }))}
              placeholder="Acme Logistics"
            />
            <LabeledInput
              label="Slug"
              icon={<Feather name="hash" size={18} color={colors.inkMuted} />}
              value={companyForm.slug}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, slug: value }))}
              placeholder="acme-logistics"
              autoCapitalize="none"
            />
            <LabeledInput
              label="Website"
              icon={<Feather name="globe" size={18} color={colors.inkMuted} />}
              value={companyForm.website}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, website: value }))}
              placeholder="https://company.com"
              autoCapitalize="none"
            />
            <LabeledInput
              label="Industry"
              icon={<Ionicons name="layers-outline" size={18} color={colors.inkMuted} />}
              value={companyForm.industry}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, industry: value }))}
              placeholder="Logistics"
            />
            <LabeledInput
              label="Company size"
              icon={<Ionicons name="people-outline" size={18} color={colors.inkMuted} />}
              value={companyForm.size}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, size: value }))}
              placeholder="51-200"
            />
            <LabeledInput
              label="Location"
              icon={<Feather name="map-pin" size={18} color={colors.inkMuted} />}
              value={companyForm.location}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, location: value }))}
              placeholder="London, UK"
            />
            <MultilineField
              label="Description"
              value={companyForm.description}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, description: value }))}
              placeholder="Describe the employer value proposition."
            />
            <MultilineField
              label="Ad headline"
              value={companyForm.adHeadline}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, adHeadline: value }))}
              placeholder="Hiring high-trust talent across operations and support."
            />
            <MultilineField
              label="Ad copy"
              value={companyForm.adCopy}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, adCopy: value }))}
              placeholder="Explain the campaign and open roles."
            />
            <View style={styles.gridButtonsTight}>
              {canCreateAnotherCompany ? (
                <Button
                  label={editingCompanyId ? "Save company" : "Create company"}
                  size="sm"
                  onPress={() => void createCompanyRecord()}
                />
              ) : primaryCompany ? (
                <Button
                  label="Edit current company"
                  size="sm"
                  onPress={() => startEditingCompany(primaryCompany)}
                />
              ) : null}
              {editingCompanyId ? (
                <Button
                  label="Cancel"
                  size="sm"
                  variant="outline"
                  onPress={() => resetCompanyForm()}
                />
              ) : primaryCompany ? (
                <Button
                  label="Delete current company"
                  size="sm"
                  variant="ghost"
                  onPress={() => confirmDeleteCompany(primaryCompany)}
                />
              ) : null}
            </View>
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-job-form" index={4}>
        <Card onLayout={(event) => (jobFormOffsetRef.current = event.nativeEvent.layout.y)}>
          <Text style={styles.sectionHeading}>{editingJobId ? "Edit job" : "Create job"}</Text>
          <View style={styles.stack10}>
            {companies.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {companies.map((company, companyIndex) => {
                  const active = jobForm.companyId === `${company.id}`;

                  return (
                    <Pressable
                      key={`${company.id}-${companyIndex}`}
                      style={({ pressed }) => [
                        styles.recruiterCompanyChip,
                        active && styles.recruiterCompanyChipActive,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() =>
                        setJobForm((current) => ({ ...current, companyId: `${company.id}` }))
                      }
                    >
                      <Text
                        style={[
                          styles.recruiterCompanyChipText,
                          active && styles.recruiterCompanyChipTextActive,
                        ]}
                      >
                        {company.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Create a company first to publish jobs.</Text>
            )}
            <LabeledInput
              label="Job title"
              icon={<Feather name="file-text" size={18} color={colors.inkMuted} />}
              value={jobForm.title}
              onChangeText={(value) => setJobForm((current) => ({ ...current, title: value }))}
              placeholder="Operations Manager"
            />
            <LabeledInput
              label="Location"
              icon={<Feather name="map-pin" size={18} color={colors.inkMuted} />}
              value={jobForm.location}
              onChangeText={(value) => setJobForm((current) => ({ ...current, location: value }))}
              placeholder="Remote or London"
            />
            <LabeledInput
              label="Salary range"
              icon={<MaterialCommunityIcons name="cash-multiple" size={18} color={colors.inkMuted} />}
              value={jobForm.salaryRange}
              onChangeText={(value) => setJobForm((current) => ({ ...current, salaryRange: value }))}
              placeholder="GBP 55,000 - 70,000"
            />
            <MultilineField
              label="Description"
              value={jobForm.description}
              onChangeText={(value) => setJobForm((current) => ({ ...current, description: value }))}
              placeholder="Describe the role, scope, and team."
            />
            <MultilineField
              label="Requirements"
              value={jobForm.requirements}
              onChangeText={(value) => setJobForm((current) => ({ ...current, requirements: value }))}
              placeholder="Outline the must-haves."
            />
            <View style={styles.gridButtonsTight}>
              <Button
                label={jobForm.status === "queued" ? "Status: queued" : "Status: published"}
                size="sm"
                variant="outline"
                onPress={() =>
                  setJobForm((current) => ({
                    ...current,
                    status: current.status === "queued" ? "published" : "queued",
                  }))
                }
              />
              <Button
                label={jobForm.featured ? "Featured" : "Mark featured"}
                size="sm"
                variant="outline"
                onPress={() =>
                  setJobForm((current) => ({ ...current, featured: !current.featured }))
                }
              />
            </View>
            <View style={styles.gridButtonsTight}>
              <Button
                label={editingJobId ? "Save job" : "Queue job"}
                size="sm"
                onPress={() => void createJobRecord()}
              />
              {editingJobId ? (
                <Button
                  label="Cancel"
                  size="sm"
                  variant="outline"
                  onPress={() => resetJobForm(jobForm.companyId)}
                />
              ) : null}
            </View>
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-company-list" index={5}>
        <Card>
          <Text style={styles.sectionHeading}>Company queue</Text>
          <View style={styles.stack10}>
            {companies.map((company, companyIndex) => (
              <View key={`${company.id}-${companyIndex}`} style={styles.recruiterPanelCard}>
                <View style={styles.titleRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardAuthor}>{company.name}</Text>
                    <Text style={styles.metaText}>
                      {company.industry || "General"} · {company.location || "Location pending"}
                    </Text>
                  </View>
                  <Badge
                    tone={company.verification_status === "verified" ? "emerald" : "amber"}
                    label={company.verification_status}
                  />
                </View>
                <Text style={styles.bodyTextTiny}>
                  {company.ad_headline || company.description || "No company copy added yet."}
                </Text>
                <View style={styles.gridButtonsTight}>
                  <Button
                    label="Edit"
                    size="sm"
                    variant="outline"
                    onPress={() => startEditingCompany(company)}
                  />
                  <Button
                    label="Delete"
                    size="sm"
                    variant="ghost"
                    onPress={() => confirmDeleteCompany(company)}
                  />
                </View>
              </View>
            ))}
            {!companies.length ? (
              <Text style={styles.emptyText}>No companies created yet.</Text>
            ) : null}
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-job-list" index={6}>
        <Card>
          <View style={styles.recruiterQueueHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionHeading}>Posting queue</Text>
              <Text style={styles.recruiterQueueSubtitle}>
                Featured roles, queued jobs, and recruiter-owned hiring lanes.
              </Text>
            </View>
            <View style={styles.recruiterQueueCountPill}>
              <Text style={styles.recruiterQueueCountText}>{jobsList.length}</Text>
            </View>
          </View>
          <View style={styles.stack10}>
            {jobsList.slice(0, 5).map((job, jobIndex) => (
              <View key={`${job.id}-${jobIndex}`} style={styles.recruiterQueueCard}>
                <View style={styles.titleRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.recruiterQueueEyebrow}>
                      {job.featured ? "Featured role" : "Recruiter-owned role"}
                    </Text>
                    <Text style={styles.cardAuthor}>{job.title}</Text>
                    <Text style={styles.recruiterQueueMeta}>
                      {job.company_name} · {job.location}
                    </Text>
                  </View>
                  <Badge
                    tone={isRecruiterPublishedStatus(job.status) ? "emerald" : "slate"}
                    label={job.status}
                  />
                </View>
                <View style={styles.recruiterQueueFooter}>
                  <View style={styles.recruiterQueueSalaryPill}>
                    <MaterialCommunityIcons
                      name="cash-multiple"
                      size={14}
                      color={colors.brandDark}
                    />
                    <Text style={styles.recruiterQueueSalaryText}>
                      {job.salary_range || "Compensation on request"}
                    </Text>
                  </View>
                </View>
                <View style={styles.recruiterQueueActions}>
                  <Button
                    label="Edit"
                    size="sm"
                    variant="outline"
                    onPress={() => startEditingJob(job)}
                  />
                  <Button
                    label="Delete"
                    size="sm"
                    variant="ghost"
                    onPress={() => confirmDeleteJob(job)}
                  />
                </View>
              </View>
            ))}
            {!jobsList.length ? (
              <Text style={styles.emptyText}>No recruiter jobs yet.</Text>
            ) : null}
          </View>
        </Card>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function RecruiterShortlistsScreen({
  token,
  onOpenCandidates,
}: {
  token?: string;
  onOpenCandidates: () => void;
}) {
  const [shortlists, setShortlists] = useState<RecruiterShortlistSummary[]>([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState<number | null>(null);
  const [selectedShortlist, setSelectedShortlist] = useState<RecruiterShortlistDetail | null>(null);
  const [newShortlistName, setNewShortlistName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadShortlists() {
    if (!token) {
      return;
    }

    const response = await fetch(`${apiUrl}/recruiter/shortlists`, {
      headers: buildApiHeaders(token),
    });
    const payload = await readMobileJson<{ shortlists?: RecruiterShortlistSummary[] }>(response);

    if (!response.ok) {
      throw new Error("Unable to load shortlists.");
    }

    const nextShortlists = payload.shortlists ?? [];
    setShortlists(nextShortlists);
    setSelectedShortlistId((current) =>
      current && nextShortlists.some((shortlist) => shortlist.id === current)
        ? current
        : nextShortlists[0]?.id ?? null,
    );
  }

  async function loadShortlistDetail(shortlistId: number) {
    if (!token || !shortlistId) {
      return;
    }

    const response = await fetch(`${apiUrl}/recruiter/shortlists/${shortlistId}`, {
      headers: buildApiHeaders(token),
    });
    const payload = await readMobileJson<{ shortlist?: RecruiterShortlistDetail; error?: string }>(
      response,
    );

    if (!response.ok || !payload.shortlist) {
      throw new Error(payload.error || "Unable to load shortlist detail.");
    }

    setSelectedShortlist(payload.shortlist);
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    loadShortlists().catch((caughtError) => {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load shortlists.",
      );
    });
  }, [token]);

  useEffect(() => {
    if (!selectedShortlistId) {
      setSelectedShortlist(null);
      return;
    }

    loadShortlistDetail(selectedShortlistId).catch((caughtError) => {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load shortlist detail.",
      );
    });
  }, [selectedShortlistId, token]);

  async function createShortlist() {
    if (!token || !newShortlistName.trim()) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/recruiter/shortlists`, {
        method: "POST",
        headers: buildApiHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ name: newShortlistName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Unable to create shortlist.");
      }

      setNewShortlistName("");
      setMessage("Shortlist created.");
      await loadShortlists();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to create shortlist.",
      );
    }
  }

  async function removeCandidate(candidateUserId: number) {
    if (!token || !selectedShortlistId) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiUrl}/recruiter/shortlists/${selectedShortlistId}/items/${candidateUserId}`,
        {
          method: "DELETE",
          headers: buildApiHeaders(token),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to remove candidate from shortlist.");
      }

      setMessage("Candidate removed.");
      await loadShortlists();
      await loadShortlistDetail(selectedShortlistId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove candidate from shortlist.",
      );
    }
  }

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="recruiter-shortlists-hero" index={0}>
        <Card style={styles.recruiterHeroCard}>
          <Text style={styles.eyebrow}>Pipeline management</Text>
          <Text style={styles.sectionCardTitle}>
            Build shortlist lanes and keep candidate context tight
          </Text>
          <Text style={styles.bodyTextSmall}>
            Create new shortlists, inspect candidate detail, and remove stale matches without
            dropping context.
          </Text>
          <View style={styles.gridButtonsTight}>
            <Button label="Candidate search" size="sm" onPress={onOpenCandidates} />
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="recruiter-shortlists-create" index={1}>
        <Card>
          <Text style={styles.sectionHeading}>Create shortlist</Text>
          <View style={styles.stack10}>
            <LabeledInput
              label="Shortlist name"
              icon={<Feather name="bookmark" size={18} color={colors.inkMuted} />}
              value={newShortlistName}
              onChangeText={setNewShortlistName}
              placeholder="Operations shortlist"
            />
            <Button label="Create shortlist" size="sm" onPress={() => void createShortlist()} />
          </View>
        </Card>
      </AnimatedEntrance>

      {message ? (
        <AnimatedEntrance enterKey={`recruiter-shortlist-message-${message}`} index={2}>
          <View style={[styles.messageCard, styles.profileInfoCard]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.profileInfoText}>{message}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      {error ? (
        <AnimatedEntrance enterKey={`recruiter-shortlist-error-${error}`} index={3}>
          <View style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance enterKey="recruiter-shortlists-row" index={4}>
        <Card>
          <Text style={styles.sectionHeading}>All shortlists</Text>
          {shortlists.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {shortlists.map((shortlist, shortlistIndex) => {
                const active = shortlist.id === selectedShortlistId;

                return (
                  <Pressable
                    key={`${shortlist.id}-${shortlistIndex}`}
                    style={({ pressed }) => [
                      styles.recruiterShortlistChip,
                      active && styles.recruiterShortlistChipActive,
                      pressed && styles.pressablePressedSoft,
                    ]}
                    onPress={() => setSelectedShortlistId(shortlist.id)}
                  >
                    <Text
                      style={[
                        styles.recruiterShortlistChipText,
                        active && styles.recruiterShortlistChipTextActive,
                      ]}
                    >
                      {shortlist.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>Create a shortlist to start building a hiring lane.</Text>
          )}
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance
        enterKey={`recruiter-shortlist-detail-${selectedShortlistId ?? "empty"}`}
        index={5}
      >
        <Card>
          <View style={styles.titleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionHeading}>
                {selectedShortlist?.name || "Shortlist detail"}
              </Text>
              <Text style={styles.metaText}>
                {selectedShortlist?.candidate_count ?? 0} candidate
                {(selectedShortlist?.candidate_count ?? 0) === 1 ? "" : "s"}
              </Text>
            </View>
            <Button label="Find talent" size="sm" variant="outline" onPress={onOpenCandidates} />
          </View>
          <View style={styles.stack10}>
            {selectedShortlist?.candidates.map((candidate, candidateIndex) => (
              <View
                key={`${candidate.candidate_user_id}-${candidateIndex}`}
                style={styles.recruiterPanelCard}
              >
                <View style={styles.titleRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardAuthor}>{candidate.full_name}</Text>
                    <Text style={styles.metaText}>
                      {candidate.headline || candidate.location}
                    </Text>
                  </View>
                  <Badge tone="indigo" label={`${candidate.experience_years} yrs`} />
                </View>
                <Text style={styles.bodyTextTiny}>
                  {candidate.note || candidate.summary || "No note added yet."}
                </Text>
                <View style={styles.tagRow}>
                  {candidate.skills.slice(0, 3).map((skill, skillIndex) => (
                    <Badge
                      key={`${candidate.candidate_user_id}-${skill}-${skillIndex}`}
                      label={skill}
                    />
                  ))}
                </View>
                <View style={styles.gridButtonsTight}>
                  <Button
                    label="Remove"
                    size="sm"
                    variant="outline"
                    onPress={() => void removeCandidate(candidate.candidate_user_id)}
                  />
                </View>
              </View>
            ))}
            {!selectedShortlist?.candidates.length ? (
              <Text style={styles.emptyText}>
                This shortlist is empty. Add candidates from search.
              </Text>
            ) : null}
          </View>
        </Card>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function FeedScreen({
  onOpenResume,
  onOpenJobs,
  onOpenAvailability,
  onOpenCreatorProfile,
  onPlaybackStateChange,
  workerMode,
}: {
  onOpenResume: () => void;
  onOpenJobs: () => void;
  onOpenAvailability: () => void;
  onOpenCreatorProfile: (person: Person) => void;
  onPlaybackStateChange: (state: { paused: boolean; hasVideo: boolean }) => void;
  workerMode: WorkerMode;
}) {
  const { user, token } = useBussInAuth();
  const [shortsViewportHeight, setShortsViewportHeight] = useState(0);
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const [shortsMode, setShortsMode] = useState<"curated" | "latest">("curated");
  const [discoveryLocation, setDiscoveryLocation] = useState<DiscoveryLocationFilter>("All");
  const [discoverySector, setDiscoverySector] = useState<DiscoverySectorFilter>("All");
  const [discoveryRating, setDiscoveryRating] = useState<DiscoveryRatingFilter>("All");
  const [shortsMutedIds, setShortsMutedIds] = useState<Record<string, boolean>>({});
  const [pausedShortIds, setPausedShortIds] = useState<Record<string, boolean>>({});
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => normalizeFeedItems(feed));
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      feed
        .filter((item): item is Extract<FeedItem, { kind: "post" }> => item.kind === "post")
        .map((item) => [item.id, item.comments]),
    ),
  );
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>(initialFeedComments);
  const [sharedIds, setSharedIds] = useState<Record<string, boolean>>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<FeedComposerMode>("update");
  const [composerText, setComposerText] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<FeedAttachment[]>([]);
  const [composerMediaLayout, setComposerMediaLayout] = useState<FeedMediaLayout>("collage");
  const [composerNotice, setComposerNotice] = useState<{
    tone: "info" | "error" | "success";
    text: string;
  } | null>(null);
  const [recentComposerDrafts, setRecentComposerDrafts] = useState<ComposerDraftSnapshot[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [appliedMatchIds, setAppliedMatchIds] = useState<Record<string, boolean>>({});
  const [referredHiringIds, setReferredHiringIds] = useState<Record<string, boolean>>({});
  const [viewedHiringIds, setViewedHiringIds] = useState<Record<string, boolean>>({});
  const [feedHydrated, setFeedHydrated] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [mediaCompressionPreset, setMediaCompressionPreset] =
    useState<MediaCompressionPreset>("balanced");
  const [mediaFilterTone, setMediaFilterTone] = useState<MediaFilterTone>("clarity");
  const [uploadNetworkMode, setUploadNetworkMode] = useState<"standard" | "low-bandwidth">(
    "low-bandwidth",
  );
  const [uploadStage, setUploadStage] = useState<MediaUploadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewerProfile, setViewerProfile] = useState<MobileProfileDraft>(() =>
    buildInitialProfileDraft(user ?? undefined),
  );
  const viewerAvatarSource = resolveProfileAvatarSource(viewerProfile.avatarUri);
  const viewerTitle = deriveProfileTitle(viewerProfile.headline);
  const shortDiscoveryEntries = useMemo(() => {
    const posts = feedItems.filter(
      (item): item is Extract<FeedItem, { kind: "post" }> => item.kind === "post",
    );

    const filtered = posts
      .map((item) => {
        const meta = getDiscoveryMeta(item);
        const recommendationScore = computeDiscoveryScore(
          item,
          meta,
          workerMode,
          viewerProfile,
          counts,
          commentCounts,
        );

        return {
          item,
          meta,
          recommendationScore,
        };
      })
      .filter(
        (entry) =>
          entry.meta.workerModes.includes(workerMode) &&
          matchesDiscoveryFilters(
            entry.meta,
            discoveryLocation,
            discoverySector,
            discoveryRating,
          ),
      );

    if (shortsMode === "latest") {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      const leftHasVideo = left.item.attachments?.some((attachment) => attachment.kind === "video")
        ? 1
        : 0;
      const rightHasVideo = right.item.attachments?.some((attachment) => attachment.kind === "video")
        ? 1
        : 0;

      return (
        rightHasVideo - leftHasVideo ||
        right.recommendationScore - left.recommendationScore
      );
    });
  }, [
    commentCounts,
    counts,
    discoveryLocation,
    discoveryRating,
    discoverySector,
    feedItems,
    shortsMode,
    viewerProfile,
    workerMode,
  ]);
  const shortPosts = shortDiscoveryEntries.map((entry) => entry.item);
  const activeShortPost = shortPosts[activeShortIndex] ?? null;
  const activeShortHasVideo = Boolean(
    activeShortPost?.attachments?.some((attachment) => attachment.kind === "video"),
  );
  const activeShortPaused = activeShortPost ? Boolean(pausedShortIds[activeShortPost.id]) : false;
  const composerPayloadEstimate = useMemo(
    () =>
      estimateAttachmentPayloadMb(
        composerAttachments,
        mediaCompressionPreset,
        uploadNetworkMode,
      ),
    [composerAttachments, mediaCompressionPreset, uploadNetworkMode],
  );

  useEffect(() => {
    let active = true;

    async function loadViewerProfile() {
      const stored = await AsyncStorage.getItem(mobileProfileStorageKey);

      if (!active) {
        return;
      }

      if (!stored) {
        setViewerProfile(buildInitialProfileDraft(user ?? undefined));
        return;
      }

      try {
        setViewerProfile(
          normalizeProfileDraft(
            JSON.parse(stored) as Partial<MobileProfileDraft>,
            user ?? undefined,
          ),
        );
      } catch {
        setViewerProfile(buildInitialProfileDraft(user ?? undefined));
      }
    }

    void loadViewerProfile();

    return () => {
      active = false;
    };
  }, [user?.fullName]);

  useEffect(() => {
    if (activeShortIndex < shortDiscoveryEntries.length) {
      return;
    }

    setActiveShortIndex(Math.max(0, shortDiscoveryEntries.length - 1));
  }, [activeShortIndex, shortDiscoveryEntries.length]);

  useEffect(() => {
    const hasVideoAttachment = composerAttachments.some((attachment) => attachment.kind === "video");

    if (!hasVideoAttachment) {
      setUploadStage("idle");
      setUploadProgress(0);
      return;
    }

    setUploadStage("compressing");
    setUploadProgress(18);

    const firstTimer = setTimeout(() => {
      setUploadStage("filtering");
      setUploadProgress(42);
    }, 520);
    const secondTimer = setTimeout(() => {
      setUploadStage("queued");
      setUploadProgress(66);
    }, 1040);
    const thirdTimer = setTimeout(() => {
      setUploadStage("uploading");
      setUploadProgress(uploadNetworkMode === "low-bandwidth" ? 78 : 88);
    }, 1520);
    const fourthTimer = setTimeout(() => {
      setUploadStage("ready");
      setUploadProgress(100);
    }, uploadNetworkMode === "low-bandwidth" ? 2520 : 2100);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
      clearTimeout(thirdTimer);
      clearTimeout(fourthTimer);
    };
  }, [composerAttachments, mediaCompressionPreset, mediaFilterTone, uploadNetworkMode]);

  useEffect(() => {
    let active = true;

    async function loadFeedState() {
      const stored = await AsyncStorage.getItem(mobileFeedStateStorageKey);

      if (!active || !stored) {
        setFeedHydrated(true);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as Partial<StoredFeedState>;

        if (parsed.feedItems?.length) {
          setFeedItems(normalizeFeedItems(parsed.feedItems));
        }

        setLikedIds(parsed.likedIds ?? {});
        setCounts(parsed.counts ?? {});
        setCommentCounts(
          parsed.commentCounts ??
            Object.fromEntries(
              feed
                .filter((item): item is Extract<FeedItem, { kind: "post" }> => item.kind === "post")
                .map((item) => [item.id, item.comments]),
            ),
        );
        setCommentsByPost(parsed.commentsByPost ?? initialFeedComments);
        setSharedIds(parsed.sharedIds ?? {});
        setComposerText(parsed.composerText ?? "");
        setComposerMode(parsed.composerMode ?? "update");
        setComposerAttachments(
          parsed.composerAttachments ??
            ((parsed as Partial<StoredFeedState> & { composerAttachment?: FeedAttachment | null })
              .composerAttachment
              ? [
                  (parsed as Partial<StoredFeedState> & {
                    composerAttachment?: FeedAttachment | null;
                  }).composerAttachment!,
                ]
              : []),
        );
        setComposerMediaLayout(parsed.composerMediaLayout ?? "collage");
        setComposerOpen(Boolean(parsed.composerOpen));
        setRecentComposerDrafts(parsed.recentComposerDrafts ?? []);
        setAppliedMatchIds(parsed.appliedMatchIds ?? {});
        setReferredHiringIds(parsed.referredHiringIds ?? {});
        setViewedHiringIds(parsed.viewedHiringIds ?? {});
      } catch {
        // Ignore malformed local feed data and fall back to the seeded feed state.
      } finally {
        if (active) {
          setFeedHydrated(true);
        }
      }
    }

    void loadFeedState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!feedHydrated) {
      return;
    }

    const nextState: StoredFeedState = {
      feedItems,
      likedIds,
      counts,
      commentCounts,
      commentsByPost,
      sharedIds,
      composerText,
      composerMode,
      composerAttachments,
      composerMediaLayout,
      composerOpen,
      recentComposerDrafts,
      appliedMatchIds,
      referredHiringIds,
      viewedHiringIds,
    };

    void AsyncStorage.setItem(mobileFeedStateStorageKey, JSON.stringify(nextState));
  }, [
    appliedMatchIds,
    commentCounts,
    commentsByPost,
    composerAttachments,
    composerMediaLayout,
    composerMode,
    composerOpen,
    composerText,
    counts,
    feedHydrated,
    feedItems,
    likedIds,
    recentComposerDrafts,
    referredHiringIds,
    sharedIds,
    viewedHiringIds,
  ]);

  useEffect(() => {
    if (!feedHydrated || !token) {
      return;
    }

    let active = true;

    void fetchSyncedFeedPosts(token)
      .then((posts) => {
        if (!active) {
          return;
        }

        setFeedItems((current) => {
          const syncedItems = posts.map(mapSyncedPostToMobileItem);
          const preservedItems = current.filter(
            (item) =>
              !(
                item.kind === "post" &&
                item.author.id === me.id &&
                item.id.startsWith("post-")
              ),
          );

          return normalizeFeedItems([...syncedItems, ...preservedItems]);
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [feedHydrated, token]);

  useEffect(() => {
    const imageCount = composerAttachments.filter((attachment) => attachment.kind === "image").length;
    const hasVideo = composerAttachments.some((attachment) => attachment.kind === "video");

    if (!composerAttachments.length) {
      return;
    }

    if ((hasVideo || imageCount <= 1) && composerMediaLayout !== "scroll") {
      setComposerMediaLayout("scroll");
    }
  }, [composerAttachments, composerMediaLayout]);

  function resetComposer() {
    setComposerText("");
    setComposerAttachments([]);
    setComposerMediaLayout("collage");
    setComposerMode("update");
    setComposerNotice(null);
    setEditingPostId(null);
  }

  function saveCurrentDraftToRecent() {
    if (!composerText.trim() && !composerAttachments.length) {
      return false;
    }

    const nextDraft: ComposerDraftSnapshot = {
      id: `draft-${Date.now()}`,
      text: composerText.trim(),
      mode: composerMode,
      attachments: composerAttachments,
      mediaLayout: composerMediaLayout,
      savedAtLabel: editingPostId ? "Updated draft" : "Saved just now",
    };

    setRecentComposerDrafts((current) => [nextDraft, ...current].slice(0, 4));
    return true;
  }

  function closeComposer() {
    const saved = saveCurrentDraftToRecent();
    setComposerOpen(false);
    resetComposer();

    if (saved) {
      setComposerNotice({
        tone: "success",
        text: "Draft saved to your recent composer drafts.",
      });
    }
  }

  function openComposer(mode: FeedComposerMode = "update") {
    setComposerOpen(true);
    setComposerMode(mode);
  }

  function restoreRecentDraft(draft: ComposerDraftSnapshot) {
    setComposerOpen(true);
    setEditingPostId(null);
    setComposerMode(draft.mode);
    setComposerText(draft.text);
    setComposerAttachments(draft.attachments);
    setComposerMediaLayout(draft.mediaLayout ?? "collage");
    setComposerNotice({
      tone: "info",
      text: "Draft restored. Review it and publish when ready.",
    });
  }

  function removeRecentDraft(draftId: string) {
    setRecentComposerDrafts((current) => current.filter((draft) => draft.id !== draftId));
  }

  async function handleMediaAction() {
    openComposer("media");
    setComposerNotice(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "video/*"],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled) {
      setComposerNotice({
        tone: "info",
        text: "Media selection canceled. You can still post a text-only update.",
      });
      return;
    }

    const nextAttachments = await Promise.all(
      result.assets.map((asset) => buildAttachmentFromAsset(asset)),
    );
    const mergedAttachments = [...composerAttachments, ...nextAttachments].slice(0, 6);
    setComposerAttachments(mergedAttachments);
    const imageCount = mergedAttachments.filter((attachment) => attachment.kind === "image").length;
    if (imageCount > 1 && !mergedAttachments.some((attachment) => attachment.kind === "video")) {
      setComposerMediaLayout("collage");
    } else {
      setComposerMediaLayout("scroll");
    }
    setComposerText((current) =>
      current.trim() ? current : "Sharing a fresh visual update from my mobile workspace.",
    );
    setComposerNotice({
      tone: "success",
      text:
        nextAttachments.length > 1
          ? `${nextAttachments.length} media files are attached. Compression and upload are optimizing in the background.`
          : "Media is attached. Compression and upload are optimizing in the background.",
    });
  }

  function handleAiDraft() {
    openComposer("ai");

    const nextDraft = `Quick update: I am open to senior product design work across the UK and remote Europe, with recent focus areas in ${parsedResume.skills
      .slice(0, 3)
      .join(", ")}. Excited to connect with teams building trusted hiring, payments, and marketplace experiences.`;

    setComposerText((current) => (current.trim() ? current : nextDraft));
    setComposerAttachments([]);
    setComposerMediaLayout("collage");
    setComposerNotice({
      tone: "info",
      text: "AI draft generated. Tweak the wording, then publish it to your feed.",
    });
  }

  function handlePostUpdate() {
    const body = composerText.trim();
    const hasVideoAttachment = composerAttachments.some((attachment) => attachment.kind === "video");

    if (!body && !composerAttachments.length) {
      setComposerNotice({
        tone: "error",
        text: "Add a message or attach media before posting.",
      });
      return;
    }

    if (hasVideoAttachment && uploadStage !== "ready") {
      setComposerNotice({
        tone: "info",
        text: "Video is still processing for low-bandwidth upload. Wait a moment, then publish.",
      });
      return;
    }

    const nextId = `post-${Date.now()}`;
    const nextBody =
      body ||
      (workerMode === "gig"
        ? "Open for fast dispatches and short-notice work today."
        : "Sharing a fresh update from my mobile workspace.");
    const nextTags =
      composerMode === "ai"
        ? ["AI draft", "Open to work"]
        : composerMode === "media"
          ? workerMode === "gig"
            ? ["Media update", "Available now"]
            : ["Media update", "Portfolio"]
          : workerMode === "gig"
            ? ["Instant hire", "Shift ready"]
            : ["Career update", "BEJELI"];

    if (editingPostId) {
      let updatedPost: Extract<FeedItem, { kind: "post" }> | null = null;

      setFeedItems((current) =>
        current.map((item) =>
          item.kind === "post" && item.id === editingPostId
            ? (updatedPost = {
                ...item,
                body: nextBody,
                tags: nextTags,
                attachments: composerAttachments.length ? composerAttachments : undefined,
                mediaLayout: composerAttachments.length ? composerMediaLayout : undefined,
                edited: true,
                time: "Just now",
              })
            : item,
        ),
      );
      if (token && updatedPost) {
        void upsertSyncedFeedPost(token, mapMobilePostToSyncedPost(updatedPost));
      }
      setComposerNotice({
        tone: "success",
        text: "Post updated.",
      });
      setEditingPostId(null);
      setComposerOpen(false);
      resetComposer();
      return;
    }

    const nextPost: Extract<FeedItem, { kind: "post" }> = {
      kind: "post",
      id: nextId,
      channel: composerAttachments.some((attachment) => attachment.kind === "video")
        ? "Showcase"
        : "Work",
      author: {
        id: me.id,
        name: viewerProfile.name,
        title: viewerTitle,
        company: "BEJELI",
        location: viewerProfile.location,
        avatar: viewerAvatarSource,
      },
      time: "Just now",
      body: nextBody,
      tags: nextTags,
      likes: 0,
      comments: 0,
      attachments: composerAttachments.length ? composerAttachments : undefined,
      mediaLayout: composerAttachments.length ? composerMediaLayout : undefined,
    };

    setFeedItems((current) => [nextPost, ...current]);
    if (token) {
      void upsertSyncedFeedPost(token, mapMobilePostToSyncedPost(nextPost));
    }
    setCommentCounts((current) => ({ ...current, [nextId]: 0 }));
    setCommentsByPost((current) => ({ ...current, [nextId]: [] }));
    setCommentDrafts((current) => ({ ...current, [nextId]: "" }));
    setCommentsOpen((current) => ({ ...current, [nextId]: false }));
    setComposerOpen(false);
    resetComposer();
  }

  function removePostLocally(postId: string) {
    setFeedItems((current) => current.filter((item) => item.id !== postId));
    setCounts((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setLikedIds((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setCommentCounts((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setCommentsByPost((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setCommentDrafts((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setCommentsOpen((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setSharedIds((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });

    if (editingPostId === postId) {
      setComposerOpen(false);
      resetComposer();
    }
  }

  function toggleComments(postId: string) {
    setCommentsOpen((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function submitComment(item: Extract<FeedItem, { kind: "post" }>) {
    const text = commentDrafts[item.id]?.trim();

    if (!text) {
      return;
    }

    const nextComment: FeedComment = {
      id: `${item.id}-comment-${Date.now()}`,
      authorName: viewerProfile.name,
      text,
      time: "Just now",
      isMe: true,
    };

    setCommentsByPost((current) => ({
      ...current,
      [item.id]: [...(current[item.id] ?? []), nextComment],
    }));
    setCommentDrafts((current) => ({ ...current, [item.id]: "" }));
    setCommentCounts((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? item.comments) + 1,
    }));
    setCommentsOpen((current) => ({ ...current, [item.id]: true }));
  }

  function toggleShare(postId: string) {
    setSharedIds((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function handleEditPost(item: Extract<FeedItem, { kind: "post" }>) {
    setEditingPostId(item.id);
    setComposerOpen(true);
    setComposerText(item.body);
    setComposerAttachments(item.attachments ?? []);
    setComposerMediaLayout(item.mediaLayout ?? "collage");
    setComposerMode(
      item.attachments?.length
        ? "media"
        : item.tags.some((tag) => tag.toLowerCase().includes("ai"))
          ? "ai"
          : "update",
    );
    setComposerNotice({
      tone: "info",
      text: "Editing your post. Save when you are done.",
    });
  }

  function handleDeletePost(postId: string) {
    Alert.alert("Delete post?", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removePostLocally(postId);

          if (token) {
            void deleteSyncedFeedPost(token, postId);
          }
        },
      },
    ]);
  }

  function handleApplyToMatch(matchId: string) {
    setAppliedMatchIds((current) => ({ ...current, [matchId]: true }));
    onOpenJobs();
  }

  function handleReferForRole(hiringId: string) {
    setReferredHiringIds((current) => ({ ...current, [hiringId]: true }));
  }

  function handleViewRole(hiringId: string) {
    setViewedHiringIds((current) => ({ ...current, [hiringId]: true }));
    onOpenJobs();
  }

  useEffect(() => {
    if (!shortPosts.length) {
      if (activeShortIndex !== 0) {
        setActiveShortIndex(0);
      }
      return;
    }

    if (activeShortIndex > shortPosts.length - 1) {
      setActiveShortIndex(shortPosts.length - 1);
    }
  }, [activeShortIndex, shortPosts.length]);

  function toggleShortMute(postId: string) {
    setShortsMutedIds((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function toggleShortPlayback(postId: string) {
    setPausedShortIds((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function likeShort(postId: string, fallbackLikes: number) {
    const alreadyLiked = likedIds[postId] ?? false;

    if (alreadyLiked) {
      return;
    }

    setLikedIds((current) => ({ ...current, [postId]: true }));
    setCounts((current) => ({
      ...current,
      [postId]: (current[postId] ?? fallbackLikes) + 1,
    }));
  }

  async function shareShort(item: Extract<FeedItem, { kind: "post" }>) {
    try {
      const result = await Share.share({
        message: `${item.author.name} · ${item.author.title}\n\n${item.body}\n\n${item.tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ")}`,
      });

      if (result.action === Share.sharedAction) {
        setSharedIds((current) => ({ ...current, [item.id]: true }));
      }
    } catch {
      Alert.alert("Share unavailable", "This short could not be shared right now.");
    }
  }

  function openCommentSheet(postId: string) {
    setCommentSheetPostId(postId);
  }

  function closeCommentSheet() {
    setCommentSheetPostId(null);
  }

  function handleOpenShortMenu(item: Extract<FeedItem, { kind: "post" }>) {
    if (item.author.id === me.id) {
      Alert.alert(item.author.name, "Manage this short.", [
        {
          text: "Edit",
          onPress: () => handleEditPost(item),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeletePost(item.id),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
      return;
    }

    Alert.alert(item.author.name, "Choose an action.", [
      {
        text: sharedIds[item.id] ? "Share again" : "Share",
        onPress: () => {
          void shareShort(item);
        },
      },
      {
        text: "Comments",
        onPress: () => openCommentSheet(item.id),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }

  useEffect(() => {
    onPlaybackStateChange({
      paused: activeShortPaused,
      hasVideo: activeShortHasVideo,
    });
  }, [activeShortHasVideo, activeShortPaused, onPlaybackStateChange]);

  return (
    <View style={styles.careerShortsScreen}>
      <AnimatedEntrance enterKey={`feed-shell-${shortsMode}`} index={0} style={styles.flexOne}>
        <View style={styles.careerShortsShell}>
          <View
            style={styles.careerShortsPagerShell}
            onLayout={(event) => setShortsViewportHeight(event.nativeEvent.layout.height)}
          >
            {shortPosts.length ? (
              <ScrollView
                pagingEnabled
                decelerationRate="fast"
                disableIntervalMomentum
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                snapToInterval={shortsViewportHeight || undefined}
                snapToAlignment="start"
                contentContainerStyle={styles.careerShortsPagerContent}
                onMomentumScrollEnd={(event) => {
                  if (!shortsViewportHeight) {
                    return;
                  }

                  const nextIndex = Math.round(
                    event.nativeEvent.contentOffset.y / shortsViewportHeight,
                  );
                  const boundedIndex = Math.max(0, Math.min(shortPosts.length - 1, nextIndex));

                  if (boundedIndex !== activeShortIndex) {
                    setActiveShortIndex(boundedIndex);
                  }
                }}
              >
                {shortPosts.map((item, index) => {
                  const liked = likedIds[item.id] ?? Boolean(item.liked);
                  const likeCount = counts[item.id] ?? item.likes;
                  const commentCount = commentCounts[item.id] ?? item.comments;
                  const shared = Boolean(sharedIds[item.id]);
                  const insight = shortDiscoveryEntries[index];

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.careerShortsSlide,
                        { height: shortsViewportHeight || 1 },
                      ]}
                    >
                      <CareerShortCard
                        item={item}
                        active={index === activeShortIndex}
                        paused={Boolean(pausedShortIds[item.id])}
                        liked={liked}
                        likeCount={likeCount}
                        commentCount={commentCount}
                        shared={shared}
                        muted={shortsMutedIds[item.id] ?? false}
                        onTogglePlayback={() => toggleShortPlayback(item.id)}
                        onToggleMute={() => toggleShortMute(item.id)}
                        onLike={() => likeShort(item.id, item.likes)}
                        onComment={() => openCommentSheet(item.id)}
                        onShare={() => {
                          void shareShort(item);
                        }}
                        onOpenMenu={() => handleOpenShortMenu(item)}
                        onOpenCreatorProfile={() => onOpenCreatorProfile(item.author)}
                        onOpenJobs={onOpenJobs}
                        recommendationScore={insight?.recommendationScore ?? 0}
                        recommendationNote={insight?.meta.note ?? ""}
                        recommendationSector={insight?.meta.sector ?? "Product"}
                        recommendationRating={insight?.meta.rating ?? 4.5}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.careerShortsEmptyState}>
                <Text style={styles.careerShortsEmptyTitle}>No shorts yet</Text>
                <Text style={styles.careerShortsEmptyText}>
                  Create the first short or switch back once your synced feed loads.
                </Text>
              </View>
            )}
          </View>
          <View style={styles.careerShortsHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.careerShortsEyebrow}>
                {workerMode === "gig" ? "READY TO WORK NOW" : "FOR YOUR NEXT MOVE"}
              </Text>
              <Text style={styles.careerShortsTitle}>
                {workerMode === "gig" ? "ShiftShorts" : "CareerShorts"}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.careerShortsModePill,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={() =>
                setShortsMode((current) => (current === "curated" ? "latest" : "curated"))
              }
            >
              <Ionicons name="sparkles-outline" size={14} color="#dbe4ff" />
              <Text style={styles.careerShortsModeText}>
                {shortsMode === "curated" ? "Curated" : "Latest"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.discoveryFilterDock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryFilterRow}>
              {discoveryLocationOptions.map((option) => (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.discoveryChip,
                    discoveryLocation === option && styles.discoveryChipActive,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => setDiscoveryLocation(option)}
                >
                  <Text
                    style={[
                      styles.discoveryChipText,
                      discoveryLocation === option && styles.discoveryChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
              {discoverySectorOptions.map((option) => (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.discoveryChip,
                    discoverySector === option && styles.discoveryChipActive,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => setDiscoverySector(option)}
                >
                  <Text
                    style={[
                      styles.discoveryChipText,
                      discoverySector === option && styles.discoveryChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
              {discoveryRatingOptions.map((option) => (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.discoveryChip,
                    discoveryRating === option && styles.discoveryChipActive,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => setDiscoveryRating(option)}
                >
                  <Text
                    style={[
                      styles.discoveryChipText,
                      discoveryRating === option && styles.discoveryChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.discoveryActionChip,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={workerMode === "gig" ? onOpenAvailability : onOpenResume}
              >
                <Ionicons
                  name={workerMode === "gig" ? "calendar-outline" : "document-text-outline"}
                  size={14}
                  color="#dbeafe"
                />
                <Text style={styles.discoveryActionChipText}>
                  {workerMode === "gig" ? "Availability" : "Resume"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </AnimatedEntrance>

      <Modal
        visible={composerOpen}
        transparent
        animationType="slide"
        onRequestClose={closeComposer}
      >
        <View style={styles.shortSheetBackdrop}>
          <SafeAreaView style={styles.shortSheetSafeArea}>
            <View style={styles.shortSheetCard}>
              <View style={styles.shortSheetHeader}>
                <View style={styles.flexOne}>
                  <Text style={styles.shortSheetTitle}>
                    {editingPostId ? "Edit short" : "Create short"}
                  </Text>
                  <Text style={styles.shortSheetSubtitle}>
                    Keep it visual, direct, and ready for autoplay in the feed.
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.shortSheetClose,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={closeComposer}
                >
                  <Feather name="x" size={18} color={colors.ink} />
                </Pressable>
              </View>

              {recentComposerDrafts.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shortDraftRow}
                >
                  {recentComposerDrafts.map((draft) => (
                    <Pressable
                      key={draft.id}
                      style={({ pressed }) => [
                        styles.shortDraftCard,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() => restoreRecentDraft(draft)}
                    >
                      <Text style={styles.shortDraftTitle}>
                        {draft.mode === "ai"
                          ? "AI draft"
                          : draft.mode === "media"
                            ? "Media draft"
                            : "Update draft"}
                      </Text>
                      <Text style={styles.shortDraftText} numberOfLines={2}>
                        {draft.text ||
                          `${draft.attachments.length} media item${draft.attachments.length === 1 ? "" : "s"}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              <View style={styles.composeInputWrap}>
                <TextInput
                  style={styles.composeInput}
                  placeholder="Tell the story behind this short."
                  placeholderTextColor="#64748b"
                  multiline
                  value={composerText}
                  onChangeText={setComposerText}
                  textAlignVertical="top"
                />
              </View>

              {composerAttachments.length ? (
                <View style={styles.stack10}>
                  <FeedMediaGallery
                    attachments={composerAttachments}
                    layout={composerMediaLayout}
                    preview
                  />
                  {composerAttachments.filter((attachment) => attachment.kind === "image").length > 1 &&
                  !composerAttachments.some((attachment) => attachment.kind === "video") ? (
                    <View style={styles.mediaLayoutSwitcher}>
                      {(["collage", "scroll"] as FeedMediaLayout[]).map((layout) => {
                        const selected = composerMediaLayout === layout;

                        return (
                          <Pressable
                            key={layout}
                            style={({ pressed }) => [
                              styles.mediaLayoutChip,
                              selected && styles.mediaLayoutChipActive,
                              pressed && styles.pressablePressedSoft,
                            ]}
                            onPress={() => setComposerMediaLayout(layout)}
                          >
                            <Text
                              style={[
                                styles.mediaLayoutChipText,
                                selected && styles.mediaLayoutChipTextActive,
                              ]}
                            >
                              {layout === "collage" ? "Collage" : "Scrollable"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {composerAttachments.some((attachment) => attachment.kind === "video") ? (
                <View style={styles.videoEngineCard}>
                  <View style={styles.titleRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.sectionHeadingCompact}>Short-form video engine</Text>
                      <Text style={styles.metaText}>
                        Compression, filter pass, and upload queue stay optimized for lower bandwidth.
                      </Text>
                    </View>
                    <Badge
                      tone="indigo"
                      label={
                        uploadStage === "ready"
                          ? "Ready"
                          : uploadStage.charAt(0).toUpperCase() + uploadStage.slice(1)
                      }
                    />
                  </View>
                  <View style={styles.videoEngineStatsRow}>
                    <View style={styles.videoEngineStat}>
                      <Text style={styles.videoEngineStatLabel}>Source</Text>
                      <Text style={styles.videoEngineStatValue}>
                        {composerPayloadEstimate.rawPayload.toFixed(1)} MB
                      </Text>
                    </View>
                    <View style={styles.videoEngineStat}>
                      <Text style={styles.videoEngineStatLabel}>Optimized</Text>
                      <Text style={styles.videoEngineStatValue}>
                        {composerPayloadEstimate.optimizedPayload.toFixed(1)} MB
                      </Text>
                    </View>
                    <View style={styles.videoEngineStat}>
                      <Text style={styles.videoEngineStatLabel}>Progress</Text>
                      <Text style={styles.videoEngineStatValue}>{uploadProgress}%</Text>
                    </View>
                  </View>
                  <View style={styles.videoEngineProgressTrack}>
                    <View style={[styles.videoEngineProgressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                  <View style={styles.videoEngineOptionGroup}>
                    {([
                      ["balanced", "Balanced"],
                      ["low-data", "Low data"],
                      ["hd", "HD"],
                    ] as const).map(([value, label]) => (
                      <Pressable
                        key={value}
                        style={({ pressed }) => [
                          styles.videoEngineOption,
                          mediaCompressionPreset === value && styles.videoEngineOptionActive,
                          pressed && styles.pressablePressedSoft,
                        ]}
                        onPress={() => setMediaCompressionPreset(value)}
                      >
                        <Text
                          style={[
                            styles.videoEngineOptionText,
                            mediaCompressionPreset === value && styles.videoEngineOptionTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.videoEngineOptionGroup}>
                    {([
                      ["clarity", "Clarity"],
                      ["warm", "Warm"],
                      ["mono", "Mono"],
                      ["none", "None"],
                    ] as const).map(([value, label]) => (
                      <Pressable
                        key={value}
                        style={({ pressed }) => [
                          styles.videoEngineOption,
                          mediaFilterTone === value && styles.videoEngineOptionActive,
                          pressed && styles.pressablePressedSoft,
                        ]}
                        onPress={() => setMediaFilterTone(value)}
                      >
                        <Text
                          style={[
                            styles.videoEngineOptionText,
                            mediaFilterTone === value && styles.videoEngineOptionTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.lowBandwidthRow,
                      uploadNetworkMode === "low-bandwidth" && styles.lowBandwidthRowActive,
                      pressed && styles.pressablePressedSoft,
                    ]}
                    onPress={() =>
                      setUploadNetworkMode((current) =>
                        current === "low-bandwidth" ? "standard" : "low-bandwidth",
                      )
                    }
                  >
                    <Ionicons
                      name={uploadNetworkMode === "low-bandwidth" ? "cellular-outline" : "wifi-outline"}
                      size={16}
                      color={uploadNetworkMode === "low-bandwidth" ? "#1d4ed8" : colors.inkMuted}
                    />
                    <Text style={styles.lowBandwidthText}>
                      {uploadNetworkMode === "low-bandwidth"
                        ? "Low-bandwidth mode on"
                        : "Standard network mode"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {composerNotice ? (
                <View
                  style={[
                    styles.messageCard,
                    composerNotice.tone === "error"
                      ? styles.errorCard
                      : composerNotice.tone === "success"
                        ? styles.successCard
                        : styles.profileInfoCard,
                  ]}
                >
                  <Text
                    style={[
                      styles.profileInfoText,
                      composerNotice.tone === "error" && styles.errorText,
                      composerNotice.tone === "success" && styles.successText,
                    ]}
                  >
                    {composerNotice.text}
                  </Text>
                </View>
              ) : null}

              <View style={styles.shortComposerActionRow}>
                <SmallGhostAction
                  icon={<Feather name="image" size={15} color={colors.success} />}
                  label="Media"
                  onPress={() => void handleMediaAction()}
                />
                <SmallGhostAction
                  icon={<Ionicons name="sparkles-outline" size={15} color={colors.brandDark} />}
                  label="AI draft"
                  onPress={handleAiDraft}
                />
              </View>

              <View style={styles.gridButtons}>
                <Button
                  label={editingPostId ? "Save changes" : "Post short"}
                  size="sm"
                  onPress={handlePostUpdate}
                  icon={<Feather name="send" size={14} color="#fff" />}
                />
                <Button
                  label="Save draft"
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    if (saveCurrentDraftToRecent()) {
                      setComposerNotice({
                        tone: "success",
                        text: "Draft saved to your recent list.",
                      });
                    }
                  }}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <ShortCommentsSheet
        post={commentSheetPostId ? shortPosts.find((item) => item.id === commentSheetPostId) ?? null : null}
        viewerAvatarSource={viewerAvatarSource}
        commentsByPost={commentsByPost}
        draftValue={commentSheetPostId ? commentDrafts[commentSheetPostId] ?? "" : ""}
        onChangeDraft={(value) => {
          if (!commentSheetPostId) {
            return;
          }

          setCommentDrafts((current) => ({ ...current, [commentSheetPostId]: value }));
        }}
        onClose={closeCommentSheet}
        onSubmit={(post) => {
          submitComment(post);
          closeCommentSheet();
        }}
      />
    </View>
  );
}

function CareerShortCard({
  item,
  active,
  paused,
  endorsed = false,
  liked,
  likeCount,
  commentCount,
  shared,
  muted,
  recommendationScore,
  recommendationNote,
  recommendationSector,
  recommendationRating,
  onTogglePlayback,
  onToggleMute,
  onEndorse,
  onPromptEndorse,
  onLike,
  onComment,
  onShare,
  onOpenMenu,
  onOpenCreatorProfile,
  onOpenJobs,
}: {
  item: Extract<FeedItem, { kind: "post" }>;
  active: boolean;
  paused: boolean;
  endorsed?: boolean;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shared: boolean;
  muted: boolean;
  recommendationScore: number;
  recommendationNote: string;
  recommendationSector: Exclude<DiscoverySectorFilter, "All">;
  recommendationRating: number;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onEndorse?: () => void;
  onPromptEndorse?: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onOpenMenu: () => void;
  onOpenCreatorProfile: () => void;
  onOpenJobs: () => void;
}) {
  const attachments = item.attachments ?? [];
  const primaryAttachment =
    attachments.find((attachment) => attachment.kind === "video") ?? attachments[0] ?? null;
  const hasVideo = primaryAttachment?.kind === "video";
  const imageCount = attachments.filter((attachment) => attachment.kind === "image").length;
  const topicLabel = (item.tags[0] ?? "Career story").toUpperCase();
  const calloutLabel =
    item.tags.find((tag) => /hiring|open|portfolio|role/i.test(tag)) ??
    (item.body.toLowerCase().includes("hiring") ? "Hiring now" : "Open related role");

  return (
    <View style={styles.careerShortCard}>
      <View style={styles.careerShortMediaWrap}>
        <CareerShortStageMedia
          attachment={primaryAttachment}
          active={active}
          paused={paused}
          muted={muted}
          onDoubleTapLike={onLike}
          onLongPressStage={onPromptEndorse}
          onTogglePlayback={onTogglePlayback}
        />
        <View style={styles.careerShortStageScrim} />

        <View style={styles.careerShortTopRow}>
          <View style={styles.careerShortTopicBadge}>
            <Text style={styles.careerShortTopicText}>{topicLabel}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.careerShortMenuButton,
              pressed && styles.pressablePressedSoft,
            ]}
            onPress={onOpenMenu}
          >
            <Feather name="more-horizontal" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.careerShortBottomOverlay}>
          <View style={styles.careerShortTextColumn}>
            <Pressable
              style={({ pressed }) => [
                styles.careerShortAuthorPressable,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={onOpenCreatorProfile}
            >
              <Avatar source={item.author.avatar} size={36} ring />
              <View style={styles.flexOne}>
                <View style={styles.inlineRow}>
                  <Text style={styles.careerShortAuthorName}>{item.author.name}</Text>
                  <Text style={styles.careerShortAuthorMeta}>· {item.time}</Text>
                </View>
                <Text style={styles.careerShortAuthorRole}>{item.author.title}</Text>
              </View>
            </Pressable>

            <Text style={styles.careerShortCaption} numberOfLines={4}>
              {item.body}
            </Text>

            <View style={styles.careerShortMetaRow}>
              <View style={styles.careerShortRecommendationRow}>
                <Badge tone="indigo" label={`${recommendationScore}% match`} />
                <Badge tone="emerald" label={`${recommendationSector} · ${recommendationRating.toFixed(1)}★`} />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.careerShortCallout,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onOpenJobs}
              >
                <View style={styles.careerShortCalloutDot} />
                <Text style={styles.careerShortCalloutText}>{calloutLabel}</Text>
              </Pressable>
              {attachments.length > 1 ? (
                <Text style={styles.careerShortAttachmentHint}>
                  +{attachments.length - 1} more {hasVideo ? "clips" : imageCount > 1 ? "visuals" : "slides"}
                </Text>
              ) : null}
              {recommendationNote ? (
                <Text style={styles.careerShortRecommendationText}>{recommendationNote}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.careerShortActionRail}>
            {onEndorse ? (
              <Pressable
                style={({ pressed }) => [
                  styles.careerShortActionButton,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onEndorse}
              >
                <MaterialCommunityIcons
                  name={endorsed ? "thumb-up" : "thumb-up-outline"}
                  size={22}
                  color={endorsed ? "#60a5fa" : "#fff"}
                />
                <Text style={styles.careerShortActionText}>
                  {endorsed ? "Endorsed" : "Endorse"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.careerShortActionButton,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={onLike}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? "#ff5f8f" : "#fff"}
              />
              <Text style={styles.careerShortActionText}>{likeCount}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.careerShortActionButton,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={onComment}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
              <Text style={styles.careerShortActionText}>{commentCount}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.careerShortActionButton,
                pressed && styles.pressablePressedSoft,
              ]}
              onPress={onShare}
            >
              <Feather name="share" size={20} color="#fff" />
              <Text style={styles.careerShortActionText}>{shared ? "Sent" : "Share"}</Text>
            </Pressable>
            {hasVideo ? (
              <Pressable
                style={({ pressed }) => [
                  styles.careerShortActionButton,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onTogglePlayback}
              >
                <Ionicons
                  name={paused ? "play" : "pause"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.careerShortActionText}>{paused ? "Play" : "Pause"}</Text>
              </Pressable>
            ) : null}
            {hasVideo ? (
              <Pressable
                style={({ pressed }) => [
                  styles.careerShortActionButton,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onToggleMute}
              >
                <Ionicons
                  name={muted ? "volume-mute-outline" : "volume-high-outline"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.careerShortActionText}>{muted ? "Muted" : "Sound"}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function CareerShortStageMedia({
  attachment,
  active,
  paused,
  muted,
  onDoubleTapLike,
  onLongPressStage,
  onTogglePlayback,
}: {
  attachment: FeedAttachment | null;
  active: boolean;
  paused: boolean;
  muted: boolean;
  onDoubleTapLike: () => void;
  onLongPressStage?: () => void;
  onTogglePlayback: () => void;
}) {
  const source = attachment ? resolveAttachmentSource(attachment) : null;
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoSource = useMemo(
    () => resolveVideoSource(attachment),
    [attachment?.fileName, attachment?.kind, attachment?.uri],
  );
  const lastTapRef = useRef(0);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.keepScreenOnWhilePlaying = true;
  });

  useEffect(() => {
    setHasRenderedFrame(false);
    setVideoReady(false);
  }, [attachment?.id, attachment?.uri]);

  useEffect(
    () => () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    safelyControlVideoPlayer(player, (instance) => {
      instance.loop = true;
      instance.muted = muted;
      instance.keepScreenOnWhilePlaying = true;
    });
  }, [muted, player]);

  useEffect(() => {
    let cancelled = false;

    if (!videoSource) {
      setVideoReady(false);
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    setVideoReady(false);
    safelyControlVideoPlayer(player, (instance) => {
      instance.pause();
      instance.currentTime = 0;
    });

    void safelyReplaceVideoPlayerSource(player, videoSource)
      .then(() => {
        if (cancelled) {
          return;
        }

        setVideoReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setVideoReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [player, videoSource]);

  useEffect(() => {
    if (!videoSource || !videoReady || !active || paused) {
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    safelyControlVideoPlayer(player, (instance) => {
      instance.play();
    });
  }, [active, paused, player, videoReady, videoSource]);

  function handleStageTap() {
    const now = Date.now();

    if (lastTapRef.current && now - lastTapRef.current < 240) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }

      lastTapRef.current = 0;
      onDoubleTapLike();
      return;
    }

    lastTapRef.current = now;
    singleTapTimeoutRef.current = setTimeout(() => {
      onTogglePlayback();
      singleTapTimeoutRef.current = null;
      lastTapRef.current = 0;
    }, 240);
  }

  if (videoSource) {
    return (
      <Pressable
        style={styles.careerShortStageMedia}
        onPress={handleStageTap}
        onLongPress={onLongPressStage}
        delayLongPress={360}
      >
        {source && !hasRenderedFrame ? (
          <Image source={source} style={styles.careerShortStageImage} />
        ) : null}
        <VideoView
          player={player}
          style={styles.careerShortStageVideo}
          contentFit="cover"
          nativeControls={false}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          onFirstFrameRender={() => setHasRenderedFrame(true)}
        />
        {paused ? (
          <View style={styles.careerShortPausedBadge}>
            <Ionicons name="play" size={26} color="#fff" />
          </View>
        ) : null}
      </Pressable>
    );
  }

  if (source) {
    return (
      <Pressable
        style={styles.careerShortStageMedia}
        onLongPress={onLongPressStage}
        delayLongPress={360}
      >
        <Image source={source} style={styles.careerShortStageImage} />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.careerShortStageMedia, styles.careerShortStageFallback]}
      onLongPress={onLongPressStage}
      delayLongPress={360}
    />
  );
}

function ShortCommentsSheet({
  post,
  viewerAvatarSource,
  commentsByPost,
  draftValue,
  onChangeDraft,
  onClose,
  onSubmit,
}: {
  post: Extract<FeedItem, { kind: "post" }> | null;
  viewerAvatarSource: ImageSourcePropType;
  commentsByPost: Record<string, FeedComment[]>;
  draftValue: string;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSubmit: (post: Extract<FeedItem, { kind: "post" }>) => void;
}) {
  const comments = post ? commentsByPost[post.id] ?? [] : [];

  return (
    <Modal visible={Boolean(post)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.shortSheetBackdrop}>
        <SafeAreaView style={styles.shortSheetSafeArea}>
          <View style={styles.shortSheetCard}>
            <View style={styles.shortSheetHeader}>
              <View style={styles.flexOne}>
                <Text style={styles.shortSheetTitle}>Comments</Text>
                <Text style={styles.shortSheetSubtitle}>
                  {post ? `${comments.length} repl${comments.length === 1 ? "y" : "ies"}` : ""}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.shortSheetClose,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={onClose}
              >
                <Feather name="x" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView style={styles.shortSheetScroll} showsVerticalScrollIndicator={false}>
              {comments.length ? (
                <View style={styles.commentList}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentRow}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentBubble}>
                        <View style={styles.inlineRow}>
                          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                          <Text style={styles.metaText}>· {comment.time}</Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Start the conversation on this short.</Text>
              )}
            </ScrollView>

            {post ? (
              <>
                <View style={styles.commentComposer}>
                  <Avatar source={viewerAvatarSource} size={32} />
                  <View style={styles.commentComposerInputWrap}>
                    <TextInput
                      style={styles.commentComposerInput}
                      placeholder="Add a thoughtful reply..."
                      placeholderTextColor="#64748b"
                      multiline
                      value={draftValue}
                      onChangeText={onChangeDraft}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
                <View style={styles.commentComposerActions}>
                  <Button label="Send" size="sm" onPress={() => onSubmit(post)} />
                </View>
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function FeedMediaGallery({
  attachments,
  layout,
  preview = false,
  autoplayVideos = false,
}: {
  attachments: FeedAttachment[];
  layout: FeedMediaLayout;
  preview?: boolean;
  autoplayVideos?: boolean;
}) {
  const visibleAttachments = attachments.slice(0, 4);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const viewerAttachment = viewerIndex !== null ? attachments[viewerIndex] : null;
  const viewerSource = viewerAttachment ? resolveAttachmentSource(viewerAttachment) : null;

  if (!visibleAttachments.length) {
    return null;
  }

  function closeViewer() {
    setViewerIndex(null);
  }

  function stepViewer(direction: "previous" | "next") {
    if (viewerIndex === null || attachments.length <= 1) {
      return;
    }

    setViewerIndex((current) => {
      if (current === null) {
        return current;
      }

      if (direction === "previous") {
        return current === 0 ? attachments.length - 1 : current - 1;
      }

      return current === attachments.length - 1 ? 0 : current + 1;
    });
  }

  const renderMediaTile = (
    attachment: FeedAttachment,
    style: object,
    overlayCount?: number,
    originalIndex?: number,
  ) => {
    const source = resolveAttachmentSource(attachment);
    const isVideo = attachment.kind === "video";
    const tileContent = (
      <>
        {isVideo ? (
          <FeedVideoTile
            attachment={attachment}
            preview={preview}
            autoplay={autoplayVideos && !preview}
          />
        ) : source ? (
          <Image source={source} style={styles.galleryImage} />
        ) : (
          <View style={[styles.galleryFallback, styles.galleryFallbackImage]} />
        )}
        <View
          style={[
            styles.galleryOverlay,
            isVideo ? styles.galleryOverlayVideo : styles.galleryOverlayImage,
          ]}
        >
          {isVideo ? (
            <View style={styles.galleryPlayBadge}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          ) : null}
          <View style={styles.galleryMeta}>
            <Text style={styles.galleryMetaLabel}>
              {isVideo
                ? "Video post"
                : `${attachments.filter((item) => item.kind === "image").length} photo${attachments.filter((item) => item.kind === "image").length > 1 ? "s" : ""}`}
              {attachment.sizeLabel ? ` · ${attachment.sizeLabel}` : ""}
            </Text>
            <Text style={styles.galleryMetaTitle} numberOfLines={1}>
              {isVideo
                ? preview
                  ? "Tap play after posting"
                  : "Tap to open video"
                : preview
                  ? "Choose how the gallery should appear"
                  : "Tap to view full image"}
            </Text>
          </View>
          {overlayCount ? (
            <View style={styles.galleryMoreBadge}>
              <Text style={styles.galleryMoreBadgeText}>+{overlayCount}</Text>
            </View>
          ) : null}
        </View>
      </>
    );

    return (
      <Pressable
        key={attachment.id}
        style={({ pressed }) => [
          styles.galleryTile,
          style,
          pressed && !preview && styles.pressablePressedSoft,
        ]}
        onPress={() => {
          if (preview || typeof originalIndex !== "number") {
            return;
          }

          setViewerIndex(originalIndex);
        }}
        disabled={preview || typeof originalIndex !== "number"}
      >
        {tileContent}
      </Pressable>
    );
  };

  const galleryContent =
    layout === "scroll" && visibleAttachments.length > 1 ? (
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryCarouselRow}
      >
        {visibleAttachments.map((attachment, index) =>
          renderMediaTile(attachment, styles.galleryCarouselTile, undefined, index),
        )}
      </ScrollView>
    ) : visibleAttachments.length === 1 ? (
      <View style={styles.galleryFrame}>
        {renderMediaTile(visibleAttachments[0], styles.galleryHeroTile, undefined, 0)}
      </View>
    ) : visibleAttachments.length === 2 ? (
      <View style={[styles.galleryFrame, styles.galleryRow]}>
        {visibleAttachments.map((attachment, index) =>
          renderMediaTile(attachment, styles.galleryHalfTile, undefined, index),
        )}
      </View>
    ) : visibleAttachments.length === 3 ? (
      <View style={styles.galleryFrame}>
        {renderMediaTile(visibleAttachments[0], styles.galleryHeroTile, undefined, 0)}
        <View style={[styles.galleryRow, styles.galleryLowerRow]}>
          {visibleAttachments.slice(1).map((attachment, index) =>
            renderMediaTile(attachment, styles.galleryHalfTileSmall, undefined, index + 1),
          )}
        </View>
      </View>
    ) : (
      <View style={styles.galleryFrame}>
        <View style={styles.galleryRow}>
          {renderMediaTile(visibleAttachments[0], styles.galleryHalfTile, undefined, 0)}
          {renderMediaTile(visibleAttachments[1], styles.galleryHalfTile, undefined, 1)}
        </View>
        <View style={[styles.galleryRow, styles.galleryLowerRow]}>
          {renderMediaTile(visibleAttachments[2], styles.galleryHalfTileSmall, undefined, 2)}
          {renderMediaTile(
            visibleAttachments[3],
            styles.galleryHalfTileSmall,
            attachments.length > 4 ? attachments.length - 4 : undefined,
            3,
          )}
        </View>
      </View>
    );

  return (
    <>
      {galleryContent}
      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View style={styles.mediaViewerBackdrop}>
          <SafeAreaView style={styles.mediaViewerSafeArea}>
            <View style={styles.mediaViewerHeader}>
              <Text style={styles.mediaViewerCounter}>
                {viewerIndex !== null ? `${viewerIndex + 1} of ${attachments.length}` : ""}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.mediaViewerClose,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={closeViewer}
              >
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.mediaViewerStage}>
              {viewerAttachment?.kind === "video" ? (
                <MediaViewerVideo
                  key={viewerAttachment.id}
                  attachment={viewerAttachment}
                />
              ) : viewerSource ? (
                <Image
                  source={viewerSource}
                  style={styles.mediaViewerImage}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.galleryFallback,
                    styles.galleryFallbackImage,
                    styles.mediaViewerFallback,
                  ]}
                />
              )}
            </View>

            {attachments.length > 1 ? (
              <View style={styles.mediaViewerNavRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.mediaViewerNavButton,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => stepViewer("previous")}
                >
                  <Feather name="chevron-left" size={18} color="#fff" />
                  <Text style={styles.mediaViewerNavText}>Previous</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.mediaViewerNavButton,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => stepViewer("next")}
                >
                  <Text style={styles.mediaViewerNavText}>Next</Text>
                  <Feather name="chevron-right" size={18} color="#fff" />
                </Pressable>
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function FeedVideoTile({
  attachment,
  preview = false,
  autoplay = false,
}: {
  attachment: FeedAttachment;
  preview?: boolean;
  autoplay?: boolean;
}) {
  const posterSource = resolveAttachmentSource(attachment);
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoSource = useMemo(
    () => resolveVideoSource(attachment),
    [attachment.fileName, attachment.kind, attachment.uri],
  );
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.keepScreenOnWhilePlaying = false;
  });

  useEffect(() => {
    setHasRenderedFrame(false);
    setVideoReady(false);
  }, [attachment.uri]);

  useEffect(() => {
    safelyControlVideoPlayer(player, (instance) => {
      instance.loop = true;
      instance.muted = true;
      instance.keepScreenOnWhilePlaying = false;
    });
  }, [player]);

  useEffect(() => {
    let cancelled = false;

    if (!videoSource) {
      setVideoReady(false);
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    setVideoReady(false);
    safelyControlVideoPlayer(player, (instance) => {
      instance.pause();
      instance.currentTime = 0;
    });

    void safelyReplaceVideoPlayerSource(player, videoSource)
      .then(() => {
        if (cancelled) {
          return;
        }

        setVideoReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setVideoReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [player, videoSource]);

  useEffect(() => {
    if (!videoSource || !videoReady || preview || !autoplay) {
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    safelyControlVideoPlayer(player, (instance) => {
      instance.play();
    });
  }, [autoplay, player, preview, videoReady, videoSource]);

  return (
    <View style={styles.flexOne}>
      {posterSource && !hasRenderedFrame ? (
        <Image source={posterSource} style={styles.galleryImage} />
      ) : (
        <View style={[styles.galleryFallback, styles.galleryFallbackVideo]} />
      )}
      {videoSource ? (
        <VideoView
          player={player}
          style={styles.galleryVideo}
          contentFit="cover"
          nativeControls={false}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
          onFirstFrameRender={() => setHasRenderedFrame(true)}
        />
      ) : null}
      {!preview ? <View style={styles.galleryVideoScrim} /> : null}
    </View>
  );
}

function MediaViewerVideo({
  attachment,
}: {
  attachment: FeedAttachment;
}) {
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const posterSource = resolveAttachmentSource(attachment);
  const videoSource = useMemo(
    () => resolveVideoSource(attachment),
    [attachment.fileName, attachment.kind, attachment.uri],
  );
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.keepScreenOnWhilePlaying = true;
  });

  useEffect(() => {
    setHasRenderedFrame(false);
    setVideoReady(false);
  }, [attachment.uri]);

  useEffect(() => {
    safelyControlVideoPlayer(player, (instance) => {
      instance.loop = false;
      instance.muted = false;
      instance.keepScreenOnWhilePlaying = true;
    });
  }, [player]);

  useEffect(() => {
    let cancelled = false;

    if (!videoSource) {
      setVideoReady(false);
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    setVideoReady(false);
    safelyControlVideoPlayer(player, (instance) => {
      instance.pause();
      instance.currentTime = 0;
    });

    void safelyReplaceVideoPlayerSource(player, videoSource)
      .then(() => {
        if (cancelled) {
          return;
        }

        setVideoReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setVideoReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [player, videoSource]);

  useEffect(() => {
    if (!videoSource || !videoReady) {
      safelyControlVideoPlayer(player, (instance) => {
        instance.pause();
        instance.currentTime = 0;
      });
      return;
    }

    safelyControlVideoPlayer(player, (instance) => {
      instance.play();
    });
  }, [player, videoReady, videoSource]);

  return (
    <View style={styles.mediaViewerCard}>
      <View style={styles.mediaViewerPreview}>
        {posterSource && !hasRenderedFrame ? (
          <Image
            source={posterSource}
            style={styles.mediaViewerImage}
            resizeMode="contain"
          />
        ) : null}
        {videoSource ? (
          <VideoView
            player={player}
            style={styles.mediaViewerVideo}
            contentFit="contain"
            nativeControls
            allowsPictureInPicture
            surfaceType={Platform.OS === "android" ? "textureView" : undefined}
            onFirstFrameRender={() => setHasRenderedFrame(true)}
          />
        ) : (
          <View
            style={[
              styles.galleryFallback,
              styles.galleryFallbackVideo,
              styles.mediaViewerFallback,
            ]}
          />
        )}
      </View>
      <Text style={styles.mediaViewerTitle}>Video post</Text>
      <Text style={styles.mediaViewerText}>
        Playback starts here automatically and native controls stay available for a closer review.
      </Text>
      <View style={styles.gridButtons}>
        <Button
          label="Open video"
          size="sm"
          onPress={() => {
            if (!attachment.uri) {
              return;
            }

            void (async () => {
              const opened = await openAttachmentInSystemViewer(attachment.uri);

              if (!opened) {
                Alert.alert(
                  "Unable to open video",
                  "This video could not be opened from its current device location.",
                );
              }
            })();
          }}
        />
      </View>
    </View>
  );
}

function MatchCard({
  item,
  onOpenJobs,
  onApply,
  applied,
}: {
  item: Extract<FeedItem, { kind: "match" }>;
  onOpenJobs: () => void;
  onApply: () => void;
  applied: boolean;
}) {
  return (
    <Card noPadding>
      <View style={styles.matchHeader}>
        <Ionicons name="sparkles-outline" size={14} color={colors.brand} />
        <Text style={styles.matchHeaderText}>High-confidence match</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.rowGap12}>
          <View style={styles.flexOne}>
            <Text style={styles.sectionCardTitle}>{item.role}</Text>
            <Text style={styles.metaText}>{item.company}</Text>
            <View style={styles.stack8}>
              <InlineMeta icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />} text={item.location} />
              <InlineMeta icon={<MaterialCommunityIcons name="cash-multiple" size={14} color={colors.inkMuted} />} text={item.salary} />
            </View>
          </View>
          <MatchRing score={item.score} size={58} />
        </View>
        <View style={styles.stack10}>
          {item.reasons.map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
        <View style={styles.gridButtons}>
          <Button
            label={applied ? "Applied" : "Apply now"}
            size="sm"
            onPress={onApply}
            icon={applied ? <Ionicons name="checkmark" size={14} color="#fff" /> : undefined}
          />
          <Button label="All matches" size="sm" variant="outline" onPress={onOpenJobs} icon={<Feather name="arrow-right" size={14} color={colors.ink} />} />
        </View>
        {applied ? (
          <View style={styles.feedInlineBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.feedInlineBannerText}>Application queued. Review the role in Jobs.</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function HiringCard({
  item,
  onRefer,
  onViewRole,
  referred,
  viewed,
}: {
  item: Extract<FeedItem, { kind: "hiring" }>;
  onRefer: () => void;
  onViewRole: () => void;
  referred: boolean;
  viewed: boolean;
}) {
  return (
    <Card>
      <View style={styles.rowGap12}>
        <Avatar source={item.author.avatar} size={44} />
        <View style={styles.flexOne}>
          <Text style={styles.metaText}>
            <Text style={styles.cardAuthor}>{item.author.name}</Text> is hiring · {item.time}
          </Text>
          <View style={styles.innerPanel}>
            <View style={styles.titleRow}>
              <Text style={styles.innerPanelTitle}>{item.role}</Text>
              <Badge tone="emerald" label={`${item.seats} seats`} />
            </View>
            <Text style={styles.bodyTextSmall}>{item.note}</Text>
            <View style={styles.gridButtons}>
              <Button
                label={referred ? "Referred" : "Refer"}
                size="sm"
                onPress={onRefer}
                icon={referred ? <Ionicons name="checkmark" size={14} color="#fff" /> : undefined}
              />
              <Button
                label={viewed ? "Role open" : "View role"}
                size="sm"
                variant="outline"
                onPress={onViewRole}
              />
            </View>
            {referred || viewed ? (
              <View style={styles.feedInlineBanner}>
                <Ionicons
                  name={referred ? "people-circle" : "briefcase-outline"}
                  size={16}
                  color={referred ? colors.success : colors.brandDark}
                />
                <Text style={styles.feedInlineBannerText}>
                  {referred
                    ? `Referral note prepared for ${item.author.name}.`
                    : "Role opened in Jobs for a full review."}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

function JobsScreen({
  workerMode,
  availabilityMatrix,
  bookedDispatchIds,
  onOpenAvailability,
  onToggleDispatchBooking,
}: {
  workerMode: WorkerMode;
  availabilityMatrix: AvailabilityMatrix;
  bookedDispatchIds: string[];
  onOpenAvailability: () => void;
  onToggleDispatchBooking: (dispatchId: string) => void;
}) {
  const professionalFilters = ["All", "Full-time", "Contract", "Remote"] as const;
  const professionalSortOptions = ["Best match", "Newest", "Salary"] as const;
  const gigFilters = ["All", "Today", "Care", "Logistics"] as const;
  const gigSortOptions = ["Best dispatch", "Soonest", "Highest pay"] as const;
  const [active, setActive] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>(
    workerMode === "gig" ? "Best dispatch" : "Best match",
  );
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  useEffect(() => {
    setActive("All");
    setSortBy(workerMode === "gig" ? "Best dispatch" : "Best match");
  }, [workerMode]);

  const list = useMemo(() => {
    if (workerMode === "gig") {
      const todayLabel = availabilityDays[(new Date().getDay() + 6) % 7];
      let visible = gigDispatches
        .filter((dispatch) => !hiddenIds.includes(dispatch.id))
        .map((dispatch) => ({
          ...dispatch,
          available: Boolean(availabilityMatrix[buildAvailabilityKey(dispatch.day, dispatch.hour)]),
        }));

      if (active === "Today") {
        visible = visible.filter((dispatch) => dispatch.day === todayLabel);
      } else if (active === "Care" || active === "Logistics") {
        visible = visible.filter((dispatch) => dispatch.sector === active);
      }

      if (showSavedOnly) {
        visible = visible.filter((dispatch) => savedIds.includes(dispatch.id));
      }

      if (showAppliedOnly) {
        visible = visible.filter((dispatch) => bookedDispatchIds.includes(dispatch.id));
      }

      const sorted = [...visible];

      if (sortBy === "Soonest") {
        sorted.sort((left, right) => left.hour - right.hour);
        return sorted;
      }

      if (sortBy === "Highest pay") {
        sorted.sort((left, right) => right.ratingRequired - left.ratingRequired);
        return sorted;
      }

      sorted.sort((left, right) => Number(right.available) - Number(left.available) || right.ratingRequired - left.ratingRequired);
      return sorted;
    }

    let visible = jobs.filter((job) => !hiddenIds.includes(job.id));

    if (active === "Remote") {
      visible = visible.filter((job) => job.location.toLowerCase().includes("remote"));
    } else if (active !== "All") {
      visible = visible.filter((job) => job.type === active);
    }

    if (showSavedOnly) {
      visible = visible.filter((job) => savedIds.includes(job.id));
    }

    if (showAppliedOnly) {
      visible = visible.filter((job) => appliedIds.includes(job.id));
    }

    const sorted = [...visible];

    if (sortBy === "Newest") {
      sorted.sort((left, right) => left.posted.localeCompare(right.posted));
      return sorted;
    }

    if (sortBy === "Salary") {
      sorted.sort((left, right) => right.salary.localeCompare(left.salary));
      return sorted;
    }

    sorted.sort((left, right) => right.score - left.score);
    return sorted;
  }, [
    active,
    appliedIds,
    availabilityMatrix,
    bookedDispatchIds,
    hiddenIds,
    savedIds,
    showAppliedOnly,
    showSavedOnly,
    sortBy,
    workerMode,
  ]);
  const availableHoursCount = Object.values(availabilityMatrix).filter(Boolean).length;
  const filterOptions = workerMode === "gig" ? gigFilters : professionalFilters;
  const sortOptions = workerMode === "gig" ? gigSortOptions : professionalSortOptions;

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="jobs-intro" index={0}>
        <SectionIntro
          eyebrow={workerMode === "gig" ? "Instant dispatch" : "AI matches"}
          title={workerMode === "gig" ? "Shifts that fit your live availability" : "Roles that fit you"}
          subtitle={
            workerMode === "gig"
              ? "Hour-by-hour availability, one-tap booking, and fast local dispatch."
              : "Scored from your CV, skills and network."
          }
          action={
            <IconBubble
              onPress={() => setOptionsOpen((current) => !current)}
              accessibilityLabel={
                workerMode === "gig"
                  ? "Open shift dispatch options"
                  : "Open job match options"
              }
            >
              <Ionicons name="options-outline" size={18} color={colors.inkMuted} />
            </IconBubble>
          }
        />
      </AnimatedEntrance>

      {workerMode === "gig" ? (
        <AnimatedEntrance enterKey="gig-dispatch-summary" index={1}>
          <Card style={styles.dispatchSummaryCard}>
            <View style={styles.titleRow}>
              <View style={styles.flexOne}>
                <Text style={styles.sectionHeadingCompact}>Availability matrix</Text>
                <Text style={styles.metaText}>
                  {availableHoursCount} live hour{availableHoursCount === 1 ? "" : "s"} open for instant booking.
                </Text>
              </View>
              <Button
                label="Open matrix"
                size="sm"
                variant="outline"
                onPress={onOpenAvailability}
              />
            </View>
            <View style={styles.dispatchSummaryStats}>
              <View style={styles.dispatchSummaryPill}>
                <Text style={styles.dispatchSummaryPillLabel}>Booked</Text>
                <Text style={styles.dispatchSummaryPillValue}>{bookedDispatchIds.length}</Text>
              </View>
              <View style={styles.dispatchSummaryPill}>
                <Text style={styles.dispatchSummaryPillLabel}>Saved</Text>
                <Text style={styles.dispatchSummaryPillValue}>{savedIds.length}</Text>
              </View>
              <View style={styles.dispatchSummaryPill}>
                <Text style={styles.dispatchSummaryPillLabel}>Ready now</Text>
                <Text style={styles.dispatchSummaryPillValue}>
                  {availableHoursCount > 0 ? "Yes" : "Add hours"}
                </Text>
              </View>
            </View>
          </Card>
        </AnimatedEntrance>
      ) : null}

      {optionsOpen ? (
        <AnimatedEntrance enterKey="jobs-options" index={workerMode === "gig" ? 2 : 1}>
          <Card style={styles.jobsOptionsCard}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionHeadingCompact}>
                {workerMode === "gig" ? "Dispatch options" : "Match options"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.inlineActionPill,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={() => {
                  setSortBy(workerMode === "gig" ? "Best dispatch" : "Best match");
                  setShowSavedOnly(false);
                  setShowAppliedOnly(false);
                }}
              >
                <Text style={styles.inlineActionPillText}>Reset</Text>
              </Pressable>
            </View>
            <Text style={styles.metaText}>
              {workerMode === "gig"
                ? "Sort live shift dispatches and focus on saved or booked slots."
                : "Sort the feed and focus only on saved or applied roles."}
            </Text>
            <View style={styles.tagRow}>
              {sortOptions.map((option) => {
                const selected = option === sortBy;

                return (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      pressed && styles.pressablePressedSoft,
                    ]}
                    onPress={() => setSortBy(option)}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.jobsOptionsToggleRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.jobsOptionsToggle,
                  showSavedOnly && styles.jobsOptionsToggleActive,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={() => setShowSavedOnly((current) => !current)}
              >
                <Ionicons
                  name={showSavedOnly ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={showSavedOnly ? "#fff" : colors.brandDark}
                />
                <Text
                  style={[
                    styles.jobsOptionsToggleText,
                    showSavedOnly && styles.jobsOptionsToggleTextActive,
                  ]}
                >
                  Saved only
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.jobsOptionsToggle,
                  showAppliedOnly && styles.jobsOptionsToggleActive,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={() => setShowAppliedOnly((current) => !current)}
              >
                <Ionicons
                  name={showAppliedOnly ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={16}
                  color={showAppliedOnly ? "#fff" : colors.brandDark}
                />
                <Text
                  style={[
                    styles.jobsOptionsToggleText,
                    showAppliedOnly && styles.jobsOptionsToggleTextActive,
                  ]}
                >
                  {workerMode === "gig" ? "Booked only" : "Applied only"}
                </Text>
              </Pressable>
            </View>
          </Card>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance enterKey={`jobs-filters-${active}`} index={workerMode === "gig" ? 3 : 1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterOptions.map((filter) => {
            const selected = filter === active;

            return (
              <Pressable
                key={filter}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  pressed && styles.pressablePressedSoft,
                ]}
                onPress={() => setActive(filter)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AnimatedEntrance>

      {list.length === 0 ? (
        <AnimatedEntrance enterKey={`jobs-empty-${active}`} index={workerMode === "gig" ? 4 : 2}>
          <Card>
            <Text style={styles.emptyText}>
              {workerMode === "gig"
                ? "No dispatches match this filter right now."
                : "No roles match this filter right now."}
            </Text>
          </Card>
        </AnimatedEntrance>
      ) : null}

      {list.map((job, index) => {
        if (workerMode === "gig") {
          const dispatch = job as GigDispatch & { available: boolean };
          const booked = bookedDispatchIds.includes(dispatch.id);
          const saved = savedIds.includes(dispatch.id);

          return (
            <AnimatedEntrance key={dispatch.id} enterKey={`jobs-${active}-${workerMode}`} index={index + 5}>
              <Card>
                <View style={styles.rowGap12}>
                  <View style={[styles.logoTile, { backgroundColor: dispatch.sector === "Care" ? "#dcfce7" : "#e0e7ff" }]}>
                    <Text style={styles.logoText}>
                      {dispatch.sector === "Care" ? "CR" : "LG"}
                    </Text>
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.titleRow}>
                      <View style={styles.flexOne}>
                        <Text style={styles.sectionCardTitle}>{dispatch.title}</Text>
                        <Text style={styles.metaText}>
                          {dispatch.company} · {dispatch.day} {formatAvailabilityHour(dispatch.hour)}
                        </Text>
                      </View>
                      <Badge
                        tone={dispatch.available ? "emerald" : "slate"}
                        label={dispatch.available ? "Ready now" : "Closed slot"}
                      />
                    </View>
                    <View style={styles.stack8}>
                      <InlineMeta icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />} text={dispatch.location} />
                      <InlineMeta icon={<MaterialCommunityIcons name="cash-multiple" size={14} color={colors.inkMuted} />} text={`${dispatch.pay} · ${dispatch.durationHours}h`} />
                    </View>
                  </View>
                </View>
                <View style={styles.tagRow}>
                  <Badge tone="indigo" label={`${dispatch.sector} dispatch`} />
                  <Badge tone="emerald" label={`${dispatch.ratingRequired.toFixed(1)}★ minimum`} />
                </View>
                <View style={styles.gridButtonsTight}>
                  <Button
                    label={
                      booked
                        ? "Booked"
                        : dispatch.available
                          ? "Instant book"
                          : "Open slot"
                    }
                    size="sm"
                    onPress={
                      dispatch.available
                        ? () => onToggleDispatchBooking(dispatch.id)
                        : onOpenAvailability
                    }
                  />
                  <Button
                    label={saved ? "Saved" : "Save"}
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      setSavedIds((current) =>
                        current.includes(dispatch.id)
                          ? current.filter((id) => id !== dispatch.id)
                          : [...current, dispatch.id],
                      )
                    }
                  />
                  <Button
                    label="Hide"
                    size="sm"
                    variant="ghost"
                    onPress={() => setHiddenIds((current) => [...current, dispatch.id])}
                  />
                </View>
              </Card>
            </AnimatedEntrance>
          );
        }

        const applied = appliedIds.includes((job as Job).id);
        const saved = savedIds.includes((job as Job).id);

        return (
          <AnimatedEntrance key={(job as Job).id} enterKey={`jobs-${active}-${workerMode}`} index={index + 2}>
            <Card>
              <View style={styles.rowGap12}>
                <View style={[styles.logoTile, { backgroundColor: (job as Job).logoBg }]}>
                  <Text style={styles.logoText}>{(job as Job).logoText}</Text>
                </View>
                <View style={styles.flexOne}>
                  <View style={styles.titleRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.sectionCardTitle}>{(job as Job).role}</Text>
                      <Text style={styles.metaText}>
                        {(job as Job).company} · {(job as Job).posted}
                      </Text>
                    </View>
                    <MatchRing score={(job as Job).score} size={50} />
                  </View>
                  <View style={styles.stack8}>
                    <InlineMeta icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />} text={(job as Job).location} />
                    <InlineMeta icon={<MaterialCommunityIcons name="cash-multiple" size={14} color={colors.inkMuted} />} text={(job as Job).salary} />
                  </View>
                </View>
              </View>
              <View style={styles.tagRow}>
                {(job as Job).reasons.slice(0, 2).map((reason) => (
                  <Badge key={reason} tone="emerald" label={reason} icon={<Ionicons name="checkmark-circle" size={12} color={colors.success} />} />
                ))}
              </View>
              <View style={styles.gridButtonsTight}>
                <Button
                  label={applied ? "Applied" : "Apply"}
                  size="sm"
                  onPress={() =>
                    setAppliedIds((current) =>
                      current.includes((job as Job).id)
                        ? current
                        : [...current, (job as Job).id],
                    )
                  }
                />
                <Button
                  label={saved ? "Saved" : "Save"}
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    setSavedIds((current) =>
                      current.includes((job as Job).id)
                        ? current.filter((id) => id !== (job as Job).id)
                        : [...current, (job as Job).id],
                    )
                  }
                />
                <Button
                  label="Hide"
                  size="sm"
                  variant="ghost"
                  onPress={() => setHiddenIds((current) => [...current, (job as Job).id])}
                />
              </View>
            </Card>
          </AnimatedEntrance>
        );
      })}
    </ScreenScroll>
  );
}

function NetworkScreen() {
  const network = [...people, ...people.map((person) => ({ ...person, id: `${person.id}-b` }))];
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="network-intro" index={0}>
        <SectionIntro eyebrow="Your people" title="Grow your network" subtitle="People with shared skills, employers and geography." />
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="network-stats" index={1}>
        <View style={styles.statGrid}>
          {[
            { label: "Connections", value: `${me.connections}` },
            { label: "In cluster", value: "148" },
            { label: "New this week", value: "9" },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </Card>
          ))}
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="network-title" index={2}>
        <Text style={styles.sectionHeading}>Suggested for you</Text>
      </AnimatedEntrance>
      {network.map((person, index) => {
        const connected = connectedIds.includes(person.id);

        return (
          <AnimatedEntrance key={person.id} enterKey="network-card" index={index + 3}>
            <Card>
              <View style={styles.rowGap12}>
                <Avatar source={person.avatar} size={52} />
                <View style={styles.flexOne}>
                  <Text style={styles.cardAuthor}>{person.name}</Text>
                  <Text style={styles.metaText}>{person.title}</Text>
                  <InlineMeta icon={<Feather name="map-pin" size={13} color={colors.inkMuted} />} text={`${person.location} · ${person.mutuals} mutual`} />
                </View>
                <Button
                  label={connected ? "Connected" : "Connect"}
                  size="sm"
                  variant={connected ? "primary" : "outline"}
                  onPress={() =>
                    setConnectedIds((current) =>
                      connected ? current.filter((id) => id !== person.id) : [...current, person.id],
                    )
                  }
                />
              </View>
            </Card>
          </AnimatedEntrance>
        );
      })}
    </ScreenScroll>
  );
}

function SearchScreen({
  onBack,
  onNavigate,
  workerMode,
}: {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
  workerMode: WorkerMode;
}) {
  const [query, setQuery] = useState("");

  const quickActions: Array<{
    id: string;
    label: string;
    description: string;
    route: AppRoute;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      id: "qa-jobs",
      label: workerMode === "gig" ? "Live dispatches" : "Role matches",
      description:
        workerMode === "gig"
          ? "Open your fastest shift and task matches"
          : "Open your strongest job fits",
      route: "jobs",
      icon: workerMode === "gig" ? "flash-outline" : "sparkles-outline",
    },
    { id: "qa-network", label: "People", description: "Browse your recommended network", route: "network", icon: "people-outline" },
    { id: "qa-profile", label: "Profile", description: "Jump to your public profile hub", route: "profile", icon: "person-outline" },
    {
      id: "qa-availability",
      label: workerMode === "gig" ? "Availability" : "Resume",
      description:
        workerMode === "gig"
          ? "Update open hours for instant booking"
          : "Review your parsed CV summary",
      route: workerMode === "gig" ? "availability" : "resume",
      icon: workerMode === "gig" ? "calendar-outline" : "document-text-outline",
    },
  ];

  const results = useMemo<SearchResult[]>(() => {
    const baseResults: SearchResult[] = [
      ...jobs.map((job) => ({
        id: `job-${job.id}`,
        kind: "job" as const,
        title: job.role,
        subtitle: `${job.company} · ${job.location}`,
        detail: `${job.salary} · ${job.score}% match`,
        route: "jobs" as const,
        icon: "sparkles-outline" as const,
      })),
      ...people.map((person) => ({
        id: `person-${person.id}`,
        kind: "person" as const,
        title: person.name,
        subtitle: `${person.title} · ${person.company}`,
        detail: `${person.location} · ${person.mutuals ?? 0} mutuals`,
        route: "network" as const,
        icon: "people-outline" as const,
      })),
      ...feed.map((item) => {
        if (item.kind === "match") {
          return {
            id: `post-${item.id}`,
            kind: "post" as const,
            title: item.role,
            subtitle: `${item.company} · ${item.location}`,
            detail: item.reasons[0],
            route: "feed" as const,
            icon: "newspaper-outline" as const,
          };
        }

        if (item.kind === "hiring") {
          return {
            id: `post-${item.id}`,
            kind: "post" as const,
            title: item.role,
            subtitle: `${item.author.name} is hiring`,
            detail: item.note,
            route: "feed" as const,
            icon: "megaphone-outline" as const,
          };
        }

        return {
          id: `post-${item.id}`,
          kind: "post" as const,
          title: item.author.name,
          subtitle: item.tags.join(" · "),
          detail: item.body,
          route: "feed" as const,
          icon: "chatbubble-ellipses-outline" as const,
        };
      }),
    ];

    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return baseResults.slice(0, 6);
    }

    return baseResults.filter((item) =>
      [item.title, item.subtitle, item.detail].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="search-intro" index={0}>
        <SectionIntro
          eyebrow="Search"
          title={workerMode === "gig" ? "Find shifts, people and local demand" : "Find roles, people and signals"}
          subtitle={
            workerMode === "gig"
              ? "Search across live dispatches, nearby teams and feed activity."
              : "Search across your matches, network and feed activity."
          }
          action={
            <Button
              label="Back"
              size="sm"
              variant="outline"
              onPress={onBack}
              icon={<Feather name="arrow-left" size={14} color={colors.ink} />}
            />
          }
        />
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="search-box" index={1}>
        <Card>
          <LabeledInput
            label="Search BEJELI"
            icon={<Feather name="search" size={18} color={colors.inkMuted} />}
            value={query}
            onChangeText={setQuery}
            placeholder={
              workerMode === "gig"
                ? "Search shifts, sectors, locations, or people"
                : "Search roles, companies, skills, or people"
            }
            autoCapitalize="none"
          />
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="search-quick-actions" index={2}>
        <Card>
          <Text style={styles.sectionHeading}>Quick access</Text>
          <View style={styles.stack10}>
            {quickActions.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.utilityRow, pressed && styles.pressablePressedSoft]}
                onPress={() => onNavigate(item.route)}
              >
                <View style={styles.utilityRowIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.brand} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.utilityRowTitle}>{item.label}</Text>
                  <Text style={styles.utilityRowText}>{item.description}</Text>
                </View>
                <Feather name="arrow-right" size={16} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey={`search-results-${query || "default"}`} index={3}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Results</Text>
            <Text style={styles.metaText}>{results.length}</Text>
          </View>

          {results.length === 0 ? (
            <Text style={styles.emptyText}>No matches found for that search yet.</Text>
          ) : (
            <View style={styles.stack10}>
              {results.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.utilityRow, pressed && styles.pressablePressedSoft]}
                  onPress={() => onNavigate(item.route)}
                >
                  <View style={styles.utilityRowIcon}>
                    <Ionicons name={item.icon} size={18} color={colors.brand} />
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={styles.utilityRowTitle}>{item.title}</Text>
                    <Text style={styles.utilityRowText}>{item.subtitle}</Text>
                    <Text style={styles.utilityRowMeta}>{item.detail}</Text>
                  </View>
                  <Badge
                    label={
                      item.kind === "job"
                        ? "Role"
                        : item.kind === "person"
                          ? "Person"
                          : "Feed"
                    }
                  />
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function AvailabilityScreen({
  availabilityMatrix,
  bookedDispatchIds,
  workerMode,
  onBack,
  onToggleSlot,
  onToggleDispatchBooking,
}: {
  availabilityMatrix: AvailabilityMatrix;
  bookedDispatchIds: string[];
  workerMode: WorkerMode;
  onBack: () => void;
  onToggleSlot: (day: string, hour: number) => void;
  onToggleDispatchBooking: (dispatchId: string) => void;
}) {
  const availableHoursCount = Object.values(availabilityMatrix).filter(Boolean).length;
  const matchedDispatches = gigDispatches.filter((dispatch) =>
    availabilityMatrix[buildAvailabilityKey(dispatch.day, dispatch.hour)],
  );

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="availability-intro" index={0}>
        <SectionIntro
          eyebrow={workerMode === "gig" ? "Availability matrix" : "Flexible work"}
          title="Open hours and instant booking"
          subtitle="Toggle open hours in one tap and surface only dispatches that match your real-time schedule."
          action={
            <Button
              label="Back"
              size="sm"
              variant="outline"
              onPress={onBack}
              icon={<Feather name="arrow-left" size={14} color={colors.ink} />}
            />
          }
        />
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="availability-summary" index={1}>
        <Card style={styles.availabilitySummaryCard}>
          <View style={styles.dispatchSummaryStats}>
            <View style={styles.dispatchSummaryPill}>
              <Text style={styles.dispatchSummaryPillLabel}>Open hours</Text>
              <Text style={styles.dispatchSummaryPillValue}>{availableHoursCount}</Text>
            </View>
            <View style={styles.dispatchSummaryPill}>
              <Text style={styles.dispatchSummaryPillLabel}>Matched dispatches</Text>
              <Text style={styles.dispatchSummaryPillValue}>{matchedDispatches.length}</Text>
            </View>
            <View style={styles.dispatchSummaryPill}>
              <Text style={styles.dispatchSummaryPillLabel}>Booked</Text>
              <Text style={styles.dispatchSummaryPillValue}>{bookedDispatchIds.length}</Text>
            </View>
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="availability-grid" index={2}>
        <Card>
          <Text style={styles.sectionHeading}>Hour-by-hour matrix</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.availabilityTable}>
              <View style={styles.availabilityHeaderRow}>
                <View style={styles.availabilityTimeCell} />
                {availabilityDays.map((day) => (
                  <View key={day} style={styles.availabilityDayHeader}>
                    <Text style={styles.availabilityDayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>
              {availabilityHours.map((hour) => (
                <View key={hour} style={styles.availabilityRow}>
                  <View style={styles.availabilityTimeCell}>
                    <Text style={styles.availabilityTimeText}>{formatAvailabilityHour(hour)}</Text>
                  </View>
                  {availabilityDays.map((day) => {
                    const selected = Boolean(availabilityMatrix[buildAvailabilityKey(day, hour)]);

                    return (
                      <Pressable
                        key={`${day}-${hour}`}
                        style={({ pressed }) => [
                          styles.availabilitySlot,
                          selected && styles.availabilitySlotActive,
                          pressed && styles.pressablePressedSoft,
                        ]}
                        onPress={() => onToggleSlot(day, hour)}
                      >
                        <Text
                          style={[
                            styles.availabilitySlotText,
                            selected && styles.availabilitySlotTextActive,
                          ]}
                        >
                          {selected ? "Open" : "Off"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="availability-dispatches" index={3}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Instant book queue</Text>
            <Badge tone="indigo" label={`${matchedDispatches.length} matched`} />
          </View>
          {matchedDispatches.length === 0 ? (
            <Text style={styles.emptyText}>
              Open a few hours above and instant-book dispatches will appear here.
            </Text>
          ) : (
            <View style={styles.stack10}>
              {matchedDispatches.map((dispatch) => {
                const booked = bookedDispatchIds.includes(dispatch.id);

                return (
                  <View key={dispatch.id} style={styles.dispatchQueueRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.utilityRowTitle}>{dispatch.title}</Text>
                      <Text style={styles.utilityRowText}>
                        {dispatch.company} · {dispatch.location}
                      </Text>
                      <Text style={styles.utilityRowMeta}>
                        {dispatch.day} {formatAvailabilityHour(dispatch.hour)} · {dispatch.pay}
                      </Text>
                    </View>
                    <Button
                      label={booked ? "Booked" : "Instant book"}
                      size="sm"
                      onPress={() => onToggleDispatchBooking(dispatch.id)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function NotificationsScreen({
  notifications,
  unreadNotifications,
  onBack,
  onOpenNotification,
  onToggleRead,
  onMarkAllRead,
}: {
  notifications: NotificationItem[];
  unreadNotifications: number;
  onBack: () => void;
  onOpenNotification: (item: NotificationItem) => void;
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="notifications-intro" index={0}>
        <SectionIntro
          eyebrow="Notifications"
          title="Stay on top of momentum"
          subtitle="Review profile activity, role signals and workflow updates."
          action={
            <Button
              label="Back"
              size="sm"
              variant="outline"
              onPress={onBack}
              icon={<Feather name="arrow-left" size={14} color={colors.ink} />}
            />
          }
        />
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="notifications-summary" index={1}>
        <Card>
          <View style={styles.titleRow}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionHeading}>Inbox</Text>
              <Text style={styles.metaText}>
                {unreadNotifications > 0
                  ? `${unreadNotifications} unread updates`
                  : "Everything is up to date"}
              </Text>
            </View>
            <Button
              label="Mark all read"
              size="sm"
              variant="outline"
              onPress={onMarkAllRead}
            />
          </View>
        </Card>
      </AnimatedEntrance>

      {notifications.map((item, index) => (
        <AnimatedEntrance key={item.id} enterKey="notification-card" index={index + 2}>
          <Card style={item.unread ? styles.notificationCardUnread : undefined}>
            <Pressable
              style={({ pressed }) => [styles.notificationPressable, pressed && styles.pressablePressedSoft]}
              onPress={() => onOpenNotification(item)}
            >
              <View style={styles.utilityRowIcon}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.unread ? colors.brand : colors.inkMuted}
                />
              </View>
              <View style={styles.flexOne}>
                <View style={styles.titleRow}>
                  <Text style={styles.utilityRowTitle}>{item.title}</Text>
                  <Text style={styles.metaText}>{item.time}</Text>
                </View>
                <Text style={styles.utilityRowText}>{item.body}</Text>
                <View style={styles.notificationActions}>
                  <Pressable
                    style={({ pressed }) => [styles.inlineGhostAction, pressed && styles.pressablePressedGhost]}
                    onPress={() => onOpenNotification(item)}
                  >
                    <Text style={styles.inlineGhostActionText}>Open</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.inlineGhostAction, pressed && styles.pressablePressedGhost]}
                    onPress={() => onToggleRead(item.id)}
                  >
                    <Text style={styles.inlineGhostActionText}>
                      {item.unread ? "Mark read" : "Mark unread"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Card>
        </AnimatedEntrance>
      ))}
    </ScreenScroll>
  );
}

function CreatorProfileScreen({
  person,
  onBack,
}: {
  person: Person;
  onBack: () => void;
}) {
  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey={`creator-profile-${person.id}`} index={0}>
        <SectionIntro
          eyebrow="Creator profile"
          title={person.name}
          subtitle={`${person.title} at ${person.company}`}
          action={
            <Button
              label="Back"
              size="sm"
              variant="outline"
              onPress={onBack}
              icon={<Feather name="arrow-left" size={14} color={colors.ink} />}
            />
          }
        />
      </AnimatedEntrance>

      <AnimatedEntrance enterKey={`creator-profile-card-${person.id}`} index={1}>
        <Card>
          <View style={styles.creatorProfileHero}>
            <Avatar source={person.avatar} size={78} ring />
            <View style={styles.flexOne}>
              <Text style={styles.creatorProfileName}>{person.name}</Text>
              <Text style={styles.creatorProfileHeadline}>{person.title}</Text>
              <Text style={styles.metaText}>
                {person.company} · {person.location}
              </Text>
            </View>
          </View>
          <View style={styles.stack10}>
            <InlineMeta
              icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />}
              text={person.location}
            />
            <InlineMeta
              icon={<Ionicons name="people-outline" size={14} color={colors.inkMuted} />}
              text={`${person.mutuals} mutual connections`}
            />
            <InlineMeta
              icon={<Feather name="briefcase" size={14} color={colors.inkMuted} />}
              text={`${person.company} · Creative/product track`}
            />
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey={`creator-profile-about-${person.id}`} index={2}>
        <Card>
          <Text style={styles.sectionHeading}>About</Text>
          <Text style={styles.bodyText}>
            {person.name} shares portfolio-led career updates, visual process notes, and hiring-facing
            proof of work across BEJELI.
          </Text>
        </Card>
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function ProfileScreen({
  onOpenResume,
  onOpenAvailability,
  onSignedOut,
  workerMode,
  onSetWorkerMode,
  availabilityMatrix,
}: {
  onOpenResume: () => void;
  onOpenAvailability: () => void;
  onSignedOut: () => void;
  workerMode: WorkerMode;
  onSetWorkerMode: (mode: WorkerMode) => void;
  availabilityMatrix: AvailabilityMatrix;
}) {
  const { signOut, user } = useBussInAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<ProfileEditingSection | null>(null);
  const [profileDraft, setProfileDraft] = useState<MobileProfileDraft>(() =>
    buildInitialProfileDraft(user ?? undefined),
  );
  const [profileForm, setProfileForm] = useState<MobileProfileDraft>(() =>
    buildInitialProfileDraft(user ?? undefined),
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const profileAvatarSource = resolveProfileAvatarSource(profileDraft.avatarUri);
  const editingAvatarSource = resolveProfileAvatarSource(profileForm.avatarUri);
  const filteredSkillSuggestions = skillSuggestionPool
    .filter(
      (skill) =>
        !profileForm.skills.includes(skill) &&
        (!skillInput.trim() || skill.toLowerCase().includes(skillInput.trim().toLowerCase())),
    )
    .slice(0, 8);
  const availableHoursCount = Object.values(availabilityMatrix).filter(Boolean).length;

  useEffect(() => {
    let active = true;

    async function loadProfileDraft() {
      const stored = await AsyncStorage.getItem(mobileProfileStorageKey);

      if (!active || !stored) {
        return;
      }

      try {
        const parsed = JSON.parse(stored) as Partial<MobileProfileDraft>;
        const nextDraft = normalizeProfileDraft(parsed, user ?? undefined);

        setProfileDraft(nextDraft);
        setProfileForm(nextDraft);
      } catch {
        // Ignore malformed local profile data and fall back to defaults.
      }
    }

    void loadProfileDraft();

    return () => {
      active = false;
    };
  }, [user?.fullName]);

  function updateProfileForm<K extends keyof MobileProfileDraft>(
    key: K,
    value: MobileProfileDraft[K],
  ) {
    setProfileMessage("");
    setProfileForm((current) => ({ ...current, [key]: value }));
  }

  function beginEditing(section: ProfileEditingSection = "basics") {
    setProfileMessage("");
    if (!isEditing) {
      setProfileForm(profileDraft);
    }
    setSkillInput("");
    setIsEditing(true);
    setEditingSection(section);
  }

  function cancelEditing() {
    setProfileForm(profileDraft);
    setProfileMessage("");
    setSkillInput("");
    setIsEditing(false);
    setEditingSection(null);
  }

  async function pickProfilePhoto() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const nextAvatarUri = await readAssetAsDataUrl(asset.uri, asset.mimeType);
    setProfileMessage("");
    setProfileForm((current) => ({ ...current, avatarUri: nextAvatarUri ?? asset.uri }));
  }

  function addSkillFromValue(value: string) {
    const nextSkill = value.trim();

    if (!nextSkill) {
      return;
    }

    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      skills: current.skills.includes(nextSkill) ? current.skills : [...current.skills, nextSkill],
    }));
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      skills: current.skills.filter((entry) => entry !== skill),
    }));
  }

  function updateExperienceItem(
    id: string,
    key: keyof ProfileExperienceItem,
    value: string,
  ) {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      experience: current.experience.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addExperienceItem() {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: `experience-${Date.now()}`,
          role: "",
          company: "",
          period: "",
          impact: "",
        },
      ],
    }));
  }

  function removeExperienceItem(id: string) {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  }

  function updateEducationItem(
    id: string,
    key: keyof ProfileEducationItem,
    value: string,
  ) {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      education: current.education.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addEducationItem() {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: `education-${Date.now()}`,
          school: "",
          degree: "",
          period: "",
        },
      ],
    }));
  }

  function removeEducationItem(id: string) {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  }

  async function saveProfileDraft() {
    const nextExperience = profileForm.experience
      .map((item) => ({
        ...item,
        role: item.role.trim(),
        company: item.company.trim(),
        period: item.period.trim(),
        impact: item.impact.trim(),
      }))
      .filter((item) => item.role || item.company || item.period || item.impact);
    const nextEducation = profileForm.education
      .map((item) => ({
        ...item,
        school: item.school.trim(),
        degree: item.degree.trim(),
        period: item.period.trim(),
      }))
      .filter((item) => item.school || item.degree || item.period);
    const nextSkills = Array.from(
      new Set(profileForm.skills.map((skill) => skill.trim()).filter(Boolean)),
    );
    const nextDraft: MobileProfileDraft = {
      name: profileForm.name.trim(),
      headline: profileForm.headline.trim(),
      location: profileForm.location.trim(),
      avatarUri: profileForm.avatarUri,
      skills: nextSkills,
      experience: nextExperience,
      education: nextEducation,
    };

    if (!nextDraft.name || !nextDraft.headline || !nextDraft.location) {
      setProfileMessage("Add your name, headline, and location before saving.");
      return;
    }

    if (nextSkills.length === 0) {
      setProfileMessage("Add at least one skill before saving.");
      return;
    }

    if (
      nextExperience.some(
        (item) => !item.role || !item.company || !item.period || !item.impact,
      )
    ) {
      setProfileMessage("Complete every experience entry or remove incomplete ones.");
      return;
    }

    if (nextEducation.some((item) => !item.school || !item.degree || !item.period)) {
      setProfileMessage("Complete every education entry or remove incomplete ones.");
      return;
    }

    await AsyncStorage.setItem(mobileProfileStorageKey, JSON.stringify(nextDraft));
    setProfileDraft(nextDraft);
    setProfileForm(nextDraft);
    setProfileMessage("Profile updated.");
    setSkillInput("");
    setIsEditing(false);
    setEditingSection(null);
  }

  const editingBasics = isEditing && editingSection === "basics";
  const editingSkills = isEditing && editingSection === "skills";
  const editingExperience = isEditing && editingSection === "experience";
  const editingEducation = isEditing && editingSection === "education";

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="profile-hero" index={0}>
        <Card noPadding>
          <Image source={AVATARS.cover} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.profileCardBody}>
            <View style={styles.profileTopRow}>
              <View style={styles.profileAvatarBlock}>
                <Avatar source={profileAvatarSource} size={84} ring />
                {editingBasics ? (
                  <View style={styles.profileAvatarActions}>
                    <Text style={styles.profileAvatarHint}>Profile photo</Text>
                    <View style={styles.profileAvatarActionRow}>
                      <Button
                        label="Change photo"
                        size="sm"
                        variant="outline"
                        onPress={() => void pickProfilePhoto()}
                        icon={<Feather name="camera" size={14} color={colors.ink} />}
                      />
                      {profileForm.avatarUri ? (
                        <Button
                          label="Remove"
                          size="sm"
                          variant="ghost"
                          onPress={() =>
                            setProfileForm((current) => ({ ...current, avatarUri: undefined }))
                          }
                        />
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
              <Button
                label={editingBasics ? "Cancel edit" : "Edit basics"}
                size="sm"
                variant={editingBasics ? "ghost" : "outline"}
                onPress={editingBasics ? cancelEditing : () => beginEditing("basics")}
                icon={
                  <Feather
                    name={editingBasics ? "x" : "edit-2"}
                    size={14}
                    color={colors.ink}
                  />
                }
              />
            </View>
            <View style={styles.titleRowWrap}>
              <Text style={styles.profileName}>{profileDraft.name}</Text>
              <Badge tone="emerald" label="Open to work" icon={<Ionicons name="checkmark-circle" size={12} color={colors.success} />} />
            </View>
            <Text style={styles.bodyTextSmall}>{profileDraft.headline}</Text>
            <View style={styles.stack8}>
              <InlineMeta icon={<Feather name="map-pin" size={14} color={colors.inkMuted} />} text={profileDraft.location} />
              <InlineMeta icon={<Feather name="briefcase" size={14} color={colors.inkMuted} />} text={`${parsedResume.years} years of experience · ${me.connections} connections`} />
            </View>
          </View>
        </Card>
      </AnimatedEntrance>

      {editingBasics ? (
        <AnimatedEntrance enterKey="profile-edit-card" index={1}>
          <Card>
            <Text style={styles.sectionHeading}>Edit profile</Text>
            <View style={styles.stack10}>
              <View style={styles.profilePhotoEditor}>
                <Avatar source={editingAvatarSource} size={88} ring />
                <View style={styles.flexOne}>
                  <Text style={styles.profilePhotoEditorTitle}>Profile picture</Text>
                  <Text style={styles.profilePhotoEditorText}>
                    Choose a stronger photo, then save to update your profile.
                  </Text>
                </View>
              </View>
              <View style={styles.profileEditActions}>
                <Button
                  label="Change photo"
                  size="sm"
                  variant="outline"
                  onPress={() => void pickProfilePhoto()}
                  icon={<Feather name="camera" size={14} color={colors.ink} />}
                />
                {profileForm.avatarUri ? (
                  <Button
                    label="Use default"
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      setProfileForm((current) => ({ ...current, avatarUri: undefined }))
                    }
                  />
                ) : null}
              </View>
              <LabeledInput
                label="Full name"
                icon={<Feather name="user" size={18} color={colors.inkMuted} />}
                value={profileForm.name}
                onChangeText={(value) => updateProfileForm("name", value)}
                placeholder="Your full name"
                autoCapitalize="words"
              />
              <LabeledInput
                label="Headline"
                icon={<Feather name="briefcase" size={18} color={colors.inkMuted} />}
                value={profileForm.headline}
                onChangeText={(value) => updateProfileForm("headline", value)}
                placeholder="Senior Product Designer"
                autoCapitalize="words"
              />
              <LabeledInput
                label="Location"
                icon={<Feather name="map-pin" size={18} color={colors.inkMuted} />}
                value={profileForm.location}
                onChangeText={(value) => updateProfileForm("location", value)}
                placeholder="London, UK"
                autoCapitalize="words"
              />
            </View>
            {profileMessage ? (
              <View style={[styles.messageCard, styles.profileInfoCard]}>
                <Ionicons
                  name={profileMessage === "Profile updated." ? "checkmark-circle" : "alert-circle"}
                  size={18}
                  color={profileMessage === "Profile updated." ? colors.success : colors.warning}
                />
                <Text style={styles.profileInfoText}>{profileMessage}</Text>
              </View>
            ) : null}
            <View style={styles.profileEditActions}>
              <Button label="Save changes" size="sm" onPress={() => void saveProfileDraft()} />
              <Button label="Cancel" size="sm" variant="outline" onPress={cancelEditing} />
            </View>
          </Card>
        </AnimatedEntrance>
      ) : null}

      <AnimatedEntrance enterKey="profile-nudge" index={1}>
        <Card style={styles.profileNudgeCard}>
          <View style={styles.rowGap12}>
            <Ionicons name="sparkles-outline" size={18} color={colors.brand} />
            <View style={styles.flexOne}>
              <Text style={styles.profileNudgeTitle}>Your CV keeps matches accurate</Text>
              <Text style={styles.profileNudgeText}>Refresh your structured experience and skills any time.</Text>
            </View>
          </View>
          <View style={styles.cardSpacerSmall} />
          <Button label="Update from CV" variant="outline" onPress={onOpenResume} />
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="profile-mode" index={2}>
        <Card style={styles.workModeSectionCard}>
          <View style={styles.workModeHeader}>
            <View style={styles.workModeHeaderText}>
              <Text style={styles.sectionHeading}>Work mode</Text>
              <Text style={styles.metaText}>
                Switch between professional matching and gig dispatch workflows.
              </Text>
            </View>
            {workerMode === "gig" ? (
              <View style={styles.workModeActionWrap}>
                <Button
                  label="Availability"
                  size="sm"
                  variant="outline"
                  onPress={onOpenAvailability}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.workerModeToggleRow}>
            {(["professional", "gig"] as const).map((mode) => {
              const selected = workerMode === mode;

              return (
                <Pressable
                  key={mode}
                  style={({ pressed }) => [
                    styles.workerModeCard,
                    selected && styles.workerModeCardActive,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => onSetWorkerMode(mode)}
                >
                  <Text
                    style={[
                      styles.workerModeCardTitle,
                      selected && styles.workerModeCardTitleActive,
                    ]}
                  >
                    {mode === "professional" ? "Professional" : "Gig / hourly"}
                  </Text>
                  <Text
                    style={[
                      styles.workerModeCardText,
                      selected && styles.workerModeCardTextActive,
                    ]}
                  >
                    {mode === "professional"
                      ? "Portfolio-led discovery, AI role matching, and long-form hiring."
                      : `Live availability, ${availableHoursCount} open hours, and instant dispatch booking.`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="profile-skills" index={3}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Skills</Text>
            {editingSkills ? (
              <Button
                label="Add skill"
                size="sm"
                variant="outline"
                onPress={() => addSkillFromValue(skillInput)}
                icon={<Feather name="plus" size={14} color={colors.ink} />}
              />
            ) : (
              <Button
                label="Edit"
                size="sm"
                variant="outline"
                onPress={() => beginEditing("skills")}
                icon={<Feather name="edit-2" size={14} color={colors.ink} />}
              />
            )}
          </View>
          {editingSkills ? (
            <View style={styles.stack10}>
              <View style={styles.skillComposerRow}>
                <View style={styles.skillComposerInputWrap}>
                  <TextInput
                    style={styles.skillComposerInput}
                    placeholder="Add a skill"
                    placeholderTextColor="#64748b"
                    value={skillInput}
                    onChangeText={setSkillInput}
                  />
                </View>
              </View>
              {filteredSkillSuggestions.length ? (
                <View style={styles.tagRow}>
                  {filteredSkillSuggestions.map((skill) => (
                    <Pressable
                      key={skill}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() => addSkillFromValue(skill)}
                    >
                      <Text style={styles.suggestionChipText}>{skill}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.tagRow}>
            {(editingSkills ? profileForm.skills : profileDraft.skills).map((skill) =>
              editingSkills ? (
                <Pressable
                  key={skill}
                  style={({ pressed }) => [
                    styles.editableBadge,
                    pressed && styles.pressablePressedSoft,
                  ]}
                  onPress={() => removeSkill(skill)}
                >
                  <Text style={styles.editableBadgeText}>{skill}</Text>
                  <Feather name="x" size={12} color={colors.brandDark} />
                </Pressable>
              ) : (
                <Badge key={skill} label={skill} />
              ),
            )}
          </View>
          {editingSkills && profileMessage ? (
            <View style={[styles.messageCard, styles.profileInfoCard]}>
              <Ionicons
                name={profileMessage === "Profile updated." ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={profileMessage === "Profile updated." ? colors.success : colors.warning}
              />
              <Text style={styles.profileInfoText}>{profileMessage}</Text>
            </View>
          ) : null}
          {editingSkills ? (
            <View style={styles.sectionEditActions}>
              <Button label="Save skills" size="sm" onPress={() => void saveProfileDraft()} />
              <Button label="Cancel" size="sm" variant="outline" onPress={cancelEditing} />
            </View>
          ) : null}
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="profile-experience" index={4}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {editingExperience ? (
              <Button
                label="Add"
                size="sm"
                variant="outline"
                onPress={addExperienceItem}
                icon={<Feather name="plus" size={14} color={colors.ink} />}
              />
            ) : (
              <Button
                label="Edit"
                size="sm"
                variant="outline"
                onPress={() => beginEditing("experience")}
                icon={<Feather name="edit-2" size={14} color={colors.ink} />}
              />
            )}
          </View>
          {editingExperience
            ? profileForm.experience.map((item) => (
                <View key={item.id} style={styles.editSectionCard}>
                  <View style={styles.titleRow}>
                    <Text style={styles.editSectionTitle}>Experience entry</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.inlineActionPill,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() => removeExperienceItem(item.id)}
                    >
                      <Feather name="trash-2" size={14} color={colors.danger} />
                      <Text style={styles.inlineActionDangerText}>Remove</Text>
                    </Pressable>
                  </View>
                  <View style={styles.stack10}>
                    <LabeledInput
                      label="Role"
                      icon={<Feather name="briefcase" size={18} color={colors.inkMuted} />}
                      value={item.role}
                      onChangeText={(value) => updateExperienceItem(item.id, "role", value)}
                      placeholder="Senior Product Designer"
                      autoCapitalize="words"
                    />
                    <LabeledInput
                      label="Company"
                      icon={<Ionicons name="business-outline" size={18} color={colors.inkMuted} />}
                      value={item.company}
                      onChangeText={(value) => updateExperienceItem(item.id, "company", value)}
                      placeholder="Company name"
                      autoCapitalize="words"
                    />
                    <LabeledInput
                      label="Period"
                      icon={<Feather name="calendar" size={18} color={colors.inkMuted} />}
                      value={item.period}
                      onChangeText={(value) => updateExperienceItem(item.id, "period", value)}
                      placeholder="2021 - 2024"
                    />
                    <MultilineField
                      label="Impact"
                      value={item.impact}
                      onChangeText={(value) => updateExperienceItem(item.id, "impact", value)}
                      placeholder="Summarise the outcome you delivered."
                    />
                  </View>
                </View>
              ))
            : profileDraft.experience.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  title={item.role}
                  subtitle={item.company}
                  period={item.period}
                  detail={item.impact}
                  last={index === profileDraft.experience.length - 1}
                />
              ))}
          {editingExperience && profileMessage ? (
            <View style={[styles.messageCard, styles.profileInfoCard]}>
              <Ionicons
                name={profileMessage === "Profile updated." ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={profileMessage === "Profile updated." ? colors.success : colors.warning}
              />
              <Text style={styles.profileInfoText}>{profileMessage}</Text>
            </View>
          ) : null}
          {editingExperience ? (
            <View style={styles.sectionEditActions}>
              <Button
                label="Save experience"
                size="sm"
                onPress={() => void saveProfileDraft()}
              />
              <Button label="Cancel" size="sm" variant="outline" onPress={cancelEditing} />
            </View>
          ) : null}
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="profile-education" index={5}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Education</Text>
            {editingEducation ? (
              <Button
                label="Add"
                size="sm"
                variant="outline"
                onPress={addEducationItem}
                icon={<Feather name="plus" size={14} color={colors.ink} />}
              />
            ) : (
              <Button
                label="Edit"
                size="sm"
                variant="outline"
                onPress={() => beginEditing("education")}
                icon={<Feather name="edit-2" size={14} color={colors.ink} />}
              />
            )}
          </View>
          {editingEducation
            ? profileForm.education.map((item) => (
                <View key={item.id} style={styles.editSectionCard}>
                  <View style={styles.titleRow}>
                    <Text style={styles.editSectionTitle}>Education entry</Text>
                    <Pressable
                      style={({ pressed }) => [
                        styles.inlineActionPill,
                        pressed && styles.pressablePressedSoft,
                      ]}
                      onPress={() => removeEducationItem(item.id)}
                    >
                      <Feather name="trash-2" size={14} color={colors.danger} />
                      <Text style={styles.inlineActionDangerText}>Remove</Text>
                    </Pressable>
                  </View>
                  <View style={styles.stack10}>
                    <LabeledInput
                      label="School"
                      icon={<Feather name="book-open" size={18} color={colors.inkMuted} />}
                      value={item.school}
                      onChangeText={(value) => updateEducationItem(item.id, "school", value)}
                      placeholder="University name"
                      autoCapitalize="words"
                    />
                    <LabeledInput
                      label="Degree"
                      icon={<Feather name="award" size={18} color={colors.inkMuted} />}
                      value={item.degree}
                      onChangeText={(value) => updateEducationItem(item.id, "degree", value)}
                      placeholder="BSc Computer Science"
                      autoCapitalize="words"
                    />
                    <LabeledInput
                      label="Period"
                      icon={<Feather name="calendar" size={18} color={colors.inkMuted} />}
                      value={item.period}
                      onChangeText={(value) => updateEducationItem(item.id, "period", value)}
                      placeholder="2012 - 2016"
                    />
                  </View>
                </View>
              ))
            : profileDraft.education.map((item) => (
                <View key={item.id} style={styles.stack4}>
                  <Text style={styles.cardAuthor}>{item.school}</Text>
                  <Text style={styles.metaText}>
                    {item.degree} · {item.period}
                  </Text>
                </View>
              ))}
          {editingEducation && profileMessage ? (
            <View style={[styles.messageCard, styles.profileInfoCard]}>
              <Ionicons
                name={profileMessage === "Profile updated." ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={profileMessage === "Profile updated." ? colors.success : colors.warning}
              />
              <Text style={styles.profileInfoText}>{profileMessage}</Text>
            </View>
          ) : null}
          {editingEducation ? (
            <View style={styles.sectionEditActions}>
              <Button label="Save education" size="sm" onPress={() => void saveProfileDraft()} />
              <Button label="Cancel" size="sm" variant="outline" onPress={cancelEditing} />
            </View>
          ) : null}
        </Card>
      </AnimatedEntrance>

      <AnimatedEntrance enterKey="profile-signout" index={6}>
        <Button
          label="Sign out"
          fullWidth
          variant="outline"
          onPress={() => {
            void signOut();
            void AsyncStorage.removeItem("resume-upload-name");
            onSignedOut();
          }}
        />
      </AnimatedEntrance>
    </ScreenScroll>
  );
}

function ResumeScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [fileName, setFileName] = useState("No file selected");
  const uploadScale = useLoopingScale(1, 1.04, 1400);

  useEffect(() => {
    if (phase !== "parsing") {
      return;
    }

    if (stepIdx >= resumeSteps.length) {
      const timer = setTimeout(() => setPhase("done"), 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setStepIdx((value) => value + 1), 650);
    return () => clearTimeout(timer);
  }, [phase, stepIdx]);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: false,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setFileName(asset.name);
    await AsyncStorage.setItem("resume-upload-name", asset.name);
    setStepIdx(0);
    setPhase("parsing");
  }

  return (
    <ScreenScroll>
      <AnimatedEntrance enterKey="resume-intro" index={0}>
        <SectionIntro eyebrow="Resume Studio" title="Make your CV work harder" subtitle="We turn your CV into a structured, editable profile for better matches." />
      </AnimatedEntrance>

      {phase === "idle" ? (
        <AnimatedEntrance enterKey="resume-idle" index={1}>
          <Card style={styles.centerCard}>
            <Animated.View style={{ transform: [{ scale: uploadScale }] }}>
              <View style={styles.uploadIcon}>
                <Feather name="upload-cloud" size={28} color={colors.brand} />
              </View>
            </Animated.View>
            <Text style={styles.uploadTitle}>Add your resume</Text>
            <Text style={styles.uploadText}>PDF, DOC or DOCX · up to 10MB</Text>
            <Text style={styles.uploadFileName}>{fileName}</Text>
            <View style={styles.cardSpacer} />
            <Button label="Choose a file" onPress={() => void pickFile()} fullWidth icon={<Feather name="file-text" size={16} color="#fff" />} />
          </Card>
        </AnimatedEntrance>
      ) : null}

      {phase === "parsing" ? (
        <AnimatedEntrance enterKey={`resume-parsing-${stepIdx}`} index={1}>
          <Card>
            <View style={styles.rowGap12}>
              <ActivityIndicator color={colors.brand} />
              <View style={styles.flexOne}>
                <Text style={styles.sectionHeading}>Parsing your resume</Text>
                <Text style={styles.metaText}>{resumeSteps[Math.min(stepIdx, resumeSteps.length - 1)]}</Text>
              </View>
            </View>
            <View style={styles.cardSpacer} />
            {resumeSteps.map((step, index) => {
              const complete = index < stepIdx;
              const active = index === stepIdx;

              return (
                <AnimatedEntrance key={step} enterKey={`resume-step-${stepIdx}`} index={index}>
                  <View style={styles.parsingStep}>
                    <View style={[styles.parsingDot, complete && styles.parsingDotDone, active && styles.parsingDotActive]} />
                    <Text style={[styles.parsingStepText, (complete || active) && styles.parsingStepTextActive]}>{step}</Text>
                  </View>
                </AnimatedEntrance>
              );
            })}
          </Card>
        </AnimatedEntrance>
      ) : null}

      {phase === "done" ? (
        <>
          <AnimatedEntrance enterKey="resume-success" index={1}>
            <View style={[styles.messageCard, styles.successCard]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <View style={styles.flexOne}>
                <Text style={styles.successTitle}>Resume parsed successfully</Text>
                <Text style={styles.successText}>Your profile is now ready to review.</Text>
              </View>
              <Pressable onPress={() => setPhase("idle")}>
                <Text style={styles.linkInline}>Re-upload</Text>
              </Pressable>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="resume-contact" index={2}>
            <Card>
              <Text style={styles.sectionHeading}>Contact</Text>
              <FieldRow icon={<Feather name="mail" size={16} color={colors.inkMuted} />} label="Email" value={parsedResume.email} />
              <FieldRow icon={<Feather name="phone" size={16} color={colors.inkMuted} />} label="Phone" value={parsedResume.phone} />
              <FieldRow icon={<Feather name="map-pin" size={16} color={colors.inkMuted} />} label="Location" value={parsedResume.location} />
              <FieldRow icon={<Feather name="briefcase" size={16} color={colors.inkMuted} />} label="Experience" value={`${parsedResume.years} years`} />
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="resume-skills" index={3}>
            <Card>
              <Text style={styles.sectionHeading}>Detected skills</Text>
              <View style={styles.tagRow}>
                {parsedResume.skills.map((skill) => (
                  <Badge key={skill} tone="indigo" label={skill} />
                ))}
              </View>
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="resume-experience" index={4}>
            <Card>
              <Text style={styles.sectionHeading}>Experience</Text>
              {parsedResume.experience.map((item, index) => (
                <TimelineItem
                  key={`${item.company}-${index}`}
                  title={`${item.role} · ${item.company}`}
                  period={item.period}
                  detail={item.impact}
                  last={index === parsedResume.experience.length - 1}
                />
              ))}
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="resume-education" index={5}>
            <Card>
              <Text style={styles.sectionHeading}>Education</Text>
              {parsedResume.education.map((item) => (
                <View key={item.school} style={styles.stack4}>
                  <Text style={styles.cardAuthor}>{item.degree}</Text>
                  <Text style={styles.metaText}>
                    {item.school} · {item.period}
                  </Text>
                </View>
              ))}
            </Card>
          </AnimatedEntrance>

          <AnimatedEntrance enterKey="resume-actions" index={6}>
            <View style={styles.gridButtons}>
              <Button label="Save profile" onPress={onDone} />
              <Button label="Review & edit" onPress={onDone} variant="outline" />
            </View>
          </AnimatedEntrance>
        </>
      ) : null}
    </ScreenScroll>
  );
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.authScreen}
      contentContainerStyle={styles.authContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AnimatedEntrance enterKey="auth-hero" index={0}>
        <View style={styles.authHero}>
          <View style={styles.authBrandRow}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="briefcase-variant-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.brandText}>BEJELI</Text>
          </View>
          <Text style={styles.authHeroText}>The same refined mobile design, rebuilt as a native app.</Text>
        </View>
      </AnimatedEntrance>
      <AnimatedEntrance enterKey="auth-card" index={1}>
        <Card style={styles.authCard}>{children}</Card>
      </AnimatedEntrance>
    </ScrollView>
  );
}

function ScreenScroll({
  children,
  onScroll,
  onLayout,
  scrollEventThrottle,
  scrollRef,
}: {
  children: ReactNode;
  onScroll?: (event: any) => void;
  onLayout?: (event: any) => void;
  scrollEventThrottle?: number;
  scrollRef?: { current: ScrollView | null };
}) {
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screenScroll}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onScroll={onScroll}
      onLayout={onLayout}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </ScrollView>
  );
}

function SectionIntro({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionIntro}>
      <View style={styles.flexOne}>
        <Text style={styles.eyebrowWithIcon}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}

function Card({
  children,
  style,
  noPadding,
  onLayout,
}: {
  children: ReactNode;
  style?: object;
  noPadding?: boolean;
  onLayout?: (event: { nativeEvent: { layout: { y: number; height: number } } }) => void;
}) {
  return (
    <View onLayout={onLayout} style={[styles.card, !noPadding && styles.cardPadded, style]}>
      {children}
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  fullWidth?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        size === "sm" ? styles.buttonSm : styles.buttonMd,
        variant === "primary" && styles.buttonPrimary,
        variant === "outline" && styles.buttonOutline,
        variant === "ghost" && styles.buttonGhost,
        fullWidth && styles.buttonFull,
        pressed && (variant === "ghost" ? styles.pressablePressedGhost : styles.pressablePressedSoft),
      ]}
      onPress={onPress}
    >
      {icon ? <View style={styles.buttonIcon}>{icon}</View> : null}
      <Text
        style={[
          styles.buttonText,
          variant === "primary" && styles.buttonTextPrimary,
          variant !== "primary" && styles.buttonTextOutline,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Badge({
  label,
  tone = "slate",
  icon,
}: {
  label: string;
  tone?: "slate" | "indigo" | "emerald" | "amber";
  icon?: ReactNode;
}) {
  const toneStyle =
    tone === "indigo"
      ? styles.badgeIndigo
      : tone === "amber"
        ? styles.badgeAmber
      : tone === "emerald"
        ? styles.badgeEmerald
        : styles.badgeSlate;

  const textStyle =
    tone === "indigo"
      ? styles.badgeTextIndigo
      : tone === "amber"
        ? styles.badgeTextAmber
      : tone === "emerald"
        ? styles.badgeTextEmerald
        : styles.badgeTextSlate;

  return (
    <View style={[styles.badge, toneStyle]}>
      {icon}
      <Text style={[styles.badgeText, textStyle]}>{label}</Text>
    </View>
  );
}

function Avatar({
  source,
  size,
  ring,
}: {
  source: any;
  size: number;
  ring?: boolean;
}) {
  return <Image source={source} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, ring && styles.avatarRing]} />;
}

function MatchRing({ score, size }: { score: number; size: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = score >= 90 ? colors.success : score >= 80 ? colors.brand : colors.warning;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.lineSoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
        />
      </Svg>
      <View style={styles.matchRingInner}>
        <Text style={styles.matchRingScore}>{score}</Text>
        <Text style={styles.matchRingLabel}>match</Text>
      </View>
    </View>
  );
}

function LabeledInput({
  label,
  icon,
  rightAction,
  ...props
}: {
  label: string;
  icon: ReactNode;
  rightAction?: ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  return (
    <View style={styles.stack8}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput style={styles.input} placeholderTextColor="#64748b" {...props} />
        {rightAction}
      </View>
    </View>
  );
}

function MultilineField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.stack8}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.multilineInputWrap}>
        <TextInput
          style={styles.multilineInput}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.flexOne}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

function TimelineItem({
  title,
  subtitle,
  period,
  detail,
  last,
}: {
  title: string;
  subtitle?: string;
  period: string;
  detail: string;
  last: boolean;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineTrack}>
        <View style={styles.timelineDot} />
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.flexOne}>
        <View style={styles.titleRow}>
          <Text style={styles.cardAuthor}>{title}</Text>
          <Text style={styles.metaText}>{period}</Text>
        </View>
        {subtitle ? <Text style={styles.metaText}>{subtitle}</Text> : null}
        <Text style={styles.bodyTextSmall}>{detail}</Text>
      </View>
    </View>
  );
}

function IconBubble({
  children,
  onPress,
  accessibilityLabel,
  showDot = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  showDot?: boolean;
}) {
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.iconBubble, pressed && styles.pressablePressedSoft]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
        {showDot ? <View style={styles.notificationDot} /> : null}
      </Pressable>
    );
  }

  return <View style={styles.iconBubble}>{children}</View>;
}

function SmallGhostAction({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.smallGhostAction, pressed && styles.pressablePressedSoft]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.smallGhostActionText}>{label}</Text>
    </Pressable>
  );
}

function InlineMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.inlineMeta}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.rowGap8}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  safeAreaImmersive: {
    backgroundColor: "#030b22",
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  appShellImmersive: {
    backgroundColor: "#030b22",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  topBar: {
    paddingHorizontal: spacing.screen,
    paddingTop: Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 12 : 10,
    paddingBottom: 14,
    minHeight: Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 66 : 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topTextAction: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resumeAction: {
    backgroundColor: colors.brandSoft,
  },
  topTextActionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandDark,
  },
  modeSwitchPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
  },
  modeSwitchPillGig: {
    backgroundColor: "#dcfce7",
  },
  modeSwitchLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },
  recruiterTopBarLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e11d48",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  utilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  utilityRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  utilityRowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  utilityRowText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: 2,
  },
  utilityRowMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.brandDark,
    marginTop: 4,
    fontWeight: "700",
  },
  creatorProfileHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  creatorProfileName: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  creatorProfileHeadline: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: colors.ink,
  },
  notificationCardUnread: {
    borderColor: "#c7d2fe",
    backgroundColor: "#f8faff",
  },
  notificationPressable: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  inlineGhostAction: {
    paddingVertical: 4,
  },
  inlineGhostActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandDark,
  },
  screenArea: {
    flex: 1,
  },
  screenAreaImmersive: {
    backgroundColor: "#030b22",
  },
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 14,
  },
  careerShortsScreen: {
    flex: 1,
    backgroundColor: "#030b22",
  },
  careerShortsShell: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    borderRadius: 0,
    backgroundColor: "#030b22",
  },
  careerShortsHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "rgba(3, 11, 34, 0.24)",
  },
  careerShortsEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#93c5fd",
  },
  careerShortsTitle: {
    marginTop: 2,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: "#fff",
    fontFamily: sfProDisplayFamily,
  },
  careerShortsModePill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#172554",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  careerShortsModeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#eff6ff",
  },
  discoveryFilterDock: {
    position: "absolute",
    top: 68,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  discoveryFilterRow: {
    gap: 8,
    paddingHorizontal: spacing.screen,
    paddingBottom: 6,
  },
  discoveryChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    borderWidth: 1,
    borderColor: "rgba(191, 219, 254, 0.14)",
    justifyContent: "center",
  },
  discoveryChipActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#dbeafe",
  },
  discoveryChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dbeafe",
  },
  discoveryChipTextActive: {
    color: "#1e3a8a",
  },
  discoveryActionChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(30, 64, 175, 0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discoveryActionChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dbeafe",
  },
  careerShortsPagerShell: {
    flex: 1,
    marginTop: 0,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#020617",
  },
  careerShortsPagerContent: {
    paddingBottom: 0,
  },
  careerShortsSlide: {
    width: "100%",
    justifyContent: "flex-start",
  },
  careerShortCard: {
    flex: 1,
  },
  careerShortMediaWrap: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#000814",
  },
  careerShortStageMedia: {
    flex: 1,
    backgroundColor: "#111827",
  },
  careerShortPausedBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 74,
    height: 74,
    marginLeft: -37,
    marginTop: -37,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.56)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  careerShortStageImage: {
    width: "100%",
    height: "100%",
  },
  careerShortStageVideo: {
    ...StyleSheet.absoluteFill,
  },
  careerShortStageFallback: {
    backgroundColor: "#1e293b",
  },
  careerShortStageScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(2, 6, 23, 0.28)",
  },
  careerShortTopRow: {
    position: "absolute",
    top: 132,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  careerShortTopicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(30, 41, 59, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  careerShortTopicText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    color: "#fff",
    textTransform: "uppercase",
  },
  careerShortMenuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.54)",
  },
  careerShortBottomOverlay: {
    position: "absolute",
    left: 12,
    right: 10,
    bottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  careerShortTextColumn: {
    flex: 1,
    gap: 12,
  },
  careerShortAuthorPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  careerShortAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  careerShortAuthorName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  careerShortAuthorMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },
  careerShortAuthorRole: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  careerShortCaption: {
    fontSize: 14,
    lineHeight: 21,
    color: "#fff",
    fontWeight: "800",
    textShadowColor: "rgba(15, 23, 42, 0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  careerShortMetaRow: {
    gap: 10,
  },
  careerShortRecommendationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  careerShortCallout: {
    alignSelf: "flex-start",
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  careerShortCalloutDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#86efac",
  },
  careerShortCalloutText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  careerShortAttachmentHint: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  careerShortRecommendationText: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(219, 234, 254, 0.9)",
    fontWeight: "700",
  },
  careerShortActionRail: {
    width: 52,
    alignItems: "center",
    gap: 18,
    paddingBottom: 2,
  },
  careerShortActionButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  careerShortActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  careerShortsEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 8,
    backgroundColor: "#0f172a",
    borderRadius: 24,
  },
  careerShortsEmptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  careerShortsEmptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(219, 234, 254, 0.78)",
    textAlign: "center",
  },
  shortSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.56)",
  },
  shortSheetSafeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  shortSheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.screen,
    paddingTop: 18,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    gap: 14,
    minHeight: 320,
    maxHeight: "84%",
  },
  shortSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  shortSheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  shortSheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  shortSheetClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  shortSheetScroll: {
    maxHeight: 260,
  },
  shortDraftRow: {
    gap: 10,
    paddingRight: 8,
  },
  shortDraftCard: {
    width: 170,
    borderRadius: 18,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 6,
  },
  shortDraftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandDark,
  },
  shortDraftText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  shortComposerActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  bottomNav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomNavImmersive: {
    backgroundColor: "rgba(3, 11, 34, 0.88)",
    borderColor: "rgba(191, 219, 254, 0.12)",
    shadowOpacity: 0.18,
  },
  recruiterBottomNav: {
    backgroundColor: "rgba(248,250,252,0.98)",
  },
  bottomNavItem: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 18,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  bottomNavLabelActive: {
    color: colors.brand,
  },
  bottomNavGlow: {
    position: "absolute",
    bottom: 2,
    width: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.brand,
    opacity: 0.28,
  },
  authScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  authContent: {
    padding: spacing.screen,
    paddingTop: 28,
    paddingBottom: 44,
    gap: 20,
  },
  authHero: {
    borderRadius: 28,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    padding: 22,
  },
  authHeroText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.brandDark,
    fontWeight: "600",
  },
  authCard: {
    marginTop: 2,
  },
  authAudienceSwitch: {
    flexDirection: "row",
    gap: 10,
  },
  authAudienceChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  authAudienceChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  authAudienceChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  authAudienceChipTextActive: {
    color: colors.brandDark,
  },
  loginContent: {
    gap: 18,
  },
  loginHeaderBlock: {
    gap: 10,
    paddingBottom: 4,
  },
  loginFormBlock: {
    gap: 16,
  },
  loginInlineActionRow: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  loginPrimaryActions: {
    gap: 16,
    paddingTop: 4,
  },
  loginFooterBlock: {
    paddingTop: 8,
  },
  signupContent: {
    gap: 18,
  },
  signupHeaderBlock: {
    gap: 10,
    paddingBottom: 2,
  },
  signupFormBlock: {
    gap: 16,
  },
  signupConsentBlock: {
    paddingTop: 2,
    paddingBottom: 6,
  },
  signupPrimaryActions: {
    paddingTop: 2,
  },
  signupFooterBlock: {
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.brand,
  },
  eyebrowWithIcon: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.brand,
    marginBottom: 4,
  },
  authTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 6,
    fontFamily: sfProDisplayFamily,
  },
  authSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
    marginTop: 10,
    marginBottom: 2,
  },
  messageCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorCard: {
    borderColor: "#fecdd3",
    backgroundColor: colors.dangerSoft,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  successCard: {
    borderColor: "#bbf7d0",
    backgroundColor: colors.successSoft,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#14532d",
  },
  successText: {
    fontSize: 13,
    color: "#166534",
  },
  profileInfoCard: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    marginTop: 12,
  },
  profileInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    fontWeight: "600",
  },
  bulletCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.surfaceMuted,
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    color: colors.inkMuted,
    fontWeight: "600",
  },
  stack8: {
    gap: 8,
  },
  stack10: {
    gap: 10,
  },
  stack12: {
    gap: 12,
  },
  stack4: {
    gap: 4,
  },
  rowGap8: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowGap12: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  flexOne: {
    flex: 1,
  },
  pressablePressedSoft: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  pressablePressedGhost: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  pressablePressedNav: {
    opacity: 0.9,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: 14,
  },
  inputAction: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  button: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonMd: {
    minHeight: 48,
    paddingHorizontal: 18,
  },
  buttonSm: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  buttonPrimary: {
    backgroundColor: colors.brand,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonFull: {
    width: "100%",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  buttonTextPrimary: {
    color: "#fff",
  },
  buttonTextOutline: {
    color: colors.ink,
  },
  buttonIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontSize: 12,
    color: "#64748b",
  },
  footerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  footerText: {
    color: colors.inkMuted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.brandDark,
    fontSize: 14,
    fontWeight: "800",
  },
  linkInline: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "800",
  },
  card: {
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  cardPadded: {
    padding: spacing.card,
  },
  cardContent: {
    padding: spacing.card,
    gap: 14,
  },
  composeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  composePlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.inkMuted,
  },
  composePlus: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  composeActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    gap: 8,
  },
  composeExpanded: {
    marginTop: 12,
    gap: 12,
  },
  recentDraftsBlock: {
    gap: 8,
  },
  sectionHeadingCompact: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  recentDraftCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recentDraftTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  recentDraftText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  draftDeleteAction: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  composeInputWrap: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  composeInput: {
    minHeight: 94,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    textAlignVertical: "top",
  },
  videoEngineCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 14,
    gap: 12,
  },
  videoEngineStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  videoEngineStat: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.78)",
    gap: 4,
  },
  videoEngineStatLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.inkMuted,
    textTransform: "uppercase",
  },
  videoEngineStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brandDark,
  },
  videoEngineProgressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#cbd5e1",
  },
  videoEngineProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  videoEngineOptionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  videoEngineOption: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
  },
  videoEngineOptionActive: {
    backgroundColor: colors.brandDark,
  },
  videoEngineOptionText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandDark,
  },
  videoEngineOptionTextActive: {
    color: "#fff",
  },
  lowBandwidthRow: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "#dbeafe",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lowBandwidthRowActive: {
    backgroundColor: "#bfdbfe",
  },
  lowBandwidthText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandDark,
  },
  mediaLayoutSwitcher: {
    flexDirection: "row",
    gap: 8,
  },
  mediaLayoutChip: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  mediaLayoutChipActive: {
    backgroundColor: colors.ink,
  },
  mediaLayoutChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  mediaLayoutChipTextActive: {
    color: "#fff",
  },
  mediaPillRow: {
    gap: 8,
    paddingRight: 4,
  },
  mediaPill: {
    maxWidth: 220,
    minHeight: 38,
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mediaPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandDark,
  },
  mediaPillRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  galleryFrame: {
    marginTop: 14,
    gap: 6,
  },
  galleryCarouselRow: {
    gap: 10,
    paddingRight: 12,
  },
  galleryCarouselTile: {
    width: 286,
    height: 260,
  },
  galleryRow: {
    flexDirection: "row",
    gap: 6,
  },
  galleryLowerRow: {
    marginTop: 0,
  },
  galleryTile: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#e2e8f0",
  },
  galleryHeroTile: {
    width: "100%",
    height: 260,
  },
  galleryHalfTile: {
    flex: 1,
    height: 220,
  },
  galleryHalfTileSmall: {
    flex: 1,
    height: 148,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryVideo: {
    ...StyleSheet.absoluteFill,
  },
  galleryFallback: {
    width: "100%",
    height: "100%",
  },
  galleryFallbackImage: {
    backgroundColor: "#c7d2fe",
  },
  galleryFallbackVideo: {
    backgroundColor: "#0f766e",
  },
  galleryVideoScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
  galleryOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  galleryOverlayImage: {
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  galleryOverlayVideo: {
    backgroundColor: "rgba(15, 23, 42, 0.36)",
  },
  galleryPlayBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryMeta: {
    flex: 1,
  },
  galleryMetaLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.86)",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  galleryMetaTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  galleryMoreBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 10,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryMoreBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  mediaViewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.94)",
  },
  mediaViewerSafeArea: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
    paddingBottom: 24,
  },
  mediaViewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  mediaViewerCounter: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  mediaViewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  mediaViewerStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 26,
  },
  mediaViewerImage: {
    width: "100%",
    height: "100%",
  },
  mediaViewerVideo: {
    width: "100%",
    height: "100%",
  },
  mediaViewerFallback: {
    borderRadius: 24,
  },
  mediaViewerCard: {
    width: "100%",
    maxWidth: 352,
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 14,
  },
  mediaViewerPreview: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    position: "relative",
  },
  mediaViewerPlayBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 52,
    height: 52,
    borderRadius: 26,
    marginLeft: -26,
    marginTop: -26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
  },
  mediaViewerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  mediaViewerText: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.78)",
  },
  mediaViewerNavRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  mediaViewerNavButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mediaViewerNavText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  mediaPreviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mediaPreviewCardImage: {
    borderColor: "#c7d2fe",
    backgroundColor: "#f8faff",
  },
  mediaPreviewCardVideo: {
    borderColor: "#d1fae5",
    backgroundColor: "#ecfdf5",
  },
  mediaPreviewThumb: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPreviewThumbImage: {
    backgroundColor: "#e0e7ff",
  },
  mediaPreviewThumbVideo: {
    backgroundColor: "#047857",
  },
  mediaPreviewImage: {
    width: "100%",
    height: "100%",
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  mediaPreviewMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  mediaPreviewRemove: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  smallGhostAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.surfaceMuted,
  },
  smallGhostActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  profileNudgeCard: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  recruiterHeroCard: {
    backgroundColor: "#eef4ff",
    borderColor: "#c7d2fe",
    gap: 12,
  },
  recruiterPanelCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    gap: 8,
  },
  recruiterQueueHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  recruiterQueueSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  recruiterQueueCountPill: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#dbe3f0",
    backgroundColor: "#f8fafc",
  },
  recruiterQueueCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  recruiterQueueCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe3f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  recruiterQueueEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.brandDark,
    marginBottom: 4,
  },
  recruiterQueueMeta: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  recruiterQueueFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  recruiterQueueSalaryPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  recruiterQueueSalaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandDark,
  },
  recruiterQueueActions: {
    flexDirection: "row",
    gap: 10,
  },
  recruiterShortlistChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  recruiterShortlistChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  recruiterShortlistChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  recruiterShortlistChipTextActive: {
    color: colors.brandDark,
  },
  recruiterCompanyChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  recruiterCompanyChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  recruiterCompanyChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  recruiterCompanyChipTextActive: {
    color: colors.brandDark,
  },
  workModeSectionCard: {
    gap: 16,
  },
  workModeHeader: {
    gap: 14,
  },
  workModeHeaderText: {
    gap: 6,
  },
  workModeActionWrap: {
    alignSelf: "flex-start",
  },
  workerModeToggleRow: {
    gap: 14,
  },
  workerModeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  workerModeCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  workerModeCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  workerModeCardTitleActive: {
    color: colors.brandDark,
  },
  workerModeCardText: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  workerModeCardTextActive: {
    color: colors.brandDark,
  },
  sectionEditActions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  profileNudgeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e1b4b",
  },
  profileNudgeText: {
    fontSize: 12,
    color: colors.brandDark,
    marginTop: 2,
  },
  sectionCardTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  metaText: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  cardAuthor: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  ownPostActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  ownPostAction: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ownPostActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandDark,
  },
  ownPostActionTextDanger: {
    color: colors.danger,
  },
  bodyText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
  },
  bodyTextSmall: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  bodyTextTiny: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeSlate: {
    backgroundColor: "#f1f5f9",
  },
  badgeIndigo: {
    backgroundColor: "#eef2ff",
  },
  badgeEmerald: {
    backgroundColor: "#ecfdf5",
  },
  badgeAmber: {
    backgroundColor: "#fffbeb",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextSlate: {
    color: "#334155",
  },
  badgeTextIndigo: {
    color: colors.brandDark,
  },
  badgeTextEmerald: {
    color: "#166534",
  },
  badgeTextAmber: {
    color: "#b45309",
  },
  cardDivider: {
    marginTop: 14,
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  feedActionRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedAction: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  feedActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  iconOnlyAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  feedInlineBanner: {
    marginTop: 12,
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedInlineBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    fontWeight: "600",
  },
  commentPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  commentHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  commentList: {
    gap: 10,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  commentBubble: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commentComposerInputWrap: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentComposerInput: {
    minHeight: 40,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlignVertical: "top",
  },
  commentComposerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#eef2ff",
    borderBottomWidth: 1,
    borderBottomColor: "#c7d2fe",
  },
  matchHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.brandDark,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
  },
  gridButtons: {
    flexDirection: "row",
    gap: 10,
  },
  profileEditActions: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  gridButtonsTight: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  jobsOptionsCard: {
    gap: 12,
  },
  dispatchSummaryCard: {
    gap: 12,
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  dispatchSummaryStats: {
    flexDirection: "row",
    gap: 10,
  },
  dispatchSummaryPill: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.78)",
    justifyContent: "center",
    gap: 4,
  },
  dispatchSummaryPillLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.inkMuted,
    textTransform: "uppercase",
  },
  dispatchSummaryPillValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandDark,
  },
  jobsOptionsToggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  jobsOptionsToggle: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  jobsOptionsToggleActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  jobsOptionsToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandDark,
  },
  jobsOptionsToggleTextActive: {
    color: "#fff",
  },
  innerPanel: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
  },
  innerPanelTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  availabilitySummaryCard: {
    backgroundColor: "#f8fafc",
  },
  availabilityTable: {
    gap: 8,
    paddingTop: 6,
    paddingRight: 8,
  },
  availabilityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availabilityDayHeader: {
    width: 76,
    alignItems: "center",
  },
  availabilityDayHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availabilityTimeCell: {
    width: 64,
    justifyContent: "center",
  },
  availabilityTimeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  availabilitySlot: {
    width: 76,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  availabilitySlotActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  availabilitySlotText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.inkMuted,
  },
  availabilitySlotTextActive: {
    color: "#fff",
  },
  dispatchQueueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  statGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: "700",
  },
  statValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 12,
    fontFamily: sfProDisplayFamily,
  },
  pageTitle: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: sfProDisplayFamily,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  sectionIntro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  coverImage: {
    width: "100%",
    height: 108,
    borderTopLeftRadius: spacing.radius,
    borderTopRightRadius: spacing.radius,
  },
  profileCardBody: {
    padding: spacing.card,
  },
  profileTopRow: {
    marginTop: -38,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  profileAvatarBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    flex: 1,
  },
  profileAvatarActions: {
    flex: 1,
    gap: 8,
    paddingBottom: 4,
  },
  profileAvatarHint: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  profileAvatarActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  profilePhotoEditor: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profilePhotoEditorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  profilePhotoEditorText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  titleRowWrap: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.ink,
  },
  avatar: {
    backgroundColor: "#e2e8f0",
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  skillComposerRow: {
    flexDirection: "row",
    gap: 10,
  },
  skillComposerInputWrap: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  skillComposerInput: {
    fontSize: 14,
    color: colors.ink,
  },
  suggestionChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandDark,
  },
  editableBadge: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editableBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandDark,
  },
  editSectionCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    gap: 12,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  inlineActionPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineActionPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandDark,
  },
  inlineActionDangerText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.danger,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 18,
  },
  timelineTrack: {
    width: 16,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginTop: 4,
    backgroundColor: colors.line,
  },
  fieldRow: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 2,
  },
  multilineInputWrap: {
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 86,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlignVertical: "top",
  },
  centerCard: {
    alignItems: "center",
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  uploadTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  uploadText: {
    marginTop: 6,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  uploadFileName: {
    marginTop: 8,
    fontSize: 12,
    color: colors.brandDark,
    fontWeight: "700",
  },
  cardSpacer: {
    height: 14,
  },
  cardSpacerSmall: {
    height: 10,
  },
  parsingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  parsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.line,
  },
  parsingDotDone: {
    backgroundColor: colors.success,
  },
  parsingDotActive: {
    backgroundColor: colors.brand,
  },
  parsingStepText: {
    fontSize: 14,
    color: colors.inkMuted,
  },
  parsingStepTextActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchRingInner: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  matchRingScore: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  matchRingLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.inkMuted,
  },
});
