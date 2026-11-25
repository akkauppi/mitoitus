"""Build the static morphology supplement from validated synthetic packages."""
import json
import subprocess
from html import escape
from reference_export import PUBLIC_URL, SPREAD_PATHS
from curated_reference import (ASSERTIONS_PATH, LOCK_PATH, MARKDOWN_PATH, PROJECT_DESCRIPTION,
                               QUESTIONS_PATH, SCHEMA_PATH, WORKED_PATH, authoring, verify_worked_examples)

LAB_PAGE = 'morphology/index.html'
CATALOGUE = 'data/index.html'
DATA = 'data/morphology/'
DATA_SOURCE = 'lab/data/morphology/measurements.json'
CAPACITY_GUIDE_SOURCE = 'lab/docs/CAPACITY-CONFIGURATIONS.md'
CAPACITY_GUIDE = DATA+'CAPACITY-CONFIGURATIONS.md'
MORPHOLOGY_FILES = (
    LAB_PAGE, 'morphology/lab.js', CATALOGUE, DATA+'measurements.json',
    DATA+'exchange.schema.json', DATA+'fixtures.json', DATA+'example-package.json', DATA+'CITYMODEL-INTEGRATION.md',
    WORKED_PATH, CAPACITY_GUIDE,
)
SOURCE_FILES = (
    DATA_SOURCE, 'lab/data/morphology/exchange.schema.json',
    'lab/docs/CITYMODEL-INTEGRATION.md', CAPACITY_GUIDE_SOURCE,
    *(f'lab/morphology/{name}.mjs' for name in (
        'geometry', 'exchange', 'fixtures', 'import', 'render', 'ui', 'publish', 'capacity', 'capacity-configuration')),
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
#elevation svg,.capacity-elevation svg{{max-height:9rem}}
.capacity-elevation:not(:empty){{margin-top:.5rem}}
#capacity{{margin-block:2rem}}#capacity-parameters label{{display:block;margin:.5rem 0}}
.capacity-fields{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 .8rem}}
.capacity-fields input{{display:block;box-sizing:border-box;width:100%;max-width:11rem;font:inherit}}
.capacity-fields select{{display:block;max-width:100%}}
#capacity-parameters input[type=file],#capacity-parameters textarea{{box-sizing:border-box;max-width:100%;font:inherit}}
#capacity-parameters textarea{{display:block;width:100%;resize:vertical}}
#capacity-comparison{{overflow-x:auto}}#capacity-comparison table{{min-width:27rem}}
#capacity-comparison td{{font-variant-numeric:tabular-nums}}.summary{{display:grid;grid-template-columns:1fr auto;gap:.45rem 1rem}}
dd{{margin:0;text-align:right;font-variant-numeric:tabular-nums}}form{{border-block:1px solid #a8ad9c;padding:.8rem 0}}
#sliders{{display:grid;gap:.45rem}}#sliders label{{display:grid;grid-template-columns:minmax(9rem,1fr) 1fr;gap:.5rem}}
input[type=range]{{accent-color:#57715b}}
output{{font-variant-numeric:tabular-nums;font-weight:650}}button,select{{font:inherit;margin:.4rem .3rem .1rem 0}}
table{{border-collapse:collapse;width:100%;margin:.6rem 0}}th,td{{text-align:left;padding:.3rem .4rem;border-bottom:1px solid #bcc2af}}
details{{margin:.5rem 0}}summary{{cursor:pointer}}
@media(max-width:640px){{
.grid{{grid-template-columns:minmax(0,1fr);gap:.8rem}}
#capacity-comparison table{{table-layout:fixed;min-width:0;font-size:.875rem}}
#capacity-comparison th,#capacity-comparison td{{padding:.24rem .22rem;overflow-wrap:anywhere}}
#capacity-comparison th:first-child{{width:41%}}
}}
@media print{{form,nav{{display:none}}body{{padding:0}}}}
</style>{extra}</head><body>{body}</body></html>
""".encode()


def build_morphology(root, edition):
    source = lambda path: (root/path).read_bytes()
    result = json.loads(subprocess.check_output(['node', str(root/'lab/morphology/publish.mjs')]))
    fixtures = result['fixtures']
    if not fixtures or any(item['exchange']['kind'] != 'synthetic' for item in fixtures):
        raise ValueError('Only the reviewed synthetic fixture collection is in the release allowlist')
    worked = result['workedExamples']
    revisions = {f'{item["id"]}/r{item["revision"]}' for item in authoring(root)}
    ids = json.loads(source(DATA_SOURCE))['measurements'].keys()
    ledger = json.loads(source(LOCK_PATH))
    verify_worked_examples(worked, revisions, ids, ledger['workedExamples'])
    capacity, = worked.values()
    view = result['capacityView']
    capacity_inputs = capacity['inputs']
    storeys = ', '.join(map(str,capacity_inputs['storeys']))
    options = ''.join(f'<option value="{n}"{" selected" if n==view["selectedStoreys"] else ""}>{n} storeys</option>'
                      for n in capacity_inputs['storeys'])
    evidence = ''.join(f'<li><a href="../evidence.html#assertion-{revision.replace("/", "-")}">{revision}</a></li>'
                       for revision in capacity['assertionRevisionIds'])
    details = ''.join(f'<li>{escape(note)}</li>' for note in capacity['assumptions']+capacity['limitations'])
    body = f"""<nav><a href="../index.html">3D rulebook</a><a href="../{CATALOGUE}">Open data</a>
<a href="#compute">Compute</a><a href="#capacity">Capacity</a><a href="#observe">Observe</a></nav>
<main><h1>Urban morphology laboratory</h1>
<p>Synthetic perimeter block · dimensions in metres</p>
<section id="compute" class="grid" aria-label="Synthetic block calculation">
<div><figure><div id="plan">{result['plan']}</div><figcaption>Plan · dashed line marks the courtyard boundary</figcaption></figure>
<figure><div id="elevation">{result['elevation']}</div><figcaption>Orthographic elevation · modelled storeys</figcaption></figure></div>
<div><form id="parameters" hidden><label>Block type <select name="form">
<option value="closed">Closed perimeter</option><option value="open">Open perimeter</option></select></label>
<div id="sliders"></div><button type="button" id="save-example">Download configuration JSON</button><button type="reset">Reset</button></form>
<dl class="summary" id="results" aria-live="polite">{result['summary']}</dl></div></section>
<section id="capacity">
<h2>Residential block capacity</h2>
<div class="grid"><div id="capacity-drawing">{view['drawing']}</div>
<div><p id="capacity-summary">{view['summary']}</p>
<form id="capacity-parameters" data-edition="{escape(edition)}" hidden>
<div class="capacity-fields">
<label>Site width (m) <input type="number" name="siteWidth" min="0" step="any" value="{capacity_inputs['siteWidth']}"></label>
<label>Site depth (m) <input type="number" name="siteDepth" min="0" step="any" value="{capacity_inputs['siteDepth']}"></label>
<label>Target modelled floor area (m²) <input type="number" name="targetFloorArea" min="0" step="any" value="{capacity_inputs['targetFloorArea']}"></label>
<label>Storey counts <input type="text" name="storeys" value="{storeys}" aria-describedby="capacity-storeys-hint"></label>
<label>Modelled storey height (m) <input type="number" name="storeyHeight" min="0" step="any" value="{capacity_inputs['storeyHeight']}"></label>
<label>Residential share (%) <input type="number" name="residentialShare" min="0" max="100" step="any" value="{capacity_inputs['residentialShare']*100:g}"></label>
<label>Modelled residential m² per resident <input type="number" name="occupancy" min="0" step="any" value="{capacity_inputs['occupancy']['areaPerResident']}"></label>
<label>Draw alternative <select name="draw-storeys">{options}</select></label>
</div>
<small id="capacity-storeys-hint">Up to three storey counts, separated by commas.</small>
<p><button type="button" id="capacity-save">Download capacity JSON</button></p>
<label>Load capacity JSON <input type="file" name="configuration-file" accept=".json,application/json"></label>
<details><summary>Copy or paste inputs</summary>
<label>Configuration JSON <textarea name="paste-json" rows="5" spellcheck="false"></textarea></label>
<button type="button" id="capacity-show-inputs">Show input JSON</button>
<button type="button" id="capacity-paste">Load pasted JSON</button></details>
<p id="capacity-import-status" role="status"></p>
</form>
<p id="capacity-status" role="status"></p>
<a href="../{WORKED_PATH}">Worked examples JSON</a> · <a href="../{CAPACITY_GUIDE}">Configuration format</a></div></div>
<div id="capacity-comparison" role="region" aria-label="Capacity alternatives" tabindex="0">{view['table']}</div>
<details><summary>Sources and assumptions</summary><ul>{details}{evidence}</ul></details>
</section>
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
<li><a href="{ASSERTIONS_PATH.removeprefix("data/")}">Contextual assertions JSON</a> · <a href="{SCHEMA_PATH.removeprefix("data/")}">Contextual assertion schema</a> ·
<a href="{MARKDOWN_PATH.removeprefix("data/")}">Contextual assertions Markdown</a> · <a href="../evidence.html#contextual-assertions">Contextual evidence</a></li>
<li><a href="{QUESTIONS_PATH.removeprefix("data/")}">Knowledge reference questions JSON</a></li>
<li><a href="../evidence.html">Evidence register</a> · <a href="../evidence.json">Evidence JSON</a></li>
<li><a href="../llms.txt">Agent guide</a></li></ul>
<details><summary>Thematic JSON</summary><ul>{thematic}</ul></details></section>
<section><h2>Compute and Observe</h2><ul><li><a href="../{LAB_PAGE}">Interactive morphology laboratory and synthetic fixture tables</a></li>
<li><a href="../{LAB_PAGE}#capacity">Residential block capacity exercise</a> ·
<a href="{WORKED_PATH.removeprefix("data/")}">Worked examples JSON</a> ·
<a href="{CAPACITY_GUIDE.removeprefix("data/")}">Capacity configuration format</a></li>
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
        CATALOGUE:html_page('Open data / AI agents',PROJECT_DESCRIPTION,CATALOGUE,catalogue_body),
        CAPACITY_GUIDE:source(CAPACITY_GUIDE_SOURCE),
        DATA+'measurements.json':source(DATA_SOURCE),
        WORKED_PATH:encode({'schemaVersion':'1.0.0','edition':edition,'urlBase':PUBLIC_URL,
                            'siteRoot':'../../','contextualAssertions':'../contextual-assertions.json',
                            'measurementDictionary':'measurements.json','examples':worked}),
        DATA+'exchange.schema.json':source('lab/data/morphology/exchange.schema.json'),
        DATA+'fixtures.json':encode({'edition':edition,'kind':'synthetic','urlBase':PUBLIC_URL,'siteRoot':'../../','formulas':result['formulas'],'fixtures':fixtures}),
        DATA+'example-package.json':encode(fixtures[0]['exchange']),
        DATA+'CITYMODEL-INTEGRATION.md':source('lab/docs/CITYMODEL-INTEGRATION.md')
            .replace(b'../data/morphology/',b'./')
            .replace((PUBLIC_URL+DATA).encode(),b'./'),
    }
