"use client";

import type { FeedItem } from "./mock";
import type {
  RecruiterDiscoverySettings,
  ResumeWorkspace,
  TalentDiscoverySettings,
  ProfileWorkspace,
} from "./workspace-state";

export type DiscoveryRankedItem = {
  item: FeedItem;
  score: number;
  blocked: boolean;
  reasons: string[];
  summaryLabel: string;
  summaryNote: string;
  audience: "talent" | "company" | "shared";
};

const recruiterTitlePattern =
  /\b(recruit|talent|hiring|head of talent|people ops|engineering manager|manager|lead)\b/i;
const availabilityPattern = /\bavailable|availability|open to work|open to offers|weekend|immediate\b/i;
const remotePattern = /\bremote\b/i;
const hybridPattern = /\bhybrid\b/i;
const onsitePattern = /\bon-site|onsite\b/i;
const shiftPattern = /\bshift\b/i;
const visaPattern = /\bvisa|sponsorship|right to work\b/i;
const portfolioPattern = /\bportfolio|showcase|creator|resume|cv\b/i;
const verifiedCompanies = ["kora health", "civo", "paystack", "flutterwave"];

const sectorKeywords: Record<string, string[]> = {
  technology: ["product", "engineering", "frontend", "react", "typescript", "design", "software"],
  health: ["health", "care", "clinic", "patient"],
  finance: ["fintech", "payments", "finance", "banking"],
  logistics: ["logistics", "warehouse", "supply"],
  retail: ["retail", "commerce", "marketplace"],
  care: ["care", "support worker", "care worker"],
  hospitality: ["hospitality", "hotel", "guest"],
  construction: ["construction", "site", "building"],
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s./+-]/g, " ");
}

function buildFeedText(item: FeedItem) {
  if (item.kind === "post") {
    return normalizeText(
      [
        item.channel,
        item.author.name,
        item.author.title,
        item.author.company,
        item.author.location,
        item.body,
        item.tags.join(" "),
      ].join(" "),
    );
  }

  if (item.kind === "hiring") {
    return normalizeText(
      [
        item.channel,
        item.author.name,
        item.author.title,
        item.author.company,
        item.author.location,
        item.role,
        item.note,
      ].join(" "),
    );
  }

  return normalizeText(
    [item.channel, item.role, item.company, item.location, item.salary, item.reasons.join(" ")].join(" "),
  );
}

function parseRelativeTimeHours(value: string) {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/(\d+)\s*([mhd])/);

  if (!match) {
    return 999;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "m") {
    return amount / 60;
  }

  if (unit === "d") {
    return amount * 24;
  }

  return amount;
}

function parseFreshnessWindowHours(window: TalentDiscoverySettings["freshnessWindow"] | RecruiterDiscoverySettings["activityWindow"]) {
  switch (window) {
    case "Last 24 hours":
      return 24;
    case "Last 7 days":
      return 24 * 7;
    case "Last 30 days":
      return 24 * 30;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

function parseCompensationRange(value: string) {
  const normalized = value.replace(/,/g, "");
  const matches = Array.from(normalized.matchAll(/(\d+(?:\.\d+)?)(k)?/gi)).map((match) => {
    const amount = Number(match[1]);
    return match[2] ? amount * 1000 : amount;
  });

  if (!matches.length) {
    return null;
  }

  return {
    min: Math.min(...matches),
    max: Math.max(...matches),
  };
}

function getItemTime(item: FeedItem) {
  if (item.kind === "match") {
    return 12;
  }

  return parseRelativeTimeHours(item.time);
}

function detectAudience(item: FeedItem, text: string): DiscoveryRankedItem["audience"] {
  if (item.kind === "match" || item.kind === "hiring") {
    return "company";
  }

  if (
    item.author.company.toLowerCase() === "open to work" ||
    item.channel !== "Work" ||
    availabilityPattern.test(text) ||
    portfolioPattern.test(text)
  ) {
    return "talent";
  }

  if (recruiterTitlePattern.test(item.author.title) || verifiedCompanies.includes(item.author.company.toLowerCase())) {
    return "company";
  }

  return "shared";
}

function itemHasVideo(item: FeedItem) {
  return item.kind === "post" && Boolean(item.media?.some((media) => media.type === "video"));
}

function estimateProfileCompleteness(item: FeedItem) {
  if (item.kind !== "post") {
    return 80;
  }

  let score = 35;
  if (item.author.name) score += 10;
  if (item.author.title) score += 10;
  if (item.author.company) score += 10;
  if (item.author.location) score += 10;
  if (item.body.length > 80) score += 10;
  if ((item.tags?.length ?? 0) >= 2) score += 5;
  if (item.media?.length) score += 10;
  if ((item.commentItems?.length ?? 0) > 0) score += 5;

  return Math.min(100, score);
}

function countKeywordMatches(text: string, values: string[]) {
  return values.reduce((count, value) => {
    const normalized = normalizeText(value);
    return normalized && text.includes(normalized) ? count + 1 : count;
  }, 0);
}

function countSectorMatches(text: string, values: string[]) {
  return values.reduce((count, value) => {
    const keywords = sectorKeywords[normalizeText(value)] ?? [normalizeText(value)];
    return count + Number(keywords.some((keyword) => keyword && text.includes(keyword)));
  }, 0);
}

function locationMatches(text: string, searchLocation: string, mode: string) {
  if (mode === "Anywhere") {
    return true;
  }

  const normalizedLocation = normalizeText(searchLocation);
  if (!normalizedLocation) {
    return true;
  }

  const parts = normalizedLocation
    .split(/[,.]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts[0] ?? normalizedLocation;
  const country = parts[parts.length - 1] ?? normalizedLocation;

  if (mode === "Nearby" || mode === "Same City") {
    return text.includes(city);
  }

  return text.includes(country) || text.includes(city);
}

function workModelMatches(text: string, values: string[]) {
  if (!values.length) {
    return true;
  }

  return values.some((value) => {
    switch (value) {
      case "Remote":
      case "Remote-ready":
        return remotePattern.test(text);
      case "Hybrid":
      case "Hybrid-ready":
        return hybridPattern.test(text);
      case "On-site":
      case "On-site ready":
        return onsitePattern.test(text);
      case "Shift-based":
      case "Shift-ready":
        return shiftPattern.test(text);
      default:
        return text.includes(normalizeText(value));
    }
  });
}

function computeTalentDiscovery(item: FeedItem, settings: TalentDiscoverySettings, profile: ProfileWorkspace, resume: ResumeWorkspace): DiscoveryRankedItem {
  const text = buildFeedText(item);
  const audience = detectAudience(item, text);
  const reasons: string[] = [];
  let score = item.kind === "match" ? 58 : item.kind === "hiring" ? 52 : audience === "company" ? 42 : 20;
  let blocked = false;

  if (audience === "company") {
    reasons.push("Company-side content fits the talent feed.");
  } else if (audience === "talent") {
    score -= 10;
    reasons.push("Talent-created content is a weaker fit for talent discovery.");
  } else {
    reasons.push("Shared professional content stays visible as a fallback.");
  }

  const roleMatches =
    countKeywordMatches(text, settings.preferredRoles) +
    countKeywordMatches(text, resume.preferredRoles ?? []);
  if (roleMatches > 0) {
    score += Math.min(18, roleMatches * 8);
    reasons.push(`Matched ${roleMatches} preferred role signal${roleMatches > 1 ? "s" : ""}.`);
  }

  const sectorMatches = countSectorMatches(text, settings.preferredSectors);
  if (sectorMatches > 0) {
    score += Math.min(14, sectorMatches * 6);
    reasons.push("Industry signals align with your discovery sectors.");
  }

  const resumeSkillMatches = countKeywordMatches(text, resume.skills);
  if (resumeSkillMatches > 0) {
    score += Math.min(16, resumeSkillMatches * 4);
    reasons.push("Post content overlaps with your CV skill signals.");
  }

  const locationPass = locationMatches(text, settings.searchLocation || profile.location, settings.locationMode);
  if (locationPass) {
    score += 10;
    reasons.push("Location preference is aligned.");
  } else if (settings.strictFilters && settings.locationMode !== "Anywhere") {
    blocked = true;
    reasons.push("Blocked by location preference.");
  } else {
    score -= settings.expandDistanceIfLowSupply ? 2 : 8;
  }

  const workStylePass = workModelMatches(text, settings.workModels);
  if (workStylePass) {
    score += 8;
    reasons.push("Work style matches your preference.");
  } else if (settings.strictFilters && settings.workModels.length) {
    blocked = true;
    reasons.push("Blocked by work style preference.");
  } else {
    score -= 6;
  }

  const timeHours = getItemTime(item);
  const freshnessLimit = parseFreshnessWindowHours(settings.freshnessWindow);
  if (timeHours <= freshnessLimit) {
    score += 6;
    reasons.push("Fresh content stays prioritized.");
  } else if (settings.strictFilters && settings.freshnessWindow !== "Any time") {
    blocked = true;
    reasons.push("Blocked by freshness window.");
  } else {
    score -= 5;
  }

  const compensation =
    item.kind === "match"
      ? parseCompensationRange(item.salary)
      : item.kind === "post"
        ? parseCompensationRange(item.body)
        : null;
  if (compensation) {
    const insideBand =
      compensation.max >= settings.salaryMin &&
      compensation.min <= Math.max(settings.salaryMin, settings.salaryMax);
    if (insideBand) {
      score += 7;
      reasons.push("Compensation sits inside your preferred band.");
    } else if (settings.strictFilters) {
      blocked = true;
      reasons.push("Blocked by pay range.");
    } else {
      score -= settings.expandSalaryIfLowSupply ? 2 : 7;
    }
  }

  const verifiedCompany =
    item.kind === "match" ||
    item.kind === "hiring" ||
    (item.kind === "post" && verifiedCompanies.includes(item.author.company.toLowerCase()));
  if (settings.verifiedCompaniesOnly) {
    if (verifiedCompany) {
      score += 10;
      reasons.push("Verified company content is boosted.");
    } else if (settings.strictFilters) {
      blocked = true;
      reasons.push("Blocked because the company is not verified.");
    } else {
      score -= 8;
    }
  }

  if (settings.verifiedRecruitersOnly && item.kind === "post") {
    const recruiterAuthored = recruiterTitlePattern.test(item.author.title);
    if (recruiterAuthored) {
      score += 8;
      reasons.push("Recruiter-authored post matches your trust setting.");
    } else if (settings.strictFilters) {
      blocked = true;
      reasons.push("Blocked because the poster is not recruiter-authored.");
    } else {
      score -= 6;
    }
  }

  if (settings.feedMode === "Verified" && verifiedCompany) {
    score += 10;
  }
  if (settings.feedMode === "Urgent Hiring" && (item.kind === "hiring" || text.includes("hiring"))) {
    score += 12;
  }
  if (settings.feedMode === "Remote First" && remotePattern.test(text)) {
    score += 10;
  }
  if (settings.feedMode === "Nearby" && locationPass) {
    score += 8;
  }

  if (settings.allowNearMatches && !blocked) {
    score += 4;
  }

  if (!settings.includeAspirationalRoles && audience === "talent") {
    score -= 4;
  }

  const finalScore = Math.max(1, Math.round(score));
  return {
    item,
    score: finalScore,
    blocked,
    reasons: reasons.slice(0, 3),
    summaryLabel: `${finalScore}% talent match`,
    summaryNote: reasons.slice(0, 2).join(" "),
    audience,
  };
}

function computeRecruiterDiscovery(item: FeedItem, settings: RecruiterDiscoverySettings): DiscoveryRankedItem {
  const text = buildFeedText(item);
  const audience = detectAudience(item, text);
  const reasons: string[] = [];
  let score = audience === "talent" ? 52 : audience === "shared" ? 28 : item.kind === "post" ? 18 : 8;
  let blocked = false;

  if (audience === "talent") {
    reasons.push("Talent-side content fits recruiter discovery.");
  } else if (audience === "company") {
    score -= 12;
    reasons.push("Company-side content is deprioritized for recruiter discovery.");
  } else {
    reasons.push("Shared professional content is retained as a fallback.");
  }

  const roleMatches = countKeywordMatches(text, settings.targetRoles);
  if (roleMatches > 0) {
    score += Math.min(18, roleMatches * 8);
    reasons.push(`Matched ${roleMatches} target role signal${roleMatches > 1 ? "s" : ""}.`);
  }

  const skillMatches = countKeywordMatches(text, settings.requiredSkills);
  if (skillMatches > 0) {
    score += Math.min(18, skillMatches * 6);
    reasons.push("Required skills appear in the reel content.");
  }

  const availabilityMatches = countKeywordMatches(text, settings.availabilityStatus);
  if (availabilityMatches > 0 || availabilityPattern.test(text)) {
    score += 8;
    reasons.push("Availability signal matches recruiter filters.");
  }

  const locationPass = locationMatches(text, settings.searchLocation, settings.locationMode);
  if (locationPass) {
    score += 10;
    reasons.push("Location fits your search area.");
  } else if (settings.strictFilters && settings.locationMode !== "Anywhere") {
    blocked = true;
    reasons.push("Blocked by recruiter location filters.");
  } else {
    score -= settings.expandDistanceIfLowSupply ? 3 : 9;
  }

  const workStylePass = workModelMatches(text, settings.workModelFit);
  if (workStylePass) {
    score += 8;
    reasons.push("Work model fit is aligned.");
  } else if (settings.strictFilters && settings.workModelFit.length) {
    blocked = true;
    reasons.push("Blocked by work model fit.");
  } else {
    score -= 6;
  }

  const timeHours = getItemTime(item);
  const freshnessLimit = parseFreshnessWindowHours(settings.activityWindow);
  if (timeHours <= freshnessLimit) {
    score += 6;
    reasons.push("Recently active content gets boosted.");
  } else if (settings.strictFilters && settings.activityWindow !== "Any time") {
    blocked = true;
    reasons.push("Blocked by recruiter activity window.");
  } else {
    score -= 4;
  }

  if (settings.mustHaveVideo) {
    if (itemHasVideo(item)) {
      score += 8;
      reasons.push("Video-first preference is satisfied.");
    } else if (settings.strictFilters) {
      blocked = true;
      reasons.push("Blocked because a video is required.");
    } else {
      score -= 10;
    }
  }

  if (settings.mustHaveCv) {
    if (portfolioPattern.test(text)) {
      score += 6;
      reasons.push("Portfolio or CV signal detected.");
    } else if (settings.strictFilters) {
      blocked = true;
      reasons.push("Blocked because a CV signal is required.");
    } else {
      score -= 8;
    }
  }

  const completeness = estimateProfileCompleteness(item);
  if (completeness >= settings.profileCompletenessMin) {
    score += 8;
    reasons.push("Profile completeness clears your threshold.");
  } else if (settings.strictFilters) {
    blocked = true;
    reasons.push("Blocked by minimum profile completeness.");
  } else {
    score -= 8;
  }

  if (settings.rightToWorkStatus.includes("Any")) {
    score += 2;
  } else if (visaPattern.test(text)) {
    score += 6;
    reasons.push("Right-to-work or visa detail is surfaced.");
  } else if (settings.strictFilters) {
    blocked = true;
    reasons.push("Blocked because right-to-work detail is missing.");
  }

  const certificationMatches = countKeywordMatches(text, settings.certificationRequirements);
  if (certificationMatches > 0) {
    score += Math.min(12, certificationMatches * 6);
    reasons.push("Certification requirement matches reel content.");
  }

  if (settings.feedMode === "Ready Now" && availabilityPattern.test(text)) {
    score += 10;
  }
  if (settings.feedMode === "Nearby" && locationPass) {
    score += 8;
  }
  if (settings.feedMode === "Verified Talent" && completeness >= 75) {
    score += 8;
  }
  if (settings.feedMode === "High Match" && (roleMatches > 0 || skillMatches > 0)) {
    score += 10;
  }

  if (settings.allowAdjacentCandidates && !blocked) {
    score += 4;
  }
  if (settings.includeTrainableTalent && (roleMatches === 0 || skillMatches === 0)) {
    score += 3;
  }

  const finalScore = Math.max(1, Math.round(score));
  return {
    item,
    score: finalScore,
    blocked,
    reasons: reasons.slice(0, 3),
    summaryLabel: `${finalScore}% recruiter match`,
    summaryNote: reasons.slice(0, 2).join(" "),
    audience,
  };
}

export function rankFeedForTalent(
  items: FeedItem[],
  settings: TalentDiscoverySettings,
  profile: ProfileWorkspace,
  resume: ResumeWorkspace,
) {
  return items
    .map((item) => computeTalentDiscovery(item, settings, profile, resume))
    .filter((item) => !item.blocked)
    .sort((left, right) => right.score - left.score);
}

export function rankFeedForRecruiter(items: FeedItem[], settings: RecruiterDiscoverySettings) {
  return items
    .map((item) => computeRecruiterDiscovery(item, settings))
    .filter((item) => !item.blocked)
    .sort((left, right) => right.score - left.score);
}
