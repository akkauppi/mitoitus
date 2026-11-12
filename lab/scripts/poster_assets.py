"""T15 explicit modern-poster inventory and source-figure replacement."""
import hashlib
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

MANIFEST = 'lab/posters/manifest.json'
NATIVE_CLASSES = ('population-tiles', 'distance-circles', 'library-equivalent', 'parking-norms-chart', 'metric-slope-chart')


def read_manifest(root):
    path = Path(root) / MANIFEST
    if not path.is_file() or path.is_symlink():
        raise ValueError('Modern posters missing; run node lab/scripts/capture-posters.cjs')
    data = json.loads(path.read_text())
    if data.get('schemaVersion') != 1 or data.get('style') != 'paper':
        raise ValueError('Unrecognised modern poster manifest')
    return data


def public_mapping(root):
    """Only manifest-declared files are public; no recursive asset glob."""
    manifest = read_manifest(root)
    mapping = {'posters/manifest.json': MANIFEST}
    for recipe in manifest['posters']:
        if not re.fullmatch(r'[a-z-]+--v\d+', recipe['id']):
            raise ValueError('Unsafe poster recipe identity')
        for option in recipe['options']:
            if set(option['files']) != {'compact', 'wide'}:
                raise ValueError('Missing poster layout profile')
            for file in option['files'].values():
                name = file['path']
                if not re.fullmatch(r'posters/[a-z0-9-]+\.svg', name) or name in mapping:
                    raise ValueError('Unsafe or duplicate poster path')
                mapping[name] = 'lab/' + name
    return mapping


def validate_assets(root):
    manifest = read_manifest(root)
    from release_editorial import TITLES
    if manifest.get('titles') != TITLES:
        raise ValueError('Modern poster titles are stale; recapture after title changes')
    for name, expected in manifest['inputs'].items():
        path = Path(root) / name
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f'Modern posters are stale: {name}; recapture after source changes')
    crop_families = {}
    for recipe in manifest['posters']:
        for option in recipe['options']:
            for profile, file in option['files'].items():
                path = Path(root) / 'lab' / file['path']
                if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != file['sha256']:
                    raise ValueError(f'Modern poster changed: {file["path"]}')
                text = path.read_text()
                if 'data-legacy-visual' in text or '<image ' not in text or '<text ' not in text:
                    raise ValueError(f'Invalid raster/vector poster: {recipe["id"]}/{profile}')
                graphic = ET.fromstring(text)
                view_box = list(map(float, graphic.attrib['viewBox'].split()))
                if view_box != file['viewBox'] or float(graphic.attrib['width']) != file['width'] or float(graphic.attrib['height']) != file['height']:
                    raise ValueError(f'Poster crop metadata mismatch: {file["path"]}')
                left, top, width, height = view_box
                source_size = manifest['profiles'][profile]
                if left != 0 or width != source_size['width'] or not 0 < height <= source_size['height'] or top < 0 or top + height > source_size['height']:
                    raise ValueError(f'Poster crop changes scale or extends its source: {file["path"]}')
                bounds = file['contentBounds']
                if bounds['top'] < top - .5 or bounds['bottom'] > top + height + .5:
                    raise ValueError(f'Poster crop removes model or annotations: {file["path"]}')
                image = graphic.find('{http://www.w3.org/2000/svg}image')
                if float(image.attrib['width']) != source_size['width'] or float(image.attrib['height']) != source_size['height']:
                    raise ValueError(f'Poster crop resizes metric geometry: {file["path"]}')
                family = file['comparisonFamily']
                if family in crop_families and crop_families[family] != view_box:
                    raise ValueError(f'Inconsistent comparison-family crop: {family}')
                crop_families[family] = view_box
    return manifest


def slope_graphic():
    """New native vector chart of the retained 1:4 relationship, not an old figure."""
    return '''<svg class="metric-slope-chart" data-native-graphic="bank-slope" viewBox="25 375 380 80" role="img" aria-label="Bank slope: one metre vertically to four metres horizontally, 25 percent"><g data-geometry="bank-slope"><path d="M45 418H165V388Z" fill="#d7e3d0" stroke="#586a60" stroke-width="1"/><path d="M45 432H165M45 428V436M165 428V436M179 388V418M175 388H183M175 418H183" fill="none" stroke="#586a60" stroke-width="1"/><text x="105" y="450" text-anchor="middle" style="font:13px Arial;fill:#364c42">4 m horizontal</text><text x="192" y="407" style="font:13px Arial;fill:#364c42">1 m vertical</text></g></svg>'''


def figure_markup(original, recipe):
    esc = lambda value: html.escape(str(value), quote=True)
    opening = re.match(r'<figure\b[^>]*>', original)[0]
    opening = opening[:-1] + f' data-current-poster="{esc(recipe["id"])}" data-poster-set="{esc(recipe["id"])}">'
    caption = ''.join(re.findall(r'<figcaption\b.*?</figcaption>', original, re.S))
    control = ''
    multiple = len(recipe['options']) > 1
    if multiple:
        options = ''.join(f'<option value="{item["category"]}"'+(' selected' if item['category'] == recipe['categoryDefault'] else '')+f'>{esc(item["label"])}</option>' for item in recipe['options'])
        control = f'<label class="poster-control">{esc(recipe["categoryPrompt"])} <select data-poster-choice aria-label="{esc(recipe["categoryPrompt"])}">{options}</select></label>'
    pictures = []
    for item in recipe['options']:
        selected = not multiple or item['category'] == recipe['categoryDefault']
        description = recipe['description'] + (f' {item["label"]}.' if item['label'] else '')
        images = ''.join(f'<img class="modern-poster modern-poster-{profile}" data-poster-profile="{profile}" src="{esc(file["path"])}" width="{file["width"]}" height="{file["height"]}" alt="{esc(description)}" decoding="sync">' for profile, file in item['files'].items())
        title = f'<p class="poster-selection-label">{esc(item["label"])}</p>' if multiple else ''
        pictures.append(f'<div class="poster-option" data-poster-option="{item["category"]}"'+('' if selected else ' hidden')+'>'+images+title+'</div>')
    return opening + control + ''.join(pictures) + caption + '</figure>'


def replace_figures(text, root):
    recipes = {item['id']: item for item in read_manifest(root)['posters']}
    used = set()
    def article(match):
        value = match[0]
        claim = re.findall(r'class="proof" href="evidence.html#([^"]+)"', value)[-1]
        counter = 0
        def figure(match):
            nonlocal counter
            original = match[0]
            if not re.search(r'<svg\b', original):
                return original
            # New data charts are already native vectors; retain their exact text.
            if any(re.search(r'<svg\b[^>]*class="[^"]*\b' + re.escape(name) + r'\b', original) for name in NATIVE_CLASSES):
                return original
            identity = f'{claim}--v{counter}'
            counter += 1
            if identity not in recipes:
                raise ValueError(f'No reviewed modern poster for {identity}')
            used.add(identity)
            return figure_markup(original, recipes[identity])
        value = re.sub(r'<figure\b.*?</figure>', figure, value, flags=re.S)
        if claim == 'ponds':
            # Existing live companion selector reuses this newly authored chart.
            value = value.replace('</figure>', '</figure>' + slope_graphic(), 1)
        return value
    text = re.sub(r'<article\b.*?</article>', article, text, flags=re.S)
    unexpected = set(recipes) - used
    if unexpected:
        raise ValueError('Unused poster recipes: ' + ', '.join(sorted(unexpected)))
    for match in re.finditer(r'<svg\b[^>]*>', text):
        if not any(name in match[0] for name in NATIVE_CLASSES):
            raise ValueError('Unreplaced non-native SVG remains in book')
    return text
