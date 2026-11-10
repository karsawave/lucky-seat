// LUCKY SEAT: tampilan. Dua sumber data, hasilnya berbentuk sama:
//   Opsi 1 (utama) : link Google Sheet (dibagikan Pelihat) → dihitung di browser (sheet.js)
//   Opsi 2 (privat): URL Web App Apps Script → dihitung di server (apps-script/Code.gs)
// Yang ditampilkan hanya nama depan + nomor kursi.

// URL Web App Apps Script (…/macros/s/<ID>/exec) atau ID-nya (AKfy…) → ID, atau "".
function scriptId(u) {
  u = (u || "").trim();
  const m = u.match(/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/([\w-]{20,})\//);
  if (m) return m[1];
  return /^AKfy[\w-]{20,}$/.test(u) ? u : "";
}
// Kenali link apa pun (Sheet atau Apps Script) → ID untuk ?s=
const apiId = (u) => scriptId(u) || window.SheetSumber.sheetId(u);
const apiUrl = (id) => scriptId(id) ? `https://script.google.com/macros/s/${id}/exec` : `https://docs.google.com/spreadsheets/d/${id}/edit`;

// Versi website (version.js) hanya untuk ditampilkan. Kecocokan Apps Script diukur dari API_VERSION Code.gs
// (info.api) terhadap CODE_GS_API yang dibutuhkan website. Code.gs v1.0.0–v1.1.x belum mengirim `api`,
// tetapi sudah mengirim `versi` dan isinya setara API 1. Tanpa keduanya = skrip lama sebelum v1.0.0.
const APP_VERSION = window.APP_VERSION || "";
const CODE_GS_API = window.CODE_GS_API || 1;
const apiScript = (I) => I.api || (I.versi ? 1 : 0);
const scriptKuno = (id, I) => !!scriptId(id) && apiScript(I) < CODE_GS_API;

async function panggil(id, tgl) {
  if (!scriptId(id)) return window.SheetSumber.panggilSheet(id, tgl);
  return panggilScript(id, tgl);
}
async function panggilScript(id, tgl) {
  let r;
  const t = window.I18N.t;
  if (location.protocol === "file:") throw new Error(t("fileBlocked", { src: "Apps Script" }));
  try { r = await fetch(`https://script.google.com/macros/s/${id}/exec?lang=${window.I18N.lang}` + (tgl ? `&tgl=${tgl}` : ""), { cache: "no-store" }); }
  catch { throw new Error(t("scriptNoNet")); }
  let j;
  try { j = await r.json(); } catch { throw new Error(t("scriptNoData")); }
  if (!j.ok) throw new Error(j.error || t("serverError"));
  return j;
}

(async () => {
  const C = window.CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const main = document.querySelector("main");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const pad2 = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Bahasa: teks statis lewat data-i18n, teks dinamis lewat t(). Ganti bahasa → layar aktif dirender ulang
  // di tempat (tanpa muat ulang halaman, tanpa kehilangan isian).
  const T = window.I18N, t = T.t;
  let ulang = null;
  T.apply();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b && T.set(b.dataset.lang) && ulang) ulang();
  });

  // Halaman tetap tersembunyi sampai layar pertama & font siap → tidak ada lompatan saat muat.
  let sudahSiap = false;
  async function siap() {
    if (sudahSiap) return; sudahSiap = true;
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch {}
    main.removeAttribute("aria-busy");
  }
  let tt;
  function toast(m) {
    const el = $("toast"); el.textContent = m; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // Sumber: ?s=<ID> > terakhir dipakai di perangkat ini > config.js
  const qs = new URLSearchParams(location.search);
  const ID = apiId(qs.get("s")) || (!qs.has("s") && apiId(store.get("ls-api"))) || apiId(C.api);
  // Link undangan selalu ke folder situs (…/lucky-seat/?s=), bukan …/index.html?s=, walau admin datang lewat index.html.
  const dasar = () => `${location.origin}${location.pathname.replace(/index\.html$/, "")}`;
  const linkUndangan = (id) => `${dasar()}?s=${id}`;

  // ---------- Kaki halaman (sama di semua layar) ----------
  // Garis pemisah → navigasi antarhalaman (kiri: kembali/aksi utama, kanan: tujuan lain) → versi.
  // Aksi milik kartu (salin, unduh, dll.) tetap di .links di bawah kartu, bukan di sini.
  const IKON = {
    back: '<path d="M15 6l-6 6 6 6"/>',
    admin: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    guide: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
    retry: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/>',
  };
  const ikon = (k) => `<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[k]}</svg>`;
  const tautan = (href, k, teks) => `<a href="${esc(href)}">${ikon(k)}<span>${esc(teks)}</span></a>`;
  const kaki = (kiri = "", kanan = "") =>
    `<div class="foot"><span>${kiri}</span><span>${kanan}</span></div><p class="ver" id="ver">Lucky Seat v${esc(APP_VERSION)}</p>`;
  // Tujuan "Halaman undian" dari layar admin: sumber terakhir di perangkat ini, atau halaman awal.
  const keUndian = (id) => tautan(id ? `${dasar()}?s=${id}` : dasar(), "back", t("backToDraw"));

  if (qs.has("admin") || qs.has("ganti")) return adminSetup();
  if (qs.has("s") && !ID) return butuhLink("linkBroken");
  if (!ID) return butuhLink();

  // ---------- Layar khusus ----------
  // Semua layar memakai kerangka yang sama: header → kartu tiket → aksi → kaki halaman.
  function layar(eyebrow, judul, isi, kakiHtml = kaki()) {
    main.innerHTML = `
      <header class="top"><div><h1>${esc(judul)}</h1><p class="sub">${esc(eyebrow)}</p></div>${T.toggle()}</header>
      ${isi}
      ${kakiHtml}`;
    siap();
  }

  function butuhLink(kunciPesan) {
    ulang = () => butuhLink(kunciPesan);
    const awalan = location.protocol.startsWith("http") ? esc(location.host + location.pathname) + "?s=" : "";
    const ic = (d, c = "") => `<svg class="ic ${c}"width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    main.innerHTML = `
      <header class="top">
        <div class="brand"><img src="assets/img/icon.svg" width="40" height="40" alt=""><span>Lucky Seat</span></div>
        ${T.toggle()}
      </header>
      <div class="hero">
        <h1>${t("needLink")}</h1>
        <p class="sub">${t("needLead")}</p>
      </div>
      <article class="ticket">
        <div class="ticket-main stack">
          ${kunciPesan ? `<p class="callout is-error">${esc(t(kunciPesan))}</p>` : ""}
          <ol class="howto row-ic">
            <li>${ic('<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z"/>', "c-wa")}<span><b>${t("how1")}</b><small>${t("how1s")}</small></span></li>
            <li>${ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', "c-info")}<span><b>${t("how2")}</b><small>${t("how2s")}</small></span></li>
            <li>${ic('<path d="M5 20v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/>')}<span><b>${t("how3")}</b><small>${t("how3s")}</small></span></li>
          </ol>
        </div>
        <div class="perf"></div>
        <form class="ticket-main field" id="fLink" novalidate>
          <label class="label" for="iLink">${t("pasteLabel")}</label>
          <div class="paste">
            <input class="input mono" id="iLink" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="${t("pastePh")}">
            <button class="btn-draw" type="submit">${t("openLink")}</button>
          </div>
          <p class="hint" id="hLink">${awalan ? `${t("official")} <b class="mono-chip">${awalan}</b>` : ""}</p>
        </form>
      </article>
      <div class="admin-cta">
        <span class="row-ic">${ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', "c-mute")}<span><b>${t("adminQ")}</b><small>${t("adminCta")}</small></span></span>
        <a class="btn-ghost" href="?admin">${t("connect")} ${ic('<path d="M5 12h14M13 6l6 6-6 6"/>')}</a>
      </div>
      ${kaki(tautan("guide.html", "guide", t("guideShort")))}`;
    $("fLink").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("iLink").value.trim();
      let id = null;
      try { id = apiId(new URL(v, location.href).searchParams.get("s")); } catch {}
      id = id || apiId(v);
      if (!id) {
        $("hLink").textContent = t("pasteBad"); $("hLink").classList.add("is-error");
        $("iLink").setAttribute("aria-invalid", "true"); $("iLink").focus();
        return;
      }
      location.href = linkUndangan(id);
    });
    siap();
  }

  // Pesan error dari sumber data (sheet/server) ditampilkan apa adanya.
  function gagal(isi) {
    ulang = () => location.reload();
    layar("Lucky Seat", t("loadFail"), `
      <article class="ticket"><div class="ticket-main stack">
        <p class="callout">${esc(isi)}</p>
      </div></article>`,
      kaki(tautan(location.href, "retry", t("retry")), tautan("?admin", "admin", t("admin"))));
  }

  function adminSetup(mode0, isi0) {
    const simpan = apiId(store.get("ls-api"));
    const MODE = {
      sheet: {
        label: t("sheetLabel"), ph: "https://docs.google.com/spreadsheets/d/…",
        cek: (v) => window.SheetSumber.sheetId(v),
        salah: t("sheetWrong"), catatan: t("sheetNote"), nada: "",
        langkah: t("sheetSteps"), bawah: t("sheetFoot"),
      },
      script: {
        label: t("scriptLabel"), ph: "https://script.google.com/macros/s/…/exec",
        cek: (v) => scriptId(v),
        salah: t("scriptWrong"), catatan: t("scriptNote"), nada: "neutral",
        langkah: t("scriptSteps"), bawah: t("scriptFoot"),
      },
    };
    let mode = mode0 || (simpan && scriptId(simpan) ? "script" : "sheet");
    // Ganti bahasa: pertahankan mode & isian yang sedang diketik.
    ulang = () => adminSetup(mode, $("su-" + mode).value);

    // Struktur kedua mode identik (callout → 4 langkah → garis → input → tombol) dan tiap blok
    // ditumpuk di sel grid yang sama, jadi mengganti toggle tidak menggeser apa pun.
    // Pesan error tampil di dalam callout mode aktif (ruangnya sudah tersedia) → tanpa ruang kosong di bawah tombol.
    const callout = (m) => `<p class="pane callout ${MODE[m].nada}" data-pane="${m}" id="co-${m}" role="status">${MODE[m].catatan}</p>`;
    const info = (m) => `<ol class="pane steps" data-pane="${m}">${MODE[m].langkah.map((l) => `<li><span>${l}</span></li>`).join("")}</ol>`;
    const field = (m) => {
      const M = MODE[m];
      return `<div class="pane field" data-pane="${m}">
        <label class="label" for="su-${m}">${M.label}</label>
        <input class="input" id="su-${m}" autocomplete="off" spellcheck="false" placeholder="${M.ph}"
          value="${mode === m && isi0 != null ? esc(isi0) : simpan && mode === m ? esc(apiUrl(simpan)) : ""}">
        ${M.bawah ? `<p class="hint">${M.bawah}</p>` : ""}
      </div>`;
    };

    layar(t("admin"), t("connect"), `
      <form id="fs" class="ticket" novalidate><div class="ticket-main stack">
        <div class="seg full" role="radiogroup" aria-label="${t("source")}">
          <button type="button" role="radio" data-m="sheet">Google Sheet</button>
          <button type="button" role="radio" data-m="script">Apps Script</button>
        </div>
        <div class="panes">${callout("sheet")}${callout("script")}</div>
        <div class="panes">${info("sheet")}${info("script")}</div>
        <div class="divider"></div>
        <div class="panes">${field("sheet")}${field("script")}</div>
        <button class="btn-primary" id="bt" type="submit">${esc(t("testConnect"))}</button>
      </div></form>
      <div class="links">
        <a class="btn-link" href="guide.html#unduh"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg>${t("downloadTpl")}</a>
        <a class="btn-link" href="guide.html"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/></svg>${t("guide")}</a>
      </div>`, kaki(keUndian(simpan)));

    function setMode(m) {
      mode = m;
      main.querySelectorAll(".seg.full button").forEach((b) => {
        const on = b.dataset.m === m;
        b.setAttribute("aria-checked", on); b.setAttribute("aria-pressed", on);
      });
      main.querySelectorAll("[data-pane]").forEach((p) => p.setAttribute("aria-hidden", p.dataset.pane !== m));
      pulihkan();
    }
    function pulihkan() {
      ["sheet", "script"].forEach((k) => { const c = $("co-" + k); c.textContent = MODE[k].catatan; c.classList.remove("is-error"); });
    }
    main.querySelectorAll(".seg.full button").forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
    setMode(mode);

    $("fs").onsubmit = async (e) => {
      e.preventDefault();
      const bt = $("bt");
      if (bt.getAttribute("aria-busy") === "true") return;
      const tampil = (m) => { const c = $("co-" + mode); c.textContent = m; c.classList.add("is-error"); };
      pulihkan();
      const v = $("su-" + mode).value.trim();
      if (!v) return tampil(t("pasteFirst", { x: MODE[mode].label }));
      const id = MODE[mode].cek(v);
      if (!id) {
        const lain = mode === "sheet" ? scriptId(v) : window.SheetSumber.sheetId(v);
        const namaLain = mode === "sheet" ? "Apps Script" : "Google Sheet";
        return tampil(lain ? t("wrongKind", { x: namaLain }) : MODE[mode].salah);
      }
      bt.setAttribute("aria-busy", "true");
      try {
        const j = await panggil(id);
        store.set("ls-api", id);
        siapDibagikan(id, j.info);
      } catch (x) { tampil(x.message); bt.removeAttribute("aria-busy"); }
    };
  }

  function siapDibagikan(id, I) {
    ulang = () => siapDibagikan(id, I);
    const url = linkUndangan(id), jam = `${pad2(I.jamUndian)}.${pad2(I.menitUndian)} ${I.zonaLabel || "WIB"}`;
    const pesanWA = t("waMsg", { judul: I.judul + (I.subjudul ? " " + I.subjudul : ""), jam, url });
    layar(t("connected"), t("ready"), `
      <article class="ticket"><div class="ticket-main stack">
        ${scriptKuno(id, I) ? `<p class="callout is-warn">${esc(t("scriptOutdated"))}</p>` : ""}
        <div class="label">${esc(I.judul)}${I.subjudul ? " · " + esc(I.subjudul) : ""}</div>
        <p class="lead">${t("summary", { a: I.anggota.length, k: I.jumlahKursi, jam, m: t(I.caraAmbil === "otomatis" ? "auto" : "manual") })}</p>
        <div class="field">
          <label class="label" for="lu">${t("inviteLink")}</label>
          <input class="input mono" id="lu" readonly value="${esc(url)}">
        </div>
      </div>
      <div class="perf"></div>
      <div class="stub"><span>${t("toMembers")}</span><b>${t("oneLink")}</b></div></article>
      <div class="actions">
        <button class="btn-primary" id="kirim"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/></svg>${t("sendWA")}</button>
        <div class="links">
          <button class="btn-link" id="salin"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>${t("copyLink")}</button>
          <a class="btn-link" href="?admin"><svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>${t("changeSource")}</a>
        </div>
      </div>`, kaki(keUndian(id)));
    $("lu").onclick = (e) => e.target.select();
    $("kirim").onclick = () => window.open("https://wa.me/?text=" + encodeURIComponent(pesanWA), "_blank", "noopener");
    $("salin").onclick = async () => {
      try { await navigator.clipboard.writeText(url); toast(t("copied")); }
      catch { $("lu").select(); toast(t("selected")); }
    };
  }

  // ---------- Muat data ----------
  const h0 = location.hash.slice(1);
  let D;
  try { D = await panggil(ID, /^\d{4}-\d{2}-\d{2}$/.test(h0) ? h0 : ""); }
  catch (e) { return gagal(e.message); }
  store.set("ls-api", ID);

  let I = D.info, H = D.hari;
  T.bawaan(I.bahasa);
  const cache = { [H.tgl]: D };
  const offset = I.serverMs - Date.now();
  // Jam undian di zona resmi tim. lokal=true → tambah jam yang sama dalam zona HP bila berbeda,
  // mis. "07.00 WIB (08.00 waktu kamu)". Selisih dihitung pada saat undian berikutnya (aman DST).
  const jamTxt = (lokal) => {
    const s = `${pad2(I.jamUndian)}.${pad2(I.menitUndian)} ${I.zonaLabel || "WIB"}`;
    const d = new Date(I.bukaBerikutMs);
    if (!lokal || I.zonaOffset == null || -d.getTimezoneOffset() === I.zonaOffset) return s;
    return s + " (" + t("yourTime", { jam: `${pad2(d.getHours())}.${pad2(d.getMinutes())}` }) + ")";
  };

  const parse = (s) => new Date(s + "T00:00:00Z");
  const fmt = (s, o) => parse(s).toLocaleDateString(t("locale"), { timeZone: "UTC", ...o });
  const fmtPanjang = (s) => fmt(s, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ---------- Gambar JPG ----------
  // Sengaja SELALU tema terang (tidak ikut mode gelap): gambar dibagikan ke WhatsApp dan harus tampil sama
  // untuk semua penerima. Nilai = token terang di style.css (:root); ubah keduanya bersamaan.
  const PAPER = "#f4efe6", SURF = "#fffdf8", INK = "#1c1a17", MUTE = "#7a7266", LINE = "#e2d9c8", ACC = "#d9432f";
  const FD = '"Bricolage Grotesque", sans-serif', FM = '"JetBrains Mono", monospace';
  const situs = () => (location.host + location.pathname).replace(/\/(index\.html)?$/, "") || "lucky seat";
  function kanvas(W, Ht) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = Ht;
    const g = cv.getContext("2d"); g.fillStyle = PAPER; g.fillRect(0, 0, W, Ht);
    return [cv, g];
  }
  function header(g, W) {
    g.textAlign = "left";
    g.fillStyle = MUTE; g.font = `500 30px ${FM}`;
    g.fillText(`${I.subjudul ? I.subjudul + " · " : ""}${t("drawNo", { n: H.nomor })}`.toUpperCase(), 90, 140);
    g.fillStyle = INK; g.font = `800 80px ${FD}`; g.fillText(I.judul, 86, 225, W - 180);
    g.fillStyle = INK; g.font = `500 38px ${FD}`; g.fillText(fmtPanjang(H.tgl), 90, 285, W - 180);
  }
  function gambarDaftar() {
    const L = H.kursi, rows = Math.ceil(L.length / 2), RH = 76;
    const W = 1080, top = 350, Ht = top + 60 + rows * RH + 60 + 120;
    const [cv, g] = kanvas(W, Ht);
    header(g, W);
    g.fillStyle = SURF; g.strokeStyle = LINE; g.lineWidth = 3;
    rr(g, 60, top, W - 120, rows * RH + 100, 16); g.fill(); g.stroke();
    const colW = (W - 120 - 100) / 2;
    L.forEach((s, i) => {
      const c = Math.floor(i / rows), r = i % rows, x = 110 + c * colW, y = top + 50 + r * RH;
      g.fillStyle = MUTE; g.font = `700 34px ${FM}`; g.fillText(pad2(s.no), x, y + 46);
      g.fillStyle = s.nama ? INK : MUTE; g.font = `${s.nama ? 800 : 500} 38px ${FD}`;
      g.fillText(s.nama || t("empty"), x + 76, y + 46, colW - 100);
      if (r < rows - 1) { g.fillStyle = LINE; g.fillRect(x, y + RH - 4, colW - 30, 2); }
    });
    g.fillStyle = MUTE; g.font = `500 26px ${FM}`; g.fillText(situs(), 90, Ht - 70);
    return cv;
  }
  function gambarKartu() {
    const W = 1080, Ht = 1350, [cv, g] = kanvas(W, Ht);
    header(g, W);
    const x = 90, y = 360, w = W - 180, h = 820, perfY = y + h - 160;
    g.fillStyle = SURF; g.strokeStyle = LINE; g.lineWidth = 3; rr(g, x, y, w, h, 16); g.fill(); g.stroke();
    g.fillStyle = LINE; g.fillRect(x, perfY, w, 3);
    g.fillStyle = MUTE; g.font = `500 28px ${FM}`; g.fillText(t("imgName"), x + 60, y + 90);
    g.fillStyle = INK; g.font = `800 64px ${FD}`; g.fillText(nama, x + 60, y + 165, w - 120);
    g.fillStyle = MUTE; g.font = `500 28px ${FM}`; g.fillText(t("imgSeat"), x + 60, y + 270);
    g.fillStyle = ACC; g.font = `700 360px ${FM}`; g.fillText(pad2(kursiSaya()), x + 40, y + 570);
    g.fillStyle = MUTE; g.font = `500 26px ${FM}`;
    g.fillText(`${t("posOf", { no: pad2(kursiSaya()), n: H.kursi.length })} · ${jamTxt()}`, x + 60, perfY + 70);
    g.textAlign = "right"; g.fillText(`${t("imgCode")} ${kodeUndian()}`, x + w - 60, perfY + 70); g.textAlign = "left";
    g.fillText(t("noSwap"), x + 60, perfY + 115);
    g.fillText(situs(), 90, Ht - 70);
    return cv;
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  const blob = async (fn) => { await document.fonts.ready; return new Promise((res) => fn().toBlob(res, "image/jpeg", 0.92)); };

  // ---------- State ----------
  let sortBy = "no";
  let nama = store.get("ls-nama") || "";
  if (!I.anggota.includes(nama)) nama = "";
  const kursiSaya = () => { const s = H.kursi && H.kursi.find((k) => k.nama === nama); return s ? s.no : null; };
  const kunciBuka = () => `ls-buka-${H.tgl}`;
  const otomatis = () => I.caraAmbil === "otomatis";
  // Cara Ambil (tab Pengaturan): Otomatis → hasil langsung terlihat di jam undian.
  // Manual → hasil (kursi pribadi, daftar, tombol bagikan) terbuka setelah "Ambil nomor" ditekan di perangkat ini.
  const terbuka = () => !!H.kursi && (otomatis() || H.tgl < I.aktif || !!store.get(kunciBuka()));

  // ---------- Render ----------
  function render() {
    document.title = `${I.judul}${I.subjudul ? " " + I.subjudul : ""}`;
    $("judul").textContent = I.judul;
    $("sub").textContent = t("sub", { tim: I.subjudul ? I.subjudul + " · " : "", jam: jamTxt(true) });
    $("no").textContent = t("drawNo", { n: H.nomor });
    $("tglTxt").textContent = H.tgl === I.hariIni ? t("today", { d: fmt(H.tgl, { weekday: "long" }) })
      : H.tgl === I.aktif ? t("latest", { d: fmtPanjang(H.tgl) }) : fmtPanjang(H.tgl);
    $("prev").disabled = !H.prev;
    $("next").disabled = !H.next;
    $("nama").disabled = $("btnDraw").disabled = false;
    document.querySelectorAll(".seg[data-sort] button").forEach((b) => (b.disabled = !terbuka()));
    document.querySelector(".ticket").removeAttribute("aria-busy");
    const ada = terbuka();
    $("btnShare").disabled = $("btnDl").disabled = !ada;
    $("btnKartu").disabled = !ada || !kursiSaya();
    // Tombol nonaktif selalu memberi alasan (tooltip) → kursor "dilarang" tidak membingungkan.
    const kunci = !H.kursi ? t("opensAt", { jam: jamTxt() }) : t("pressDraw");
    $("btnShare").title = $("btnDl").title = ada ? "" : kunci;
    $("btnKartu").title = !ada ? kunci : !kursiSaya() ? t("pickFirst") : "";
    $("prev").title = H.prev ? "" : t("firstDraw");
    $("next").title = H.next ? "" : t("notYet");
    document.querySelectorAll(".seg[data-sort] button").forEach((b) => (b.title = ada ? "" : kunci));
    $("aturan").textContent = t(otomatis() ? "ruleAuto" : "ruleManual", { jam: jamTxt(true) });
    history.replaceState(null, "", `${location.pathname}?s=${ID}` + (H.tgl === I.aktif ? "" : "#" + H.tgl));
    renderKursi(false);
    renderDaftar();
  }

  // Pesan & tombol "Ambil nomor" menempati sel yang sama; hanya visibilitasnya yang berganti.
  // Angka selalu 2 karakter (00, ??, 07) sehingga lebarnya tetap.
  // Kode undian: sidik jari hasil hari itu. Sama di semua HP → bukti semua melihat undian yang sama.
  function kodeUndian() {
    let h = 0x811c9dc5;
    const s = H.tgl + "|" + H.kursi.map((k) => k.no + ":" + (k.nama || "")).join(",");
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    const x = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
    return x.slice(0, 4) + "·" + x.slice(4);
  }
  // Peta kursi mini: jumlah sel = jumlah kursi (tetap) → tinggi kartu tidak berubah.
  // Setelah hasil terbuka, tiap nomor bisa diketuk: kursi berisi → "Nama kamu" ikut berganti ke orang itu
  // (tampilan sama seperti memilih dari combobox). Kursi kosong → hanya "intip" (teks + baris ditandai).
  // Pilihan lewat ketukan tidak disimpan; pilihan tersimpan hanya dari combobox.
  let intip = null;
  const teksKursi = (k) => k.nama ? t("seatOf", { no: pad2(k.no), nama: k.nama }) : t("seatEmpty", { no: pad2(k.no) });
  function renderMap(no) {
    const N = I.jumlahKursi, map = $("map"), buka = !!H.kursi && terbuka();
    if (!buka) intip = null;
    map.style.setProperty("--kol", Math.min(12, N));
    map.style.setProperty("--kol-sm", Math.min(6, N));
    map.innerHTML = Array.from({ length: N }, (_, i) => {
      const k = buka ? H.kursi[i] : null;
      const cls = [i + 1 === no ? "me" : "", k && k.tetap ? "t" : "", i + 1 === intip ? "peek" : ""].filter(Boolean).join(" ");
      return `<button type="button" data-no="${i + 1}" class="${cls}"${buka ? ` aria-label="${esc(teksKursi(k))}" aria-pressed="${i + 1 === intip}"` : " disabled"}>${pad2(i + 1)}</button>`;
    }).join("");
    $("mapInfo").textContent = !buka ? "" : intip ? teksKursi(H.kursi[intip - 1]) : no ? teksKursi(H.kursi[no - 1]) : t("mapHint");
  }
  function pilihIntip(no) {
    const k = H.kursi[no - 1];
    if (k.nama) {
      intip = null;
      if (k.nama === nama) return;
      nama = k.nama; $("nama").value = nama;
      render(); renderKursi(true);
      return;
    }
    intip = intip === no ? null : no;
    renderMap(kursiSaya() && terbuka() ? kursiSaya() : null);
    renderDaftar();
  }

  function renderKursi(animasi) {
    const num = $("num"), msg = $("msg"), seat = $("seat");
    seat.classList.remove("mode-btn", "mode-info"); msg.textContent = ""; num.classList.add("dim"); num.textContent = "00";
    renderMap(null);
    if (!H.kursi) { msg.textContent = t("opensDay", { hari: fmt(H.tgl, { weekday: "long" }), jam: jamTxt(true) }); return; }
    if (!nama) { msg.textContent = t(otomatis() ? "pickMsg" : "pickDrawMsg"); return; }
    const no = kursiSaya();
    if (!no) { msg.textContent = t("notIn"); return; }
    if (!terbuka()) { seat.classList.add("mode-btn"); num.textContent = "??"; return; }
    const tetap = H.kursi[no - 1].tetap;
    $("mPos").textContent = t("posOf", { no, n: H.kursi.length }) + (tetap ? ` · ${t("fixed")}` : "");
    $("mWkt").textContent = `${fmt(H.tgl, { weekday: "short", day: "numeric", month: "short" })} · ${jamTxt()}`;
    $("mKode").textContent = kodeUndian();
    seat.classList.add("mode-info");
    renderMap(no);
    num.classList.remove("dim");
    if (!animasi || matchMedia("(prefers-reduced-motion: reduce)").matches) { num.textContent = pad2(no); return; }
    let i = 0; const r = setInterval(() => {
      num.textContent = pad2(1 + Math.floor(Math.random() * H.kursi.length));
      if (++i > 14) { clearInterval(r); num.textContent = pad2(no); num.classList.remove("pop"); void num.offsetWidth; num.classList.add("pop"); }
    }, 60);
  }

  // Jumlah baris selalu = jumlah kursi (terkunci → baris placeholder; urut nama → kursi kosong di akhir).
  function renderDaftar() {
    if (!terbuka()) {
      $("daftar").innerHTML = Array.from({ length: I.jumlahKursi }, (_, i) =>
        `<li class="ph" aria-hidden="true"><span class="no">${pad2(i + 1)}</span><span class="nm" style="width:${40 + (i * 37) % 31}%"></span></li>`).join("");
      return;
    }
    let L = H.kursi;
    if (sortBy === "nama") L = [...L].sort((a, b) => (!a.nama) - (!b.nama) || (a.nama && b.nama ? a.nama.localeCompare(b.nama, T.lang) : a.no - b.no));
    $("daftar").innerHTML = L.map((s) =>
      `<li class="${s.nama ? "" : "kosong"} ${s.nama && s.nama === nama ? "me" : ""} ${s.no === intip ? "peek" : ""}"><span class="no">${pad2(s.no)}</span><span class="nm">${s.nama ? esc(s.nama) : t("empty")}</span>${s.tetap ? `<span class="tag">${t("fixed")}</span>` : ""}</li>`
    ).join("");
  }

  function isiNama() {
    $("nama").innerHTML = `<option value="">${t("pickOpt")}</option>` +
      I.anggota.map((p) => `<option${p === nama ? " selected" : ""}>${esc(p)}</option>`).join("");
  }

  async function buka(tgl) {
    if (!tgl) return;
    intip = null;
    // Saat memuat hari lain, kontrol yang mengubah tampilan dikunci sementara (render() membukanya lagi).
    $("prev").disabled = $("next").disabled = $("nama").disabled = $("btnDraw").disabled = true;
    document.querySelectorAll(".seg[data-sort] button").forEach((b) => (b.disabled = true));
    document.querySelector(".ticket").setAttribute("aria-busy", "true");
    try {
      const j = cache[tgl] && cache[tgl].hari.kursi ? cache[tgl] : await panggil(ID, tgl);
      cache[j.hari.tgl] = j; I = j.info; H = j.hari;
      render();
    } catch (e) { toast(e.message); render(); }
  }

  // ---------- Countdown ----------
  let memuatUlang = false;
  function tick() {
    const s = Math.max(0, Math.floor((I.bukaBerikutMs - (Date.now() + offset)) / 1000));
    const h = Math.floor(s / 3600);
    $("cd").textContent = (h >= 24 ? `${Math.floor(h / 24)}${t("dayUnit")} ` : "") + `${pad2(h % 24)}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
    if (s === 0 && !memuatUlang) {
      memuatUlang = true;
      setTimeout(async () => {
        try { const j = await panggil(ID); cache[j.hari.tgl] = j; I = j.info; H = j.hari; render(); toast(t("opened")); }
        catch {} finally { memuatUlang = false; }
      }, 3000);
    }
  }

  // ---------- Share ----------
  const link = () => `${linkUndangan(ID)}#${H.tgl}`;
  const teksDaftar = () => `*${I.judul}${I.subjudul ? " " + I.subjudul : ""}* · ${fmtPanjang(H.tgl)}\n\n` +
    H.kursi.filter((s) => s.nama).map((s) => `${pad2(s.no)}  ${s.nama}`).join("\n") + "\n\n" + t("listText", { link: link() });
  const teksKartu = () => t("cardText", { judul: I.judul, tgl: fmtPanjang(H.tgl), nama, no: pad2(kursiSaya()) }) + "\n" + link();

  async function share(fn, teks, nf, btn) {
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    try {
      const b = await blob(fn), file = new File([b], nf, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text: teks }); } catch (e) { if (e.name !== "AbortError") toast(t("shareFail")); }
        return;
      }
      unduh(b, nf);
      toast(t("savedWA"));
      window.open("https://wa.me/?text=" + encodeURIComponent(teks), "_blank", "noopener");
    } finally { btn.removeAttribute("aria-busy"); render(); }
  }
  function unduh(b, nf) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = nf; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- Init ----------
  isiNama();
  $("nama").onchange = (e) => { nama = e.target.value; store.set("ls-nama", nama); render(); };
  $("btnDraw").onclick = () => { store.set(kunciBuka(), "1"); render(); renderKursi(true); };
  $("map").onclick = (e) => { const b = e.target.closest("button[data-no]"); if (b && !b.disabled) pilihIntip(+b.dataset.no); };
  $("prev").onclick = () => buka(H.prev);
  $("next").onclick = () => buka(H.next);
  $("btnShare").onclick = (e) => share(gambarDaftar, teksDaftar(), `lucky-seat-${H.tgl}.jpg`, e.currentTarget);
  $("btnKartu").onclick = (e) => share(gambarKartu, teksKartu(), `kursi-${H.tgl}.jpg`, e.currentTarget);
  $("btnDl").onclick = async () => { unduh(await blob(gambarDaftar), `lucky-seat-${H.tgl}.jpg`); toast(t("saved")); };
  $("btnUndang").onclick = async () => {
    try { await navigator.clipboard.writeText(linkUndangan(ID)); toast(t("copied")); }
    catch { prompt(t("copyPrompt"), linkUndangan(ID)); }
  };
  document.querySelectorAll(".seg[data-sort] button").forEach((b) => (b.onclick = () => {
    sortBy = b.dataset.s;
    document.querySelectorAll(".seg[data-sort] button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderDaftar();
  }));
  document.onkeydown = (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft" && !$("prev").disabled) $("prev").click();
    if (e.key === "ArrowRight" && !$("next").disabled) $("next").click();
  };
  const tulisVersi = () => {
    const kuno = scriptKuno(ID, I);
    $("ver").className = "ver" + (kuno ? " is-warn" : "");
    $("ver").textContent = `Lucky Seat v${APP_VERSION}` + (kuno ? " · " + t("scriptOutdated") : "");
  };
  ulang = () => { isiNama(); render(); tick(); tulisVersi(); };
  tulisVersi();
  render();
  tick(); setInterval(tick, 1000);
  siap();
})();
