"""Build an isolated, content-checked baseline candidate."""
import argparse
from pathlib import Path
from candidate import build

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-root', type=Path)
    parser.add_argument('--replace', action='store_true', help='Replace only an intact generated candidate')
    args = parser.parse_args()
    result = build(args.output_root, args.replace)
    print(f'Candidate verified: {result["sheets"]} sheets, {result["panels"]} panels, {result["drawings"]} drawings')
