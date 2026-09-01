"use client";

import { me, parsedResume, portfolioClips, type PortfolioClip } from "./mock";

export const feedStorageKey = "kindred-social-feed";
const profileStorageKey = "kindred-profile-workspace";
const resumeStorageKey = "kindred-resume-workspace";
const personaStorageKey = "kindred-persona-mode";

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

const defaultResumeWorkspace: ResumeWorkspace = {
  ...parsedResume,
  fileName: "amara-okonkwo-cv.pdf",
  parsedAtLabel: "Ready for review",
  confidence: 92,
  preferredRoles: [
    "Lead Product Designer",
    "Senior Product Designer",
    "Design Lead, Payments",
  ],
  availabilityNote: "Open to senior product design roles across UK and EU-friendly teams.",
};

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

export function getStoredResumeWorkspace() {
  return safeReadJson<ResumeWorkspace>(resumeStorageKey, defaultResumeWorkspace);
}

export function saveResumeWorkspace(value: ResumeWorkspace) {
  safeWriteJson(resumeStorageKey, value);
}

export function getDefaultProfileWorkspace(userFullName?: string): ProfileWorkspace {
  return {
    fullName: userFullName ?? me.name,
    headline: parsedResume.headline,
    location: parsedResume.location,
    openToWork: true,
    avatarSrc: me.avatar,
    skills: parsedResume.skills,
    portfolio: portfolioClips,
  };
}

export function getStoredProfileWorkspace(userFullName?: string) {
  return safeReadJson<ProfileWorkspace>(
    profileStorageKey,
    getDefaultProfileWorkspace(userFullName),
  );
}

export function saveProfileWorkspace(value: ProfileWorkspace) {
  safeWriteJson(profileStorageKey, value);
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
