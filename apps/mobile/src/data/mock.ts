import type { ImageSourcePropType } from "react-native";

export type Person = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: ImageSourcePropType;
  mutuals?: number;
};

export const AVATARS = {
  me: require("../../assets/reference/fb9888b1-f7b9-4ef9-87c8-ff02711873f4.jpg"),
  person1: require("../../assets/reference/06268595-3d3c-4afa-b17a-29b441e05bb1.jpg"),
  person2: require("../../assets/reference/b34423e8-9eb4-4e14-9e79-b5fcac9ac30a.jpg"),
  person3: require("../../assets/reference/a4f6e948-f754-411d-8e3e-8999fbef019f.jpg"),
  cover: require("../../assets/reference/ce3f4cb0-0bb7-4579-bea5-758b84ba12e5.jpg"),
};

export const me: Person & {
  headline: string;
  connections: number;
  profileScore: number;
} = {
  id: "me",
  name: "Amara Okonkwo",
  title: "Senior Product Designer",
  company: "Open to work",
  location: "London, UK",
  avatar: AVATARS.me,
  headline: "Senior Product Designer · Fintech & marketplaces · ex-Monzo",
  connections: 842,
  profileScore: 78,
};

export const people: Person[] = [
  {
    id: "p1",
    name: "James Whitfield",
    title: "Head of Talent",
    company: "Civo",
    location: "Manchester, UK",
    avatar: AVATARS.person1,
    mutuals: 12,
  },
  {
    id: "p2",
    name: "Priya Nair",
    title: "Engineering Manager",
    company: "Paystack",
    location: "Lagos, NG",
    avatar: AVATARS.person2,
    mutuals: 5,
  },
  {
    id: "p3",
    name: "Tobi Adeyemi",
    title: "Product Lead",
    company: "Flutterwave",
    location: "Berlin, DE",
    avatar: AVATARS.person3,
    mutuals: 21,
  },
  {
    id: "p4",
    name: "Marta Silva",
    title: "Logistics Operations Lead",
    company: "SwiftDrop",
    location: "Birmingham, UK",
    avatar: AVATARS.person1,
    mutuals: 8,
  },
  {
    id: "p5",
    name: "Aisha Bello",
    title: "Care Team Coordinator",
    company: "CareCircle",
    location: "London, UK",
    avatar: AVATARS.person2,
    mutuals: 14,
  },
];

export type FeedItem =
  | {
      kind: "post";
      id: string;
      channel: "Work" | "Showcase" | "Local";
      author: Person;
      time: string;
      body: string;
      tags: string[];
      likes: number;
      comments: number;
      liked?: boolean;
      attachments?: FeedAttachment[];
      mediaLayout?: FeedMediaLayout;
      edited?: boolean;
    }
  | {
      kind: "match";
      id: string;
      role: string;
      company: string;
      location: string;
      salary: string;
      score: number;
      reasons: string[];
    }
  | {
      kind: "hiring";
      id: string;
      author: Person;
      time: string;
      role: string;
      note: string;
      seats: number;
    };

export type FeedAttachment = {
  id: string;
  kind: "image" | "video";
  fileName: string;
  mimeType?: string;
  uri?: string;
  sizeLabel?: string;
  previewSource?: ImageSourcePropType;
};

export type FeedMediaLayout = "collage" | "scroll";

export const feed: FeedItem[] = [
  {
    kind: "match",
    id: "m1",
    role: "Lead Product Designer",
    company: "Kora Health",
    location: "Remote · UK",
    salary: "£85k – £98k",
    score: 94,
    reasons: [
      "Your fintech + marketplace history maps to their payments roadmap",
      "7 of 8 required skills matched from your parsed CV",
      "Team explicitly hires from your network cluster",
    ],
  },
  {
    kind: "post",
    id: "f1",
    channel: "Work",
    author: people[0],
    time: "2h",
    body: "We cut recruiter spam by 60% this quarter by only surfacing candidates the model is confident about. Quality over volume.",
    tags: ["Hiring", "AI Screening"],
    likes: 128,
    comments: 24,
    attachments: [
      {
        id: "f1-media-1",
        kind: "video",
        fileName: "recruiter-analytics-preview.mp4",
        mimeType: "video/mp4",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        sizeLabel: "18.4 MB",
        previewSource: AVATARS.cover,
      },
    ],
    mediaLayout: "scroll",
  },
  {
    kind: "hiring",
    id: "h1",
    author: people[2],
    time: "4h",
    role: "Senior Frontend Engineer (React/TS)",
    note: "Building the candidate-matching UI. Frankfurt-friendly hours, fully remote across the EU. Referrals welcome.",
    seats: 2,
  },
  {
    kind: "post",
    id: "f2",
    channel: "Showcase",
    author: people[1],
    time: "6h",
    body: "Reminder that a resume is a summary, not the person. Our parser now extracts impact statements so smaller-market candidates are not penalised for formatting.",
    tags: ["Product", "Fair Hiring"],
    likes: 96,
    comments: 11,
    attachments: [
      {
        id: "f2-media-1",
        kind: "image",
        fileName: "impact-framework-cover.jpg",
        previewSource: AVATARS.cover,
      },
      {
        id: "f2-media-2",
        kind: "image",
        fileName: "team-review-session.jpg",
        previewSource: AVATARS.person2,
      },
      {
        id: "f2-media-3",
        kind: "image",
        fileName: "skills-normalisation-board.jpg",
        previewSource: AVATARS.person3,
      },
    ],
    mediaLayout: "collage",
  },
  {
    kind: "post",
    id: "f3",
    channel: "Local",
    author: people[3],
    time: "8h",
    body: "Warehouse teams that update shift availability hour by hour get booked faster. We now dispatch forklift and pack-line cover in under ten minutes across the West Midlands.",
    tags: ["Logistics", "Instant Dispatch"],
    likes: 84,
    comments: 19,
    attachments: [
      {
        id: "f3-media-1",
        kind: "video",
        fileName: "warehouse-shift-dispatch.mp4",
        mimeType: "video/mp4",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        sizeLabel: "12.7 MB",
        previewSource: AVATARS.person1,
      },
    ],
    mediaLayout: "scroll",
  },
  {
    kind: "post",
    id: "f4",
    channel: "Local",
    author: people[4],
    time: "11h",
    body: "Care assistants who keep tonight and tomorrow morning open can now be instant-booked straight from video intros. Reliability ratings are doing the heavy lifting.",
    tags: ["Care", "Reliability"],
    likes: 73,
    comments: 16,
    attachments: [
      {
        id: "f4-media-1",
        kind: "image",
        fileName: "care-team-handover.jpg",
        previewSource: AVATARS.cover,
      },
      {
        id: "f4-media-2",
        kind: "image",
        fileName: "care-shift-board.jpg",
        previewSource: AVATARS.person2,
      },
    ],
    mediaLayout: "collage",
  },
];

export type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  score: number;
  posted: string;
  reasons: string[];
  logoBg: string;
  logoText: string;
};

export const jobs: Job[] = [
  {
    id: "j1",
    role: "Lead Product Designer",
    company: "Kora Health",
    location: "Remote · UK",
    salary: "£85k – £98k",
    type: "Full-time",
    score: 94,
    posted: "1d ago",
    reasons: ["Fintech domain match", "7/8 skills matched", "Salary in your range"],
    logoBg: "#e8ecff",
    logoText: "KH",
  },
  {
    id: "j2",
    role: "Senior Product Designer",
    company: "Civo",
    location: "Manchester · Hybrid",
    salary: "£72k – £84k",
    type: "Full-time",
    score: 88,
    posted: "2d ago",
    reasons: ["Design systems experience", "Marketplace background", "12 mutual connections"],
    logoBg: "#dff5ec",
    logoText: "CV",
  },
  {
    id: "j3",
    role: "Design Lead, Payments",
    company: "Paystack",
    location: "Lagos · Hybrid",
    salary: "₦ competitive + equity",
    type: "Full-time",
    score: 82,
    posted: "3d ago",
    reasons: ["Payments UX", "African market context", "Leadership track"],
    logoBg: "#eafaf1",
    logoText: "PS",
  },
  {
    id: "j4",
    role: "Product Designer (Contract)",
    company: "Flutterwave",
    location: "Berlin · Remote",
    salary: "€480 / day",
    type: "Contract",
    score: 74,
    posted: "5d ago",
    reasons: ["EU remote match", "Contract preference", "Fintech tools"],
    logoBg: "#fff1e6",
    logoText: "FW",
  },
];

export const parsedResume = {
  name: "Amara Okonkwo",
  email: "amara.okonkwo@example.com",
  phone: "+44 7700 900123",
  location: "London, UK",
  headline: "Senior Product Designer",
  years: 8,
  skills: [
    "Product Design",
    "Design Systems",
    "Figma",
    "User Research",
    "Fintech",
    "Prototyping",
    "Accessibility",
    "Design Ops",
  ],
  experience: [
    {
      role: "Senior Product Designer",
      company: "Monzo",
      period: "2021 - 2024",
      impact: "Led the payments redesign, lifting task completion by 23%.",
    },
    {
      role: "Product Designer",
      company: "Wise",
      period: "2018 - 2021",
      impact: "Built the multi-currency onboarding flow used by 4M+ users.",
    },
    {
      role: "UX Designer",
      company: "Paystack",
      period: "2016 - 2018",
      impact: "Shipped the merchant dashboard for the Nigerian market.",
    },
  ],
  education: [
    {
      school: "University of Lagos",
      degree: "BSc Computer Science",
      period: "2012 - 2016",
    },
  ],
};
