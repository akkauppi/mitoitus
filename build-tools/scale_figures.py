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
    # Only the overall body dimensions are reference geometry. Windows, doors,
    # wheels, roof equipment and joint positions below are schematic artwork.
    # All details stay inside [0,L] x [0,W]; no mirror/clearance allowance is implied.
    def box(x,y,w,h,fill,rounding=0):
        return f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rounding:g}" fill="{fill}"/>'
    def path(d,fill):return f'<path d="{d}" fill="{fill}"/>'
    body_ink,body_light,glass,glass_light='#667b84','#c5d1d4','#425d6a','#c3dce5'
    if kind=='car':
        # The curved outline reaches the exact reference length and width.
        d=f'M{L*.12:g} {W*.04:g}Q0 {W*.09:g} 0 {W*.26:g}V{W*.74:g}Q0 {W*.91:g} {L*.12:g} {W*.96:g}L{L*.28:g} {W:g}H{L*.70:g}L{L*.92:g} {W*.94:g}Q{L:g} {W*.90:g} {L:g} {W*.70:g}V{W*.30:g}Q{L:g} {W*.10:g} {L*.92:g} {W*.06:g}L{L*.70:g} 0H{L*.28:g}Z'
        parts=[path(d,body_ink)]
        # Four inset tyre indications; their positions do not specify wheelbase.
        for axle in [.20,.76]:
            for edge in [.025,.90]:parts.append(box(L*(axle-.055),W*edge,L*.11,W*.075,'#34464e',.035))
        parts.append(path(f'M{L*.25:g} {W*.17:g}L{L*.35:g} {W*.09:g}H{L*.62:g}L{L*.77:g} {W*.24:g}V{W*.76:g}L{L*.62:g} {W*.91:g}H{L*.35:g}L{L*.25:g} {W*.83:g}Z',glass))
        # Rear glass, roof, front windscreen and narrow side windows remain distinct.
        parts.append(path(f'M{L*.26:g} {W*.23:g}L{L*.34:g} {W*.16:g}V{W*.84:g}L{L*.26:g} {W*.77:g}Z',glass_light))
        parts.append(box(L*.36,W*.25,L*.25,W*.50,body_light,.09))
        parts.append(path(f'M{L*.63:g} {W*.16:g}L{L*.75:g} {W*.28:g}V{W*.72:g}L{L*.63:g} {W*.84:g}Z',glass_light))
        for edge in [.10,.84]:parts.append(box(L*.47,W*edge,L*.022,W*.06,body_light))
        parts.append(f'<path d="M{L*.81:g} {W*.21:g}Q{L*.85:g} {W*.5:g} {L*.81:g} {W*.79:g}M{L*.17:g} {W*.23:g}V{W*.77:g}" fill="none" stroke="#aec0c7" stroke-width=".025"/>')
        for edge in [.20,.68]:
            parts.append(box(L*.965,W*edge,L*.017,W*.12,'#fff0b9',.02))
            parts.append(box(L*.025,W*edge,L*.022,W*.12,'#dca9a1',.02))
    else:
        parts=[box(0,0,L,W,body_ink,min(.30,W/6)),box(.07,.07,L-.14,W-.14,body_light,min(.23,W/8))]
        if kind=='bus':
            # Side glazing and doors suggest a bus without asserting a bus model.
            for i in range(7):
                xx=.9+i*(L-2.2)/7
                for edge in [.10,.80]:parts.append(box(xx,W*edge,(L-2.2)/7-.10,W*.10,glass,.04))
            for centre in [.23,.72]:
                parts.append(box(L*centre,W*.77,L*.065,W*.17,glass_light,.04))
                parts.append(box(L*(centre+.030),W*.78,L*.005,W*.15,body_ink))
            for centre in [.36,.64]:
                parts.append(box(L*centre,W*.31,L*.10,W*.38,'#a7b9c1',.10))
                for j in range(3):parts.append(box(L*(centre+.02+j*.022),W*.37,L*.009,W*.26,'#8199a4',.015))
            parts.append(box(.19,W*.18,.30,W*.64,glass,.08))
            parts.append(path(f'M{L-.70:g} {W*.13:g}Q{L-.21:g} {W*.13:g} {L-.21:g} {W*.29:g}V{W*.71:g}Q{L-.21:g} {W*.87:g} {L-.70:g} {W*.87:g}Z',glass))
        else:
            # Five-part nominal tram: legible articulated body, schematic roof modules.
            for i in range(5):
                start=i*L/5;span=L/5
                parts.append(box(start+span*.18,W*.27,span*.64,W*.46,'#a2b7bf',.12))
                for edge in [.11,.81]:parts.append(box(start+span*.15,W*edge,span*.70,W*.08,glass,.03))
            for i in range(1,5):
                xx=L*i/5
                parts.append(box(xx-.16,.05,.32,W-.10,'#4c626c',.025))
                parts.append(box(xx-.035,.07,.07,W-.14,'#9ab1bb'))
            for xx in [.22,L-1.17]:parts.append(box(xx,W*.13,.95,W*.74,glass,.17))
        for edge in [.20,.70]:
            parts.append(box(L-.16,W*edge,.08,W*.10,'#fff0b9',.02))
            parts.append(box(.08,W*edge,.08,W*.10,'#dca9a1',.02))
    body=''.join(parts)
    if reverse:body=f'<g transform="rotate(180 {L/2:g} {W/2:g})">{body}</g>'
    return f'<g class="scale-figure vehicle {kind}" data-figure="{key}" data-reference-width="{L:g}" data-reference-height="{W:g}" data-scale="{scale:g}" transform="translate({x:g} {y:g}) scale({scale:g})">'+body+'</g>'
