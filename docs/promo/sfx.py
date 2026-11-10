"""Efek suara video promo, disintesis (tanpa file musik, bebas hak cipta).
Membaca daftar peristiwa dari promo.html (window.AUDIO, ditulis render.js ke JSON),
lalu menulis WAV mono 44,1 kHz.  Pakai: python3 sfx.py audio.json keluar.wav
"""
import json, math, random, struct, sys, wave

SR = 44100
cfg = json.load(open(sys.argv[1]))
N = int(SR * cfg["dur"])
buf = [0.0] * N
random.seed(7)


def add(t0, fn, length, gain=1.0):
    s = int(t0 * SR)
    for i in range(int(length * SR)):
        j = s + i
        if 0 <= j < N:
            buf[j] += gain * fn(i / SR)


tick = lambda t: math.sin(2 * math.pi * 2400 * t) * math.exp(-t * 180)
click = lambda t: (math.sin(2 * math.pi * 1100 * t) * .6 + random.uniform(-1, 1) * .4) * math.exp(-t * 90)
ding = lambda t: sum(a * math.sin(2 * math.pi * f * t) for f, a in ((880, .6), (1320, .3), (1760, .15))) * math.exp(-t * 4)
kick = lambda t: math.sin(2 * math.pi * (50 + 120 * math.exp(-t * 30)) * t) * math.exp(-t * 9)
hat = lambda t: random.uniform(-1, 1) * math.exp(-t * 120)
thump = lambda t: math.sin(2 * math.pi * (90 + 200 * math.exp(-t * 25)) * t) * math.exp(-t * 12)
pop = lambda t: math.sin(2 * math.pi * (600 + 900 * math.exp(-t * 60)) * t) * math.exp(-t * 70)
chime = lambda t: ding(t) + .5 * ding(t * 1.5)
SUARA = {"tick": (tick, .05), "click": (click, .12), "ding": (ding, 1.6), "thump": (thump, .4), "pop": (pop, .1), "chime": (chime, 2.5)}

# ketukan 120 BPM dari adegan kedua sampai adegan penutup
b = cfg["beatFrom"]
while b < cfg["beatTo"] - .01:
    add(b, kick, .35, .55)
    add(b + .25, hat, .06, .12)
    b += .5
for e in cfg["events"]:
    fn, ln = SUARA[e["type"]]
    add(e["t"], fn, ln, e["g"])

g = .89 / max(abs(x) for x in buf)  # puncak sekitar -1 dB
fade = int(.4 * SR)
for i in range(fade):
    buf[N - 1 - i] *= i / fade
w = wave.open(sys.argv[2], "w")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x * g)) * 32767)) for x in buf))
w.close()
