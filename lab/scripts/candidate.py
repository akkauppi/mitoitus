"""T01 content audit, isolated builds and explicit offline artifact policy."""
import hashlib
import json
import os
import re
import shutil
import tempfile
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from connection_editorial import redesign_connections
from population_editorial import redesign_population, render_population_evidence
from parking_editorial import redesign_parking
from release_editorial import apply_release_edits, PANEL_ALIASES
from poster_assets import public_mapping, validate_assets, replace_figures

ROOT = Path(__file__).resolve().parents[2]
KINDS = ('buildings', 'accessible', 'turning', 'rescue', 'tram', 'parking', 'street')
UNITS = ('m', 'mm', 'ft')
PUBLIC_FILES = (
    'index.html', 'style.css', 'app.js', 'evidence.html', 'evidence.json',
    'assignment-extract.txt', 'assets/aalto-logo.svg', 'downloads/README.txt',
    *(f'downloads/{kind}-{unit}.{ext}' for kind in KINDS for unit in UNITS for ext in ('dxf', 'svg')),
    *(f'downloads/mitoitus-cad-{unit}.zip' for unit in UNITS),
)
RUNTIME_FILES = {'runtime/book-app.js': 'lab/src/book-app.js', 'runtime/book.css': 'lab/src/book.css'}
T02_RUNTIME_FILES = tuple(RUNTIME_FILES)
RUNTIME_FILES.update({
    'runtime/book-3d.js':'lab/src/book-3d.js',
    'runtime/viewer.js':'lab/src/viewer.js',
    'runtime/annotations.js':'lab/src/annotations.js',
    'runtime/registry.js':'lab/src/registry.js',
    'runtime/recipes/parking.js':'lab/src/recipes/parking.js',
    'runtime/recipes/stormwater.js':'lab/src/recipes/stormwater.js',
    'runtime/primitives/conceptual.js':'lab/src/primitives/conceptual.js',
    'runtime/recipes/landscape.js':'lab/src/recipes/landscape.js',
    'runtime/recipes/sections.js':'lab/src/recipes/sections.js',
    'runtime/primitives/sections.js':'lab/src/primitives/sections.js',
    'runtime/recipes/buildings.js':'lab/src/recipes/buildings.js',
    'runtime/primitives/massing.js':'lab/src/primitives/massing.js',
    'runtime/primitives/footprints.js':'lab/src/primitives/footprints.js',
    'runtime/recipes/connections.js':'lab/src/recipes/connections.js',
    'runtime/recipes/vehicles.js':'lab/src/recipes/vehicles.js',
    'runtime/recipes/tram.js':'lab/src/recipes/tram.js',
    'runtime/recipes/accessibility.js':'lab/src/recipes/accessibility.js',
    'runtime/primitives/accessibility.js':'lab/src/primitives/accessibility.js',
    'runtime/recipes/routes.js':'lab/src/recipes/routes.js',
    'runtime/primitives/surfaces.js':'lab/src/primitives/surfaces.js',
    **{name:f'lab/{name}' for name in ('scenes.js','assets.js','styles.js','callouts.js')},
    **{f'vendor/{name}':f'lab/vendor/{name}' for name in (
        'build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js',
        'examples/jsm/renderers/SVGRenderer.js','examples/jsm/renderers/Projector.js','LICENSE','manifest.json')},
})
BASELINE_FILES = PUBLIC_FILES
T14_PUBLIC_FILES = (*PUBLIC_FILES, *RUNTIME_FILES)
RUNTIME_FILES.update({
    'runtime/posters.js': 'lab/src/posters.js',
    'runtime/posters.css': 'lab/src/posters.css',
    'runtime/release.css': 'lab/src/release.css',
    'data/release-data.json': 'lab/data/release-data.json',
    'data/source-link-updates.json': 'lab/data/source-link-updates.json',
    **(public_mapping(ROOT) if (ROOT/'lab/posters/manifest.json').is_file() else {}),
})
PUBLIC_FILES = (*PUBLIC_FILES, *RUNTIME_FILES)
OFFLINE = 'downloads/rulebook-offline.zip'
MAX_ARCHIVE_BYTES = 32 * 1024 * 1024


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(path, expected):
    """Reject alternate destinations, traversal spellings and symlink ancestors."""
    path, expected = Path(path).absolute(), Path(expected).absolute()
    if path != expected or '..' in path.parts or any(p.is_symlink() for p in (path, *path.parents)):
        raise ValueError(f'Path must be {expected}, without symlinks or traversal')
    return path


class Audit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.events, self.sheets, self.panels = [], [], []
        self.panel = None
        self.option = None
        self.in_heading = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.events.append(['start', tag, sorted(attrs)])
        if tag == 'section' and 'sheet' in d.get('class', '').split():
            self.sheets.append(d['id'])
        if tag == 'article' and 'panel' in d.get('class', '').split():
            self.panel = dict(title='', claim=None, group=None, options=[], drawings=[])
            self.panels.append(self.panel)
        if self.panel is None:
            return
        if tag == 'h2':
            self.in_heading = True
        if tag == 'a' and 'proof' in d.get('class', '').split():
            self.panel['claim'] = d.get('href')
        if 'data-variant-group' in d:
            self.panel['group'] = d['data-variant-group']
        if tag == 'option':
            self.option = {'legacyIndex': int(d['value']), 'label': ''}
            self.panel['options'].append(self.option)
        if tag == 'svg':
            self.panel['drawings'].append(d.get('aria-label', ''))
        if tag == 'img' and d.get('data-poster-profile') == 'compact':
            self.panel['drawings'].append(d.get('alt', ''))

    def handle_endtag(self, tag):
        self.events.append(['end', tag])
        if tag == 'article':
            self.panel = None
        if tag == 'option':
            self.option = None
        if tag == 'h2':
            self.in_heading = False

    def handle_data(self, data):
        value = ' '.join(data.split())
        if value:
            self.events.append(['text', value])
        if self.panel is not None and self.in_heading:
            self.panel['title'] += data
        if self.option is not None:
            self.option['label'] += data


def audit(text):
    parser = Audit()
    parser.feed(text)
    return parser


def validate_inventory(checked, inventory):
    expected = [p for s in inventory['sheets'] for p in s['panels']]
    ids = [p['id'] for p in expected]
    if len(set(ids)) != 33 or any(p['claimId'] != p['id'] or p['sourceHref'] != 'evidence.html#' + p['id'] for p in expected):
        raise ValueError('Invalid or duplicated inventory panel identity')
    for panel in expected:
        for index, drawing in enumerate(panel['drawings']):
            if drawing['id'] != f'{panel["id"]}--v{index}' or drawing['legacyIndex'] != index:
                raise ValueError('Invalid baseline drawing identity')
    if checked.sheets != [s['id'] for s in inventory['sheets']]:
        raise ValueError('Missing, duplicated or reordered sheets')
    if len(checked.panels) != 33 or len(expected) != 33:
        raise ValueError('Expected 33 panels')
    for actual, planned in zip(checked.panels, expected):
        wanted = dict(title=planned['title'], claim=planned['sourceHref'],
                      group=planned['variantGroup'], options=planned['options'],
                      drawings=[d['accessibleDescription'] for d in planned['drawings']])
        if actual != wanted:
            raise ValueError(f'Panel/variant mismatch: {planned["id"]}')
    groups = {p['group']: len(p['options']) for p in checked.panels if p['group']}
    if groups != {'walking': 4, 'cycling': 5, 'car-layout': 3, 'bus-layout': 3}:
        raise ValueError('Unexpected source variant groups')
    if len(checked.sheets) != 11 or sum(len(p['drawings']) for p in checked.panels) != 44:
        raise ValueError('Expected 11 sheets and 44 drawings')


def source_path(root, name):
    return root / RUNTIME_FILES.get(name, name)


SPREAD_ORDER = ('built-form', 'land-population', 'walk-cycle', 'accessible',
                'connections', 'tram', 'turning-vehicles', 'parking',
                'section-details', 'green-blue', 'stormwater-options')


def render_evidence(source):
    rendered = render_population_evidence(source.replace('Antti’s Dubious Little Rulebook'.encode(), 'Antti’s Dubious Little Planning Rulebook'.encode()))
    for update in source_link_updates():
        rendered = rendered.replace(update['evidence']['originalUrl'].encode(), update['url'].encode())
    return rendered


def source_link_updates():
    updates = json.loads((ROOT/'lab/data/source-link-updates.json').read_text())
    if len(updates) != 1 or updates[0]['sourceId'] != 'S10':
        raise ValueError('Only the verified S10 link correction is authorized')
    return updates


def render_evidence_json(source):
    data = json.loads(source)
    for update in source_link_updates():
        item = data['sources'][update['sourceId']]
        evidence = update['evidence']
        if item['url'] != evidence['originalUrl'] or item['sha256'] != evidence['sha256'] or not evidence['matchesCanonicalSha256']:
            raise ValueError('S10 link update does not match retained source identity')
        item['url'] = update['url']
        item['link_update'] = {'checkedAt': evidence['checkedAt'], 'previousUrl': evidence['originalUrl'], 'sameContentSha256': evidence['sha256']}
    return (json.dumps(data, ensure_ascii=False, indent=2)+'\n').encode()


def render_book(source):
    text = source.decode()
    text = text.replace('Antti’s Dubious Little Rulebook', 'Antti’s Dubious Little Planning Rulebook')
    text = text.replace('Collected guidance on dimensions and layouts.', 'Rules of thumb. Fingers crossed. · v2026-11-12')
    # Presentation-only reorder, explicitly accepted by the user. Keep source IDs.
    pattern = r'<section class="sheet" id="([^"]+)".*?</section>'
    sections = {match[1]: match[0] for match in re.finditer(pattern, text, re.S)}
    if set(sections) != set(SPREAD_ORDER):
        raise ValueError('Unexpected sheets while applying approved order')
    # User correction: circles denote clear space, never the wheelchair itself.
    sections['accessible'] = sections['accessible'].replace('>Wheelchair</text>', '>Clear space · manual</text>').replace('>Powered chair</text>', '>Clear space · powered</text>')
    sections['connections'] = redesign_connections(sections['connections'])
    sections['land-population'] = redesign_population(sections['land-population'])
    sections['parking'] = redesign_parking(sections['parking'])
    ordered = []
    for index, identity in enumerate(SPREAD_ORDER, 1):
        ordered.append(re.sub(r'(<div class="panel-top"><span>)\d{2}',
                              lambda m: m[1] + f'{index:02}', sections[identity]))
    sequence = iter(ordered)
    text = re.sub(pattern, lambda m: next(sequence), text, flags=re.S)
    nav = re.search(r'<nav class="tabs"[^>]*>(.*?)</nav>', text, re.S)
    links = {m[1]: m[0] for m in re.finditer(r'<a href="#([^"]+)">.*?</a>', nav[1], re.S)}
    if set(links) != set(SPREAD_ORDER):
        raise ValueError('Unexpected tabs while applying approved order')
    tabs = '\n' + '\n'.join(re.sub(r'<span>\d{2}</span>', f'<span>{i:02}</span>', links[identity])
                            for i, identity in enumerate(SPREAD_ORDER, 1)) + '\n'
    text = text[:nav.start(1)] + tabs + text[nav.end(1):]
    text = apply_release_edits(text)
    text = replace_figures(text, ROOT)
    text = text.replace('</head>', '<link rel="stylesheet" href="runtime/book.css"><link rel="stylesheet" href="runtime/posters.css"><link rel="stylesheet" href="runtime/release.css"><script type="importmap">{"imports":{"three":"./vendor/build/three.module.js","three/addons/":"./vendor/examples/jsm/"}}</script></head>')
    text = text.replace('</body>', '<script src="runtime/book-app.js"></script><script src="runtime/posters.js"></script></body>')
    return text.encode()


def read_public(root, source=False):
    result = {}
    for name in PUBLIC_FILES:
        path = source_path(root, name) if source else root / name
        if any(p.is_symlink() for p in (path, *path.parents)) or not path.is_file():
            raise ValueError(f'Missing or unsafe public file: {name}')
        result[name] = path.read_bytes()
    return result


def write_archive(path, files):
    """Write only the exact approved runtime set; never enumerate a source tree."""
    if set(files) != set(PUBLIC_FILES):
        raise ValueError('Archive must contain exactly the public allowlist')
    if sum(map(len, files.values())) > MAX_ARCHIVE_BYTES:
        raise ValueError('Archive exceeds 32 MiB uncompressed budget')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(files):
            info = zipfile.ZipInfo(name, (2026, 11, 12, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, files[name])
    with zipfile.ZipFile(path) as archive:
        if archive.namelist() != sorted(PUBLIC_FILES) or archive.testzip() is not None:
            raise ValueError('Archive inventory/CRC verification failed')
        for name, content in files.items():
            if archive.read(name) != content:
                raise ValueError(f'Archive content mismatch: {name}')


def verify_candidate(output, allow_legacy=False):
    """Replacement/export requires an intact generated directory, never arbitrary files."""
    if not output.is_dir() or output.is_symlink():
        raise ValueError('Candidate is not a generated directory')
    paths = list(output.rglob('*'))
    if any(p.is_symlink() for p in paths):
        raise ValueError('Candidate contains a symlink')
    report = json.loads((output/'parity.json').read_text())
    names = {p.relative_to(output).as_posix() for p in paths if p.is_file()}
    expected = set(PUBLIC_FILES) | {OFFLINE, 'parity.json'}
    old_expected = set(BASELINE_FILES) | {OFFLINE, 'parity.json'}
    t02_expected = old_expected | set(T02_RUNTIME_FILES)
    t14_expected = set(T14_PUBLIC_FILES) | {OFFLINE, 'parity.json'}
    t13_expected = t14_expected - {'runtime/recipes/parking.js'}
    t11_expected = t13_expected - {'runtime/recipes/stormwater.js','runtime/primitives/conceptual.js'}
    t10_expected = t11_expected - {'runtime/recipes/landscape.js'}
    t09_review_expected = t10_expected - {'runtime/recipes/sections.js','runtime/primitives/sections.js'}
    t09_expected = t09_review_expected - {'runtime/primitives/massing.js'}
    t08_expected = t09_expected - {'runtime/recipes/buildings.js','runtime/primitives/footprints.js'}
    t07_expected = t08_expected - {'runtime/recipes/connections.js'}
    t06_expected = t07_expected - {'runtime/recipes/vehicles.js'}
    t05_expected = t06_expected - {'runtime/recipes/tram.js'}
    t04_expected = t05_expected - {'runtime/recipes/accessibility.js','runtime/primitives/accessibility.js'}
    t03_expected = t04_expected - {'runtime/recipes/routes.js','runtime/primitives/surfaces.js'}
    if allow_legacy and names in (old_expected,t02_expected,t03_expected,t04_expected,t05_expected,t06_expected,t07_expected,t08_expected,t09_expected,t09_review_expected,t10_expected,t11_expected,t13_expected,t14_expected):
        expected = names
    if names != expected:
        raise ValueError('Candidate contains missing or unapproved files')
    if report.get('schemaVersion') == 2:
        hashes = report.get('fileSha256', {})
        if set(hashes) != expected - {'parity.json'}:
            raise ValueError('Invalid candidate ownership manifest')
        for name, value in hashes.items():
            if digest((output/name).read_bytes()) != value:
                raise ValueError(f'Candidate was edited: {name}')
    elif allow_legacy and report.get('stage') == 'T01 baseline candidate; new layout not implemented':
        # One-time migration of the initial T01 copy, including its old offline ZIP.
        if set(report.get('files', [])) != expected - {'parity.json'}:
            raise ValueError('Unknown legacy candidate')
        for name in expected - {'parity.json'}:
            if (output/name).read_bytes() != (ROOT/name).read_bytes():
                raise ValueError(f'Legacy candidate was edited: {name}')
    else:
        raise ValueError('Unknown candidate ownership manifest')
    return report


def publish(stage, output):
    """Install fully verified staging; restore previous candidate if installation fails."""
    backup = stage.with_name(stage.name + '-previous')
    previous = output.exists()
    if previous:
        os.replace(output, backup)
    try:
        os.replace(stage, output)
    except BaseException:
        if previous:
            os.replace(backup, output)
        raise
    if previous:
        shutil.rmtree(backup)


def build(output=None, replace=False):
    output = safe_path(output or ROOT/'lab/book', ROOT/'lab/book')
    inventory = json.loads((ROOT/'lab/docs/scene-inventory.json').read_text())
    posters = validate_assets(ROOT)
    files = read_public(ROOT, source=True)
    vendor = json.loads(files['vendor/manifest.json'])
    for name, expected_hash in vendor['sha256'].items():
        if digest(files['vendor/' + name]) != expected_hash:
            raise ValueError(f'Vendored dependency drift: {name}')
    source = files['index.html']
    if digest(source) != inventory['baselineSha256']:
        raise ValueError('Baseline changed: review inventory deliberately before rebuilding')
    checked = audit(source.decode())
    validate_inventory(checked, inventory)
    if output.exists():
        if not replace:
            raise ValueError('Candidate exists; use --replace for a verified generated candidate')
        verify_candidate(output, allow_legacy=True)
    files['index.html'] = render_book(source)
    files['evidence.html'] = render_evidence(files['evidence.html'])
    files['evidence.json'] = render_evidence_json(files['evidence.json'])
    stage = Path(tempfile.mkdtemp(prefix='.book-stage-', dir=output.parent))
    try:
        for name, content in files.items():
            target = stage/name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        write_archive(stage/OFFLINE, files)
        actual = audit((stage/'index.html').read_text())
        if actual.events != audit(render_book(source).decode()).events:
            raise ValueError('Candidate semantic content drift')
        report = dict(schemaVersion=2, stage='T15 modern posters and release editorial amendments', publicationReady=True,
                      legacyVisualsRetired=True, legacyFallbackReplacementPending=False,
                      sheets=len(actual.sheets), panels=len(actual.panels), drawings=sum(len(p['drawings']) for p in actual.panels), sourcePanels=33, sourceDrawings=44,
                      posterRecipes=len(posters['posters']), posterProfiles=list(posters['profiles']),
                      panelAliases=PANEL_ALIASES, renderedPanels=[p['claim'] for p in actual.panels], baselineSha256=digest(source),
                      semanticSha256=digest(json.dumps(checked.events, ensure_ascii=False).encode()),
                      content=checked.panels, semanticEvents=checked.events,
                      fileSha256={name:digest((stage/name).read_bytes()) for name in (*PUBLIC_FILES, OFFLINE)})
        (stage/'parity.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
        verify_candidate(stage)
        publish(stage, output)
        return report
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def package(output=None, allow_legacy_preview=False):
    candidate = safe_path(ROOT/'lab/book', ROOT/'lab/book')
    output = safe_path(output or ROOT/'lab/.build/rulebook-offline.zip', ROOT/'lab/.build/rulebook-offline.zip')
    verify_candidate(candidate)
    if not allow_legacy_preview and 'data-legacy-visual="true"' in (candidate/'index.html').read_text():
        raise ValueError('Legacy 2D visuals are retired: replace static fallbacks before exporting a publishable package')
    output.parent.mkdir(parents=True, exist_ok=True)
    handle, name = tempfile.mkstemp(prefix='.archive-', dir=output.parent)
    os.close(handle)
    temporary = Path(name)
    try:
        write_archive(temporary, read_public(candidate))
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return output
