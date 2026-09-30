"use client";

import { me, parsedResume, portfolioClips, type PortfolioClip } from "./mock";

export const feedStorageKey = "kindred-social-feed";
const profileStorageKey = "kindred-profile-workspace";
const resumeStorageKey = "kindred-resume-workspace";
const personaStorageKey = "kindred-persona-mode";
const talentDiscoverySettingsStorageKey = "kindred-discovery-settings-talent";
const recruiterDiscoverySettingsStorageKey = "kindred-discovery-settings-recruiter";

type WorkspaceIdentity = {
  userId?: number;
  userFullName?: string;
  userEmail?: string;
};

export const availabilityDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const availabilitySlots = ["morning", "afternoon", "evening", "night"] as const;
export type PersonaMode = "professional" | "worker";
export type TalentFeedMode =
  | "For You"
  | "Nearby"
  | "Verified"
  | "Urgent Hiring"
  | "Remote First";
export type TalentLocationMode = "Nearby" | "Same City" | "Same Country" | "Anywhere";
export type TalentWorkModel = "Remote" | "Hybrid" | "On-site" | "Shift-based";
export type TalentEmploymentType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Temporary"
  | "Internship"
  | "Freelance";
export type TalentExperienceLevel = "Entry" | "Junior" | "Mid" | "Senior" | "Lead";
export type TalentFreshnessWindow =
  | "Any time"
  | "Last 24 hours"
  | "Last 7 days"
  | "Last 30 days";
export type TalentBenefitPreference =
  | "Health Insurance"
  | "Visa Sponsorship"
  | "Relocation Support"
  | "Flexible Hours"
  | "Training"
  | "Equity"
  | "Paid Leave";
export type TalentCompanySize = "Startup" | "Small Team" | "Mid-size" | "Enterprise";

export type TalentDiscoverySettings = {
  feedMode: TalentFeedMode;
  preferredSectors: string[];
  preferredRoles: string[];
  locationMode: TalentLocationMode;
  searchLocation: string;
  maxDistanceKm: number;
  workModels: TalentWorkModel[];
  employmentTypes: TalentEmploymentType[];
  salaryMin: number;
  salaryMax: number;
  experienceLevels: TalentExperienceLevel[];
  verifiedCompaniesOnly: boolean;
  verifiedRecruitersOnly: boolean;
  freshnessWindow: TalentFreshnessWindow;
  benefitPreferences: TalentBenefitPreference[];
  companySize: TalentCompanySize[];
  allowNearMatches: boolean;
  expandDistanceIfLowSupply: boolean;
  expandSalaryIfLowSupply: boolean;
  includeAspirationalRoles: boolean;
  strictFilters: boolean;
  hideSeenVideos: boolean;
  prioritizeHighMatch: boolean;
};

export type RecruiterFeedMode =
  | "For You"
  | "Ready Now"
  | "Nearby"
  | "Verified Talent"
  | "High Match";
export type RecruiterLocationMode = "Nearby" | "Same City" | "Same Country" | "Anywhere";
export type RecruiterExperienceLevel = "Entry" | "Junior" | "Mid" | "Senior" | "Lead";
export type RecruiterAvailabilityStatus =
  | "Immediate"
  | "This Week"
  | "This Month"
  | "Open to Offers";
export type RecruiterWorkModelFit =
  | "Remote-ready"
  | "Hybrid-ready"
  | "On-site ready"
  | "Shift-ready";
export type RecruiterRightToWorkStatus =
  | "Verified"
  | "Requires Sponsorship"
  | "Open to Visa Support"
  | "Any";
export type RecruiterActivityWindow =
  | "Any time"
  | "Last 24 hours"
  | "Last 7 days"
  | "Last 30 days";

export type RecruiterDiscoverySettings = {
  feedMode: RecruiterFeedMode;
  targetRoles: string[];
  requiredSkills: string[];
  experienceMinYears: number;
  experienceLevels: RecruiterExperienceLevel[];
  availabilityStatus: RecruiterAvailabilityStatus[];
  locationMode: RecruiterLocationMode;
  searchLocation: string;
  maxDistanceKm: number;
  workModelFit: RecruiterWorkModelFit[];
  compensationMin: number;
  compensationMax: number;
  rightToWorkStatus: RecruiterRightToWorkStatus[];
  certificationRequirements: string[];
  profileCompletenessMin: number;
  mustHaveVideo: boolean;
  mustHaveCv: boolean;
  activityWindow: RecruiterActivityWindow;
  allowAdjacentCandidates: boolean;
  expandDistanceIfLowSupply: boolean;
  expandExperienceIfLowSupply: boolean;
  includeTrainableTalent: boolean;
  strictFilters: boolean;
  hideSeenVideos: boolean;
  prioritizeTopMatches: boolean;
};

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

export function getDefaultTalentDiscoverySettings(): TalentDiscoverySettings {
  return {
    feedMode: "For You",
    preferredSectors: ["Technology", "Finance"],
    preferredRoles: ["Product", "Design"],
    locationMode: "Same Country",
    searchLocation: "Lagos, Nigeria",
    maxDistanceKm: 120,
    workModels: ["Remote", "Hybrid", "On-site"],
    employmentTypes: ["Full-time", "Contract"],
    salaryMin: 0,
    salaryMax: 300000,
    experienceLevels: ["Entry", "Junior", "Mid"],
    verifiedCompaniesOnly: false,
    verifiedRecruitersOnly: false,
    freshnessWindow: "Last 7 days",
    benefitPreferences: ["Flexible Hours", "Training"],
    companySize: ["Startup", "Mid-size"],
    allowNearMatches: true,
    expandDistanceIfLowSupply: true,
    expandSalaryIfLowSupply: false,
    includeAspirationalRoles: false,
    strictFilters: false,
    hideSeenVideos: true,
    prioritizeHighMatch: true,
  };
}

export function getStoredTalentDiscoverySettings(identity: WorkspaceIdentity = {}) {
  return safeReadJson<TalentDiscoverySettings>(
    getWorkspaceStorageKey(talentDiscoverySettingsStorageKey, identity.userId),
    getDefaultTalentDiscoverySettings(),
  );
}

export function saveTalentDiscoverySettings(value: TalentDiscoverySettings, userId?: number) {
  safeWriteJson(getWorkspaceStorageKey(talentDiscoverySettingsStorageKey, userId), value);
}

export function getDefaultRecruiterDiscoverySettings(): RecruiterDiscoverySettings {
  return {
    feedMode: "For You",
    targetRoles: ["Frontend Engineer", "Product Designer"],
    requiredSkills: ["React", "Figma"],
    experienceMinYears: 2,
    experienceLevels: ["Junior", "Mid"],
    availabilityStatus: ["Immediate", "Open to Offers"],
    locationMode: "Same Country",
    searchLocation: "Lagos, Nigeria",
    maxDistanceKm: 120,
    workModelFit: ["Remote-ready", "Hybrid-ready", "On-site ready"],
    compensationMin: 0,
    compensationMax: 350000,
    rightToWorkStatus: ["Any"],
    certificationRequirements: [],
    profileCompletenessMin: 60,
    mustHaveVideo: false,
    mustHaveCv: false,
    activityWindow: "Last 7 days",
    allowAdjacentCandidates: true,
    expandDistanceIfLowSupply: true,
    expandExperienceIfLowSupply: false,
    includeTrainableTalent: false,
    strictFilters: false,
    hideSeenVideos: true,
    prioritizeTopMatches: true,
  };
}

export function getStoredRecruiterDiscoverySettings(identity: WorkspaceIdentity = {}) {
  return safeReadJson<RecruiterDiscoverySettings>(
    getWorkspaceStorageKey(recruiterDiscoverySettingsStorageKey, identity.userId),
    getDefaultRecruiterDiscoverySettings(),
  );
}

export function saveRecruiterDiscoverySettings(value: RecruiterDiscoverySettings, userId?: number) {
  safeWriteJson(getWorkspaceStorageKey(recruiterDiscoverySettingsStorageKey, userId), value);
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
