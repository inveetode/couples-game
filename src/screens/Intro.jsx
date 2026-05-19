import { useEffect, useRef } from 'react'

const INTRO_STYLES = `
  @keyframes floatUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes heroFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  .hero-video {
    display: block;
    animation: heroFloat 3.6s ease-in-out infinite;
  }

  /* ── Intro stagger ───────────────────────────── */
  .intro-title    { animation: floatUp 0.6s 0.10s ease both; }
  .intro-sub      { animation: floatUp 0.6s 0.25s ease both; }
  .intro-buttons  { animation: floatUp 0.6s 0.40s ease both; }
  .intro-features { animation: floatUp 0.6s 0.55s ease both; }

  /* ── Button hover glows ──────────────────────── */
  .btn-red {
    transition: transform 0.15s, box-shadow 0.2s !important;
  }
  .btn-red:hover {
    box-shadow: 0 10px 42px rgba(255,107,107,0.65) !important;
  }
  .btn-purple {
    transition: transform 0.15s, box-shadow 0.2s !important;
  }
  .btn-purple:hover {
    box-shadow: 0 10px 42px rgba(168,85,247,0.65) !important;
  }

  /* ── Feature card hover ──────────────────────── */
  .feature-card {
    transition: background 0.2s, border-color 0.2s, transform 0.18s;
    cursor: default;
  }
  .feature-card:hover {
    background: rgba(255,255,255,0.09) !important;
    border-color: rgba(255,255,255,0.2) !important;
    transform: translateY(-2px);
  }

`

function injectStyles() {
  if (document.getElementById('intro-styles')) return
  const el = document.createElement('style')
  el.id = 'intro-styles'
  el.textContent = INTRO_STYLES
  document.head.appendChild(el)
}

/* ─── Canvas particles ─────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const COLORS = ['#FF6B6B', '#FF8E53', '#A855F7', '#C084FC', '#818CF8']
    const pts = Array.from({ length: 20 }, () => mkPt({}, canvas, COLORS))
    let raf
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pts) {
        p.y -= p.vy; p.x += p.vx; p.age++
        const life = p.age / p.maxAge
        const a = life < 0.15 ? (life / 0.15) * p.ma : life > 0.8 ? ((1 - life) / 0.2) * p.ma : p.ma
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.globalAlpha = a; ctx.fill()
        if (p.age >= p.maxAge) mkPt(p, canvas, COLORS)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}
function mkPt(p, c, cols) {
  p.x = Math.random() * c.width; p.y = c.height + 10
  p.r = Math.random() * 1.8 + 0.5
  p.vy = Math.random() * 0.44 + 0.18; p.vx = (Math.random() - 0.5) * 0.28
  p.maxAge = Math.floor(Math.random() * 180 + 120)
  p.age = Math.floor(Math.random() * p.maxAge)
  p.ma = Math.random() * 0.32 + 0.1
  p.color = cols[Math.floor(Math.random() * cols.length)]
  return p
}

/* ─── Two hearts hero ──────────────────────────────── */
function HeroHearts() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
      <video
        autoPlay loop muted playsInline
        className="hero-video"
        style={{ width: 200, height: 200 }}
      >
        <source src="/hero-hearts-transparent.webm" type="video/webm" />
      </video>
    </div>
  )
}

/* ─── Main screen ──────────────────────────────────── */
export default function Intro({ onCreateRoom, onJoinRoom }) {
  useEffect(() => { injectStyles() }, [])

  function handleCreate() { onCreateRoom() }
  function handleJoin()   { onJoinRoom()   }

  const features = [
    { icon: '📱', text: 'Каждый на своём телефоне'    },
    { icon: '❓', text: '10 вопросов A/Б на двоих'    },
    { icon: '🎯', text: 'Угадайте ответы друг друга'  },
    { icon: '💫', text: 'Проверьте свою совместимость' },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #200f2e 0%, #1b1240 50%, #0f2860 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
      paddingTop:    'calc(48px + env(safe-area-inset-top))',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      gap: 28,
      overflowY: 'auto',
      position: 'relative',
    }}>
      <ParticleCanvas />

      {/* Hero */}
      <div className="intro-title" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <HeroHearts />
        <h1 style={{
          fontFamily: "'Paytone One', sans-serif",
          fontSize: 36,
          color: '#fff',
          marginBottom: 10,
          lineHeight: 1.1,
          textShadow: '0 0 32px rgba(168,85,247,0.45), 0 0 60px rgba(255,107,107,0.2)',
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
        display: 'flex', flexDirection: 'column', gap: 14,
        width: '100%', maxWidth: 360,
        position: 'relative', zIndex: 1,
      }}>
        {/* Create room */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-red"
            onClick={handleCreate}
            style={{
              width: '100%', padding: '20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: '#fff', fontSize: 19, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer', minHeight: 64,
              boxShadow: '0 8px 32px rgba(255,107,107,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
            onMouseDown={(e)  => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e)    => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            🏠 Создать комнату
          </button>
        </div>

        {/* Join room */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-purple"
            onClick={handleJoin}
            style={{
              width: '100%', padding: '20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              color: '#fff', fontSize: 19, fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer', minHeight: 64,
              boxShadow: '0 8px 32px rgba(168,85,247,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
            onMouseDown={(e)  => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e)    => { e.currentTarget.style.transform = 'scale(1)' }}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            🔗 Войти в комнату
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="intro-features" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        width: '100%', maxWidth: 360,
        position: 'relative', zIndex: 1,
      }}>
        {features.map((f, i) => (
          <div key={i} className="feature-card" style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
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
