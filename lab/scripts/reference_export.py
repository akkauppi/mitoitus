"""Export the published sheets and their scene annotations from the build inputs."""
import csv
import io
import json
import re
import subprocess
from dataclasses import dataclass, field
from html.parser import HTMLParser
from urllib.parse import urlencode
from curated_reference import ASSERTIONS_PATH, MARKDOWN_PATH, PUBLIC_URL, QUESTIONS_PATH, SCHEMA_PATH, WORKED_PATH, authoring, panel_index

JSON_PATH = 'data/rulebook.json'
CSV_PATH = 'data/rulebook.csv'
SPREAD_ORDER = ('built-form', 'land-population', 'walk-cycle', 'accessible',
                'connections', 'tram', 'turning-vehicles', 'parking',
                'section-details', 'green-blue', 'stormwater-options')
SPREAD_PATHS = {spread: f'data/spreads/{spread}.json' for spread in SPREAD_ORDER}
EXPORT_FILES = (JSON_PATH, CSV_PATH, 'llms.txt', *SPREAD_PATHS.values())
NUMBER = r'(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.[0-9]+)?'
SIMPLE_QUANTITY = re.compile(
    rf'(?P<operator>[~≈≤≥<>])?(?P<first>{NUMBER})(?:–(?P<last>{NUMBER}))?\s*(?P<unit>mm|km|m²|m³|m|ha|%)'
)
OPERATORS = {'~': 'approximate', '≈': 'approximate', '≤': 'at_most',
             '≥': 'at_least', '<': 'less_than', '>': 'greater_than'}


def quantity(text):
    match = SIMPLE_QUANTITY.fullmatch(text)
    if match is None:
        return None
    values = [float(value.replace(',', '')) for value in match.group('first', 'last') if value]
    return {'values': values, 'unit': match['unit'],
            'operator': OPERATORS.get(match['operator'], 'range' if len(values) == 2 else 'equal')}


def with_quantity(record, text):
    parsed = quantity(text)
    return {**record, 'quantity': parsed} if parsed is not None else record


@dataclass
class Element:
    tag: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)

    def find(self, tag=None, css_class=None):
        for child in self.children:
            if isinstance(child, Element):
                if (tag is None or child.tag == tag) and (
                    css_class is None or css_class in child.attrs.get('class', '').split()
                ):
                    yield child
                yield from child.find(tag, css_class)

    def raw_text(self):
        return ''.join(child if isinstance(child, str) else child.raw_text()
                       for child in self.children)

    def text(self):
        return ' '.join(self.raw_text().split())


class Document(HTMLParser):
    VOID = frozenset('area base br col embed hr img input link meta param source track wbr'.split())

    def __init__(self, html):
        super().__init__()
        self.root = Element('document')
        self.stack = [self.root]
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag in ('br', 'small'):
            node.children.append(' ')
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def table_data(table):
    rows = []
    for row in table.find('tr'):
        cells = []
        for cell in row.children:
            if isinstance(cell, Element) and cell.tag in ('th', 'td'):
                text = cell.text()
                data = {'text': text, 'header': cell.tag == 'th',
                        'colspan': int(cell.attrs.get('colspan', 1)),
                        'rowspan': int(cell.attrs.get('rowspan', 1))}
                cells.append(data if data['header'] else with_quantity(data, text))
        rows.append(cells)
    caption = next(table.find('caption'), None)
    return {'caption': caption.text() if caption else None, 'rows': rows}


def scene_links(scene, panel_url, variant_group):
    variant = int(scene['id'].rsplit('--v', 1)[1])
    prefix, spread = panel_url.split('#')
    for view in scene['views']:
        query = {}
        if variant_group and variant:
            query[f'layout-{variant_group}'] = variant
        if view['category'] is not None:
            query[f"poster-{scene['id']}"] = view['category']
        extra = '&' + urlencode(query) if query else ''
        view['url'] = prefix + extra + '#' + spread


def read_panels(index, scenes):
    root = Document(index).root
    notes_node = next(node for node in root.find('script') if node.attrs.get('id') == 'rulebook-quick-notes')
    quick_notes = json.loads(notes_node.raw_text())
    for spread in root.find('section', 'sheet'):
        spread_id = spread.attrs['id']
        for article in spread.find('article', 'panel'):
            evidence_urls = [link.attrs['href'] for link in article.find('a', 'proof')]
            panel_id = evidence_urls[-1].split('#')[1]
            url = f'index.html?panel={panel_id}#{spread_id}'
            details = next(article.find(css_class='details'))
            facts = []
            for definition_list in details.find('dl'):
                labels = list(definition_list.find('dt'))
                values = list(definition_list.find('dd'))
                for label, value in zip(labels, values, strict=True):
                    text = value.text()
                    facts.append(with_quantity({'label': label.text(), 'value': text}, text))
            group = next((node for node in article.find()
                          if 'data-variant-group' in node.attrs), None)
            variant_group = group.attrs['data-variant-group'] if group else None
            variants = [option.text() for option in group.find('option')] if group else []
            panel_scenes = [scene for scene in scenes if scene['panelId'] == panel_id]
            for scene in panel_scenes:
                scene_links(scene, url, variant_group)
                if variants:
                    scene['variantLabel'] = variants[int(scene['id'].rsplit('--v', 1)[1])]
            yield {
                'id': panel_id, 'title': next(article.find('h2')).text(), 'url': url,
                'spread': {'id': spread_id, 'title': spread.attrs['aria-label']},
                'claimIds': list(dict.fromkeys(
                    [href.split('#')[1] for href in evidence_urls]
                    + [claim for scene in panel_scenes for claim in scene['sourceClaims']]
                )),
                'facts': facts, 'tables': [table_data(table) for table in article.find('table')],
                'notes': [note.text() for note in details.find('p')
                          if 'source-meta' not in note.attrs.get('class', '').split()],
                'quickNotes': [note for note in quick_notes.get(panel_id, []) if note],
                'sourceNotes': [{'text': note.text(), 'links': [a.attrs['href'] for a in note.find('a')]}
                                for note in article.find(css_class='source-meta')],
                'charts': [{'label': svg.attrs.get('aria-label'),
                            'labels': [node.text() for node in svg.find('text')],
                            'descriptions': [node.text() for node in svg.find('desc')]}
                           for svg in article.find('svg')],
                'scenes': panel_scenes,
            }


def spreadsheet(panels):
    stream = io.StringIO(newline='')
    writer = csv.writer(stream)
    writer.writerow(('panel_id', 'panel', 'panel_url', 'claim_ids', 'kind', 'context', 'value'))
    for panel in panels:
        prefix = (panel['id'], panel['title'], panel['url'], ' '.join(panel['claimIds']))
        for fact in panel['facts']:
            writer.writerow((*prefix, 'fact', fact['label'], fact['value']))
        for number, table in enumerate(panel['tables'], 1):
            for row in table['rows']:
                writer.writerow((*prefix, 'table_row', table['caption'] or f'Table {number}',
                                 json.dumps([cell['text'] for cell in row], ensure_ascii=False)))
        for note in panel['notes']:
            writer.writerow((*prefix, 'note', '', note))
        for note in panel['quickNotes']:
            writer.writerow((*prefix, 'quick_note', '', note))
        for chart in panel['charts']:
            for label in chart['labels']:
                writer.writerow((*prefix, 'chart_label', chart['label'] or '', label))
        for scene in panel['scenes']:
            for view in scene['views']:
                context = ' · '.join(filter(None, (scene['id'], scene.get('variantLabel'), view['label'])))
                for dimension in view['dimensions']:
                    writer.writerow((*prefix, 'drawing_dimension', context, dimension['label']))
                for label in view['labels']:
                    writer.writerow((*prefix, 'drawing_label', context, label))
    return stream.getvalue().encode()


def build_exports(root, index, evidence, services, edition):
    script = root/'lab/scripts/export-scenes.mjs'
    scenes = json.loads(subprocess.check_output(['node', str(script)]))
    panels = list(read_panels(index.decode(), scenes))
    assertions = panel_index(authoring(root))
    for panel in panels:
        if panel['id'] in assertions:
            panel['assertionRevisionIds'] = assertions[panel['id']]
    claims = {claim['id']: claim for claim in evidence['claims']}
    claim_ids = {claim for panel in panels for claim in panel['claimIds']}
    data = {
        'schemaVersion': 1, 'edition': edition, 'urlBase': PUBLIC_URL, 'siteRoot':'../',
        'title': 'Dubious Little Planning Rulebook',
        'panels': panels,
        'claims': {claim_id: claims[claim_id] for claim_id in sorted(claim_ids)},
        'sources': evidence['sources'],
        'serviceSupplement': services,
        'evidence': {'html': 'evidence.html', 'json': 'evidence.json'},
        'spreadFiles': SPREAD_PATHS,
        'contextualAssertions': ASSERTIONS_PATH,
    }
    if len({panel['id'] for panel in panels}) != 30 or sum(len(panel['scenes']) for panel in panels) != len(scenes):
        raise ValueError('Reference export does not cover the published panels and recipes')

    guide = f"""# {data['title']}

> Urban design dimensions, formulas and examples from the Mitoitus 3D rulebook, edition {edition}.

## Data

- [Contextual assertions JSON]({PUBLIC_URL}{ASSERTIONS_PATH}) · [Schema]({PUBLIC_URL}{SCHEMA_PATH})
- [Contextual assertions Markdown]({PUBLIC_URL}{MARKDOWN_PATH}) · [Reference questions]({PUBLIC_URL}{QUESTIONS_PATH})
- [Open data catalogue]({PUBLIC_URL}data/index.html)
- [Morphology laboratory]({PUBLIC_URL}morphology/index.html)
- [Residential block capacity]({PUBLIC_URL}morphology/index.html#capacity) · [Worked examples JSON]({PUBLIC_URL}{WORKED_PATH})
- [Rulebook JSON]({PUBLIC_URL}{JSON_PATH}): All 30 panels, including facts, ordered table cells, notes, charts, scenes, source claims and the structured service supplement.
- [Rulebook CSV]({PUBLIC_URL}{CSV_PATH}): A flat index of facts, notes, table rows and drawing labels. Table-row values are JSON arrays of cell text in display order.
- [Evidence index]({PUBLIC_URL}evidence.html): Source methods, locators and historical evidence.
- [3D rulebook]({PUBLIC_URL}): Interactive scenes and printable reference sheets.

Use the JSON panel ID, edition and panel URL to cite a value. Use `urlBase` for canonical online citations. For portable copies, resolve `siteRoot` against the current dataset URL, then resolve site-relative fields against that root. The contextual assertions also provide explicit dataset-relative and canonical citation URLs. Follow `claimIds` to `claims`, then resolve each reference against `sources` using its source ID and fragment. Read the case, notes and source scope with each value. Where a simple metric value or range is present, `quantity` provides its numeric values, unit and comparison operator. Use scene assumptions to interpret drawing measurements and diagram coordinates. Service supplement rows retain their localities, dates, units and source IDs.

## Spreads

"""
    exports = {}
    for spread, path in SPREAD_PATHS.items():
        selected = [panel for panel in panels if panel['spread']['id'] == spread]
        selected_claim_ids = sorted({claim_id for panel in selected for claim_id in panel['claimIds']})
        selected_claims = {claim_id: claims[claim_id] for claim_id in selected_claim_ids}
        selected_sources = sorted({reference['source'] for claim in selected_claims.values()
                                   for reference in claim['references']})
        subset = {key: data[key] for key in ('schemaVersion', 'edition', 'urlBase', 'title', 'evidence')}
        subset.update(siteRoot='../../',panels=selected, claims=selected_claims,
                      sources={source_id: data['sources'][source_id] for source_id in selected_sources})
        if spread == 'land-population':
            subset['serviceSupplement'] = services
        if any('assertionRevisionIds' in panel for panel in selected):
            subset['contextualAssertions'] = ASSERTIONS_PATH
        exports[path] = encode_json(subset)
        guide += f"- [{selected[0]['spread']['title']} JSON]({PUBLIC_URL}{path})\n"
        for panel in selected:
            guide += f"  - [{panel['title']}]({PUBLIC_URL}{panel['url']}) · `{panel['id']}`\n"
    return {
        JSON_PATH: encode_json(data),
        CSV_PATH: spreadsheet(panels),
        'llms.txt': guide.encode(),
        **exports,
    }


def encode_json(data):
    return (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode()
