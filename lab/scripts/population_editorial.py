"""T13 user-directed population graphics and service-measure grouping. Native SVG."""
import re
from html import escape

DENSITIES = [('Detached',30),('Linked low-rise',50),('Row houses',75),('Apartments ≤7 floors',100)]
AREA_HA = .4

def resident(x,y):
    return f'<g data-resident="1" transform="translate({x:.2f} {y:.2f})" class="population-person"><circle cy="-7.5" r=".65"/><path d="M-.8-6.2L.8-6.2L1.2-3.5H.65L.45-4.8V-2.7L1 0H.3L0-2.3L-.3 0H-1L-.45-2.7V-4.8L-.65-3.5H-1.2Z"/></g>'

def density_svg():
    parts=['<svg class="population-tiles" viewBox="0 0 440 398" role="img" aria-label="Historical densities shown on equal 0.4 hectare area tiles: 12, 20, 30 and 40 resident symbols represent approximately 30, 50, 75 and 100 residents per hectare">']
    for i,(name,density) in enumerate(DENSITIES):
        cx,top = 110+(i%2)*220,36+(i//2)*185
        count=round(density*AREA_HA)
        parts.append(f'<g data-density="{density}" data-area-ha="{AREA_HA}" data-resident-count="{count}"><text x="{cx}" y="{top-16}" text-anchor="middle" class="population-category">{escape(name)}</text>')
        parts.append(f'<path class="population-earth" d="M{cx-90} {top+38}L{cx} {top+76}L{cx+90} {top+38}V{top+44}L{cx} {top+82}L{cx-90} {top+44}Z"/><path class="population-land" data-area-tile="4000" d="M{cx} {top}L{cx+90} {top+38}L{cx} {top+76}L{cx-90} {top+38}Z"/>')
        # Evenly distribute the exact symbol count over a shared five-by-eight grid.
        for j in range(count):
            slot=(j*17)%40;u=8+(slot%5)*21;v=6+(slot//5)*12
            parts.append(resident(cx+(u-v)*.9,top+(u+v)*.38))
        parts.append(f'<text x="{cx}" y="{top+108}" text-anchor="middle" class="population-value">~{density}<tspan class="population-unit"> residents/ha</tspan></text><text x="{cx}" y="{top+130}" text-anchor="middle" class="population-small">{count} residents · 0.4 ha</text></g>')
    parts.append('</svg>');return ''.join(parts)

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

def library_svg():
    return '<svg class="library-equivalent" viewBox="0 0 440 280" role="img" aria-label="Useful library area equivalent: ten by ten metres is one hundred square metres per thousand residents"><text x="26" y="27" class="population-small">Useful area equivalent</text><rect class="library-tile" x="40" y="78" width="140" height="140" data-geometry="library-area" data-metres-width="10" data-metres-height="10" data-scale="14"/><path class="distance-radius" d="M40 60H180M40 56V64M180 56V64M198 78V218M194 78H202M194 218H202"/><text x="110" y="51" text-anchor="middle" class="population-small">10 m</text><text x="210" y="153" class="population-small">10 m</text><text x="110" y="153" text-anchor="middle" class="population-value">100 m²</text><text x="265" y="135" class="population-value">~100 m²</text><text x="265" y="160" class="population-small">per 1,000 residents</text></svg>'

def redesign_population(section):
    graphics=[density_svg(),hierarchy_svg(),library_svg()]
    articles=list(re.finditer(r'<article\b.*?</article>',section,re.S))
    if len(articles)!=3:raise ValueError('Population sheet must have three panels')
    out=[]
    for i,match in enumerate(articles):
        article=re.sub(r'<svg\b.*?</svg>',lambda _:graphics[i],match[0],count=1,flags=re.S)
        captions=['Assistant artwork: equal 0.4 ha tiles; resident symbols use the historical TKK density examples.','Assistant artwork: circles compare the historical distance levels; icons are reference symbols, not a mapped catchment.','Assistant artwork: useful library area equivalent; service cases retain their separate historical measures.']
        article=article.replace('</svg></figure>', '</svg><figcaption class="source-meta">'+captions[i]+'</figcaption></figure>')
        if i==2:
            # Preserve every original dl and qualifier while grouping incompatible measures.
            pattern=r'(<dl class="specs">.*?</dl>)(<p>.*?</p>)'
            kinds=iter([('Space provision · Ministry 2010','library'),('Local growth trigger · Seinäjoki 2017','growth'),('Proposed responsibility · Helsinki 2020','responsibility')])
            def card(m):
                heading,kind=next(kinds)
                return f'<div class="service-case" data-service-measure="{kind}"><h3 class="editorial-heading">{heading}</h3>'+m[1]+m[2]+'</div>'
            article=re.sub(pattern,card,article,flags=re.S)
        out.append(article)
    iterator=iter(out);return re.sub(r'<article\b.*?</article>',lambda _:next(iterator),section,flags=re.S)
