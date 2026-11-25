"""Publish a small contextual assertion collection and its analytical examples."""
from collections import defaultdict
from html import escape
from hashlib import sha256
import json
import math
import re
import subprocess
from urllib.parse import urljoin

ASSERTIONS_PATH = 'data/contextual-assertions.json'
PUBLIC_URL = 'https://akkauppi.github.io/mitoitus/'
SCHEMA_FILE = 'contextual-assertions.schema.v0.2.0.json'
SCHEMA_PATH = 'data/'+SCHEMA_FILE
SCHEMA_SOURCE = 'lab/data/knowledge/'+SCHEMA_FILE
SCHEMA_CHECK = 'lab/scripts/verify-assertion-schema.mjs'
LOCK_PATH = 'lab/data/knowledge/revision-lock.json'
MARKDOWN_PATH = 'data/contextual-assertions.md'
QUESTIONS_PATH = 'data/knowledge-questions.json'
WORKED_PATH = 'data/morphology/worked-examples.json'
QUESTIONS_SOURCE = 'lab/data/knowledge/questions.json'
KNOWLEDGE_FILES = (ASSERTIONS_PATH, SCHEMA_PATH, MARKDOWN_PATH, QUESTIONS_PATH)
AUTHORING_PATH = 'lab/data/knowledge/assertions.json'
EXAMPLES_PATH = 'lab/morphology/knowledge-examples.mjs'
PROJECT_DESCRIPTION = ('An experimental, open reference for urban design dimensions, spatial relationships and '
                       'urban morphology. Dubious brings together illustrated design guidance, explicit '
                       'calculations and reproducible measurements. Sources, assumptions and measurement '
                       'methods stay attached to the knowledge they describe.')
PANEL_TITLES = {
    'building-blocks':'Slab and point blocks', 'building-rows':'Small blocks and rows',
    'building-detached':'Detached house', 'density':'Residential density',
    'equal-density':'Floor-area ratio and building form', 'services':'Residents and services',
    'turning':'Clear turning space', 'ponds':'Basins, ponds and wetlands',
}
SOURCE_ROLES = {'historical_reference', 'planning_reference', 'target', 'example_provision',
                'recommendation', 'requirement', 'definition', 'empirical_observation'}
SOURCE_STATUS = {'TKK':'historical', 'S10':'guidance', 'S07':'example_provision',
                 'R01':'municipal_report', 'R02':'municipal_report', 'R04':'guidance'}


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


def validate_quantity(quantity, meaning):
    kind = quantity.get('kind')
    if kind == 'components':
        for component in quantity['components'].values():
            validate_quantity(component, meaning)
        return
    if kind == 'rate':
        for name in ('numerator', 'denominator'):
            validate_quantity(quantity[name], meaning)
        return
    values = ([quantity['minimum'], quantity['maximum']] if kind == 'range' else [quantity['value']])
    if any(type(v) not in (int, float) or not math.isfinite(v) for v in values) or values != sorted(values):
        raise ValueError('Invalid or reversed assertion quantity')
    if meaning == 'floor-area-ratio':
        if not (quantity['unit']=='1' and quantity.get('numeratorBasis') and quantity.get('denominatorBasis')):
            raise ValueError('FAR requires both area bases')


def urls(site_relative):
    return {'portable':'../'+site_relative, 'canonical':urljoin(PUBLIC_URL,site_relative)}


def source_reference(reference, evidence_sources, claims, service_sources, service_rows):
    source_id = reference['sourceId']
    if row_id := reference.get('serviceRowId'):
        row = service_rows[row_id]
        if row['source'] != source_id:
            raise ValueError(f'Service source does not match row {row_id}')
        source = service_sources[source_id]
        fragment = row.get('fragment','')
        locator = source['locator']
        evidence_url = 'evidence.html#'+row_id
    else:
        claim = claims[reference['claimId']]
        source = evidence_sources[source_id]
        match, = (r for r in claim['references'] if r['source'] == source_id)
        fragment, locator = match['fragment'], match['location']
        evidence_url = 'evidence.html#'+claim['id']
    edition = source['edition']
    if edition.startswith('Retrieved '):
        edition = None
    result = {**reference,'locator':locator,'sourceUrl':source['url']+fragment,
              'sourceTitle':source['title'],'sourceEdition':edition,
              'sourcePublicationStatus':SOURCE_STATUS.get(source_id,'unclassified'),
              'evidenceUrl':evidence_url,'urls':urls(evidence_url)}
    if retrieval := source.get('retrieved') or source.get('retrieved_utc'):
        result['sourceRetrieved'] = retrieval
    if checksum := source.get('sha256'):
        result['sourceSha256'] = checksum
    return result


def validate_service_quantity(quantity, row):
    """Check the normalized daycare rate against its released service row."""
    numerator, denominator = quantity['numerator'], quantity['denominator']
    numbers = row['numbers']
    if numerator.get('kind') == 'range':
        matches = [numerator['minimum'],numerator['maximum']] == numbers
    else:
        matches = numerator['value'] in numbers
    source_denominator = row['units'].rsplit(' / ',1)[-1]
    source_unit = {'child':'child','early-childhood place':'place'}.get(source_denominator)
    if (not matches or numerator['unit'] != 'm2' or denominator['value'] != 1
            or denominator['unit'] != source_unit):
        raise ValueError(f'Assertion quantity disagrees with service row {row["id"]}')


def semantic_digest(snapshot):
    content = json.dumps(snapshot,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    return sha256(content.encode()).hexdigest()


def revision_hashes(dataset):
    """Hash semantic records and pinned examples. Navigation metadata is separate."""
    checksums = {}
    for record in dataset['assertions']:
        snapshot = {key:value for key,value in record.items() if key not in ('urls','citationUrl')}
        snapshot['evidence'] = [{key:value for key,value in ref.items() if key not in ('urls','evidenceUrl')}
                                for ref in record['evidence']]
        if example := snapshot.get('example'):
            snapshot['exampleContent'] = dataset['examples'][example]
        checksums[f'{record["id"]}/r{record["revision"]}'] = semantic_digest(snapshot)
    return checksums


def verify_revision_lock(dataset, expected):
    actual = revision_hashes(dataset)
    if actual != expected:
        changed = sorted(key for key in expected.keys() | actual.keys() if expected.get(key) != actual.get(key))
        raise ValueError('Assertion revision lock drift: '+', '.join(changed))


def verify_previous_lock(previous, current):
    sections = {'revisions','workedExamples'}
    for key, value in previous.items():
        if key not in sections and current.get(key) != value:
            raise ValueError(f'Assertion revision ledger metadata changed: {key}')
    changed = {key for section in sections for key,value in previous.get(section,{}).items()
               if current.get(section,{}).get(key) != value}
    if changed:
        raise ValueError('Existing assertion or worked-example revision locked: '+', '.join(sorted(changed)))


def verify_worked_examples(examples, assertions, measurements, expected):
    for revision,example in examples.items():
        if revision != f'{example["id"]}/r{example["revision"]}' or example['status'] != 'synthetic':
            raise ValueError(f'Invalid worked-example revision: {revision}')
        if set(example['assertionRevisionIds'])-assertions or set(example['measurementIds'])-measurements:
            raise ValueError(f'Missing worked-example dependency: {revision}')
    if {key:semantic_digest(value) for key,value in examples.items()} != expected:
        raise ValueError('Worked-example revision lock drift')


def build_curated(root, evidence, edition, *, verify_lock=True):
    records = authoring(root)
    service = json.loads((root/'lab/data/release-data.json').read_bytes())
    service_rows = {row['id']:row for row in service['serviceRows']}
    detention_rate = next(r['quantity'] for r in records
                          if (r['id'],r['revision'])==('espoo-detention-example-rate',1))
    examples = json.loads(subprocess.check_output(['node', str(root/EXAMPLES_PATH), json.dumps(detention_rate)]))
    dictionary = json.loads((root/'lab/data/morphology/measurements.json').read_bytes())
    sources, claims = evidence['sources'], {claim['id']:claim for claim in evidence['claims']}
    keys = {(r['id'],r['revision']) for r in records}
    identities = {identity for identity,_ in keys}
    revision_ids = {f'{identity}/r{revision}' for identity,revision in keys}
    if len(keys) != len(records):
        raise ValueError('Duplicate assertion revision')
    for case in examples.values():
        if case['status'] != 'synthetic' or set(case['measurementIds'])-dictionary['measurements'].keys():
            raise ValueError('Example measurement dictionary drift')
    for record in records:
        identity, revision = record['id'], record['revision']
        if set(record['panels'])-PANEL_TITLES.keys():
            raise ValueError(f'Unknown panel: {identity}')
        prior = f'{identity}/r{revision-1}' if revision > 1 else None
        if record['supersedes'] != prior or (prior and prior not in revision_ids):
            raise ValueError(f'Broken assertion revision chain: {identity}')
        if set(record['relatedAssertionIds'])-identities or identity in record['relatedAssertionIds']:
            raise ValueError(f'Invalid cross-reference: {identity}')
        for relation in record.get('relationships',()):
            target = relation['target']
            domain = revision_ids if relation['targetType']=='assertion' else dictionary['measurements']
            if target not in domain or target == f'{identity}/r{revision}':
                raise ValueError(f'Invalid typed relationship: {identity} → {target}')
        if identity=='far-massing-model-storey-height':
            record['quantity'] = {'kind':'scalar','value':examples['equal-far']['storeyHeight'],'unit':'m'}
        if example := record.get('example'):
            if example not in examples:
                raise ValueError(f'Missing example: {identity}')
            if result := examples[example].get('result'):
                record['quantity'] = {'kind':'scalar',**result}
        if 'quantity' in record:
            validate_quantity(record['quantity'],record['quantityMeaning'])
        if record['role'] in SOURCE_ROLES:
            if not record['evidence']:
                raise ValueError(f'Missing source evidence: {identity}')
        elif record['evidence'] or not example:
            raise ValueError(f'Editorial assertion needs its calculation or model context: {identity}')
        for ref in record['evidence']:
            if row_id := ref.get('serviceRowId'):
                validate_service_quantity(record['quantity'],service_rows[row_id])
        record['evidence'] = [source_reference(ref,sources,claims,service['sources'],service_rows)
                              for ref in record['evidence']]
        # The selected sources are historical references, guidance and municipal evidence.
        if record['role'] in {'requirement','empirical_observation'}:
            raise ValueError(f'Unsupported source authority or observation status: {identity}')
        record['citationUrl'] = 'evidence.html#'+anchor(record)
        record['urls'] = urls(record['citationUrl'])
    dataset = {
        'schemaVersion':'0.2.0','edition':edition,'urlBase':PUBLIC_URL,'siteRoot':'../','schema':SCHEMA_FILE,
        'measurementDictionary':'data/morphology/measurements.json','assertions':records,'examples':examples,
    }
    subprocess.run(['node', str(root/SCHEMA_CHECK), str(root/SCHEMA_SOURCE)],
                   input=json.dumps(dataset,allow_nan=False).encode(),check=True)
    if verify_lock:
        ledger = json.loads((root/LOCK_PATH).read_bytes())
        if (ledger['algorithm'],ledger['canonicalization']) != ('sha256','dubious-semantic-record-v1'):
            raise ValueError('Unsupported assertion revision ledger format')
        verify_revision_lock(dataset,ledger['revisions'])
    return dataset


def display_quantity(quantity):
    def measure(value, unit):
        return f'{value:g}'+({'m':' m','m2':' m²','ha':' ha','person':' residents','m3':' m³','h':' h','child':' child','place':' place'}.get(unit,''))
    def compact(component):
        if component['kind']=='range':
            return f"{component['minimum']:g}–"+measure(component['maximum'],component['unit'])
        comparator = {'gt':'>','gte':'≥','lt':'<','lte':'≤'}.get(component.get('operator'),'')
        return comparator+measure(component['value'],component['unit'])
    if not quantity:
        return ''
    prefix = '≈' if quantity.get('approximate') else ''
    if quantity['kind']=='components':
        return prefix+' × '.join(compact(part) for part in quantity['components'].values())
    if quantity['kind']=='rate':
        top,bottom = (quantity[k] for k in ('numerator','denominator'))
        return prefix+compact(top if 'kind' in top else {'kind':'scalar',**top})+' / '+measure(bottom['value'],bottom['unit'])
    return prefix+compact(quantity)


def table(heading, headers, rows):
    head = ''.join(f'<th scope="col">{escape(h)}</th>' for h in headers)
    body = ''.join('<tr><th scope="row">'+escape(str(row[0]))+'</th>'+
                   ''.join(f'<td>{escape(str(value))}</td>' for value in row[1:])+'</tr>' for row in rows)
    return (f'<div class="assertion-table" role="region" aria-labelledby="{heading}" tabindex="0">'
            f'<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')


def render_curated_evidence(evidence_html, dataset):
    records = dataset['assertions']
    links = []
    for panel, ids in panel_index(records).items():
        selected = [record for record in records if f'{record["id"]}/r{record["revision"]}' in ids]
        entries = ''.join(f'<li><a href="#{anchor(record)}">{escape(record["title"])}</a></li>' for record in selected)
        links.append(f'<h3 id="assertions-{panel}">{PANEL_TITLES[panel]}</h3><ul>{entries}</ul>')
    by_id = {record['id']:record for record in sorted(records,key=lambda item:item['revision'])}
    by_revision = {f'{r["id"]}/r{r["revision"]}':r for r in records}
    sections = []
    for record in records:
        title = escape(record['title'])
        term = f' · <span lang="fi">{escape(record["originalTerm"])}</span>' if record['originalTerm'] else ''
        value = display_quantity(record.get('quantity'))
        value = f'<p><strong>{escape(value)}</strong></p>' if value else ''
        limitations = ''.join(f'<p>{escape(record[key])}</p>' for key in ('exception','limitation') if key in record)
        references = ''.join(f'<li><a href="{escape(ref["evidenceUrl"])}">Evidence claim</a> · '
                             f'<a href="{escape(ref["sourceUrl"])}">{escape(ref["sourceTitle"])}, '
                             f'{escape(ref["sourceEdition"] or ("Retrieved "+ref["sourceRetrieved"][:10]))} · {escape(ref["locator"])}</a></li>'
                             for ref in record['evidence'])
        typed_ids = set()
        for relation in record.get('relationships',()):
            label = relation['type'].replace('_',' ').capitalize()
            if relation['targetType']=='assertion':
                related = by_revision[relation['target']]
                typed_ids.add(related['id'])
                references += f'<li>{label} · <a href="#{anchor(related)}">{escape(related["title"])}</a></li>'
            else:
                references += f'<li>{label} · <a href="{dataset["measurementDictionary"]}">{escape(relation["target"])}</a></li>'
        references += ''.join(f'<li><a href="#{anchor(by_id[identity])}">{escape(by_id[identity]["title"])}</a></li>'
                              for identity in record['relatedAssertionIds'] if identity not in typed_ids)
        if 'example' in record:
            references += f'<li><a href="#example-{record["example"]}">Calculated example</a></li>'
        sections.append(f'<h3 id="{anchor(record)}">{title}{term}</h3>'
                        f'<p>{escape(record["role"].replace("_"," ").capitalize())} · Revision {record["revision"]} · '
                        f'Editorial synthesis</p>{value}<p>{escape(record["applicability"])}</p>{limitations}'
                        + (f'<ul>{references}</ul>' if references else ''))
    examples = dataset['examples']
    equal, nested, depth = (examples[key] for key in ('equal-far','nested-denominators','depth-methods'))
    equal_table = table('example-equal-far', ('Coverage','Storeys','Footprint (m²)','Floor area (m²)','FAR'),
                        [(f"{r['coverage']:.1%}".replace('.0%','%'),r['floors'],r['footprintArea'],r['floorArea'],r['far'])
                         for r in equal['cases']])
    nested_table = table('example-nested-denominators', ('Boundary','Land area (m²)','Floor area (m²)','FAR'),
                         [(r['scope'].capitalize(),r['landArea'],r['floorArea'],r['far']) for r in nested['cases']])
    depth_table = table('example-depth-methods', ('Synthetic footprint','Envelope depth (m)','Transect easting (m)','Transect depth (m)'),
                        [(r['label'],r['envelopeDepth'],r['easting'],f"{r['transectDepth']:.2f}".rstrip('0').rstrip('.'))
                         for r in depth['cases']])
    detention = []
    for identity, title in [('detention-worked-volume','Detention volume'),('detention-worked-plan-area','Idealised detention plan area')]:
        result = examples[identity]
        value = display_quantity({'kind':'scalar',**result['result']})
        detention.append(f'<h3 id="example-{identity}">{title} · synthetic</h3>'
                         f'<p>{escape(result["formula"])} = {escape(value)}.</p>')
    html = f"""
<section id="contextual-assertions"><h2>Contextual assertions</h2>
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
{''.join(detention)}
</section>"""
    return (evidence_html
            .replace(b'</head>',b'<style>.assertion-table{overflow-x:auto;max-width:100%}</style></head>',1)
            .replace(b'</body>',html.encode()+b'</body>'))


def render_assertion_markdown(dataset):
    lines = ['# Dubious contextual assertions', '', f"Rulebook edition {dataset['edition']}",
             '', '[Schema]('+SCHEMA_FILE+') · [JSON](contextual-assertions.json)', '']
    for record in dataset['assertions']:
        lines += [f"## {record['title']}", '']
        value = display_quantity(record.get('quantity'))
        if value:
            lines += [f'**{value}**', '']
        role = record['role'].replace('_',' ')
        lines += [f"{role.capitalize()} · {record['id']}/r{record['revision']}", '', record['applicability'], '']
        for key in ('exception','limitation'):
            if key in record:
                lines += [record[key], '']
        links = [f"[Cite this revision]({record['urls']['portable']})"]
        links += [f"[{ref['locator']}]({ref['urls']['portable']})" for ref in record['evidence']]
        if example := record.get('example'):
            links.append(f'[Worked example](../evidence.html#example-{example})')
        lines += [' · '.join(links), '']
    return '\n'.join(lines).encode()


def knowledge_artifacts(root, dataset):
    def encode(data):
        return (json.dumps(data,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()
    return {
        ASSERTIONS_PATH:encode(dataset),
        SCHEMA_PATH:(root/SCHEMA_SOURCE).read_bytes(),
        MARKDOWN_PATH:render_assertion_markdown(dataset),
        QUESTIONS_PATH:encode({
            'schemaVersion':'1.0.0','edition':dataset['edition'],'urlBase':PUBLIC_URL,'siteRoot':'../',
            'cases':json.loads((root/QUESTIONS_SOURCE).read_bytes()),
        }),
    }
