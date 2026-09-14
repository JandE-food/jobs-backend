import { Post, Spotlight } from '../types';

export const posts: Post[] = [
{
  id: 'po1',
  authorId: 'p1',
  kind: 'hiring',
  time: '2h',
  text: 'We just opened a Senior Product Designer role at Northwind Labs. Hybrid in London, real design ownership, and a team that ships weekly. Happy to answer anything in the comments before you apply.',
  jobId: 'j1',
  tags: ['Design', 'London'],
  likes: 214,
  comments: 38,
  reposts: 27,
  topComment: { authorId: 'p5', text: 'Can confirm — interviewed here last year, genuinely thoughtful process.' }
},
{
  id: 'po2',
  authorId: 'p3',
  kind: 'milestone',
  time: '5h',
  text: 'Two years ago Kite Studio was me and a borrowed desk. Today we hired our eighth person, all found through BEJELI. Building in public works.',
  media: "/a6a4a1c0-ef32-4b0b-93d9-1738560a213c.jpg",
  tags: ['Founders'],
  likes: 892,
  comments: 74,
  reposts: 61,
  liked: true,
  topComment: { authorId: 'p6', text: 'Well deserved. The team you have built is brilliant.' }
},
{
  id: 'po3',
  authorId: 'p2',
  kind: 'question',
  time: '8h',
  text: 'Hiring managers: how much weight do you actually give a take-home task versus a live pairing session?',
  poll: {
    question: 'Which tells you more about a candidate?',
    options: [
    { label: 'Take-home task', votes: 218 },
    { label: 'Live pairing', votes: 641 },
    { label: 'Neither — portfolio only', votes: 143 }]

  },
  likes: 156,
  comments: 92,
  reposts: 12
},
{
  id: 'po4',
  authorId: 'p6',
  kind: 'update',
  time: '11h',
  text: 'Ran a free CV clinic in Leeds last night with 40 people in the room. Three walked out with interviews booked. Next one is in Sheffield on the 24th — the sign-up is in my profile.',
  media: "/08f8911f-3c2b-4ba8-b941-06c607189c5d.jpg",
  tags: ['Careers', 'Events'],
  likes: 431,
  comments: 45,
  reposts: 88,
  saved: true
},
{
  id: 'po5',
  authorId: 'p5',
  kind: 'update',
  time: '1d',
  text: 'Spent the weekend rebuilding my portfolio around three case studies instead of eleven screenshots. Recruiter replies went from silence to four conversations in a week. Fewer, deeper stories win.',
  media: "/3cf9a682-b159-4bb3-af59-2f20441de3e6.jpg",
  tags: ['Portfolio'],
  likes: 623,
  comments: 51,
  reposts: 34
},
{
  id: 'po6',
  authorId: 'p7',
  kind: 'hiring',
  time: '1d',
  text: 'Growth PM role at Starling is live in Manchester. We are optimising for people who can run an experiment cadence, not people who can recite frameworks.',
  jobId: 'j3',
  likes: 178,
  comments: 22,
  reposts: 19
},
{
  id: 'po7',
  authorId: 'p4',
  kind: 'update',
  time: '2d',
  text: 'Six months into my first analyst role after a career change at 34. If you are mid-switch and it feels slow: it is slow, and then suddenly it is not.',
  likes: 1120,
  comments: 137,
  reposts: 96
}];


export const spotlights: Spotlight[] = [
{
  id: 's1',
  company: 'Northwind Labs',
  initials: 'NL',
  tone: 'bg-emerald-600',
  headline: 'Inside the design team',
  roles: 4,
  image: "/5a238905-c957-4e64-8a9b-691106a5dddc.jpg"
},
{ id: 's2', company: 'Monzo', initials: 'MZ', tone: 'bg-rose-500', headline: 'Remote-first engineering', roles: 12 },
{ id: 's3', company: 'Starling', initials: 'SB', tone: 'bg-teal-600', headline: 'Growth in Manchester', roles: 6 },
{ id: 's4', company: 'Kite Studio', initials: 'KS', tone: 'bg-amber-600', headline: 'Contract brand work', roles: 2 },
{ id: 's5', company: 'Ovo Energy', initials: 'OV', tone: 'bg-sky-600', headline: 'Data team hiring', roles: 5 },
{ id: 's6', company: 'Deliveroo', initials: 'DR', tone: 'bg-indigo-500', headline: 'Ops & success roles', roles: 9 }];