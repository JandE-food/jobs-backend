export type Person = {
  id: string;
  name: string;
  handle: string;
  role: string;
  company: string;
  initials: string;
  tone: string;
  verified?: boolean;
  mutuals?: number;
  openTo?: boolean;
};

export type PostKind = 'update' | 'hiring' | 'milestone' | 'question';

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  time: string;
  text: string;
  media?: string;
  tags?: string[];
  jobId?: string;
  poll?: {question: string;options: {label: string;votes: number;}[];};
  likes: number;
  comments: number;
  reposts: number;
  liked?: boolean;
  saved?: boolean;
  topComment?: {authorId: string;text: string;};
};

export type Job = {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  tone: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  type: 'Full-time' | 'Part-time' | 'Contract';
  salary: string;
  posted: string;
  applicants: number;
  match: number;
  tags: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
};

export type ApplicationStatus = 'Applied' | 'In review' | 'Interview' | 'Offer' | 'Closed';

export type Application = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  updated: string;
  step: number;
};

export type Conversation = {
  id: string;
  personId: string;
  unread: number;
  last: string;
  time: string;
  messages: {id: string;from: 'me' | 'them';text: string;time: string;}[];
};

export type Notification = {
  id: string;
  kind: 'like' | 'comment' | 'follow' | 'job' | 'application' | 'mention';
  personId?: string;
  text: string;
  time: string;
  unread?: boolean;
};

export type TalentReel = {
  id: string;
  name: string;
  initials: string;
  tone: string;
  role: string;
  experience: string;
  location: string;
  pitch: string;
  description: string;
  match: number;
  category: string;
  rating: number;
  availability: string;
  salary: string;
  skills: string[];
  media: string;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  verified?: boolean;
};

export type Spotlight = {
  id: string;
  company: string;
  initials: string;
  tone: string;
  headline: string;
  roles: number;
  image?: string;
};