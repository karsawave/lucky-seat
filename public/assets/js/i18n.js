// Teks UI dua bahasa (ID/EN). Kunci sama di kedua bahasa; {nama} = variabel.
// Elemen statis memakai atribut: data-i18n (teks), data-i18n-aria (aria-label).
(function () {
  const D = {
    id: {
      locale: "id-ID",
      fileBlocked: "Halaman dibuka langsung dari file, jadi browser memblokir {src}. Buka lewat GitHub Pages atau server lokal (npx serve).", scriptNoNet: "Tidak bisa terhubung. Cek internet, atau pastikan Web App di-deploy dengan akses \"Siapa saja\".", scriptNoData: "Server tidak memberi data. Pastikan link Web App benar & akses \"Siapa saja\".", serverError: "Terjadi kesalahan di server.", lang: "Bahasa", scriptOutdated: "Apps Script v{s} tidak sama dengan website v{v}. Tempel Code.gs terbaru, lalu Kelola deployment → Versi baru.", themeDark: "Mode gelap", themeLight: "Mode terang",
      prevDay: "Hari sebelumnya", nextDay: "Hari berikutnya",
      yourName: "Nama kamu", pickOpt: "Pilih nama", seat: "Kursi", draw: "Ambil nomor",
      mPos: "Posisi", mWkt: "Diundi", mKode: "Kode undian",
      nextDraw: "Undian berikutnya",
      shareList: "Bagikan daftar ke grup WA", shareCard: "Bagikan kartu saya", saveJpg: "Simpan JPG daftar",
      listTitle: "Daftar kursi", sortBy: "Urutkan", sortNo: "Nomor", sortName: "Nama",
      rulesTitle: "Aturan kursi",
      rule2: "Sebisa mungkin tidak ada yang dapat kursi sama dengan hari kerja sebelumnya.",
      rule3: "Tidak boleh tukar kursi tanpa alasan yang disetujui.",
      ruleAuto: "Nomor kursi tampil otomatis setiap pukul {jam} dan sama di semua HP.",
      ruleManual: "Setelah pukul {jam}, pilih nama lalu tekan Ambil nomor. Hasilnya sama di semua HP.",
      copyInvite: "Salin link undangan", admin: "Admin",
      sub: "{tim}dibuka tiap {jam}", drawNo: "UNDIAN KE-{n}", today: "Hari ini · {d}", latest: "Terakhir · {d}",
      opensAt: "Dibuka {jam}", pressDraw: "Tekan Ambil nomor dulu", pickFirst: "Pilih nama kamu dulu",
      firstDraw: "Ini undian pertama", notYet: "Undian berikutnya belum dibuka",
      opensDay: "Dibuka {hari}, {jam}", pickMsg: "Pilih nama kamu dulu.", pickDrawMsg: "Pilih nama kamu, lalu ambil nomor.",
      notIn: "Nama kamu tidak ada di undian hari ini.", posOf: "{no} dari {n}", fixed: "tetap", empty: "kosong",
      dayUnit: "h", yourTime: "{jam} waktu kamu", opened: "Nomor kursi hari ini sudah dibuka",
      shareFail: "Gagal membagikan. Coba simpan JPG.", savedWA: "Gambar tersimpan. Lampirkan di chat WhatsApp yang terbuka.",
      saved: "Gambar tersimpan", copied: "Link undangan tersalin", copyPrompt: "Salin link undangan:",
      imgName: "NAMA", imgSeat: "KURSI", imgCode: "KODE", noSwap: "Tidak boleh tukar kursi",
      listText: "Cek nomor kamu: {link}", cardText: "{judul} {tgl}: *{nama}* duduk di kursi *{no}*",
      needLink: "Butuh link undangan", linkBroken: "Link undangan ini tidak lengkap atau rusak.",
      needLead: "Buka link Lucky Seat yang dibagikan admin di grup WhatsApp.", official: "Link resmi berawalan",
      how1: "Buka grup WhatsApp", how1s: "Cari pesan dari admin berisi link Lucky Seat.",
      how2: "Ketuk link undangan", how2s: "Link itu otomatis terhubung ke daftar kursi tim kamu.",
      how3: "Pilih nama, ambil nomor", how3s: "Nomor kursimu langsung muncul dan tersimpan.",
      pastePh: "Tempel link undangan", pasteLabel: "Sudah punya link? Tempel di sini", openLink: "Buka", pasteBad: "Link tidak dikenali. Salin ulang link lengkap dari admin.",
      adminCta: "Hubungkan Google Sheet untuk membuat link undangan tim.",
      adminQ: "Admin?", connect: "Hubungkan data", loadFail: "Data tidak bisa dimuat", retry: "Coba lagi",
      source: "Sumber data", downloadTpl: "Unduh template", guide: "Panduan langkah demi langkah", testConnect: "Uji & hubungkan", pasteFirst: "Tempel {x} terlebih dahulu.",
      wrongKind: "Ini link {x}. Pindahkan pilihan ke {x}.",
      sheetLabel: "Link Google Sheet", sheetWrong: "Bukan link Google Sheet. Salin dari tombol Bagikan di Google Sheet.",
      sheetNote: "Paling mudah. Pemegang link bisa membuka isi sheet, jadi isi kolom nama saja.",
      sheetSteps: [
        "Buat tab <b>Anggota</b> berisi kolom <code>nama</code> (lihat templates/id).",
        "Buat tab <b>Pengaturan</b> untuk judul, jam, dan tanggal mulai.",
        "Klik Bagikan, ubah akses umum menjadi <b>Siapa saja yang memiliki link</b> sebagai Pelihat.",
        "Salin link sheet, lalu tempel di bawah.",
      ],
      sheetFoot: "Website hanya membaca sheet, tidak pernah mengubah isinya.",
      scriptLabel: "URL Web App", scriptWrong: "Bukan URL Web App. Salin URL berakhiran /exec dari Kelola deployment.",
      scriptNote: "Privasi ketat. Sheet tetap privat, yang keluar hanya nama depan dan nomor kursi.",
      scriptSteps: [
        "Biarkan sheet <b>Terbatas</b>. Buka Ekstensi, lalu Apps Script.",
        "Tempel isi <code>apps-script/Code.gs</code>, lalu simpan.",
        "Terapkan sebagai <b>Aplikasi web</b>: jalankan sebagai Saya, akses Siapa saja.",
        "Salin URL Web App, lalu tempel di bawah.",
      ],
      scriptFoot: "Apps Script hanya menulis hasil harian ke tab Riwayat yang tersembunyi.",
      connected: "Admin · Tersambung", ready: "Link undangan siap",
      summary: "{a} anggota · {k} kursi · dibuka {jam} · ambil {m}", manual: "manual", auto: "otomatis",
      inviteLink: "Link undangan", toMembers: "Bagikan ke anggota", oneLink: "1 link untuk semua",
      sendWA: "Kirim ke grup WhatsApp", copyLink: "Salin link", openPage: "Buka halaman undian",
      changeSource: "Ganti sumber data", selected: "Link sudah dipilih, tekan Ctrl+C",
      waMsg: "*{judul}*\nNomor kursi harian dibuka tiap pukul {jam} di link berikut:\n{url}\n\nSimpan link ini, ya.",
    },
    en: {
      locale: "en-GB",
      fileBlocked: "The page was opened directly from a file, so the browser blocks {src}. Open it via GitHub Pages or a local server (npx serve).", scriptNoNet: "Can't connect. Check your internet, or make sure the Web App is deployed with access \"Anyone\".", scriptNoData: "The server returned no data. Make sure the Web App link is right and access is \"Anyone\".", serverError: "Something went wrong on the server.", lang: "Language", scriptOutdated: "Apps Script v{s} doesn't match the website v{v}. Paste the latest Code.gs, then Manage deployments → New version.", themeDark: "Dark mode", themeLight: "Light mode",
      prevDay: "Previous day", nextDay: "Next day",
      yourName: "Your name", pickOpt: "Select name", seat: "Seat", draw: "Draw number",
      mPos: "Position", mWkt: "Drawn", mKode: "Draw code",
      nextDraw: "Next draw",
      shareList: "Share list to WA group", shareCard: "Share my card", saveJpg: "Save list as JPG",
      listTitle: "Seat list", sortBy: "Sort by", sortNo: "Number", sortName: "Name",
      rulesTitle: "Seat rules",
      rule2: "Where possible, nobody gets the same seat as on the previous workday.",
      rule3: "No seat swapping without an approved reason.",
      ruleAuto: "Seat numbers appear automatically every day at {jam} and are the same on every phone.",
      ruleManual: "After {jam}, select your name and press Draw number. Results are the same on every phone.",
      copyInvite: "Copy invite link", admin: "Admin",
      sub: "{tim}opens daily at {jam}", drawNo: "DRAW #{n}", today: "Today · {d}", latest: "Latest · {d}",
      opensAt: "Opens {jam}", pressDraw: "Press Draw number first", pickFirst: "Select your name first",
      firstDraw: "This is the first draw", notYet: "The next draw isn't open yet",
      opensDay: "Opens {hari}, {jam}", pickMsg: "Select your name first.", pickDrawMsg: "Select your name, then draw your number.",
      notIn: "Your name isn't in today's draw.", posOf: "{no} of {n}", fixed: "fixed", empty: "empty",
      dayUnit: "d", yourTime: "{jam} your time", opened: "Today's seat numbers are open",
      shareFail: "Couldn't share. Try saving the JPG.", savedWA: "Image saved. Attach it in the WhatsApp chat that opened.",
      saved: "Image saved", copied: "Invite link copied", copyPrompt: "Copy invite link:",
      imgName: "NAME", imgSeat: "SEAT", imgCode: "CODE", noSwap: "No seat swapping",
      listText: "Check your seat: {link}", cardText: "{judul} {tgl}: *{nama}* sits in seat *{no}*",
      needLink: "Invite link needed", linkBroken: "This invite link is incomplete or broken.",
      needLead: "Open the Lucky Seat link your admin shared in the WhatsApp group.", official: "Official links start with",
      how1: "Open the WhatsApp group", how1s: "Find your admin's message with the Lucky Seat link.",
      how2: "Tap the invite link", how2s: "It connects you to your team's seat list automatically.",
      how3: "Pick your name, draw a number", how3s: "Your seat number appears right away and is saved.",
      pastePh: "Paste the invite link", pasteLabel: "Already have the link? Paste it here", openLink: "Open", pasteBad: "Link not recognized. Copy the full link from your admin again.",
      adminCta: "Connect a Google Sheet to create your team's invite link.",
      adminQ: "Admin?", connect: "Connect data", loadFail: "Couldn't load data", retry: "Try again",
      source: "Data source", downloadTpl: "Download templates", guide: "Step-by-step guide", testConnect: "Test & connect", pasteFirst: "Paste the {x} first.",
      wrongKind: "This is a {x} link. Switch the option to {x}.",
      sheetLabel: "Google Sheet link", sheetWrong: "Not a Google Sheet link. Copy it from the Share button in Google Sheets.",
      sheetNote: "Easiest. Anyone with the link can open the sheet, so only fill in the name column.",
      sheetSteps: [
        "Create a <b>Members</b> tab with a <code>name</code> column (see templates/en).",
        "Create a <b>Settings</b> tab for title, time, and start date.",
        "Click Share and set general access to <b>Anyone with the link</b> as Viewer.",
        "Copy the sheet link and paste it below.",
      ],
      sheetFoot: "The website only reads the sheet and never changes it.",
      scriptLabel: "Web App URL", scriptWrong: "Not a Web App URL. Copy the URL ending in /exec from Manage deployments.",
      scriptNote: "Strict privacy. The sheet stays private; only first names and seat numbers leave it.",
      scriptSteps: [
        "Keep the sheet <b>Restricted</b>. Open Extensions, then Apps Script.",
        "Paste the contents of <code>apps-script/Code.gs</code> and save.",
        "Deploy as a <b>Web app</b>: execute as Me, access Anyone.",
        "Copy the Web App URL and paste it below.",
      ],
      scriptFoot: "Apps Script only writes daily results to the hidden Riwayat tab.",
      connected: "Admin · Connected", ready: "Invite link ready",
      summary: "{a} members · {k} seats · opens {jam} · {m} draw", manual: "manual", auto: "automatic",
      inviteLink: "Invite link", toMembers: "Share with members", oneLink: "1 link for everyone",
      sendWA: "Send to WhatsApp group", copyLink: "Copy link", openPage: "Open draw page",
      changeSource: "Change data source", selected: "Link selected, press Ctrl+C",
      waMsg: "*{judul}*\nDaily seat numbers open every day at {jam} at this link:\n{url}\n\nPlease save this link.",
    },
  };

  let lang = "en";
  try { const s = localStorage.getItem("ls-lang"); if (D[s]) lang = s; } catch {}

  const t = (k, v = {}) => {
    const s = D[lang][k] ?? D.id[k] ?? k;
    return typeof s === "string" ? s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "") : s;
  };
  function apply(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    root.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    root.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    sinkronTema();
  }
  function set(l) {
    if (!D[l] || l === lang) return false;
    lang = l;
    try { localStorage.setItem("ls-lang", l); } catch {}
    apply();
    return true;
  }
  // Bahasa bawaan dari sheet (baris "Bahasa"): hanya dipakai bila perangkat ini belum memilih sendiri.
  function bawaan(l) {
    let pilihan = null;
    try { pilihan = localStorage.getItem("ls-lang"); } catch {}
    if (pilihan || !D[l] || l === lang) return false;
    lang = l; apply();
    return true;
  }
  // ---------- Tema terang / gelap ----------
  // Bawaan ikut sistem; klik tombol → simpan pilihan di perangkat ini ("ls-theme").
  const mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  const html = document.documentElement;
  const temaKini = () => html.dataset.theme || (mq && mq.matches ? "dark" : "light");
  function sinkronTema() {
    const k = temaKini();
    html.dataset.themeNow = k;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = k === "dark" ? "#16140f" : "#f4efe6";
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      const lbl = k === "dark" ? t("themeLight") : t("themeDark");
      b.setAttribute("aria-label", lbl); b.title = lbl;
    });
  }
  try { const s = localStorage.getItem("ls-theme"); if (s === "dark" || s === "light") html.dataset.theme = s; } catch {}
  sinkronTema();
  if (mq) (mq.addEventListener ? mq.addEventListener("change", sinkronTema) : mq.addListener(sinkronTema));
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    const baru = temaKini() === "dark" ? "light" : "dark";
    html.dataset.theme = baru;
    try { localStorage.setItem("ls-theme", baru); } catch {}
    sinkronTema();
  });

  const ikonTema = `<svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>` +
    `<svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
  const themeBtn = () => `<button type="button" class="btn-theme" data-theme-toggle>${ikonTema}</button>`;

  // Tombol tema + ID | EN (dipakai di semua layar).
  const toggle = () => `<div class="tools">${themeBtn()}<div class="seg lang" role="group" data-i18n-aria="lang" aria-label="${t("lang")}">` +
    ["en", "id"].map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join("") + `</div></div>`;

  window.I18N = { t, apply, set, bawaan, toggle, themeBtn, get lang() { return lang; } };
})();
