import { Conversation, Notification } from '../types';

export const conversations: Conversation[] = [
{
  id: 'c1',
  personId: 'p1',
  unread: 2,
  last: 'Would Thursday at 2pm work for a first chat?',
  time: '12m',
  messages: [
  { id: 'm1', from: 'them', text: 'Hi Amara — saw your work on the Kite rebrand, really strong.', time: '09:41' },
  { id: 'm2', from: 'them', text: 'We have a Senior Product Designer role open. Would you be open to a conversation?', time: '09:41' },
  { id: 'm3', from: 'me', text: 'Thanks Tom. Yes, happy to chat — hybrid in London works for me.', time: '10:02' },
  { id: 'm4', from: 'them', text: 'Would Thursday at 2pm work for a first chat?', time: '10:15' }]

},
{
  id: 'c2',
  personId: 'p6',
  unread: 0,
  last: 'Sent you the CV clinic sign-up link.',
  time: '3h',
  messages: [
  { id: 'm1', from: 'them', text: 'The Sheffield clinic has 6 spots left.', time: 'Yesterday' },
  { id: 'm2', from: 'me', text: 'Count me in as a mentor if you still need one.', time: 'Yesterday' },
  { id: 'm3', from: 'them', text: 'Sent you the CV clinic sign-up link.', time: '3h' }]

},
{
  id: 'c3',
  personId: 'p5',
  unread: 1,
  last: 'Did you end up applying to the Monzo role?',
  time: '1d',
  messages: [
  { id: 'm1', from: 'them', text: 'Did you end up applying to the Monzo role?', time: 'Mon' }]

},
{
  id: 'c4',
  personId: 'p3',
  unread: 0,
  last: 'Invoice sent — thanks again for the referral.',
  time: '4d',
  messages: [{ id: 'm1', from: 'them', text: 'Invoice sent — thanks again for the referral.', time: 'Fri' }]
}];


export const notifications: Notification[] = [
{ id: 'n1', kind: 'application', text: 'Monzo moved your application to Interview stage.', time: '1h', unread: true },
{ id: 'n2', kind: 'like', personId: 'p3', text: 'liked your post about portfolio case studies.', time: '2h', unread: true },
{ id: 'n3', kind: 'job', text: '4 new roles match "Product Design · London · Hybrid".', time: '4h', unread: true },
{ id: 'n4', kind: 'comment', personId: 'p2', text: 'commented: "This matches what we see in interviews too."', time: '7h' },
{ id: 'n5', kind: 'follow', personId: 'p7', text: 'started following you.', time: '1d' },
{ id: 'n6', kind: 'mention', personId: 'p6', text: 'mentioned you in a post about the Sheffield CV clinic.', time: '2d' },
{ id: 'n7', kind: 'application', text: 'Starling Bank viewed your profile.', time: '3d' }];