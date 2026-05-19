import { useEffect } from 'react'

const INTRO_STYLES = `
  @keyframes floatUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14%  { transform: scale(1.15); }
    28%  { transform: scale(1); }
    42%  { transform: scale(1.1); }
    56%  { transform: scale(1); }
  }
  .intro-title   { animation: floatUp 0.6s 0.1s ease both; }
  .intro-sub     { animation: floatUp 0.6s 0.25s ease both; }
  .intro-buttons { animation: floatUp 0.6s 0.4s ease both; }
  .intro-features{ animation: floatUp 0.6s 0.55s ease both; }
  .intro-emoji   { animation: heartbeat 2s 0.8s ease infinite; display: inline-block; }
`

function injectIntroStyles() {
  if (document.getElementById('intro-styles')) return
  const el = document.createElement('style')
  el.id = 'intro-styles'
  el.textContent = INTRO_STYLES
  document.head.appendChild(el)
}

export default function Intro({ onCreateRoom, onJoinRoom }) {
  useEffect(() => { injectIntroStyles() }, [])

  const features = [
    { icon: '📱', text: 'Каждый на своём телефоне' },
    { icon: '❓', text: '10 вопросов A/Б на двоих' },
    { icon: '🎯', text: 'Угадайте ответы друг друга' },
    { icon: '🎊', text: 'Конфетти при совпадении' },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      paddingTop: 'calc(48px + env(safe-area-inset-top))',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      gap: 28,
      overflowY: 'auto',
    }}>
      {/* Hero */}
      <div className="intro-title" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>
          <span className="intro-emoji">🧠</span>
          <span style={{ fontSize: 60 }}>❤️</span>
        </div>
        <h1 style={{
          fontFamily: "'Paytone One', sans-serif",
          fontSize: 36,
          color: '#fff',
          marginBottom: 10,
          lineHeight: 1.1,
        }}>
          Читаем мысли
        </h1>
        <p className="intro-sub" style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 16,
          maxWidth: 280,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Насколько хорошо вы знаете друг друга?
        </p>
      </div>

      {/* Buttons */}
      <div className="intro-buttons" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        maxWidth: 360,
      }}>
        <button
          onClick={onCreateRoom}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: 20,
            border: 'none',
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color: '#fff',
            fontSize: 19,
            fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            minHeight: 64,
            boxShadow: '0 8px 32px rgba(255,107,107,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          🏠 Создать комнату
        </button>

        <button
          onClick={onJoinRoom}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: 20,
            border: 'none',
            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            color: '#fff',
            fontSize: 19,
            fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            cursor: 'pointer',
            minHeight: 64,
            boxShadow: '0 8px 32px rgba(168,85,247,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          🔗 Войти в комнату
        </button>
      </div>

      {/* Features */}
      <div className="intro-features" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        width: '100%',
        maxWidth: 360,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
