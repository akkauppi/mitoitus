/* Verify edition import maps and image/CSS URLs using a real warm browser cache.
 * The fixture serves generated HTML plus unchanged files from the built book;
 * it neither rebuilds that candidate nor rewrites its runtime modules. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),book=path.join(root,'lab/book');
const fixture=JSON.parse(execFileSync('python3',['-c',[
 "import json, sys",
 "sys.path.insert(0, sys.argv[1])",
 "import candidate as c",
 "source = (c.ROOT/'index.html').read_bytes()",
 "first = c.EDITION",
 "versions = {}",
 "for edition in (first, first + '-cache-test'):",
 "    c.EDITION = edition",
 "    versions[edition] = c.render_book(source).decode()",
 "print(json.dumps(versions))",
].join('\n'),path.join(root,'lab/scripts')],{encoding:'utf8',maxBuffer:2*1024*1024}));

(async()=>{
 const editions=Object.keys(fixture),requests=[],errors=[],external=[],missing=[];
 let edition=editions[0],browser;
 const prefix='/rulebook/';
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
 const server=http.createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');requests.push(url.pathname+url.search);
  if(url.pathname===prefix){response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});response.end(fixture[edition]);return;}
  let name;
  try{name=decodeURIComponent(url.pathname.slice(prefix.length));}catch{response.writeHead(400);response.end();return;}
  const file=path.resolve(book,name),relative=path.relative(book,file);
  if(!url.pathname.startsWith(prefix)||relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   missing.push(request.url);response.writeHead(404);response.end();return;
  }
  response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable'});
  fs.createReadStream(file).pipe(response);
 });
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`,base=origin+prefix;
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),observed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{observed.push(request.url());if(/^https?:/.test(request.url())&&!request.url().startsWith(origin+'/'))external.push(request.url());});
  const visit=async marker=>{
   await page.goto(base+`?panel=trees&cache-test=${marker}#green-blue`);
   await page.waitForFunction(()=>document.querySelector('.scene-viewport')?.dataset.recipe==='trees--v0'&&document.querySelector('.scene-viewport')?.dataset.sceneReady==='true');
   const urls=await page.evaluate(async()=>{
    const imports=JSON.parse(document.querySelector('script[type="importmap"]').textContent).imports;
    const modules=Object.entries(imports).filter(([key])=>key.startsWith('./')).map(([,value])=>new URL(value,location.href).href);
    const assets=[...document.querySelectorAll('script[src],link[rel="stylesheet"],img[src]')].map(node=>node.src||node.href).filter(value=>/\/(runtime|posters)\//.test(value));
    const all=[...new Set([...modules,...assets])];
    // Fetch validates every map target even if a future recipe is not imported
    // by the initial scene. Import execution is checked by the live tree model.
    const statuses=await Promise.all(all.map(async url=>({url,status:(await fetch(url)).status})));
    return{modules,assets,statuses};
   });
   for(const item of urls.statuses){assert.equal(item.status,200,item.url);assert.equal(new URL(item.url).searchParams.get('v'),edition);}
   const dynamic=new URL('runtime/book-3d.js?v='+edition,base).href;
   assert.ok(observed.includes(dynamic),'absolute dynamic import obeys edition map');
   for(const url of observed){
    const parsed=new URL(url);
    if(parsed.pathname.startsWith(prefix+'runtime/')||['scenes.js','assets.js','styles.js','callouts.js'].some(name=>parsed.pathname===prefix+name))assert.equal(parsed.searchParams.get('v'),edition,url);
   }
   return urls;
  };
  const cold=await visit('cold');
  const firstPaths=new Set(requests);
  assert.ok(firstPaths.has(prefix+'runtime/book-3d.js?v='+edition));
  assert.ok(firstPaths.has(prefix+'runtime/annotations.js?v='+edition));
  assert.ok(firstPaths.has(prefix+'vendor/build/three.module.js'));
  requests.length=0;observed.length=0;
  await visit('warm');
  assert.deepEqual(requests.filter(url=>url!==prefix+'?panel=trees&cache-test=warm'),[],'same-edition assets should come from the warm cache');
  requests.length=0;observed.length=0;edition=editions[1];
  const next=await visit('next');
  const refreshed=new Set(requests);
  for(const item of next.statuses){const url=new URL(item.url);assert.ok(refreshed.has(url.pathname+url.search),'next edition fetches '+url.pathname);}
  assert.equal(requests.some(url=>url.startsWith(prefix+'vendor/')),false,'unchanged pinned vendor modules remain cached');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(missing,[]);
  const report={editions,modules:cold.modules.length,versionedAssets:new Set(cold.assets).size,warmAssets:'served from cache',nextEdition:'all versioned files fetched again',vendor:'pinned files retained in cache',errors,external,missing};
  const output=path.join(root,'lab/review/runtime-cache-results.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('PASS '+JSON.stringify(report));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
