#!/usr/bin/env bash
# yt1/mix.sh silent.mp4 out.mp4 : voice + SFX + music bed, loudnorm to -14 LUFS, mux
set -euo pipefail
cd "$(dirname "$0")"
PRE="[0:a]aresample=48000,apad=pad_dur=3[v];[1:a]volume=0.25[s];[2:a]volume=${MUS:-0.07}[m];[v][s][m]amix=inputs=3:duration=longest:normalize=0"
J=$(ffmpeg -hide_banner -i audio/voice.mp3 -i audio/sfx.wav -i audio/music.wav -filter_complex "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i audio/voice.mp3 -i audio/sfx.wav -i audio/music.wav -filter_complex \
  "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000[a]" \
  -map "[a]" -c:a pcm_s16le audio/mix.wav
ffmpeg -v error -y -i "$1" -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$2"
