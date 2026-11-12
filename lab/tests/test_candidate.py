"""T01 regressions operate on private temporary copies, never the working candidate."""
import copy
import json
import shutil
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))
import candidate as m

SOURCE = m.ROOT

class CandidateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'repo'
        for name in (*m.PUBLIC_FILES, 'lab/docs/scene-inventory.json'):
            target = m.source_path(self.root,name)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(m.source_path(SOURCE,name), target)
        self.root_patch = patch.object(m, 'ROOT', self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.output = self.root/'lab/book'

    def inventory(self):
        return json.loads((self.root/'lab/docs/scene-inventory.json').read_text())

    def test_build_captures_all_content_and_variants(self):
        report = m.build()
        self.assertEqual((report['sheets'],report['panels'],report['drawings']), (11,33,44))
        self.assertEqual(report['semanticEvents'], m.audit((self.root/'index.html').read_text()).events)
        groups = {p['group']:len(p['options']) for p in report['content'] if p['group']}
        self.assertEqual(groups, {'walking':4,'cycling':5,'car-layout':3,'bus-layout':3})
        for name in m.PUBLIC_FILES:
            self.assertEqual((self.output/name).read_bytes(), m.render_book((self.root/name).read_bytes()) if name == 'index.html' else m.source_path(self.root,name).read_bytes())

    def test_repeat_build_requires_explicit_replace_and_is_reproducible(self):
        first = m.build()
        archive = (self.output/m.OFFLINE).read_bytes()
        with self.assertRaisesRegex(ValueError,'exists'): m.build()
        self.assertEqual(m.build(replace=True),first)
        self.assertEqual((self.output/m.OFFLINE).read_bytes(), archive)

    def test_baseline_change_rejected_before_output(self):
        path = self.root/'index.html'
        path.write_text(path.read_text().replace('2.5 m','2.6 m',1))
        with self.assertRaisesRegex(ValueError,'Baseline changed'): m.build()
        self.assertFalse(self.output.exists())

    def test_missing_duplicate_reordered_panels_and_sheets_fail(self):
        text = (self.root/'index.html').read_text()
        original = m.audit(text)
        for change in ('missing','duplicate','reorder','sheet'):
            modified = copy.deepcopy(original)
            if change == 'missing': modified.panels.pop()
            elif change == 'duplicate': modified.panels[1] = modified.panels[0]
            elif change == 'reorder': modified.panels[0],modified.panels[1] = modified.panels[1],modified.panels[0]
            else: modified.sheets.reverse()
            with self.subTest(change=change), self.assertRaises(ValueError):
                m.validate_inventory(modified,self.inventory())

    def test_variant_names_indices_order_and_counts_fail_on_drift(self):
        original = m.audit((self.root/'index.html').read_text())
        for change in ('name','index','order','count','group'):
            modified = copy.deepcopy(original)
            panel = next(p for p in modified.panels if p['group']=='walking')
            if change == 'name': panel['options'][0]['label']='invented'
            elif change == 'index': panel['options'][0]['legacyIndex']=99
            elif change == 'order': panel['options'].reverse()
            elif change == 'count': panel['options'].pop()
            else: panel['group']='other'
            with self.subTest(change=change), self.assertRaises(ValueError):
                m.validate_inventory(modified,self.inventory())

    def test_fact_table_qualifier_and_visibility_changes_affect_parity(self):
        samples = [('<td>2.5 m</td>','<td>3 m</td>'),
                   ('<p class="source-meta">Draft 2025</p>','<p>Draft 2025</p>'),
                   ('<p>≥1.5 m</p>','<p>1.5 m</p>')]
        for before, after in samples:
            self.assertNotEqual(m.audit(before).events,m.audit(after).events)
        self.assertEqual(m.audit('<p> one  two </p>').events,m.audit('<p>one two</p>').events)

    def test_alternate_traversal_and_symlink_destinations_rejected(self):
        for path in [self.root,self.root/'downloads',self.root/'lab/x/../book']:
            with self.subTest(path=path), self.assertRaises(ValueError): m.build(path)
        self.output.symlink_to(self.root/'downloads', target_is_directory=True)
        with self.assertRaises(ValueError): m.build(replace=True)

    def test_symlink_source_and_ancestor_rejected(self):
        path = self.root/'style.css'
        path.unlink()
        path.symlink_to(SOURCE/'style.css')
        with self.assertRaises(ValueError): m.build()
        self.assertFalse(self.output.exists())

    def test_missing_source_leaves_previous_candidate_untouched(self):
        m.build()
        before = (self.output/'parity.json').read_bytes()
        (self.root/'style.css').unlink()
        with self.assertRaises(ValueError): m.build(replace=True)
        self.assertEqual((self.output/'parity.json').read_bytes(), before)

    def test_staging_failure_preserves_previous_and_cleans_temporary_output(self):
        m.build()
        before = (self.output/'parity.json').read_bytes()
        with patch.object(m,'write_archive',side_effect=OSError('simulated disk failure')):
            with self.assertRaises(OSError): m.build(replace=True)
        self.assertEqual((self.output/'parity.json').read_bytes(), before)
        self.assertEqual(list((self.root/'lab').glob('.book-stage-*')),[])

    def test_install_failure_restores_previous_candidate(self):
        m.build()
        before = (self.output/'parity.json').read_bytes()
        replace = m.os.replace
        def fail_stage(src,dst):
            if Path(src).name.startswith('.book-stage-') and not str(src).endswith('-previous'):
                raise OSError('simulated install failure')
            return replace(src,dst)
        with patch.object(m.os,'replace',side_effect=fail_stage):
            with self.assertRaises(OSError): m.build(replace=True)
        self.assertEqual((self.output/'parity.json').read_bytes(), before)
        self.assertEqual(list((self.root/'lab').glob('.book-stage-*')),[])

    def test_user_edits_and_rogue_files_block_replace_and_package(self):
        m.build()
        for rogue in [self.output/'notes.txt', self.output/'node_modules/rogue.js']:
            rogue.parent.mkdir(parents=True,exist_ok=True)
            rogue.write_text('private development data')
            with self.assertRaises(ValueError): m.build(replace=True)
            with self.assertRaises(ValueError): m.package()
            rogue.unlink()
        (self.output/'index.html').write_text('edited')
        with self.assertRaisesRegex(ValueError,'edited'): m.build(replace=True)
        with self.assertRaises(ValueError): m.package()

    def test_archive_exact_contents_and_bytes_exclude_development_and_old_zip(self):
        rogue = self.root/'lab/node_modules/secret.txt'
        rogue.parent.mkdir(parents=True)
        rogue.write_text('not public')
        (self.root/'downloads/rogue.txt').write_text('not public')
        m.build()
        exported = m.package()
        with zipfile.ZipFile(exported) as archive:
            self.assertEqual(archive.namelist(),sorted(m.PUBLIC_FILES))
            self.assertNotIn(m.OFFLINE,archive.namelist())
            for name in m.PUBLIC_FILES:
                self.assertEqual(archive.read(name),(self.output/name).read_bytes())
        self.assertEqual(exported.read_bytes(),(self.output/m.OFFLINE).read_bytes())

    def test_rogue_archive_input_and_size_budget_rejected(self):
        files = m.read_public(self.root,source=True)
        with self.assertRaises(ValueError): m.write_archive(self.root/'bad.zip',{**files,'private.txt':b'private'})
        with patch.object(m,'MAX_ARCHIVE_BYTES',1):
            with self.assertRaisesRegex(ValueError,'budget'): m.build()
        self.assertFalse(self.output.exists())

    def test_staged_content_drift_aborts_installation(self):
        m.build()
        before = (self.output/'parity.json').read_bytes()
        writer = m.write_archive
        def corrupt(path, files):
            writer(path, files)
            (path.parents[1]/'index.html').write_text('<p>changed content</p>')
        with patch.object(m,'write_archive',side_effect=corrupt):
            with self.assertRaisesRegex(ValueError,'semantic content drift'): m.build(replace=True)
        self.assertEqual((self.output/'parity.json').read_bytes(), before)

    def test_inventory_identity_drift_rejected(self):
        original = m.audit((self.root/'index.html').read_text())
        inventory = self.inventory()
        inventory['sheets'][0]['panels'][0]['id'] = 'unknown'
        with self.assertRaises(ValueError): m.validate_inventory(original, inventory)

    def test_symlink_candidate_member_and_output_ancestor_rejected(self):
        m.build()
        path = self.output/'style.css'
        path.unlink()
        path.symlink_to(SOURCE/'style.css')
        with self.assertRaisesRegex(ValueError,'symlink'): m.package()
        external = Path(self.temp.name)/'external'
        external.mkdir()
        (self.root/'lab/.build').symlink_to(external,target_is_directory=True)
        with self.assertRaises(ValueError): m.package()

    def test_package_failure_preserves_previous_archive(self):
        m.build()
        output = m.package()
        before = output.read_bytes()
        with patch.object(m,'write_archive',side_effect=OSError('disk failure')):
            with self.assertRaises(OSError): m.package()
        self.assertEqual(output.read_bytes(), before)
        self.assertEqual(list(output.parent.glob('.archive-*')),[])

if __name__ == '__main__': unittest.main()
