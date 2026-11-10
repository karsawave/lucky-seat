"""Musik latar orisinal untuk video promo (disintesis, bebas royalti, tanpa kredit).
Struktur mengikuti linimasa video dari render.js (window.AUDIO):
  0 sampai beatFrom   intro di bawah hook
  beatFrom-beatTo     groove penuh 120 BPM
  beatTo sampai akhir akord tonik + chime, lalu memudar
Gaya: marimba (dipakai di video), ceria, lofi, tech.
Pakai: python3 music.py audio.json keluar.wav [gaya]
"""
import json
import sys
import numpy as np

SR = 44100
BPM = 120.0
BEAT = 60 / BPM
_cfg = json.load(open(sys.argv[1]))
DUR, T0, TEND = _cfg["dur"], _cfg["beatFrom"], _cfg["beatTo"]
N = int(SR * DUR)
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=.005, d=.1, s=.6, r=.2, length=None):
    """ADSR dalam sampel; length = durasi not (detik)."""
    t = np.arange(n) / SR
    L = length if length is not None else n / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((t - L) / r, 0, 1)
    return e * (1 - rel)


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N:
            return
        sig = sig[: N - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
        self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


# ---------- instrumen ----------
def pluck(f, dur, bright=.5):
    """Karplus-Strong: petikan ala ukulele/gitar."""
    n = int(SR * dur)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    out = np.empty(n)
    k = .5 + bright * .49
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = k * buf[i % p] + (1 - k) * buf[(i + 1) % p]
        buf[i % p] *= .996
    return out * env(n, .002, .05, .7, .05, dur - .05)


def epiano(f, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    idx = 1.6 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    s += .25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 4)
    return s * env(n, .004, .4, .45, .25, dur - .1) * (1 + .12 * np.sin(2 * np.pi * 5 * t))


def marimba(f, dur):
    n = int(SR * min(dur, .9))
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .35 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 22)
    return s * np.minimum(1, t / .002)


def saw_synth(f, dur, cutoff=1800):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, int(min(cutoff, 8000) / f) + 1))
    return s * .5 * env(n, .004, .08, .3, .06, dur - .03)


def pad(freqs, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 1.003 * t) for f in freqs) / len(freqs)
    return s * env(n, .6, .3, .8, .8, dur - .6)


def bass(f, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t)
    return np.tanh(1.5 * s) * env(n, .005, .1, .7, .05, dur - .05)


def kick():
    n = int(SR * .35)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * (50 * t + 120 / 30 * (1 - np.exp(-t * 30)))) * np.exp(-t * 9)


def snare():
    n = int(SR * .25)
    t = np.arange(n) / SR
    return (rng.uniform(-1, 1, n) * .7 + .4 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 18)


def clap():
    n = int(SR * .2)
    t = np.arange(n) / SR
    e = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, .01, .022))
    return rng.uniform(-1, 1, n) * e * .5


def hat(open_=False):
    n = int(SR * (.18 if open_ else .05))
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = np.diff(x, prepend=0)  # tinggi
    return x * np.exp(-t * (25 if open_ else 110))


def shaker():
    n = int(SR * .08)
    t = np.arange(n) / SR
    return rng.uniform(-1, 1, n) * np.sin(np.pi * t / .08) ** 2


def chime(f):
    n = int(SR * 3)
    t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * dcy) for m, a, dcy in ((1, .6, 1.5), (2.01, .25, 3), (3.02, .1, 5)))


# ---------- efek ----------
def reverb(x, mix=.18):
    out = x.copy()
    for d, g in ((.031, .5), (.047, .45), (.061, .4), (.089, .35), (.113, .3)):
        k = int(d * SR)
        y = np.zeros_like(x)
        y[k:] = x[:-k]
        for _ in range(3):
            y2 = np.zeros_like(y)
            y2[k:] = y[:-k] * g
            y = y + y2
        out += y * mix * g
    return out


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


# ---------- komposisi ----------
def beats(t_from, t_to, step=BEAT):
    t = t_from
    while t < t_to - 1e-6:
        yield t
        t += step


STYLES = {
    # akord (MIDI) per bar, nada bass, skala melodi
    "ceria":   dict(chords=[[60, 64, 67], [55, 59, 62, 67], [57, 60, 64], [53, 57, 60, 65]], root=[48, 43, 45, 41], tonic=[60, 64, 67, 72]),
    "lofi":    dict(chords=[[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], root=[41, 40, 38, 36], tonic=[48, 52, 55, 59, 64]),
    "tech":    dict(chords=[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], root=[45, 41, 36, 43], tonic=[57, 60, 64, 69]),
    "marimba": dict(chords=[[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], root=[50, 47, 43, 45], tonic=[62, 66, 69, 74]),
}
# motif melodi: (ketukan dalam bar, indeks nada akord, oktaf+, panjang ketukan)
MOTIF = [(0, 2, 1, .5), (.5, 1, 1, .5), (1, 0, 1, 1), (2.5, 1, 1, .5), (3, 2, 1, 1)]
MOTIF_B = [(0, 0, 1, .5), (.75, 1, 1, .25), (1, 2, 1, .5), (2, 1, 1, 1), (3.5, 0, 1, .5)]


def compose(style):
    S = STYLES[style]
    mus, drm = Bus(), Bus()
    bar = 4 * BEAT
    nbars = int(np.ceil((TEND - T0) / bar))

    # INTRO (hook): pad akord tonik pelan + nada naik
    mus.add(0, pad([mtof(m) for m in S["chords"][0]], T0 + .4), .35)
    for i, m in enumerate(S["chords"][0] + [S["chords"][0][0] + 12]):
        f = mtof(m + 12)
        tone = {"ceria": lambda: pluck(f, .5, .7), "lofi": lambda: epiano(f, .6), "tech": lambda: saw_synth(f, .3),
                "marimba": lambda: marimba(f, .5)}[style]()
        mus.add(.25 + i * .22, tone, .35, pan=-.3 + i * .2)

    # GROOVE
    for b in range(nbars):
        tb = T0 + b * bar
        if tb >= TEND:
            break
        ch, rt = S["chords"][b % 4], S["root"][b % 4]
        last = TEND - tb
        # akord
        if style == "ceria":
            for k, off in enumerate((0, .75, 1.5, 2, 2.75, 3.5)):
                if off * BEAT < last:
                    for j, m in enumerate(ch):
                        mus.add(tb + off * BEAT + j * .012, pluck(mtof(m), .45, .6), .16, pan=.25)
        elif style == "lofi":
            mus.add(tb, sum(epiano(mtof(m), min(bar, last)) for m in ch) / len(ch), .5, pan=-.1)
        elif style == "tech":
            arp = ch + [ch[0] + 12]
            for k, t in enumerate(beats(tb, min(tb + bar, TEND), BEAT / 4)):
                mus.add(t, saw_synth(mtof(arp[k % len(arp)] + 12), BEAT / 4 * .9, 2400), .1, pan=(-.4 if k % 2 else .4))
            mus.add(tb, pad([mtof(m) for m in ch], min(bar, last)), .18)
        else:  # marimba
            for k, t in enumerate(beats(tb, min(tb + bar, TEND), BEAT / 2)):
                mus.add(t, marimba(mtof(ch[(k * 2) % len(ch)] + (12 if k % 4 == 3 else 0)), .4), .22, pan=.2)
            mus.add(tb, pad([mtof(m) for m in ch], min(bar, last)), .12)
        # bass
        for off, ln in ((0, 1.5), (1.5, .5), (2, 1.5), (3.5, .5)):
            if off * BEAT < last:
                mus.add(tb + off * BEAT, bass(mtof(rt + (12 if off == 3.5 else 0)), ln * BEAT * .9), .32)
        # melodi (bar ganjil memakai variasi)
        if b >= 1:
            for off, idx, octv, ln in (MOTIF if b % 2 else MOTIF_B):
                if off * BEAT < last:
                    f = mtof(ch[idx % len(ch)] + 12 * octv)
                    tone = {"ceria": lambda: pluck(f, ln * BEAT + .2, .8), "lofi": lambda: epiano(f, ln * BEAT + .2),
                            "tech": lambda: saw_synth(f, ln * BEAT, 3000), "marimba": lambda: marimba(f, ln * BEAT + .3)}[style]()
                    mus.add(tb + off * BEAT, tone, .22 if style != "tech" else .14, pan=-.15)
        # drum
        swing = .06 if style == "lofi" else 0
        for k, t in enumerate(beats(tb, min(tb + bar, TEND), BEAT / 2)):
            onbeat = k % 2 == 0
            if onbeat and (k // 2) % 2 == 0:
                drm.add(t, kick(), .7 if style != "lofi" else .5)
            if onbeat and (k // 2) % 2 == 1:
                drm.add(t, clap() if style in ("ceria", "marimba") else snare(), .45 if style != "lofi" else .3)
            tt = t + (0 if onbeat else swing)
            if style == "ceria" or style == "marimba":
                drm.add(tt, shaker(), .1, pan=.4)
            else:
                drm.add(tt, hat(open_=(style == "tech" and not onbeat and k % 4 == 3)), .12, pan=.3)

    # PENUTUP: akord tonik panjang + chime
    tonic = [mtof(m) for m in S["tonic"]]
    for j, f in enumerate(tonic):
        tone = {"ceria": lambda: pluck(f, 3.2, .7), "lofi": lambda: epiano(f, 3.2), "tech": lambda: pad([f], 3.2),
                "marimba": lambda: marimba(f, 1.0)}[style]()
        mus.add(TEND + j * .03, tone, .22)
    mus.add(TEND, pad(tonic[:3], 3.4), .25)
    mus.add(TEND, bass(mtof(S["root"][0]), 2.5), .3)
    mus.add(TEND + .1, chime(mtof(S["tonic"][-1] + 12)), .15)
    drm.add(TEND, kick(), .6)

    L = reverb(mus.L) + drm.L * .9
    R = reverb(mus.R) + drm.R * .9
    if style == "lofi":
        crackle = (rng.random(N) < .0002) * rng.uniform(-.12, .12, N) + rng.normal(0, .0008, N)
        L, R = lowpass(L, 5500) + crackle, lowpass(R, 5500) + crackle
    st = np.stack([L, R])
    st = np.tanh(st * 1.2 / np.max(np.abs(st)))  # sedikit "lem" pada mix
    fade = int(.6 * SR)
    st[:, -fade:] *= np.linspace(1, 0, fade)
    st *= .89 / np.max(np.abs(st))  # puncak ~ -1 dB
    return st


if __name__ == "__main__":
    out = sys.argv[2]
    style = sys.argv[3] if len(sys.argv) > 3 else "marimba"
    st = compose(style)
    import wave
    pcm = (st.T * 32767).astype("<i2").tobytes()
    w = wave.open(out, "w")
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm); w.close()
    print(out)
