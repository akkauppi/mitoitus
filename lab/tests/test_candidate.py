import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('candidate', Path(__file__).resolve().parents[1]/'scripts/build-book.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class Guards(unittest.TestCase):
    def test_rejects_baseline_and_traversal(self):
        for output in [m.ROOT, m.ROOT/'index.html', m.ROOT/'lab/../downloads']:
            with self.assertRaises(ValueError): m.build(output)
    def test_rejects_existing_output(self):
        with self.assertRaises(ValueError): m.build()
    def test_semantic_changes_detected(self):
        self.assertNotEqual(m.audit('<p>2.5 m</p>').events,m.audit('<p>3 m</p>').events)
        self.assertNotEqual(m.audit('<p class="source-meta">Draft</p>').events,m.audit('<p>Draft</p>').events)
if __name__ == '__main__': unittest.main()
