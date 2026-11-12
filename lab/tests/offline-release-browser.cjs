/* Test the distributed ZIP itself in an isolated directory, via file:// and a
 * temporary loopback server. Nothing is served from the repository checkout. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const archive=path.resolve(process.env.OFFLINE_ZIP||path.join(__dirname,'../book/downloads/rulebook-offline.zip'));
const output=path.resolve(__dirname,'../review/offline-release-results.json');
const categories=[['parking-layout','parking',1],['ground','green-blue',3],['rain-gardens','stormwater-options',1],['ponds','stormwater-options',1],['source-control','stormwater-options',1]];
const variants=[['walking','walk-cycle','walking',3],['cycling','walk-cycle','cycling',4],['car-turn','turning-vehicles','car-layout',2],['bus-turn','turning-vehicles','bus-layout',2]];
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const contained=(root,file)=>{const relative=path.relative(root,file);return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));};

(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mitoitus-offline-release-')),root=path.join(temp,'book');
 let browser,server;
 try{
  fs.mkdirSync(root);
  const extracted=JSON.parse(execFileSync('python3',['-c',String.raw`
import json, pathlib, stat, sys, zipfile
archive, root = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]).resolve()
with zipfile.ZipFile(archive) as z:
    entries = z.infolist()
    assert len({i.filename for i in entries}) == len(entries), 'Duplicate ZIP entries'
    assert sum(i.file_size for i in entries) <= 32 * 1024 * 1024, 'Oversized ZIP'
    for item in entries:
        name = pathlib.PurePosixPath(item.filename)
        assert not name.is_absolute() and '..' not in name.parts and '\\' not in item.filename, 'Unsafe ZIP path'
        assert (root / item.filename).resolve().is_relative_to(root), 'ZIP traversal'
        assert not stat.S_ISLNK(item.external_attr >> 16), 'ZIP symlink'
    assert z.testzip() is None, 'ZIP CRC failure'
    z.extractall(root)
    print(json.dumps({'files': len(entries), 'bytes': sum(i.file_size for i in entries)}))
`,archive,root],{encoding:'utf8'}));
  assert.ok(fs.existsSync(path.join(root,'index.html')));
  assert.equal(fs.existsSync(path.join(root,'downloads/rulebook-offline.zip')),false,'Archive must not contain itself');
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain','.dxf':'application/dxf','.zip':'application/zip'};
  const servedFailures=[];
  server=http.createServer((request,response)=>{
   let target;
   try{target=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));}catch{response.writeHead(400);response.end();return;}
   if(!contained(root,target)){response.writeHead(403);response.end();return;}
   if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
   if(!fs.existsSync(target)||!fs.statSync(target).isFile()){servedFailures.push(request.url);response.writeHead(404);response.end();return;}
   response.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
   if(request.method==='HEAD')response.end();else fs.createReadStream(target).pipe(response);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(Number(process.env.OFFLINE_PORT||0),'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true}),errors=[],external=[],failedRequests=[],verifiedDownloads=new Set();
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(origin+'/')||url.startsWith('data:')||url.startsWith('blob:')||(url.startsWith('file:')&&contained(root,fileURLToPath(url))))return route.continue();
   external.push(url);return route.abort('blockedbyclient');
  });
  context.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText}));});
  const page=await context.newPage(),reports=[];
  let linkChecks=0;
  const ready=async()=>{await page.waitForSelector('body[data-book-ready]');await settle(page);};
  const noSelfLink=async()=>assert.equal(await page.locator('a[href*="rulebook-offline.zip"]').count(),0,'Offline edition offers no unavailable ZIP download');
  const localLinks=async()=>{
   const links=await page.locator('a[href],link[href],script[src],img[src]').evaluateAll(nodes=>nodes.map(node=>({url:node.href||node.src,tag:node.tagName})));
   for(const link of links){
    const url=new URL(link.url);
    if(url.protocol!=='file:'&&url.origin!==origin)continue;
    const target=url.protocol==='file:'?fileURLToPath(url):path.resolve(root,'.'+decodeURIComponent(url.pathname));
    assert.ok(contained(root,target),`Escaping local link: ${link.url}`);
    assert.ok(fs.existsSync(target)&&fs.statSync(target).isFile(),`Missing local link: ${link.url}`);linkChecks++;
   }
  };
  for(const [protocol,base]of [['file',pathToFileURL(path.join(root,'index.html')).href],['http',origin+'/index.html']]){
   await page.goto(base+'?view=desktop#built-form');await ready();
   assert.equal(await page.locator('body').getAttribute('data-offline-edition'),'true');await noSelfLink();await localLinks();
   assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('sources-on')),false);
   for(const [panel,sheet,choice]of categories){
    await page.goto(base+`?mode=overview&view=desktop#${sheet}`);await ready();
    const figure=page.locator(`[data-poster-set="${panel}--v0"]`),control=figure.locator('[data-poster-choice]');
    await control.selectOption(String(choice));
    assert.equal(await figure.locator('.poster-option:not([hidden])').getAttribute('data-poster-option'),String(choice));
    await page.reload();await ready();assert.equal(await control.inputValue(),String(choice));
    assert.equal(await figure.locator('.poster-option:not([hidden]) .modern-poster:visible').count(),1);
    const bad=await figure.locator('.modern-poster').evaluateAll(nodes=>nodes.filter(node=>!node.complete||!node.naturalWidth).map(node=>node.src));assert.deepEqual(bad,[]);
   }
   for(const [panel,sheet,group,choice]of variants){
    await page.goto(base+`?mode=overview&view=desktop#${sheet}`);await ready();
    const selector=page.locator(`[data-variant-group="${group}"] select`);
    await selector.selectOption(String(choice));assert.equal(new URL(page.url()).searchParams.get('layout-'+group),String(choice));
    await page.reload();await ready();assert.equal(await selector.inputValue(),String(choice));
    assert.equal(await page.locator(`[data-panel-id="${panel}"] [data-variant="${choice}"] .modern-poster:visible`).count(),1);
   }
   await page.goto(base+'?mode=focus&panel=walking&layout-walking=2&view=desktop#walk-cycle');await ready();
   if(protocol==='file'){
    assert.equal(await page.locator('canvas').count(),0,'Direct-file mode uses reviewed static figures');
    assert.equal(await page.locator('[data-panel-id="walking"] [data-variant="2"] .modern-poster:visible').count(),1);
   }else{
    await page.waitForFunction(()=>document.querySelector('.scene-viewport')?.dataset.recipe==='walking--v2'&&document.querySelector('.scene-viewport')?.dataset.sceneReady==='true');
    assert.ok(await page.locator('.scene-viewport').evaluate(node=>JSON.parse(node.dataset.callouts).items.some(item=>item.text==='Passing width')));
    await page.goto(base+'?mode=focus&panel=parking-layout&poster-parking-layout--v0=1&view=desktop#parking');await ready();
    await page.waitForFunction(()=>document.querySelector('.scene-viewport')?.dataset.recipe==='parking-layout--v0'&&document.querySelector('.scene-viewport')?.dataset.sceneReady==='true');
    assert.equal(await page.locator('.scene-category select').inputValue(),'1');
    assert.ok(await page.locator('.scene-viewport').evaluate(node=>JSON.parse(node.dataset.callouts).items.some(item=>item.text==='Bay 12.5 m²')));
    await page.locator('.scene-category select').selectOption('0');await settle(page);
    assert.equal(await page.locator('[data-poster-set="parking-layout--v0"] [data-poster-choice]').inputValue(),'0');
   }
   await page.goto(base+'?mode=focus&panel=walking&view=desktop#walk-cycle');await ready();await noSelfLink();
   await page.click('#sources-toggle');
   await page.locator('[data-panel-id="walking"] .proof').click();await page.waitForURL('**/evidence.html#walking');
   assert.equal(await page.locator('#walking').count(),1);await localLinks();
   assert.ok(await page.locator('a[href^="https://"]').count(),'Evidence retains external primary-source links without requesting them');
   await page.goto(base+'?view=desktop#tram');await ready();await page.locator('.tools .open-cad').click();await page.check('input[name="cad-unit"][value="ft"]');
   const downloadPromise=page.waitForEvent('download');await page.locator('[data-cad="tram"]').click();const download=await downloadPromise;
   assert.equal(download.suggestedFilename(),'tram-ft.dxf');assert.equal(await download.failure(),null);
   assert.deepEqual(fs.readFileSync(await download.path()),fs.readFileSync(path.join(root,'downloads/tram-ft.dxf')));
   verifiedDownloads.add(download.url());
   await page.click('#close-cad');await localLinks();
   reports.push({protocol,categorySelectors:categories.length,variantSelectors:variants.length,evidence:'walking fragment and local links',cadDownload:'tram-ft.dxf, identical bytes',viewer:protocol==='file'?'static fallback':'walking variant and parking category 3D'});
   console.log(`Checked ${protocol} extracted edition: selectors, reloads, evidence, CAD and ${protocol==='file'?'static fallback':'local 3D'}.`);
  }
  // Chromium reports a file:// navigation as ERR_ABORTED when handing it to its
  // download manager. Exempt only downloads whose final bytes were verified.
  const downloadAborts=failedRequests.filter(request=>request.error==='net::ERR_ABORTED'&&verifiedDownloads.has(request.url));
  const unexpectedFailures=failedRequests.filter(request=>!downloadAborts.includes(request));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(unexpectedFailures,[]);assert.deepEqual(servedFailures,[]);
  const report={archive:path.basename(archive),sha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),...extracted,profiles:reports,localLinkChecks:linkChecks,selfZipLink:false,externalRequests:external,missingRequests:servedFailures,pageErrors:errors,verifiedDownloadHandoffs:downloadAborts.length};
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log('PASS '+JSON.stringify(report));
 }finally{
  if(browser)await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
