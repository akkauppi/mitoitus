"""User-requested connection-panel redesign, 2026-11-12. Assistant editorial draft.
Baseline HTML/evidence remain archived; no new dimensional standard is introduced.
"""
import re

NETWORK_SVG = '''<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Schematic connection through a gate and crossing to the actual entrance, rather than to a nearby wall" data-network="continuity">
<rect x="300" y="70" width="50" height="260" fill="#c6ced4"/>
<rect x="420" y="100" width="140" height="205" rx="3" fill="#eee5d2" stroke="#58605d"/>
<text x="490" y="130" text-anchor="middle" class="small-label">Destination</text>
<path d="M55 275H300M350 275H375V220H420" fill="none" stroke="#496f74" stroke-width="6" stroke-linejoin="round"/>
<g fill="#fcf7e8"><rect x="304" y="255" width="6" height="40"/><rect x="316" y="255" width="6" height="40"/><rect x="328" y="255" width="6" height="40"/><rect x="340" y="255" width="6" height="40"/></g>
<path d="M190 254V275M190 254L211 238" fill="none" stroke="#58605d" stroke-width="4"/>
<path d="M375 275H420" fill="none" stroke="#b0796b" stroke-width="2" stroke-dasharray="5 5"/>
<path d="M414 266L426 284M426 266L414 284" stroke="#b0796b" stroke-width="3"/>
<path d="M420 205V235" stroke="#a9c4a2" stroke-width="8"/>
<circle cx="55" cy="275" r="7" fill="#dfb29d" stroke="#58605d"/>
<circle cx="420" cy="220" r="6" fill="#a9c4a2" stroke="#58605d"/>
<text x="55" y="315" text-anchor="middle" class="small-label">Start</text>
<path d="M190 245V195H140" fill="none" stroke="#758777"/><text x="85" y="175" class="small-label">Gate</text><text x="85" y="194" class="tiny">Open when needed?</text>
<path d="M325 253V195" fill="none" stroke="#758777"/><text x="325" y="157" text-anchor="middle" class="small-label">Crossing</text><text x="325" y="176" text-anchor="middle" class="tiny">Usable and connected?</text>
<text x="440" y="215" class="small-label">Actual entrance</text><text x="440" y="235" class="tiny">Accessible approach?</text>
<path d="M420 286V345H465" fill="none" stroke="#b0796b"/><text x="385" y="369" class="small-label">Wall ≠ entrance</text>
<text x="30" y="32" class="sub">FOLLOW THE WHOLE CONNECTION</text>
</svg>'''
NETWORK_DETAILS = '''<div class="details" data-editorial="continuity-draft">
<p class="connection-lesson">A short route is useful only if every link works.</p>
<dl class="specs"><div><dt>Access gate</dt><dd>When is it open?</dd></div><div><dt>Crossing</dt><dd>Does the route continue?</dd></div><div><dt>Actual entrance</dt><dd>Can you reach and use it?</dd></div></dl>
<p>Trace the route all the way to the actual entrance, not just to the plot or building edge. Check barriers, opening hours, slopes and winter maintenance.</p>
<p>One unavailable link can break an otherwise adequate connection. Distance alone cannot establish usability.</p>
<p class="source-meta">Assistant editorial draft, 12 November 2026. Schematic, not a real site, measured network or accessibility certification. Uses the retained source discussion of connections, entrances and operational conditions; introduces no distance threshold.</p>
</div>'''
CLEAR_SVG = '''<svg viewBox="0 0 440 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label="One continuous pedestrian corridor: clear width at least 1.5 metres and overhead clearance at least 2.2 metres, with 3 metres recommended under a building">
<text x="20" y="28" class="sub">KEEP A CONTINUOUS CLEAR CORRIDOR</text>
<path d="M55 340L225 385L395 260L225 215Z" fill="#eee5d2" stroke="#58605d"/>
<path d="M90 335L190 362L360 237L260 210Z" fill="#cbdde0" stroke="#758777"/>
<path d="M90 335V155L190 182V362M90 155L190 182L360 57V237M190 182L360 57" fill="none" stroke="#758777" stroke-dasharray="5 4"/>
<path d="M245 152L345 179L395 142L295 115Z" fill="#eee5d2" stroke="#58605d"/>
<text x="48" y="130" class="measure">≥2.2 m clear height</text>
<text x="90" y="394" class="measure">≥1.5 m clear width</text>
<text x="225" y="91" class="small-label">Under building: ≥3 m recommended</text>
</svg>'''

def redesign_connections(section):
    articles = list(re.finditer(r'<article\b.*?</article>', section, re.S))
    if len(articles) != 3:
        raise ValueError('Expected three connection panels')
    revised = []
    for index, match in enumerate(articles):
        article = match[0]
        if index == 1:
            article = article.replace('<h2>Route length, not radius</h2>', '<h2>Check every link</h2>')
            article = re.sub(r'<svg\b.*?</svg>', lambda _: NETWORK_SVG, article, count=1, flags=re.S)
            article = re.sub(r'<figcaption\b.*?</figcaption>', '<figcaption class="source-meta">Assistant editorial draft. All symbols are schematic; check the whole chain in the actual plan.</figcaption>', article, count=1, flags=re.S)
            a, b = article.index('<div class="details">'), article.index('<a class="proof"')
            original = article[a:b].rsplit('</div>', 1)[0]
            retained = original.replace('class="details"', 'class="retained-reference"', 1)
            article = article[:a]+NETWORK_DETAILS+'<details class="source-meta connection-history"><summary>Earlier distance example · retained reference</summary>'+retained+'</details></div>'+article[b:]
        if index == 2:
            article = article.replace('<h2>Clear space in 3D</h2>', '<h2>Keep the whole corridor clear</h2>')
            article = re.sub(r'<svg\b.*?</svg>', lambda _: CLEAR_SVG, article, count=1, flags=re.S)
            article = re.sub(r'<figcaption\b.*?</figcaption>', '<figcaption class="source-meta">Assistant illustration draft: one continuous corridor. Width and overhead clearance apply together; under-building height remains a distinct recommendation.</figcaption>', article, count=1, flags=re.S)
        revised.append(article)
    sequence = iter(revised)
    return re.sub(r'<article\b.*?</article>', lambda _: next(sequence), section, flags=re.S)
