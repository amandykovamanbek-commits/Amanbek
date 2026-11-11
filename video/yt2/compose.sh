#!/usr/bin/env bash
# yt2/compose.sh silent.mp4 out_with_banner.mp4 START : overlay the Chik-Chirik VPN banner (alpha .mov, 15 s) at START seconds
set -euo pipefail
cd "$(dirname "$0")"
S=$3
ffmpeg -v error -y -i "$1" -i assets/ChikChirikVPN.mov -filter_complex \
  "[1:v]format=rgba,fps=60,setpts=PTS-STARTPTS+${S}/TB[b];[0:v][b]overlay=0:-67:eof_action=pass:format=auto,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -preset medium -crf 18 -r 60 -pix_fmt yuv420p "$2"
