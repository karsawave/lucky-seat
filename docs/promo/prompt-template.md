# Template prompt video motion

Template ini dipakai untuk meminta video promo baru dengan gaya lain tanpa kehilangan standar yang sudah dipakai di video Lucky Seat v1.1.5. Salin blok di bawah, isi bagian `[...]`, lalu kirim ke Claude.

Bagian **ISIAN** dan **GAYA** boleh diganti tiap kali. Bagian **ATURAN TETAP** jangan diubah: bagian itulah yang menjaga semua video tetap konsisten.

## Prompt lengkap

```text
PERAN
Kamu editor video dan motion designer. Buat video promo motion untuk produk di bawah,
dirender frame demi frame dari satu template HTML (sumber di docs/promo/), dengan layar asli produk.

ISIAN
- Produk: [nama produk + satu kalimat fungsinya]
- Penonton: [siapa yang menonton, mis. admin kantor yang memakai hot desk]
- Platform: [WhatsApp Status / Reels / TikTok / LinkedIn / YouTube]
- Rasio dan durasi: [9:16 25 dtk] [9:16 15 dtk] [16:9 25 dtk]
- Bahasa: [ID / EN / keduanya]
- Tokoh contoh: [nama, mis. Roma] dengan data contoh dari template produk
- Pesan utama (satu kalimat): [mis. "Nomor kursi diundi otomatis, sama di semua HP."]
- Ajakan di akhir: [URL / "Link di bio" / QR code]

GAYA (ganti bagian ini untuk gaya lain)
- Nama gaya: [mis. Editorial minimal / Playful / Dark tech / Corporate clean]
- Palet: pakai token warna produk saja. Peran latar per adegan: [hook = accent, masalah = ink, konten = paper, WhatsApp = wa, penutup = ink]
- Tipografi: [font display + font mono produk]; skala judul/besar/merek/teks = [112/128/150/54 px pada 1080 lebar]
- Karakter gerak: [mis. ease-out cubic, tanpa memantul] atau [pegas ringan, sedikit overshoot]
- Transisi: [wipe dari bawah 0,42 dtk] atau [potong langsung di ketukan] atau [zoom-through]
- Musik: [marimba / ceria / lofi / tech / file sendiri], 120 BPM, tanpa vokal
- Hal khas gaya: [mis. tekstur kertas, grid, glow, ilustrasi garis]; maksimal satu

ATURAN TETAP (jangan diubah)
1. Struktur cerita
   - 0 sampai 2 dtk: HOOK. Hasil akhir langsung terlihat (mis. angka kursi bergulir lalu berhenti), bukan logo.
   - Masalah konkret dalam satu kalimat, lalu jawabannya dalam satu kalimat.
   - Merek.
   - Demo layar asli, satu langkah per caption bernomor (1, 2, centang).
   - Bukti (mis. "Sama di semua HP" dengan tiga layar identik).
   - Fitur berbagi (gambar asli yang dihasilkan aplikasi).
   - Penutup: merek, satu kalimat manfaat, ajakan. Lalu fade ke warna latar penutup.
   - Versi 15 dtk: hook, jawaban, demo, berbagi, penutup.
2. Layar asli, bukan mockup
   - Ambil tangkapan dari situs sungguhan (capture.js), 412 px lebar, 6x kerapatan piksel, jam dibekukan.
   - Data, nama, timer, dan gambar hasil harus konsisten di semua tangkapan.
   - Tanpa bingkai HP palsu, bayangan tebal, atau data karangan yang tidak cocok.
3. Tata letak
   - Margin kiri 90 px; kanan 150 px pada 9:16 (aman dari tombol Reels/TikTok).
   - Judul mulai 270 px dari atas pada 9:16 (aman dari tab aplikasi).
   - Teks penting tidak boleh di 25% bawah layar 9:16.
   - 16:9: teks di kolom kiri, media di kanan; QR code di penutup.
   - Tidak ada teks atau elemen yang terpotong; baris dibagi seimbang (text-wrap: balance), tidak ada satu kata sendirian di baris terakhir.
4. Gerak
   - Satu kurva dan satu jarak gerak untuk semua elemen masuk; satu jenis transisi antar adegan.
   - Zoom kamera ke layar aplikasi tidak memotong teks; tepi area tampilan memakai fade halus.
   - Perubahan status UI berganti langsung seperti aslinya, tanpa crossfade yang membuat teks bertumpuk.
   - 60 fps.
5. Suara
   - Efek suara disinkronkan ke peristiwa (tik saat angka bergulir, klik saat ketuk, ding saat berhenti).
   - Musik di bawah efek suara, tempo sama dengan potongan adegan, akord penutup di kartu akhir.
   - Puncak audio sekitar -1 sampai -2 dB, tidak pecah. Musik harus bebas royalti; sebutkan lisensinya.
6. Teks (anti AI slop, sesuai CLAUDE.md)
   - Tanpa em dash, elipsis, tanda seru, kalimat tanya retoris, kelompok tiga yang dipaksakan.
   - Tanpa kata hype (mis. sangat, solusi, canggih, seamless, powerful).
   - Satu ide per kalimat, kata kerja di depan untuk langkah. Klaim harus sesuai dengan kerja aplikasi.
   - Teks ID dan EN bermakna sama.
7. Kualitas dan pengecekan
   - H.264 CRF 14, yuv420p, AAC 256 kbps, faststart.
   - Sebelum render penuh: preview beberapa frame per adegan.
   - Setelah render: periksa frame tiap 0,5 dtk dan titik tengah tiap transisi; cek durasi dan level audio.
   - Laporkan cacat yang ditemukan dan cara memperbaikinya.

HASIL YANG DIMINTA
- Video sesuai daftar rasio/durasi/bahasa di atas, dan sampul untuk tiap rasio.
- GIF demo 720 px (opsional) dan teks caption posting ID/EN.
- Sumber diperbarui di docs/promo/, di-commit dan di-push ke branch kerja.
- Ringkasan: apa yang berubah dari gaya sebelumnya dan apa yang sengaja dipertahankan.
```

## Prompt singkat

Kalau sumber video di `docs/promo/` sudah ada, cukup kirim ini:

```text
Buat versi baru video promo dari docs/promo/ dengan gaya [nama gaya].
Ganti hanya: palet per adegan [...], karakter gerak [...], transisi [...], musik [...].
Pertahankan semua ATURAN TETAP di docs/promo/prompt-template.md.
Render [rasio, durasi, bahasa], periksa frame per frame, lalu kirim hasilnya.
```

## Contoh isian gaya

| Gaya | Palet per adegan | Gerak | Transisi | Musik |
|---|---|---|---|---|
| Editorial minimal (v1.1.5) | Hook accent, masalah ink, konten paper, WhatsApp wa, penutup ink | Ease-out cubic, tanpa memantul | Wipe dari bawah 0,42 dtk | Marimba |
| Playful | Lebih banyak accent dan wa, latar paper | Pegas ringan, sedikit overshoot | Potong di ketukan dengan pop | Ceria |
| Dark tech | Ink di semua adegan, accent untuk sorotan | Cepat dan tegas, ease-in-out | Zoom-through | Tech |
| Kalem | Paper di semua adegan, ink untuk teks | Lambat, fade panjang | Crossfade 0,6 dtk | Lo-fi |

Tips: ganti satu atau dua hal saja dalam satu kali permintaan. Kalau semuanya diganti sekaligus, sulit melihat bagian mana yang membuat hasilnya lebih baik atau lebih buruk.
