"""Parse СЦЕНАРИЙ.md section 6 into chapters -> tools/chapters.json (voiceover text per chapter)."""
import re, json, pathlib
here = pathlib.Path(__file__).parent.parent
md = (here / 'СЦЕНАРИЙ.md').read_text()
sec = md.split('## 6. Сценарий')[1].split('## 7.')[0]
parts = re.split(r'\n### ', sec)[1:]
out = []
for p in parts:
    lines = p.strip().split('\n')
    head = lines[0].strip()
    paras = []
    for l in lines[1:]:
        l = l.strip()
        if not l or l.startswith('**Кадр') or l == '---': continue
        if l.startswith('> УДЕРЖАНИЕ:'): l = l.split(':', 1)[1].strip(); paras.append(l); continue
        paras.append(l)
    text = '\n\n'.join(paras)
    out.append({'head': head, 'text': text, 'chars': len(text)})
for i, c in enumerate(out): print(i, c['head'], c['chars'])
print('total', sum(c['chars'] for c in out), 'ch0-11', sum(c['chars'] for c in out[:12]), 'rest', sum(c['chars'] for c in out[12:]))
(here / 'tools' / 'chapters.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
