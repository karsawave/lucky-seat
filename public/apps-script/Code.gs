/**
 * LUCKY SEAT: server undian (Google Apps Script)
 * Sheet tetap PRIVAT. Script ini satu-satunya pintu keluar data, dan hanya mengirim:
 *   - pengaturan tampilan (judul, subjudul, jam, hari kerja)
 *   - NAMA DEPAN + inisial kata kedua anggota + nomor kursi, hanya untuk hari yang SUDAH dibuka
 * Tidak pernah dikirim: nama lengkap, kolom lain, kunci acak, hasil hari yang belum dibuka.
 *
 * EN: Draw server for Lucky Seat. The sheet stays PRIVATE; this script only returns display
 * settings plus FIRST NAMES (with the initial of the second word) and seat numbers for days that are already open.
 * Tabs: Anggota/Members (a "nama"/"name" column), Pengaturan/Settings (A = setting, B = value),
 * Riwayat (created & hidden automatically; results archive, do not edit).
 * Messages follow ?lang=id|en from the website, otherwise the "Bahasa/Language" setting.
 *
 * Tab yang dipakai:
 *   Anggota    : kolom berjudul "nama" (kolom lain boleh ada, TIDAK pernah dikirim)
 *   Pengaturan : kolom A nama pengaturan, kolom B nilai
 *   Riwayat    : dibuat & disembunyikan otomatis. Arsip hasil (jangan diedit).
 */

// Versi API skrip ini (bilangan bulat). Naikkan HANYA bila isi Code.gs berubah dan admin perlu deploy ulang.
// Website meminta minimal CODE_GS_API (version.js); bila lebih kecil, admin melihat peringatan deploy ulang.
const API_VERSION = 7;
const TAB_ANGGOTA = 'Anggota';
const TAB_PENGATURAN = 'Pengaturan';
const TAB_RIWAYAT = 'Riwayat';
// Zona waktu resmi tim: diisi dari baris "Zona Waktu" di Pengaturan (default WIB).
let ZONA = 'Asia/Jakarta';
const ZONA_ID = { 'Asia/Jakarta': 'WIB', 'Asia/Pontianak': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };
const HARI = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const ALIAS = { title: 'judul', subtitle: 'subjudul', team: 'subjudul', drawtime: 'jamundian', time: 'jamundian',
  timezone: 'zonawaktu', drawmode: 'caraambil', mode: 'caraambil', fixedseats: 'kursitetap', startdate: 'tanggalmulai',
  start: 'tanggalmulai', workdays: 'harikerja', seats: 'jumlahkursi', numberofseats: 'jumlahkursi', key: 'kunci', language: 'bahasa', listopens: 'daftardibuka',
  skippedseats: 'kursidilewati', skipseats: 'kursidilewati' };
// Bahasa pesan: ?lang= dari website, lalu baris "Bahasa" di Pengaturan, default English.
let LANG = '';
const PESAN = {
  "id": {
    "fileBlocked": "Halaman dibuka langsung dari file, jadi browser memblokir {src}. Buka lewat GitHub Pages atau server lokal (npx serve).",
    "sheetNoNet": "Tidak bisa membaca Google Sheet. Cek internet dan pastikan sheet dibagikan \"Siapa saja yang memiliki link\".",
    "sheetNotShared": "Google Sheet belum bisa dibaca. Bagikan sheet: \"Siapa saja yang memiliki link\" sebagai Pelihat, dan pastikan ada tab \"Anggota\".",
    "membersEmpty": "Tab \"Anggota\" kosong atau tidak punya kolom \"nama\".",
    "dupNames": "Ada {n} nama ganda di tab Anggota. Setiap nama harus unik.",
    "tooFewSeats": "Anggota {a} orang, kursi hanya {n}. Perbesar \"Jumlah Kursi\".",
    "startEmpty": "Isi \"Tanggal Mulai\" di tab Pengaturan (mis. 2026-11-09).",
    "zoneUnknown": "\"Zona Waktu\" tidak dikenal: \"{x}\". Contoh: Asia/Jakarta, Asia/Makassar, atau +7.",
    "fixedUnreadable": "\"Kursi Tetap\" tidak terbaca: \"{x}\". Contoh: Vina: 3",
    "fixedUnknown": "Kursi Tetap: nama \"{nama}\" tidak ada di tab Anggota.",
    "fixedConflict": "Kursi tetap {nama} berbeda di tab Anggota ({a}) dan Pengaturan ({b}).",
    "fixedTooHigh": "Kursi tetap {no} ({nama}) melebihi jumlah kursi {n}.",
    "fixedDup": "Kursi tetap {no} dipakai dua orang ({a} & {b}).",
    "fixedSkipped": "Kursi tetap {no} ({nama}) ada di \"Kursi Dilewati\".",
    "skipUnreadable": "\"Kursi Dilewati\" tidak terbaca: \"{x}\". Contoh: 5, 9, 12-14",
    "skipTooHigh": "Kursi dilewati {no} melebihi jumlah kursi {n}.",
    "tooFewFree": "Anggota {a} orang, kursi yang diundi hanya {n} ({x} dilewati). Perbesar \"Jumlah Kursi\" atau kurangi \"Kursi Dilewati\".",
    "scriptNoNet": "Tidak bisa terhubung. Cek internet, atau pastikan Web App di-deploy dengan akses \"Siapa saja\".",
    "scriptNoData": "Server tidak memberi data. Pastikan link Web App benar & akses \"Siapa saja\".",
    "serverError": "Terjadi kesalahan di server."
  },
  "en": {
    "fileBlocked": "The page was opened directly from a file, so the browser blocks {src}. Open it via GitHub Pages or a local server (npx serve).",
    "sheetNoNet": "Can't read the Google Sheet. Check your internet and make sure the sheet is shared with \"Anyone with the link\".",
    "sheetNotShared": "The Google Sheet can't be read yet. Share it with \"Anyone with the link\" as Viewer, and make sure it has a \"Members\" (or \"Anggota\") tab.",
    "membersEmpty": "The \"Members\" tab is empty or has no \"name\" column.",
    "dupNames": "There are {n} duplicate names in the Members tab. Every name must be unique.",
    "tooFewSeats": "{a} members but only {n} seats. Increase \"Seats\".",
    "startEmpty": "Fill in \"Start Date\" in the Settings tab (e.g. 2026-11-09).",
    "zoneUnknown": "Unknown \"Time Zone\": \"{x}\". Examples: Asia/Jakarta, Asia/Makassar, or +7.",
    "fixedUnreadable": "Can't read \"Fixed Seats\": \"{x}\". Example: Vina: 3",
    "fixedUnknown": "Fixed Seats: name \"{nama}\" is not in the Members tab.",
    "fixedConflict": "Fixed seat for {nama} differs between the Members tab ({a}) and Settings ({b}).",
    "fixedTooHigh": "Fixed seat {no} ({nama}) is higher than the number of seats {n}.",
    "fixedDup": "Fixed seat {no} is used by two people ({a} & {b}).",
    "fixedSkipped": "Fixed seat {no} ({nama}) is in \"Skipped Seats\".",
    "skipUnreadable": "Can't read \"Skipped Seats\": \"{x}\". Example: 5, 9, 12-14",
    "skipTooHigh": "Skipped seat {no} is higher than the number of seats {n}.",
    "tooFewFree": "{a} members but only {n} seats to draw ({x} skipped). Increase \"Seats\" or remove some \"Skipped Seats\".",
    "scriptNoNet": "Can't connect. Check your internet, or make sure the Web App is deployed with access \"Anyone\".",
    "scriptNoData": "The server returned no data. Make sure the Web App link is right and access is \"Anyone\".",
    "serverError": "Something went wrong on the server."
  }
};
function E(k, v) {
  v = v || {};
  const p = PESAN[LANG] || PESAN.en;
  return new Error(p[k].replace(/\{(\w+)\}/g, (_, x) => (v[x] == null ? '' : v[x])));
}
const GELAR = /^(ir|dr|drs|dra|h|hj|prof|st|s\.?t|mr|mrs|ms|bpk|bapak|ibu|bu|pak)\.?$/i;

function doGet(e) {
  let out;
  const p = (e && e.parameter) || {};
  LANG = p.lang === 'en' || p.lang === 'id' ? p.lang : '';
  try { out = handle(p); }
  catch (err) { out = { ok: false, error: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Jalankan sekali dari editor (tombol Run) untuk memberi izin & mengecek isi sheet.
function cekPengaturan() {
  const r = handle({});
  Logger.log(JSON.stringify(r, null, 2));
}

function handle(p) {
  const S = pengaturan();
  const ikut = bacaAnggota().filter((a) => !a.abai);
  const anggota = ikut.map((a) => a.nama);
  if (!anggota.length) throw E('membersEmpty');
  const ganda = anggota.filter((n, i) => anggota.indexOf(n) !== i);
  if (ganda.length) throw E('dupNames', { n: ganda.length });
  const lewat = S.kursiLewat, N = aturKursi(S.jumlahKursi, anggota.length, lewat);
  if (anggota.length > N) throw E('tooFewSeats', { a: anggota.length, n: N });
  const tetap = aturTetap(ikut, N, S.kursiTetap);
  Object.keys(tetap).forEach((a) => { if (lewat.indexOf(tetap[a]) >= 0) throw E('fixedSkipped', { no: tetap[a], nama: a }); });

  const now = new Date();
  const hariIni = fmt(now, 'yyyy-MM-dd');
  const menitSkrg = +fmt(now, 'H') * 60 + +fmt(now, 'm');
  const sudahBuka = menitSkrg >= S.jamUndian * 60 + S.menitUndian;
  const isKerja = (t) => S.hariKerja.indexOf(hariDari(t)) >= 0;
  const kerjaDekat = (t, arah) => { for (let i = 0; i < 14; i++) { t = geser(t, arah); if (isKerja(t)) return t; } return t; };

  let aktif = sudahBuka ? hariIni : geser(hariIni, -1);
  if (!isKerja(aktif)) aktif = kerjaDekat(aktif, -1);
  const berikut = kerjaDekat(aktif, 1);
  const bukaBerikutMs = msZona(berikut, S.jamUndian, S.menitUndian);

  // Tanggal yang diminta (default: hari aktif). Tidak bisa melewati hari aktif.
  let tgl = /^\d{4}-\d{2}-\d{2}$/.test(p.tgl || '') ? p.tgl : aktif;
  if (tgl < S.tanggalMulai) tgl = S.tanggalMulai;
  if (!isKerja(tgl)) tgl = kerjaDekat(tgl, -1);
  if (tgl > berikut) tgl = aktif;
  if (tgl < S.tanggalMulai) tgl = kerjaDekat(S.tanggalMulai, 1);

  const buka = tgl <= aktif && tgl >= S.tanggalMulai;
  let kursi = null;
  if (buka) {
    const peta = hasilHari(tgl, S, anggota, tetap, N, isKerja, kerjaDekat); // {namaLengkap: no}
    const nama = Object.keys(peta);
    const depan = namaDepan(nama.concat(anggota), petaPanggilan(ikut));
    const jumlah = Math.max(N, ...nama.map((n) => peta[n]));
    kursi = [];
    for (let i = 1; i <= jumlah; i++) kursi.push(lewat.indexOf(i) >= 0 ? { no: i, nama: null, lewat: true } : { no: i, nama: null });
    // Arsip lama boleh berisi nama di kursi yang kini dilewati: nama menang.
    nama.forEach((n) => { const k = kursi[peta[n] - 1]; k.nama = depan[n]; delete k.lewat; if (tetap[n] === peta[n]) k.tetap = true; });
  }

  let nomor = 0;
  for (let t = S.tanggalMulai; t <= tgl; t = geser(t, 1)) if (isKerja(t)) nomor++;
  const prev = kerjaDekat(tgl, -1);

  return {
    ok: true,
    info: {
      judul: S.judul, subjudul: S.subjudul, jamUndian: S.jamUndian, menitUndian: S.menitUndian, caraAmbil: S.caraAmbil, bahasa: S.bahasa,
      api: API_VERSION, hariIni: hariIni, aktif: aktif, bukaBerikutMs: bukaBerikutMs, serverMs: now.getTime(),
      zonaLabel: labelZona(new Date(bukaBerikutMs)), zonaOffset: offsetMenit(new Date(bukaBerikutMs)),
      anggota: Object.values(namaDepan(anggota, petaPanggilan(ikut))).sort(), jumlahKursi: N,
    },
    hari: { tgl: tgl, nomor: nomor, buka: buka, prev: prev >= S.tanggalMulai ? prev : null, next: tgl < aktif ? kerjaDekat(tgl, 1) : (tgl === aktif ? berikut : null), kursi: kursi,
      // Daftar Dibuka (mode Manual): saat daftar lengkap terbuka untuk semua orang. null = tidak diatur.
      daftarBukaMs: S.jamDaftar == null ? null : msZona(tgl, S.jamDaftar, S.menitDaftar) },
  };
}

// ---------- Hasil per hari (diarsipkan permanen di tab Riwayat) ----------
function hasilHari(tgl, S, anggota, tetap, N, isKerja, kerjaDekat) {
  const sh = tabRiwayat();
  const arsip = {};
  const vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues() : [];
  vals.forEach((r) => { const t = r[0] instanceof Date ? fmt(r[0], 'yyyy-MM-dd') : String(r[0]); if (t) arsip[t] = JSON.parse(r[1]); });
  if (arsip[tgl]) return arsip[tgl];

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // hitung semua hari kerja yang belum diarsip, berurutan, sampai tgl
    const baru = [];
    let prev = null;
    for (let t = S.tanggalMulai; t <= tgl; t = geser(t, 1)) {
      if (!isKerja(t)) continue;
      if (!arsip[t]) {
        arsip[t] = undi(t, S.kunci, anggota, tetap, N, prev, S.kursiLewat);
        baru.push(["'" + t, JSON.stringify(arsip[t])]);
      }
      prev = arsip[t];
    }
    if (baru.length) sh.getRange(sh.getLastRow() + 1, 1, baru.length, 2).setValues(baru);
  } finally { lock.releaseLock(); }
  return arsip[tgl];
}

function undi(tgl, kunci, anggota, tetap, N, prev, lewat) {
  const terpakai = Object.keys(tetap).map((a) => tetap[a]).concat(lewat || []);
  const pool = []; for (let i = 1; i <= N; i++) if (terpakai.indexOf(i) < 0) pool.push(i);
  const acak = anggota.filter((a) => !tetap[a]);
  let best = null, skorBest = Infinity;
  for (let n = 0; n < 60 && skorBest > 0; n++) {
    const k = shuffle(pool, kunci + '|' + tgl + '|' + n);
    const skor = prev ? acak.filter((a, i) => prev[a] === k[i]).length : 0;
    if (skor < skorBest) { best = k; skorBest = skor; }
  }
  const peta = {};
  acak.forEach((a, i) => (peta[a] = best[i]));
  Object.keys(tetap).forEach((a) => (peta[a] = tetap[a]));
  return peta;
}

// ---------- Data sheet ----------
function bacaAnggota() {
  const sh = SpreadsheetApp.getActive().getSheetByName(TAB_ANGGOTA) || SpreadsheetApp.getActive().getSheetByName('Members');
  if (!sh || sh.getLastRow() < 1) return [];
  const v = sh.getDataRange().getDisplayValues();
  let col = v[0].findIndex((h) => /^(nama|name)$/i.test(String(h).trim()));
  const rows = col >= 0 ? v.slice(1) : v;
  if (col < 0) col = 0;
  // Kolom opsional "abaikan": kosong = ikut diacak, angka = kursi tetap, isi lain (Ya) = tidak ikut.
  const ab = v[0].findIndex((h) => /^(abaikan|ignore)$/i.test(String(h).trim()));
  // Kolom opsional "panggilan": bila diisi, nama ini yang tampil (nama asli tidak keluar sama sekali).
  const pg = v[0].findIndex((h) => /^(panggilan|nama panggilan|nickname|nick)$/i.test(String(h).trim()));
  return rows.map((r) => {
    const nama = String(r[col]).trim().replace(/\s+/g, ' ');
    const x = ab >= 0 && rows !== v ? String(r[ab]).trim() : '';
    const panggilan = pg >= 0 && rows !== v ? String(r[pg]).trim().replace(/\s+/g, ' ') : '';
    return { nama: nama, panggilan: panggilan, tetap: /^\d+$/.test(x) && +x > 0 ? +x : 0, abai: !!x && !/^(\d+|tidak|no|n|-)$/i.test(x) };
  }).filter((a) => a.nama);
}

// "Vina: 3, Budi 12" → [{nama:'Vina', no:3}, ...]. Pemisah nama–nomor: : = - atau spasi.
function bacaTetap(s) {
  return s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const m = x.match(/^(.+?)[\s:=-]+0*(\d+)$/);
    if (!m) throw E('fixedUnreadable', { x: x });
    return { nama: m[1].trim(), no: +m[2] };
  });
}

// "5, 9, 12-14" → [5, 9, 12, 13, 14]: nomor kursi yang tidak ikut diundi (selalu kosong).
function bacaLewat(s) {
  const out = [];
  s.replace(/\s*[-–]\s*/g, '-').split(/[,;\s]+/).filter(Boolean).forEach((x) => {
    const m = x.match(/^0*(\d+)(?:-0*(\d+))?$/);
    if (!m) throw E('skipUnreadable', { x: x });
    const a = Math.min(+m[1], +(m[2] || m[1])), b = Math.min(Math.max(+m[1], +(m[2] || m[1])), a + 999);
    for (let i = a; i <= b; i++) if (i > 0 && out.indexOf(i) < 0) out.push(i);
  });
  return out.sort((a, b) => a - b);
}

// Jumlah kursi + validasi Kursi Dilewati. Tanpa "Jumlah Kursi": kursi secukupnya untuk semua anggota.
function aturKursi(jumlah, a, lewat) {
  let N = jumlah || a;
  if (!jumlah) while (N - lewat.filter((no) => no <= N).length < a) N++;
  lewat.forEach((no) => { if (no > N) throw E('skipTooHigh', { no: no, n: N }); });
  if (lewat.length && a > N - lewat.length) throw E('tooFewFree', { a: a, n: N - lewat.length, x: lewat.length });
  return N;
}

function aturTetap(list, N, dariPengaturan) {
  const tunggal = (x) => (x.length === 1 ? x[0] : null);
  const tetap = {}, dipakai = {};
  const depan = namaDepan(list.map((a) => a.nama), petaPanggilan(list));
  (dariPengaturan || []).forEach((t) => {
    const cari = t.nama.toLowerCase();
    const a = list.find((x) => x.nama.toLowerCase() === cari) || list.find((x) => depan[x.nama].toLowerCase() === cari)
      || tunggal(list.filter((x) => depan[x.nama].split(" ")[0].toLowerCase() === cari)); // "Vina: 3" tetap cocok dengan "Vina M."
    if (!a) throw E('fixedUnknown', { nama: t.nama });
    if (a.tetap && a.tetap !== t.no) throw E('fixedConflict', { nama: a.nama, a: a.tetap, b: t.no });
    a.tetap = t.no;
  });
  list.forEach((a) => {
    if (!a.tetap) return;
    if (a.tetap > N) throw E('fixedTooHigh', { no: a.tetap, nama: a.nama, n: N });
    if (dipakai[a.tetap]) throw E('fixedDup', { no: a.tetap, a: dipakai[a.tetap], b: a.nama });
    dipakai[a.tetap] = a.nama; tetap[a.nama] = a.tetap;
  });
  return tetap;
}

function pengaturan() {
  const S = { judul: 'Lucky Seat', subjudul: '', jamUndian: 7, menitUndian: 0, tanggalMulai: '', hariKerja: [1, 2, 3, 4, 5], jumlahKursi: 0, caraAmbil: 'manual', kursiTetap: [], kursiLewat: [], bahasa: '', jamDaftar: null, menitDaftar: 0 };
  const sh = SpreadsheetApp.getActive().getSheetByName(TAB_PENGATURAN) || SpreadsheetApp.getActive().getSheetByName('Settings');
  if (sh && sh.getLastRow() >= 1) {
    const vals = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
    vals.forEach((r) => {
      const k0 = String(r[0]).toLowerCase().replace(/[^a-z]/g, ''), k = ALIAS[k0] || k0, v = r[1];
      if (v === '' || v == null) return;
      const s = String(v).trim().replace(/^'/, '');
      if (k === 'judul') S.judul = s;
      else if (k === 'subjudul' || k === 'tim') S.subjudul = s;
      else if (k === 'jamundian' || k === 'jam') {
        if (v instanceof Date) { S.jamUndian = +fmtSel(v, 'H'); S.menitUndian = +fmtSel(v, 'm'); }
        else { const j = s.split(/[.:]/); S.jamUndian = +j[0] || 0; S.menitUndian = +j[1] || 0; }
      } else if (k === 'tanggalmulai' || k === 'mulai') {
        if (v instanceof Date) S.tanggalMulai = fmtSel(v, 'yyyy-MM-dd');
        else {
          let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (m) S.tanggalMulai = m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
          else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) S.tanggalMulai = m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
        }
      } else if (k === 'harikerja') {
        const h = s.toLowerCase().replace(/'/g, '').split(/[,;\s]+/).filter(Boolean)
          .map((x) => (/^\d$/.test(x) ? +x : HARI[x])).filter((x) => x >= 0);
        if (h.length) S.hariKerja = h;
      } else if (k === 'jumlahkursi' || k === 'kursi') S.jumlahKursi = parseInt(s, 10) || 0;
      else if (k === 'caraambil' || k === 'ambil') S.caraAmbil = /oto|auto/i.test(s) ? 'otomatis' : 'manual';
      else if (k === 'kursitetap' || k === 'tetap') S.kursiTetap = bacaTetap(s);
      else if (k === 'kursidilewati' || k === 'dilewati') S.kursiLewat = bacaLewat(s);
      else if (k === 'daftardibuka') {
        if (v instanceof Date) { S.jamDaftar = +fmtSel(v, 'H'); S.menitDaftar = +fmtSel(v, 'm'); }
        else { const j = s.split(/[.:]/); S.jamDaftar = +j[0] || 0; S.menitDaftar = +j[1] || 0; }
      }
      else if (k === 'zonawaktu' || k === 'zona') S.zona = s;
      else if (k === 'bahasa') S.bahasa = /^(id|ind|indonesia|bahasa)/i.test(s) ? 'id' : 'en';
    });
  }
  if (!LANG && S.bahasa) LANG = S.bahasa;
  if (!S.tanggalMulai) throw E('startEmpty');
  ZONA = bacaZona(S.zona || 'Asia/Jakarta');
  // Kunci acak dibuat otomatis & disimpan di server (Script Properties), tidak ada di sheet.
  const props = PropertiesService.getScriptProperties();
  S.kunci = props.getProperty('KUNCI');
  if (!S.kunci) { S.kunci = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('KUNCI', S.kunci); }
  return S;
}

function tabRiwayat() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(TAB_RIWAYAT);
  if (!sh) {
    sh = ss.insertSheet(TAB_RIWAYAT);
    sh.getRange(1, 1, 1, 2).setValues([['tanggal / date', 'hasil / result (JANGAN DIEDIT / DO NOT EDIT)']]);
    sh.hideSheet();
  }
  return sh;
}

// ---------- Nama depan (unik) ----------
// { namaLengkap: panggilan } untuk anggota yang kolom panggilannya diisi.
function petaPanggilan(list) { const p = {}; list.forEach((a) => { if (a.panggilan) p[a.nama] = a.panggilan; }); return p; }

function namaDepan(list, pgl) {
  pgl = pgl || {};
  const uniq = list.filter((n, i) => list.indexOf(n) === i);
  // Gelar dibuang; inisial di depan ("R. Andi", "M Rizky") dilewati selama masih ada kata lain.
  const kata = (n) => { const k = n.split(' ').filter((w) => !GELAR.test(w)); while (k.length > 1 && /^[a-z]\.?$/i.test(k[0])) k.shift(); return k; };
  const out = {};
  // Nama depan + inisial tiap kata berikutnya: "Ahmad Rofiq" → "Ahmad R.", "Ahmad Rofiq Hidayat" → "Ahmad R. H.".
  // len = panjang singkatan kata kedua (diperpanjang bila bentrok: "Budi Sa." / "Budi Se.").
  const susun = (k, len) => [k[0]].concat(k.slice(1).map((w, i) => w[0].toUpperCase() + (i ? '' : w.slice(1, len).toLowerCase()) + '.')).join(' ');
  uniq.forEach((n) => { const k = kata(n); out[n] = pgl[n] || (k.length ? susun(k, 1) : n); });
  const hitung = (o) => { const c = {}; Object.values(o).forEach((v) => (c[v] = (c[v] || 0) + 1)); return c; };
  for (let len = 1; len <= 3; len++) {
    const c = hitung(out);
    uniq.forEach((n) => {
      const k = kata(n);
      if (c[out[n]] > 1 && k[1] && !pgl[n]) out[n] = susun(k, len);
    });
  }
  const c = hitung(out);
  const urut = {};
  uniq.forEach((n) => { if (c[out[n]] > 1) { urut[out[n]] = (urut[out[n]] || 0) + 1; out[n] = out[n] + ' ' + urut[out[n]]; } });
  return out;
}

// ---------- Util ----------
function fmt(d, f) { return Utilities.formatDate(d, ZONA, f); }
function fmtSel(d, f) { return Utilities.formatDate(d, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), f); }
// "Asia/Jakarta" (IANA) atau offset "+7" / "UTC+8" / "GMT-5:30" → zona untuk Utilities.formatDate.
function bacaZona(s) {
  const m = String(s).replace(/\s/g, '').match(/^(?:utc|gmt)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (m && +m[2] <= 14) return 'GMT' + m[1] + pad(m[2]) + ':' + pad(m[3] || 0);
  try { new Intl.DateTimeFormat('en', { timeZone: s }); return s; } catch (e) {}
  throw E('zoneUnknown', { x: s });
}
function offsetMenit(d) { const z = Utilities.formatDate(d, ZONA, 'Z'); return (z[0] === '-' ? -1 : 1) * (+z.slice(1, 3) * 60 + +z.slice(3, 5)); }
// Tanggal + jam dinding di zona tim → milidetik UTC (dua putaran agar tepat di sekitar DST).
function msZona(tgl, jam, menit) {
  const dinding = parseTgl(tgl).getTime() + (jam * 60 + menit) * 60000;
  const ms = dinding - offsetMenit(new Date(dinding)) * 60000;
  return dinding - offsetMenit(new Date(ms)) * 60000;
}
function labelZona(d) {
  if (ZONA_ID[ZONA]) return ZONA_ID[ZONA];
  const o = offsetMenit(d), a = Math.abs(o);
  return /^GMT/.test(ZONA) ? 'UTC' + (o < 0 ? '-' : '+') + Math.floor(a / 60) + (a % 60 ? ':' + pad(a % 60) : '') : Utilities.formatDate(d, ZONA, 'z');
}
function pad(x) { return String(x).padStart(2, '0'); }
function parseTgl(s) { return new Date(s + 'T00:00:00Z'); }
function geser(s, n) { return new Date(parseTgl(s).getTime() + n * 86400000).toISOString().slice(0, 10); }
function hariDari(s) { return parseTgl(s).getUTCDay(); }

function hash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0);
}
function shuffle(arr, seed) {
  let a = hash(seed) >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const x = arr.slice();
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = x[i]; x[i] = x[j]; x[j] = t; }
  return x;
}
