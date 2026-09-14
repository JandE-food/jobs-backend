import { Application, Job } from '../types';

export const jobs: Job[] = [
{
  id: 'j1',
  title: 'Senior Product Designer',
  company: 'Northwind Labs',
  companyInitials: 'NL',
  tone: 'bg-emerald-600',
  location: 'London, UK',
  workMode: 'Hybrid',
  type: 'Full-time',
  salary: '£72,000 – £86,000',
  posted: '2h ago',
  applicants: 34,
  match: 94,
  tags: ['Design systems', 'Figma', 'B2B SaaS'],
  summary:
  'Own end-to-end design for our workforce platform, from discovery through to shipped interface, alongside two designers and a research partner.',
  responsibilities: [
  'Lead design for the hiring and onboarding surfaces',
  'Grow and maintain the Northwind design system',
  'Run fortnightly research sessions with customers'],

  requirements: [
  '5+ years designing complex web products',
  'Strong portfolio of shipped B2B work',
  'Comfortable working directly with engineers'],

  benefits: ['4-day week trial', '£1,500 learning budget', 'Private healthcare', '28 days holiday']
},
{
  id: 'j2',
  title: 'Frontend Engineer (React)',
  company: 'Monzo',
  companyInitials: 'MZ',
  tone: 'bg-rose-500',
  location: 'Remote (UK)',
  workMode: 'Remote',
  type: 'Full-time',
  salary: '£68,000 – £80,000',
  posted: '6h ago',
  applicants: 112,
  match: 81,
  tags: ['React', 'TypeScript', 'Accessibility'],
  summary:
  'Join the customer web crew building the tools millions of people use to manage money every day.',
  responsibilities: [
  'Build accessible, well-tested React interfaces',
  'Pair with designers on interaction detail',
  'Improve web performance budgets'],

  requirements: ['Deep React and TypeScript experience', 'Care for accessibility', 'UK right to work'],
  benefits: ['Remote-first', 'Share options', 'Home office budget']
},
{
  id: 'j3',
  title: 'Product Manager, Growth',
  company: 'Starling Bank',
  companyInitials: 'SB',
  tone: 'bg-teal-600',
  location: 'Manchester, UK',
  workMode: 'Hybrid',
  type: 'Full-time',
  salary: '£75,000 – £90,000',
  posted: '1d ago',
  applicants: 58,
  match: 72,
  tags: ['Growth', 'Experimentation', 'Fintech'],
  summary: 'Own the acquisition funnel and run the experiment roadmap end to end.',
  responsibilities: ['Define the growth roadmap', 'Run a weekly experiment cadence', 'Partner with marketing'],
  requirements: ['3+ years in product', 'Strong analytical background'],
  benefits: ['Hybrid 2 days in office', 'Pension matching', 'Cycle to work']
},
{
  id: 'j4',
  title: 'Data Analyst',
  company: 'Ovo Energy',
  companyInitials: 'OV',
  tone: 'bg-sky-600',
  location: 'Bristol, UK',
  workMode: 'On-site',
  type: 'Full-time',
  salary: '£48,000 – £58,000',
  posted: '2d ago',
  applicants: 26,
  match: 64,
  tags: ['SQL', 'dbt', 'Looker'],
  summary: 'Turn messy energy data into decisions the commercial team can act on.',
  responsibilities: ['Build and maintain dbt models', 'Own reporting for the retail team'],
  requirements: ['Confident SQL', 'Experience with a BI tool'],
  benefits: ['Onsite gym', '25 days holiday', 'Season ticket loan']
},
{
  id: 'j5',
  title: 'Brand Designer (6 month contract)',
  company: 'Kite Studio',
  companyInitials: 'KS',
  tone: 'bg-amber-600',
  location: 'Remote (UK)',
  workMode: 'Remote',
  type: 'Contract',
  salary: '£380 / day',
  posted: '3d ago',
  applicants: 19,
  match: 77,
  tags: ['Brand', 'Motion', 'Typography'],
  summary: 'Shape the visual identity for three founder-led launches this year.',
  responsibilities: ['Develop identity systems', 'Deliver launch campaign assets'],
  requirements: ['Portfolio of identity work', 'Available 4 days a week'],
  benefits: ['Fully remote', 'Flexible hours']
},
{
  id: 'j6',
  title: 'Customer Success Lead',
  company: 'Deliveroo',
  companyInitials: 'DR',
  tone: 'bg-indigo-500',
  location: 'London, UK',
  workMode: 'Hybrid',
  type: 'Full-time',
  salary: '£55,000 – £64,000',
  posted: '4d ago',
  applicants: 71,
  match: 58,
  tags: ['Retention', 'Team lead', 'Marketplace'],
  summary: 'Lead a team of six looking after our top restaurant partners.',
  responsibilities: ['Coach a team of six', 'Own retention targets'],
  requirements: ['Experience leading a CS team', 'Marketplace background helpful'],
  benefits: ['Free lunches', 'Share options', 'Learning budget']
}];


export function jobById(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
}

export const applications: Application[] = [
{ id: 'a1', jobId: 'j2', status: 'Interview', updated: 'Updated yesterday', step: 3 },
{ id: 'a2', jobId: 'j3', status: 'In review', updated: 'Updated 3 days ago', step: 2 },
{ id: 'a3', jobId: 'j5', status: 'Applied', updated: 'Updated 5 days ago', step: 1 },
{ id: 'a4', jobId: 'j6', status: 'Closed', updated: 'Updated 2 weeks ago', step: 4 }];