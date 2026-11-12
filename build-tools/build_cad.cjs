const {writeFileSync,mkdirSync}=require('node:fs');
const path=require('node:path');const root=path.resolve(__dirname,'..');
require(path.join(root,'cad-base.js'));const cad=require(path.join(root,'cad.js'));
mkdirSync(path.join(root,'downloads'),{recursive:true});
for(const unit of ['m','mm','ft'])for(const kind of ['buildings','accessible','turning','rescue','tram','parking','street'])for(const ext of ['dxf','svg'])writeFileSync(path.join(root,'downloads',`${kind}-${unit}.${ext}`),cad[ext](kind,unit));
console.log('Built reference drawings in 3 units');
