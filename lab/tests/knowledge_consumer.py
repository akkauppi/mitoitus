"""Exercise a Dubious reader using only the supplied homepage URL."""
import argparse
import json
from math import isclose
import sys
from html.parser import HTMLParser
from urllib.parse import urldefrag, urljoin, urlsplit
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
        assert response.status in (200, None)
        assert response.headers.get_content_type() == content_type, response.geturl()
        return response.geturl(), response.read().decode('utf-8')


def run(url):
    home, html = fetch(url,'text/html')
    catalogue, html = fetch(urljoin(home,Page(html).links['Open data / AI agents']),'text/html')
    links = Page(html).links

    def data(label):
        address, content = fetch(urljoin(catalogue,links[label]),'application/json')
        return address, json.loads(content)

    book_url,rulebook = data('Rulebook JSON')
    curated_url,curated = data('Contextual assertions JSON')
    dictionary_url,dictionary = data('Measurement dictionary JSON')
    fixtures_url,fixtures = data('Synthetic geometry, formulas and results JSON')
    worked_url,worked = data('Worked examples JSON')
    capacity_url = urljoin(catalogue,links['Residential block capacity exercise'])
    questions_url,questions = data('Knowledge reference questions JSON')
    schema_url,schema = data('Contextual assertion schema')
    _,exchange = data('Provisional exchange schema')
    evidence_url,evidence_html = fetch(urljoin(catalogue,links['Evidence register']),'text/html')
    evidence_json_url,evidence_json = data('Evidence JSON')
    site = urljoin(home,'./')
    assert rulebook['edition'] == curated['edition'] == fixtures['edition'] == questions['edition'] == worked['edition']
    for url,dataset in [(book_url,rulebook),(curated_url,curated),(fixtures_url,fixtures),
                        (questions_url,questions),(worked_url,worked),(evidence_json_url,evidence_json)]:
        assert urljoin(url,dataset['siteRoot']) == site, (url,dataset['siteRoot'])
        assert dataset['urlBase'] == curated['urlBase']

    names = {f'{item["id"]}/r{item["revision"]}':item for item in curated['assertions']}
    assert len(names) == len(curated['assertions'])
    documents = {
        'assertions':names, 'dictionary':dictionary, 'fixtures':fixtures,
        'examples':curated['examples'], 'worked':worked['examples'], 'panels':{panel['id']:panel for panel in rulebook['panels']},
    }
    pages = {evidence_url:Page(evidence_html)}
    resources = {book_url,curated_url,dictionary_url,fixtures_url,worked_url,questions_url,schema_url,evidence_json_url,evidence_url}

    def check_portable(url):
        target, fragment = urldefrag(url)
        assert target.startswith(site), target
        if fragment:
            if target not in pages:
                resolved,html = fetch(target,'text/html')
                assert resolved == target
                pages[target] = Page(html)
            assert fragment in pages[target].ids, url
        elif target not in resources:
            expected = ('application/json' if target.endswith('.json') else
                        'text/html' if target.endswith('.html') else None)
            with urlopen(target,timeout=15) as response:
                assert response.status in (200,None) and response.geturl()==target
                if expected:
                    assert response.headers.get_content_type()==expected
            resources.add(target)

    assert urljoin(curated_url,curated['schema']) == schema_url
    assert urljoin(site,curated['measurementDictionary']) == dictionary_url
    assert urljoin(site,rulebook['contextualAssertions']) == curated_url
    assert urljoin(worked_url,worked['contextualAssertions']) == curated_url
    assert urljoin(worked_url,worked['measurementDictionary']) == dictionary_url
    assert schema['$id'] == urljoin(curated['urlBase'],'data/'+curated['schema'])
    for record in names.values():
        for obj,field in [(record,'citationUrl'), *((ref,'evidenceUrl') for ref in record['evidence'])]:
            portable = urljoin(curated_url,obj['urls']['portable'])
            assert portable == urljoin(site,obj[field])
            assert obj['urls']['canonical'] == urljoin(curated['urlBase'],obj[field])
            check_portable(portable)
        for ref in record['evidence']:
            source = urlsplit(ref['sourceUrl'])
            assert source.scheme in ('http','https') and source.netloc and ref['locator']
            assert ref['sourceEdition'] or ref.get('sourceRetrieved')
        if example := record.get('example'):
            check_portable(evidence_url+'#example-'+example)

    for path in rulebook['spreadFiles'].values():
        spread_url,data_str = fetch(urljoin(site,path),'application/json')
        spread = json.loads(data_str)
        assert spread['edition']==rulebook['edition']
        assert urljoin(spread_url,spread['siteRoot']) == site
        if linked := spread.get('contextualAssertions'):
            assert urljoin(urljoin(spread_url,spread['siteRoot']),linked) == curated_url
        for panel in spread['panels']:
            assert urljoin(urljoin(spread_url,spread['siteRoot']),panel['url']) == urljoin(site,panel['url'])
    for label in ('Rulebook CSV','Synthetic exchange example','Contextual assertions Markdown'):
        check_portable(urljoin(catalogue,links[label]))

    check_portable(capacity_url)
    assert urldefrag(capacity_url).fragment=='capacity'
    for key,example in worked['examples'].items():
        assert key==f'{example["id"]}/r{example["revision"]}'
        assert set(example['assertionRevisionIds'])<=names.keys()
        assert set(example['measurementIds'])<=dictionary['measurements'].keys()
        if example['id']=='residential-block-capacity':
            # Independent arithmetic for the rectangular reference exercise.
            inputs = example['inputs']
            for case in example['alternatives']:
                values = case['results']
                exact_footprint = inputs['targetFloorArea']/case['storeys']
                assert isclose(values['footprintArea'],exact_footprint)
                assert isclose(values['unbuiltGround']+exact_footprint,example['studyArea'])
                expected_residential = exact_footprint*case['storeys']*inputs['residentialShare']
                assert isclose(values['residentialFloorArea'],expected_residential)
                assert isclose(values['populationEstimate'],expected_residential/inputs['occupancy']['areaPerResident'])

    registry = set(names)
    for kind,values in [('example',documents['examples']),('measurement',dictionary['measurements']),('panel',documents['panels']),('worked',worked['examples'])]:
        registry.update(f'{kind}:{value}' for value in values)
    case_ids = set()
    for case in questions['cases']:
        assert case['id'] not in case_ids
        case_ids.add(case['id'])
        assert all(case[k] for k in ('question','expectedAnswer','essentialQualifiers','incorrectInterpretation',
                                     'knowledgeIdentifiers','supportingEvidence','checks'))
        assert set(case['knowledgeIdentifiers'])<=registry, case['id']
        for reference in case['supportingEvidence']:
            check_portable(urljoin(urljoin(questions_url,questions['siteRoot']),reference))
        for check in case['checks']:
            actual = documents[check['document']]
            for part in check['path'][1:].split('/'):
                key = part.replace('~1','/').replace('~0','~')
                actual = actual[int(key) if isinstance(actual,list) else key]
            assert actual == check['equals'], (case['id'],check,actual)

    equal = documents['panels']['equal-density']['scenes'][0]['modelMeasurements']['cases']
    assert equal == documents['examples']['equal-far']['cases']
    assert {row['status'] for f in fixtures['fixtures'] for row in f['exchange']['observations']} == {'synthetic'}
    assert {'measured','estimated','synthetic'} <= set(exchange['$defs']['observation']['properties']['status']['enum'])
    print(f"PASS: {len(case_ids)} reference cases and complete citation URLs for {len(names)} revisions ({urlsplit(home).scheme}).")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('homepage')
    run(parser.parse_args().homepage)
