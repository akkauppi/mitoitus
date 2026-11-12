"""Isolated baseline candidate and content-parity checkpoint (T01)."""
import argparse
import hashlib
import json
import shutil
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'lab/book'

class Audit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.events = []
        self.sheets = []
        self.claims = []
        self.drawings = 0
        self.panels = 0
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.events.append(['start', tag, sorted(attrs)])
        if tag == 'section' and 'sheet' in d.get('class', '').split():
            self.sheets.append(d['id'])
        if tag == 'article' and 'panel' in d.get('class', '').split():
            self.panels += 1
        if tag == 'svg':
            self.drawings += 1
        if tag == 'a' and 'proof' in d.get('class', '').split() and d.get('href', '').startswith('evidence.html#'):
            self.claims.append(d['href'].split('#')[1])
    def handle_endtag(self, tag):
        self.events.append(['end', tag])
    def handle_data(self, data):
        value = ' '.join(data.split())
        if value:
            self.events.append(['text', value])

def audit(text):
    parser = Audit()
    parser.feed(text)
    return parser

def build(output=OUTPUT):
    output = Path(output)
    # One explicit generated directory; symlinks and alternate destinations fail closed.
    if output.absolute() != OUTPUT or output.resolve() != OUTPUT:
        raise ValueError('Output must be the isolated lab/book directory')
    inventory = json.loads((ROOT/'lab/docs/scene-inventory.json').read_text())
    source = (ROOT/'index.html').read_bytes()
    if hashlib.sha256(source).hexdigest() != inventory['baselineSha256']:
        raise ValueError('Baseline changed: deliberately review inventory before building')
    checked = audit(source.decode())
    expected = [p['id'] for s in inventory['sheets'] for p in s['panels']]
    if checked.sheets != [s['id'] for s in inventory['sheets']] or checked.claims != expected:
        raise ValueError('Missing, duplicated or reordered sheet/panel')
    if (checked.panels, checked.drawings) != (33, 44):
        raise ValueError('Unexpected panel/drawing count')
    files = ['index.html','style.css','app.js','evidence.html','evidence.json','assignment-extract.txt','assets/aalto-logo.svg']
    # Public baseline assets only. Never traverse the development tree.
    files += ['downloads/README.txt']
    files += [f'downloads/{kind}-{unit}.{ext}' for kind in ['buildings','accessible','turning','rescue','tram','parking','street'] for unit in ['m','mm','ft'] for ext in ['dxf','svg']]
    files += [f'downloads/mitoitus-cad-{unit}.zip' for unit in ['m','mm','ft']]
    files += ['downloads/rulebook-offline.zip']
    if output.exists():
        raise ValueError('Output already exists; choose a deliberate clean rebuild')
    output.mkdir(parents=True)
    for name in files:
        src = ROOT/name
        if src.is_symlink() or not src.resolve().is_relative_to(ROOT):
            raise ValueError('Unsafe source path')
        dest = output/name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
    actual = audit((output/'index.html').read_text())
    if actual.events != checked.events:
        raise ValueError('Candidate semantic content drift')
    report = {'stage':'T01 baseline candidate; new layout not implemented', 'sheets':11,'panels':33,'drawings':44,'baselineSha256':inventory['baselineSha256'],'semanticSha256':hashlib.sha256(json.dumps(checked.events,ensure_ascii=False).encode()).hexdigest(),'files':files}
    (output/'parity.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--output-root', type=Path, default=OUTPUT)
    args = ap.parse_args()
    print(json.dumps(build(args.output_root), indent=2))
