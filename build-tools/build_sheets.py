"""Generate compact engineering sheets. Diagram coordinates are metric, never icon sizes.

Every dimensioned plan/profile uses one uniform metres-to-SVG scale. Representative
values within source ranges, and all editorial examples, are labelled on the sheet.
"""
from pathlib import Path
from html import escape as esc
import math,hashlib
from scale_figures import person,cyclist,vehicle

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT
TITLE = 'Antti’s Dubious Little Rulebook'
YELLOW, BLUE, GREEN, RED, GREY = '#ffe54c', '#99c9ee', '#bad8ad', '#efaca5', '#e9e8e2'

def txt(x, y, text, cls='', anchor='start'):
    return f'<text x="{x:g}" y="{y:g}" class="{cls}" text-anchor="{anchor}">{esc(str(text))}</text>'

def line(x1, y1, x2, y2, cls='outline'):
    return f'<path d="M{x1:g} {y1:g}L{x2:g} {y2:g}" class="{cls}"/>'

def dim(x1, y1, x2, y2, label, vertical=False):
    if vertical:
        return line(x1,y1,x2,y2,'dim') + line(x1-4,y1,x1+4,y1,'dim') + line(x2-4,y2,x2+4,y2,'dim') + f'<text transform="translate({x1-9:g} {(y1+y2)/2:g}) rotate(-90)" text-anchor="middle" class="measure">{esc(label)}</text>'
    return line(x1,y1,x2,y2,'dim') + line(x1,y1-4,x1,y1+4,'dim') + line(x2,y2-4,x2,y2+4,'dim') + txt((x1+x2)/2,y1-8,label,'measure','middle')

def rect(x,y,w,h,scale,fill=YELLOW,key='',cls='shape'):
    return f'<rect x="{x:g}" y="{y:g}" width="{w*scale:g}" height="{h*scale:g}" fill="{fill}" class="{cls}" data-geometry="{key}" data-metres-width="{w:g}" data-metres-height="{h:g}" data-scale="{scale:g}"/>'

def circle(x,y,r,scale,fill=YELLOW,key=''):
    return f'<circle cx="{x:g}" cy="{y:g}" r="{r*scale:g}" fill="{fill}" class="shape" data-geometry="{key}" data-radius-metres="{r:g}" data-scale="{scale:g}"/>'

def bar(x,y,length,scale):
    return line(x,y,x+length*scale,y,'scale-bar')+line(x,y-4,x,y+4,'dim')+line(x+length*scale,y-4,x+length*scale,y+4,'dim')+txt(x,y+19,'0','tiny')+txt(x+length*scale,y+19,f'{length:g} m','tiny','end')

def svg(content, height, label, caption=''):
    return f'<figure><svg viewBox="0 0 440 {height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="{esc(label)}">{content}</svg>'+(f'<figcaption>{caption}</figcaption>' if caption else '')+'</figure>'

def table(head, rows, cls=''):
    return f'<table class="{cls}"><thead><tr>'+''.join(f'<th scope="col">{h}</th>' for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join((f'<th scope="row">{v}</th>' if i==0 else f'<td>{v}</td>') for i,v in enumerate(row))+'</tr>' for row in rows)+'</tbody></table>'

def note(text): return f'<p class="note">{text}</p>'
def p(text): return f'<p>{text}</p>'
def dl(rows): return '<dl class="specs">'+''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a,b in rows)+'</dl>'

def variants(key, options):
    """Fixed-area preset drawings. Width alternatives retain the same graphic scale."""
    control=f'<div class="variant-controls"><button type="button" data-variant-step="-1" aria-label="Previous layout" disabled>←</button><label class="sr-only" for="{key}-select">Drawing layout</label><select id="{key}-select" aria-label="Drawing layout">'
    control+=''.join(f'<option value="{i}">{esc(label)}</option>' for i,(label,_) in enumerate(options))
    control+='</select><button type="button" data-variant-step="1" aria-label="Next layout">→</button></div>'
    drawings=''.join(f'<div class="drawing-variant" data-variant="{i}"'+(' hidden' if i else '')+'>'+drawing+'</div>' for i,(_,drawing) in enumerate(options))
    return f'<div class="drawing-variants" data-variant-group="{key}">{control}{drawings}</div>'

sheets=[]
def panel(title, context, drawing, details, proof, colour='yellow'):
    return f'<article class="panel {colour}"><div class="panel-top"><span>{context}</span><img class="wall-brand" src="assets/aalto-logo.svg" alt="Aalto University"></div><h2>{title}</h2><div class="panel-body"><div class="drawing">{drawing}</div><div class="details">{details}</div></div><a class="proof" href="evidence.html#{proof}">Sources &amp; assumptions ↗</a></article>'

def sheet(id,title,panels):
    assert len(panels)==3
    sheets.append((id,title,panels))

# 01. Building plans: source ranges and the actual drawn representatives are separate.
s=6
g=txt(30,22,'SLAB / LAMELLITALO','sub')
g+=rect(40,60,26,11,s,YELLOW,'slab-module')+rect(196,60,26,11,s,GREY,'slab-second-module')
g+=dim(40,48,196,48,'22–30 m / module')+dim(374,60,374,126,'10–12 m',True)
g+=txt(40,153,'Drawn: 2 × 26 m modules; depth 11 m','tiny')
g+=txt(30,201,'POINT BLOCK / PISTETALO','sub')+rect(40,238,20,20,s,YELLOW,'point-block')
g+=dim(40,226,160,226,'≤ 20 m')+dim(181,238,181,358,'≤ 20 m',True)
g+=txt(214,267,'Square variant','small-label')+txt(214,289,'Drawn: 20 × 20 m','tiny')+bar(265,340,10,s)
b1=panel('Slab & point blocks','01 / BUILDINGS · TKK 2007',svg(g,396,'Scaled slab modules and a square point block','All building plans on this sheet share one graphic scale.'),dl([('Slab module','22–30 m'),('Slab depth','10–12 m'),('Square point block','up to 20 × 20 m')])+note('The slab dimension applies to one repeated module. Longer buildings combine modules.')+p('Historical footprint references. Storeys, access, daylight and the site still determine the building.'),'building-blocks')
s=6
g=txt(30,22,'SMALL APARTMENT / PIENKERROSTALO','sub')
for i in range(4):g+=rect(40+i*9*s,60,9,9,s,YELLOW if i%2==0 else GREY,f'small-module-{i}')
g+=dim(40,47,94,47,'8–10 m')+dim(280,60,280,114,'8–10 m',True)+txt(40,150,'Drawn: four 9 × 9 m modules','tiny')
g+=txt(30,197,'ROW HOUSE / RIVITALO','sub')
for i in range(4):
    g+=rect(40+i*6*s,230,6,9.5,s,YELLOW,f'row-dwelling-{i}')+rect(40+i*6*s,287,6,10,s,GREEN,f'row-garden-{i}')
g+=dim(40,218,76,218,'4–8 m')+dim(210,230,210,287,'8–11 m',True)+dim(245,287,245,347,'~5–15 m',True)+bar(310,355,10,s)
b2=panel('Small blocks & rows','01 / BUILDINGS · TKK 2007',svg(g,396,'Small-apartment modules, row dwellings and gardens at a common scale','Row drawing: 6 m dwelling width, 9.5 m building depth, 10 m garden.'),dl([('Small-block module','8–10 × 8–10 m'),('Row dwelling width','4–8 m'),('Row-house depth','8–11 m'),('Garden depth','~5–15 m')])+note('Small-block and row widths are repeating units, not the overall building length.'),'building-rows')
s=6
g=rect(55,60,25,30,s,GREEN,'detached-plot')+rect(90,130,15,10,s,YELLOW,'detached-house')
g+=dim(90,118,180,118,'~15 m')+dim(201,130,201,190,'~10 m',True)+txt(130,220,'750 m² example plot','small-label','middle')+txt(55,300,'25 × 30 m plot shown','tiny')+bar(280,260,10,s)
b3=panel('Detached house','01 / BUILDINGS · TKK 2007',svg(g,396,'A fifteen by ten metre house on an illustrative twenty-five by thirty metre plot','House: 15 × 10 m. Plot shape and house position are illustrative.'),dl([('House footprint','~15 × 10 m'),('Source example','one storey'),('Plot area','~500–1,000 m²')])+note('The drawn plot is 750 m². This is a massing reference, not a setback or building-rights rule.')+p('All five types are redrawn from the historical TKK diagrams. Dimensions shown as ranges remain ranges.'),'building-detached')
sheet('built-form','Building types',[b1,b2,b3])

# 02. Historical density / greenspace and independently sourced service examples.
g=''
for i,(label,n) in enumerate([('Detached',30),('Linked low-rise',50),('Row houses',75),('Apartments ≤7 floors',100)]):
    y=30+i*61;g+=txt(20,y,label,'small-label')+f'<rect x="20" y="{y+10}" width="{n*3.5}" height="18" fill="{YELLOW}"/>'+txt(30+n*3.5,y+25,f'~{n}','measure')
g+=txt(20,287,'Residents / hectare · historical examples','tiny')
density=panel('Density','02 / LAND & POPULATION · TKK 2007',svg(g,310,'Historical example resident densities: thirty, fifty, seventy-five and one hundred per hectare'),table(['Form','eₐ','eₖ','eₜ'],[['Detached','.04–.10','.10–.15','.05–.15'],['Linked','~.20','.25–.35','~.35'],['Row','.30','.35–.40','~.40'],['Apartment','.40','~.65','~.70']],'density-table')+p('<b>e = total floor area ÷ land area</b><br>eₐ district · eₖ block · eₜ plot')+note('Historical examples, not a conversion from floor-area ratio to residents. State the land boundary and occupancy assumptions.'),'density')
g=''
for i,(name,dist) in enumerate([('Plot play / stay',50),('Neighbourhood park',150),('District recreation',500)]):
    y=28+i*78;g+=txt(20,y,name,'small-label')+f'<rect x="20" y="{y+13}" width="{dist*.7}" height="18" fill="{GREEN}"/>'+txt(30+dist*.7,y+29,f'≤{dist} m','measure')
g+=txt(20,288,'Maximum distance from home · same scale','tiny')
green=panel('Green-area hierarchy','02 / VIHERALUELUOKITUS · TKK 2007',svg(g,314,'Historical maximum distances: fifty, one hundred fifty and five hundred metres'),dl([('Plot play area','10 m² / 100 floor-m²'),('Minimum play area','100 m²'),('Play provision','1 / 3,000 floor-m²'),('Neighbourhood park','25 m² / 100 floor-m²'),('Neighbourhood minimum','3,500–4,000 m²'),('District recreation','≥10 ha'),('Play park within district','0.6–1.2 ha'),('Recreation route length','3–10 km')])+note('Residential floor area. Historical provision hierarchy, not RAMS maintenance classes. Test actual walking connections.'),'green-hierarchy','green')
g=txt(20,27,'LIBRARY SPACE · 2010 RECOMMENDATION','sub')+rect(30,65,10,10,12,YELLOW,'library-area')+dim(30,53,150,53,'10 m')+dim(170,65,170,185,'10 m',True)+txt(215,110,'~100 m²','big-label')+txt(215,139,'useful floor area','small-label')+txt(215,163,'per 1,000 residents','small-label')+txt(30,227,'Square is an area equivalent, not a floor plan.','tiny')
services=panel('Residents & services','02 / PUBLIC SERVICES · DATED EXAMPLES',svg(g,260,'One hundred square metres of useful library area per thousand residents'),dl([('Library space','~100 m² / 1,000 residents')])+p('Ministry recommendation, 2010. Small municipalities may need more space per resident.')+dl([('School + daycare','>2,000 additional residents')])+p('Seinäjoki, 2017: local planning trigger with nearby schools already full.')+dl([('Health-station unit','~20,000 residents')])+p('Helsinki, 2020: proposed population responsibility for an additional central-city unit.')+note('These are different measures, not universal viability thresholds. Check age structure, existing capacity and catchment.'),'services')
sheet('land-population','Land & population',[density,green,services])

# 03. Light-grey reference people, with width alternatives at one fixed scale.
def widths(rows,scale=70,height=350):
    out=''
    for i,(label,w,display,col) in enumerate(rows):
        y=30+i*78;out+=txt(20,y,label,'small-label')+rect(20,y+13,w,.32,scale,col,f'width-{label}')+txt(30+w*scale,y+32,display,'measure')
    return svg(out,height,'Scaled comparison of widths: '+', '.join(f'{a} {c}' for a,b,c,d in rows),'Widths share one graphic scale; strip lengths are illustrative.')
s=90
walk_options=[]
for key,label,w,context in [('basic','Basic footway · 2.5 m',2.5,'ESPOO 2010 · TOTAL FOOTWAY'),('clear','Clear passage · 1.5 m',1.5,'SuRaKu 2008 · CLEAR PASSAGE'),('passing','Wheelchair passing · 1.8 m',1.8,'SuRaKu 2008 · CLEAR WIDTH'),('maintenance','Machine maintenance · 2.3 m',2.3,'SuRaKu 2008 · CLEAR WIDTH')]:
    x=220-w*s/2
    g=txt(20,23,context,'sub')+rect(x,240,w,.075,s,YELLOW,'footway-'+key)
    for i,px in enumerate([220-w*s*.24,220+w*s*.24] if w>=1.8 else [220]):g+=person(px,240,s,'walking-'+key+'-'+str(i))
    g+=dim(x,284,x+w*s,284,f'{w:g} m')+dim(395,82.5,395,240,'1.75 m',True)+bar(30,309,1,s)
    walk_options.append((label,svg(g,347,f'{label}, with 1.75 m reference people at a fixed graphic scale','People: 1.75 m. Same scale in every option; figures illustrate scale, not the users or equipment accommodated.')))
walk=panel('Walking widths','03 / WALK & CYCLE · ESPOO / SuRaKu',variants('walking',walk_options),dl([('Basic footway · Espoo 2010','2.5 m'),('Clear passage · SuRaKu','≥1.5 m'),('Wheelchair passing','≥1.8 m'),('Machine maintenance','≥2.3 m')])+table(['Route gradient','Special','Basic'],[['Crossfall ≤','2%','3%'],['Longitudinal ≤','5%','8%']])+note('Furniture, signs, snow and door swings are outside the clear route. The figures are scale references, not a crowd-capacity model.'),'walking')
cycle_options=[]
for key,label,w,people,riders,context in [
    ('one','One-way lane · 1.75 m',1.75,[],[.5],'ESPOO 2010 · ONE-WAY LANE'),
    ('two','Two-way track · 2.5 m',2.5,[],[.25,.75],'HELSINKI 2014 · TWO-WAY TRACK'),
    ('quality','Two-way quality route · 3.5 m',3.5,[],[.25,.75],'HELSINKI 2014 · QUALITY ROUTE'),
    ('shared3','Shared walk + cycle · 3 m',3,[.20],[.65],'ESPOO 2010 · SHARED PATH'),
    ('shared4','Shared walk + cycle · 4 m',4,[.14,.33],[.64,.85],'ESPOO 2010 · SHARED PATH')]:
    x=220-w*s/2
    g=txt(20,23,context,'sub')+rect(x,240,w,.075,s,BLUE,'cycle-'+key)
    for i,f in enumerate(people):g+=person(x+f*w*s,240,s,'cycle-person-'+key+'-'+str(i))
    for i,f in enumerate(riders):
        px=x+f*w*s
        g+=cyclist(px,240,s,'cycle-rider-'+key+'-'+str(i))
        if key=='one':g+=rect(px-.375*s,70,.75,170/s,s,'none','cyclist-envelope','shape dashed')+dim(px-.375*s,58,px+.375*s,58,'0.75 m user envelope')
        if key in ['one','two','quality']:
            g+=f'<circle cx="{px:g}" cy="264" r="7" fill="none" stroke="#555"/>'
            g+=(f'<circle cx="{px:g}" cy="264" r="2" fill="#555"/>' if i==0 else line(px-3,261,px+3,267)+line(px-3,267,px+3,261))
    g+=dim(x,294,x+w*s,294,f'{w:g} m')+bar(30,318,1,s)
    cap='Rider: 1.65 m high, 0.60 m handlebars. Fixed scale. ⊙ towards / ⊗ away.'
    if key=='two':cap='Drawn 2.5 m; Helsinki 2014 main-route range 2.5–4 m at footway level. Walking and road buffer are additional. ⊙ towards / ⊗ away.'
    if key=='quality':cap='Helsinki 2014 quality-route target ≥3.5 m. Walking and road buffer are additional. ⊙ towards / ⊗ away.'
    if key.startswith('shared'):cap='Espoo 2010 shared-path range: 3–4 m. People: 1.75 m; riders: 1.65 m. Same scale in every option.'
    cycle_options.append((label,svg(g,347,f'{label}, people and cyclists at a fixed metric scale',cap)))
cycle=panel('Cycle facilities','03 / WALK & CYCLE · DATED SOURCE OPTIONS',variants('cycling',cycle_options),dl([('One-way lane · Espoo 2010','1.75 m'),('Two-way main track¹ · Helsinki 2014','2.5–4 m'),('Quality route¹ · Helsinki 2014','≥3.5 m'),('Shared walk + cycle · Espoo','3–4 m'),('Separated total / main · Espoo','4 / ≥4.5 m'),('Parking-side extra buffer · Espoo','≥0.75 m')])+note('¹ At footway level, with walking separate. Options are different facility types. The 0.75 m design-user envelope does not replace movement clearance.'),'cycling','blue')
s=65
g=txt(20,25,'ONE ROW · ROUGH SPACE ALLOWANCE','sub')
for i in range(5):g+=rect(50+i*.6*s,60,.6,2,s,BLUE,f'bike-envelope-{i}')
g+=rect(50,190,3,2,s,GREY,'bike-handling')+dim(50,46,89,46,'0.6 m')+dim(278,60,278,190,'2.0 m',True)+dim(316,60,316,320,'4.0 m total',True)+txt(147,260,'Handling space','small-label','middle')
bikes=panel('Cycle parking','03 / WALK & CYCLE · HELSINKI GUIDE',svg(g,345,'Five bicycle envelopes, each zero point six by two metres, with handling space','Envelopes only; not a rack specification.'),dl([('Typical cycle envelope','0.6 × 2.0 m'),('Typical height','1.2 m'),('Rough one-row allowance','2.4 m² / cycle')])+p('Allowance = 0.6 × 4 m including handling. Rack design can require more space; check cargo cycles separately.')+note('Espoo stop drawing 811A leaves 5 m before a crossing free of cycle/scooter parking.'),'bike-parking','blue')
sheet('walk-cycle','Walk & cycle',[walk,cycle,bikes])

# 04. Accessible movement, with unexaggerated ramp profile.
s=75
g=circle(97,128,.75,s,YELLOW,'wheelchair')+circle(305,128,1.25,s,BLUE,'powered-wheelchair')
g+=dim(40.75,128,153.25,128,'Ø1.5 m')+dim(211.25,128,398.75,128,'Ø2.5 m')+txt(97,247,'Wheelchair','small-label','middle')+txt(305,247,'Powered chair','small-label','middle')+bar(30,293,1,s)
turn=panel('Clear turning space','04 / ACCESSIBILITY · SuRaKu 2008',svg(g,330,'Clear wheelchair and powered-wheelchair turning circles drawn at the same scale','Clear-space circles; no device silhouette is implied.'),dl([('Wheelchair diameter','≥1.5 m'),('Powered-chair diameter','≥2.5 m')])+note('Keep the usable circle free of furniture and door swings. Check larger mobility scooters and other equipment against their actual turning geometry.')+p('Same graphic scale for both circles.'),'turning')
s=42
g=person(318,102.4,42,'ramp-scale-person')+txt(20,26,'PROFILE · 0.30 m RISE AT 5%','sub')+f'<path d="M30 115L282 102.4H366V115Z" fill="{BLUE}" class="shape" data-geometry="ramp-profile" data-run-metres="6" data-rise-metres="0.3" data-scale="42"/>'+dim(30,155,282,155,'6.0 m run')+dim(282,193,366,193,'2.0 m landing')+line(30,115,366,115,'datum')+txt(30,235,'Horizontal and vertical scales are equal.','tiny')+bar(30,277,2,s)
ramp=panel('Ramps','04 / ACCESSIBILITY · SuRaKu 2008',svg(g,318,'A six metre ramp rising point three metres, without vertical exaggeration, and a two metre landing','Person 1.75 m; the same horizontal and vertical scale as the ramp.'),dl([('Recommended gradient','≤5%'),('Maximum gradient','8%'),('Ramp width minimum','0.9 m'),('Recommended width','1.2 m'),('Long ramp >5%','≥2 m landing every 6 m')])+note('Run = rise ÷ gradient. Shown: 0.30 ÷ 0.05 = 6 m before landings. Provide turning space at direction changes.'),'ramps','blue')
s=40
g=txt(25,24,'ACCESSIBLE COURTYARD BAY','sub')+rect(45,65,3.6,5,s,YELLOW,'accessible-bay')+dim(45,52,189,52,'≥3.6 m')+dim(215,65,215,265,'≥5.0 m',True)
g+=txt(272,85,'BENCH END','sub')+rect(285,118,.9,1.5,s,BLUE,'bench-space')+dim(285,105,321,105,'≥0.9 m')+txt(271,205,'Depth 1.5 m','tiny')+txt(271,224,'illustrative','tiny')+bar(282,262,2,s)
arrival=panel('Parking & seating','04 / ACCESSIBILITY · SuRaKu 2008',svg(g,315,'An accessible parking rectangle and a bench-end clear space at the same scale'),dl([('Courtyard bay','≥3.6 × 5 m'),('Bay slope, both directions','≤2%'),('Bench-end clear space','≥0.9 m wide'),('Park rest spacing · special²','50 m'),('Park rest spacing · basic²','≤250 m')])+p('² Recommended park-route spacing, SuRaKu 2008. Seats: backrests, armrests and a choice of heights.')+note('Add the actual vehicle’s transfer/lift space and an accessible connection. Kerbside parking uses a separate layout.'),'arrival')
sheet('accessible','Accessibility',[turn,ramp,arrival])

# 05. Tram plan strips and platform details; source-sized bodies, no guessed rail gauge.
g=txt(20,23,'LINE-SECTION RESERVATIONS','sub')
g+=rect(40,65,8,1.5,34,BLUE,'tram-espoo')+dim(40,51,312,51,'≥8.0 m · Espoo 2010')
g+=rect(40,161,6,1.5,34,GREY,'tram-helsinki-draft')+dim(40,147,244,147,'≥6.0 m · Helsinki draft')
g+=txt(20,248,'UNCANTED CURVE RADII · REGIONAL GUIDE','sub')+txt(20,274,'20 km/h: 48 m · 30 km/h: 107 m','small-label')+txt(20,298,'40 km/h: 190 m · at 0.65 m/s²','small-label')+txt(20,324,'Add transitions and clearance widening.','tiny')
tram1=panel('Tram corridor','05 / TRAM · SOURCE CONTEXTS',svg(g,352,'Eight metre Espoo reservation compared with six metre Helsinki draft line-section guidance','Widths to scale; illustrative strip lengths. Different source contexts.'),dl([('Espoo light-rail reservation','≥8 m'),('Helsinki line section · draft','≥6 m'),('Track centres · slab track','≥3 m'),('Track centres · ballast','≥3.1 m')])+p('The regional tram guide sizes clearances from the tram clearance envelope (ATU), not from the rail alone.')+table(['To walking / cycling¹','Normal'],[['Speed ≤40 km/h','0.80 m'],['Speed 50 km/h','1.15 m'],['Speed >50 km/h','1.50 m']])+note('¹ Distance from ATU edge. Curves, poles, evacuation and crossings need additional checks. Do not combine different corridor definitions.'),'tram-corridor','blue')
s=27
g=txt(20,24,'SIDE PLATFORMS · STRAIGHT, DEDICATED TRACK','sub')
g+=rect(35,81,3.5,5,s,YELLOW,'tram-platform-left')+rect(129.5,81,5.5,5,s,BLUE,'tram-between-platforms')+rect(278,81,3.5,5,s,YELLOW,'tram-platform-right')
for x,w,label in [(35,3.5,'3.5 m'),(129.5,5.5,'5.5 m'),(278,3.5,'3.5 m')]:g+=dim(x,67,x+w*s,67,label)
g+=dim(35,248,372.5,248,'12.5 m before outer routes / buffers')+txt(82,164,'Platform','small-label','middle')+txt(203,164,'Track zone','small-label','middle')+txt(325,164,'Platform','small-label','middle')
tram2=panel('Stop width','05 / TRAM · REGIONAL GUIDE',svg(g,294,'Two normal three point five metre side platforms and a five point five metre track zone','Derived section: 3.5 + 5.5 + 3.5 = 12.5 m. Longitudinal extent is illustrative.'),dl([('Side platform · normal','3.5 m'),('Clear passage · normal','≥1.8 m'),('Clear passage · minimum','1.5 m'),('Island platform · minimum','5 m')])+p('Passenger space: 1 m²/person, minimum 0.75 m²/person, using the guide’s peak-period boarding demand.')+note('Shelters, waiting space, access and a cycle route behind the stop must fit together. This rectangle is not the full street width.'),'tram-width','blue')
s=6
g=txt(20,23,'LIGHT-RAIL STOP · PLAN','sub')
for y,key in [(75,'upper'),(129,'lower')]:
    g+=rect(30,y,6,3.5,s,GREY,'tram-ramp-start-'+key)+rect(66,y,45,3.5,s,YELLOW,'tram-platform-length' if key=='upper' else 'tram-platform-length-lower')+rect(336,y,6,3.5,s,GREY,'tram-ramp-end-'+key)
g+=rect(66,96,45,5.5,s,BLUE,'tram-track-plan')
g+=vehicle(99,96.3,34,2.4,s,'tram','tram-body-upper')+vehicle(99,114.3,34,2.4,s,'tram','tram-body-lower')
g+=dim(66,61,336,61,'45 m flat service area')+dim(30,185,372,185,'57 m example before crossing waiting areas')
g+=txt(30,214,'6 m ramp','tiny')+txt(372,214,'6 m ramp','tiny','end')+txt(30,240,'Tram bodies: nominal 34 × 2.4 m, same scale','tiny')
g+=rect(66,286,30,3.5,s,GREY,'tram-city-length')+dim(66,272,246,272,'30 m · one Helsinki city tram')+rect(30,348,61,3.5,s,GREY,'tram-two-city-length')+dim(30,334,396,334,'61 m · two Helsinki city trams')
tram3=panel('Stop length & levels','05 / TRAM · REGIONAL GUIDE',svg(g,390,'A forty-five metre tram stop with two nominal thirty-four by two point four metre tram bodies, with separate thirty and sixty-one metre platform-length comparisons','Example ramps: assumed 0.30 m rise from adjacent level ÷ 5% = 6 m each.'),dl([('Light-rail service area','45 m normally'),('Project-specific shorter case','35 m by agreement'),('Access ramps','≤5%'),('Platform longitudinal slope','≤2% normally'),('Platform crossfall','1–2%')])+note('Platform height above rail: 0.30 m generally; normally 0.27 m in Helsinki. Ramp rise depends on adjacent ground level. Add crossing waiting areas to the flat length and ramps.'),'tram-length','blue')
sheet('tram','Tram & stops',[tram1,tram2,tram3])

# 06. Quarter-annulus turning bands: exact circular geometry with radial dimensions.
def annulus(ri,ro,scale,cx,cy,key,colour=RED):
    a=ri*scale;b=ro*scale;mid=(a+b)/2
    out=f'<path d="M{cx+b:g} {cy:g}A{b:g} {b:g} 0 0 0 {cx:g} {cy-b:g}L{cx:g} {cy-a:g}A{a:g} {a:g} 0 0 1 {cx+a:g} {cy:g}Z" fill="{colour}" class="shape" data-geometry="{key}" data-inner-radius="{ri:g}" data-outer-radius="{ro:g}" data-scale="{scale:g}"/>'
    out+=line(cx-7,cy,cx+7,cy,'dim')+line(cx,cy-7,cx,cy+7,'dim')
    out+=line(cx,cy,cx+b*.70710678,cy-b*.70710678,'dim')+txt(cx+b*.48,cy-b*.48-9,f'R {ro:g} m','measure')
    out+=line(cx,cy,cx+a,cy,'dim')+txt(cx+a/2,cy+22,f'R {ri:g} m','measure','middle')
    out+=f'<path d="M{cx+mid:g} {cy-4:g}A{mid:g} {mid:g} 0 0 0 {cx+mid*.5:g} {cy-mid*.8660254:g}" class="motion"/>'
    xx=cx+mid*.5;yy=cy-mid*.8660254
    out+=f'<path d="M{xx:g} {yy:g}l12 -1 -6 10Z" fill="#111"/>'
    return out
def traffic_lanes(kind,count,height):
    # Equal scale and view length for one/two-lane comparisons, independent of turns.
    w,L,W=(3,5,1.8) if kind=='car' else (3.25,15,2.6)
    s=18;x=40;y=150-count*w*s/2
    g=txt(20,23,f'{count} '+('LANE' if count==1 else 'LANES')+' · PLAN · ESPOO 2010','sub')
    for i in range(count):
        g+=rect(x,y+i*w*s,18,w,s,GREY,'traffic-'+kind+f'-{count}-{i}')
        g+=vehicle(x+(18-L)*s/2,y+(i*w+(w-W)/2)*s,L,W,s,kind,f'{kind}-lane-{count}-{i}',reverse=i>0)
    g+=dim(389,y,389,y+count*w*s,f'{count*w:g} m',True)
    if count==2:g+=line(x,y+w*s,x+18*s,y+w*s,'datum')
    g+=txt(40,260,f'{count} × {w:g} m = {count*w:g} m carriageway','measure')+txt(40,289,f'Body: {L:g} × {W:g} m; mirrors omitted','small-label')+txt(40,315,'Kerbs, parking, buffers and other modes are additional.','tiny')+bar(40,355,5,s)
    return svg(g,height,f'{count} {kind} traffic lanes with reference vehicle bodies at a common scale','Plan length 18 m is illustrative. Lane alternatives retain one scale; these are not complete street cross-sections.')
g=annulus(3,6.5,40,65,300,'car-turn')+bar(280,330,2,40)
g+=vehicle(65,354,5,1.8,40,'car','car-body')+txt(65,451,'Car body: 5.0 × 1.8 m · plan, same scale','tiny')
car_options=[('Car / van turning · TKK 2007',svg(g,470,'Quarter-turn band with radii three and six point five metres, and a separate five by one point eight metre car-body plan at the same scale','Reference car body is separate from the turning band; mirrors omitted.')),('One traffic lane · 3 m',traffic_lanes('car',1,470)),('Two traffic lanes · 6 m',traffic_lanes('car',2,470))]
car=panel('Car access & turning','06 / VEHICLES · TKK / ESPOO',variants('car-layout',car_options),dl([('Inner / outer radius · TKK','3.0 / 6.5 m'),('Local collector lane · Espoo','3.0–3.25 m')])+note('Historical radius band redrawn from TKK. The shaded band is geometric reference space, not a simulated vehicle swept path.')+p('Lane plans use the 3.0 m end of Espoo’s range. Check the design vehicle for servicing, deliveries and waste collection.')+p('<b>W4 brief:</b> No long-term private car parking.'),'car-turn','red')
g=annulus(8.1,15.2,17,65,295,'bus-turn')+bar(290,330,5,17)
g+=vehicle(65,355,15,2.6,17,'bus','bus-body')+txt(65,426,'Design bus: 15.0 × 2.6 m · plan, same scale','tiny')
bus_options=[('Bus turning · TKK 2007',svg(g,446,'Quarter-turn bus band and a separate fifteen by two point six metre bus-body plan at the same graphic scale','Reference body only; it does not validate the historical turning band. Mirrors omitted.')),('One lane · buses govern · 3.25 m',traffic_lanes('bus',1,446)),('Two lanes · buses govern · 6.5 m',traffic_lanes('bus',2,446))]
bus=panel('Bus access & stops','06 / VEHICLES · TKK / ESPOO',variants('bus-layout',bus_options),dl([('Inner / outer radius · TKK','8.1 / 15.2 m'),('Local collector lane','3.0–3.25 m'),('If buses govern','≥3.25 m')])+table(['Espoo 031D stop','Service length'],[['One bus','16 m'],['Two buses','32 m']])+note('031D uses a 15 m design bus. Add the approach and crossing clearances from the full drawing. Turning band is historical, not a swept path.'),'bus-turn','red')
g=txt(20,20,'FIRE ENGINE','sub')+annulus(5,10.5,11,40,160,'engine-turn')+txt(230,20,'AERIAL APPLIANCE','sub')+annulus(5.5,12.5,11,245,160,'aerial-turn')
g+=rect(45,218,13,6,18,RED,'aerial-setup')+rect(45,218,13,8,18,'none','aerial-setup-target','shape dashed')+dim(45,205,279,205,'13 m')+dim(300,218,300,326,'≥6 m',True)+dim(340,218,340,362,'8 m target',True)
rescue=panel('Rescue access','06 / HIKLU 2024 · v1.3',svg(g,387,'Fire-engine and aerial-appliance turning bands at a common scale, plus aerial set-up rectangle','Turning bands share a scale. Set-up area is a separate, enlarged plan.'),dl([('Engine inner / outer radius','5 / 10.5 m'),('Aerial inner / outer radius','5.5 / 12.5 m'),('Clear route width','3.5 m'),('Clear height','4.2 m'),('Aerial set-up area','≥6 × 13 m'),('Set-up target width','8 m')])+note('Radius bands exclude the guide’s 0.4 m driving and 1 m boom allowances. Check loads, slopes, reach, trees, wires and snow against the full guide.'),'rescue','red')
sheet('turning-vehicles','Vehicles & turning',[car,bus,rescue])

# 07. Green and blue with honest soil/storage examples.
s=20
g=txt(20,25,'25 m³ CONVENTIONAL SOIL · EXAMPLE','sub')+rect(45,65,5,5,s,GREEN,'soil-plan')+dim(45,53,145,53,'5 m')+dim(166,65,166,165,'5 m',True)+txt(214,104,'PLAN','sub')+txt(214,132,'25 m²','small-label')
g+=rect(45,238,5,1,s,GREEN,'soil-section')+dim(45,226,145,226,'5 m')+dim(166,238,166,258,'1 m',True)+txt(214,253,'SECTION','sub')+txt(45,303,'5 × 5 × 1 m = 25 m³','measure')
tree=panel('Rooting volume','07 / GREEN & BLUE · HELSINKI DRAFT',svg(g,333,'A five by five by one metre illustrative soil volume, with equal scale plan and section','Example geometry for volume only; not a prescribed planting pit.'),dl([('Large-growing tree','~25 m³ conventional soil'),('Structural soil','~40–60 m³')])+p('Indicative values in Helsinki’s tree/tram card, marked draft. Stone reduces water-storage capacity in structural soil.')+note('Check the mature crown, connected rooting space, groundwater and utilities. Grouped trees benefit from continuous growing medium.'),'trees','green')
plant=panel('Planting widths','07 / GREEN & BLUE · ESPOO 2010',widths([('Tree planting strip',3,'≥3.0 m',GREEN),('Tree strip · main street',3.5,'≥3.5 m',GREEN),('Low shrubs',2.5,'≥2.5 m',GREEN),('Lawn / ground cover',2,'≥2.0 m',GREEN)],85,355),p('A planting-strip width does not establish adequate root volume.')+table(['Season / layer','Coordinate'],[['Above ground','Mature crown, visibility, wires'],['Below ground','Roots, drainage, utilities'],['Winter','Snow storage, salt, access']])+note('Keep snow storage separate from clear walking, turning and rescue space. Check where meltwater goes.'),'ground','green')
s=27
g=txt(20,23,'6 m³ STORAGE · IDEALISED EXAMPLE','sub')+rect(45,65,6,5,s,BLUE,'water-plan')+dim(45,53,207,53,'6 m')+dim(230,65,230,200,'5 m',True)+txt(290,123,'30 m²','big-label')
g+=rect(45,265,6,.2,s,BLUE,'water-depth')+dim(45,249,207,249,'6 m')+line(217,265,260,230,'dim')+txt(263,228,'0.20 m','small-label')+txt(45,311,'Section uses the same scale as the plan.','tiny')
water=panel('Stormwater storage','07 / GREEN & BLUE · ESPOO EXAMPLE',svg(g,340,'Six by five metre storage plan and point two metre effective depth, all at the same scale'),dl([('Example zoning provision','1 m³ / 100 m²'),('Impermeable catchment','600 m² → 6 m³'),('Assumed effective depth','0.20 m → 30 m²'),('Example emptying time','12–24 h')])+note('This is an Espoo zoning example, not the rule for this site. Add side slopes, freeboard, inlet, controlled overflow and maintenance space.')+p('Confirm soil, groundwater and the design rainfall before choosing infiltration or detention.'),'stormwater','blue')
sheet('green-blue','Green & blue',[tree,plant,water])

# 08. Stormwater concepts intentionally have no invented construction dimensions.
g=txt(20,23,'RAIN GARDEN / BIOSUODATUS','sub')
g+='<path d="M20 77H90L130 108H300L340 77H415V175H20Z" fill="#e9e8e2" class="shape"/>'
g+=f'<path d="M105 89H325L300 108H130Z" fill="{BLUE}"/>'
g+=f'<path d="M130 109H300V146H130Z" fill="{GREEN}" class="shape"/>'
g+=txt(215,132,'Planted filter medium','small-label','middle')+txt(20,58,'Inflow →','small-label')+txt(330,160,'→ drain¹','small-label')
g+=line(150,151,150,191,'motion')+line(215,151,215,191,'motion')+line(280,151,280,191,'motion')+txt(215,214,'↓ infiltration where suitable','small-label','middle')
g+=txt(20,253,'VEGETATED SWALE / PAINANNE','sub')+f'<path d="M20 278H100L160 311H290L350 278H415" class="outline"/>'+f'<path d="M125 292H325L290 311H160Z" fill="{BLUE}"/>'+txt(20,345,'Along-route flow + temporary storage','small-label')
rain=panel('Rain gardens & swales','08 / STORMWATER · SURFACE SYSTEMS',svg(g,370,'Concept sections of a planted rain garden with possible drain and infiltration, and a vegetated swale','Concept sections, not construction details; no dimensions or layer depths prescribed.'),p('<b>Rain garden:</b> collect, temporarily store and filter runoff through planted medium. Infiltration depends on soil and groundwater conditions.')+p('<b>Swale:</b> a shallow vegetated route for slowing and conveying water. Check dams can add storage.')+note('¹ Drainage may discharge through an underdrain or controlled outlet. Infiltration is not guaranteed by adding planting.')+p('Keep an overflow route; provide access to remove sediment and maintain inlets. Check contaminated ground and winter operation.'),'rain-gardens','green')
g=txt(20,23,'DRY DETENTION BASIN','sub')+'<path d="M20 66H70L145 131H290L365 66H415" class="outline"/>'
g+=f'<path d="M104 96H331L290 131H145Z" fill="{BLUE}"/>'+txt(219,116,'Temporary storage','small-label','middle')+txt(20,158,'Drains between events → controlled outlet','tiny')
g+=txt(20,205,'WET POND / WETLAND','sub')+'<path d="M20 246H70L145 320H290L365 246H415" class="outline"/>'
g+=f'<path d="M100 276H335L312 299H122Z" fill="{BLUE}"/>'+f'<path d="M122 299H312L290 320H145Z" fill="#4095c4"/>'+line(99,276,380,276,'datum')+line(122,299,380,299,'datum')
g+=txt(215,289,'Live detention volume','small-label','middle')+txt(215,345,'Permanent water below normal level','tiny','middle')
g+='<path d="M45 418H165V388Z" fill="none" class="outline" data-geometry="bank-slope" data-run-metres="4" data-rise-metres="1" data-scale="30"/>'+dim(45,438,165,438,'4 m horizontal')+line(178,388,178,418,'dim')+txt(189,407,'1 m vertical','small-label')
pond=panel('Basins, ponds & wetlands','08 / STORMWATER · HELSINKI GUIDE',svg(g,460,'Concept water-storage sections, plus a scaled triangle showing one metre vertically to four metres horizontally','Water sections are schematic. The slope triangle uses equal horizontal and vertical scales.'),dl([('Bank slope · vertical : horizontal','1:4–1:5'),('Wetland water depth','typically tens of cm')])+p('<b>1:4 = 1 m vertically per 4 m horizontally (25%).</b> 1:5 = 1 per 5 m (20%). Helsinki’s indicative bank slopes.')+p('Wetlands have shallow water and varied planted levels; ponds can retain a permanent water surface.')+note('Count available storage above the normal water level. Permanent water is not empty capacity for the next storm.')+p('Show inlet, controlled outlet, overflow, safe bank treatment and maintenance access. Fit the entire banks and flood extent into the plan.'),'ponds','blue')
g=txt(20,24,'GREEN ROOF','sub')+f'<rect x="35" y="65" width="350" height="22" fill="{GREEN}" class="shape"/><rect x="35" y="87" width="350" height="10" fill="{GREY}" class="shape"/>'+txt(55,127,'Retention + evapotranspiration','small-label')+txt(55,152,'Overflow / roof drainage →','small-label')
g+=txt(20,210,'PERMEABLE PAVEMENT','sub')
for x in range(35,365,33):g+=f'<rect x="{x}" y="244" width="28" height="13" fill="{GREY}" class="shape"/>'
g+=f'<rect x="35" y="260" width="350" height="38" fill="{BLUE}" class="shape"/>'+txt(210,284,'Aggregate void storage','small-label','middle')+txt(55,333,'↓ infiltration or controlled drainage →','small-label')
source=panel('Roofs, paving & reuse','08 / STORMWATER · AT THE SOURCE',svg(g,365,'Concept diagrams of a vegetated roof and permeable pavement over a storage layer','Layer thicknesses are schematic. Storage and drainage are project inputs.'),table(['Option','Dimension / verify'],[['Green roof','Substrate, wet load, available storage'],['Permeable paving','Void volume, subsoil, drain'],['Rainwater reuse','Tank volume and regular demand'],['Underground storage','Outlet, emptying and maintenance']])+note('Use combinations: reduce runoff at source → slow/filter → store → controlled discharge and overflow.')+p('Permeable surfaces need a clogging and winter-maintenance plan. Pore space, not the full aggregate volume, stores water.'),'source-control','green')
sheet('stormwater-options','Stormwater options',[rain,pond,source])

# 09. W5 section and detail references; model-scale conversion panel removed at user request.
g=''
for i,(w,h) in enumerate([(12,12),(24,12),(36,12)]):
    s=7;y=111+i*124;x=35
    g+=rect(x,y-h*s,3,h,s,GREY,f'wh-left-{w}')+rect(x+(3+w)*s,y-h*s,3,h,s,GREY,f'wh-right-{w}')+line(x,y,x+(w+6)*s,y,'datum')
    g+=dim(x+3*s,y-14,x+(3+w)*s,y-14,f'W = {w} m')+txt(425,y-42,f'W/H = {w/h:g}','measure','end')
g+=txt(35,383,'H = 12 m in all three examples','tiny')
wh=panel('Street width / height','09 / SECTION & FORM · W5',svg(g,410,'Three street sections, with twelve metre buildings and widths of twelve, twenty-four and thirty-six metres','One scale throughout. Building depths are illustrative.'),dl([('Width W','façade to opposite façade'),('Height H','stated reference height'),('Width / height','W ÷ H')])+note('Shown ratios 1, 2 and 3 are comparisons, not recommended targets. Record both sides if heights differ.')+p('Use the same ground level and section line in the plan, section and visualisation. Distinguish street-space width from carriageway width.'),'section-ratio')
g=''
for i,(coverage,storeys,label) in enumerate([(.5,2,'50% × 2 floors'),(.25,4,'25% × 4 floors'),(.125,8,'12.5% × 8 floors')]):
    x=25+i*140;s=3.5
    g+=rect(x,65,32,32,s,GREEN,f'far-plot-{i}')+rect(x,65,32,32*coverage,s,YELLOW,f'far-footprint-{i}')+txt(x+56,35,f'{storeys} FLOORS','sub','middle')+txt(x+56,206,label,'small-label','middle')+txt(x+56,234,'e = 1.0','measure','middle')
g+=txt(25,291,'Same 32 × 32 m land area in each example','tiny')+txt(25,313,'Identical floor plates assumed within each building','tiny')
far=panel('Same ratio, different form','09 / MASSING · GEOMETRIC EXAMPLES',svg(g,345,'Three equal plots with building coverage of one half, one quarter and one eighth; two, four and eight floors give floor-area ratio one'),dl([('Land area, each example','1,024 m²'),('Total floor area, each','1,024 m²'),('Floor-area ratio, each','1.0')])+note('Equal floor area does not imply equal height, open-space usability, daylight or resident population.')+p('For real designs, sum the actual counted floor areas. Keep plot, block and district denominators separate.'),'equal-density')
g=txt(25,25,'OUTDOOR STAIR · SuRaKu EXAMPLE','sub')
# Six identical risers and treads, at 100 SVG units per metre, both axes.
x,y=40,200;path=f'M{x} {y}'
for i in range(6):
    y-=12;path+=f'V{y}';x+=42;path+=f'H{x}'
path+='V200Z'
g+=f'<path d="{path}" fill="{YELLOW}" class="shape" data-geometry="steps" data-rise-metres="0.12" data-tread-metres="0.42" data-scale="100"/>'
g+=dim(250,105,292,105,'0.42 m')+line(235,140,196,96,'dim')+txt(143,85,'0.12 m rise','small-label')
g+=txt(40,249,'2 × rise + tread = 0.66 m','measure')+bar(40,292,1,100)
steps=panel('Outdoor steps','09 / DETAILS · SuRaKu 2008',svg(g,335,'Six steps with one hundred twenty millimetre risers and four hundred twenty millimetre treads, at equal horizontal and vertical scale','Example dimensions from dated outdoor guidance; not a complete stair design.'),dl([('Stair width · minimum','1.2 m'),('Source rise','0.12 m'),('Derived outdoor tread','0.42 m'),('Rest landing · recommended','every 10–15 steps'),('Edge contrast stripe','30–40 mm')])+note('SuRaKu uses 2r + t = 0.66 m outdoors; covered/heated stairs use 0.63 m. Keep risers and treads identical.')+p('Coordinate handrails, guarding, landings and a continuous accessible alternative.'),'steps')
sheet('section-details','Section & details',[wh,far,steps])

from student_sheet import add_student_sheet
from parking_sheet import add_parking_sheet
add_student_sheet(globals())
add_parking_sheet(globals())

# Navigation and the static download panel. No calculator scripts or numeric inputs.
parts=['''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Compact dimensioned reference sheets for urban design, Finnish guidance and historical rules of thumb. Evidence and CAD downloads."><title>'''+TITLE+'''</title><link rel="stylesheet" href="style.css"></head><body>
<a class="skip" href="#main">Skip to sheets</a><header class="topbar"><a class="brand" href="#built-form"><img src="assets/aalto-logo.svg" alt="Aalto University"><span>'''+TITLE+'''<small>DIMENSIONS &amp; RULES OF THUMB / MITOITUS</small></span></a><div class="tools"><button class="open-cad">CAD ↓</button><button id="sources-toggle" aria-pressed="false">Sources</button><button id="view-toggle" aria-pressed="false">3-screen view</button><button id="fullscreen" title="Fullscreen (F)">Full screen ↗</button></div></header><nav class="tabs" aria-label="Reference sheets">''']
for i,(id,title,_) in enumerate(sheets,1):parts.append(f'<a href="#{id}"><span>{i:02}</span> {title}</a>')
parts.append('</nav><main id="main" tabindex="-1"><h1 class="sr-only" id="page-title">Building types</h1><div id="stage">')
for i,(id,title,panels) in enumerate(sheets):parts.append(f'<section class="sheet" id="{id}" aria-label="{title}"'+(' hidden' if i else '')+'>'+''.join(panels)+'</section>')
parts.append('''</div></main><footer class="page-footer"><span>SPT-E3020 · Aalto University</span><span><a href="downloads/rulebook-offline.zip" download>Offline sheets + CAD ↓</a></span><span id="page-count">01 / 10</span></footer>
<div class="wall-controls"><button id="previous" aria-label="Previous sheet">←</button><span id="wall-page">01 / 10</span><button id="next" aria-label="Next sheet">→</button><button id="wall-sources" aria-pressed="false">Sources</button><button class="open-cad">CAD ↓</button><button id="wall-exit">Desktop</button><button id="wall-fullscreen" aria-label="Toggle fullscreen">↗</button></div>
<aside class="source-banner" hidden><span>English synthesis and diagrams: assistant draft · reviewed 12 Nov 2026</span><a href="evidence.html">Evidence index ↗</a><a href="http://yks.tkk.fi/fi/opinnot/tyokalut/mitoitus.html">Original TKK reference ↗</a></aside><div id="status" class="sr-only" role="status"></div>
<noscript><style>.sheet[hidden]{display:grid!important}</style><p>All sheets are shown. <a href="evidence.html">Evidence index</a>.</p></noscript>
<dialog id="cad-dialog" aria-labelledby="cad-title"><div class="dialog-header"><h2 id="cad-title">CAD reference geometry</h2><button id="close-cad" aria-label="Close downloads">×</button></div><p>1:1 geometry in the selected drawing units.</p><fieldset class="unit-choices"><legend>Units</legend><label><input type="radio" name="cad-unit" value="m" checked> m</label><label><input type="radio" name="cad-unit" value="mm"> mm</label><label><input type="radio" name="cad-unit" value="ft"> ft</label></fieldset><div class="download-list">''')
for kind,name,desc in [('buildings','Building footprints','Representative TKK modules and house footprints; drawn values labelled.'),('accessible','Accessible movement','Turning circles, clear widths, bench space and courtyard parking bay.'),('turning','Car & bus radius bands','Historical TKK inner/outer radii. Reference geometry, not swept paths.'),('rescue','Rescue access','HIKLU reference circles and aerial set-up area; allowances separate.'),('tram','Tram & platforms','45 m service-area example, 3.5 m platforms and 5.5 m track zone.'),('parking','Parking module','Eight example bays with a shared aisle; site extras are additional.'),('street','Street widths','Independent strips; lengths are illustrative.')]:
    parts.append(f'<div><strong>{name}</strong><p>{desc}</p><a data-cad="{kind}" href="downloads/{kind}-m.dxf" download>DXF ↓</a><a data-svg="{kind}" href="downloads/{kind}-m.svg" download>SVG ↓</a></div>')
parts.append('''</div><a id="cad-bundle" class="solid-button" href="downloads/mitoitus-cad-m.zip" download>All templates + evidence ↓</a><p class="small"><a href="downloads/rulebook-offline.zip" download>Offline copy: all sheets, evidence and CAD ↓</a></p><p class="small">1 ft = 0.3048 m exactly. SVG previews do not set a physical print scale. <a href="evidence.html#cad">Units &amp; geometry notes ↗</a></p></dialog><script src="app.js"></script></body></html>''')
page='\n'.join(parts).replace('01 / 10',f'01 / {len(sheets):02}')
for asset in ['style.css','app.js']:
    version=hashlib.sha256((SITE/asset).read_bytes()).hexdigest()[:12]
    page=page.replace('"'+asset+'"','"'+asset+'?v='+version+'"')
(SITE/'index.html').write_text(page)
print(f'Built {len(sheets)} sheets, {len(sheets)*3} technical panels; no calculators.')
