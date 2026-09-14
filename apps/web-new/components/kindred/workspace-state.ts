"use client";

import { me, parsedResume, portfolioClips, type PortfolioClip } from "./mock";

export const feedStorageKey = "kindred-social-feed";
const profileStorageKey = "kindred-profile-workspace";
const resumeStorageKey = "kindred-resume-workspace";
const personaStorageKey = "kindred-persona-mode";

type WorkspaceIdentity = {
  userId?: number;
  userFullName?: string;
  userEmail?: string;
};

export const availabilityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const availabilitySlots = ["morning", "afternoon", "evening", "night"] as const;
export type PersonaMode = "professional" | "worker";

export type ResumeExperience = (typeof parsedResume.experience)[number];
export type ResumeEducation = (typeof parsedResume.education)[number];

export type ResumeWorkspace = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  years: number;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  fileName: string;
  parsedAtLabel: string;
  confidence: number;
  preferredRoles: string[];
  availabilityNote: string;
};

export type ProfileWorkspace = {
  fullName: string;
  headline: string;
  location: string;
  openToWork: boolean;
  avatarSrc: string;
  skills: string[];
  portfolio: PortfolioClip[];
};

function getWorkspaceStorageKey(baseKey: string, userId?: number) {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

function getPreferredFullName(userFullName?: string) {
  const trimmed = userFullName?.trim();
  return trimmed ? trimmed : me.name;
}

function toResumeFileName(fullName: string) {
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "profile"}-cv.pdf`;
}

function getDefaultResumeWorkspace(identity: WorkspaceIdentity = {}): ResumeWorkspace {
  const fullName = getPreferredFullName(identity.userFullName);
  const email = identity.userEmail?.trim() || parsedResume.email;

  return {
    ...parsedResume,
    name: fullName,
    email,
    fileName: toResumeFileName(fullName),
    parsedAtLabel: "Ready for review",
    confidence: 92,
    preferredRoles: [
      "Lead Product Designer",
      "Senior Product Designer",
      "Design Lead, Payments",
    ],
    availabilityNote: "Open to senior product design roles across UK and EU-friendly teams.",
  };
}

function safeReadJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and keep the workspace usable.
  }
}

function readLegacyResumeWorkspace(identity: WorkspaceIdentity) {
  const legacy = safeReadJson<ResumeWorkspace | null>(resumeStorageKey, null);

  if (!legacy) {
    return null;
  }

  const preferredName = getPreferredFullName(identity.userFullName);
  const nameMatches =
    !legacy.name || legacy.name.trim() === preferredName || legacy.name.trim() === me.name;
  const emailMatches =
    !identity.userEmail ||
    !legacy.email ||
    legacy.email.trim() === identity.userEmail.trim() ||
    legacy.email.trim() === parsedResume.email;

  if (!nameMatches && !emailMatches) {
    return null;
  }

  return {
    ...getDefaultResumeWorkspace(identity),
    ...legacy,
    name: preferredName,
    email: identity.userEmail?.trim() || legacy.email || parsedResume.email,
    fileName: toResumeFileName(preferredName),
  };
}

export function getStoredResumeWorkspace(identity: WorkspaceIdentity = {}) {
  const storageKey = getWorkspaceStorageKey(resumeStorageKey, identity.userId);
  const stored = safeReadJson<ResumeWorkspace | null>(storageKey, null);

  if (stored) {
    return stored;
  }

  return readLegacyResumeWorkspace(identity) ?? getDefaultResumeWorkspace(identity);
}

export function saveResumeWorkspace(value: ResumeWorkspace, userId?: number) {
  safeWriteJson(getWorkspaceStorageKey(resumeStorageKey, userId), value);
}

export function getDefaultProfileWorkspace(identity: WorkspaceIdentity = {}): ProfileWorkspace {
  return {
    fullName: getPreferredFullName(identity.userFullName),
    headline: parsedResume.headline,
    location: parsedResume.location,
    openToWork: true,
    avatarSrc: me.avatar,
    skills: parsedResume.skills,
    portfolio: portfolioClips,
  };
}

function readLegacyProfileWorkspace(identity: WorkspaceIdentity) {
  const legacy = safeReadJson<ProfileWorkspace | null>(profileStorageKey, null);

  if (!legacy) {
    return null;
  }

  const preferredName = getPreferredFullName(identity.userFullName);
  const legacyName = legacy.fullName?.trim();

  if (legacyName && legacyName !== preferredName && legacyName !== me.name) {
    return null;
  }

  return {
    ...getDefaultProfileWorkspace(identity),
    ...legacy,
    fullName: preferredName,
  };
}

export function getStoredProfileWorkspace(identity: WorkspaceIdentity = {}) {
  const storageKey = getWorkspaceStorageKey(profileStorageKey, identity.userId);
  const stored = safeReadJson<ProfileWorkspace | null>(storageKey, null);

  if (stored) {
    return stored;
  }

  return readLegacyProfileWorkspace(identity) ?? getDefaultProfileWorkspace(identity);
}

export function saveProfileWorkspace(value: ProfileWorkspace, userId?: number) {
  safeWriteJson(getWorkspaceStorageKey(profileStorageKey, userId), value);
}

export function getStoredPersonaMode() {
  return safeReadJson<PersonaMode>(personaStorageKey, "professional");
}

export function savePersonaMode(value: PersonaMode) {
  safeWriteJson(personaStorageKey, value);
}

export function mergeProfileWithResume(
  profile: ProfileWorkspace,
  resume: ResumeWorkspace,
): ProfileWorkspace {
  return {
    ...profile,
    fullName: resume.name || profile.fullName,
    headline: resume.headline || profile.headline,
    location: resume.location || profile.location,
    skills: Array.from(new Set([...resume.skills, ...profile.skills])),
  };
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
