import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
await mkdir('work', {recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const context=await browser.newContext({offline:true,viewport:{width:1024,height:768}});
let page=await context.newPage();
let directFile=true;
try { await page.goto(pathToFileURL(resolve('dist-offline/推小球闯关-V5-艺术主菜单版.html')).href); }
catch(e) {
 if(!String(e).includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw e;
 directFile=false;await page.close();page=await context.newPage();
 console.log('LIMITATION file:// blocked by browser administrator policy; testing complete HTML via setContent');
}
const errors=[],network=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
if(!directFile)await page.setContent(await readFile('dist-offline/推小球闯关-V5-艺术主菜单版.html','utf8'));
await page.getByRole('heading',{name:'推小球闯关',exact:true}).waitFor();
assert.equal(await page.locator('.menu-flower').count(),3);
assert.equal(await page.locator('.menu-flower>path').count(),60);
await page.getByRole('button',{name:'开始游戏'}).click();
await page.waitForTimeout(4000);
assert.equal(await page.locator('.scene-error').count(),0);
assert.equal(await page.locator('canvas').count(),1);
assert.ok(await page.locator('.scoreboard').isVisible());
await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.press('Shift');await page.keyboard.up('w');
await page.waitForTimeout(500);
await page.screenshot({path:'work/v5-offline.png'});
assert.deepEqual(network,[]);assert.deepEqual(errors,[]);
console.log('PASS complete HTML loads offline, controls run, no HTTP requests or runtime errors; direct file navigation verified:',directFile);
await browser.close();
