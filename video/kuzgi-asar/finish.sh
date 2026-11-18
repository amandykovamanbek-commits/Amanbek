#!/usr/bin/env bash
# finish.sh : loudnorm the mix, bake the poster into frame 0, mux -> brag-output/brag.mp4
set -euo pipefail
cd "$(dirname "$0")"
W=brag-output/work
node audio.cjs $W/mix_raw.wav
ffmpeg -v error -y -i $W/mix_raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 $W/mix.wav
POSTER=${POSTER:-2610}
npx remotion still KuzgiAsar brag-output/brag.jpg --frame=$POSTER --image-format=jpeg --jpeg-quality=92 --log=error
# replace frame 0 with the poster (same duration, audio sync unchanged)
ffmpeg -v error -y -i $W/silent.mp4 -loop 1 -i brag-output/brag.jpg -filter_complex \
  "[1:v]scale=1920:1080,format=yuv420p,trim=end_frame=1,setpts=PTS-STARTPTS[p];[0:v]trim=start_frame=1,setpts=PTS-STARTPTS[r];[p][r]concat=n=2:v=1:a=0,fps=30[v]" \
  -map "[v]" -i $W/mix.wav -map 2:a -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart brag-output/brag.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 brag-output/brag.mp4
