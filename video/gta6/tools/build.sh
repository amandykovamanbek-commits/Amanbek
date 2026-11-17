#!/usr/bin/env bash
# tools/build.sh [scale]  -> out/gta6.mp4 (scale 1 = 1080p, 0.5 = preview 540p)
set -euo pipefail
cd "$(dirname "$0")/.."
SCALE="${1:-1}"
mkdir -p out
python3 tools/timing.py
python3 tools/audio.py
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
SUF=$([ "$SCALE" = "1" ] && echo "" || echo "_preview")
( cd remotion && npx remotion render src/index.ts GTA6 ../out/silent$SUF.mp4 --browser-executable=$B --concurrency=4 --crf=18 --scale=$SCALE --log=error )
J=$(ffmpeg -hide_banner -i audio/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i audio/premix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le audio/mix.wav
ffmpeg -v error -y -i out/silent$SUF.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/gta6$SUF.mp4
ls -la out/gta6$SUF.mp4
