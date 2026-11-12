"""T14: merge accounting into bay layout, retire its standalone panel."""
import re

def norms_svg():
    return '''<svg class="parking-norms-chart" viewBox="0 0 420 320" role="img" aria-label="2025 examples for 10000 residential floor square metres and 100 dwellings: Helsinki zone 3 outside centres, 44 spaces; Espoo class I core, 77 spaces"><text x="24" y="28" class="norm-context">10,000 residential floor-m²</text><text x="24" y="52" class="norm-context">100 dwellings</text><text x="24" y="80" class="norm-label">Helsinki · zone 3</text><text x="24" y="104" class="norm-context">Outside C1/C2/C3 centres</text><rect x="24" y="118" width="182.857142857" height="28" class="norm-bar-helsinki" data-count="44"/><text x="224" y="140" class="norm-value">44 spaces</text><text x="24" y="204" class="norm-label">Espoo · class I core</text><rect x="24" y="222" width="320" height="28" class="norm-bar-espoo" data-count="77"/><text x="344" y="282" text-anchor="end" class="norm-value">77 spaces</text><text x="24" y="310" class="norm-context">Rounded up · no reductions</text></svg>'''

def redesign_parking(section):
    articles=re.findall(r'<article\b.*?</article>',section,re.S)
    if len(articles)!=3:raise ValueError('Expected three original parking panels')
    layout,area,norms=articles
    details=re.search(r'<div class="details">(.*)</div></div><a class="proof"',area,re.S)[1]
    archived='<div class="source-meta parking-area-reference" data-retained-panel="parking-area">'+details+'<a href="evidence.html#parking-area">Area accounting sources ↗</a></div>'
    layout=layout.replace('<a class="proof" href="evidence.html#parking-layout">',archived+'<a class="proof" href="evidence.html#parking-layout">')
    norms=re.sub(r'<svg\b.*?</svg>',lambda _:norms_svg(),norms,count=1,flags=re.S)
    result=section.replace(''.join(articles),layout+norms)
    if result==section:raise ValueError('Parking transformation failed')
    return result
