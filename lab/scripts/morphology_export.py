"""Build the static morphology supplement from validated synthetic packages."""
import json
import subprocess
from html import escape
from reference_export import PUBLIC_URL, SPREAD_PATHS

LAB_PAGE = 'morphology/index.html'
CATALOGUE = 'data/index.html'
DATA = 'data/morphology/'
MORPHOLOGY_FILES = (
    LAB_PAGE, 'morphology/lab.js', CATALOGUE, DATA+'measurements.json',
    DATA+'exchange.schema.json', DATA+'fixtures.json', DATA+'example-package.json', DATA+'CITYMODEL-INTEGRATION.md',
)
SOURCE_FILES = (
    'lab/data/morphology/measurements.json', 'lab/data/morphology/exchange.schema.json',
    'lab/docs/CITYMODEL-INTEGRATION.md',
    *(f'lab/morphology/{name}.mjs' for name in (
        'geometry', 'exchange', 'fixtures', 'import', 'render', 'ui', 'publish')),
)


def html_page(title, description, path, body, extra=''):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Dubious</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{PUBLIC_URL+path}">
<style>
:root{{font:1rem/1.5 system-ui,sans-serif;color:#222b26;background:#faf9f4}}
body{{max-width:73rem;margin:0 auto;padding:1rem}}a{{color:#285143}}
h1,h2,h3{{line-height:1.13}}nav{{display:flex;flex-wrap:wrap;gap:.4rem 1.25rem}}
.grid{{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:1.5rem}}
figure{{margin:0}}figcaption{{font-size:.85rem}}svg{{display:block;width:100%;max-height:19rem;background:#f0f1e9}}
svg .building{{fill:#e6daba;stroke:#8a7855;stroke-width:.22}}svg .study{{fill:#e9ebd9;stroke:#71785e;stroke-width:.22}}
svg .court{{fill:#c9d6ad;fill-opacity:.8;stroke:#697a54;stroke-width:.25;stroke-dasharray:.75,.55}}
svg .transect{{fill:none;stroke:#54758a;stroke-width:.36;stroke-dasharray:1,.6}}
svg .floor,svg .scale-line{{fill:none;stroke:#736242;stroke-width:.22}}
#elevation svg{{max-height:9rem}}.summary{{display:grid;grid-template-columns:1fr auto;gap:.45rem 1rem}}
dd{{margin:0;text-align:right;font-variant-numeric:tabular-nums}}form{{border-block:1px solid #a8ad9c;padding:.8rem 0}}
#sliders{{display:grid;gap:.45rem}}#sliders label{{display:grid;grid-template-columns:minmax(9rem,1fr) 1fr;gap:.5rem}}
input[type=range]{{accent-color:#57715b}}
output{{font-variant-numeric:tabular-nums;font-weight:650}}button,select{{font:inherit;margin:.4rem .3rem .1rem 0}}
table{{border-collapse:collapse;width:100%;margin:.6rem 0}}th,td{{text-align:left;padding:.3rem .4rem;border-bottom:1px solid #bcc2af}}
details{{margin:.5rem 0}}summary{{cursor:pointer}}
@media(max-width:640px){{.grid{{grid-template-columns:1fr;gap:.8rem}}}}
@media print{{form,nav{{display:none}}body{{padding:0}}}}
</style>{extra}</head><body>{body}</body></html>
""".encode()


def build_morphology(root, edition):
    source = lambda path: (root/path).read_bytes()
    result = json.loads(subprocess.check_output(['node', str(root/'lab/morphology/publish.mjs')]))
    fixtures = result['fixtures']
    if not fixtures or any(item['exchange']['kind'] != 'synthetic' for item in fixtures):
        raise ValueError('Only the reviewed synthetic fixture collection is in the release allowlist')
    body = f"""<nav><a href="../index.html">3D rulebook</a><a href="../{CATALOGUE}">Open data</a>
<a href="#compute">Compute</a><a href="#observe">Observe</a></nav>
<main><h1>Urban morphology laboratory</h1>
<p>Synthetic perimeter block · dimensions in metres</p>
<section id="compute" class="grid" aria-label="Synthetic block calculation">
<div><figure><div id="plan">{result['plan']}</div><figcaption>Plan · dashed line marks the courtyard boundary</figcaption></figure>
<figure><div id="elevation">{result['elevation']}</div><figcaption>Orthographic elevation · modelled storeys</figcaption></figure></div>
<div><form id="parameters" hidden><label>Block type <select name="form">
<option value="closed">Closed perimeter</option><option value="open">Open perimeter</option></select></label>
<div id="sliders"></div><button type="button" id="save-example">Download configuration JSON</button><button type="reset">Reset</button></form>
<dl class="summary" id="results" aria-live="polite">{result['summary']}</dl></div></section>
<section id="observe"><h2>Synthetic fixtures</h2>
<p><a href="../{DATA}fixtures.json">Geometry, formula and result records (JSON)</a> ·
<a href="../{DATA}example-package.json">Exchange example</a></p>{result['records']}</section>
<section id="reference"><h2>Measurement basis</h2>
<p>Coverage uses the block boundary. Modelled floor area repeats the footprint across identical storeys.
Courtyard width is the east–west transect. Plan enclosure is the fraction of the courtyard boundary touching buildings.</p>
<p><a href="../{DATA}measurements.json">Measurement dictionary</a> · <a href="../{DATA}exchange.schema.json">Provisional exchange schema</a> ·
<a href="../evidence.html#equal-density">Floor-area ratio reference</a></p></section></main>
<script src="lab.js?v={escape(edition)}"></script>"""
    thematic = ''.join(f'<li><a href="{path.removeprefix("data/")}">{escape(spread.replace("-", " ").capitalize())}</a></li>'
                       for spread, path in SPREAD_PATHS.items())
    catalogue_body = f"""<nav><a href="../index.html">3D rulebook</a><a href="../{LAB_PAGE}">Morphology laboratory</a></nav>
<main><h1>Open data / AI agents</h1><p>Rulebook edition {escape(edition)}</p>
<section><h2>Reference</h2><ul>
<li><a href="rulebook.json">Rulebook JSON</a> · <a href="rulebook.csv">Rulebook CSV</a></li>
<li><a href="../evidence.html">Evidence register</a> · <a href="../evidence.json">Evidence JSON</a></li>
<li><a href="../llms.txt">Agent guide</a></li></ul>
<details><summary>Thematic JSON</summary><ul>{thematic}</ul></details></section>
<section><h2>Compute and Observe</h2><ul><li><a href="../{LAB_PAGE}">Interactive morphology laboratory and synthetic fixture tables</a></li>
<li><a href="morphology/measurements.json">Measurement dictionary JSON</a></li>
<li><a href="morphology/exchange.schema.json">Provisional exchange schema</a></li>
<li><a href="morphology/fixtures.json">Synthetic geometry, formulas and results JSON</a></li>
<li><a href="morphology/example-package.json">Synthetic exchange example</a></li>
<li><a href="morphology/CITYMODEL-INTEGRATION.md">City model integration guide</a></li></ul>
<p>The current morphology examples are generated geometry. The format also accepts attributed empirical packages for local validation.</p></section>
</main>"""
    encode = lambda data: (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)+'\n').encode()
    return {
        LAB_PAGE:html_page('Urban morphology laboratory','Exact synthetic urban block geometry and measurements.',LAB_PAGE,body),
        'morphology/lab.js':result['script'].encode(),
        CATALOGUE:html_page('Open data / AI agents','Rulebook reference and urban morphology datasets.',CATALOGUE,catalogue_body),
        DATA+'measurements.json':source('lab/data/morphology/measurements.json'),
        DATA+'exchange.schema.json':source('lab/data/morphology/exchange.schema.json'),
        DATA+'fixtures.json':encode({'edition':edition,'kind':'synthetic','formulas':result['formulas'],'fixtures':fixtures}),
        DATA+'example-package.json':encode(fixtures[0]['exchange']),
        DATA+'CITYMODEL-INTEGRATION.md':source('lab/docs/CITYMODEL-INTEGRATION.md')
            .replace(b'../data/morphology/',b'./')
            .replace((PUBLIC_URL+DATA).encode(),b'./'),
    }
