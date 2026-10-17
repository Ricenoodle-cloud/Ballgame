import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
let html=await readFile(path.join(root,'dist/index.html'),'utf8');
const js=html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
const css=html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!js||!css)throw new Error('Build output script or stylesheet missing; run npm run build first');
const code=await readFile(path.join(root,'dist',js[1]),'utf8');
const style=await readFile(path.join(root,'dist',css[1]),'utf8');
// Use replacement functions so dollar sequences in bundled JavaScript stay literal.
html=html.replace(js[0],()=>`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);
html=html.replace(css[0],()=>`<style>${style}</style>`);
const favicon=await readFile(path.join(root,'public/favicon.svg'),'utf8');
html=html.replace(/href="\/favicon.svg"/,()=>`href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}"`);
const output=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'dist-offline/推小球闯关-V2-离线版.html');
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,html);
console.log(`Offline game: ${output}`);
