"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "../icons";

import { useKindredAuth } from "../app/kindred-provider";
import { AVATARS, me, skillSuggestions, type PortfolioClip } from "../mock";
import { Avatar, Badge, Button, Card } from "../primitives";
import {
  availabilityDays,
  availabilitySlots,
  getStoredProfileWorkspace,
  getStoredPersonaMode,
  getStoredResumeWorkspace,
  mergeProfileWithResume,
  readFileAsDataUrl,
  savePersonaMode,
  saveProfileWorkspace,
  type PersonaMode,
} from "../workspace-state";

type AvailabilityCell = {
  dayOfWeek: number;
  slot: (typeof availabilitySlots)[number];
  isAvailable: boolean;
};

type RewardsLedger = {
  balance: {
    earnedPoints: number;
    spentPoints: number;
    availablePoints: number;
  };
  endorsements: Array<{
    id: number;
    points_awarded: number;
    note: string;
    endorser_name: string;
    created_at: string;
  }>;
  liquidationRequests: Array<{
    id: number;
    kind: string;
    points: number;
    destination: string;
    status: string;
  }>;
};

export function ProfilePage() {
  const router = useRouter();
  const { signOut, user } = useKindredAuth();
  const workspaceIdentity = {
    userId: user?.id,
    userFullName: user?.fullName,
    userEmail: user?.email,
  };
  const [resume] = useState(() => getStoredResumeWorkspace(workspaceIdentity));
  const [personaMode, setPersonaMode] = useState<PersonaMode>(() => getStoredPersonaMode());
  const [savedProfile, setSavedProfile] = useState(() => getStoredProfileWorkspace(workspaceIdentity));
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [availability, setAvailability] = useState<AvailabilityCell[]>([]);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [rewardsLedger, setRewardsLedger] = useState<RewardsLedger | null>(null);
  const [payoutDraft, setPayoutDraft] = useState({
    bankLabel: "",
    accountLast4: "",
  });
  const [profileDraft, setProfileDraft] = useState({
    fullName: savedProfile.fullName,
    headline: savedProfile.headline,
    location: savedProfile.location,
    openToWork: savedProfile.openToWork,
  });
  const [skills, setSkills] = useState(savedProfile.skills);
  const [avatarSrc, setAvatarSrc] = useState(savedProfile.avatarSrc);
  const [portfolio, setPortfolio] = useState<PortfolioClip[]>(savedProfile.portfolio);

  const profileName = useMemo(
    () => profileDraft.fullName.trim() || savedProfile.fullName || user?.fullName || me.name,
    [profileDraft.fullName, savedProfile.fullName, user?.fullName],
  );
  const profileHealthScore = useMemo(
    () =>
      Math.min(
        98,
        58 +
          Math.min(20, skills.length * 2) +
          Math.min(16, portfolio.length * 4) +
          (profileDraft.openToWork ? 6 : 0),
      ),
    [portfolio.length, profileDraft.openToWork, skills.length],
  );
  const filteredSkillSuggestions = useMemo(
    () =>
      skillSuggestions.filter((skill) => {
        if (skills.some((current) => current.toLowerCase() === skill.toLowerCase())) {
          return false;
        }

        if (!newSkill.trim()) {
          return true;
        }

        return skill.toLowerCase().includes(newSkill.trim().toLowerCase());
      }),
    [newSkill, skills],
  );

  useEffect(() => {
    savePersonaMode(personaMode);
  }, [personaMode]);

  useEffect(() => {
    let active = true;

    authedFetch(`${apiUrl}/workspace/availability`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ slots?: AvailabilityCell[]; error?: string }>(
          response,
        );

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load availability.");
        }

        if (active) {
          setAvailability(payload.slots ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setAvailability([]);
        }
      });

    authedFetch(`${apiUrl}/rewards/ledger`)
      .then(async (response) => {
        const payload = await readJsonResponse<RewardsLedger & { error?: string }>(response);

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load rewards.");
        }

        if (active) {
          setRewardsLedger(payload);
        }
      })
      .catch(() => {
        if (active) {
          setRewardsLedger(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const availabilityMap = useMemo(() => {
    return new Map(
      availability.map((cell) => [`${cell.dayOfWeek}-${cell.slot}`, cell.isAvailable] as const),
    );
  }, [availability]);

  function handleDraftChange(field: "fullName" | "headline" | "location", value: string) {
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setStatusMessage("");
  }

  function persistProfile(nextProfile: {
    fullName: string;
    headline: string;
    location: string;
    openToWork: boolean;
    avatarSrc: string;
    skills: string[];
    portfolio: PortfolioClip[];
  }) {
    setSavedProfile(nextProfile);
    saveProfileWorkspace(nextProfile, user?.id);
  }

  function handleSaveProfile() {
    const nextProfile = {
      fullName: profileDraft.fullName.trim() || savedProfile.fullName || user?.fullName || me.name,
      headline: profileDraft.headline.trim() || savedProfile.headline || me.headline,
      location: profileDraft.location.trim() || savedProfile.location || me.location,
      openToWork: profileDraft.openToWork,
      avatarSrc,
      skills,
      portfolio,
    };

    persistProfile(nextProfile);
    setProfileDraft(nextProfile);
    setIsEditing(false);
    setStatusMessage("Profile details updated in the web workspace.");
  }

  function handleCancelEdit() {
    setProfileDraft({
      fullName: savedProfile.fullName,
      headline: savedProfile.headline,
      location: savedProfile.location,
      openToWork: savedProfile.openToWork,
    });
    setIsEditing(false);
    setStatusMessage("Profile edits discarded.");
  }

  function handleAddSkill() {
    const normalized = newSkill.trim();

    if (!normalized) {
      setStatusMessage("Enter a skill before adding it.");
      return;
    }

    if (skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      setStatusMessage("That skill is already listed.");
      return;
    }

    const nextSkills = [...skills, normalized];
    setSkills(nextSkills);
    persistProfile({
      ...savedProfile,
      openToWork: profileDraft.openToWork,
      avatarSrc,
      skills: nextSkills,
      portfolio,
    });
    setNewSkill("");
    setShowSkillInput(false);
    setStatusMessage(`Added ${normalized} to your profile skills.`);
  }

  function handleSuggestedSkillClick(skill: string) {
    setNewSkill(skill);

    if (skills.some((current) => current.toLowerCase() === skill.toLowerCase())) {
      setStatusMessage("That skill is already listed.");
      return;
    }

    const nextSkills = [...skills, skill];
    setSkills(nextSkills);
    persistProfile({
      ...savedProfile,
      openToWork: profileDraft.openToWork,
      avatarSrc,
      skills: nextSkills,
      portfolio,
    });
    setShowSkillInput(false);
    setNewSkill("");
    setStatusMessage(`Added ${skill} to your profile skills.`);
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const nextAvatar = await readFileAsDataUrl(file);
      setAvatarSrc(nextAvatar);
      persistProfile({
        ...savedProfile,
        openToWork: profileDraft.openToWork,
        avatarSrc: nextAvatar,
        skills,
        portfolio,
      });
      setStatusMessage("Profile picture updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to update your profile picture.",
      );
    }
  }

  async function handlePortfolioUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    try {
      const nextClips = await Promise.all(
        files.map(async (file) => ({
          id: `portfolio-${file.name}-${file.size}-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          caption: "Freshly uploaded to your visible talent portfolio.",
          type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
          src: await readFileAsDataUrl(file),
          tag: "Portfolio" as const,
        })),
      );

      const nextPortfolio = [...nextClips, ...portfolio];
      setPortfolio(nextPortfolio);
      persistProfile({
        ...savedProfile,
        openToWork: profileDraft.openToWork,
        avatarSrc,
        skills,
        portfolio: nextPortfolio,
      });
      setStatusMessage(
        files.length === 1 ? "Portfolio item uploaded." : "Portfolio items uploaded.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to upload portfolio media.",
      );
    }
  }

  function handleRemovePortfolioClip(clipId: string) {
    const nextPortfolio = portfolio.filter((clip) => clip.id !== clipId);
    setPortfolio(nextPortfolio);
    persistProfile({
      ...savedProfile,
      openToWork: profileDraft.openToWork,
      avatarSrc,
      skills,
      portfolio: nextPortfolio,
    });
    setStatusMessage("Portfolio item removed.");
  }

  function handleSyncFromResume() {
    const nextProfile = mergeProfileWithResume(
      {
        ...savedProfile,
        openToWork: profileDraft.openToWork,
        avatarSrc,
        skills,
        portfolio,
      },
      resume,
    );

    setSkills(nextProfile.skills);
    setProfileDraft({
      fullName: nextProfile.fullName,
      headline: nextProfile.headline,
      location: nextProfile.location,
      openToWork: nextProfile.openToWork,
    });
    persistProfile(nextProfile);
    setStatusMessage("Profile refreshed from your parsed CV data.");
  }

  function toggleOpenToWork() {
    const nextOpenToWork = !profileDraft.openToWork;

    setProfileDraft((current) => ({
      ...current,
      openToWork: nextOpenToWork,
    }));
    persistProfile({
      ...savedProfile,
      openToWork: nextOpenToWork,
      avatarSrc,
      skills,
      portfolio,
    });
    setStatusMessage(
      nextOpenToWork ? "Open-to-work status enabled." : "Open-to-work status hidden.",
    );
  }

  function toggleAvailability(dayOfWeek: number, slot: AvailabilityCell["slot"]) {
    const key = `${dayOfWeek}-${slot}`;
    const exists = availability.some(
      (cell) => cell.dayOfWeek === dayOfWeek && cell.slot === slot,
    );

    if (exists) {
      setAvailability((current) =>
        current.map((cell) =>
          `${cell.dayOfWeek}-${cell.slot}` === key
            ? { ...cell, isAvailable: !cell.isAvailable }
            : cell,
        ),
      );
      return;
    }

    setAvailability((current) => [...current, { dayOfWeek, slot, isAvailable: true }]);
  }

  async function saveAvailabilityMatrix() {
    setAvailabilityBusy(true);

    try {
      const response = await authedFetch(`${apiUrl}/workspace/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots: availability }),
      });
      const payload = await readJsonResponse<{ slots?: AvailabilityCell[]; error?: string }>(
        response,
      );

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save availability.");
      }

      setAvailability(payload.slots ?? []);
      setStatusMessage("Availability matrix updated for instant-book matching.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save availability.");
    } finally {
      setAvailabilityBusy(false);
    }
  }

  async function redeemPoints(kind: "discount" | "cash") {
    if (!rewardsLedger?.balance.availablePoints) {
      setStatusMessage("You need endorsement points before redeeming.");
      return;
    }

    const points = Math.min(10, rewardsLedger.balance.availablePoints);

    try {
      const response = await authedFetch(`${apiUrl}/rewards/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          points,
          destination: kind === "discount" ? "Subscription discount" : "UK payout request",
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to redeem points.");
      }

      const ledgerResponse = await authedFetch(`${apiUrl}/rewards/ledger`);
      const ledgerPayload = await readJsonResponse<RewardsLedger & { error?: string }>(
        ledgerResponse,
      );
      if (!ledgerResponse.ok) {
        throw new Error(ledgerPayload.error ?? "Unable to refresh rewards.");
      }
      setRewardsLedger(ledgerPayload);
      setStatusMessage(
        kind === "discount"
          ? "Discount redemption request submitted."
          : "Cash-out request submitted.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to redeem points.");
    }
  }

  async function savePayoutPipeline() {
    if (!payoutDraft.bankLabel.trim() || !payoutDraft.accountLast4.trim()) {
      setStatusMessage("Add a bank label and the last four digits before saving a payout route.");
      return;
    }

    try {
      const response = await authedFetch(`${apiUrl}/operations/payout-routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: "UK",
          routeType: "bank",
          bankLabel: payoutDraft.bankLabel.trim(),
          accountLast4: payoutDraft.accountLast4.trim(),
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save payout route.");
      }

      setPayoutDraft({ bankLabel: "", accountLast4: "" });
      setStatusMessage("Payout route saved for instant settlement workflows.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save payout route.");
    }
  }

  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section aria-labelledby="profile-title">
        <Card className="overflow-hidden">
          <div className="relative h-24 bg-slate-200">
            <Image
              src={AVATARS.cover}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
          <div className="px-5 pb-7 sm:px-7 sm:pb-8">
            <div className="-mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <Avatar src={avatarSrc} alt={me.name} size={88} ring />
                  <label className="absolute -bottom-1 right-0 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-white px-3 text-xs font-semibold text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 hover:bg-slate-50">
                    <UploadCloudIcon className="h-3.5 w-3.5 text-indigo-700" aria-hidden="true" />
                    Edit photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1
                      id="profile-title"
                      className="font-display text-3xl font-bold tracking-tight text-slate-950"
                    >
                      {profileName}
                    </h1>
                    <button
                      type="button"
                      onClick={toggleOpenToWork}
                      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      aria-label={
                        profileDraft.openToWork
                          ? "Disable open to work"
                          : "Enable open to work"
                      }
                    >
                      <Badge tone={profileDraft.openToWork ? "emerald" : "amber"}>
                        <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {profileDraft.openToWork ? "Open to work" : "Private"}
                      </Badge>
                    </button>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {profileDraft.headline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                      {profileDraft.location}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <BriefcaseIcon className="h-4 w-4" aria-hidden="true" />
                      {resume.years} years of experience
                    </p>
                    <p>{me.connections} connections</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSyncFromResume}>
                  <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                  Sync saved CV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={isEditing ? "Close profile editor" : "Edit profile"}
                  onClick={() => {
                    setIsEditing((current) => !current);
                    setStatusMessage("");
                  }}
                >
                  <PencilIcon className="h-4 w-4" aria-hidden="true" />
                  {isEditing ? "Close editor" : "Edit profile"}
                </Button>
                <Link
                  href="/resume"
                  className="inline-flex min-h-11 items-center rounded-full bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  Refresh from CV
                </Link>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Profile health", value: `${profileHealthScore}%` },
                { label: "Skills", value: `${skills.length}` },
                { label: "Portfolio", value: `${portfolio.length}` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-950">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
                Talent identity
              </span>
              <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                Resume-connected
              </span>
              <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                Recruiter-visible
              </span>
            </div>
          </div>
        </Card>
      </section>

      {isEditing ? (
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                Profile editor
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
                Update your visible profile details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Adjust what recruiters and companies see in your website profile hub.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save changes</Button>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full name
              <input
                value={profileDraft.fullName}
                onChange={(event) => handleDraftChange("fullName", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Location
              <input
                value={profileDraft.location}
                onChange={(event) => handleDraftChange("location", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Headline
              <textarea
                value={profileDraft.headline}
                onChange={(event) => handleDraftChange("headline", event.target.value)}
                rows={3}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              />
            </label>
          </div>
        </Card>
      ) : null}

      <div className="space-y-7">
          <Card className="border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-start gap-3">
              <SparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-indigo-950">Your CV keeps matches accurate</h2>
                <p className="mt-1 text-sm text-indigo-900">
                  Refresh your structured experience and skills any time.
                </p>
              </div>
            </div>
            <Link
              href="/resume"
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Update from CV
            </Link>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                    Dual UI mode
                  </p>
                  <h2 className="mt-2 font-bold text-slate-950">Choose your working surface</h2>
                </div>
                <Badge tone="indigo">{personaMode === "professional" ? "Professional" : "Worker"}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Switch between long-cycle professional discovery and instant-book worker workflows.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["professional", "worker"] as PersonaMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPersonaMode(mode);
                      setStatusMessage(
                        mode === "professional"
                          ? "Professional mode enabled."
                          : "Worker mode enabled for gig-style discovery.",
                      );
                    }}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                      personaMode === mode
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {mode === "professional" ? "Professional UI" : "Worker / gig UI"}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                Rewards ledger
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-bold text-slate-950">
                    {rewardsLedger?.balance.availablePoints ?? 0}
                  </p>
                  <p className="text-sm text-slate-600">Available endorsement points</p>
                </div>
                <Badge tone="emerald">
                  {rewardsLedger?.balance.earnedPoints ?? 0} earned
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void redeemPoints("discount")}>
                  Redeem discount
                </Button>
                <Button size="sm" variant="outline" onClick={() => void redeemPoints("cash")}>
                  Cash out
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {(rewardsLedger?.endorsements ?? []).slice(0, 2).map((entry) => (
                  <div key={entry.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{entry.endorser_name}</span>
                    {" "}awarded {entry.points_awarded} points.
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section aria-labelledby="skills-title">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 id="skills-title" className="font-bold text-slate-950">
                  Skills
                </h2>
                <button
                  type="button"
                  aria-label="Add a skill"
                  onClick={() => {
                    setShowSkillInput((current) => !current);
                    setStatusMessage("");
                  }}
                  className="grid h-11 w-11 place-items-center rounded-xl text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              {showSkillInput ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newSkill}
                      onChange={(event) => setNewSkill(event.target.value)}
                      placeholder="Add a new skill"
                      className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                    />
                    <Button onClick={handleAddSkill}>Add skill</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredSkillSuggestions.slice(0, 8).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSuggestedSkillClick(skill)}
                        className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} tone="slate">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          </section>

          <section aria-labelledby="availability-title">
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="availability-title" className="font-bold text-slate-950">
                    Availability matrix
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Set hour-block availability so recruiters can instant-book verified shifts.
                  </p>
                </div>
                <Button size="sm" onClick={() => void saveAvailabilityMatrix()} disabled={availabilityBusy}>
                  {availabilityBusy ? "Saving..." : "Save availability"}
                </Button>
              </div>
              <div className="mt-5 overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-[100px_repeat(7,minmax(0,1fr))] gap-2">
                  <div />
                  {availabilityDays.map((day) => (
                    <div key={day} className="px-2 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {day}
                    </div>
                  ))}
                  {availabilitySlots.map((slot) => (
                    <div key={slot} className="contents">
                      <div
                        key={`${slot}-label`}
                        className="flex items-center rounded-xl bg-slate-50 px-3 text-sm font-semibold capitalize text-slate-700"
                      >
                        {slot}
                      </div>
                      {availabilityDays.map((_, dayIndex) => {
                        const active = availabilityMap.get(`${dayIndex}-${slot}`) ?? false;

                        return (
                          <button
                            key={`${dayIndex}-${slot}`}
                            type="button"
                            onClick={() => toggleAvailability(dayIndex, slot)}
                            className={`min-h-12 rounded-xl border text-sm font-semibold transition-colors ${
                              active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {active ? "Available" : "Off"}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          <section aria-labelledby="portfolio-title">
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="portfolio-title" className="font-bold text-slate-950">
                    Video portfolio
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Keep visible proof-of-work clips and media snapshots on your public professional surface.
                  </p>
                </div>
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800 focus-within:ring-2 focus-within:ring-indigo-600">
                  Upload media
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioUpload}
                  />
                </label>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {portfolio.map((clip) => (
                  <div
                    key={clip.id}
                    className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                  >
                    {clip.type === "video" ? (
                      <video
                        src={clip.src}
                        controls
                        className="h-52 w-full bg-slate-950 object-cover"
                      />
                    ) : (
                      <img
                        src={clip.src}
                        alt={clip.title}
                        className="h-52 w-full object-cover"
                      />
                    )}
                    <div className="space-y-2 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{clip.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {clip.caption}
                          </p>
                        </div>
                        <Badge tone="indigo">{clip.tag}</Badge>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolioClip(clip.id)}
                          className="text-sm font-semibold text-rose-700 hover:text-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section aria-labelledby="payout-title">
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="payout-title" className="font-bold text-slate-950">
                    Payout pipeline
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Save a UK payout route for instant-book settlement and escrow release.
                  </p>
                </div>
                <Badge tone="emerald">UK routing ready</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Bank or route label
                  <input
                    value={payoutDraft.bankLabel}
                    onChange={(event) =>
                      setPayoutDraft((current) => ({ ...current, bankLabel: event.target.value }))
                    }
                    placeholder="Monzo Personal"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Account last 4
                  <input
                    value={payoutDraft.accountLast4}
                    onChange={(event) =>
                      setPayoutDraft((current) => ({ ...current, accountLast4: event.target.value }))
                    }
                    maxLength={4}
                    placeholder="1930"
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                  />
                </label>
              </div>
              <div className="mt-4">
                <Button onClick={() => void savePayoutPipeline()}>Save payout route</Button>
              </div>
              {rewardsLedger?.liquidationRequests?.length ? (
                <div className="mt-4 space-y-2">
                  {rewardsLedger.liquidationRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      {request.kind} request for {request.points} points is {request.status}.
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </section>

          <section aria-labelledby="experience-title">
            <Card className="p-5">
              <h2 id="experience-title" className="flex items-center gap-2 font-bold text-slate-950">
                <BriefcaseIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Experience
              </h2>
              <ol className="mt-4 space-y-5 border-l border-slate-200 pl-4">
                {resume.experience.map((item) => (
                  <li key={item.company} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-700 ring-4 ring-white"
                    />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="font-bold text-slate-950">{item.role}</h3>
                      <span className="shrink-0 text-xs text-slate-600">{item.period}</span>
                    </div>
                    <p className="text-sm text-slate-600">{item.company}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.impact}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </section>

          <section aria-labelledby="education-title">
            <Card className="p-5">
              <h2 id="education-title" className="flex items-center gap-2 font-bold text-slate-950">
                <GraduationCapIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Education
              </h2>
              {resume.education.map((item) => (
                <div key={item.school} className="mt-4">
                  <h3 className="font-bold text-slate-950">{item.school}</h3>
                  <p className="text-sm text-slate-600">
                    {item.degree} · {item.period}
                  </p>
                </div>
              ))}
            </Card>
          </section>
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Profile health
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-950">
              {profileHealthScore}%
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Strong fintech and marketplace signal with an up-to-date skills stack and
              visible work history.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">Highlights</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">
                {resume.years} years experience across Monzo, Wise, and Paystack.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                {skills.length} structured skills ready for matching and recruiter search.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                {me.connections} network connections supporting warm introductions.
              </div>
            </div>
          </Card>
          {statusMessage ? (
            <Card className="border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-900 lg:col-span-2">
              {statusMessage}
            </Card>
          ) : null}
          <Card className="p-5">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              Sign out
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
}
