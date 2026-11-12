"""Evidence and content regressions for the release service tables."""
import json
import re
import sys
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'lab/scripts'))
from population_editorial import hierarchy_svg, redesign_population, release_data, render_population_evidence


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(); self.hidden = []; self.text = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag not in ('img', 'br', 'input', 'meta', 'link', 'path', 'circle'):
            self.hidden.append('source-meta' in d.get('class', '').split() or bool(self.hidden and self.hidden[-1]))
    def handle_endtag(self, tag):
        if tag not in ('img', 'br', 'input', 'meta', 'link', 'path', 'circle') and self.hidden:
            self.hidden.pop()
    def handle_data(self, text):
        if not any(self.hidden): self.text.append(text)


class PopulationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / 'index.html').read_text()
        cls.section = re.search(r'<section class="sheet" id="land-population".*?</section>', cls.source, re.S)[0]
        cls.updated = redesign_population(cls.section)
        cls.before = re.findall(r'<article\b.*?</article>', cls.section, re.S)
        cls.after = re.findall(r'<article\b.*?</article>', cls.updated, re.S)
        cls.data = release_data()

    def test_only_hierarchy_retains_a_drawing(self):
        self.assertEqual(len(self.after), 3)
        self.assertNotIn('<svg', self.after[0]); self.assertNotIn('class="drawing"', self.after[0])
        self.assertNotIn('<svg', self.after[2]); self.assertNotIn('class="drawing"', self.after[2])
        self.assertIn('distance-circles', self.after[1])
        for panel, claim in zip(self.after, ('density', 'green-hierarchy', 'services')):
            self.assertIn('href="evidence.html#' + claim + '"', panel)

    def test_density_table_retains_population_and_original_floor_area_ratios(self):
        old_table = re.search(r'<table\b.*?</table>', self.before[0], re.S)[0]
        self.assertIn(old_table, self.after[0])
        self.assertEqual(re.findall(r'<td>~(\d+)</td>', self.after[0]), ['30', '50', '75', '100'])
        for term in ['TKK 2007', 'total floor area ÷ land area', 'eₐ district', 'not a conversion']:
            self.assertIn(term, self.after[0])
        self.assertNotIn('data-resident', self.after[0])

    def test_hierarchy_has_a_single_radius_scale_and_complete_original_details(self):
        root = ET.fromstring(hierarchy_svg())
        circles = root.findall('.//*[@data-distance-metres]')
        self.assertEqual(sorted(int(c.attrib['data-distance-metres']) for c in circles), [50, 150, 500])
        self.assertEqual({round(float(c.attrib['r']) / float(c.attrib['data-distance-metres']), 6) for c in circles}, {.3})
        self.assertIn(re.search(r'<dl\b.*?</dl>', self.before[1], re.S)[0], self.after[1])

    def test_service_table_exposes_all_reviewed_values_and_denominators(self):
        rows = self.data['serviceRows']
        self.assertEqual(len(rows), 12)
        self.assertEqual(len({r['id'] for r in rows}), 12)
        self.assertEqual({r['group'] for r in rows}, {'Daycare', 'School', 'Library'})
        for row in rows:
            self.assertIn('data-service-row="' + row['id'] + '"', self.after[2])
            self.assertTrue(row['numbers']); self.assertTrue(row['units']); self.assertTrue(row['kind'])
            self.assertIn(row['context'], self.after[2])
            self.assertIn(row['source'], self.data['sources'])
        by_id = {r['id']: r for r in rows}
        self.assertEqual(by_id['daycare-indoor-helsinki']['numbers'], [8.25])
        self.assertIn('simultaneously present', by_id['daycare-indoor-helsinki']['units'])
        self.assertEqual(by_id['school-useful-area']['numbers'], [7.2, 8])
        self.assertEqual(by_id['school-playing-field']['numbers'], [46, 51, 61, 70, 500])
        self.assertIn('named project', by_id['school-playing-field']['kind'])
        self.assertIn('historical', by_id['library-access']['kind'])
        self.assertIn('2001–04', by_id['library-access']['context'])
        self.assertIn('excludes kitchens and technical rooms', self.after[2])

    def test_local_population_cases_are_preserved_only_in_sources(self):
        for term in ['Small municipalities may need more', 'nearby schools already full',
                     'proposed population responsibility', 'additional central-city unit',
                     'Seinäjoki, 2017', 'Helsinki, 2020']:
            self.assertIn(term, self.after[2])
        parsed = VisibleText(); parsed.feed(self.after[2]); visible = ' '.join(parsed.text)
        self.assertNotIn('2,000 additional residents', visible)
        self.assertNotIn('20,000 residents', visible)
        self.assertIn('7.2–8 m² / pupil', visible)

    def test_sources_are_primary_identified_and_preserve_retrieval_hashes(self):
        self.assertEqual(len(self.data['sources']), 5)
        for record in self.data['sources'].values():
            self.assertTrue(record['url'].startswith('https://'))
            self.assertRegex(record['sha256'], r'^[0-9a-f]{64}$')
            self.assertEqual(record['retrieved'], '2026-11-13')
            for field in ('edition', 'scope', 'locator', 'title'):
                self.assertTrue(record[field])
        self.assertEqual(self.data['sources']['R05']['baseline_source_id'], 'S23')
        baseline = json.loads((ROOT / 'evidence.json').read_text())
        self.assertEqual(baseline['sources']['S23']['sha256'], self.data['sources']['R05']['sha256'])

    def test_evidence_supplement_is_linked_and_does_not_replace_baseline(self):
        baseline = (ROOT / 'evidence.html').read_bytes()
        output = render_population_evidence(baseline).decode()
        self.assertEqual(output.count('id="services-release"'), 1)
        self.assertIn('href="#services-release"', output)
        self.assertIn('href="data/release-data.json"', output)
        for row in self.data['serviceRows']:
            self.assertIn('id="' + row['id'] + '"', output)
            self.assertIn(row['qualifier'], output)
        self.assertIn('id="services"', output)
        self.assertEqual((ROOT / 'evidence.html').read_bytes(), baseline)
        with self.assertRaisesRegex(ValueError, 'already appended'):
            render_population_evidence(output)


if __name__ == '__main__':
    unittest.main()
