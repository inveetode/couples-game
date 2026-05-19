import { useState, useEffect, useRef } from 'react'
import { createRoom, joinRoom, subscribeToRoom, submitAnswer, nextRound, resetGame } from './firebase.js'
import { ALL_QUESTIONS, randomIndices } from './questions.js'
import Intro from './screens/Intro.jsx'
import Lobby from './screens/Lobby.jsx'
import Game from './Game.jsx'

export default function App() {
  const [screen, setScreen] = useState('intro') // intro | create | join | waiting | game | result
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState(null) // 'p1' | 'p2'
  const [playerName, setPlayerName] = useState('')
  const [roomData, setRoomData] = useState(null)
  const [inputCode, setInputCode] = useState('')
  const [inputName, setInputName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const unsubscribeRef = useRef(null)
  const hasReceivedDataRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const pendingScreenRef = useRef(null)

  // Subscribe to room changes when we have a roomCode
  useEffect(() => {
    if (!roomCode) return
    hasReceivedDataRef.current = false
    const unsub = subscribeToRoom(roomCode, (data) => {
      if (data !== null) hasReceivedDataRef.current = true
      setRoomData(data)
    })
    unsubscribeRef.current = unsub
    return () => {
      unsub()
      unsubscribeRef.current = null
    }
  }, [roomCode])

  // Navigate based on room status
  useEffect(() => {
    if (roomData === null && roomCode && hasReceivedDataRef.current) {
      setError('Комната удалена или недоступна')
      handleGoHome()
      return
    }
    if (!roomData) return
    if (roomData.status === 'waiting' && screen !== 'waiting') {
      setScreen('waiting')
    } else if (roomData.status === 'playing' && screen !== 'game') {
      setScreen('game')
    } else if (roomData.status === 'finished' && screen !== 'result') {
      setScreen('result')
    }
  }, [roomData, screen, roomCode])

  // Fade in on initial load
  useEffect(() => {
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(r2)
    })
    return () => cancelAnimationFrame(r1)
  }, [])

  function navigate(to) {
    if (pendingScreenRef.current !== null) return
    pendingScreenRef.current = to
    setVisible(false)
  }

  useEffect(() => {
    if (visible || !pendingScreenRef.current) return
    const t = setTimeout(() => {
      const next = pendingScreenRef.current
      pendingScreenRef.current = null
      setScreen(next)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 180)
    return () => clearTimeout(t)
  }, [visible])

  async function handleCreateRoom() {
    if (!inputName.trim()) { setError('Введи своё имя'); return }
    setLoading(true)
    setError('')
    try {
      const indices = randomIndices(10, ALL_QUESTIONS.length)
      const { roomCode: code, playerId: pid } = await createRoom(inputName.trim(), indices)
      setPlayerName(inputName.trim())
      setPlayerId(pid)
      setRoomCode(code)
      setScreen('waiting')
    } catch (e) {
      setError('Ошибка создания комнаты: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinRoom() {
    if (!inputName.trim()) { setError('Введи своё имя'); return }
    if (!inputCode.trim()) { setError('Введи код комнаты'); return }
    setLoading(true)
    setError('')
    try {
      const { playerId: pid } = await joinRoom(inputCode.trim(), inputName.trim())
      setPlayerName(inputName.trim())
      setPlayerId(pid)
      setRoomCode(inputCode.trim().toUpperCase())
      setScreen('game')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitAnswer(answer) {
    if (!roomCode || !playerId) return
    await submitAnswer(roomCode, playerId, answer)
  }

  async function handleNextRound() {
    if (!roomCode || playerId !== 'p1') return
    await nextRound(roomCode)
  }

  async function handleResetGame() {
    if (!roomCode || playerId !== 'p1') return
    const indices = randomIndices(10, ALL_QUESTIONS.length)
    await resetGame(roomCode, indices)
  }

  function handleGoHome() {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    setScreen('intro')
    setRoomCode('')
    setPlayerId(null)
    setPlayerName('')
    setRoomData(null)
    setInputCode('')
    setInputName('')
    setError('')
  }

  // --- Screens ---
  let content
  if (screen === 'intro') {
    content = (
      <Intro
        onCreateRoom={() => navigate('create')}
        onJoinRoom={() => navigate('join')}
      />
    )
  } else if (screen === 'create') {
    content = (
      <FormScreen
        title="Создать комнату"
        emoji="🏠"
        subtitle="Введи своё имя — партнёр получит код для входа"
        fields={[
          {
            label: 'Твоё имя',
            value: inputName,
            onChange: setInputName,
            placeholder: 'Как тебя зовут?',
            maxLength: 20,
          },
        ]}
        submitLabel={loading ? 'Создаём...' : 'Создать комнату 🎮'}
        submitColor="coral"
        onSubmit={handleCreateRoom}
        onBack={() => { navigate('intro'); setError('') }}
        error={error}
        loading={loading}
      />
    )
  } else if (screen === 'join') {
    content = (
      <FormScreen
        title="Войти в комнату"
        emoji="🔗"
        subtitle="Введи имя и код от партнёра"
        fields={[
          {
            label: 'Твоё имя',
            value: inputName,
            onChange: setInputName,
            placeholder: 'Как тебя зовут?',
            maxLength: 20,
          },
          {
            label: 'Код комнаты',
            value: inputCode,
            onChange: (v) => setInputCode(v.toUpperCase()),
            placeholder: 'ABCD12',
            maxLength: 6,
            mono: true,
          },
        ]}
        submitLabel={loading ? 'Подключаемся...' : 'Войти в комнату 🚀'}
        submitColor="purple"
        onSubmit={handleJoinRoom}
        onBack={() => { navigate('intro'); setError('') }}
        error={error}
        loading={loading}
      />
    )
  } else if (screen === 'waiting') {
    content = (
      <Lobby
        roomCode={roomCode}
        playerId={playerId}
        playerName={playerName}
        roomData={roomData}
        onBack={handleGoHome}
      />
    )
  } else if ((screen === 'game' || screen === 'result') && roomData) {
    content = (
      <Game
        roomData={roomData}
        playerId={playerId}
        playerName={playerName}
        onSubmitAnswer={handleSubmitAnswer}
        onNextRound={handleNextRound}
        onResetGame={handleResetGame}
        onGoHome={handleGoHome}
      />
    )
  } else {
    content = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 32 }}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: `translateY(${visible ? 0 : 5}px)`,
      transition: visible
        ? 'opacity 0.38s ease-out, transform 0.38s ease-out'
        : 'opacity 0.16s ease-in, transform 0.16s ease-in',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {content}
    </div>
  )
}

// ---- Reusable form screen ----
function FormScreen({ title, emoji, subtitle, fields, submitLabel, submitColor, onSubmit, onBack, error, loading }) {
  const colors = {
    coral: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
    purple: 'linear-gradient(135deg, #A855F7, #7C3AED)',
  }

  function handleKey(e) {
    if (e.key === 'Enter') onSubmit()
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #200f2e 0%, #1b1240 50%, #0f2860 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(24px + env(safe-area-inset-top))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '36px 28px',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Назад
        </button>

        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>{emoji}</div>
        <h1 style={{
          fontFamily: "'Paytone One', sans-serif",
          fontSize: 24,
          textAlign: 'center',
          marginBottom: 8,
          color: '#fff',
        }}>
          {title}
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
          {subtitle}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map((f, i) => (
            <div key={i}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8, fontWeight: 700 }}>
                {f.label}
              </label>
              <input
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                onKeyDown={handleKey}
                placeholder={f.placeholder}
                maxLength={f.maxLength}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: f.mono ? 22 : 16,
                  fontFamily: f.mono ? 'monospace' : "'Nunito', sans-serif",
                  letterSpacing: f.mono ? '0.2em' : 'normal',
                  textAlign: f.mono ? 'center' : 'left',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,80,80,0.15)',
            border: '1px solid rgba(255,80,80,0.3)',
            color: '#FF8080',
            fontSize: 14,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            border: 'none',
            background: colors[submitColor],
            color: '#fff',
            fontSize: 17,
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'transform 0.15s, opacity 0.15s',
            minHeight: 56,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
