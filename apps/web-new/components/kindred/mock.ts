export type Person = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: string;
  mutuals?: number;
};

export const AVATARS = {
  me: "/reference/fb9888b1-f7b9-4ef9-87c8-ff02711873f4.jpg",
  person1: "/reference/06268595-3d3c-4afa-b17a-29b441e05bb1.jpg",
  person2: "/reference/b34423e8-9eb4-4e14-9e79-b5fcac9ac30a.jpg",
  person3: "/reference/a4f6e948-f754-411d-8e3e-8999fbef019f.jpg",
  cover: "/reference/ce3f4cb0-0bb7-4579-bea5-758b84ba12e5.jpg",
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
      media?: Array<{
        type: "image" | "video";
        src: string;
        alt: string;
      }>;
      commentItems?: Array<{
        id: string;
        author: string;
        text: string;
        time: string;
      }>;
    }
  | {
      kind: "match";
      id: string;
      channel: "Work";
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
      channel: "Work" | "Local";
      author: Person;
      time: string;
      role: string;
      note: string;
      seats: number;
    };

export const feed: FeedItem[] = [
  {
    kind: "match",
    id: "m1",
    channel: "Work",
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
    body: "We cut recruiter spam by 60% this quarter by only surfacing candidates the model is confident about. Quality over volume - the whole point of building screening into the funnel. Proud of the team.",
    tags: ["Hiring", "AI Screening"],
    likes: 128,
    comments: 24,
    media: [
      {
        type: "image",
        src: AVATARS.cover,
        alt: "Recruiter analytics workspace preview",
      },
    ],
    commentItems: [
      {
        id: "f1-c1",
        author: "Amara Okonkwo",
        text: "This is exactly the kind of quality filter the platform needs.",
        time: "1h",
      },
    ],
  },
  {
    kind: "hiring",
    id: "h1",
    channel: "Work",
    author: people[2],
    time: "4h",
    role: "Senior Frontend Engineer (React/TS)",
    note: "Building the candidate-matching UI. Frankfurt-friendly hours, fully remote across EU. Referrals welcome.",
    seats: 2,
  },
  {
    kind: "post",
    id: "f2",
    channel: "Showcase",
    author: people[1],
    time: "6h",
    body: "Reminder that a resume is a summary, not the person. Our parser now extracts impact statements and normalises them so smaller-market candidates are not penalised for formatting. Big win for Lagos hires.",
    tags: ["Product", "Fair Hiring"],
    likes: 96,
    comments: 11,
    commentItems: [
      {
        id: "f2-c1",
        author: "James Whitfield",
        text: "Normalising impact statements has made a real difference in review quality.",
        time: "38m",
      },
    ],
  },
  {
    kind: "post",
    id: "f3",
    channel: "Local",
    author: people[2],
    time: "9h",
    body: "Available this weekend for on-site fintech design workshops within central Berlin. Happy to help founders tighten onboarding flows or team critique rituals.",
    tags: ["Local talent", "Availability", "Berlin"],
    likes: 41,
    comments: 6,
    media: [
      {
        type: "video",
        src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        alt: "Short-form talent introduction clip",
      },
    ],
    commentItems: [
      {
        id: "f3-c1",
        author: "Amara Okonkwo",
        text: "Love this format for quick local scouting.",
        time: "2h",
      },
    ],
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
    reasons: [
      "Fintech domain match",
      "7/8 skills matched",
      "Salary in your range",
    ],
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
    reasons: [
      "Design systems experience",
      "Marketplace background",
      "12 mutual connections",
    ],
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

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  href: string;
  category: "Recruiter" | "Jobs" | "Network" | "Platform";
};

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "A recruiter shortlisted your profile",
    body: "Kora Health saved your profile into their lead product shortlist after a 94% role match.",
    time: "12m ago",
    unread: true,
    href: "/jobs",
    category: "Recruiter",
  },
  {
    id: "n2",
    title: "New role matches are ready",
    body: "Three fresh fintech design roles landed in your recommended workspace.",
    time: "1h ago",
    unread: true,
    href: "/jobs",
    category: "Jobs",
  },
  {
    id: "n3",
    title: "James Whitfield viewed your profile",
    body: "Your network activity increased after your latest resume refresh and profile update.",
    time: "4h ago",
    href: "/network",
    category: "Network",
  },
  {
    id: "n4",
    title: "Resume Studio finished indexing your skills",
    body: "Your structured CV profile is ready for recruiter search, matching, and company directory relevance.",
    time: "Today",
    href: "/resume",
    category: "Platform",
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

export const skillSuggestions = [
  "Product Design",
  "Design Systems",
  "Figma",
  "User Research",
  "Fintech",
  "Prototyping",
  "Accessibility",
  "Design Ops",
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Growth",
  "B2B SaaS",
  "Hiring Ops",
  "GraphQL",
  "Analytics",
  "MSc",
  "BSc",
  "PhD",
  "AWS",
];

export type PortfolioClip = {
  id: string;
  title: string;
  caption: string;
  type: "image" | "video";
  src: string;
  thumb?: string;
  tag: "Portfolio" | "Availability" | "Craft";
};

export const portfolioClips: PortfolioClip[] = [
  {
    id: "clip-1",
    title: "Payments onboarding teardown",
    caption: "Short walkthrough of the onboarding decisions that improved task completion in a fintech redesign.",
    type: "video",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    tag: "Portfolio",
  },
  {
    id: "clip-2",
    title: "Recruiter workflow board",
    caption: "Snapshot from a talent-screening prototype focused on trustworthy matching and quick recruiter actions.",
    type: "image",
    src: AVATARS.cover,
    tag: "Craft",
  },
];
