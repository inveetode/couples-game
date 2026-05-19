#!/usr/bin/env node
import Replicate from 'replicate'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')
const outputDir = path.join(projectDir, 'public/images/results')
fs.mkdirSync(outputDir, { recursive: true })

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const RESULTS = [
  {
    score: 0,
    slug: 'score-0',
    prompt: 'Cute minimal flat vector illustration, two contrasting colorful planets floating in pastel cosmos, one warm orange planet and one cool blue planet orbiting separately but with a magical glowing path between them, soft starry background, no text no letters, clean 2D flat design, white light background, sweet gentle romantic aesthetic',
  },
  {
    score: 1,
    slug: 'score-1',
    prompt: 'Cute minimal flat vector illustration, two tiny silhouette figures standing on opposite shores of a gentle river, a single delicate rope bridge just beginning to form between them, soft pastel sunrise colors pink and lavender, no text no letters, clean 2D flat design, white light background, hopeful romantic aesthetic',
  },
  {
    score: 2,
    slug: 'score-2',
    prompt: 'Cute minimal flat vector illustration, two rounded jigsaw puzzle pieces side by side almost fitting together with a warm glow between them, soft pastel mint and peach colors, curious playful mood, no text no letters, clean 2D flat design, white light background, sweet gentle aesthetic',
  },
  {
    score: 3,
    slug: 'score-3',
    prompt: 'Cute minimal flat vector illustration, two small potted plants on separate shelves gently leaning and reaching toward each other with tiny leaves almost touching, warm pastel green and yellow tones, cozy hopeful mood, no text no letters, clean 2D flat design, white light background, sweet gentle aesthetic',
  },
  {
    score: 4,
    slug: 'score-4',
    prompt: 'Cute minimal flat vector illustration, a modern soft yin-yang symbol in warm coral and cool sky blue pastel colors, balanced harmonious composition, small decorative hearts and stars around it, no text no letters, clean 2D flat design, white light background, sweet romantic aesthetic',
  },
  {
    score: 5,
    slug: 'score-5',
    prompt: 'Cute minimal flat vector illustration, two musical notes in warm pastel colors intertwining to form a soft heart shape, small musical sparks around them, warm rosy tones, playful balanced mood, no text no letters, clean 2D flat design, white light background, sweet gentle romantic aesthetic',
  },
  {
    score: 6,
    slug: 'score-6',
    prompt: 'Cute minimal flat vector illustration, two cozy mugs of hot drinks on a small round table, steam rising and gently swirling together forming a small heart cloud, warm amber and cream tones, soft cozy mood, no text no letters, clean 2D flat design, white light background, warm romantic aesthetic',
  },
  {
    score: 7,
    slug: 'score-7',
    prompt: 'Cute minimal flat vector illustration, two colorful balloons tied to a single ribbon string floating upward together, one coral and one lavender balloon with tiny sparkles, light airy joyful mood, soft pastel sky background, no text no letters, clean 2D flat design, white light background, sweet romantic aesthetic',
  },
  {
    score: 8,
    slug: 'score-8',
    prompt: 'Cute minimal flat vector illustration, two beautiful flowers blooming from a single shared root in the ground, one warm rose and one soft lavender flower, leaves gently intertwining, soft earth tones, no text no letters, clean 2D flat design, white light background, warm romantic aesthetic',
  },
  {
    score: 9,
    slug: 'score-9',
    prompt: 'Cute minimal flat vector illustration, two bright glowing stars connected by a delicate golden constellation line forming a small heart shape, surrounded by tiny twinkling stars in a deep soft navy sky, magical dreamy mood, no text no letters, clean 2D flat design, white light background, romantic aesthetic',
  },
  {
    score: 10,
    slug: 'score-10',
    prompt: 'Cute minimal flat vector illustration, two perfect golden glowing circles overlapping in a Venn diagram forming a bright heart shape in the center, surrounded by tiny golden sparkles and confetti, triumphant joyful romantic mood, warm gold and white tones, no text no letters, clean 2D flat design, white light background',
  },
]

async function downloadFile(urlLike, dest) {
  const urlStr = typeof urlLike?.url === 'function'
    ? (await urlLike.url()).toString()
    : urlLike.toString()
  const res = await fetch(urlStr)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buf))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function generateOne(item, retries = 3) {
  const pngDest = path.join(outputDir, `${item.slug}.png`)
  const jpgDest = path.join(outputDir, `${item.slug}.jpg`)

  if (fs.existsSync(jpgDest)) {
    console.log(`⏭  score-${item.score}: уже есть`)
    return true
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const output = await replicate.run('black-forest-labs/flux-schnell', {
        input: {
          prompt: item.prompt,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 80,
          go_fast: true,
        },
      })
      const img = Array.isArray(output) ? output[0] : output
      await downloadFile(img, pngDest)

      // Convert PNG → JPEG
      execSync(`sips -s format jpeg -s formatOptions 85 "${pngDest}" --out "${jpgDest}" 2>/dev/null`)
      fs.unlinkSync(pngDest)

      console.log(`✅  score-${item.score}: готово`)
      return true
    } catch (err) {
      if (err.message.includes('402')) {
        console.error('❌ Недостаточно кредитов на replicate.com/account/billing')
        process.exit(1)
      }
      if (err.message.includes('429') && attempt < retries - 1) {
        console.log(`⏳  score-${item.score}: throttle, жду 12s...`)
        await sleep(12000)
        continue
      }
      console.error(`✗  score-${item.score}: ${err.message.slice(0, 100)}`)
      return false
    }
  }
  return false
}

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌  REPLICATE_API_TOKEN не задан')
    process.exit(1)
  }

  console.log('Генерирую 11 картинок результатов (FLUX Schnell)...\n')
  let ok = 0
  for (const item of RESULTS) {
    const success = await generateOne(item)
    if (success) ok++
    await sleep(7000)
  }
  console.log(`\n✅  ${ok}/11 картинок готово`)
  console.log(`📁  ${outputDir}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
