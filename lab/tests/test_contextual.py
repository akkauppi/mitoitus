"""Regression tests for revision immutability and the contextual schema."""
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'lab/scripts'))
from curated_reference import (LOCK_PATH, SCHEMA_CHECK, SCHEMA_SOURCE, build_curated,
                               validate_quantity, validate_service_quantity, verify_previous_lock,
                               verify_revision_lock, verify_worked_examples)
from candidate import EDITION, render_evidence_json


class ContextualAssertionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        evidence = json.loads(render_evidence_json((ROOT/'evidence.json').read_bytes()))
        cls.dataset = build_curated(ROOT,evidence,EDITION)
        cls.ledger = json.loads((ROOT/LOCK_PATH).read_bytes())

    def test_existing_revision_cannot_change_scope_or_formula(self):
        for mutate in (
            lambda d:d['assertions'][0].update(applicability='Different scope'),
            lambda d:d['assertions'][0]['evidence'][0].update(locator='Different page'),
            lambda d:d['examples']['equal-far'].update(formula='Different calculation'),
            lambda d:d['examples']['detention-worked-plan-area']['inputs']['effectiveDepth'].update(value=.25),
            lambda d:d['assertions'].pop(),
        ):
            altered = deepcopy(self.dataset)
            mutate(altered)
            with self.assertRaisesRegex(ValueError,'revision lock drift'):
                verify_revision_lock(altered,self.ledger['revisions'])

    def test_ledger_is_append_only(self):
        revised = deepcopy(self.ledger)
        key = next(iter(revised['revisions']))
        revised['revisions']['new-record/r1'] = '0'*64
        verify_previous_lock(self.ledger,revised)
        revised['revisions'][key] = 'f'*64
        with self.assertRaisesRegex(ValueError,'revision locked'):
            verify_previous_lock(self.ledger,revised)

    def test_worked_example_revision_locks_inputs_calculations_and_results(self):
        publication = json.loads(subprocess.check_output(['node',str(ROOT/'lab/morphology/publish.mjs')]))
        examples = publication['workedExamples']
        key = 'residential-block-capacity/r1'
        revisions = {f'{item["id"]}/r{item["revision"]}' for item in self.dataset['assertions']}
        measurements = json.loads((ROOT/'lab/data/morphology/measurements.json').read_bytes())['measurements'].keys()
        verify_worked_examples(examples,revisions,measurements,self.ledger['workedExamples'])
        for mutate in (
            lambda row:row['inputs'].update(residentialShare=.5),
            lambda row:row['formulas']['populationEstimate'].update(expression='P = 0'),
            lambda row:row['alternatives'][0]['results'].update(populationEstimate=20),
            lambda row:row['scenarios']['unknown-occupancy']['overrides'].update(occupancy=0),
        ):
            altered = deepcopy(examples)
            mutate(altered[key])
            with self.assertRaisesRegex(ValueError,'Worked-example revision lock drift'):
                verify_worked_examples(altered,revisions,measurements,self.ledger['workedExamples'])
        with self.assertRaisesRegex(ValueError,'Missing worked-example dependency'):
            verify_worked_examples(examples,revisions-{'far-coverage-storeys-identity/r1'},
                                   measurements,self.ledger['workedExamples'])
        revised = deepcopy(self.ledger)
        revised['workedExamples'][key] = 'f'*64
        with self.assertRaisesRegex(ValueError,'revision locked'):
            verify_previous_lock(self.ledger,revised)

    def test_edition_and_navigation_do_not_change_the_semantic_hash(self):
        altered = deepcopy(self.dataset)
        altered['edition'] = 'other-release'
        altered['assertions'][0]['urls']['canonical'] = 'https://example.org/new-url'
        verify_revision_lock(altered,self.ledger['revisions'])

    def test_dimensionless_coverage_does_not_require_far_bases(self):
        quantity = {'kind':'scalar','unit':'1','value':.5}
        validate_quantity(quantity,'building-coverage')
        with self.assertRaisesRegex(ValueError,'FAR requires'):
            validate_quantity(quantity,'floor-area-ratio')

    def test_service_denominator_and_values_agree_with_the_released_row(self):
        espoo = next(r for r in self.dataset['assertions'] if r['id']=='espoo-daycare-yard')
        source = json.loads((ROOT/'lab/data/release-data.json').read_bytes())
        row = next(r for r in source['serviceRows'] if r['id']=='daycare-yard-espoo')
        validate_service_quantity(espoo['quantity'],row)
        altered = deepcopy(espoo['quantity'])
        altered['denominator']['unit'] = 'child'
        with self.assertRaisesRegex(ValueError,'disagrees with service row'):
            validate_service_quantity(altered,row)

    def test_schema_distinguishes_ranges_bounds_and_named_dimensions(self):
        def validate(quantity):
            altered = deepcopy(self.dataset)
            altered['assertions'][0]['quantity'] = quantity
            return subprocess.run(['node',str(ROOT/SCHEMA_CHECK),str(ROOT/SCHEMA_SOURCE)],
                                  input=json.dumps(altered).encode(),capture_output=True)
        for name in ('recommended_interval','uncertainty_interval','observed_variation'):
            result = validate({'kind':'range','unit':'1','minimum':.3,'maximum':.7,'intervalType':name})
            self.assertEqual(result.returncode,0,result.stderr)
        for invalid in (
            {'kind':'range','unit':'1','minimum':.3,'maximum':.7},
            {'kind':'bound','unit':'m','value':1.5,'operator':'maybe'},
            {'kind':'rate','numerator':{'value':1,'unit':'m3','basis':'volume'},
             'denominator':{'value':0,'unit':'m2','basis':'impermeable area'}},
        ):
            self.assertNotEqual(validate(invalid).returncode,0)
        with self.assertRaisesRegex(ValueError,'reversed'):
            validate_quantity({'kind':'range','unit':'m','minimum':4,'maximum':2},'length')
