import re,sys,math,unittest,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from parking_editorial import redesign_parking,norms_svg
class ParkingTests(unittest.TestCase):
 def test_exact_historical_counts_and_proportional_bars(self):
  self.assertEqual(math.ceil(10000/230),44);self.assertEqual(math.ceil(max(10000/130,.5*100)),77)
  root=ET.fromstring(norms_svg());bars=root.findall('.//*[@data-count]');self.assertEqual([int(b.attrib['data-count']) for b in bars],[44,77]);self.assertAlmostEqual(float(bars[0].attrib['width'])/float(bars[1].attrib['width']),44/77)
  text=''.join(root.itertext());self.assertIn('residential floor-m²',text);self.assertIn('100 dwellings',text);self.assertIn('Outside C1/C2/C3 centres',text);self.assertIn('Rounded up · no reductions',text)
 def test_removed_panel_keeps_original_accounting_table_and_qualifiers_under_sources(self):
  source=(Path(__file__).resolve().parents[2]/'index.html').read_text();section=re.search(r'<section class="sheet" id="parking".*?</section>',source,re.S)[0];updated=redesign_parking(section);self.assertEqual(updated.count('<article '),2);self.assertIn('data-retained-panel="parking-area"',updated)
  for term in ['12.5 m²','21.25 m²','425 m²','entrances, row ends','structure and vertical circulation','no long-term private-car parking','≥0.5 space/dwelling','≥5% of required spaces','add 30 to the denominators']:
   self.assertIn(term,updated)
  for table in re.findall(r'<table\b.*?</table>',section,re.S):self.assertIn(table,updated)
