import { TalentReel } from '../types';

export const reelFilters = [
'Candidate search',
'To shortlist',
'Accountant',
'Frontend Engineer',
'Product Design',
'Data',
'Remote',
'Open now'];


export const reels: TalentReel[] = [
{
  id: 'r1',
  name: 'James Whitfield',
  initials: 'JW',
  tone: 'bg-sky-700',
  role: 'Frontend Engineer',
  experience: '6y exp',
  location: 'Manchester, UK',
  pitch: 'React and TypeScript engineer shipping recruiter tooling and growth surfaces.',
  description:
  'Short-form talent clip optimised for mobile review and shortlist decisions. Certification: BSc Software Engineering.',
  match: 98,
  category: 'Product',
  rating: 4.6,
  availability: 'Open shortlist',
  salary: '£70,000 expected',
  skills: ['React', 'TypeScript', 'Design systems'],
  media: "/85fec355-dc6b-4c34-b8b4-2d7abe67f548.jpg",
  likes: 196,
  comments: 2,
  shares: 14,
  duration: 38,
  verified: true
},
{
  id: 'r2',
  name: 'Priya Raman',
  initials: 'PR',
  tone: 'bg-rose-500',
  role: 'Engineering Manager',
  experience: '9y exp',
  location: 'London, UK',
  pitch: 'I build teams that ship weekly and keep their on-call quiet.',
  description:
  'Led three platform squads at a UK bank. Talks through how she runs hiring loops and levelling. Certification: ICF coaching.',
  match: 91,
  category: 'Engineering',
  rating: 4.8,
  availability: 'Interviewing',
  salary: '£105,000 expected',
  skills: ['Team leadership', 'Platform', 'Hiring'],
  media: "/0e455aee-4be9-49f6-9e4c-2d7821150a5e.jpg",
  likes: 412,
  comments: 9,
  shares: 33,
  duration: 44,
  verified: true
},
{
  id: 'r3',
  name: 'Hannah Byrne',
  initials: 'HB',
  tone: 'bg-amber-600',
  role: 'Management Accountant',
  experience: '12y exp',
  location: 'Bristol, UK',
  pitch: 'Month-end close in four days, and a board pack nobody has to decode.',
  description:
  'ACCA qualified, energy and utilities background. Walks through her reporting stack. Certification: ACCA.',
  match: 87,
  category: 'Finance',
  rating: 4.4,
  availability: 'Open shortlist',
  salary: '£62,000 expected',
  skills: ['ACCA', 'Forecasting', 'NetSuite'],
  media: "/32846e7b-d97e-4a53-9d1d-d9bab3356eca.jpg",
  likes: 138,
  comments: 4,
  shares: 8,
  duration: 31
},
{
  id: 'r4',
  name: 'Kenji Ito',
  initials: 'KI',
  tone: 'bg-teal-600',
  role: 'Data Analyst',
  experience: '3y exp',
  location: 'Remote (UK)',
  pitch: 'SQL first, dashboards second. I try to answer the question behind the request.',
  description:
  'Career switcher from operations, now two years into analytics. Certification: Google Data Analytics.',
  match: 79,
  category: 'Data',
  rating: 4.2,
  availability: 'Available in 4 weeks',
  salary: '£48,000 expected',
  skills: ['SQL', 'dbt', 'Looker'],
  media: "/a34e2970-6c26-4aa3-a769-d66d99eef661.jpg",
  likes: 84,
  comments: 1,
  shares: 5,
  duration: 27
},
{
  id: 'r5',
  name: 'Ada Nwosu',
  initials: 'AN',
  tone: 'bg-fuchsia-600',
  role: 'Senior Product Designer',
  experience: '8y exp',
  location: 'Leeds, UK',
  pitch: 'Design systems that survive contact with a roadmap.',
  description:
  'Shows two case studies in under a minute, including the one that failed. Certification: NN/g UX Master.',
  match: 94,
  category: 'Design',
  rating: 4.9,
  availability: 'Open shortlist',
  salary: '£78,000 expected',
  skills: ['Design systems', 'Research', 'Figma'],
  media: "/ab4d6120-44f1-4203-bad4-46b8ca070e7e.jpg",
  likes: 623,
  comments: 12,
  shares: 57,
  duration: 52,
  verified: true
}];


export const reelComments: Record<string, {id: string;author: string;initials: string;tone: string;text: string;time: string;}[]> = {
  r1: [
  { id: 'rc1', author: 'Sofia Marchetti', initials: 'SM', tone: 'bg-fuchsia-600', text: 'Interviewed James last year — strong on accessibility.', time: '2h' },
  { id: 'rc2', author: 'Tom Whitfield', initials: 'TW', tone: 'bg-emerald-600', text: 'Shortlisted for the Northwind role.', time: '40m' }],

  r2: [
  { id: 'rc3', author: 'Callum Frost', initials: 'CF', tone: 'bg-teal-600', text: 'Her hiring loop write-up is worth a read.', time: '1d' }],

  r3: [],
  r4: [],
  r5: [
  { id: 'rc4', author: 'Dele Adeyemi', initials: 'DA', tone: 'bg-amber-600', text: 'Best portfolio walkthrough on here.', time: '3h' }]

};