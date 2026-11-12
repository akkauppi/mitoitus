"""Parking geometry and dated municipal apartment-norm examples."""
def add_parking_sheet(ns):
    txt,line,dim,rect,bar,svg,panel,sheet,dl,note,p,table,vehicle=(ns[k] for k in ['txt','line','dim','rect','bar','svg','panel','sheet','dl','note','p','table','vehicle'])
    YELLOW,BLUE,GREEN,GREY=(ns[k] for k in ['YELLOW','BLUE','GREEN','GREY'])
    s=18
    g=txt(20,23,'90° PARKING · DATED LAYOUT EXAMPLE','sub')
    g+=rect(40+5*s,75,7,10,s,GREY,'parking-aisle')
    for row in range(4):
        for side,x in [('left',40),('right',40+12*s)]:
            y=75+row*2.5*s
            g+=rect(x,y,5,2.5,s,YELLOW,f'parking-bay-{side}-{row}')
            g+=vehicle(x,y+.35*s,5,1.8,s,'car',f'parking-car-{side}-{row}',reverse=side=='right')
    g+=dim(40,60,40+5*s,60,'5 m')+dim(130,60,256,60,'7 m aisle')+dim(256,60,346,60,'5 m')
    g+=dim(370,75,370,120,'2.5 m',True)+dim(40,290,346,290,'17 m overall module')
    g+=txt(40,322,'4 bays each side · 8 spaces','small-label')+bar(40,355,5,s)
    layout=panel('Bays & manoeuvring','11 / PARKING · SALO 2016 / TKK 2007',svg(g,390,'Eight two-point-five by five metre parking bays around a seven metre aisle, with five by one-point-eight metre reference cars at the same scale','Repeating bays; row ends excluded. Car bodies: 5 × 1.8 m, mirrors omitted. No swept path is implied.'),dl([('90° bay','2.5 × 5 m'),('Two-way aisle · example','≥7 m'),('Double-row module','5 + 7 + 5 = 17 m'),('Accessible courtyard bay¹','≥3.6 × 5 m')])+note('Dated surface-parking example. Check actual vehicles, door opening, end bays, columns and manoeuvring. ¹ SuRaKu 2008; transfer access is additional.')+p('<b>W4 brief:</b> no long-term private-car parking. This sheet is also a reference for later design work.'),'parking-layout')
    s=40
    g=txt(20,23,'ONE BAY + HALF OF A SHARED AISLE','sub')
    g+=rect(40,80,5,2.5,s,YELLOW,'parking-area-bay')+rect(240,80,3.5,2.5,s,GREY,'parking-area-share')
    g+=vehicle(40,94,5,1.8,s,'car','parking-area-car')
    g+=dim(40,66,240,66,'5 m bay')+dim(240,66,380,66,'3.5 m share')+dim(410,80,410,180,'2.5 m',True)
    g+=txt(140,216,'12.5 m²','measure','middle')+txt(310,216,'8.75 m²','measure','middle')
    g+=txt(220,264,'21.25 m² / space','big-label','middle')+txt(220,293,'before site extras','small-label','middle')+bar(40,345,2,s)
    area=panel('A bay is not the full area','11 / PARKING · GEOMETRIC ACCOUNTING',svg(g,390,'A twelve-point-five-square-metre bay plus eight-point-seven-five square metres of shared aisle, totalling twenty-one-point-two-five square metres per space','Half of the 7 m aisle allocated to each facing bay. This is area accounting, not a separate 3.5 m manoeuvring aisle.'),dl([('Bay alone','12.5 m²'),('Bay + shared aisle','21.25 m²'),('20-space module','425 m²')])+p('The complete site needs more: entrances, row ends, pedestrian routes, accessible spaces, planting, snow and drainage.')+note('Do not use 12.5 m² × number of cars as the parking-area reservation. For garages, also include ramps, structure and vertical circulation.')+p('Draw the actual layout and count usable spaces. Gross area per space is a result of that design.'),'parking-area','green')
    g=txt(20,23,'ILLUSTRATIVE APARTMENT DEVELOPMENT','sub')+txt(20,53,'10,000 residential floor-m² · 100 dwellings','small-label')
    g+=txt(20,99,'Helsinki · zone 3, outside C1/C2/C3 centres','small-label')
    g+='<rect x="20" y="117" width="198" height="30" fill="#ffe54c"/>'+txt(235,139,'44 spaces','measure')
    g+=txt(20,191,'Espoo · class I central core','small-label')
    g+='<rect x="20" y="209" width="346.5" height="30" fill="#99c9ee"/>'+txt(366.5,264,'77 spaces','measure','end')
    g+=txt(20,310,'Rounded up; no project-specific reductions.','tiny')+txt(20,332,'Car-space counts, not physical lengths.','tiny')
    norms=panel('Apartment parking norms','11 / PARKING · MUNICIPAL EXAMPLES 2025',svg(g,365,'For a stated ten-thousand-floor-square-metre and hundred-dwelling example, Helsinki zone three gives forty-four spaces and Espoo class one central core gives seventy-seven','Helsinki: ceil(10,000/230). Espoo: ceil(max(10,000/130, 0.5 × 100)). Floor-m² = statutory floor area (k-m²). Locations and dwelling count are assumptions.'),table(['Mapped location','Minimum car spaces'],[['Helsinki · zone 2','1 / 250 floor-m²'],['Helsinki · zone 3','1 / 230 floor-m²'],['Helsinki · zone 4','1 / 200 floor-m²'],['Espoo · class I core','1 / 130 floor-m²'],['Espoo · class II core','1 / 110 floor-m²'],['Espoo · class III core','1 / 95 floor-m²']])+note('Espoo also requires ≥0.5 space/dwelling; the larger count governs. Core means the mapped central area, typically within 300 m of the station or centre.')+p('Espoo: ≥5% of required spaces for visitors. Helsinki C1/C2/C3 centres: add 30 to the denominators. Check the applicable plan, mapped location and permitted adjustments.'),'parking-norms','blue')
    sheet('parking','Parking',[layout,area,norms])
