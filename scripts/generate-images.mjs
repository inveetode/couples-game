#!/usr/bin/env node
import Replicate from 'replicate'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')

const { ALL_QUESTIONS } = await import(path.join(projectDir, 'src/questions.js'))

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const outputDir = path.join(projectDir, 'public/images/questions')
fs.mkdirSync(outputDir, { recursive: true })

const CATEGORY_HINTS = {
  'Путешествия':       'travel suitcase airplane world map passport stamps beach mountains',
  'Еда и кухня':       'food cooking kitchen colorful dishes ingredients chef restaurant',
  'Утро и вечер':      'morning coffee sunrise cozy bedroom evening candles night sky',
  'Деньги и финансы':  'coins savings piggy bank financial growth wallet budget',
  'Карьера и амбиции': 'office laptop career growth success business meeting',
  'Дом и уют':         'cozy home interior plants cushions warm lighting living room',
  'Друзья и общение':  'friends laughing social gathering coffee chat people together',
  'Романтика':         'romance couple love hearts flowers candles dinner date',
  'Развлечения':       'games movies popcorn fun hobbies leisure controller book',
  'Спорт и здоровье':  'sports fitness yoga running healthy lifestyle gym',
  'Технологии':        'smartphone social media gadgets digital tech laptop apps',
  'Природа':           'nature forest mountains lake animals seasons flowers',
  'Мечты':             'dreams stars sky future goals imagination clouds wish',
  'Страхи и риски':    'adventure courage parachute exciting challenge jumping',
  'Семья':             'family home children love together warmth parents',
  'Стиль и внешность': 'fashion style wardrobe beauty self-care mirror clothes',
  'Характер':          'personality mood emotions character habits daily routine',
  'Кино и музыка':     'cinema music headphones concert film guitar notes',
  'Философия жизни':   'philosophy life meaning stars universe wisdom books',
  'Парные ситуации':   'couple together holding hands relationship love story',
}

function buildPrompt(q) {
  const hints = CATEGORY_HINTS[q.category] || 'lifestyle couple love'
  return `Cute minimal flat vector illustration, ${hints}, soft pastel colors, warm romantic mood, absolutely no text no words no letters, clean simple design, white or light background, sweet gentle aesthetic, couples quiz game card art, 2D flat design`
}

async function downloadFile(urlLike, dest) {
  const urlStr = typeof urlLike?.url === 'function'
    ? (await urlLike.url()).toString()
    : urlLike.toString()
  const res = await fetch(urlStr)
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${urlStr}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buf))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function generateOne(question, index, retries = 3) {
  const filename = `q${String(index).padStart(3, '0')}.png`
  const dest = path.join(outputDir, filename)

  if (fs.existsSync(dest)) {
    process.stdout.write('⏭')
    return filename
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const output = await replicate.run('black-forest-labs/flux-schnell', {
        input: {
          prompt: buildPrompt(question),
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 80,
          go_fast: true,
        },
      })

      const item = Array.isArray(output) ? output[0] : output
      await downloadFile(item, dest)
      process.stdout.write('✓')
      return filename
    } catch (err) {
      const is429 = err.message.includes('429') || err.message.includes('throttled')
      const is402 = err.message.includes('402')
      if (is402) {
        console.error(`\n❌ Недостаточно кредитов — пополни баланс на replicate.com/account/billing`)
        process.exit(1)
      }
      if (is429 && attempt < retries - 1) {
        process.stdout.write('⏳')
        await sleep(12000) // wait 12s then retry
        continue
      }
      process.stdout.write('✗')
      console.error(`\n  [${index}] ${err.message.slice(0, 120)}`)
      return null
    }
  }
  return null
}

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌  REPLICATE_API_TOKEN не задан')
    process.exit(1)
  }

  const results = []
  const already = ALL_QUESTIONS.filter((_, i) =>
    fs.existsSync(path.join(outputDir, `q${String(i).padStart(3, '0')}.png`))
  ).length
  console.log(`Генерирую ${ALL_QUESTIONS.length} изображений (FLUX Schnell)...`)
  console.log(`Уже готово: ${already}, осталось: ${ALL_QUESTIONS.length - already}\n`)

  // Sequential with 11s gap to respect 6 req/min rate limit
  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const dest = path.join(outputDir, `q${String(i).padStart(3, '0')}.png`)
    const existed = fs.existsSync(dest)
    const filename = await generateOne(ALL_QUESTIONS[i], i)
    results.push(filename)
    if ((i + 1) % 20 === 0) process.stdout.write(` [${i + 1}/${ALL_QUESTIONS.length}]\n`)
    if (!existed && filename) await sleep(7000) // delay only after actually generating
  }

  const ok = results.filter(Boolean)
  console.log(`\n\n✅  ${ok.length}/${ALL_QUESTIONS.length} изображений сохранено`)
  console.log(`📁  ${outputDir}`)

  if (ok.length === 0) return

  // Patch questions.js: add image field to every question entry
  console.log('\nОбновляю src/questions.js...')
  const qPath = path.join(projectDir, 'src/questions.js')
  let src = fs.readFileSync(qPath, 'utf8')

  ALL_QUESTIONS.forEach((q, i) => {
    const filename = results[i]
    if (!filename) return
    // Find "optionB: '...'," for this exact question and insert image after
    const escaped = q.optionB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\'")
    const re = new RegExp(`(optionB: '${escaped}',)(?!\\s*image:)`, 'g')
    src = src.replace(re, `$1\n    image: '/images/questions/${filename}',`)
  })

  fs.writeFileSync(qPath, src)
  console.log('✅  questions.js обновлён — поле image добавлено к каждому вопросу')
}

main().catch((e) => { console.error(e); process.exit(1) })
