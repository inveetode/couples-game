import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { ALL_QUESTIONS } from './questions.js'

const P1_COLOR = '#FF6B6B'
const P2_COLOR = '#A855F7'
const P1_GRADIENT = 'linear-gradient(135deg, #FF6B6B, #FF8E53)'
const P2_GRADIENT = 'linear-gradient(135deg, #A855F7, #7C3AED)'


const STYLES = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.08); opacity: 0.75; }
  }
  @keyframes shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes bounceIn {
    0%   { transform: scale(0.3); opacity: 0; }
    50%  { transform: scale(1.05); opacity: 1; }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes dotBlink {
    0%, 20% { opacity: 1; }
    50%      { opacity: 0.2; }
    80%, 100%{ opacity: 1; }
  }
  @keyframes slideFromRight {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .fade-slide  { animation: fadeSlideIn 0.4s ease both; }
  .scale-in    { animation: scaleIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
  .bounce-in   { animation: bounceIn 0.6s cubic-bezier(.34,1.56,.64,1) both; }
  .slide-right { animation: slideFromRight 0.35s cubic-bezier(.25,.46,.45,.94) both; }
`

function injectStyles() {
  if (document.getElementById('game-styles')) return
  const el = document.createElement('style')
  el.id = 'game-styles'
  el.textContent = STYLES
  document.head.appendChild(el)
}

export default function Game({
  roomData,
  playerId,
  playerName,
  onSubmitAnswer,
  onNextRound,
  onResetGame,
  onGoHome,
}) {
  useEffect(() => { injectStyles() }, [])

  const { players, matches, currentRound, questionIndices, status } = roomData || {}
  const p1 = players?.p1 || {}
  const p2 = players?.p2 || {}
  const myData = players?.[playerId] || {}
  const partnerId = playerId === 'p1' ? 'p2' : 'p1'
  const partnerData = players?.[partnerId] || {}
  const partnerName = partnerData.name || (playerId === 'p1' ? 'Партнёр' : p1.name)

  const myColor = playerId === 'p1' ? P1_COLOR : P2_COLOR
  const myGradient = playerId === 'p1' ? P1_GRADIENT : P2_GRADIENT
  const partnerColor = playerId === 'p1' ? P2_COLOR : P1_COLOR

  const totalRounds = questionIndices?.length || 10
  const question = questionIndices ? ALL_QUESTIONS[questionIndices[currentRound]] : null

  const bothAnswered = !!(myData.answer && partnerData.answer)
  const isReveal = bothAnswered
  const matched = isReveal && myData.answer === partnerData.answer
  const isHost = playerId === 'p1'

  // Fire confetti once on match reveal
  const confettiFired = useRef(false)
  const prevRoundRef = useRef(currentRound)

  useEffect(() => {
    if (currentRound !== prevRoundRef.current) {
      confettiFired.current = false
      prevRoundRef.current = currentRound
    }
  }, [currentRound])

  useEffect(() => {
    if (isReveal && matched && !confettiFired.current) {
      confettiFired.current = true
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: [P1_COLOR, P2_COLOR, '#FFD700', '#FFF'],
      })
    }
  }, [isReveal, matched])

  // Result screen
  if (status === 'finished') {
    return <ResultScreen
      p1={p1} p2={p2} matches={matches}
      playerId={playerId} isHost={isHost}
      totalRounds={totalRounds}
      onResetGame={onResetGame}
      onGoHome={onGoHome}
    />
  }

  if (!question) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: '#fff' }}>
        Загрузка вопроса...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #200f2e 0%, #1b1240 50%, #0f2860 100%)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', maxWidth: 480, width: '100%', marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box' }}>
        <PlayerBar p1={p1} p2={p2} matches={matches} totalRounds={totalRounds} playerId={playerId} />
      </div>

      {/* Progress */}
      <div style={{ padding: '4px 20px 0', maxWidth: 480, width: '100%', marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box' }}>
        <RoundDots current={currentRound} total={totalRounds} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px 24px',
        gap: 16,
        overflowY: 'auto',
        width: '100%',
        maxWidth: 480,
        marginLeft: 'auto',
        marginRight: 'auto',
        alignSelf: 'center',
        boxSizing: 'border-box',
      }}>
        {isReveal ? (
          <RevealPanel
            question={question}
            myData={myData}
            partnerData={partnerData}
            partnerName={partnerName}
            matched={matched}
            playerId={playerId}
            isHost={isHost}
            onNextRound={onNextRound}
            currentRound={currentRound}
            totalRounds={totalRounds}
          />
        ) : (
          <PlayingPanel
            question={question}
            myData={myData}
            partnerName={partnerName}
            myColor={myColor}
            myGradient={myGradient}
            partnerColor={partnerColor}
            onSubmitAnswer={onSubmitAnswer}
          />
        )}
      </div>
    </div>
  )
}

// ----- Sub-components -----

function PlayerBar({ p1, p2, matches, totalRounds, playerId }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PlayerChip name={p1.name || 'Игрок 1'} color={P1_COLOR} gradient={P1_GRADIENT} isMe={playerId === 'p1'} />
      <div style={{
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 900,
        color: '#fff',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ marginRight: 4 }}>❤️</span>
        <span style={{
          background: 'linear-gradient(90deg, #FF6B6B, #A855F7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {matches || 0} / {totalRounds}
        </span>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: 'rgba(255,255,255,0.5)',
          marginTop: 2,
        }}>
          совпадений
        </div>
      </div>
      <PlayerChip name={p2.name || 'Игрок 2'} color={P2_COLOR} gradient={P2_GRADIENT} isMe={playerId === 'p2'} align="right" />
    </div>
  )
}

function PlayerChip({ name, color, gradient, isMe, align = 'left' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: align === 'right' ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 900,
        color: '#fff',
        boxShadow: isMe ? `0 0 0 3px ${color}` : 'none',
        flexShrink: 0,
      }}>
        {(name || '?')[0].toUpperCase()}
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: isMe ? '#fff' : 'rgba(255,255,255,0.6)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 70,
        textAlign: align === 'right' ? 'right' : 'left',
      }}>
        {name || '?'}{isMe ? ' (ты)' : ''}
      </div>
    </div>
  )
}

function RoundDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i < current
              ? 'rgba(255,255,255,0.6)'
              : i === current
                ? 'linear-gradient(90deg, #FF6B6B, #A855F7)'
                : 'rgba(255,255,255,0.15)',
            transition: 'width 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

const ANSWER_GRADIENTS = {
  A: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  B: 'linear-gradient(135deg, #f093fb, #f5a7c7)',
  C: 'linear-gradient(135deg, #4facfe, #00c9b1)',
  D: 'linear-gradient(135deg, #A855F7, #7C3AED)',
}

function getOptionText(question, ans) {
  if (ans === 'A') return question.optionA
  if (ans === 'B') return question.optionB
  if (ans === 'C') return question.optionC
  if (ans === 'D') return question.optionD
  return '?'
}

function PlayingPanel({ question, myData, partnerName, myColor, myGradient, partnerColor, onSubmitAnswer }) {
  const hasAnswered = !!myData.answer
  const [selected, setSelected] = useState(null)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    setSelected(null)
    setAnimKey((k) => k + 1)
  }, [question])

  async function handleAnswer(ans) {
    if (hasAnswered) return
    setSelected(ans)
    await onSubmitAnswer(ans)
  }

  const currentAnswer = myData.answer || selected
  const hasFourOptions = !!(question.optionC && question.optionD)

  return (
    <>
      {/* Question card */}
      <div
        key={animKey}
        className="slide-right"
        style={{
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', maxHeight: 280, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
          <img
            src={question.image}
            alt={question.category || ''}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
          <span style={{
            position: 'absolute', bottom: 10, right: 14, fontSize: 32, lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}>{question.emoji}</span>
          <div style={{
            position: 'absolute', top: 10, left: 14, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1.5, color: '#fff',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            padding: '4px 10px', borderRadius: 20,
          }}>{question.category}</div>
        </div>
        <div style={{ padding: '16px 20px 20px', fontSize: 19, fontWeight: 800, lineHeight: 1.4, color: '#fff' }}>
          {question.question}
        </div>
      </div>

      {/* Answer buttons */}
      {!currentAnswer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="scale-in">
          {['A', 'B', ...(hasFourOptions ? ['C', 'D'] : [])].map((label) => (
            <AnswerButton
              key={label}
              label={label}
              text={getOptionText(question, label)}
              gradient={ANSWER_GRADIENTS[label]}
              onClick={() => handleAnswer(label)}
              disabled={false}
            />
          ))}
        </div>
      ) : (
        <div className="scale-in" style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '24px',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Ответ принят!</div>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 20,
            background: ANSWER_GRADIENTS[currentAnswer] || ANSWER_GRADIENTS.A,
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 16,
          }}>
            {currentAnswer} — {getOptionText(question, currentAnswer)}
          </div>
          <WaitingDots partnerName={partnerName} partnerColor={partnerColor} />
        </div>
      )}
    </>
  )
}

function AnswerButton({ label, text, gradient, onClick, disabled }) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        padding: '18px 20px',
        borderRadius: 18,
        border: 'none',
        background: gradient,
        color: '#fff',
        fontSize: 17,
        fontWeight: 800,
        fontFamily: "'Nunito', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        textAlign: 'left',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.1s, opacity 0.15s',
        minHeight: 64,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
    >
      <span style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 900,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{text}</span>
    </button>
  )
}

function WaitingDots({ partnerName, partnerColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: partnerColor,
        animation: 'spin 0.9s linear infinite',
      }} />
      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
        Ждём {partnerName}...
      </span>
    </div>
  )
}

function RevealPanel({
  question, myData, partnerData, partnerName,
  matched, playerId, isHost, onNextRound, currentRound, totalRounds,
}) {
  const isLast = currentRound >= totalRounds - 1
  const [pending, setPending] = useState(false)

  const myAnswer = myData.answer
  const partnerAnswer = partnerData.answer

  const myGradient = playerId === 'p1' ? P1_GRADIENT : P2_GRADIENT
  const partnerGradient = playerId === 'p1' ? P2_GRADIENT : P1_GRADIENT

  return (
    <div key={currentRound} className="slide-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Match/No-match banner */}
      <div
        className="bounce-in"
        style={{
          textAlign: 'center',
          padding: '20px 16px',
          borderRadius: 24,
          background: matched
            ? 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(168,85,247,0.2))'
            : 'rgba(255,255,255,0.05)',
          border: matched
            ? '1px solid rgba(255,107,107,0.4)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {matched ? '🎉' : '🤔'}
        </div>
        <div style={{
          fontSize: 22,
          fontWeight: 900,
          fontFamily: "'Paytone One', sans-serif",
          color: matched ? '#FFD700' : 'rgba(255,255,255,0.8)',
          marginBottom: 4,
        }}>
          {matched ? 'Совпали!' : 'Разные ответы'}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
          {matched ? '+1 совпадение 🎊' : 'В следующий раз повезёт!'}
        </div>
      </div>

      {/* Question reminder */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.05)',
      }}>
        <img
          src={question.image}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}
        />
        <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35, textAlign: 'left' }}>
          {question.question}
        </div>
      </div>

      {/* Answers side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AnswerCard
          name="Ты"
          answer={myAnswer}
          question={question}
          gradient={myGradient}
          matched={matched}
        />
        <AnswerCard
          name={partnerName}
          answer={partnerAnswer}
          question={question}
          gradient={partnerGradient}
          matched={matched}
        />
      </div>

      {/* Next button */}
      {isHost ? (
        <button
          onClick={async () => {
            if (pending) return
            setPending(true)
            try { await onNextRound() } finally { setPending(false) }
          }}
          disabled={pending}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: 18,
            border: 'none',
            background: isLast
              ? 'linear-gradient(135deg, #FFD700, #FF8E53)'
              : 'linear-gradient(135deg, #FF6B6B, #A855F7)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            cursor: pending ? 'wait' : 'pointer',
            minHeight: 60,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'transform 0.15s, opacity 0.15s',
            opacity: pending ? 0.7 : 1,
            touchAction: 'manipulation',
          }}
          onPointerDown={(e) => { if (!pending) e.currentTarget.style.transform = 'scale(0.97)' }}
          onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {pending ? '⏳ Загружаем...' : isLast ? '🏆 Результаты' : 'Следующий раунд →'}
        </button>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
        }}>
          ⏳ Ждём, когда {partnerName || 'партнёр'} перейдёт дальше...
        </div>
      )}
    </div>
  )
}

function AnswerCard({ name, answer, question, gradient, matched }) {
  const text = getOptionText(question, answer)

  return (
    <div style={{
      borderRadius: 18,
      overflow: 'hidden',
      border: matched ? '2px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
    }}>
      <div style={{
        background: gradient,
        padding: '10px 12px',
        fontSize: 12,
        fontWeight: 800,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.5,
      }}>
        {name}
      </div>
      <div style={{
        padding: '14px 12px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: ANSWER_GRADIENTS[answer] || gradient,
          lineHeight: '32px',
          fontSize: 16,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 8,
        }}>
          {answer}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          {text}
        </div>
      </div>
    </div>
  )
}

const RESULT_TIERS = [
  {
    score: 0,
    title: 'Два разных мира',
    desc: 'Вы такие разные, что это само по себе удивительно — как вы вообще нашли друг друга? Возможно, именно поэтому рядом так интересно: каждый день открываешь что-то новое.',
    image: '/images/results/score-0.jpg',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  },
  {
    score: 1,
    title: 'Первые шаги навстречу',
    desc: 'Ваши миры только начинают соприкасаться. Перед вами — целая вселенная открытий друг о друге. Это не конец пути, а самое его начало.',
    image: '/images/results/score-1.jpg',
    gradient: 'linear-gradient(135deg, #f093fb, #f5a7c7)',
  },
  {
    score: 2,
    title: 'Загадочный дуэт',
    desc: 'Вы как два детектива, которые всё ещё разгадывают друг друга. Столько тайн, столько интереса — скучно точно не будет!',
    image: '/images/results/score-2.jpg',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
  },
  {
    score: 3,
    title: 'Разные, но тянетесь',
    desc: 'Больше различий, чем совпадений — но что-то неуловимое всё равно вас соединяет. Может, именно в этом и есть волшебство?',
    image: '/images/results/score-3.jpg',
    gradient: 'linear-gradient(135deg, #f7971e, #ffd200)',
  },
  {
    score: 4,
    title: 'Контраст как сила',
    desc: 'Вы дополняете друг друга там, где не совпадаете. Как в хорошей команде — у каждого своя суперсила.',
    image: '/images/results/score-4.jpg',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
  },
  {
    score: 5,
    title: 'Половинки-загадки',
    desc: 'Ровно половина — совпадение, половина — сюрприз. Вы одновременно похожи и удивляете друг друга. Жить рядом — никогда не скучно.',
    image: '/images/results/score-5.jpg',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  },
  {
    score: 6,
    title: 'Тёплая волна',
    desc: 'Вы чаще понимаете друг друга с полуслова, чем нет. Между вами — тёплая, уютная близость.',
    image: '/images/results/score-6.jpg',
    gradient: 'linear-gradient(135deg, #fccb90, #d57eeb)',
  },
  {
    score: 7,
    title: 'Почти телепаты',
    desc: 'Вы думаете похоже, чувствуете похоже. Небольшие различия лишь добавляют пикантности — было бы скучно быть идентичными.',
    image: '/images/results/score-7.jpg',
    gradient: 'linear-gradient(135deg, #96fbc4, #f9f586)',
  },
  {
    score: 8,
    title: 'Родственные души',
    desc: 'Вы на одной волне почти всегда. Рядом с таким человеком — легко и тепло, как будто знаешь его вечность.',
    image: '/images/results/score-8.jpg',
    gradient: 'linear-gradient(135deg, #f6d365, #fda085)',
  },
  {
    score: 9,
    title: 'Созвездие двоих',
    desc: 'Вы настолько синхронизированы, что кажется — вас создавали по одному чертежу. Таких пар — единицы.',
    image: '/images/results/score-9.jpg',
    gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)',
  },
  {
    score: 10,
    title: 'Идеальный союз',
    desc: 'Вы мыслите, чувствуете и мечтаете в унисон. Это редкость, это ценность, это — вы.',
    image: '/images/results/score-10.jpg',
    gradient: 'linear-gradient(135deg, #FFD700, #FF8E53)',
  },
]

function ResultScreen({ p1, p2, matches, playerId, isHost, totalRounds, onResetGame, onGoHome }) {
  const matchCount = matches || 0
  const pct = totalRounds > 0 ? Math.round((matchCount / totalRounds) * 100) : 0
  const [resetPending, setResetPending] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const tier = RESULT_TIERS[Math.min(matchCount, 10)]

  useEffect(() => {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: [P1_COLOR, P2_COLOR, '#FFD700'] })
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #200f2e 0%, #1b1240 50%, #0f2860 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      padding: '32px 20px',
      paddingTop: 'calc(32px + env(safe-area-inset-top))',
      paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
      gap: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Result image card */}
        <div className="bounce-in" style={{
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
          marginBottom: 20,
        }}>
          {/* Image */}
          <div style={{
            width: '100%',
            aspectRatio: '1/1',
            background: tier.gradient,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src={tier.image}
              alt={tier.title}
              loading="eager"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                transition: 'opacity 0.4s',
                opacity: imgLoaded ? 1 : 0,
              }}
            />
            {/* Score badge */}
            <div style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 15,
              fontWeight: 900,
              color: '#fff',
            }}>
              {matchCount}/{totalRounds} ❤️
            </div>
          </div>

          {/* Text */}
          <div style={{ padding: '20px 22px 22px', textAlign: 'center' }}>
            <h1 style={{
              fontFamily: "'Paytone One', sans-serif",
              fontSize: 22,
              color: '#fff',
              marginBottom: 10,
              lineHeight: 1.25,
            }}>
              {tier.title}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 14,
              lineHeight: 1.6,
              margin: 0,
            }}>
              {tier.desc}
            </p>
          </div>
        </div>

        {/* Compatibility bar */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '18px 22px',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            Совместимость
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 900,
            fontFamily: "'Paytone One', sans-serif",
            background: tier.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            {pct}%
          </div>
          <div style={{
            height: 8,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            marginTop: 10,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 4,
              background: tier.gradient,
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>
            {matchCount} из {totalRounds} вопросов совпали
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isHost && (
            <button
              onClick={async () => {
                if (resetPending) return
                setResetPending(true)
                try { await onResetGame() } catch { setResetPending(false) }
              }}
              disabled={resetPending}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B6B, #A855F7)',
                color: '#fff',
                fontSize: 17,
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: resetPending ? 'wait' : 'pointer',
                minHeight: 56,
                opacity: resetPending ? 0.7 : 1,
                transition: 'opacity 0.15s',
                touchAction: 'manipulation',
              }}
            >
              {resetPending ? '⏳ Готовим новую игру...' : '🔄 Играть снова'}
            </button>
          )}
          {!isHost && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              padding: '8px',
            }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.15)',
                borderTopColor: '#A855F7',
                animation: 'spin 0.9s linear infinite',
                flexShrink: 0,
              }} />
              Ждём, когда партнёр предложит сыграть снова...
            </div>
          )}
          <button
            onClick={onGoHome}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 17,
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              cursor: 'pointer',
              minHeight: 56,
            }}
          >
            На главную
          </button>
        </div>

      </div>
    </div>
  )
}

