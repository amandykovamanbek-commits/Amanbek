#!/bin/bash
# mux the silent Remotion render with the mix (Remotion writes a silent audio track: take video from 0, audio from 1),
# then frame-by-frame QA. usage: scripts/finish_v1.sh <silent.mp4> <out.mp4> <qa dir>
set -e
ffmpeg -y -v error -i "$1" -i ../audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$2"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,nb_frames -of compact "$2"
python3 scripts/pisa_shots.py out/v1/shots.json > /dev/null
python3 scripts/short_qa.py "$2" "$3" out/v1/shots.json | tail -40
