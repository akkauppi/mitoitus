"""Source-backed connection examples for the engineering reference.

Call add_student_sheet(globals()) after the existing sheet definitions. This module
uses the parent generator's drawing vocabulary and does not read course records.
All editorial geometry is explicitly identified in the evidence register.
"""


def add_student_sheet(ns):
    txt, line, dim, rect, bar, svg, panel, sheet, dl, note, p, person = (
        ns[k] for k in ('txt', 'line', 'dim', 'rect', 'bar', 'svg', 'panel', 'sheet', 'dl', 'note', 'p', 'person'))
    YELLOW, BLUE, GREEN, RED, GREY = (ns[k] for k in ('YELLOW', 'BLUE', 'GREEN', 'RED', 'GREY'))

    # A plan example with 3 m traffic lanes and a 2.5 m refuge depth along walking.
    # The 4 m opening and island length are explicitly illustrative.
    s = 30
    g = txt(20, 23, 'CROSSING REFUGE · PLAN EXAMPLE', 'sub')
    g += rect(80, 65, 3, 8, s, GREY, 'crossing-left-lane')
    g += rect(170, 65, 2.5, 8, s, GREEN, 'crossing-island')
    g += rect(245, 65, 3, 8, s, GREY, 'crossing-right-lane')
    g += rect(170, 145, 2.5, 4, s, YELLOW, 'crossing-refuge-opening')
    # L3 stripes run along the carriageway, perpendicular to walking across it.
    # Vantaa guidance: 0.5 m stripe + 0.5 m gap. The crossing width is 4 m here.
    for side,start in [('left',80),('right',245)]:
        for i in range(3):
            g += rect(start+i*s,145,.5,4,s,'white',f'crossing-stripe-{side}-{i}','zebra-stripe')
    g += line(125,81,125,122,'dim')+'<path d="M125 122l-5-9h10Z" fill="#555"/>'
    g += line(290,122,290,81,'dim')+'<path d="M290 81l-5 9h10Z" fill="#555"/>'
    g += line(45, 221, 370, 221, 'motion')
    g += '<path d="M370 221l-12-6v12Z" fill="#333"/>'
    g += txt(207.5, 191, 'Refuge', 'small-label', 'middle')
    g += dim(170, 51, 245, 51, '≥2.5 m')
    g += txt(125, 326, '3 m lane', 'small-label', 'middle')
    g += txt(290, 326, '3 m lane', 'small-label', 'middle')
    g += dim(80, 360, 335, 360, '3 + 2.5 + 3 = 8.5 m')
    g += bar(40, 391, 2, s)
    crossing = panel(
        'Crossing refuge', '10 / CONNECTIONS · ESPOO 2010 / VANTAA',
        svg(g, 420, 'Example plan: two three-metre lanes separated by a two-point-five-metre refuge, measured along the pedestrian crossing',
            'Refuge depth is along the crossing. White stripes follow the road; stripe/gap 0.5 m. Opening width 4 m and island length 8 m are example values.'),
        dl([('Refuge depth · Espoo', '≥2.5 m'), ('Example lanes', '2 × 3 m'), ('Derived crossing span', '8.5 m')])
        + note('The refuge adds to the carriageway width; it does not reduce either traffic lane. This is a local layout example, not a complete junction design.')
        + p('Keep the route through the island clear. Coordinate kerb cues, tactile warning, sightlines, drainage and the onward footway.'),
        'crossing-refuge', 'yellow')

    # A fully dimensioned elementary network example: 100 + 300 + 100 = 500 m.
    # A straight-line radius does not measure the available detour around a barrier.
    g = txt(20, 23, 'ONE DESTINATION · TWO DISTANCE MEASURES', 'sub')
    g += '<rect x="207" y="70" width="26" height="257" fill="#99c9ee"/>'
    g += txt(220, 99, 'River', 'tiny', 'middle')
    g += '<rect x="193" y="148" width="54" height="24" fill="#e9e8e2" stroke="#555"/>'
    g += txt(220, 132, 'Bridge', 'tiny', 'middle')
    g += line(60, 260, 360, 260, 'datum')
    g += '<path d="M60 260V160H360V260" fill="none" stroke="#216f9c" stroke-width="4" data-geometry="walking-route-example" data-scale="1" data-length-metres="500"/>'
    for x, colour in [(60, YELLOW), (360, GREEN)]:
        g += f'<circle cx="{x}" cy="260" r="7" fill="{colour}" stroke="#222"/>'
    g += txt(53, 213, '100 m', 'small-label', 'end')
    g += txt(369, 213, '100 m', 'small-label')
    g += txt(210, 184, '300 m', 'small-label', 'middle')
    g += txt(210, 286, '300 m straight line', 'small-label', 'middle')
    g += txt(60, 316, 'Entrance', 'small-label', 'middle')
    g += txt(360, 316, 'Destination', 'small-label', 'middle')
    g += txt(20, 356, '100 + 300 + 100 = 500 m walking', 'measure')
    g += bar(40, 388, 100, 1)
    catchment = panel(
        'Route length, not radius', '10 / CONNECTIONS · GEOMETRIC EXAMPLE',
        svg(g, 420, 'An entrance and destination three hundred metres apart, connected by a five-hundred-metre route via a bridge',
            'Illustrative network at one scale. River width, bridge and endpoint symbols are schematic; no walking-speed assumption.'),
        dl([('Straight-line distance', '300 m'), ('Available walking route', '500 m'), ('Added distance', '200 m')])
        + note('A circle shows proximity. A usable route also needs a connection, a crossing and an accessible entrance.')
        + p('For parks, services and stops, trace the actual route from the entrance. Check barriers, opening hours, slopes and winter maintenance.')
        + ns['meta']('The example is geometry, not a recommended catchment threshold.'),
        'walking-connections', 'blue')

    # Local obstruction in plan, then two source-derived vertical clearance envelopes.
    s = 30
    g = txt(20, 23, 'PINCH POINT · PLAN EXAMPLE', 'sub')
    g += rect(40, 65, 12, 2.5, s, GREY, 'clear-route-plan')
    g += rect(185, 65, 1.4, 1.1, s, RED, 'route-obstruction')
    g += txt(250, 86, 'Obstacle', 'small-label')
    g += line(227, 82, 244, 82, 'dim')
    g += dim(26, 65, 26, 140, '2.5 m total', True)
    g += dim(424, 98, 424, 140, '1.4 m clear', True)
    g += txt(40, 178, '2.5 − 1.1 = 1.4 m < 1.5 m', 'measure')
    g += txt(20, 223, 'CLEAR HEIGHT · ELEVATION', 'sub')
    s = 50
    g += rect(40, 300, 3, 2.2, s, 'none', 'pedestrian-clear-height', 'shape dashed')
    g += rect(240, 260, 3, 3, s, 'none', 'under-building-clear-height', 'shape dashed')
    g += txt(115, 286, 'Route', 'small-label', 'middle')
    g += txt(315, 246, 'Under building', 'small-label', 'middle')
    g += person(115, 410, s, 'clearance-route-person')
    g += person(315, 410, s, 'clearance-building-person')
    g += dim(219, 300, 219, 410, '≥2.2 m', True)
    g += dim(425, 260, 425, 410, '≥3 m recommended', True)
    g += txt(40, 438, 'Both elevations share one scale; people 1.75 m.', 'tiny')
    continuity = panel(
        'Clear space in 3D', '10 / CONNECTIONS · SuRaKu 2008',
        svg(g, 460, 'A two-point-five-metre path narrowed to one-point-four metres by an obstruction, followed by source-based pedestrian clear-height examples',
            'Plan: assumed 1.1 m encroachment. Elevation: horizontal extents are illustrative; people and heights share the same scale.'),
        dl([('Clear route width', '≥1.5 m'), ('Wheelchair passing', '≥1.8 m'), ('Pedestrian clear height', '≥2.2 m'), ('Under building / building part', '≥3 m recommended')])
        + note('Measure the narrowest usable space, including furniture, door swings, branches, signs and seasonal snow. Nominal pavement width is not clear passage.')
        + p('SuRaKu’s outdoor pedestrian values are distinct from cycle, tram and vehicle clearance envelopes.'),
        'clear-route-continuity', 'green')
    sheet('connections', 'Connections', [crossing, catchment, continuity])
