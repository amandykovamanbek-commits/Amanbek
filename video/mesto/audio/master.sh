#!/usr/bin/env bash
# gentle compression (keeps the drama, lifts quiet scenes), two-pass loudnorm to -15 LUFS, safe true peak
set -euo pipefail
cd "$(dirname "$0")"
C="acompressor=threshold=0.05:ratio=2.2:attack=25:release=350:knee=4:makeup=1.6"
J=$(ffmpeg -hide_banner -i mix_pre.wav -af "$C,loudnorm=I=-15:TP=-2:LRA=16:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i mix_pre.wav -af "$C,loudnorm=I=-15:TP=-2:LRA=16:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,alimiter=limit=0.75:attack=1:release=80:level=false,aresample=48000" -c:a pcm_s16le mix.wav
ffmpeg -hide_banner -i mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
