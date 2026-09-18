"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({
  children,
  ...props
}: IconProps & {
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function BanknoteIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9h.01M17 15h.01" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function BriefcaseBusinessIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M3 11h18" />
    </IconBase>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return <BriefcaseBusinessIcon {...props} />;
}

export function CheckCircle2Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4 4L19 6" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3 21 21" />
      <path d="M10.6 10.6a2 2 0 1 0 2.8 2.8" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-4.1 4.8" />
      <path d="M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8" />
    </IconBase>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </IconBase>
  );
}

export function GraduationCapIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m2 10 10-5 10 5-10 5-10-5Z" />
      <path d="M6 12v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
    </IconBase>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 20-7-7a4.5 4.5 0 0 1 6.4-6.4L12 7.2l.6-.6A4.5 4.5 0 0 1 19 13Z" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 15-4-4-5 5-2-2-4 4" />
    </IconBase>
  );
}

export function Loader2Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </IconBase>
  );
}

export function LockKeyholeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      <circle cx="12" cy="16" r="1" />
    </IconBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </IconBase>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.3 8.3 0 0 1-3.5-.7L3 21l1.7-5A8.5 8.5 0 1 1 21 11.5Z" />
    </IconBase>
  );
}

export function ThumbsUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 11v9" />
      <path d="M12.2 11 13 6.6A2.7 2.7 0 0 1 15.6 4h.2A2.2 2.2 0 0 1 18 6.2v3.3h1.3A2.7 2.7 0 0 1 22 12.2l-1.1 5A3.5 3.5 0 0 1 17.5 20H10a2 2 0 0 1-2-2v-5a2 2 0 0 1 .6-1.4L12.2 8" />
      <path d="M8 11H5.7A1.7 1.7 0 0 0 4 12.7v5.6A1.7 1.7 0 0 0 5.7 20H8" />
    </IconBase>
  );
}

export function VolumeOnIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 15h3l4 4V5L8 9H5Z" />
      <path d="M16 9.5a4.5 4.5 0 0 1 0 5" />
      <path d="M18.8 7a8 8 0 0 1 0 10" />
    </IconBase>
  );
}

export function VolumeOffIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 15h3l4 4V5L8 9H5Z" />
      <path d="m16 10 4 4" />
      <path d="m20 10-4 4" />
    </IconBase>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 20 4.5-1 9-9-3.5-3.5-9 9L4 20Z" />
      <path d="m13 6 3.5 3.5" />
    </IconBase>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 16.9Z" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function Share2Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.7 6.8-4.1M8.6 13.3l6.8 4.1" />
    </IconBase>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </IconBase>
  );
}

export function SlidersHorizontalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 17h16" />
      <circle cx="8" cy="7" r="2" />
      <circle cx="16" cy="17" r="2" />
    </IconBase>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m19 14 .7 2 .3.7.7.3 2 .7-2 .7-.7.3-.3.7-.7 2-.7-2-.3-.7-.7-.3-2-.7 2-.7.7-.3.3-.7.7-2Z" />
      <path d="m5 14 .6 1.7L7.3 16l-1.7.6L5 18.3l-.6-1.7L2.7 16l1.7-.6L5 14Z" />
    </IconBase>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconBase>
  );
}

export function UploadCloudIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 18a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18 12h1a3 3 0 1 1 0 6Z" />
      <path d="m12 15 0-6" />
      <path d="m9.5 11.5 2.5-2.5 2.5 2.5" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

export function UserRoundIcon(props: IconProps) {
  return <UserIcon {...props} />;
}

export function VideoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3Z" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8.5" r="3.5" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 19a6 6 0 0 1 12 0M15 19a4 4 0 0 1 6 0" />
    </IconBase>
  );
}

export function WandSparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 20 10-10" />
      <path d="m14 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
      <path d="m17 12 .7-1.5L19 12l1.5.7L19 13.5 17.7 15 17 13.5l-1.5-.8L17 12Z" />
      <path d="m2 22 4-1-3-3-1 4Z" />
    </IconBase>
  );
}
