#!/usr/bin/env node
/**
 * Generate 200 question images via openai/gpt-image-2 on Replicate
 * Style: cute flat vector romantic couple illustration (pink/rose palette)
 * Runs in parallel batches of CONCURRENCY requests
 */
import Replicate from 'replicate'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')
const outputDir = path.join(projectDir, 'public/images/questions')

const DELAY_BETWEEN = 5000 // ms between actual API requests (skipped files don't wait)
const RETRY_LIMIT = 5

fs.mkdirSync(outputDir, { recursive: true })

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// ── Per-emoji unique scenes ────────────────────────────────────────────────────
const EMOJI_SCENE = {
  // Мечты
  '🌟': 'person reaching up toward a glowing golden star in a deep indigo night sky, surrounded by smaller stars and comets, magical dreamy atmosphere',
  '🚀': 'colorful rocket launching into a vibrant starry universe, planets and galaxies around it, bold space exploration scene',
  '🏆': 'shining golden trophy on a tall podium surrounded by confetti and fireworks, victorious celebration illustration',
  '🎨': 'artist palette with vivid paint splashes forming a colorful abstract painting, creative energy and joy',
  '💎': 'sparkling diamond gemstone surrounded by golden rays and tiny gems, luxurious and radiant composition',
  '🌈': 'huge vibrant rainbow arching over rolling green hills with fluffy clouds and sunbeams, joyful and colorful',
  '🏝️': 'tropical island paradise with turquoise water, palm trees, hammock and golden sand, warm sunset tones',
  '🎭': 'theatrical masks of comedy and drama floating with swirling ribbons and spotlight on a dark stage',
  '🦋': 'beautiful butterfly with colorful wings surrounded by blooming flowers and soft bokeh light',
  '⭐': 'constellation of stars forming a glowing heart shape against a deep blue velvet sky',
  // Страхи и риски
  '😱': 'rollercoaster looping through colorful clouds with tiny excited figures, bold orange and yellow palette',
  '🎢': 'thrilling rollercoaster with big loop against a sunset sky in electric orange and purple tones',
  '🌊': 'dramatic ocean wave curling magnificently in deep teal and navy blues, powerful and majestic',
  '🕷️': 'stylized cute spider in web with geometric diamond pattern, dark and playful, teal and black palette',
  '🦈': 'friendly cartoon shark underwater surrounded by colorful tropical fish and coral reef, vivid aqua tones',
  '🌋': 'dramatic volcano erupting with bright lava and glowing embers against a dark night sky',
  '⚡': 'bold lightning bolt striking down with electric blue and yellow zigzag energy, dynamic power illustration',
  '🎯': 'bright target with arrow hitting bullseye, bold red and white rings, energetic sports illustration',
  '🏔️': 'dramatic mountain peak above clouds with golden sunrise glow, majestic alpine scenery',
  '🪂': 'colorful parachute floating above patchwork countryside fields, aerial adventure illustration',
  // Семья
  '👨‍👩‍👧': 'warm family scene with parents and child in a cozy golden-lit living room, sage green and amber palette',
  '👶': 'tiny baby shoes and booties next to a miniature crib mobile with stars, soft mint and cream tones',
  '🍼': 'cute baby bottle with a bow surrounded by tiny stars and moons, soft lavender and peach palette',
  '🏠': 'cozy house with smoke from chimney surrounded by blooming garden and white picket fence, warm terracotta tones',
  '👴': 'rocking chair on a porch with a cup of tea and warm golden afternoon light, nostalgic amber palette',
  '🎠': 'cheerful carousel with colorful horses in pastel fairground setting, pink yellow and mint tones',
  '🌻': 'bright sunflower field stretching to the horizon under a vivid blue sky, bold yellow and green palette',
  '🎒': 'colorful school backpack with stationery and books scattered around, vibrant teal and orange palette',
  '🏡': 'charming countryside cottage with garden flowers and stone path, earthy sage and terracotta palette',
  // Стиль и внешность
  '👗': 'elegant dress on a hanger surrounded by fashion accessories and flowers, vibrant fuchsia and gold palette',
  '💄': 'stylish cosmetics and perfume bottles arranged beautifully, bold magenta and rose gold palette',
  '👠': 'high heeled shoes with scattered rose petals and jewelry, glamorous deep red and gold palette',
  '🧴': 'skincare bottles and beauty products in a minimalist arrangement, clean sage green and cream palette',
  '💇': 'modern hair salon scene with scissors and mirror reflection, electric teal and silver palette',
  '🕶️': 'cool sunglasses reflecting a summer beach scene, vibrant coral and turquoise palette',
  '💍': 'sparkling engagement ring with diamond surrounded by rose petals and soft bokeh lights, gold and blush',
  '🧣': 'cozy knitted scarf and hat with snowflakes, warm burgundy and mustard yellow winter palette',
  '🎩': 'elegant top hat with magic wand and stars, dramatic black gold and purple palette',
  '🌸': 'cherry blossom branch in full bloom against a clear sky, soft pink and white with green accents',
  // Характер
  '🧠': 'glowing brain with colorful neural connections and lightning bolts, deep purple and electric blue palette',
  '❤️': 'bold red heart with radiating warm golden light, dynamic energy lines around it, crimson and gold',
  '🎲': 'colorful dice mid-air with confetti explosion, bold blue yellow and red game palette',
  '⚖️': 'golden balance scales perfectly leveled with subtle light rays, deep navy and gold palette',
  '🦁': 'majestic lion with flowing mane in warm amber and orange sunset tones, bold and regal',
  '🐢': 'friendly turtle with patterned shell in a lush tropical garden, forest green and teal palette',
  '🌪️': 'whimsical colorful tornado swirling with tiny objects flying around, electric purple and yellow',
  '🧩': 'colorful jigsaw puzzle pieces fitting together perfectly, vibrant multi-color illustration',
  '🎯': 'precision archery target with arrow dead center, deep crimson and forest green palette',
  '🔮': 'glowing crystal ball showing swirling galaxies inside, deep indigo and violet palette',
  // Кино и музыка
  '🎬': 'vintage film clapperboard with movie reel and popcorn, deep navy and bright yellow palette',
  '🎵': 'colorful music notes flying and dancing in the air, vibrant rainbow palette on dark background',
  '🎸': 'electric guitar with dynamic sound waves radiating outward, bold crimson and black rock palette',
  '🎹': 'grand piano keys with musical notes floating up like bubbles, elegant black and gold palette',
  '🎤': 'microphone with glowing spotlight and sound wave rings, deep purple and gold stage palette',
  '🎧': 'wireless headphones with colorful sound wave visualization, vivid electric blue and coral palette',
  '🎻': 'elegant violin with swirling musical ribbons and sheet music, warm mahogany and cream palette',
  '🎷': 'shiny saxophone with jazz musical notes floating in smoky club atmosphere, amber and dark teal',
  '🎺': 'brass trumpet with bold musical notes bursting outward, vibrant gold and cobalt blue palette',
  '🎭': 'cinema screen lighting up dark theater with dramatic red curtains, crimson and golden palette',
  // Философия жизни
  '🕰️': 'ornate pocket watch surrounded by swirling clockwork gears and time particles, antique gold palette',
  '🌅': 'magnificent golden sunrise over calm ocean horizon, warm amber orange and purple sky palette',
  '🍃': 'fresh green leaves and petals floating in gentle breeze, forest green and warm sunlight palette',
  '🌙': 'crescent moon over a sleeping city with stars and aurora lights, deep midnight blue and silver',
  '🪐': 'majestic ringed planet in deep space surrounded by stars and nebula, purple indigo and gold palette',
  '🔥': 'vibrant campfire with warm dancing flames and glowing embers, deep orange and ember red palette',
  '💫': 'shooting star with long golden trail across a deep indigo sky, magical and luminous',
  '🌊': 'peaceful ocean wave at dusk, soft teal blues and warm horizon glow, serene and vast',
  '🧘': 'silhouette in meditation pose on mountain top with sunrise behind, sage green and golden palette',
  '🌌': 'breathtaking galaxy with nebula clouds in purple pink and blue, vast cosmic illustration',
  '🎯': 'compass rose with all cardinal directions glowing, deep teal and warm gold navigation palette',
  '💡': 'bright lightbulb with colorful ideas bursting out as tiny icons, warm yellow and deep blue palette',
  '🌱': 'tiny green sprout growing from dark rich soil with sunlight beam, earthy green and golden palette',
  '🤲': 'hands gently holding a glowing earth globe, warm teal and green compassion palette',
  '📜': 'rolled parchment scroll with wax seal and ornate ribbon, rich burgundy and antique gold palette',
  '🪞': 'ornate mirror reflecting a bright light, elegant deep navy and silver frame palette',
  // Extra emojis from remaining questions
  '🌍': 'colorful illustrated globe with continents in vibrant greens and blues, surrounded by tiny landmarks',
  '⏳': 'ornate hourglass with golden sand flowing, surrounded by swirling time symbols and clock gears',
  '🧬': 'colorful DNA double helix spiral with glowing nodes, electric blue and purple science palette',
  '🌑': 'dramatic dark moon with glowing corona against a starry indigo sky, silver and deep blue palette',
  '🐶': 'adorable cartoon puppy with floppy ears surrounded by paw prints and little bones, warm golden palette',
  '🦷': 'cheerful tooth character with sparkle effects and toothbrush, clean white and mint green palette',
  '📞': 'vintage rotary telephone with swirling phone cord and speech bubbles, warm retro coral and cream',
  '🎄': 'decorated Christmas tree with glowing ornaments and star on top, festive deep green and gold palette',
  '🚸': 'colorful playground scene with swings and slide in bright primary colors, joyful yellow and blue palette',
  '👵': 'cozy armchair with knitting and warm tea, nostalgic amber and cream grandmother palette',
  '🎂': 'beautiful celebration cake with candles and colorful frosting, festive pink purple and gold palette',
  '🍲': 'steaming pot of hearty stew with vegetables and herbs, warm earthy red and brown comfort palette',
  '💅': 'elegant nail polish bottles with sparkles and flowers, glamorous rose gold and cream palette',
  '✂️': 'stylish scissors with colorful fabric swatches and patterns, creative teal and mustard palette',
  '👜': 'chic handbag with gold clasp surrounded by fashion accessories, luxurious brown and gold palette',
  '📺': 'retro television set showing a colorful broadcast, nostalgic turquoise and warm orange palette',
  '🎙️': 'vintage studio microphone with sound waves and music notes, warm amber and dark teal palette',
  '🎼': 'elegant music sheet with colorful notes floating off the page, classical ivory and deep blue palette',
  '📽️': 'vintage film projector casting a colorful beam of light, warm amber and deep purple cinema palette',
  '💭': 'whimsical thought bubble filled with colorful tiny dreams and ideas, soft lavender and gold palette',
  '😤': 'cartoon face with steam puffs and expressive eyebrows, bold orange and red palette',
  '🤝': 'two hands clasped in a strong handshake with sparks of energy, deep teal and warm gold palette',
  '🎪': 'colorful circus tent with pennant flags and stars, bold red yellow and blue big top palette',
  // Парные ситуации
  '💬': 'two colorful speech bubbles intertwining with small hearts and symbols inside, coral and teal palette',
  '🧦': 'cozy living room floor with slippers and a warm rug, soft sage and terracotta home palette',
  '📱': 'two smartphones side by side with colorful app screens glowing, electric blue and coral palette',
  '🗺️': 'colorful illustrated city map with landmarks and winding streets, warm amber and teal palette',
  '🎁': 'beautifully wrapped gift boxes stacked with ribbons and bows, vibrant coral and gold palette',
  '🍝': 'steaming bowl of pasta with herbs and ingredients around it, warm Italian red and cream palette',
  '💼': 'briefcase open showing travel documents passport and tickets, deep navy and warm gold palette',
  '🛍️': 'colorful shopping bags with ribbons and small gifts spilling out, vibrant fuchsia and yellow palette',
  '🤐': 'speech bubble with a zipper, surrounded by other bubbles in various colors, playful teal palette',
  '🛌': 'cozy bedroom with soft pillows blanket and warm lamp glow, deep midnight blue and warm amber',
}

// ── Color palettes per category ───────────────────────────────────────────────
const CATEGORY_PALETTE = {
  'Путешествия':      'warm sky blue, sunny yellow, and tangerine orange travel palette',
  'Еда и кухня':      'warm terracotta, cream, and basil green food palette',
  'Утро и вечер':     'soft lavender, golden amber, and pale blue morning palette',
  'Деньги и финансы': 'deep forest green, gold, and ivory finance palette',
  'Карьера и амбиции':'bold teal, warm coral, and bright white career palette',
  'Дом и уют':        'sage green, warm beige, and terracotta home palette',
  'Друзья и общение': 'vibrant yellow, turquoise, and warm orange social palette',
  'Романтика':        'deep rose, burgundy, and antique gold romance palette',
  'Развлечения':      'electric purple, neon coral, and deep navy entertainment palette',
  'Спорт и здоровье': 'energetic lime green, cobalt blue, and bright orange sport palette',
  'Технологии':       'cool electric blue, silver, and deep charcoal tech palette',
  'Природа':          'forest green, sky blue, and warm amber nature palette',
  'Мечты':            'deep midnight indigo, shimmering gold, and soft violet dream palette',
  'Страхи и риски':   'bold orange, black, and electric yellow adventure palette',
  'Семья':            'warm amber, sage green, and soft cream family palette',
  'Стиль и внешность':'vibrant fuchsia, rose gold, and ivory fashion palette',
  'Характер':         'rich teal, warm coral, and deep purple character palette',
  'Кино и музыка':    'deep navy, crimson red, and golden yellow entertainment palette',
  'Философия жизни':  'warm terracotta, sage green, and antique gold philosophy palette',
  'Парные ситуации':  'soft mint, warm coral, and lavender couple palette',
}

// ── Composition styles (cycle through) ────────────────────────────────────────
const COMPOSITIONS = [
  'wide scenic illustration with detailed background environment',
  'centered close-up bold graphic composition',
  'isometric 3D-style flat design layout',
  'minimal clean centered icon illustration',
  'dynamic diagonal composition with energy and movement',
  'soft circular frame composition with decorative border',
  'bold poster-style graphic design layout',
  'detailed storytelling scene with rich background',
]

// ── Build prompt per question ─────────────────────────────────────────────────
function buildPrompt(question, index) {
  const scene = EMOJI_SCENE[question.emoji]
    || `charming illustration related to ${question.category.toLowerCase()}, featuring ${question.emoji} as the central element`
  const palette = CATEGORY_PALETTE[question.category] || 'vibrant multicolor palette'
  const composition = COMPOSITIONS[index % COMPOSITIONS.length]

  return (
    `Cute flat vector illustration, ${scene}, ` +
    `${palette}, ${composition}, ` +
    `clean white or very light background, no text no letters, no people unless the scene requires it, ` +
    `2D flat design, modern mobile app illustration style, vibrant and lively`
  )
}

// ── Download helper ───────────────────────────────────────────────────────────
async function downloadFile(urlLike, dest) {
  const urlStr =
    typeof urlLike?.url === 'function'
      ? (await urlLike.url()).toString()
      : urlLike.toString()
  const res = await fetch(urlStr)
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${urlStr}`)
  const buf = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buf))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Generate one image ────────────────────────────────────────────────────────
async function generateOne(question, index, retries = RETRY_LIMIT) {
  const slug = `q${String(index).padStart(3, '0')}`
  const pngDest = path.join(outputDir, `${slug}.png`)
  const jpgDest = path.join(outputDir, `${slug}.jpg`)

  if (fs.existsSync(jpgDest)) {
    process.stdout.write(`⏭  ${slug} (уже есть)\n`)
    return true
  }

  const prompt = buildPrompt(question, index)

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const output = await replicate.run('openai/gpt-image-2', {
        input: {
          prompt,
          quality: 'low',
          aspect_ratio: '1:1',
          output_format: 'png',
          background: 'opaque',
          number_of_images: 1,
        },
      })

      // gpt-image-2 returns an array of URLs or ReadableStream objects
      const img = Array.isArray(output) ? output[0] : output
      await downloadFile(img, pngDest)

      // PNG → JPEG 85%
      execSync(
        `sips -s format jpeg -s formatOptions 85 "${pngDest}" --out "${jpgDest}" 2>/dev/null`
      )
      fs.unlinkSync(pngDest)

      process.stdout.write(`✅  ${slug} (${question.category})\n`)
      return true
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('402')) {
        console.error('\n❌ Недостаточно кредитов на replicate.com/account/billing')
        process.exit(1)
      }
      if (msg.includes('429') && attempt < retries - 1) {
        const wait = 20000 + attempt * 10000
        process.stdout.write(`⏳  ${slug}: throttle, жду ${wait/1000}s...\n`)
        await sleep(wait)
        continue
      }
      process.stdout.write(`✗  ${slug}: ${msg.slice(0, 80)}\n`)
      if (attempt < retries - 1) await sleep(5000)
    }
  }
  return false
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌  REPLICATE_API_TOKEN не задан')
    process.exit(1)
  }

  // Dynamically import questions
  const { ALL_QUESTIONS } = await import('../src/questions.js')

  console.log(`\n🎨  Генерирую ${ALL_QUESTIONS.length} картинок к вопросам (openai/gpt-image-2)\n`)
  console.log(`    Режим: последовательный | Sleep ${DELAY_BETWEEN/1000}s перед каждым новым запросом | Повторов: ${RETRY_LIMIT}\n`)

  let ok = 0
  let fail = 0

  // Sequential — one request at a time, 5s pause only before actual API calls
  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const slug = `q${String(i).padStart(3, '0')}`
    const jpgDest = path.join(outputDir, `${slug}.jpg`)

    if (fs.existsSync(jpgDest)) {
      process.stdout.write(`⏭  ${slug} (уже есть)\n`)
      ok++
      continue
    }

    // Sleep before sending a new request
    if (i > 0) await sleep(DELAY_BETWEEN)
    const success = await generateOne(ALL_QUESTIONS[i], i)
    if (success) ok++; else fail++
  }

  console.log(`\n──────────────────────────────────────`)
  console.log(`✅  Готово: ${ok}/${ALL_QUESTIONS.length}`)
  if (fail > 0) console.log(`❌  Ошибок: ${fail}`)
  console.log(`📁  ${outputDir}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
