import json, sys, time
from faster_whisper import WhisperModel
t0 = time.time()
m = WhisperModel(sys.argv[3] if len(sys.argv) > 3 else 'small', device='cpu', compute_type='int8', download_root=sys.argv[4] if len(sys.argv) > 4 else None)
import subprocess, numpy as np
aud = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, dtype=np.float32)
segs, info = m.transcribe(aud, language='ru', word_timestamps=True, beam_size=5, vad_filter=False,
                          initial_prompt='Клод, ИлевенЛабс, Фигма, Канва, видАйКью, Ноушн, ГитХаб, скилл брэг слим, криэйтор, дип ресёрч, Ремоушн.')
out = []
for s in segs:
    for w in s.words: out.append({'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
print('words', len(out), 'time', round(time.time() - t0, 1))
