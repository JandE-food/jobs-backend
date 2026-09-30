"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { useKindredAuth } from "../app/kindred-provider";
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "../icons";
import { Button, Card, cn } from "../primitives";
import { navigateWithTransition } from "../TransitionLink";
import {
  getDefaultRecruiterDiscoverySettings,
  getDefaultTalentDiscoverySettings,
  getStoredRecruiterDiscoverySettings,
  getStoredTalentDiscoverySettings,
  saveRecruiterDiscoverySettings,
  saveTalentDiscoverySettings,
  type RecruiterDiscoverySettings,
  type TalentDiscoverySettings,
} from "../workspace-state";

const talentSectorOptions = [
  "Technology",
  "Health",
  "Finance",
  "Logistics",
  "Retail",
  "Care",
  "Hospitality",
  "Construction",
] as const;
const talentRoleOptions = [
  "Product",
  "Design",
  "Engineering",
  "Operations",
  "Marketing",
  "Sales",
  "Support",
  "Shift Work",
] as const;
const talentLocationModeOptions = ["Nearby", "Same City", "Same Country", "Anywhere"] as const;
const talentWorkModelOptions = ["Remote", "Hybrid", "On-site", "Shift-based"] as const;
const talentEmploymentTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
] as const;
const talentExperienceLevelOptions = ["Entry", "Junior", "Mid", "Senior", "Lead"] as const;
const talentFreshnessOptions = [
  "Any time",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
] as const;
const talentBenefitOptions = [
  "Health Insurance",
  "Visa Sponsorship",
  "Relocation Support",
  "Flexible Hours",
  "Training",
  "Equity",
  "Paid Leave",
] as const;
const talentCompanySizeOptions = ["Startup", "Small Team", "Mid-size", "Enterprise"] as const;

const recruiterModeOptions = [
  "For You",
  "Ready Now",
  "Nearby",
  "Verified Talent",
  "High Match",
] as const;
const recruiterRoleOptions = [
  "Frontend Engineer",
  "Product Designer",
  "Warehouse Staff",
  "Care Worker",
  "Sales Manager",
  "Customer Support",
  "Operations Lead",
  "Growth Marketer",
] as const;
const recruiterSkillOptions = [
  "React",
  "Figma",
  "Forklift",
  "Customer Support",
  "Project Management",
  "Salesforce",
  "Excel",
  "Content Creation",
] as const;
const recruiterExperienceLevelOptions = ["Entry", "Junior", "Mid", "Senior", "Lead"] as const;
const recruiterAvailabilityOptions = [
  "Immediate",
  "This Week",
  "This Month",
  "Open to Offers",
] as const;
const recruiterLocationModeOptions = ["Nearby", "Same City", "Same Country", "Anywhere"] as const;
const recruiterWorkModelFitOptions = [
  "Remote-ready",
  "Hybrid-ready",
  "On-site ready",
  "Shift-ready",
] as const;
const recruiterRightToWorkOptions = [
  "Verified",
  "Requires Sponsorship",
  "Open to Visa Support",
  "Any",
] as const;
const recruiterCertificationOptions = [
  "AWS",
  "CNA",
  "NVQ",
  "PMP",
  "Google Analytics",
  "ACCA",
  "CompTIA",
  "HubSpot",
] as const;
const recruiterActivityWindowOptions = [
  "Any time",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
] as const;

function SelectionSummary({
  values,
  emptyLabel,
}: {
  values: string[];
  emptyLabel: string;
}) {
  if (!values.length) {
    return <span className="text-sm text-slate-400">{emptyLabel}</span>;
  }

  return (
    <span className="line-clamp-2 text-right text-sm font-semibold text-slate-700">
      {values.join(", ")}
    </span>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-1">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-all duration-200",
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-slate-950" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 rounded-full bg-white shadow-[0_8px_18px_rgba(15,23,42,0.14)] transition-transform duration-200",
          checked ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}

function FieldCard({
  label,
  fieldName,
  helper,
  value,
  children,
  fullWidth,
}: {
  label: string;
  fieldName: string;
  helper?: string;
  value?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-slate-200/90 bg-white/98 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <div className="space-y-4 p-4 sm:p-5">
        <div
          className={cn(
            "gap-3",
            value && !fullWidth ? "flex items-start justify-between" : "space-y-2",
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-slate-950">{label}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {fieldName}
              </span>
            </div>
            {helper ? <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p> : null}
          </div>
          {value ? <div className="min-w-[7rem] pt-0.5 text-right">{value}</div> : null}
        </div>
        {children}
      </div>
    </Card>
  );
}

function PickerField({
  label,
  fieldName,
  helper,
  options,
  values,
  onToggle,
  placeholder,
}: {
  label: string;
  fieldName: string;
  helper: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  placeholder: string;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<SelectionSummary values={values} emptyLabel={placeholder} />}
    >
      <div className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3">
        <span className="text-sm font-medium text-slate-500">Multi-select picker</span>
        <ArrowRightIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <Chip key={option} active={active} onClick={() => onToggle(option)}>
              {active ? <CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" /> : null}
              {option}
            </Chip>
          );
        })}
      </div>
    </FieldCard>
  );
}

function SingleChipField({
  label,
  fieldName,
  helper,
  options,
  value,
  onChange,
}: {
  label: string;
  fieldName: string;
  helper: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<span className="text-sm font-semibold text-slate-700">{value}</span>}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} active={value === option} onClick={() => onChange(option)}>
            {option}
          </Chip>
        ))}
      </div>
    </FieldCard>
  );
}

function MultiChipField({
  label,
  fieldName,
  helper,
  options,
  values,
  onToggle,
}: {
  label: string;
  fieldName: string;
  helper: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<SelectionSummary values={values} emptyLabel="No values selected" />}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <Chip key={option} active={active} onClick={() => onToggle(option)}>
              {active ? <CheckIcon className="mr-1 h-4 w-4" aria-hidden="true" /> : null}
              {option}
            </Chip>
          );
        })}
      </div>
    </FieldCard>
  );
}

function ToggleField({
  label,
  fieldName,
  helper,
  checked,
  onChange,
}: {
  label: string;
  fieldName: string;
  helper: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<span className="text-sm font-semibold text-slate-700">{checked ? "On" : "Off"}</span>}
    >
      <div className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3">
        <p className="text-sm font-medium text-slate-500">Toggle control</p>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </FieldCard>
  );
}

function TextField({
  label,
  fieldName,
  helper,
  value,
  onChange,
  icon,
  placeholder,
}: {
  label: string;
  fieldName: string;
  helper: string;
  value: string;
  onChange: (next: string) => void;
  icon?: React.ReactNode;
  placeholder: string;
}) {
  return (
    <FieldCard label={label} fieldName={fieldName} helper={helper} fullWidth>
      <label className="flex min-h-12 items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4">
        {icon}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </label>
    </FieldCard>
  );
}

function SliderField({
  label,
  fieldName,
  helper,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  fieldName: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<span className="text-sm font-semibold text-slate-700">{`${value}${suffix}`}</span>}
    >
      <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full accent-slate-950"
        />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <span>{`${min}${suffix}`}</span>
          <span>{`${max}${suffix}`}</span>
        </div>
      </div>
    </FieldCard>
  );
}

function CurrencyRangeField({
  label,
  fieldName,
  helper,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  fieldName: string;
  helper: string;
  minValue: number;
  maxValue: number;
  onMinChange: (next: number) => void;
  onMaxChange: (next: number) => void;
}) {
  return (
    <FieldCard
      label={label}
      fieldName={fieldName}
      helper={helper}
      value={<span className="text-sm font-semibold text-slate-700">{`₦${minValue.toLocaleString()} - ₦${maxValue.toLocaleString()}`}</span>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Minimum</span>
          <input
            type="number"
            min={0}
            step={5000}
            value={minValue}
            onChange={(event) => onMinChange(Number(event.target.value) || 0)}
            className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
          />
        </label>
        <label className="rounded-[1.25rem] border border-slate-200 bg-slate-50/90 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Maximum</span>
          <input
            type="number"
            min={0}
            step={5000}
            value={maxValue}
            onChange={(event) => onMaxChange(Number(event.target.value) || 0)}
            className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
          />
        </label>
      </div>
    </FieldCard>
  );
}

function SettingsScaffold({
  title,
  subtitle,
  statusMessage,
  onClose,
  onDone,
  onReset,
  onApply,
  children,
}: {
  title: string;
  subtitle: string;
  statusMessage: string;
  onClose: () => void;
  onDone: () => void;
  onReset: () => void;
  onApply: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-[calc(100vh-5rem)] max-w-4xl px-0 pb-28 sm:px-4 sm:py-5">
      <section className="overflow-hidden border-y border-slate-200/80 bg-slate-100/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:border">
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
            >
              Close
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-[1.9rem]">
                {title}
              </h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Product-ready controls
              </p>
            </div>
            <button
              type="button"
              onClick={onDone}
              className="text-sm font-bold text-indigo-700 transition-colors hover:text-indigo-800"
            >
              Done
            </button>
          </div>
        </div>

        <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
          <Card className="border-slate-200 bg-white/95 p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.25rem] bg-slate-950 text-white">
                <SlidersHorizontalIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Discovery</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">{subtitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your preferences improve ranking. Turn on{" "}
                  <span className="font-semibold text-slate-700">Strict Filters</span> if you want
                  them to fully limit what appears in your feed.
                </p>
              </div>
            </div>
          </Card>

          {children}

          <Card className="border-slate-200 bg-white/95 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Apply changes without leaving, reset to the recommended defaults, or save and
                  return to the feed.
                </p>
              </div>
              <Button variant="ghost" className="min-h-11 px-0 text-slate-500" onClick={onReset}>
                Reset to Default
              </Button>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button className="sm:flex-1" onClick={onApply}>
                Apply Settings
              </Button>
              <Button variant="outline" className="sm:flex-1" onClick={onDone}>
                Save and Close
              </Button>
            </div>
            {statusMessage ? (
              <p className="mt-4 text-sm font-medium text-emerald-700">{statusMessage}</p>
            ) : null}
          </Card>
        </div>
      </section>
    </div>
  );
}

function toggleArrayValue<T extends string>(current: T[], value: T) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function TalentDiscoverySettingsForm() {
  const router = useRouter();
  const { user } = useKindredAuth();
  const identity = useMemo(
    () => ({
      userId: user?.id,
      userFullName: user?.fullName,
      userEmail: user?.email,
    }),
    [user?.email, user?.fullName, user?.id],
  );
  const [settings, setSettings] = useState<TalentDiscoverySettings>(() =>
    getStoredTalentDiscoverySettings(identity),
  );
  const [statusMessage, setStatusMessage] = useState("");

  function updateSettings(patch: Partial<TalentDiscoverySettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function persist(nextSettings: TalentDiscoverySettings) {
    saveTalentDiscoverySettings(nextSettings, user?.id);
    setStatusMessage("Talent discovery settings saved.");
  }

  function handleApply() {
    persist(settings);
  }

  function handleDone() {
    persist(settings);
    navigateWithTransition(router, "/");
  }

  function handleReset() {
    const defaults = getDefaultTalentDiscoverySettings();
    setSettings(defaults);
    saveTalentDiscoverySettings(defaults, user?.id);
    setStatusMessage("Talent discovery settings reset to default.");
  }

  return (
    <SettingsScaffold
      title="Discovery Settings"
      subtitle="Control which company videos and hiring posts appear in your feed"
      statusMessage={statusMessage}
      onClose={() => navigateWithTransition(router, "/")}
      onDone={handleDone}
      onReset={handleReset}
      onApply={handleApply}
    >
      <SectionHeader title="Modes" description="Quick ranking presets for the talent discovery feed." />
      <SingleChipField
        label="Mode"
        fieldName="feedMode"
        helper="Control type: single-select chips."
        options={["For You", "Nearby", "Verified", "Urgent Hiring", "Remote First"]}
        value={settings.feedMode}
        onChange={(next) =>
          updateSettings({ feedMode: next as TalentDiscoverySettings["feedMode"] })
        }
      />

      <SectionHeader
        title="Core Discovery"
        description="Essential factors that shape which company and recruiter videos appear first."
      />
      <PickerField
        label="Industries"
        fieldName="preferredSectors"
        helper="Control type: multi-select picker."
        options={talentSectorOptions}
        values={settings.preferredSectors}
        onToggle={(option) =>
          updateSettings({
            preferredSectors: toggleArrayValue(settings.preferredSectors, option),
          })
        }
        placeholder="Choose sectors"
      />
      <PickerField
        label="Roles"
        fieldName="preferredRoles"
        helper="Control type: multi-select picker."
        options={talentRoleOptions}
        values={settings.preferredRoles}
        onToggle={(option) =>
          updateSettings({
            preferredRoles: toggleArrayValue(settings.preferredRoles, option),
          })
        }
        placeholder="Choose roles"
      />
      <SingleChipField
        label="Location Type"
        fieldName="locationMode"
        helper="Control type: single-select chips."
        options={talentLocationModeOptions}
        value={settings.locationMode}
        onChange={(next) =>
          updateSettings({ locationMode: next as TalentDiscoverySettings["locationMode"] })
        }
      />
      <TextField
        label="Location"
        fieldName="searchLocation"
        helper="Control type: searchable location row with chevron behavior."
        value={settings.searchLocation}
        onChange={(next) => updateSettings({ searchLocation: next })}
        placeholder="Enter city, state, or country"
        icon={<MapPinIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />}
      />
      <SliderField
        label="Maximum Distance"
        fieldName="maxDistanceKm"
        helper="Control type: slider."
        value={settings.maxDistanceKm}
        min={5}
        max={500}
        step={5}
        suffix=" km"
        onChange={(next) => updateSettings({ maxDistanceKm: next })}
      />
      <MultiChipField
        label="Work Style"
        fieldName="workModels"
        helper="Control type: multi-select chips."
        options={talentWorkModelOptions}
        values={settings.workModels}
        onToggle={(option) =>
          updateSettings({
            workModels: toggleArrayValue(settings.workModels, option as (typeof talentWorkModelOptions)[number]),
          })
        }
      />
      <MultiChipField
        label="Employment Type"
        fieldName="employmentTypes"
        helper="Control type: multi-select chips."
        options={talentEmploymentTypeOptions}
        values={settings.employmentTypes}
        onToggle={(option) =>
          updateSettings({
            employmentTypes: toggleArrayValue(
              settings.employmentTypes,
              option as (typeof talentEmploymentTypeOptions)[number],
            ),
          })
        }
      />
      <CurrencyRangeField
        label="Pay Range"
        fieldName="salaryMin / salaryMax"
        helper="Control type: slider / numeric input."
        minValue={settings.salaryMin}
        maxValue={Math.max(settings.salaryMin, settings.salaryMax)}
        onMinChange={(next) =>
          updateSettings({
            salaryMin: next,
            salaryMax: Math.max(next, settings.salaryMax),
          })
        }
        onMaxChange={(next) =>
          updateSettings({
            salaryMax: Math.max(settings.salaryMin, next),
          })
        }
      />
      <MultiChipField
        label="Experience Level"
        fieldName="experienceLevels"
        helper="Control type: multi-select chips."
        options={talentExperienceLevelOptions}
        values={settings.experienceLevels}
        onToggle={(option) =>
          updateSettings({
            experienceLevels: toggleArrayValue(
              settings.experienceLevels,
              option as (typeof talentExperienceLevelOptions)[number],
            ),
          })
        }
      />

      <SectionHeader title="Quality & Trust" description="Trust and quality signals for the talent feed." />
      <ToggleField
        label="Verified Companies Only"
        fieldName="verifiedCompaniesOnly"
        helper="Control type: toggle."
        checked={settings.verifiedCompaniesOnly}
        onChange={(next) => updateSettings({ verifiedCompaniesOnly: next })}
      />
      <ToggleField
        label="Verified Recruiters Only"
        fieldName="verifiedRecruitersOnly"
        helper="Control type: toggle."
        checked={settings.verifiedRecruitersOnly}
        onChange={(next) => updateSettings({ verifiedRecruitersOnly: next })}
      />
      <SingleChipField
        label="Post Freshness"
        fieldName="freshnessWindow"
        helper="Control type: single-select chips."
        options={talentFreshnessOptions}
        value={settings.freshnessWindow}
        onChange={(next) =>
          updateSettings({ freshnessWindow: next as TalentDiscoverySettings["freshnessWindow"] })
        }
      />
      <PickerField
        label="Benefits"
        fieldName="benefitPreferences"
        helper="Control type: multi-select picker."
        options={talentBenefitOptions}
        values={settings.benefitPreferences}
        onToggle={(option) =>
          updateSettings({
            benefitPreferences: toggleArrayValue(
              settings.benefitPreferences,
              option as (typeof talentBenefitOptions)[number],
            ),
          })
        }
        placeholder="Choose benefits"
      />
      <MultiChipField
        label="Company Size"
        fieldName="companySize"
        helper="Control type: multi-select chips."
        options={talentCompanySizeOptions}
        values={settings.companySize}
        onToggle={(option) =>
          updateSettings({
            companySize: toggleArrayValue(
              settings.companySize,
              option as (typeof talentCompanySizeOptions)[number],
            ),
          })
        }
      />

      <SectionHeader title="Flex Rules" description="Soft expansion rules to keep the feed from going empty." />
      <ToggleField
        label="Show Near Matches"
        fieldName="allowNearMatches"
        helper="Control type: toggle."
        checked={settings.allowNearMatches}
        onChange={(next) => updateSettings({ allowNearMatches: next })}
      />
      <ToggleField
        label="Expand Distance If Feed Is Low"
        fieldName="expandDistanceIfLowSupply"
        helper="Control type: toggle."
        checked={settings.expandDistanceIfLowSupply}
        onChange={(next) => updateSettings({ expandDistanceIfLowSupply: next })}
      />
      <ToggleField
        label="Expand Pay Range If Feed Is Low"
        fieldName="expandSalaryIfLowSupply"
        helper="Control type: toggle."
        checked={settings.expandSalaryIfLowSupply}
        onChange={(next) => updateSettings({ expandSalaryIfLowSupply: next })}
      />
      <ToggleField
        label="Include Aspirational Roles"
        fieldName="includeAspirationalRoles"
        helper="Control type: toggle."
        checked={settings.includeAspirationalRoles}
        onChange={(next) => updateSettings({ includeAspirationalRoles: next })}
      />

      <SectionHeader title="Advanced" description="Strict gating and ranking preferences." />
      <ToggleField
        label="Strict Filters"
        fieldName="strictFilters"
        helper="Control type: toggle."
        checked={settings.strictFilters}
        onChange={(next) => updateSettings({ strictFilters: next })}
      />
      <ToggleField
        label="Hide Seen Videos"
        fieldName="hideSeenVideos"
        helper="Control type: toggle."
        checked={settings.hideSeenVideos}
        onChange={(next) => updateSettings({ hideSeenVideos: next })}
      />
      <ToggleField
        label="Prioritize Best Matches First"
        fieldName="prioritizeHighMatch"
        helper="Control type: toggle."
        checked={settings.prioritizeHighMatch}
        onChange={(next) => updateSettings({ prioritizeHighMatch: next })}
      />
    </SettingsScaffold>
  );
}

function RecruiterDiscoverySettingsForm() {
  const router = useRouter();
  const { user } = useKindredAuth();
  const identity = useMemo(
    () => ({
      userId: user?.id,
      userFullName: user?.fullName,
      userEmail: user?.email,
    }),
    [user?.email, user?.fullName, user?.id],
  );
  const [settings, setSettings] = useState<RecruiterDiscoverySettings>(() =>
    getStoredRecruiterDiscoverySettings(identity),
  );
  const [statusMessage, setStatusMessage] = useState("");

  function updateSettings(patch: Partial<RecruiterDiscoverySettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function persist(nextSettings: RecruiterDiscoverySettings) {
    saveRecruiterDiscoverySettings(nextSettings, user?.id);
    setStatusMessage("Company discovery settings saved.");
  }

  function handleApply() {
    persist(settings);
  }

  function handleDone() {
    persist(settings);
    navigateWithTransition(router, "/recruiter");
  }

  function handleReset() {
    const defaults = getDefaultRecruiterDiscoverySettings();
    setSettings(defaults);
    saveRecruiterDiscoverySettings(defaults, user?.id);
    setStatusMessage("Company discovery settings reset to default.");
  }

  return (
    <SettingsScaffold
      title="Discovery Settings"
      subtitle="Control which talent videos and candidate reels appear in your feed"
      statusMessage={statusMessage}
      onClose={() => navigateWithTransition(router, "/recruiter")}
      onDone={handleDone}
      onReset={handleReset}
      onApply={handleApply}
    >
      <SectionHeader title="Modes" description="Quick ranking presets for recruiter discovery." />
      <SingleChipField
        label="Mode"
        fieldName="feedMode"
        helper="Control type: single-select chips."
        options={recruiterModeOptions}
        value={settings.feedMode}
        onChange={(next) =>
          updateSettings({ feedMode: next as RecruiterDiscoverySettings["feedMode"] })
        }
      />

      <SectionHeader
        title="Core Discovery"
        description="Essential candidate signals that shape which talent videos are surfaced first."
      />
      <PickerField
        label="Target Roles"
        fieldName="targetRoles"
        helper="Control type: multi-select picker."
        options={recruiterRoleOptions}
        values={settings.targetRoles}
        onToggle={(option) =>
          updateSettings({
            targetRoles: toggleArrayValue(settings.targetRoles, option),
          })
        }
        placeholder="Choose roles"
      />
      <PickerField
        label="Skills"
        fieldName="requiredSkills"
        helper="Control type: multi-select picker."
        options={recruiterSkillOptions}
        values={settings.requiredSkills}
        onToggle={(option) =>
          updateSettings({
            requiredSkills: toggleArrayValue(settings.requiredSkills, option),
          })
        }
        placeholder="Choose skills"
      />
      <SliderField
        label="Minimum Experience"
        fieldName="experienceMinYears"
        helper="Control type: slider."
        value={settings.experienceMinYears}
        min={0}
        max={15}
        step={1}
        suffix=" yrs"
        onChange={(next) => updateSettings({ experienceMinYears: next })}
      />
      <MultiChipField
        label="Seniority"
        fieldName="experienceLevels"
        helper="Control type: multi-select chips."
        options={recruiterExperienceLevelOptions}
        values={settings.experienceLevels}
        onToggle={(option) =>
          updateSettings({
            experienceLevels: toggleArrayValue(
              settings.experienceLevels,
              option as (typeof recruiterExperienceLevelOptions)[number],
            ),
          })
        }
      />
      <MultiChipField
        label="Availability"
        fieldName="availabilityStatus"
        helper="Control type: multi-select chips."
        options={recruiterAvailabilityOptions}
        values={settings.availabilityStatus}
        onToggle={(option) =>
          updateSettings({
            availabilityStatus: toggleArrayValue(
              settings.availabilityStatus,
              option as (typeof recruiterAvailabilityOptions)[number],
            ),
          })
        }
      />
      <SingleChipField
        label="Search Area"
        fieldName="locationMode"
        helper="Control type: single-select chips."
        options={recruiterLocationModeOptions}
        value={settings.locationMode}
        onChange={(next) =>
          updateSettings({ locationMode: next as RecruiterDiscoverySettings["locationMode"] })
        }
      />
      <TextField
        label="Location"
        fieldName="searchLocation"
        helper="Control type: searchable location row with chevron behavior."
        value={settings.searchLocation}
        onChange={(next) => updateSettings({ searchLocation: next })}
        placeholder="Enter city, state, or country"
        icon={<MapPinIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />}
      />
      <SliderField
        label="Maximum Distance"
        fieldName="maxDistanceKm"
        helper="Control type: slider."
        value={settings.maxDistanceKm}
        min={5}
        max={500}
        step={5}
        suffix=" km"
        onChange={(next) => updateSettings({ maxDistanceKm: next })}
      />
      <MultiChipField
        label="Work Model"
        fieldName="workModelFit"
        helper="Control type: multi-select chips."
        options={recruiterWorkModelFitOptions}
        values={settings.workModelFit}
        onToggle={(option) =>
          updateSettings({
            workModelFit: toggleArrayValue(
              settings.workModelFit,
              option as (typeof recruiterWorkModelFitOptions)[number],
            ),
          })
        }
      />
      <CurrencyRangeField
        label="Compensation Expectation"
        fieldName="compensationMin / compensationMax"
        helper="Control type: slider / numeric input."
        minValue={settings.compensationMin}
        maxValue={Math.max(settings.compensationMin, settings.compensationMax)}
        onMinChange={(next) =>
          updateSettings({
            compensationMin: next,
            compensationMax: Math.max(next, settings.compensationMax),
          })
        }
        onMaxChange={(next) =>
          updateSettings({
            compensationMax: Math.max(settings.compensationMin, next),
          })
        }
      />

      <SectionHeader title="Screening" description="Trust, compliance, and candidate completeness controls." />
      <MultiChipField
        label="Right to Work"
        fieldName="rightToWorkStatus"
        helper="Control type: multi-select chips."
        options={recruiterRightToWorkOptions}
        values={settings.rightToWorkStatus}
        onToggle={(option) =>
          updateSettings({
            rightToWorkStatus: toggleArrayValue(
              settings.rightToWorkStatus,
              option as (typeof recruiterRightToWorkOptions)[number],
            ),
          })
        }
      />
      <PickerField
        label="Certifications"
        fieldName="certificationRequirements"
        helper="Control type: multi-select picker."
        options={recruiterCertificationOptions}
        values={settings.certificationRequirements}
        onToggle={(option) =>
          updateSettings({
            certificationRequirements: toggleArrayValue(
              settings.certificationRequirements,
              option,
            ),
          })
        }
        placeholder="Choose certifications"
      />
      <SliderField
        label="Minimum Profile Completeness"
        fieldName="profileCompletenessMin"
        helper="Control type: slider."
        value={settings.profileCompletenessMin}
        min={0}
        max={100}
        step={5}
        suffix="%"
        onChange={(next) => updateSettings({ profileCompletenessMin: next })}
      />
      <ToggleField
        label="Video Required"
        fieldName="mustHaveVideo"
        helper="Control type: toggle."
        checked={settings.mustHaveVideo}
        onChange={(next) => updateSettings({ mustHaveVideo: next })}
      />
      <ToggleField
        label="CV Required"
        fieldName="mustHaveCv"
        helper="Control type: toggle."
        checked={settings.mustHaveCv}
        onChange={(next) => updateSettings({ mustHaveCv: next })}
      />
      <SingleChipField
        label="Recently Active"
        fieldName="activityWindow"
        helper="Control type: single-select chips."
        options={recruiterActivityWindowOptions}
        value={settings.activityWindow}
        onChange={(next) =>
          updateSettings({ activityWindow: next as RecruiterDiscoverySettings["activityWindow"] })
        }
      />

      <SectionHeader title="Flex Rules" description="Soft expansion rules to keep recruiter discovery flowing." />
      <ToggleField
        label="Show Adjacent Candidates"
        fieldName="allowAdjacentCandidates"
        helper="Control type: toggle."
        checked={settings.allowAdjacentCandidates}
        onChange={(next) => updateSettings({ allowAdjacentCandidates: next })}
      />
      <ToggleField
        label="Expand Distance If Feed Is Low"
        fieldName="expandDistanceIfLowSupply"
        helper="Control type: toggle."
        checked={settings.expandDistanceIfLowSupply}
        onChange={(next) => updateSettings({ expandDistanceIfLowSupply: next })}
      />
      <ToggleField
        label="Expand Experience Range If Feed Is Low"
        fieldName="expandExperienceIfLowSupply"
        helper="Control type: toggle."
        checked={settings.expandExperienceIfLowSupply}
        onChange={(next) => updateSettings({ expandExperienceIfLowSupply: next })}
      />
      <ToggleField
        label="Include Trainable Talent"
        fieldName="includeTrainableTalent"
        helper="Control type: toggle."
        checked={settings.includeTrainableTalent}
        onChange={(next) => updateSettings({ includeTrainableTalent: next })}
      />

      <SectionHeader title="Advanced" description="Strict gating and ranking preferences." />
      <ToggleField
        label="Strict Filters"
        fieldName="strictFilters"
        helper="Control type: toggle."
        checked={settings.strictFilters}
        onChange={(next) => updateSettings({ strictFilters: next })}
      />
      <ToggleField
        label="Hide Seen Videos"
        fieldName="hideSeenVideos"
        helper="Control type: toggle."
        checked={settings.hideSeenVideos}
        onChange={(next) => updateSettings({ hideSeenVideos: next })}
      />
      <ToggleField
        label="Prioritize Best Matches First"
        fieldName="prioritizeTopMatches"
        helper="Control type: toggle."
        checked={settings.prioritizeTopMatches}
        onChange={(next) => updateSettings({ prioritizeTopMatches: next })}
      />
    </SettingsScaffold>
  );
}

export function DiscoverySettingsPage({
  role,
}: {
  role: "talent" | "recruiter";
}) {
  const { user } = useKindredAuth();

  return (
    <div className="ui-fade-up">
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
          {role === "recruiter" ? (
            <>
              <ShieldCheckIcon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Company discovery
            </>
          ) : (
            <>
              <SlidersHorizontalIcon className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              Talent discovery
            </>
          )}
          {user?.fullName ? <span className="text-slate-300">·</span> : null}
          {user?.fullName ? <span className="normal-case tracking-normal">{user.fullName}</span> : null}
        </div>
      </div>
      {role === "recruiter" ? <RecruiterDiscoverySettingsForm /> : <TalentDiscoverySettingsForm />}
    </div>
  );
}
