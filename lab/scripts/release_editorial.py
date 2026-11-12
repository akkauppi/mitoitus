"""Accepted release edits, 13 November 2026; canonical source remains archived."""
import re

RETIRED_PANELS = ('walking-connections', 'stormwater')
PANEL_ALIASES = {'walking-connections': 'clear-route-continuity', 'stormwater': 'ground',
                 'parking-area': 'parking-layout'}
TITLES = {
    'clear-route-continuity': 'Walking path clearances',
    'equal-density': 'Floor-area ratio & building form',
    'section-ratio': 'Street width-to-height ratio',
    'walking': 'Footway & clear widths',
    'density': 'Residential density',
    'green-hierarchy': 'Green-space provision',
    'tram-width': 'Tram stop widths',
    'tram-length': 'Tram stop lengths & levels',
    'car-turn': 'Car lanes & turning radii',
    'bus-turn': 'Bus lanes & turning radii',
}


def apply_release_edits(text):
    def article(match):
        value = match[0]
        claims = re.findall(r'class="proof" href="evidence.html#([^"]+)"', value)
        if not claims:
            raise ValueError('Release article has no evidence identity')
        identity = claims[-1]
        if identity in RETIRED_PANELS:
            return ''
        if identity in TITLES:
            value = re.sub(r'<h2>.*?</h2>', '<h2>' + TITLES[identity] + '</h2>', value, count=1)
        if identity == 'walking':
            for old, new in (
                ('Basic footway · Espoo 2010', 'Total footway · Espoo 2010'),
                ('Clear passage · SuRaKu', 'Unobstructed passage · SuRaKu'),
                ('<dt>Wheelchair passing</dt>', '<dt>Wheelchair passing · clear width</dt>'),
                ('<dt>Machine maintenance</dt>', '<dt>Machine maintenance · clear width</dt>'),
                ('Basic footway · 2.5 m', 'Total footway · 2.5 m'),
                ('Clear passage · 1.5 m', 'Clear passage · ≥1.5 m'),
                ('Wheelchair passing · 1.8 m', 'Passing clear width · ≥1.8 m'),
                ('Machine maintenance · 2.3 m', 'Maintenance clear width · ≥2.3 m'),
            ):
                value = value.replace(old, new)
            value = value.replace('<div class="details">', '<div class="details"><p class="width-definition">Footway width is the full path. Clear width is the unobstructed passage.</p>', 1)
        return value
    text = re.sub(r'<article\b.*?</article>', article, text, flags=re.S)
    text = text.replace('v2026-11-12', 'v2026-11-13')
    text = text.replace('Land &amp; population', 'Residents &amp; services').replace('Land & population', 'Residents & services')
    # Square interface corners, including authored inline SVG rectangles.
    text = re.sub(r'(<rect\b[^>]*?)\s(?:rx|ry)="[^"]*"', r'\1', text)
    return text
