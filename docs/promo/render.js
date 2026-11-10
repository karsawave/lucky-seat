// Render video promo: promo.html → MP4 (frame PNG dialirkan langsung ke ffmpeg) + audio dari sfx.py.
// Pakai:
//   node docs/promo/render.js --lang id --ratio 9x16 --cut 25            → build/lucky-seat-id-9x16-25s.mp4
//   node docs/promo/render.js --lang en --still 2 --out cover.png        → sampul (hook + nama merek)
//   node docs/promo/render.js --lang id --preview 2,9.5,20               → beberapa PNG untuk diperiksa
// Butuh: Playwright + Chromium, ffmpeg, python3. Jalankan capture.js dulu untuk bahasa yang sama.
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const lang = arg("lang", "id"), ratio = arg("ratio", "9x16"), cut = arg("cut", "25"), fps = +arg("fps", "60");
const BUILD = path.join(__dirname, "build");
const name = `lucky-seat-${lang}-${ratio}-${cut}s`;
const FONTS = ['500 40px "Bricolage Grotesque"', '800 40px "Bricolage Grotesque"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];

(async () => {
  const b = await chromium.launch();
  const [W, H] = ratio === "16x9" ? [1920, 1080] : [1080, 1920];
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await pg.goto("file://" + path.join(__dirname, "promo.html") + `?lang=${lang}&ratio=${ratio}&cut=${cut}` + (arg("still") ? "&cover=1" : ""));
  await pg.evaluate((f) => Promise.all(f.map((x) => document.fonts.load(x))), FONTS);
  const frame = async (t, opt) => {
    await pg.evaluate((t) => seek(t), t);
    await pg.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    return pg.screenshot({ type: "png", ...opt });
  };

  if (arg("still")) { await frame(+arg("still"), { path: arg("out", path.join(BUILD, name + "-cover.png")) }); return b.close(); }
  if (arg("preview")) {
    const dir = path.join(BUILD, "preview-" + name); fs.mkdirSync(dir, { recursive: true });
    for (const [i, t] of arg("preview").split(",").map(Number).entries()) await frame(t, { path: path.join(dir, `p${i}-${t}s.png`) });
    console.log(dir); return b.close();
  }

  const audio = await pg.evaluate(() => window.AUDIO);
  const json = path.join(BUILD, name + ".audio.json"), wav = path.join(BUILD, name + ".wav");
  fs.writeFileSync(json, JSON.stringify(audio));
  execFileSync("python3", [path.join(__dirname, "sfx.py"), json, wav]);

  const out = arg("out", path.join(BUILD, name + ".mp4"));
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-i", wav,
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-profile:v", "high", "-tune", "animation",
    "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(audio.dur * fps);
  for (let i = 0; i < n; i++) {
    const buf = await frame(i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await b.close();
  console.log(out);
})();
