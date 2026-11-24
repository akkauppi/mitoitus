"""Publish a small contextual assertion collection and its analytical examples."""
from collections import defaultdict
from html import escape
import json
import math
import re
import subprocess

ASSERTIONS_PATH = 'data/contextual-assertions.json'
AUTHORING_PATH = 'lab/data/knowledge/assertions.json'
EXAMPLES_PATH = 'lab/morphology/knowledge-examples.mjs'
PROJECT_DESCRIPTION = ('An experimental, open reference for urban design dimensions, spatial relationships and '
                       'urban morphology. Dubious brings together illustrated design guidance, explicit '
                       'calculations and reproducible measurements. Sources, assumptions and measurement '
                       'methods stay attached to the knowledge they describe.')
PANEL_IDS = {'building-blocks', 'building-rows', 'building-detached', 'density', 'equal-density'}
ROLES = {'historical_reference', 'recommendation', 'requirement', 'definition', 'empirical_observation',
         'model_assumption', 'mathematical_identity', 'derived_result', 'professional_interpretation'}
UNITS = {'m', 'm2', '1', 'person', 'ha'}


def authoring(root):
    return json.loads((root/AUTHORING_PATH).read_bytes())


def panel_index(records):
    panels = defaultdict(list)
    for assertion in records:
        for panel in assertion['panels']:
            panels[panel].append(f'{assertion["id"]}/r{assertion["revision"]}')
    return panels


def anchor(record):
    return f'assertion-{record["id"]}-r{record["revision"]}'


def add_sources_links(html, records):
    panels = panel_index(records)

    def link_panel(match):
        article = match[0]
        proofs = re.findall(r'class="proof" href="evidence.html#([^"]+)"', article)
        if proofs and proofs[-1] in panels:
            name = proofs[-1]
            link = f'<p class="source-meta"><a href="evidence.html#assertions-{name}">Contextual assertions ↗</a></p>'
            article = article.replace('</article>', link+'</article>')
        return article

    return re.sub(r'<article\b.*?</article>', link_panel, html, flags=re.S)


def validate_quantity(quantity):
    kind = quantity['kind']
    if kind == 'components':
        if set(quantity['components']) != {'length', 'depth'}:
            raise ValueError('Named length and depth required')
        for component in quantity['components'].values():
            validate_quantity(component)
        return
    if kind == 'rate':
        for name in ('numerator', 'denominator'):
            component = quantity[name]
            if not component['basis']:
                raise ValueError('Rate component requires a measurement basis')
            validate_quantity({**component, 'kind':'scalar'})
        if quantity['denominator']['value'] <= 0:
            raise ValueError('Nonpositive denominator')
        return
    if kind not in ('scalar', 'range') or quantity['unit'] not in UNITS:
        raise ValueError('Unknown assertion quantity kind or unit')
    values = [quantity['value']] if kind == 'scalar' else [quantity['minimum'], quantity['maximum']]
    if any(type(v) not in (int, float) or not math.isfinite(v) or v < 0 for v in values) or values != sorted(values):
        raise ValueError('Invalid assertion quantity')
    if quantity['unit'] == '1' and not (quantity.get('numeratorBasis') and quantity.get('denominatorBasis')):
        raise ValueError('FAR requires both area bases')


def build_curated(root, evidence, edition):
    records = authoring(root)
    examples = json.loads(subprocess.check_output(['node', str(root/EXAMPLES_PATH)]))
    dictionary = json.loads((root/'lab/data/morphology/measurements.json').read_bytes())
    sources, claims = evidence['sources'], {claim['id']:claim for claim in evidence['claims']}
    keys = {(r['id'],r['revision']) for r in records}
    identities = {identity for identity,_ in keys}
    if len(keys) != len(records):
        raise ValueError('Duplicate assertion revision')
    for case in examples.values():
        if case['status'] != 'synthetic' or any(name not in dictionary['measurements'] for name in case['measurementIds']):
            raise ValueError('Example measurement dictionary drift')
    for record in records:
        identity, revision = record['id'], record['revision']
        if (not re.fullmatch(r'[a-z0-9-]+',identity) or type(revision) is not int or revision < 1
                or record['role'] not in ROLES or not record['applicability'] or not record['title']
                or record['reviewStatus'] != 'editorial-synthesis'
                or not record['panels'] or set(record['panels'])-PANEL_IDS):
            raise ValueError(f'Incomplete contextual assertion: {identity}')
        prior = f'{identity}/r{revision-1}' if revision > 1 else None
        if record['supersedes'] != prior or (prior and (identity,revision-1) not in keys):
            raise ValueError(f'Broken assertion revision chain: {identity}')
        if set(record['relatedAssertionIds'])-identities or identity in record['relatedAssertionIds']:
            raise ValueError(f'Invalid cross-reference: {identity}')
        if record['id']=='far-massing-model-storey-height':
            record['quantity'] = {'kind':'scalar','value':examples['equal-far']['storeyHeight'],'unit':'m'}
        if 'quantity' in record:
            validate_quantity(record['quantity'])
        if 'example' in record and record['example'] not in examples:
            raise ValueError(f'Missing example: {identity}')
        if record['role'] in {'historical_reference','definition','recommendation','requirement','empirical_observation'}:
            if not record['evidence']:
                raise ValueError(f'Missing source evidence: {identity}')
        elif record['evidence'] or 'example' not in record:
            raise ValueError(f'Editorial assertion needs its calculation or model context: {identity}')
        for reference in record['evidence']:
            if reference['sourceId']=='TKK' and record['role'] in {'requirement','empirical_observation'}:
                raise ValueError(f'Historical TKK reference assigned an unsupported role: {identity}')
            claim = claims[reference['claimId']]
            source = sources[reference['sourceId']]
            match, = (r for r in claim['references'] if r['source'] == reference['sourceId'])
            reference.update(locator=match['location'], sourceUrl=source['url']+match['fragment'],
                             sourceTitle=source['title'], sourceEdition=source['edition'],
                             sourcePublicationStatus='historical' if reference['sourceId']=='TKK' else 'unclassified',
                             evidenceUrl='evidence.html#'+claim['id'])
        record['citationUrl'] = 'evidence.html#'+anchor(record)
    return {
        'schemaVersion':'0.1.0','edition':edition,'measurementDictionary':'data/morphology/measurements.json',
        'assertions':records,'examples':examples,
    }


def display_quantity(quantity):
    def measure(value, unit):
        return f'{value:g}'+({'m':' m','m2':' m²','ha':' ha','person':' residents'}.get(unit,''))
    def compact(component):
        if component['kind']=='range':
            return f"{component['minimum']:g}–"+measure(component['maximum'],component['unit'])
        return measure(component['value'],component['unit'])
    if not quantity:
        return ''
    prefix = '≈' if quantity.get('approximate') else ''
    if quantity['kind']=='components':
        return prefix+' × '.join(compact(part) for part in quantity['components'].values())
    if quantity['kind']=='rate':
        top,bottom = (quantity[k] for k in ('numerator','denominator'))
        return prefix+measure(top['value'],top['unit'])+' / '+measure(bottom['value'],bottom['unit'])
    return prefix+compact(quantity)


def table(headers, rows):
    head = ''.join(f'<th scope="col">{escape(h)}</th>' for h in headers)
    body = ''.join('<tr><th scope="row">'+escape(str(row[0]))+'</th>'+
                   ''.join(f'<td>{escape(str(value))}</td>' for value in row[1:])+'</tr>' for row in rows)
    return f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'


def render_curated_evidence(evidence_html, dataset):
    records = dataset['assertions']
    names = {'building-blocks':'Slab and point blocks', 'building-rows':'Small blocks and rows',
             'building-detached':'Detached house', 'density':'Residential density',
             'equal-density':'Floor-area ratio and building form'}
    links = []
    for panel, ids in panel_index(records).items():
        selected = [record for record in records if f'{record["id"]}/r{record["revision"]}' in ids]
        entries = ''.join(f'<li><a href="#{anchor(record)}">{escape(record["title"])}</a></li>' for record in selected)
        links.append(f'<h3 id="assertions-{panel}">{names[panel]}</h3><ul>{entries}</ul>')
    by_id = {record['id']:record for record in records}
    sections = []
    for record in records:
        title = escape(record['title'])
        term = f' · <span lang="fi">{escape(record["originalTerm"])}</span>' if record['originalTerm'] else ''
        value = display_quantity(record.get('quantity'))
        value = f'<p><strong>{escape(value)}</strong></p>' if value else ''
        limitation = f'<p>{escape(record["limitation"])}</p>' if 'limitation' in record else ''
        references = ''.join(f'<li><a href="{escape(ref["evidenceUrl"])}">Evidence claim</a> · '
                             f'<a href="{escape(ref["sourceUrl"])}">{escape(ref["sourceTitle"])}, '
                             f'{escape(ref["sourceEdition"])} · {escape(ref["locator"])}</a></li>'
                             for ref in record['evidence'])
        references += ''.join(f'<li><a href="#{anchor(by_id[identity])}">{escape(by_id[identity]["title"])}</a></li>'
                              for identity in record['relatedAssertionIds'])
        if 'example' in record:
            references += f'<li><a href="#example-{record["example"]}">Calculated example</a></li>'
        sections.append(f'<h3 id="{anchor(record)}">{title}{term}</h3>'
                        f'<p>{escape(record["role"].replace("_"," ").capitalize())} · Revision {record["revision"]} · '
                        f'Editorial synthesis</p>{value}<p>{escape(record["applicability"])}</p>{limitation}'
                        + (f'<ul>{references}</ul>' if references else ''))
    examples = dataset['examples']
    equal, nested, depth = (examples[key] for key in ('equal-far','nested-denominators','depth-methods'))
    equal_table = table(('Coverage','Storeys','Footprint (m²)','Floor area (m²)','FAR'),
                        [(f"{r['coverage']:.1%}".replace('.0%','%'),r['floors'],r['footprintArea'],r['floorArea'],r['far'])
                         for r in equal['cases']])
    nested_table = table(('Boundary','Land area (m²)','Floor area (m²)','FAR'),
                         [(r['scope'].capitalize(),r['landArea'],r['floorArea'],r['far']) for r in nested['cases']])
    depth_table = table(('Synthetic footprint','Envelope depth (m)','Transect easting (m)','Transect depth (m)'),
                        [(r['label'],r['envelopeDepth'],r['easting'],f"{r['transectDepth']:.2f}".rstrip('0').rstrip('.'))
                         for r in depth['cases']])
    html = f"""
<section id="contextual-assertions"><h2>Built form and density assertions</h2>
<p><a href="{ASSERTIONS_PATH}">Download contextual assertions and examples (JSON)</a></p>
{''.join(links)}
{''.join(sections)}
<h3 id="example-equal-far">Equal FAR · synthetic plots</h3>
<p>{escape(equal['formula'])}. Each plot is {equal['plotSide']} × {equal['plotSide']} m.
The massing assumes {equal['storeyHeight']} m per storey.</p>{equal_table}
<p><a href="index.html?panel=equal-density#section-details">Open the 3D comparison</a></p>
<h3 id="example-nested-denominators">Same floor area · synthetic nested boundaries</h3>
<p>{escape(nested['boundaryBasis'])}.</p>{nested_table}
<h3 id="example-depth-methods">Same footprint · two depth methods</h3>
<p>The envelope uses the full north–south span. The transect uses the width of the cut at the stated easting.
Transect values are rounded to two decimals in this table.</p>{depth_table}
<p><a href="morphology/index.html#l-shaped-building">L-shaped fixture</a> ·
<a href="morphology/index.html#irregular-footprint">Irregular fixture</a></p>
</section>"""
    return evidence_html.replace(b'</body>',html.encode()+b'</body>')
