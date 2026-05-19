import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  runTransaction,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

/** Generate a random 6-character uppercase alphanumeric room code */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Create a new room. Returns { roomCode, playerId: 'p1' }
 */
export async function createRoom(playerName, questionIndices) {
  const roomCode = generateRoomCode()
  const roomRef = ref(db, `rooms/${roomCode}`)

  await set(roomRef, {
    status: 'waiting',
    players: {
      p1: { name: playerName, answer: null },
    },
    questionIndices,
    currentRound: 0,
    matches: 0,
    createdAt: Date.now(),
  })

  return { roomCode, playerId: 'p1' }
}

/**
 * Join an existing room as p2. Returns { playerId: 'p2' }
 * Throws if room not found or already has p2 or is not in 'waiting' status.
 */
export async function joinRoom(roomCode, playerName) {
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    throw new Error('Комната не найдена. Проверь код и попробуй снова.')
  }

  const room = snapshot.val()

  if (room.status !== 'waiting') {
    throw new Error('Игра уже началась или завершена.')
  }

  if (room.players?.p2) {
    throw new Error('Комната уже занята — в ней 2 игрока.')
  }

  await update(roomRef, {
    'players/p2': { name: playerName, answer: null },
    status: 'playing',
  })

  return { playerId: 'p2' }
}

/**
 * Subscribe to real-time room changes.
 * Returns an unsubscribe function.
 */
export function subscribeToRoom(roomCode, callback) {
  const roomRef = ref(db, `rooms/${roomCode}`)
  const unsub = onValue(roomRef, (snapshot) => {
    callback(snapshot.val())
  })
  return unsub
}

/**
 * Submit a player's answer for the current round.
 */
export async function submitAnswer(roomCode, playerId, answer) {
  const answerRef = ref(db, `rooms/${roomCode}/players/${playerId}/answer`)
  await set(answerRef, answer)
}

/**
 * Advance to the next round. Only p1 (host) calls this.
 * Increments shared match count if answers matched, clears answers, increments round.
 */
export async function nextRound(roomCode) {
  const roomRef = ref(db, `rooms/${roomCode}`)
  await runTransaction(roomRef, (room) => {
    if (!room) return room
    const p1Answer = room.players?.p1?.answer
    const p2Answer = room.players?.p2?.answer
    if (!p1Answer || !p2Answer) return // abort if already advanced
    const matched = p1Answer === p2Answer
    const nextRoundNum = (room.currentRound || 0) + 1
    const isFinished = nextRoundNum >= (room.questionIndices?.length || 10)
    return {
      ...room,
      players: {
        ...room.players,
        p1: { ...room.players.p1, answer: null },
        p2: { ...room.players.p2, answer: null },
      },
      currentRound: nextRoundNum,
      matches: (room.matches || 0) + (matched ? 1 : 0),
      status: isFinished ? 'finished' : 'playing',
    }
  })
}

/**
 * Reset the game for a new session.
 * p1 provides fresh questionIndices.
 */
export async function resetGame(roomCode, questionIndices) {
  const roomRef = ref(db, `rooms/${roomCode}`)
  await runTransaction(roomRef, (room) => {
    if (!room) return room
    if (room.status !== 'finished') return // abort if already reset
    return {
      ...room,
      status: 'playing',
      questionIndices,
      currentRound: 0,
      matches: 0,
      players: {
        ...room.players,
        p1: { ...room.players.p1, answer: null },
        p2: { ...room.players.p2, answer: null },
      },
    }
  })
}
