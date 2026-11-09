// NOF DİJİTAL – portfolyo/blog görsel üretimi (z-ai CLI, eşzamanlı 4 iş)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/home/z/my-project/assets_raw';
fs.mkdirSync(OUT, { recursive: true });

const Q = 'professional commercial photography, photorealistic, high-end creative agency portfolio quality, clean composition, soft studio lighting, sharp focus, no text, no watermark, no logo';

const jobs = [
  // --- GALERİ (21) ---
  { n: 'g01', s: '1024x1024', p: 'minimal skincare bottles arrangement on stone pedestal, beige and soft purple color palette' },
  { n: 'g02', s: '864x1152', p: 'fashion editorial model in flowing lilac dress against deep violet studio backdrop, dramatic pose' },
  { n: 'g03', s: '1024x1024', p: 'gourmet burger with melted cheese on dark rustic table, moody food photography' },
  { n: 'g04', s: '1344x768', p: 'white sneaker floating mid-air above glossy purple surface, dynamic product shot' },
  { n: 'g05', s: '1024x1024', p: 'flat lay of latte art coffee cup with coffee beans on marble, warm tones' },
  { n: 'g06', s: '1344x768', p: 'behind the scenes of commercial video shoot, cinema camera rig and crew silhouettes, clapperboard, dark studio with purple gel lighting' },
  { n: 'g07', s: '864x1152', p: 'confident businesswoman portrait in modern office, natural window light, corporate photography' },
  { n: 'g08', s: '1024x1024', p: 'macro shot of elegant gold jewelry ring with soft reflections on silk fabric' },
  { n: 'g09', s: '1024x1024', p: 'cosmetic cream texture swatch smears on lavender background, beauty product abstract' },
  { n: 'g10', s: '1344x768', p: 'modern creative office interior with plants and warm daylight, architectural photography' },
  { n: 'g11', s: '1024x1024', p: 'premium wireless headphones on gradient-free solid light purple background, studio product shot' },
  { n: 'g12', s: '1024x1024', p: 'fine dining plated dish with elegant garnish on ceramic plate, overhead food photography' },
  { n: 'g13', s: '864x1152', p: 'street style male model in urban setting, motion blur city background, fashion lookbook' },
  { n: 'g14', s: '864x1152', p: 'luxury perfume bottle on reflective black surface with dramatic rim light and smoke' },
  { n: 'g15', s: '1344x768', p: 'mirrorless camera on tripod in photography studio with softbox lights turned on' },
  { n: 'g16', s: '1344x768', p: 'creative team brainstorming with sticky notes on glass wall in bright agency office' },
  { n: 'g17', s: '1024x1024', p: 'flat lay content creator setup: smartphone showing colorful photo grid, ring light, props on pastel background' },
  { n: 'g18', s: '1024x1024', p: 'premium packaging boxes stacked in purple and white color scheme, unboxing style product photography' },
  { n: 'g19', s: '864x1152', p: 'athlete tying sport shoes in dark gym with dramatic purple accent lighting, fitness campaign' },
  { n: 'g20', s: '1024x1024', p: 'artisan patisserie desserts and macarons on pastel display, bright bakery photography' },
  { n: 'g21', s: '1024x1024', p: 'stylish eyeglasses on acrylic riser with hard shadow play, minimal product photography' },
  // --- BLOG KAPAKLARI (8) ---
  { n: 'b01', s: '1344x768', p: 'hand holding smartphone with social media feed interface, purple phone case, blurred creative office background' },
  { n: 'b02', s: '1344x768', p: 'laptop on desk showing advertising performance dashboard with charts and graphs, dark modern workspace' },
  { n: 'b03', s: '1344x768', p: 'advertising campaign planning desk: laptop, coffee, printed campaign wireframes, top view' },
  { n: 'b04', s: '1344x768', p: 'product photography studio setup with softbox lights, table with props and camera, behind the scenes' },
  { n: 'b05', s: '1344x768', p: 'open planner notebook with neat weekly schedule grid, flat lay on wooden desk with pen and coffee' },
  { n: 'b06', s: '1344x768', p: 'marketing team reviewing rising metric charts on large wall screen in meeting room' },
  { n: 'b07', s: '1344x768', p: 'video editing workstation in dark studio, color grading timeline on monitor, cinematic purple ambient light' },
  { n: 'b08', s: '1344x768', p: 'brand moodboard wall with pinned color swatches, fabric samples and photos in purple tones, studio wall' },
  // --- HAKKIMIZDA (2) ---
  { n: 'a01', s: '1344x768', p: 'photographer and art director reviewing shots on camera screen together in studio, candid teamwork' },
  { n: 'a02', s: '1152x864', p: 'modern photo studio interior with lighting equipment, backdrop rolls and purple accent wall' },
  // --- HERO (2) ---
  { n: 'h01', s: '1344x768', p: 'cinema camera on set filmed from behind, crew light silhouettes, deep violet gel lighting atmosphere, movie production' },
  { n: 'h02', s: '1024x1024', p: 'hand holding smartphone with colorful social media content grid on screen, minimal pastel background' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runOne(job) {
  return new Promise((resolve) => {
    const out = path.join(OUT, job.n + '.png');
    if (fs.existsSync(out) && fs.statSync(out).size > 30000) { resolve(true); return; }
    const proc = spawn('z-ai', ['image', '-p', job.p + ', ' + Q, '-o', out, '-s', job.s], { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    proc.stderr.on('data', d => err += d);
    const t = setTimeout(() => { proc.kill('SIGKILL'); resolve(false); }, 180000);
    proc.on('close', (code) => {
      clearTimeout(t);
      const ok = code === 0 && fs.existsSync(out) && fs.statSync(out).size > 30000;
      if (!ok) console.error('HATA', job.n, 'kod:', code, err.slice(-160).replace(/\n/g, ' '));
      resolve(ok);
    });
  });
}

async function pool(jobs, limit = 1) {
  const queue = [...jobs];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const j = queue.shift();
      let ok = await runOne(j);
      for (let r = 0; r < 4 && !ok; r++) { await sleep(15000 * (r + 1)); ok = await runOne(j); } // üstel geri çekilme
      await sleep(4000);
    }
  });
  await Promise.all(workers);
}

const t0 = Date.now();
await pool(jobs);
const missing = jobs.filter(j => !fs.existsSync(path.join(OUT, j.n + '.png'))).map(j => j.n);
console.log('Süre:', ((Date.now() - t0) / 1000).toFixed(0) + 's', '| Eksik:', missing.join(',') || 'yok');
