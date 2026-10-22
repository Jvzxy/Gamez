import { hashString, seededRandom } from '../lib/format'
import type { GameId, LiveMatch, MatchMode, MatchResult, PlayedMatch } from '../types'
import { currentUserId, getPlayer, players } from './players'

// SAMPLE DATA. Live matches and history are hand-written (or, for other
// players, generated from a seeded random source) so the UI has something
// realistic to render before a backend exists.

export const liveMatches: LiveMatch[] = [
  {
    id: 'lm-4821',
    gameId: 'pong',
    playerIds: ['aria', 'dvolkov'],
    playerCount: 2,
    headline: '7 – 6',
    detail: 'Game 3, first to 11',
    scores: [7, 6],
    target: 11,
    spectators: 148,
    startedMinutesAgo: 11,
  },
  {
    id: 'lm-4822',
    gameId: 'chess',
    playerIds: ['yukis', 'meitan'],
    playerCount: 2,
    headline: 'Move 34',
    detail: 'Blitz, 3+2',
    spectators: 212,
    startedMinutesAgo: 16,
  },
  {
    id: 'lm-4823',
    gameId: 'pong',
    playerIds: ['sreyes', 'tsilva'],
    playerCount: 2,
    headline: '9 – 4',
    detail: 'Game 1, first to 11',
    scores: [9, 4],
    target: 11,
    spectators: 36,
    startedMinutesAgo: 5,
  },
  {
    id: 'lm-4824',
    gameId: 'sketch-guess',
    playerIds: ['zainab', 'chloem', 'priyan', 'noahk'],
    playerCount: 7,
    headline: 'Round 4 of 8',
    detail: 'Drawing: "lighthouse"',
    spectators: 54,
    startedMinutesAgo: 9,
  },
  {
    id: 'lm-4825',
    gameId: 'checkers',
    playerIds: ['lbrandt', 'jbrooks'],
    playerCount: 2,
    headline: 'Move 21',
    detail: '5 pieces vs 4',
    spectators: 17,
    startedMinutesAgo: 14,
  },
  {
    id: 'lm-4826',
    gameId: 'quiz-blitz',
    playerIds: ['elenap', 'omarh', 'sofiar'],
    playerCount: 24,
    headline: 'Question 7 of 15',
    detail: 'Geography',
    spectators: 88,
    startedMinutesAgo: 4,
  },
]

export function getLiveMatch(id: string | undefined): LiveMatch | undefined {
  return liveMatches.find((match) => match.id === id)
}

const myMatches: PlayedMatch[] = [
  { id: 'pm-1', gameId: 'pong', opponentIds: ['aria'], result: 'win', score: '11 – 8', ratingDelta: 14, mode: 'Ranked', durationLabel: '6m 12s', minutesAgo: 12 },
  { id: 'pm-2', gameId: 'pong', opponentIds: ['tsilva'], result: 'win', score: '11 – 5', ratingDelta: 9, mode: 'Ranked', durationLabel: '4m 40s', minutesAgo: 41 },
  { id: 'pm-3', gameId: 'chess', opponentIds: ['meitan'], result: 'win', score: 'Checkmate, 38 moves', ratingDelta: 17, mode: 'Ranked', durationLabel: '9m 03s', minutesAgo: 95 },
  { id: 'pm-4', gameId: 'sketch-guess', opponentIds: ['zainab', 'chloem', 'priyan', 'noahk', 'omarh', 'jbrooks'], result: 'win', score: '1st of 7', ratingDelta: 11, mode: 'Private room', durationLabel: '14m 20s', minutesAgo: 190 },
  { id: 'pm-5', gameId: 'pong', opponentIds: ['dvolkov'], result: 'loss', score: '7 – 11', ratingDelta: -12, mode: 'Ranked', durationLabel: '7m 31s', minutesAgo: 330 },
  { id: 'pm-6', gameId: 'checkers', opponentIds: ['lbrandt'], result: 'draw', score: 'Draw by repetition', ratingDelta: 0, mode: 'Casual', durationLabel: '12m 48s', minutesAgo: 420 },
  { id: 'pm-7', gameId: 'pong', opponentIds: ['sreyes'], result: 'win', score: '11 – 9', ratingDelta: 13, mode: 'Ranked', durationLabel: '8m 02s', minutesAgo: 1500 },
  { id: 'pm-8', gameId: 'chess', opponentIds: ['yukis'], result: 'loss', score: 'Resigned, 52 moves', ratingDelta: -8, mode: 'Ranked', durationLabel: '21m 17s', minutesAgo: 1620 },
  { id: 'pm-9', gameId: 'quiz-blitz', opponentIds: ['elenap', 'sofiar', 'omarh'], result: 'loss', score: '3rd of 18', ratingDelta: -3, mode: 'Casual', durationLabel: '10m 05s', minutesAgo: 2900 },
  { id: 'pm-10', gameId: 'pong', opponentIds: ['chloem'], result: 'win', score: '11 – 2', ratingDelta: 6, mode: 'Ranked', durationLabel: '3m 55s', minutesAgo: 3000 },
  { id: 'pm-11', gameId: 'pong', opponentIds: ['aria'], result: 'loss', score: '10 – 11', ratingDelta: -15, mode: 'Ranked', durationLabel: '9m 44s', minutesAgo: 4400 },
  { id: 'pm-12', gameId: 'chess', opponentIds: ['tsilva'], result: 'win', score: 'Won on time', ratingDelta: 10, mode: 'Casual', durationLabel: '6m 30s', minutesAgo: 4500 },
]

const partyGames: GameId[] = ['sketch-guess', 'doodle-relay', 'codewords', 'party-pack', 'map-guess', 'card-chaos', 'snap-roulette', 'quiz-blitz', 'puzzles']

function scoreFor(gameId: GameId, result: MatchResult, rand: () => number): string {
  const low = 2 + Math.floor(rand() * 8)
  if (gameId === 'pong') return result === 'win' ? `11 – ${low}` : result === 'loss' ? `${low} – 11` : '10 – 10'
  if (gameId === 'chess') return result === 'win' ? 'Checkmate' : result === 'loss' ? 'Resigned' : 'Draw by agreement'
  if (gameId === 'checkers') return result === 'win' ? 'Captured all pieces' : result === 'loss' ? 'Blocked in' : 'Draw by repetition'
  const placement = result === 'win' ? 1 : 2 + Math.floor(rand() * 4)
  const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'
  return `${placement}${suffix} of ${placement + 2 + Math.floor(rand() * 5)}`
}

/** Last matches for a player. Curated for the current user, generated for everyone else. */
export function getMatchHistory(playerId: string): PlayedMatch[] {
  if (playerId === currentUserId) return myMatches
  const player = getPlayer(playerId)
  if (!player) return []

  const rand = seededRandom(hashString(`history-${playerId}`))
  const others = players.filter((candidate) => candidate.id !== playerId)
  const modes: MatchMode[] = ['Ranked', 'Ranked', 'Ranked', 'Casual', 'Private room']
  let minutes = 20 + Math.floor(rand() * 60)

  return Array.from({ length: 12 }, (_, index) => {
    const record = player.stats.perGame[Math.floor(rand() * rand() * player.stats.perGame.length)]
    const gameId = record.gameId
    const rate = player.stats.wins / player.stats.matches
    const roll = rand()
    const result: MatchResult = roll < rate ? 'win' : roll < rate + 0.04 ? 'draw' : 'loss'
    const opponentCount = partyGames.includes(gameId) ? 3 : 1
    const opponentIds = Array.from({ length: opponentCount }, () => others[Math.floor(rand() * others.length)].id)
    const entry: PlayedMatch = {
      id: `${playerId}-pm-${index}`,
      gameId,
      opponentIds: [...new Set(opponentIds)],
      result,
      score: scoreFor(gameId, result, rand),
      ratingDelta: result === 'draw' ? 0 : (result === 'win' ? 1 : -1) * (6 + Math.floor(rand() * 12)),
      mode: modes[Math.floor(rand() * modes.length)],
      durationLabel: `${3 + Math.floor(rand() * 18)}m ${String(Math.floor(rand() * 60)).padStart(2, '0')}s`,
      minutesAgo: minutes,
    }
    minutes += 90 + Math.floor(rand() * 900)
    return entry
  })
}
