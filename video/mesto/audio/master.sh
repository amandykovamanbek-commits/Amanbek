#!/usr/bin/env bash
# two-pass loudness normalisation to -16 LUFS / -1.5 dBTP (cinematic dynamics), output 48k stereo
set -euo pipefail
cd "$(dirname "$0")"
J=$(ffmpeg -hide_banner -i mix_pre.wav -af loudnorm=I=-16:TP=-1.5:LRA=18:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i mix_pre.wav -af "loudnorm=I=-16:TP=-1.5:LRA=18:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,alimiter=limit=0.84:attack=3:release=60,aresample=48000" -c:a pcm_s16le mix.wav
ffmpeg -hide_banner -i mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|LRA:|Peak:"
