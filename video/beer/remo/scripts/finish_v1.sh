#!/bin/bash
# v1 assembly: JPEG sequence (frames 0-759 recovered from the interrupted encode, 760-2089 rendered as a sequence)
# + the mix -> h264 / aac mp4, then frame-by-frame QA.  usage: scripts/finish_v1.sh <out.mp4> <crf>
set -e
n=$(ls out/v1/seq/element-*.jpeg | wc -l)
[ "$n" -eq 2090 ] || { echo "sequence has $n frames, expected 2090"; exit 1; }
ffmpeg -y -v error -framerate 30 -i out/v1/seq/element-%04d.jpeg -i ../audio/mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -crf "${2:-16}" -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$1"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,nb_frames -of compact "$1"
