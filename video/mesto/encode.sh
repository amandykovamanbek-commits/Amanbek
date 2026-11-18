#!/usr/bin/env bash
# encode frames + mastered audio into the final film
set -euo pipefail
cd "$(dirname "$0")"
OUT="out/Твоё место за столом.mp4"
ffmpeg -v error -y -framerate 24 -i out/frames/f_%05d.jpg -i audio/mix.wav \
  -c:v libx264 -preset slow -crf 20 -tune film -maxrate 9M -bufsize 18M -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart \
  -metadata title="Твоё место за столом" "$OUT"
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1 "$OUT"
