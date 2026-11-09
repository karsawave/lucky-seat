// OPSI 1: baca Google Sheet langsung (sheet dibagikan "Siapa saja yang memiliki link = Pelihat").
// Pengundian dihitung di browser, hasilnya berbentuk sama persis dengan Apps Script (opsi 2).
// Hanya nama depan yang ditampilkan.
(function () {
  const HARI = { minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const ALIAS = { title: "judul", subtitle: "subjudul", team: "subjudul", drawtime: "jamundian", time: "jamundian",
    timezone: "zonawaktu", drawmode: "caraambil", mode: "caraambil", fixedseats: "kursitetap", startdate: "tanggalmulai",
    start: "tanggalmulai", workdays: "harikerja", seats: "jumlahkursi", numberofseats: "jumlahkursi", key: "kunci", language: "bahasa" };
  const GELAR = /^(ir|dr|drs|dra|h|hj|prof|st|mr|mrs|ms|bpk|bapak|ibu|bu|pak)\.?$/i;
  const DAY = 86400000;
  // Pesan error ID/EN (isi sama dengan apps-script/Code.gs). Bahasa mengikuti pilihan di halaman.
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
      "scriptNoNet": "Can't connect. Check your internet, or make sure the Web App is deployed with access \"Anyone\".",
      "scriptNoData": "The server returned no data. Make sure the Web App link is right and access is \"Anyone\".",
      "serverError": "Something went wrong on the server."
    }
  };
  const E = (k, v = {}) => {
    const l = (window.I18N && window.I18N.lang) || "en";
    return new Error((PESAN[l] || PESAN.en)[k].replace(/\{(\w+)\}/g, (_, x) => v[x] ?? ""));
  };
  const pad = (x) => String(x).padStart(2, "0");
  const parseTgl = (s) => new Date(s + "T00:00:00Z");
  const geser = (s, n) => new Date(parseTgl(s).getTime() + n * DAY).toISOString().slice(0, 10);
  const hariDari = (s) => parseTgl(s).getUTCDay();

  // ---------- Zona waktu resmi tim ----------
  // Nilai "Zona Waktu": nama IANA (Asia/Jakarta, Europe/London, …) atau offset (+7, UTC+8, GMT-5:30).
  // Dihitung dengan Intl → ikut aturan musim panas (DST) bila ada.
  const ZONA_ID = { "Asia/Jakarta": "WIB", "Asia/Pontianak": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" };
  function bacaZona(s) {
    const m = s.replace(/\s/g, "").match(/^(?:utc|gmt)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (m) {
      const off = (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + (+m[3] || 0));
      if (Math.abs(off) <= 14 * 60) return { off };
    } else {
      try { new Intl.DateTimeFormat("en", { timeZone: s }); return { tz: s }; } catch {}
    }
    throw E("zoneUnknown", { x: s });
  }
  // Selisih zona terhadap UTC (menit) pada saat ms.
  function offsetMenit(Z, ms) {
    if (Z.tz == null) return Z.off;
    const p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: Z.tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(ms).forEach((x) => (p[x.type] = +x.value));
    return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(ms / 60000) * 60000) / 60000);
  }
  // Tanggal + jam dinding di zona resmi → milidetik UTC (dua putaran agar tepat di sekitar DST).
  function msZona(Z, tgl, jam, menit) {
    const dinding = parseTgl(tgl).getTime() + (jam * 60 + menit) * 60000;
    let ms = dinding - offsetMenit(Z, dinding) * 60000;
    return dinding - offsetMenit(Z, ms) * 60000;
  }
  function labelZona(Z, ms) {
    if (Z.tz && ZONA_ID[Z.tz]) return ZONA_ID[Z.tz];
    if (Z.tz) {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: Z.tz, timeZoneName: "short" }).formatToParts(ms).find((x) => x.type === "timeZoneName");
      return p ? p.value : Z.tz;
    }
    const a = Math.abs(Z.off);
    return `UTC${Z.off < 0 ? "-" : "+"}${Math.floor(a / 60)}${a % 60 ? ":" + pad(a % 60) : ""}`;
  }

  function sheetId(u) {
    u = (u || "").trim();
    const m = u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})/);
    if (m) return m[1] === "e" ? "" : m[1];
    return /^[\w-]{25,}$/.test(u) && !/^AKfy/.test(u) ? u : "";
  }
  const urlTab = (id, tab) => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;

  function parseRows(text) {
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];
    const sep = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ";" : ",";
    return lines.map((l) => {
      const out = []; let cur = "", q = false;
      for (let i = 0; i < l.length; i++) {
        const c = l[i];
        if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (c === sep && !q) { out.push(cur); cur = ""; }
        else cur += c;
      }
      out.push(cur);
      return out.map((s) => s.trim());
    });
  }

  async function ambil(url, wajib) {
    let r;
    if (location.protocol === "file:") throw E("fileBlocked", { src: "Google Sheet" });
    try { r = await fetch(url, { cache: "no-store" }); }
    catch { throw E("sheetNoNet"); }
    const t = await r.text();
    if (!r.ok || /^\s*<(!doctype|html)/i.test(t)) {
      if (!wajib) return "";
      throw E("sheetNotShared");
    }
    return t;
  }

  // Kolom opsional "abaikan": kosong = ikut diacak, angka = kursi tetap, isi lain (Ya) = tidak ikut.
  function bacaAnggota(rows) {
    if (!rows.length) return [];
    let col = rows[0].findIndex((h) => /^(nama|name)$/i.test(h));
    const ab = col >= 0 ? rows[0].findIndex((h) => /^(abaikan|ignore)$/i.test(h)) : -1;
    const body = col >= 0 ? rows.slice(1) : rows;
    if (col < 0) col = 0;
    return body.map((r) => {
      const nama = String(r[col] || "").trim().replace(/\s+/g, " ");
      const v = ab >= 0 ? String(r[ab] || "").trim() : "";
      return { nama, tetap: /^\d+$/.test(v) && +v > 0 ? +v : 0, abai: !!v && !/^(\d+|tidak|no|n|-)$/i.test(v) };
    }).filter((a) => a.nama);
  }
  // "Vina: 3, Budi 12" → [{nama:"Vina", no:3}, ...]. Pemisah nama–nomor: : = - atau spasi.
  function bacaTetap(s) {
    return s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean).map((x) => {
      const m = x.match(/^(.+?)[\s:=-]+0*(\d+)$/);
      if (!m) throw E("fixedUnreadable", { x });
      return { nama: m[1].trim(), no: +m[2] };
    });
  }
  // Nama → nomor kursi tetap (divalidasi). Sumber: kolom "abaikan" (angka) + baris "Kursi Tetap" di Pengaturan.
  function aturTetap(list, N, dariPengaturan = []) {
    const tetap = {}, dipakai = {};
    const depan = namaDepan(list.map((a) => a.nama));
    dariPengaturan.forEach((t) => {
      const cari = t.nama.toLowerCase();
      const a = list.find((x) => x.nama.toLowerCase() === cari) || list.find((x) => depan[x.nama].toLowerCase() === cari);
      if (!a) throw E("fixedUnknown", { nama: t.nama });
      if (a.tetap && a.tetap !== t.no) throw E("fixedConflict", { nama: a.nama, a: a.tetap, b: t.no });
      a.tetap = t.no;
    });
    list.forEach((a) => {
      if (!a.tetap) return;
      if (a.tetap > N) throw E("fixedTooHigh", { no: a.tetap, nama: a.nama, n: N });
      if (dipakai[a.tetap]) throw E("fixedDup", { no: a.tetap, a: dipakai[a.tetap], b: a.nama });
      dipakai[a.tetap] = a.nama; tetap[a.nama] = a.tetap;
    });
    return tetap;
  }

  function pengaturan(rows, id) {
    const S = { judul: "Lucky Seat", subjudul: "", jamUndian: 7, menitUndian: 0, tanggalMulai: "", hariKerja: [1, 2, 3, 4, 5], jumlahKursi: 0, kunci: "", caraAmbil: "manual", kursiTetap: [], zona: "Asia/Jakarta", bahasa: "" };
    rows.forEach(([k = "", v = ""]) => {
      k = k.toLowerCase().replace(/[^a-z]/g, ""); k = ALIAS[k] || k; const s = v.trim().replace(/^'/, "");
      if (!s) return;
      if (k === "judul") S.judul = s;
      else if (k === "subjudul" || k === "tim") S.subjudul = s;
      else if (k === "jamundian" || k === "jam") { const j = s.split(/[.:]/); S.jamUndian = +j[0] || 0; S.menitUndian = +j[1] || 0; }
      else if (k === "tanggalmulai" || k === "mulai") {
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (m) S.tanggalMulai = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
        else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) S.tanggalMulai = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
      } else if (k === "harikerja") {
        const h = s.toLowerCase().replace(/'/g, "").split(/[,;\s]+/).filter(Boolean)
          .map((x) => (/^\d$/.test(x) ? +x : HARI[x])).filter((x) => x >= 0);
        if (h.length) S.hariKerja = h;
      } else if (k === "jumlahkursi" || k === "kursi") S.jumlahKursi = parseInt(s, 10) || 0;
      else if (k === "kunci") S.kunci = s;
      else if (k === "caraambil" || k === "ambil") S.caraAmbil = /oto|auto/i.test(s) ? "otomatis" : "manual";
      else if (k === "kursitetap" || k === "tetap") S.kursiTetap = bacaTetap(s);
      else if (k === "zonawaktu" || k === "zona") S.zona = s;
      else if (k === "bahasa") S.bahasa = /^(id|ind|indonesia|bahasa)/i.test(s) ? "id" : "en";
    });
    if (!S.tanggalMulai) throw E("startEmpty");
    if (!S.kunci) S.kunci = id;
    S.Z = bacaZona(S.zona);
    return S;
  }

  function namaDepan(list) {
    const uniq = list.filter((n, i) => list.indexOf(n) === i);
    const kata = (n) => n.split(" ").filter((w) => !GELAR.test(w));
    const out = {};
    uniq.forEach((n) => (out[n] = kata(n)[0] || n));
    const hitung = () => { const c = {}; Object.values(out).forEach((v) => (c[v] = (c[v] || 0) + 1)); return c; };
    for (let len = 1; len <= 3; len++) {
      const c = hitung();
      uniq.forEach((n) => { const k = kata(n); if (c[out[n]] > 1 && k[1]) out[n] = `${k[0]} ${k[1][0].toUpperCase()}${k[1].slice(1, len).toLowerCase()}.`; });
    }
    const c = hitung(), urut = {};
    uniq.forEach((n) => { if (c[out[n]] > 1) { urut[out[n]] = (urut[out[n]] || 0) + 1; out[n] += " " + urut[out[n]]; } });
    return out;
  }

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
    for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
    return x;
  }

  async function ambilTab(id, nama, wajib) {
    for (const n of nama) { const t = await ambil(urlTab(id, n), false); if (t) return t; }
    return wajib ? ambil(urlTab(id, nama[0]), true) : "";
  }
  const muat = {}; // cache per sheet
  async function data(id) {
    if (!muat[id]) muat[id] = Promise.all([ambilTab(id, ["Anggota", "Members"], true), ambilTab(id, ["Pengaturan", "Settings"], false)])
      .then(([a, s]) => ({ anggota: bacaAnggota(parseRows(a)), S: pengaturan(parseRows(s), id) }))
      .catch((e) => { delete muat[id]; throw e; });
    return muat[id];
  }

  // Bentuk hasil sama dengan Apps Script: { ok, info, hari }
  async function panggilSheet(id, tglMinta) {
    const { anggota: daftar, S } = await data(id);
    const ikut = daftar.filter((a) => !a.abai), anggota = ikut.map((a) => a.nama);
    if (!anggota.length) throw E("membersEmpty");
    const ganda = anggota.filter((n, i) => anggota.indexOf(n) !== i);
    if (ganda.length) throw E("dupNames", { n: ganda.length });
    const N = S.jumlahKursi || anggota.length;
    if (anggota.length > N) throw E("tooFewSeats", { a: anggota.length, n: N });
    // Tanpa kursi tetap: pool = semua kursi & acak = semua anggota → hasil sama seperti sebelumnya.
    const tetap = aturTetap(ikut.map((a) => ({ ...a })), N, S.kursiTetap), acak = anggota.filter((n) => !tetap[n]);

    // Jam dinding saat ini di zona resmi tim (bukan zona HP) → semua HP buka bersamaan.
    const nowMs = Date.now(), w = new Date(nowMs + offsetMenit(S.Z, nowMs) * 60000);
    const hariIni = w.toISOString().slice(0, 10);
    const sudahBuka = w.getUTCHours() * 60 + w.getUTCMinutes() >= S.jamUndian * 60 + S.menitUndian;
    const isKerja = (t) => S.hariKerja.includes(hariDari(t));
    const kerjaDekat = (t, arah) => { for (let i = 0; i < 14; i++) { t = geser(t, arah); if (isKerja(t)) return t; } return t; };

    let aktif = sudahBuka ? hariIni : geser(hariIni, -1);
    if (!isKerja(aktif)) aktif = kerjaDekat(aktif, -1);
    const berikut = kerjaDekat(aktif, 1);

    let tgl = /^\d{4}-\d{2}-\d{2}$/.test(tglMinta || "") ? tglMinta : aktif;
    if (tgl < S.tanggalMulai) tgl = S.tanggalMulai;
    if (!isKerja(tgl)) tgl = kerjaDekat(tgl, -1);
    if (tgl > berikut) tgl = aktif;
    if (tgl < S.tanggalMulai) tgl = kerjaDekat(S.tanggalMulai, 1);

    const buka = tgl <= aktif && tgl >= S.tanggalMulai;
    let kursi = null;
    if (buka) {
      // hitung berurutan dari awal; hindari kursi sama dengan hari kerja sebelumnya
      const semua = Array.from({ length: N }, (_, i) => i + 1);
      const terpakai = Object.values(tetap), pool = semua.filter((no) => !terpakai.includes(no));
      let prev = null, hasil = null;
      for (let t = S.tanggalMulai; t <= tgl; t = geser(t, 1)) {
        if (!isKerja(t)) continue;
        let best = null, skorBest = Infinity;
        for (let n = 0; n < 60 && skorBest > 0; n++) {
          const k = shuffle(pool, `${S.kunci}|${t}|${n}`);
          const skor = prev ? acak.filter((a, i) => prev[i] === k[i]).length : 0;
          if (skor < skorBest) { best = k; skorBest = skor; }
        }
        prev = hasil = best;
      }
      const depan = namaDepan(anggota);
      kursi = semua.map((no) => ({ no, nama: null }));
      acak.forEach((a, i) => (kursi[hasil[i] - 1].nama = depan[a]));
      Object.keys(tetap).forEach((a) => Object.assign(kursi[tetap[a] - 1], { nama: depan[a], tetap: true }));
    }

    let nomor = 0;
    for (let t = S.tanggalMulai; t <= tgl; t = geser(t, 1)) if (isKerja(t)) nomor++;
    const prev = kerjaDekat(tgl, -1);
    return {
      ok: true,
      info: {
        judul: S.judul, subjudul: S.subjudul, jamUndian: S.jamUndian, menitUndian: S.menitUndian, caraAmbil: S.caraAmbil, bahasa: S.bahasa,
        versi: window.APP_VERSION || "", hariIni, aktif, serverMs: nowMs,
        bukaBerikutMs: msZona(S.Z, berikut, S.jamUndian, S.menitUndian),
        zonaLabel: labelZona(S.Z, msZona(S.Z, berikut, S.jamUndian, S.menitUndian)),
        zonaOffset: offsetMenit(S.Z, msZona(S.Z, berikut, S.jamUndian, S.menitUndian)),
        anggota: Object.values(namaDepan(anggota)).sort((a, b) => a.localeCompare(b, "id")), jumlahKursi: N,
      },
      hari: { tgl, nomor, buka, prev: prev >= S.tanggalMulai ? prev : null, next: tgl < aktif ? kerjaDekat(tgl, 1) : tgl === aktif ? berikut : null, kursi },
    };
  }

  window.SheetSumber = { sheetId, panggilSheet };
})();
