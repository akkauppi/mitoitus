from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
for unit in ['m','mm','ft']:
 with zipfile.ZipFile(ROOT/f'downloads/mitoitus-cad-{unit}.zip','w',zipfile.ZIP_DEFLATED) as z:
  for kind in ['accessible','rescue','street']:
   for ext in ['dxf','svg']:
    p=ROOT/f'downloads/{kind}-{unit}.{ext}';z.write(p,p.name)
  z.writestr('README.txt',(ROOT/'downloads/README.txt').read_text()+f'\nTHIS BUNDLE: {unit}\n')
  z.writestr('evidence.html',(ROOT/'evidence.html').read_text().replace('href="index.html"','href="https://akkauppi.github.io/mitoitus/"'))
  for name in ['evidence.json','assignment-extract.txt']:z.write(ROOT/name,name)
print('Built 3 CAD bundles with evidence')
