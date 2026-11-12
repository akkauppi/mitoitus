"""Release population/service tables; baseline source files remain unchanged."""
import json
import re
from html import escape
from pathlib import Path

DENSITIES = [('Detached',30),('Linked low-rise',50),('Row houses',75),('Apartments ≤7 floors',100)]
DATA_PATH = Path(__file__).resolve().parents[1] / 'data/release-data.json'


def release_data():
    """Read reviewed local data, never the network during a build."""
    return json.loads(DATA_PATH.read_text())

def hierarchy_svg():
    parts=['<svg class="distance-circles" viewBox="0 0 400 530" role="img" aria-label="Historical distance references from home: numbered circles for 50, 150 and 500 metres at one radius scale"><g transform="translate(190 185)">']
    for distance in [500,150,50]:
        parts.append(f'<circle class="distance-ring" cx="0" cy="0" r="{distance*.3}" data-distance-metres="{distance}"/>')
    parts.append('<path class="population-house" d="M-7 6V-4L0-11L7-4V6Z"/><path class="house-roof" d="M-10-3L0-13L10-3"/><text class="population-small" x="-20" y="25">Home</text>')
    entries=[(1,50,-25,0,'Plot play / stay'),(2,150,31.82,-31.82,'Neighbourhood park'),(3,500,147.72,26.05,'District recreation')]
    for number,value,x,y,label in entries:
        parts.append(f'<g class="distance-tag" data-distance-tag="{number}" transform="translate({x} {y})"><circle r="11"/><text text-anchor="middle" y="5">{number}</text></g>')
    parts.append('</g>')
    for number,value,x,y,label in entries:
        y=380+(number-1)*49
        parts.append(f'<g class="distance-key" data-distance-key="{number}" transform="translate(35 {y})"><g class="distance-tag"><circle r="11"/><text text-anchor="middle" y="5">{number}</text></g><text class="population-small" x="24" y="5">{label}</text><text class="population-value" x="330" y="5" text-anchor="end">≤{value} m</text></g>')
    parts.append('</svg>');return ''.join(parts)

def services_table():
    data = release_data()
    parts = ['<div class="service-reference" data-editorial="services-release-2026-11-13">']
    for group in ('Daycare', 'School', 'Library'):
        parts.append(f'<table class="service-table"><caption>{group}</caption>'
                     '<thead><tr><th scope="col">Measure</th><th scope="col">Reference</th></tr></thead><tbody>')
        for row in data['serviceRows']:
            if row['group'] != group:
                continue
            parts.append(f'<tr data-service-row="{row["id"]}" data-source-id="{row["source"]}">'
                         f'<th scope="row">{escape(row["label"])}<small class="service-context">{escape(row["context"])}</small></th>'
                         f'<td><strong>{escape(row["value"])}</strong><small class="service-basis">{escape(row["basis"])}</small></td></tr>')
        parts.append('</tbody></table>')
    parts.append('<p class="service-unit-key">¹ Huoneistoala here excludes kitchens and technical rooms.</p></div>')
    return ''.join(parts)


def _details(article):
    match = re.search(r'<div class="details">(.*?)</div></div><a class="proof"', article, re.S)
    if not match:
        raise ValueError('Population panel details structure changed')
    return match[1]


def _data_panel(article, details):
    start = article.index('<div class="panel-body">')
    end = article.rindex('<a class="proof"')
    article = article[:start] + '<div class="panel-body"><div class="details">' + details + '</div></div>' + article[end:]
    return article.replace('class="panel ', 'class="panel data-panel ', 1)


def _density_details(article):
    details = _details(article)
    # Preserve the historical e table exactly; the population column has another
    # denominator and is deliberately a separate table, not a derived conversion.
    rows = ''.join(f'<tr><th scope="row">{escape(name)}</th><td>~{value}</td></tr>' for name, value in DENSITIES)
    table = ('<table class="resident-density-table"><caption>Residents per hectare · TKK 2007</caption>'
             '<thead><tr><th scope="col">Form</th><th scope="col">Residents / ha</th></tr></thead>'
             f'<tbody>{rows}</tbody></table>')
    return table + details

def redesign_population(section):
    articles=list(re.finditer(r'<article\b.*?</article>',section,re.S))
    if len(articles)!=3:raise ValueError('Population sheet must have three panels')
    out=[]
    for i,match in enumerate(articles):
        article = match[0]
        if i == 0:
            article = _data_panel(article, _density_details(article))
        elif i == 1:
            article = re.sub(r'<svg\b.*?</svg>', lambda _: hierarchy_svg(), article, count=1, flags=re.S)
            article = article.replace('</svg></figure>', '</svg><figcaption class="source-meta">Assistant artwork: numbered historical distances at one radius scale. Check actual walking routes.</figcaption></figure>')
        else:
            # Original local population cases remain inspectable under Sources.
            # They are not presented as general viability thresholds.
            baseline = _details(article)
            details = services_table() + ('<div class="source-meta service-provenance">'
                '<p><a href="evidence.html#services-release">Service-space sources and definitions ↗</a></p>'
                '<p>Assistant synthesis, 13 November 2026. Named municipal targets, project cases and dated library references; denominators are retained in the tables.</p>'
                '<h3>Earlier service cases</h3>' + baseline + '</div>')
            article = _data_panel(article, details)
            article = article.replace('02 / PUBLIC SERVICES · DATED EXAMPLES', '02 / SERVICES · DATED MUNICIPAL REFERENCES')
        out.append(article)
    iterator=iter(out);return re.sub(r'<article\b.*?</article>',lambda _:next(iterator),section,flags=re.S)


def render_population_evidence(source):
    """Append release evidence to generated output; leave canonical bytes alone."""
    text = source.decode() if isinstance(source, bytes) else source
    if 'id="services-release"' in text:
        raise ValueError('Service supplement already appended')
    data = release_data()
    parts = ['<section id="services-release"><span class="label">SERVICES · RELEASE SUPPLEMENT</span>'
             '<h2>Service-space references</h2><p>Reviewed 13 November 2026. Assistant-drafted English reference table. '
             'The locality, edition and area denominator belong to each value.</p>']
    for identity, record in data['sources'].items():
        parts.append(f'<h3 id="source-{identity}"><a href="{escape(record["url"], quote=True)}">{escape(record["title"])}</a></h3>'
                     f'<p>{escape(record["edition"])} · {escape(record["locator"])}. {escape(record["scope"])}</p><ul>')
        for row in data['serviceRows']:
            if row['source'] == identity:
                href = record['url'] + row.get('fragment', '')
                parts.append(f'<li id="{row["id"]}"><a href="{escape(href, quote=True)}">{escape(row["group"]+": "+row["label"])}</a>: '
                             f'<b>{escape(row["value"])}</b>. {escape(row["basis"])}. {escape(row["qualifier"])}</li>')
        parts.append('</ul>')
    parts.append('<p><a href="data/release-data.json">Machine-readable values and source hashes</a>. '
                 'The earlier school-growth and health-station cases remain in the <a href="#services">baseline evidence</a>.</p></section>')
    text = text.replace('<section id="services">', '<section id="services"><p><a href="#services-release">Expanded service-space reference table, 13 November 2026 ↗</a></p>', 1)
    text = text.replace('</body>', ''.join(parts) + '</body>')
    return text.encode() if isinstance(source, bytes) else text
