#!/usr/bin/env bash
# mix.sh silent.mp4 out.mp4 : voice + music (ducked under voice) + sfx, two-pass loudnorm -14 LUFS, mux AAC
set -euo pipefail
cd "$(dirname "$0")"
PRE="[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=pad_dur=4,asplit=2[v][key];[1:a]volume=0.32[m];[m][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350:makeup=1[md];[2:a]volume=0.22[s];[v][md][s]amix=inputs=3:duration=first:normalize=0"
J=$(ffmpeg -hide_banner -i audio/voice.wav -i audio/music.wav -i audio/sfx.wav -filter_complex "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i audio/voice.wav -i audio/music.wav -i audio/sfx.wav -filter_complex \
  "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000[a]" \
  -map "[a]" -c:a pcm_s16le audio/mix.wav
if [ $# -ge 2 ]; then ffmpeg -v error -y -i "$1" -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$2"; fi
