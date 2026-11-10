// Ambil layar asli Lucky Seat untuk video promo.
// Situs dari public/ dilayani lewat route Playwright di alamat aslinya (karsawave.github.io/lucky-seat),
// data dari template ID. Jam dibekukan agar timer sama di semua tangkapan.
// Pakai: node docs/promo/capture.js id|en
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const LANG = process.argv[2] === "en" ? "en" : "id";
const ROOT = path.resolve(__dirname, "../..");
const PUB = path.join(ROOT, "public");
const TPL = path.join(PUB, "templates/id");
const OUT = path.join(__dirname, "build", "cap-" + LANG);
const TIM = LANG === "en" ? "Office Team" : "Tim Kantor";
const NAMA = "Citra";
const JAM = "2026-11-10T08:15:00+07:00";
const SITUS = "https://karsawave.github.io/lucky-seat/";
const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdefg";
const TIPE = { html: "text/html", js: "text/javascript", css: "text/css", svg: "image/svg+xml" };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 412, height: 915 }, deviceScaleFactor: 6,
    locale: LANG === "en" ? "en-GB" : "id-ID", timezoneId: "Asia/Jakarta", acceptDownloads: true,
  });
  await ctx.addInitScript(([jam, lang]) => {
    const Asli = Date, F = new Asli(jam).getTime();
    class D extends Asli { constructor(...a) { if (a.length) super(...a); else super(F); } static now() { return F; } }
    window.Date = D;
    try { localStorage.setItem("ls-lang", lang); localStorage.setItem("ls-theme", "light"); } catch (e) {}
    Object.defineProperty(navigator, "canShare", { value: undefined });
    window.open = (u) => { window.__open = u; };
  }, [JAM, LANG]);
  await ctx.route(/karsawave\.github\.io/, (r) => {
    const u = new URL(r.request().url()).pathname.replace(/^\/lucky-seat\/?/, "") || "index.html";
    r.fulfill({ status: 200, contentType: (TIPE[u.split(".").pop()] || "application/octet-stream") + "; charset=utf-8", body: fs.readFileSync(path.join(PUB, u)) });
  });
  await ctx.route(/docs\.google\.com/, (r) => {
    const u = decodeURIComponent(r.request().url());
    const f = /Anggota|Members/.test(u) ? "Members-ID.csv" : "Settings-ID.csv";
    r.fulfill({ status: 200, contentType: "text/csv", body: fs.readFileSync(path.join(TPL, f), "utf8").replace("Subjudul,DTPSD", "Subjudul," + TIM) });
  });

  const pg = await ctx.newPage();
  await pg.goto(SITUS + "?s=" + ID);
  await pg.waitForSelector("#nama option:nth-child(3)", { state: "attached" });
  await pg.evaluate(() => document.fonts.ready);
  const kotak = (s) => pg.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }, s);
  const tk = await kotak(".ticket");
  const atas = { x: 0, y: 0, width: 412, height: Math.ceil(tk.y + tk.h + 10) };
  const meta = { lang: LANG, ticket: tk, sel: await kotak("#nama") };
  const foto = (n) => pg.screenshot({ path: path.join(OUT, n + ".png"), clip: atas });

  await foto("t0");
  await pg.selectOption("#nama", NAMA);
  await pg.waitForTimeout(200);
  meta.btn = await kotak("#btnDraw");
  await foto("t1");
  await pg.click("#btnDraw");
  await pg.waitForTimeout(1500);
  meta.final = await pg.evaluate(() => document.getElementById("num").textContent);
  meta.num = await kotak("#num");
  // Gulungan seperti animasi aplikasi: 15 angka acak (urutan tetap agar bisa diulang)
  for (let i = 0; i < 15; i++) {
    await pg.evaluate((i) => { const n = document.getElementById("num"); n.classList.remove("pop"); n.textContent = String(1 + ((i * 7 + 3) % 24)).padStart(2, "0"); }, i);
    await foto("r" + String(i).padStart(2, "0"));
  }
  await pg.evaluate((f) => { document.getElementById("num").textContent = f; }, meta.final);
  await foto("t2");

  const [dl] = await Promise.all([pg.waitForEvent("download"), pg.click("#btnDl")]);
  await dl.saveAs(path.join(OUT, "daftar.jpg"));
  await pg.click("#btnShare");
  await pg.waitForTimeout(500);
  meta.wa = decodeURIComponent(((await pg.evaluate(() => window.__open || "")).split("text=")[1]) || "");

  fs.writeFileSync(path.join(OUT, "meta.js"), "window.META=" + JSON.stringify(meta) + ";\n");
  console.log(LANG, "kursi", NAMA + ":", meta.final, "→", OUT);
  await b.close();
})();
