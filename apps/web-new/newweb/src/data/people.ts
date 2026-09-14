import { Person } from '../types';

export const me: Person = {
  id: 'me',
  name: 'Amara Okafor',
  handle: 'amaraokafor',
  role: 'Senior Product Designer',
  company: 'Freelance',
  initials: 'AO',
  tone: 'bg-brand-600',
  openTo: true
};

export const people: Person[] = [
me,
{
  id: 'p1',
  name: 'Tom Whitfield',
  handle: 'tomwhitfield',
  role: 'Head of Talent',
  company: 'Northwind Labs',
  initials: 'TW',
  tone: 'bg-emerald-600',
  verified: true,
  mutuals: 14
},
{
  id: 'p2',
  name: 'Priya Raman',
  handle: 'priyaraman',
  role: 'Engineering Manager',
  company: 'Monzo',
  initials: 'PR',
  tone: 'bg-rose-500',
  mutuals: 8
},
{
  id: 'p3',
  name: 'Dele Adeyemi',
  handle: 'deleadeyemi',
  role: 'Founder',
  company: 'Kite Studio',
  initials: 'DA',
  tone: 'bg-amber-600',
  verified: true,
  mutuals: 22
},
{
  id: 'p4',
  name: 'Hannah Byrne',
  handle: 'hannahbyrne',
  role: 'Data Analyst',
  company: 'Ovo Energy',
  initials: 'HB',
  tone: 'bg-sky-600',
  mutuals: 3
},
{
  id: 'p5',
  name: 'Marcus Reid',
  handle: 'marcusreid',
  role: 'Frontend Engineer',
  company: 'Deliveroo',
  initials: 'MR',
  tone: 'bg-indigo-500',
  mutuals: 11,
  openTo: true
},
{
  id: 'p6',
  name: 'Sofia Marchetti',
  handle: 'sofiamarchetti',
  role: 'Recruitment Partner',
  company: 'BEJELI Talent',
  initials: 'SM',
  tone: 'bg-fuchsia-600',
  verified: true,
  mutuals: 31
},
{
  id: 'p7',
  name: 'Callum Frost',
  handle: 'callumfrost',
  role: 'Product Manager',
  company: 'Starling Bank',
  initials: 'CF',
  tone: 'bg-teal-600',
  mutuals: 6
}];


export function personById(id: string): Person {
  return people.find((p) => p.id === id) ?? me;
}