import type { Channel, ChannelPermissions, ChatMessage, DirectThread } from '../types'

// SAMPLE DATA. The seed for the chat state; the app keeps changes in memory only.

const openPermissions: ChannelPermissions = {
  membersCanSend: true,
  membersCanInvite: true,
  membersCanShareLinks: true,
  slowModeSeconds: 0,
}

export const seedChannels: Channel[] = [
  {
    id: 'ch-pong-ladder',
    kind: 'channel',
    name: 'pong-ladder',
    topic: 'Weekly ladder matches, rematch calls and score disputes.',
    visibility: 'public',
    hasPassword: false,
    createdLabel: 'Created Jan 12, 2026',
    members: [
      { playerId: 'me', role: 'owner' },
      { playerId: 'aria', role: 'admin' },
      { playerId: 'dvolkov', role: 'admin' },
      { playerId: 'meitan', role: 'member' },
      { playerId: 'sreyes', role: 'member' },
      { playerId: 'zainab', role: 'member' },
      { playerId: 'lbrandt', role: 'member', mutedFor: '1 hour' },
      { playerId: 'tsilva', role: 'member' },
      { playerId: 'chloem', role: 'member' },
    ],
    bannedIds: ['noahk'],
    permissions: { ...openPermissions, slowModeSeconds: 5 },
  },
  {
    id: 'ch-chess-club',
    kind: 'channel',
    name: 'chess-club',
    topic: 'Puzzles of the day, game reviews and tournament sign-ups.',
    visibility: 'private',
    hasPassword: false,
    createdLabel: 'Created Nov 3, 2025',
    members: [
      { playerId: 'yukis', role: 'owner' },
      { playerId: 'me', role: 'admin' },
      { playerId: 'elenap', role: 'admin' },
      { playerId: 'meitan', role: 'member' },
      { playerId: 'sreyes', role: 'member' },
      { playerId: 'tsilva', role: 'member' },
      { playerId: 'omarh', role: 'member' },
    ],
    bannedIds: [],
    permissions: { ...openPermissions, membersCanShareLinks: false },
  },
  {
    id: 'ch-general',
    kind: 'channel',
    name: 'general',
    topic: 'Everything gamez. Be kind, keep it fun.',
    visibility: 'public',
    hasPassword: false,
    createdLabel: 'Created Aug 20, 2024',
    members: [
      { playerId: 'elenap', role: 'owner' },
      { playerId: 'chloem', role: 'admin' },
      { playerId: 'me', role: 'member' },
      { playerId: 'aria', role: 'member' },
      { playerId: 'dvolkov', role: 'member' },
      { playerId: 'meitan', role: 'member' },
      { playerId: 'sreyes', role: 'member' },
      { playerId: 'zainab', role: 'member' },
      { playerId: 'priyan', role: 'member' },
      { playerId: 'tsilva', role: 'member' },
      { playerId: 'omarh', role: 'member' },
      { playerId: 'jbrooks', role: 'member' },
    ],
    bannedIds: [],
    permissions: openPermissions,
  },
  {
    id: 'ch-drawing-night',
    kind: 'channel',
    name: 'drawing-night',
    topic: 'Thursday sketch sessions. Bad art encouraged.',
    visibility: 'public',
    hasPassword: false,
    createdLabel: 'Created Feb 6, 2026',
    members: [
      { playerId: 'zainab', role: 'owner' },
      { playerId: 'me', role: 'member' },
      { playerId: 'aria', role: 'member' },
      { playerId: 'chloem', role: 'member' },
      { playerId: 'priyan', role: 'member' },
    ],
    bannedIds: [],
    permissions: openPermissions,
  },
  {
    id: 'ch-weekend-lobby',
    kind: 'channel',
    name: 'weekend-lobby',
    topic: 'Party games every Saturday. Password in the invite.',
    visibility: 'protected',
    hasPassword: true,
    createdLabel: 'Created Mar 14, 2026',
    members: [
      { playerId: 'priyan', role: 'owner' },
      { playerId: 'me', role: 'member' },
      { playerId: 'chloem', role: 'member' },
      { playerId: 'sofiar', role: 'member' },
      { playerId: 'jbrooks', role: 'member' },
    ],
    bannedIds: [],
    permissions: openPermissions,
  },
]

export const seedDms: DirectThread[] = [
  { id: 'dm-aria', kind: 'dm', playerId: 'aria' },
  { id: 'dm-dvolkov', kind: 'dm', playerId: 'dvolkov' },
  { id: 'dm-zainab', kind: 'dm', playerId: 'zainab' },
  { id: 'dm-priyan', kind: 'dm', playerId: 'priyan' },
  { id: 'dm-tsilva', kind: 'dm', playerId: 'tsilva' },
]

let counter = 0
function m(threadId: string, authorId: string, time: string, text: string, kind: ChatMessage['kind'] = 'message'): ChatMessage {
  counter += 1
  return { id: `seed-${counter}`, threadId, authorId, time, text, kind }
}

export const seedMessages: Record<string, ChatMessage[]> = {
  'ch-pong-ladder': [
    m('ch-pong-ladder', 'aria', '9:41 AM', 'Ladder reset is tonight at 8. Everyone gets a fresh bracket.'),
    m('ch-pong-ladder', 'dvolkov', '9:43 AM', 'Finally. I have a score to settle with whoever keeps picking the top seed.'),
    m('ch-pong-ladder', 'me', '9:44 AM', 'That was me. I regret nothing.'),
    m('ch-pong-ladder', 'meitan', '9:50 AM', 'Can someone explain why the ball speeds up after every third hit? Is that a setting?'),
    m('ch-pong-ladder', 'aria', '9:52 AM', 'It is, "rally boost". Room owner can switch it off for casual games.'),
    m('ch-pong-ladder', 'me', '9:53 AM', 'Leaving it on for ranked. Casual rooms get it off.'),
    m('ch-pong-ladder', 'sreyes', '10:05 AM', 'Anyone around for a warm-up game before the ladder?'),
    m('ch-pong-ladder', 'tsilva', '10:06 AM', 'In. Give me five minutes to find my good paddle.'),
    m('ch-pong-ladder', 'system', '10:07 AM', 'Lukas was muted for 1 hour by You', 'system'),
  ],
  'ch-chess-club': [
    m('ch-chess-club', 'yukis', '8:15 AM', 'Puzzle of the day is up. Mate in three, and it is nastier than it looks.'),
    m('ch-chess-club', 'meitan', '8:30 AM', 'Knight sacrifice on f7 first, right?'),
    m('ch-chess-club', 'yukis', '8:31 AM', 'No spoilers! Use the spoiler tag.'),
    m('ch-chess-club', 'elenap', '8:44 AM', 'Reminder: club tournament sign-ups close Friday. 16 spots.'),
    m('ch-chess-club', 'sreyes', '9:02 AM', 'Count me in.'),
    m('ch-chess-club', 'tsilva', '9:20 AM', 'Me too, but only if I get a white pairing against Kairo.'),
    m('ch-chess-club', 'me', '9:22 AM', 'Pairings are random. Good luck.'),
  ],
  'ch-general': [
    m('ch-general', 'elenap', '7:55 AM', 'Welcome to the new members who joined this week!'),
    m('ch-general', 'chloem', '8:03 AM', 'Quick reminder that Snap Roulette night is Wednesday. Bring photos you are happy to share.'),
    m('ch-general', 'dvolkov', '8:10 AM', 'Is there a leaderboard for Quiz Blitz yet?'),
    m('ch-general', 'elenap', '8:12 AM', 'Not yet. It is on the roadmap.'),
    m('ch-general', 'jbrooks', '8:40 AM', 'New here. Where do I find people to play Checkers with?'),
    m('ch-general', 'aria', '8:41 AM', 'Join #chess-club or ask here. Someone is always up for a game.'),
    m('ch-general', 'zainab', '9:15 AM', 'I just lost a drawing round to someone who drew a potato and called it a lighthouse. Zero regrets.'),
  ],
  'ch-drawing-night': [
    m('ch-drawing-night', 'zainab', 'Yesterday', 'Prompt list for Thursday: lighthouse, tax return, haunted toaster, time travel, the moon but sad.'),
    m('ch-drawing-night', 'aria', 'Yesterday', 'The moon but sad is going to wreck me.'),
    m('ch-drawing-night', 'priyan', 'Yesterday', 'Can we do a Doodle Relay round at the end?'),
    m('ch-drawing-night', 'zainab', 'Yesterday', 'Always.'),
  ],
  'ch-weekend-lobby': [
    m('ch-weekend-lobby', 'priyan', 'Sat', 'Lobby opens at 7 on Saturday. Party Pack first, then Wild Cards.'),
    m('ch-weekend-lobby', 'chloem', 'Sat', 'Bringing snacks and bad ideas.'),
    m('ch-weekend-lobby', 'sofiar', 'Sat', 'Can I be spymaster in Codewords? I have been practising.'),
    m('ch-weekend-lobby', 'priyan', 'Sat', 'Sure. Please do not give clues like "banana, but sad".'),
  ],
  'dm-aria': [
    m('dm-aria', 'aria', '10:20 AM', 'GG earlier. That last rally was ridiculous.'),
    m('dm-aria', 'me', '10:22 AM', 'You nearly had it. Rematch tonight?'),
    m('dm-aria', 'aria', '10:25 AM', 'Always. Best of three?'),
    m('dm-aria', 'aria', '10:25 AM', 'I am bringing the new paddle skin.'),
  ],
  'dm-dvolkov': [
    m('dm-dvolkov', 'dvolkov', 'Yesterday', 'You got lucky on that net cord.'),
    m('dm-dvolkov', 'me', 'Yesterday', 'Call it skill.'),
    m('dm-dvolkov', 'dvolkov', 'Yesterday', 'Call it a rematch.'),
  ],
  'dm-zainab': [
    m('dm-zainab', 'zainab', '9:30 AM', 'Are you joining drawing night on Thursday?'),
    m('dm-zainab', 'me', '9:48 AM', 'Wouldn’t miss it. I will try to draw something that is not a rectangle.'),
    m('dm-zainab', 'zainab', '9:49 AM', 'Rectangles are my favourite.'),
  ],
  'dm-priyan': [
    m('dm-priyan', 'priyan', 'Sat', 'Can you co-host the weekend lobby? I might be late.'),
    m('dm-priyan', 'me', 'Sat', 'Yep, I can open the room at 7.'),
  ],
  'dm-tsilva': [
    m('dm-tsilva', 'me', 'Mon', 'Rematch on Checkers soon?'),
    m('dm-tsilva', 'tsilva', 'Mon', 'Give me a day to recover from last time.'),
  ],
}

export const seedUnread: Record<string, number> = {
  'ch-general': 3,
  'ch-chess-club': 5,
  'dm-aria': 2,
  'dm-zainab': 1,
}
