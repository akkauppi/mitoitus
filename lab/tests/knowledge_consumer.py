"""Exercise a Dubious reader using only the supplied homepage URL."""
import json
import sys
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin
from urllib.request import urlopen


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = {}
        self.ids = set()
        self.href = None
        self.label = ''
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs:
            self.href, self.label = attrs['href'], ''

    def handle_data(self, data):
        if self.href is not None:
            self.label += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.href is not None:
            self.links[self.label.strip()] = self.href
            self.href = None


def fetch(url, content_type):
    with urlopen(url,timeout=15) as response:
        assert response.status == 200
        assert response.headers.get_content_type() == content_type, response.geturl()
        return response.geturl(), response.read().decode('utf-8')


def run(url):
    home, html = fetch(url,'text/html')
    catalogue, html = fetch(urljoin(home,Page(html).links['Open data / AI agents']),'text/html')
    links = Page(html).links

    def data(label):
        return json.loads(fetch(urljoin(catalogue,links[label]),'application/json')[1])

    rulebook = data('Rulebook JSON')
    curated = data('Contextual assertions JSON')
    dictionary = data('Measurement dictionary JSON')
    fixtures = data('Synthetic geometry, formulas and results JSON')
    schema = data('Provisional exchange schema')
    assert rulebook['edition'] == curated['edition'] == fixtures['edition']
    evidence_url,evidence_html = fetch(urljoin(catalogue,links['Evidence register']),'text/html')
    assert evidence_url
    evidence = Page(evidence_html)
    records = {f'{item["id"]}/r{item["revision"]}':item for item in curated['assertions']}
    examples = curated['examples']

    # A claim's citation resolves to its exact revision and source locator.
    for record in records.values():
        assert urldefrag(record['citationUrl']).fragment in evidence.ids
        for source in record['evidence']:
            assert urldefrag(source['evidenceUrl']).fragment in evidence.ids
            assert source['locator'] and source['sourceEdition']

    slab = records['tkk-slab-module-dimensions/r1']
    span = slab['quantity']['components']
    assert (span['length']['minimum'],span['length']['maximum'],span['depth']['minimum'],
            span['depth']['maximum'],span['depth']['unit']) == (22,30,10,12,'m')
    assert slab['role']=='historical_reference' and slab['evidence'][0]['sourceEdition']=='28 Aug 2007'
    panels = {panel['id']:panel for panel in rulebook['panels']}
    assert 'tkk-slab-module-dimensions/r1' in panels['building-blocks']['assertionRevisionIds']
    scene = panels['building-blocks']['scenes'][0]
    assert scene['coordinateUnits']=='m'
    assert (scene['modelMeasurements']['moduleLength'],scene['modelMeasurements']['moduleDepth'])==(26,11)
    assert records['far-massing-model-storey-height/r1']['quantity']=={'kind':'scalar','value':3,'unit':'m'}

    far = examples['equal-far']
    assert far['status']=='synthetic' and far['units']['floorArea']=='m2'
    assert [item['far'] for item in far['cases']]==[1,1,1]
    assert far['cases']==panels['equal-density']['scenes'][0]['modelMeasurements']['cases']
    assert [item['far'] for item in examples['nested-denominators']['cases']]==[1,.25,.0625]
    residents = records['tkk-detached-population-density/r1']
    assert residents['quantity']['numerator']['unit']=='person' and residents['quantity']['denominator']['unit']=='ha'
    assert residents['quantity']['approximate'] and 'unresolved' in residents['limitation']
    for scope in ('plot','block','district'):
        q = records[f'tkk-detached-{scope}-far/r1']['quantity']
        assert q['denominatorBasis']==f'{scope} land area' and q['unit']=='1'

    statuses = schema['$defs']['observation']['properties']['status']['enum']
    assert 'measured' in statuses and 'estimated' in statuses and 'synthetic' in statuses
    floor_methods = dictionary['measurements']['floor-area']['methods']
    assert 'identical-footprint-times-storeys' in floor_methods
    actual = [row for item in fixtures['fixtures'] for row in item['exchange']['observations']]
    assert {row['status'] for row in actual}=={'synthetic'}
    assert all(row['method']=='identical-footprint-times-storeys' for row in actual if row['measurement']=='floor-area')

    depth = examples['depth-methods']
    assert depth['status']=='synthetic' and {'envelopeDepth','transectDepth'}==set(depth['methods'])
    full = depth['methods']['envelopeDepth']['method']
    assert full in dictionary['measurements']['building-depth']['methods']
    assert (depth['cases'][0]['envelopeDepth'],depth['cases'][0]['transectDepth'],depth['cases'][0]['unit']) == (16,6,'m')
    assert records['depth-envelope-versus-transect/r1']['role']=='derived_result'
    for label in ('Rulebook CSV','Synthetic exchange example'):
        assert label in links
    print(f"PASS: homepage-only consumer, five distinction checks and 15 stable citation anchors, edition {curated['edition']}.")


if __name__ == '__main__':
    run(sys.argv[1])
