"""Original filled SVG reference figures, in metres, with uniform scaling.

People: explicit illustrative posture/height. Vehicle body bounds are published
reference dimensions; detailing is schematic and never used for swept paths.
"""

def person(x,ground,scale,key='person'):
    # Head top -1.75, shoe soles 0. Filled anatomical/clothing contours.
    shape='''<circle cx="0" cy="-1.645" r=".105"/>
<path d="M-.048-1.55h.096v.10h-.096z"/>
<path d="M-.10-1.49Q-.18-1.49-.21-1.40L-.16-1.06-.15-.87Q0-.82.15-.87L.16-1.06.21-1.40Q.18-1.49.10-1.49Z"/>
<path d="M-.19-1.43Q-.23-1.44-.25-1.34L-.30-1.04Q-.30-.98-.25-.98Q-.21-.98-.21-1.04L-.16-1.33Z"/>
<path d="M.19-1.43Q.23-1.44.25-1.34L.30-1.04Q.30-.98.25-.98Q.21-.98.21-1.04L.16-1.33Z"/>
<path d="M-.15-.9H.015L-.06-.48-.10-.08-.07-.04Q-.04 0-.10 0H-.23Q-.26-.01-.23-.05L-.20-.10-.18-.52Z"/>
<path d="M-.015-.9H.15L.18-.52.20-.10.23-.05Q.26-.01.23 0H.10Q.04 0 .07-.04L.10-.08.06-.48Z"/>'''
    return f'<g class="scale-figure person" data-figure="{key}" data-reference-height="1.75" data-scale="{scale}" transform="translate({x:g} {ground:g}) scale({scale:g})" fill="#c3c3bf">{shape}</g>'

def cyclist(x,ground,scale,key='cyclist'):
    # Front elevation. Overall 1.65 m from tyre contact to helmet crown; 0.60 m bars.
    # The separate 0.75 m design-user envelope is not the silhouette width.
    shape='''<path d="M-.031-.70Q-.05-.69-.05-.64V-.05Q-.05 0 0 0Q.05 0 .05-.05V-.64Q.05-.69.031-.70Z" fill="#242424"/>
<path d="M-.012-.65H.012V-.05H-.012Z" fill="#bfc5c8"/>
<path d="M-.04-1.03H.04V-.65H-.04Z" fill="#68727a"/>
<rect x="-.30" y="-1.07" width=".60" height=".045" rx=".02" fill="#222"/>
<path d="M-.11-.94Q-.26-.91-.25-.72L-.16-.48-.18-.36-.07-.34-.055-.43-.13-.74.04-.84Z" fill="#252525"/>
<path d="M.11-.94Q.23-.90.24-.74L.19-.56.15-.31.04-.33.07-.58.12-.75-.04-.84Z" fill="#252525"/>
<path d="M-.10-1.42Q-.18-1.40-.18-1.24L-.12-.93Q0-.87.12-.93L.18-1.24Q.18-1.40.10-1.42Z" fill="#252525"/>
<path d="M-.15-1.36Q-.23-1.36-.26-1.24L-.29-1.08-.23-1.04-.17-1.20-.11-1.27Z" fill="#252525"/>
<path d="M.15-1.36Q.23-1.36.26-1.24L.29-1.08.23-1.04.17-1.20.11-1.27Z" fill="#252525"/>
<ellipse cx="0" cy="-1.505" rx=".095" ry=".11" fill="#252525"/>
<path d="M-.115-1.53C-.115-1.69.115-1.69.115-1.53L.08-1.56H-.08Z" fill="#252525"/>
<path d="M-.07-1.58H.07" fill="none" stroke="#f4f3ee" stroke-width=".013"/>'''
    # Helmet cubic has actual apex -1.65 (not the control-point height -1.69).
    shape=shape.replace('fill="#252525"','fill="#c3c3bf"').replace('fill="#242424"','fill="#788185"').replace('fill="#222"','fill="#788185"')
    return f'<g class="scale-figure cyclist" data-figure="{key}" data-reference-height="1.65" data-reference-width="0.6" data-scale="{scale}" transform="translate({x:g} {ground:g}) scale({scale:g})">{shape}</g>'

def vehicle(x,y,length,width,scale,kind,key,reverse=False):
    L,W=length,width
    # Bounds are exactly [0,L] x [0,W]. Tyres/mirrors are not allowed to enlarge them.
    parts=[f'<rect x="0" y="0" width="{L:g}" height="{W:g}" rx="{min(.35,W/5):g}" fill="#30383c"/>']
    if kind=='car':
        parts+=[f'<path d="M{L*.29:g} {W*.13:g}L{L*.42:g} {W*.05:g}H{L*.69:g}L{L*.79:g} {W*.17:g}V{W*.83:g}L{L*.69:g} {W*.95:g}H{L*.42:g}L{L*.29:g} {W*.87:g}Z" fill="#aebfc8"/>',f'<rect x="{L*.45:g}" y="{W*.18:g}" width="{L*.22:g}" height="{W*.64:g}" rx=".12" fill="#4c5a61"/>']
    else:
        parts+=[f'<rect x=".5" y=".22" width="{L-1:g}" height="{W-.44:g}" rx=".15" fill="#aebfc8"/>']
        modules=5 if kind=='tram' else 1
        for i in range(modules):
            parts.append(f'<rect x="{.85+i*(L-1.7)/modules:g}" y="{W*.25:g}" width="{(L-1.7)/modules-.25:g}" height="{W*.5:g}" rx=".08" fill="#687b85"/>')
        if kind=='tram':
            for i in range(1,5):parts.append(f'<rect x="{L*i/5-.10:g}" y=".04" width=".20" height="{W-.08:g}" fill="#252525"/>')
    # Light / cab indication is inside the body outline, never an extra clearance.
    parts.append(f'<rect x="{L-.18:g}" y="{W*.2:g}" width=".10" height="{W*.6:g}" fill="#fff0aa"/>')
    body=''.join(parts)
    if reverse:body=f'<g transform="rotate(180 {L/2:g} {W/2:g})">{body}</g>'
    return f'<g class="scale-figure vehicle {kind}" data-figure="{key}" data-reference-width="{L:g}" data-reference-height="{W:g}" data-scale="{scale:g}" transform="translate({x:g} {y:g}) scale({scale:g})">'+body+'</g>'
