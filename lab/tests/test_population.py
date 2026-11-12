import re
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from population_editorial import density_svg,hierarchy_svg,library_svg,redesign_population,DENSITIES,AREA_HA

class PopulationTests(unittest.TestCase):
 def test_resident_counts_match_source_density_at_equal_point_four_hectare_area(self):
  root=ET.fromstring(density_svg());groups=[g for g in root if 'data-density' in g.attrib]
  self.assertEqual([float(g.attrib['data-density']) for g in groups],[30,50,75,100])
  for g in groups:
   residents=g.findall('.//*[@data-resident]');self.assertEqual(len(residents),int(g.attrib['data-resident-count']));self.assertEqual(len(residents)/float(g.attrib['data-area-ha']),float(g.attrib['data-density']));self.assertEqual(float(g.attrib['data-area-ha']),.4);self.assertEqual(len({r.attrib['transform'] for r in residents}),len(residents))
  self.assertEqual([len(g.findall('.//*[@data-resident]')) for g in groups],[12,20,30,40])
 def test_distance_circles_preserve_fifty_one_fifty_five_hundred_on_one_radius_scale(self):
  root=ET.fromstring(hierarchy_svg());circles=root.findall('.//*[@data-distance-metres]');self.assertEqual(sorted(int(c.attrib['data-distance-metres']) for c in circles),[50,150,500]);self.assertEqual({round(float(c.attrib['r'])/float(c.attrib['data-distance-metres']),6) for c in circles},{.3})
 def test_library_area_equivalent_is_ten_by_ten_not_a_population_threshold(self):
  root=ET.fromstring(library_svg());tile=root.find('.//*[@data-geometry="library-area"]');self.assertEqual(float(tile.attrib['data-metres-width'])*float(tile.attrib['data-metres-height']),100);self.assertEqual(tile.attrib['width'],tile.attrib['height']);self.assertIn('per 1,000 residents',''.join(root.itertext()));self.assertIn('Useful area equivalent',''.join(root.itertext()))
 def test_service_grouping_retains_all_original_specs_qualifiers_and_source_link(self):
  source=(Path(__file__).resolve().parents[2]/'index.html').read_text();section=re.search(r'<section class="sheet" id="land-population".*?</section>',source,re.S)[0];updated=redesign_population(section)
  for tag in ['table','dl']:
   self.assertEqual(re.findall(fr'<{tag}\b.*?</{tag}>',section,re.S),re.findall(fr'<{tag}\b.*?</{tag}>',updated,re.S))
  for term in ['Small municipalities may need more','nearby schools already full','proposed population responsibility','additional central-city unit','Seinäjoki, 2017','Helsinki, 2020','evidence.html#services']:
   self.assertIn(term,updated)
  self.assertEqual(updated.count('data-service-measure='),3)
