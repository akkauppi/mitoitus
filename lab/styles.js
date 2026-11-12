// Shared colour roles. Scene builders never choose their own palette.
export const STYLES = {
  paper: {
    name:'Paper model', description:'Quiet fills · crisp edges · light modelling',
    background:'#f7f5ef', edge:'#58605d', edgeOpacity:0.63, light: true, shadows:false,
    colours:{filter:'#c4cda5',flow:'#648c9c',permanentWater:'#6fa1ba',water:'#a9cbd6',cutWater:'#8eb8c7',clearance:'#cbdde0',paving:'#eee5d2',cycle:'#d5aaa0',road:'#c6ced4',grass:'#c0d1b0',soil:'#d1b5a0',subsoil:'#e3cdb7',root:'#c89878',person:'#dddcd6',foliage:'#a9c4a2',trunk:'#ab927e',cutSoil:'#b79276',sectionExterior:'#d0d9d6',cutBuilding:'#ceb795',cutPaving:'#d9c8a8',roof:'#b5a69a',circulation:'#9fc9c5',building:'#dfb29d',buildingAlt:'#c6ced4',vehicle:'#dfb29d',glass:'#6b8b91',rubber:'#646a68',metal:'#93a09d',furniture:'#b8997c',rail:'#8a9796',white:'#fcf7e8'}
  },
  ink: {
    name:'Contour drawing', description:'Pale surfaces · stronger linework · no lighting',
    background:'#faf9f4', edge:'#3e5352', edgeOpacity:0.85, light:false, shadows:false,
    colours:{filter:'#e1e5ce',flow:'#8eaebc',permanentWater:'#a9cbd9',water:'#d9e8ed',cutWater:'#b8d3de',clearance:'#e2ebeb',paving:'#f2eedf',cycle:'#ead7cf',road:'#e3e9e9',grass:'#e1e8d8',soil:'#e4d6c7',subsoil:'#efe3d4',root:'#c9b19a',person:'#d5dad7',foliage:'#d5e2ca',trunk:'#d5c4ad',cutSoil:'#d4c2ae',sectionExterior:'#e0e7e4',cutBuilding:'#ded0b9',cutPaving:'#e6dfcb',roof:'#d1c9bf',circulation:'#c6dfdc',building:'#e9d6c3',buildingAlt:'#e3e9e9',vehicle:'#e9d6c3',glass:'#b0c5c6',rubber:'#8c9b97',metal:'#b4bfba',furniture:'#d7c6ad',rail:'#a1afaa',white:'#fffdf5'}
  },
  soft: {
    name:'Pastel relief', description:'Richer colour · soft shadows · deeper ground',
    background:'#f2f3ed', edge:'#60706a', edgeOpacity:0.46, light:true, shadows:true,
    colours:{filter:'#b4c797',flow:'#4c899c',permanentWater:'#568da9',water:'#9ccad9',cutWater:'#73aabd',clearance:'#b9d4dc',paving:'#f0dfbf',cycle:'#d9a6a3',road:'#b9c9d3',grass:'#b3d0aa',soil:'#c8a58c',subsoil:'#ddc2a5',root:'#af8364',person:'#e2e1db',foliage:'#91bb9b',trunk:'#aa8b72',cutSoil:'#b58d6f',sectionExterior:'#bacdc7',cutBuilding:'#c4a47b',cutPaving:'#d9bd94',roof:'#b8a28f',circulation:'#8abfb7',building:'#e4b586',buildingAlt:'#b9c9d3',vehicle:'#e4b586',glass:'#63858a',rubber:'#5b6666',metal:'#88a19b',furniture:'#b99970',rail:'#8a9c96',white:'#fff6de'}
  }
};
