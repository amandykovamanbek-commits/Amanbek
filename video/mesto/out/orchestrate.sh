#!/usr/bin/env bash
cd "$(dirname "$0")/.."
export NODE_PATH=$(npm root -g)
running() { ps aux | grep "render.cjs frames $1 " | grep -v grep | wc -l; }
started_a=0; started_b=0
while true; do
  if [ $started_a -eq 0 ] && [ $(running 1424) -eq 0 ]; then nohup node render.cjs frames 1230 1424 out/frames 1 > out/render_1230.log 2>&1 & started_a=1; echo "helper A started $(date +%H:%M)"; fi
  if [ $started_b -eq 0 ] && [ $(running 0) -eq 0 ]; then nohup node render.cjs frames 1040 1230 out/frames 1 > out/render_1040.log 2>&1 & started_b=1; echo "helper B started $(date +%H:%M)"; fi
  n=$(ps aux | grep "render.cjs frames" | grep -v grep | wc -l)
  if [ $started_a -eq 1 ] && [ $started_b -eq 1 ] && [ $n -eq 0 ]; then break; fi
  sleep 20
done
echo "ALL DONE frames=$(ls out/frames | wc -l) $(date +%H:%M)"
