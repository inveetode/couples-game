import { useEffect, useState } from 'react'

const LOBBY_STYLES = `
  @keyframes lobbyFade {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes avatarPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.6); }
    50%       { box-shadow: 0 0 0 16px rgba(255,107,107,0); }
  }
  @keyframes dotAnim {
    0%, 20% { opacity: 1; }
    50%      { opacity: 0.2; }
    80%,100% { opacity: 1; }
  }
  @keyframes codeGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(255,107,107,0.3); }
    50%       { box-shadow: 0 0 40px rgba(168,85,247,0.5); }
  }
  .lobby-card { animation: lobbyFade 0.5s ease both; }
  .code-box   { animation: codeGlow 2s ease infinite; }
`

function injectLobbyStyles() {
  if (document.getElementById('lobby-styles')) return
  const el = document.createElement('style')
  el.id = 'lobby-styles'
  el.textContent = LOBBY_STYLES
  document.head.appendChild(el)
}

export default function Lobby({ roomCode, playerId, playerName, roomData, onBack }) {
  useEffect(() => { injectLobbyStyles() }, [])

  const p2Joined = !!roomData?.players?.p2
  const isHost = playerId === 'p1'

  // Animated dots
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(t)
  }, [])

  // Copy room code to clipboard
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    let ok = false
    try {
      await navigator.clipboard.writeText(roomCode)
      ok = true
    } catch {
      const el = document.createElement('textarea')
      el.value = roomCode
      el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try { ok = document.execCommand('copy') } catch {}
      document.body.removeChild(el)
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #200f2e 0%, #1b1240 50%, #0f2860 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      paddingTop: 'calc(32px + env(safe-area-inset-top))',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      gap: 24,
    }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 'calc(16px + env(safe-area-inset-top))',
          left: 20,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
          cursor: 'pointer',
          padding: '8px 0',
        }}
      >
        ← Выйти
      </button>

      {isHost ? (
        <HostLobby
          roomCode={roomCode}
          playerName={playerName}
          p2Joined={p2Joined}
          p2Name={roomData?.players?.p2?.name}
          dots={dots}
          copied={copied}
          onCopy={handleCopy}
        />
      ) : (
        <GuestLobby
          playerName={playerName}
          p1Name={roomData?.players?.p1?.name}
          dots={dots}
        />
      )}
    </div>
  )
}

function HostLobby({ roomCode, playerName, p2Joined, p2Name, dots, copied, onCopy }) {
  // Split code into individual chars for display
  const chars = (roomCode || '').split('')

  return (
    <>
      {/* Your avatar */}
      <div className="lobby-card" style={{ textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          fontWeight: 900,
          color: '#fff',
          margin: '0 auto 12px',
          animation: 'avatarPulse 2s ease infinite',
        }}>
          {(playerName || '?')[0].toUpperCase()}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{playerName}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Создатель комнаты</div>
      </div>

      {/* Room code */}
      <div className="lobby-card" style={{
        width: '100%',
        maxWidth: 340,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: '24px 20px',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 16,
        }}>
          Код комнаты
        </div>

        {/* Code chips */}
        <div className="code-box" style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 16,
          padding: '16px',
          borderRadius: 16,
          background: 'rgba(0,0,0,0.3)',
        }}>
          {chars.map((c, i) => (
            <div key={i} style={{
              width: 42,
              height: 52,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(168,85,247,0.2))',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'monospace',
              fontSize: 24,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: 0,
            }}>
              {c}
            </div>
          ))}
        </div>

        <button
          onClick={onCopy}
          style={{
            padding: '10px 24px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.2)',
            background: copied ? 'rgba(100,200,100,0.15)' : 'rgba(255,255,255,0.08)',
            color: copied ? '#80ff80' : 'rgba(255,255,255,0.7)',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Скопировано!' : '📋 Скопировать код'}
        </button>

        <p style={{
          marginTop: 14,
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5,
        }}>
          Покажи этот код партнёру — пусть введёт его на своём телефоне
        </p>
      </div>

      {/* Waiting status */}
      <div className="lobby-card" style={{
        width: '100%',
        maxWidth: 340,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {p2Joined ? (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              color: '#fff',
              flexShrink: 0,
            }}>
              {(p2Name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{p2Name} подключился(ась)!</div>
              <div style={{ fontSize: 13, color: 'rgba(100,255,100,0.8)', marginTop: 2 }}>🚀 Игра начинается...</div>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(168,85,247,0.15)',
              border: '2px dashed rgba(168,85,247,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                Ждём второго игрока{dots}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                Игра начнётся автоматически
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function GuestLobby({ playerName, p1Name, dots }) {
  return (
    <>
      {/* Connected status */}
      <div className="lobby-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🔗</div>
        <h2 style={{
          fontFamily: "'Paytone One', sans-serif",
          fontSize: 26,
          color: '#fff',
          marginBottom: 8,
        }}>
          Подключились!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
          Ждём начала игры{dots}
        </p>
      </div>

      {/* Players */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 320,
      }}>
        {/* Host */}
        <div style={{
          background: 'rgba(255,107,107,0.1)',
          border: '1px solid rgba(255,107,107,0.25)',
          borderRadius: 18,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            color: '#fff',
            flexShrink: 0,
          }}>
            {(p1Name || '?')[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{p1Name || 'Создатель'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,107,107,0.8)' }}>Создатель комнаты</div>
          </div>
        </div>

        {/* Guest (you) */}
        <div style={{
          background: 'rgba(168,85,247,0.1)',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 18,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          animation: 'avatarPulse 2s ease infinite',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 900,
            color: '#fff',
            flexShrink: 0,
          }}>
            {(playerName || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{playerName} <span style={{ fontSize: 12, opacity: 0.6 }}>(ты)</span></div>
            <div style={{ fontSize: 12, color: 'rgba(168,85,247,0.8)' }}>Подключился(ась) ✓</div>
          </div>
        </div>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 1.5,
      }}>
        Игра начнётся, когда создатель комнаты запустит её
      </p>
    </>
  )
}
