"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  FileTextIcon,
  GraduationCapIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
  WandSparklesIcon,
} from "../icons";

import { AnimatePresence, motion, useReducedMotion } from "../motion";
import { Badge, Button, Card } from "../primitives";
import {
  getStoredProfileWorkspace,
  getStoredResumeWorkspace,
  mergeProfileWithResume,
  saveProfileWorkspace,
  saveResumeWorkspace,
  type ResumeWorkspace,
} from "../workspace-state";

type Phase = "idle" | "parsing" | "done";

const steps = [
  "Reading document structure",
  "Protecting contact details",
  "Normalising impact statements",
  "Mapping skills to our taxonomy",
  "Scoring open roles",
];

function EditableField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
}: {
  icon: ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
}) {
  return (
    <label className="grid gap-2 rounded-2xl border border-slate-200 p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
      />
    </label>
  );
}

function ParsedResult({
  resume,
  skillInput,
  onSkillInputChange,
  onAddSkill,
  onRemoveSkill,
  onFieldChange,
  onAvailabilityChange,
  onReset,
  onSave,
  onReviewProfile,
  statusMessage,
}: {
  resume: ResumeWorkspace;
  skillInput: string;
  onSkillInputChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onFieldChange: (
    field: "name" | "email" | "phone" | "location" | "headline",
    value: string,
  ) => void;
  onAvailabilityChange: (value: string) => void;
  onReset: () => void;
  onSave: () => void;
  onReviewProfile: () => void;
  statusMessage: string;
}) {
  return (
    <>
      <div
        role="status"
        className="mt-5 flex flex-wrap items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <CheckCircle2Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-emerald-950">Resume parsed successfully</p>
          <p className="text-sm text-emerald-900">
            Review the extracted details, then sync them into your profile workspace.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onReset}>
          Re-upload
        </Button>
      </div>

      <section aria-labelledby="contact-title" className="mt-4">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 id="contact-title" className="font-bold text-slate-950">
                Review extracted profile data
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Edit any field before you sync it into your visible profile.
              </p>
            </div>
            <Badge tone="indigo">{resume.fileName}</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EditableField
              icon={MailIcon}
              label="Email"
              type="email"
              value={resume.email}
              onChange={(value) => onFieldChange("email", value)}
            />
            <EditableField
              icon={PhoneIcon}
              label="Phone"
              value={resume.phone}
              onChange={(value) => onFieldChange("phone", value)}
            />
            <EditableField
              icon={MapPinIcon}
              label="Location"
              value={resume.location}
              onChange={(value) => onFieldChange("location", value)}
            />
            <EditableField
              icon={BriefcaseIcon}
              label="Full name"
              value={resume.name}
              onChange={(value) => onFieldChange("name", value)}
            />
            <div className="md:col-span-2">
              <EditableField
                icon={FileTextIcon}
                label="Headline"
                value={resume.headline}
                onChange={(value) => onFieldChange("headline", value)}
              />
            </div>
          </div>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Availability note
            </span>
            <textarea
              value={resume.availabilityNote}
              onChange={(event) => onAvailabilityChange(event.target.value)}
              rows={3}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            />
          </label>
        </Card>
      </section>

      <section aria-labelledby="detected-skills-title" className="mt-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="detected-skills-title" className="font-bold text-slate-950">
                Detected skills
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Keep the matching graph clean by removing noise and adding missing signals.
              </p>
            </div>
            <div className="flex w-full max-w-sm gap-2">
              <input
                value={skillInput}
                onChange={(event) => onSkillInputChange(event.target.value)}
                placeholder="Add a skill"
                className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              />
              <Button onClick={onAddSkill}>Add</Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => onRemoveSkill(skill)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {skill}
                <span aria-hidden="true">x</span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section aria-labelledby="parsed-experience-title" className="mt-4">
        <Card className="p-5">
          <h2
            id="parsed-experience-title"
            className="flex items-center gap-2 font-bold text-slate-950"
          >
            <BriefcaseIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            Experience
          </h2>
          <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
            {resume.experience.map((item) => (
              <li key={`${item.company}-${item.role}`} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-700 ring-4 ring-white"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h3 className="font-bold text-slate-950">
                    {item.role} · {item.company}
                  </h3>
                  <span className="shrink-0 text-xs text-slate-600">{item.period}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.impact}</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section aria-labelledby="parsed-education-title" className="mt-4">
        <Card className="p-5">
          <h2
            id="parsed-education-title"
            className="flex items-center gap-2 font-bold text-slate-950"
          >
            <GraduationCapIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            Education
          </h2>
          {resume.education.map((item) => (
            <div key={`${item.school}-${item.degree}`} className="mt-3">
              <h3 className="font-bold text-slate-950">{item.degree}</h3>
              <p className="text-sm text-slate-600">
                {item.school} · {item.period}
              </p>
            </div>
          ))}
        </Card>
      </section>

      {statusMessage ? (
        <Card className="mt-4 border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-900">
          {statusMessage}
        </Card>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button onClick={onSave}>Save in workspace</Button>
        <Button variant="outline" onClick={onReviewProfile}>
          Sync to profile
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Parse another CV
        </Button>
      </div>
    </>
  );
}

export function ResumePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [resumeDraft, setResumeDraft] = useState<ResumeWorkspace>(() =>
    getStoredResumeWorkspace(),
  );
  const [skillInput, setSkillInput] = useState("");
  const [resultStatus, setResultStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  function start(fileName = resumeDraft.fileName) {
    setResumeDraft((current) => ({
      ...current,
      fileName,
      parsedAtLabel: "Processing in workspace",
    }));
    setPhase("parsing");
    setStepIdx(0);
    setResultStatus("");
  }

  function persistResumeWorkspace() {
    saveResumeWorkspace(resumeDraft);
    setResultStatus("Resume data saved in the workspace.");
  }

  function syncResumeToProfile() {
    saveResumeWorkspace(resumeDraft);
    const nextProfile = mergeProfileWithResume(
      getStoredProfileWorkspace(resumeDraft.name),
      resumeDraft,
    );
    saveProfileWorkspace(nextProfile);
    router.push("/profile");
  }

  useEffect(() => {
    if (phase !== "parsing") {
      return;
    }

    if (stepIdx >= steps.length) {
      const timer = setTimeout(() => {
        setResumeDraft((current) => ({
          ...current,
          parsedAtLabel: "Ready for review",
        }));
        setPhase("done");
      }, reduceMotion ? 0 : 300);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(
      () => setStepIdx((index) => index + 1),
      reduceMotion ? 0 : 650,
    );

    return () => clearTimeout(timer);
  }, [phase, reduceMotion, stepIdx]);

  const status =
    phase === "idle"
      ? "Ready to parse your resume."
      : phase === "done"
        ? "Resume parsed successfully. Review the extracted details below."
        : `${steps[Math.min(stepIdx, steps.length - 1)]}. Step ${Math.min(stepIdx + 1, steps.length)} of ${steps.length}.`;

  return (
    <div className="ui-fade-up space-y-6 lg:space-y-8">
      <section
        aria-labelledby="resume-title"
        className="rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8"
      >
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
          <WandSparklesIcon className="h-4 w-4" aria-hidden="true" />
          Resume Studio
        </p>
        <h1
          id="resume-title"
          className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          Turn your CV into a complete web profile
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Upload once, review the structured output, and move straight into job
          matching, recruiter visibility, and profile updates from a desktop workspace.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
            CV parsing
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Profile sync
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            Same BEJELI server
          </span>
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <AnimatePresence mode="wait">
            {phase === "idle" ? (
              <motion.div
                key="idle"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              >
                <Card className="p-6 text-center sm:p-8">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-50 text-indigo-700">
                    <UploadCloudIcon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold text-slate-950">
                    Add your resume
                  </h2>
                  <p id="file-help" className="mt-2 text-sm text-slate-600">
                    PDF, DOC or DOCX · up to 10MB
                  </p>
                  <input
                    ref={inputRef}
                    id="resume-file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    aria-label="Upload your resume"
                    aria-describedby="file-help"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      event.target.value = "";
                      start(file.name);
                    }}
                  />
                  <div className="mx-auto mt-5 grid max-w-md gap-3">
                    <Button onClick={() => inputRef.current?.click()}>
                      <FileTextIcon className="h-4 w-4" aria-hidden="true" />
                      Choose a file
                    </Button>
                    <Button variant="outline" onClick={() => start()}>
                      Try a sample CV
                    </Button>
                  </div>
                  <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm leading-6 text-slate-700">
                    Upload your current CV to hydrate contact data, structured skills,
                    experience history, and education blocks for the rest of the website.
                  </div>
                </Card>
              </motion.div>
            ) : null}

            {phase === "parsing" ? (
              <motion.div
                key="parsing"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              >
                <Card className="p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-700 text-white">
                      <SparklesIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-950">Parsing your resume</h2>
                      <p className="text-sm text-slate-600">{resumeDraft.fileName}</p>
                    </div>
                  </div>
                  <ol className="mt-6 space-y-3">
                    {steps.map((step, index) => {
                      const state =
                        index < stepIdx ? "done" : index === stepIdx ? "active" : "todo";

                      return (
                        <li key={step} className="flex items-center gap-3 text-sm">
                          <span className="grid h-6 w-6 place-items-center" aria-hidden="true">
                            {state === "done" ? (
                              <CheckCircle2Icon className="h-5 w-5 text-emerald-700" />
                            ) : state === "active" ? (
                              <Loader2Icon className="h-5 w-5 animate-spin text-indigo-700" />
                            ) : (
                              <span className="h-4 w-4 rounded-full border-2 border-slate-300" />
                            )}
                          </span>
                          <span
                            className={
                              state === "todo" ? "text-slate-500" : "font-semibold text-slate-800"
                            }
                          >
                            {step}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </motion.div>
            ) : null}

            {phase === "done" ? (
              <motion.div
                key="done"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ParsedResult
                  resume={resumeDraft}
                  skillInput={skillInput}
                  onSkillInputChange={setSkillInput}
                  onAddSkill={() => {
                    const normalized = skillInput.trim();
                    if (!normalized) {
                      setResultStatus("Add a skill name before saving.");
                      return;
                    }
                    if (
                      resumeDraft.skills.some(
                        (skill) => skill.toLowerCase() === normalized.toLowerCase(),
                      )
                    ) {
                      setResultStatus("That skill is already present.");
                      return;
                    }
                    setResumeDraft((current) => ({
                      ...current,
                      skills: [...current.skills, normalized],
                    }));
                    setSkillInput("");
                    setResultStatus(`Added ${normalized} to the parsed skill set.`);
                  }}
                  onRemoveSkill={(skill) => {
                    setResumeDraft((current) => ({
                      ...current,
                      skills: current.skills.filter((item) => item !== skill),
                    }));
                    setResultStatus(`Removed ${skill} from the parsed skill set.`);
                  }}
                  onFieldChange={(field, value) =>
                    setResumeDraft((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                  onAvailabilityChange={(value) =>
                    setResumeDraft((current) => ({
                      ...current,
                      availabilityNote: value,
                    }))
                  }
                  onReset={() => {
                    setPhase("idle");
                    setResultStatus("");
                  }}
                  onSave={persistResumeWorkspace}
                  onReviewProfile={syncResumeToProfile}
                  statusMessage={resultStatus}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="font-bold text-slate-950">Trust and privacy</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your data stays in UK zones. PII is encrypted at rest and can be deleted on
              request through the privacy controls.
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
              Parser confidence
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-950">
              {resumeDraft.confidence}%
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Last status: {resumeDraft.parsedAtLabel}
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">Preferred roles</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {resumeDraft.preferredRoles.map((role) => (
                <Badge key={role} tone="indigo">
                  {role}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-950">What gets extracted</h2>
            <div className="mt-4 space-y-3">
              {[
                "Email, phone, and location",
                "Structured skills for matching",
                "Experience timeline and impact statements",
                "Education history for profile completeness",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <CheckCircle2Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
