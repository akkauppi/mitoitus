"""Check the deployable artifact, local links, retirement and preserved CAD."""
import io
import json
import re
import sys
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from candidate import ROOT, KINDS, UNITS, PUBLIC_FILES, OFFLINE, digest, offline_files, render_branding


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links = set(), []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.links.append(attrs[key])


def verify(root):
    root = root.resolve()
    files = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
    expected = set(PUBLIC_FILES) | {OFFLINE, '.nojekyll', '.release-output', 'release.json'}
    assert files == expected, f'Unexpected release files: {files ^ expected}'
    parsers = {}
    for name in files:
        if name.endswith('.html'):
            parser = Links()
            parser.feed((root/name).read_text())
            parsers[name] = parser
    checked = 0
    for name, parser in parsers.items():
        for href in parser.links:
            link = urlsplit(href)
            if link.scheme or link.netloc or not link.path and not link.fragment:
                continue
            target = ((root/name).parent / unquote(link.path)).resolve() if link.path else root/name
            assert target.is_relative_to(root), f'Escaping public link: {name}: {href}'
            assert target.is_file(), f'Missing public link: {name}: {href}'
            relative = target.relative_to(root).as_posix()
            if link.fragment and relative in parsers:
                # These historical hashes are deliberately handled by the application.
                aliases = {'transit-access','fit-street','section-scale'} if relative=='index.html' else set()
                assert unquote(link.fragment) in parsers[relative].ids | aliases, f'Missing anchor: {name}: {href}'
            checked += 1
    text = (root/'index.html').read_text()
    assert 'data-legacy-visual' not in text
    assert 'Check every link' not in text and '<h2>Stormwater storage</h2>' not in text
    assert len(re.findall(r'<article\b', text)) == 30
    assert len(re.findall(r'<section class="sheet"', text)) == 11
    assert 'Walking path clearances' in text
    cad = [f'downloads/{kind}-{unit}.{ext}' for kind in KINDS for unit in UNITS for ext in ('dxf','svg')]
    for name in cad:
        assert (root/name).read_bytes() == (ROOT/name).read_bytes(), f'CAD drift: {name}'
    for unit in UNITS:
        name = f'downloads/mitoitus-cad-{unit}.zip'
        with zipfile.ZipFile(ROOT/name) as original, zipfile.ZipFile(root/name) as updated:
            assert updated.namelist() == original.namelist(), f'CAD bundle inventory drift: {name}'
            assert updated.testzip() is None
            for member in original.namelist():
                expected_member = original.read(member)
                if member in ('README.txt', 'evidence.html'):
                    expected_member = render_branding(expected_member)
                assert updated.read(member) == expected_member, f'CAD bundle drift: {name}/{member}'
    def check_branding(name, content):
        if name.endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                for member in archive.namelist():
                    check_branding(name + '/' + member, archive.read(member))
        else:
            assert not re.search(rb'(?i)antti(?:\xe2\x80\x99|\x27|&rsquo;|&#0*39;|&#x0*27;)s', content), f'Old branding: {name}'
    for name in (*PUBLIC_FILES, OFFLINE):
        check_branding(name, (root/name).read_bytes())
    manifest = json.loads((root/'vendor/manifest.json').read_text())
    for name, sha in manifest['sha256'].items():
        assert digest((root/'vendor'/name).read_bytes()) == sha, f'Vendor drift: {name}'
    with zipfile.ZipFile(root/OFFLINE) as archive:
        assert set(archive.namelist()) == set(PUBLIC_FILES)
        assert archive.testzip() is None
        expected_offline = offline_files({name:(root/name).read_bytes() for name in PUBLIC_FILES})
        for name in PUBLIC_FILES:
            assert archive.read(name) == expected_offline[name], f'Offline mismatch: {name}'
        offline_parsers = {}
        for name in parsers:
            parser = Links()
            parser.feed(archive.read(name).decode())
            offline_parsers[name] = parser
        for name, parser in offline_parsers.items():
            for href in parser.links:
                link = urlsplit(href)
                if link.scheme or link.netloc or not link.path and not link.fragment:
                    continue
                target = ((root/name).parent / unquote(link.path)).resolve() if link.path else root/name
                assert target.is_relative_to(root), f'Escaping offline link: {href}'
                relative = target.relative_to(root).as_posix()
                assert relative in PUBLIC_FILES, f'Missing offline link: {name}: {href}'
                if link.fragment and relative in offline_parsers:
                    aliases = {'transit-access','fit-street','section-scale'} if relative=='index.html' else set()
                    assert unquote(link.fragment) in offline_parsers[relative].ids | aliases, f'Missing offline anchor: {name}: {href}'
    print(f'PASS: {checked} public links and all offline links; 30 panels / 11 spreads; {len(cad)} preserved CAD files and 3 verified bundles; current branding throughout; vendor hashes; exact offline archive.')


if __name__ == '__main__':
    verify(Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'lab/.build/release'))
