// Uji kesamaan undian: sheet.js (Opsi 1, browser) vs apps-script/Code.gs (Opsi 2, server).
// Logika undian ada di dua tempat; tes ini memastikan keduanya memberi hasil yang SAMA PERSIS
// untuk sheet, tanggal, dan "jam sekarang" yang sama. Tanpa dependensi: `npm test` / `node --test tests/`.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const SRC = {
  sheet: fs.readFileSync(path.join(ROOT, "public", "assets", "js", "sheet.js"), "utf8"),
  gs: fs.readFileSync(path.join(ROOT, "public", "apps-script", "Code.gs"), "utf8"),
  version: fs.readFileSync(path.join(ROOT, "public", "assets", "js", "version.js"), "utf8"),
};

// ---------- "Sekarang" yang dikunci ----------
function fixedDate(nowMs) {
  return class FixedDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(nowMs); }
    static now() { return nowMs; }
  };
}

// ---------- Stub Utilities.formatDate (format yang dipakai Code.gs) ----------
function zonaParts(d, zone) {
  const g = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zone);
  let off;
  if (g) off = (g[1] === "-" ? -1 : 1) * (+g[2] * 60 + +g[3]);
  else {
    const p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(d).forEach((x) => (p[x.type] = +x.value));
    off = Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(d.getTime() / 60000) * 60000) / 60000);
  }
  const w = new Date(d.getTime() + off * 60000);
  return { y: w.getUTCFullYear(), M: w.getUTCMonth() + 1, d: w.getUTCDate(), H: w.getUTCHours(), m: w.getUTCMinutes(), off };
}
const p2 = (x) => String(x).padStart(2, "0");
function formatDate(d, zone, f) {
  const z = zonaParts(d, zone);
  if (f === "yyyy-MM-dd") return `${z.y}-${p2(z.M)}-${p2(z.d)}`;
  if (f === "H") return String(z.H);
  if (f === "m") return String(z.m);
  if (f === "Z") { const a = Math.abs(z.off); return (z.off < 0 ? "-" : "+") + p2(Math.floor(a / 60)) + p2(a % 60); }
  if (f === "z") return zone;
  throw new Error("format belum didukung stub: " + f);
}

// ---------- Opsi 2: jalankan Code.gs dengan stub Apps Script ----------
function jalankanGs(fx, nowMs) {
  const tabs = {
    [fx.tabAnggota]: fx.anggota,
    [fx.tabPengaturan]: fx.pengaturan,
  };
  const sheet = (rows) => ({
    getLastRow: () => rows.length,
    getDataRange: () => ({ getDisplayValues: () => rows.map((r) => r.map(String)) }),
    getRange: (r, c, nr, nc) => ({
      getValues: () => rows.slice(r - 1, r - 1 + nr).map((x) => Array.from({ length: nc }, (_, i) => (x[c - 1 + i] ?? ""))),
      // Sheets membuang petik pembuka ('2026-…) saat menyimpan teks.
      setValues: (v) => v.forEach((row, i) => (rows[r - 1 + i] = row.map((s) => (typeof s === "string" ? s.replace(/^'/, "") : s)))),
    }),
    hideSheet() {},
  });
  const sheets = {};
  const ss = {
    getSheetByName: (n) => sheets[n] || (tabs[n] ? (sheets[n] = sheet(tabs[n].map((r) => r.slice()))) : null),
    insertSheet: (n) => (sheets[n] = sheet([])),
    getSpreadsheetTimeZone: () => "Asia/Jakarta",
  };
  const ctx = vm.createContext({
    Date: fixedDate(nowMs), Intl,
    SpreadsheetApp: { getActive: () => ss },
    Utilities: { formatDate, getUuid: () => "uuid" },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => fx.kunci, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ setMimeType: () => s }) },
    Logger: { log() {} },
  });
  vm.runInContext(SRC.gs + "\n;this.__doGet = doGet; this.__API = API_VERSION;", ctx);
  return {
    api: ctx.__API,
    panggil: (tgl) => JSON.parse(ctx.__doGet({ parameter: { lang: "en", tgl: tgl || "" } })),
  };
}

// ---------- Opsi 1: jalankan sheet.js dengan fetch palsu ----------
const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
function jalankanSheet(fx, nowMs) {
  const isi = { [fx.tabAnggota]: csv(fx.anggota), [fx.tabPengaturan]: csv(fx.pengaturan) };
  const ctx = vm.createContext({
    Date: fixedDate(nowMs), Intl, console,
    location: { protocol: "https:" },
    fetch: async (url) => {
      const tab = new URL(url).searchParams.get("sheet");
      const t = isi[tab];
      return t == null ? { ok: false, text: async () => "<html>" } : { ok: true, text: async () => t };
    },
  });
  ctx.window = ctx;
  vm.runInContext(SRC.version, ctx);
  vm.runInContext(SRC.sheet, ctx);
  ctx.I18N = { lang: "en" };
  const id = "TEST_SHEET_ID_0123456789abcdef";
  return async (tgl) => {
    try { return JSON.parse(JSON.stringify(await ctx.SheetSumber.panggilSheet(id, tgl || ""))); }
    catch (e) { return { ok: false, error: e.message }; }
  };
}

// Bandingkan semua yang dilihat pengguna; abaikan serverMs (jam proses), api (hanya dari Code.gs)
// & urutan daftar nama.
function normal(r) {
  if (!r.ok) return r;
  const { serverMs, api, ...info } = r.info;
  info.anggota = [...info.anggota].sort();
  return { ok: true, info, hari: r.hari };
}

// ---------- Skenario ----------
const tgl = (s) => s;
const SKENARIO = [
  {
    nama: "kursi dilewati: rentang + kursi tetap, 12 kursi",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K-lewat",
    anggota: [["nama"], ["Andi Saputra"], ["Budi Santoso"], ["Citra Lestari"], ["Dewi Anggraini"], ["Eko Prasetyo"], ["Fajar Nugroho"], ["Gita Permata"], ["Hadi Wijaya"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-02"], ["Jumlah Kursi", "12"], ["Kursi Dilewati", "3, 7 - 9"], ["Kursi Tetap", "Andi: 1"], ["Kunci", "K-lewat"]],
  },
  {
    nama: "skipped seats tanpa Jumlah Kursi (EN)",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Members", tabPengaturan: "Settings", kunci: "K-skip",
    anggota: [["name"], ["Andi Saputra"], ["Budi Santoso"], ["Citra Lestari"], ["Dewi Anggraini"], ["Eko Prasetyo"]],
    pengaturan: [["setting", "value"], ["Start Date", "'2026-11-02"], ["Skipped Seats", "2;4"], ["Key", "K-skip"]],
  },
  {
    nama: "dasar: 8 anggota, 10 kursi, WIB, jam 07:00, sudah buka",
    sekarang: "2026-11-25T03:00:00Z", // 10:00 WIB, Rabu
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "Kunci-Rahasia-1",
    anggota: [["nama"], ["Andi Saputra"], ["Budi Santoso"], ["Citra Lestari"], ["Dewi Anggraini"], ["Eko Prasetyo"], ["Fajar Nugroho"], ["Gita Permata"], ["Hadi Wijaya"]],
    pengaturan: [["pengaturan", "nilai"], ["Judul", "Lucky Seat"], ["Subjudul", "Tim A"], ["Tanggal Mulai", tgl("'2026-11-02")],
      ["Hari Kerja", "Senin, Selasa, Rabu, Kamis, Jumat"], ["Jam Undian", "07:00"], ["Zona Waktu", "Asia/Jakarta"], ["Jumlah Kursi", "10"], ["Kunci", "Kunci-Rahasia-1"]],
  },
  {
    nama: "nama depan bentrok + gelar + kursi tetap + kolom abaikan, zona +8, hari kerja khusus",
    sekarang: "2026-11-27T00:30:00Z", // 08:30 (+8), Jumat, sebelum jam 09:30
    tabAnggota: "Members", tabPengaturan: "Settings", kunci: "Key-2",
    anggota: [["name", "ignore"], ["Budi Santoso", ""], ["Budi Setiawan", ""], ["Dr. Budi Sutanto", ""], ["Ir. Rina Kurnia", "3"],
      ["Vina Melati", ""], ["Wawan Hermawan", "Ya"], ["Yusuf Halim", ""], ["Zahra Putri", "-"]],
    pengaturan: [["setting", "value"], ["Title", "Seats"], ["Start Date", "'2026-11-03"], ["Workdays", "Monday, Wednesday, Friday"],
      ["Draw Time", "09:30"], ["Time Zone", "+8"], ["Seats", "9"], ["Fixed Seats", "Vina: 7"], ["Key", "Key-2"], ["Language", "English"]],
  },
  {
    nama: "Daftar Dibuka 09.30 (ID) di WITA",
    sekarang: "2026-11-25T01:00:00Z", // 09:00 WITA, Rabu
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K5",
    anggota: [["nama"], ["Andi"], ["Budi"], ["Citra"], ["Dewi"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-23"], ["Jam Undian", "07:00"], ["Zona Waktu", "Asia/Makassar"],
      ["Cara Ambil", "Manual"], ["Daftar Dibuka", "09.30"], ["Kunci", "K5"]],
  },
  {
    nama: "List Opens 16:00 (EN)",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Members", tabPengaturan: "Settings", kunci: "K6",
    anggota: [["name"], ["Andi"], ["Budi"], ["Citra"]],
    pengaturan: [["setting", "value"], ["Start Date", "'2026-11-23"], ["Draw Mode", "Manual"], ["List Opens", "16:00"], ["Key", "K6"]],
  },
  {
    nama: "inisial di depan dilewati, kata ke-2 dst. jadi inisial (R. Andi, Ahmad R. H.)",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K7",
    anggota: [["nama"], ["R. Andi Wijaya"], ["M Rizky"], ["Dr. A. Budi Santoso"], ["Siti R."], ["R."], ["Ahmad Rofiq Hidayat"], ["Dewi Ayu Sri Lestari"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-23"], ["Kunci", "K7"]],
  },
  {
    nama: "kolom panggilan: dipakai bila diisi, bentrok diberi nomor",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K8",
    anggota: [["nama", "panggilan"], ["Ahmad Rofiq Hidayat", "Opik"], ["Siti Aminah", ""], ["Budi Santoso", "Bebe"], ["Bayu Bramasta", "Bebe"], ["Joko Widodo", "Siti A."], ["Dewi Lestari", ""]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-23"], ["Kursi Tetap", "Opik: 1"], ["Kunci", "K8"]],
  },
  {
    nama: "akhir pekan: hari aktif = Jumat sebelumnya",
    sekarang: "2026-11-29T05:00:00Z", // Minggu
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K3",
    anggota: [["nama"], ["Satu"], ["Dua"], ["Tiga"], ["Empat"], ["Lima"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-16"], ["Jumlah Kursi", "5"], ["Kunci", "K3"], ["Jam Undian", "06:15"]],
  },
  {
    nama: "kursi terbatas: Adi {8,18,23-24} + Batasan Mulai, kursi tetap & dilewati",
    sekarang: "2026-12-09T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K-batas",
    anggota: [["nama"], ["Adi Nugroho"], ["Budi Santoso"], ["Citra Lestari"], ["Dewi Anggraini"], ["Eko Prasetyo"], ["Fajar Nugroho"],
      ["Gita Permata"], ["Hadi Wijaya"], ["Indah Sari"], ["Joko Susilo"], ["Kiki Amelia"], ["Lina Marlina"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-02"], ["Jumlah Kursi", "25"], ["Kursi Tetap", "Lina: 18"],
      ["Kursi Dilewati", "5"], ["Kursi Terbatas", "Adi {8,18,23-24}; Budi {8, 23}, Citra: {1-3}"], ["Batasan Mulai", "'2026-11-16"], ["Kunci", "K-batas"]],
  },
  {
    nama: "Limited Seats (EN) tanpa Limits Start",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Members", tabPengaturan: "Settings", kunci: "K-lim",
    anggota: [["name"], ["Andi"], ["Budi"], ["Citra"], ["Dewi"], ["Eko"]],
    pengaturan: [["setting", "value"], ["Start Date", "'2026-11-02"], ["Seats", "8"], ["Limited Seats", "Andi {7, 8}; Budi {8}"], ["Key", "K-lim"]],
  },
  {
    nama: "error: kursi terbatas tidak bisa dipenuhi",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K-mustahil",
    anggota: [["nama"], ["A"], ["B"], ["C"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-16"], ["Kursi Terbatas", "A {1}; B {1}"], ["Kunci", "K-mustahil"]],
  },
  {
    nama: "error: kursi kurang dari anggota (pesan sama)",
    sekarang: "2026-11-25T03:00:00Z",
    tabAnggota: "Anggota", tabPengaturan: "Pengaturan", kunci: "K4",
    anggota: [["nama"], ["A"], ["B"], ["C"]],
    pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-16"], ["Jumlah Kursi", "2"], ["Kunci", "K4"]],
  },
];

const tanggalUji = (mulai, sekarangMs) => {
  const out = [""];
  for (let t = Date.parse(mulai.replace(/^'/, "") + "T00:00:00Z") - 2 * 86400000; t <= sekarangMs + 4 * 86400000; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
};

test("CODE_GS_API di version.js sama dengan API_VERSION di Code.gs, dan dikirim di info.api", () => {
  const ctx = vm.createContext({}); ctx.window = ctx;
  vm.runInContext(SRC.version, ctx);
  const fx = SKENARIO[0], gs = jalankanGs(fx, Date.parse(fx.sekarang));
  assert.ok(Number.isInteger(gs.api) && gs.api >= 1, "API_VERSION harus bilangan bulat ≥ 1");
  assert.equal(gs.api, ctx.CODE_GS_API);
  assert.equal(gs.panggil("").info.api, gs.api);
});

test("Daftar Dibuka dihitung di zona tim; kosong = null", async () => {
  const fx = SKENARIO.find((s) => /WITA/.test(s.nama)), nowMs = Date.parse(fx.sekarang);
  const r = await jalankanSheet(fx, nowMs)("2026-11-25");
  assert.equal(new Date(r.hari.daftarBukaMs).toISOString(), "2026-11-25T01:30:00.000Z"); // 09.30 WITA
  const dasar = SKENARIO[0];
  assert.equal(jalankanGs(dasar, Date.parse(dasar.sekarang)).panggil("").hari.daftarBukaMs, null);
});

test("nama depan + inisial tiap kata berikutnya", async () => {
  const fx = SKENARIO.find((s) => /inisial/.test(s.nama));
  const r = await jalankanSheet(fx, Date.parse(fx.sekarang))("");
  assert.deepEqual([...r.info.anggota].sort(), ["Ahmad R. H.", "Andi W.", "Budi S.", "Dewi A. S. L.", "R.", "Rizky", "Siti R."]);
});

test("kolom panggilan menggantikan nama asli", async () => {
  const fx = SKENARIO.find((s) => /panggilan/.test(s.nama));
  const r = await jalankanSheet(fx, Date.parse(fx.sekarang))("");
  assert.deepEqual([...r.info.anggota].sort(), ["Bebe 1", "Bebe 2", "Dewi L.", "Opik", "Siti A.", "Siti Am."]);
  assert.equal(r.hari.kursi[0].nama, "Opik"); // Kursi Tetap boleh memakai nama panggilan
  assert.ok(!JSON.stringify(r).includes("Rofiq"), "nama asli tidak boleh keluar");
});

test("Kursi Dilewati selalu kosong dan ditandai", async () => {
  const fx = SKENARIO.find((s) => /rentang/.test(s.nama));
  const r = await jalankanSheet(fx, Date.parse(fx.sekarang))("");
  assert.deepEqual(r.hari.kursi.filter((k) => k.lewat).map((k) => k.no), [3, 7, 8, 9]);
  assert.ok(r.hari.kursi.filter((k) => k.lewat).every((k) => !k.nama));
  const en = SKENARIO.find((s) => /Skipped/i.test(s.nama));
  const r2 = await jalankanSheet(en, Date.parse(en.sekarang))("");
  assert.equal(r2.info.jumlahKursi, 7); // 5 anggota + 2 kursi dilewati
  assert.deepEqual(r2.hari.kursi.filter((k) => k.lewat).map((k) => k.no), [2, 4]);
});

test("Kursi Terbatas: hanya di kursi yang diizinkan, sejak Batasan Mulai", async () => {
  const fx = SKENARIO.find((s) => /Adi \{8/.test(s.nama)), nowMs = Date.parse(fx.sekarang);
  const sheet = jalankanSheet(fx, nowMs);
  const izin = { "Adi N.": [8, 23, 24], "Budi S.": [8, 23], "Citra L.": [1, 2, 3] }; // 18 = kursi tetap Lina
  for (let t = Date.parse("2026-11-16T00:00:00Z"); t <= Date.parse("2026-12-09T00:00:00Z"); t += 86400000) {
    const r = await sheet(new Date(t).toISOString().slice(0, 10));
    if (!r.hari.buka) continue;
    for (const [nama, no] of Object.entries(izin)) assert.ok(no.includes(r.hari.kursi.find((k) => k.nama === nama).no), `${nama} ${r.hari.tgl}`);
  }
});

test("Kursi Terbatas tidak mengubah hari sebelum Batasan Mulai", async () => {
  const fx = SKENARIO.find((s) => /Adi \{8/.test(s.nama)), nowMs = Date.parse(fx.sekarang);
  const tanpa = { ...fx, pengaturan: fx.pengaturan.filter((r) => !/terbatas|batasan/i.test(r[0])) };
  const a = jalankanSheet(fx, nowMs), b = jalankanSheet(tanpa, nowMs);
  for (const t of ["2026-11-02", "2026-11-06", "2026-11-13"]) assert.deepEqual((await a(t)).hari, (await b(t)).hari, t);
  assert.notDeepEqual((await a("2026-12-09")).hari, (await b("2026-12-09")).hari);
});

test("Kursi Terbatas: pesan error", async () => {
  const fx = SKENARIO.find((s) => /dipenuhi/.test(s.nama));
  const r = await jalankanSheet(fx, Date.parse(fx.sekarang))("");
  assert.match(r.error, /always taken/);
  const salah = (nilai) => ({ ...fx, pengaturan: [["pengaturan", "nilai"], ["Tanggal Mulai", "'2026-11-16"], ["Kursi Terbatas", nilai]] });
  const cek = async (nilai, re) => assert.match((await jalankanSheet(salah(nilai), Date.parse(fx.sekarang))("")).error, re, nilai);
  await cek("Zed {1}", /not in the Members/);
  await cek("A {9}", /higher than/);
  await cek("A 1, 2", /Can't read/);
  await cek("A {x}", /Can't read/);
});

for (const fx of SKENARIO) {
  test(`sheet.js = Code.gs · ${fx.nama}`, async () => {
    const nowMs = Date.parse(fx.sekarang);
    const sheet = jalankanSheet(fx, nowMs);
    const gs = jalankanGs(fx, nowMs);
    const mulai = fx.pengaturan.find((r) => /mulai|start/i.test(r[0]))[1];
    for (const t of tanggalUji(mulai, nowMs)) {
      const a = normal(await sheet(t)), b = normal(gs.panggil(t));
      assert.deepEqual(a, b, `berbeda untuk tgl="${t}"`);
    }
  });
}
