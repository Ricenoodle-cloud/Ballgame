import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
const html = await readFile('dist-desktop/index.html', 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
assert(assets.length >= 3);
for (const asset of assets) {
  assert(!/^(?:https?:|\/)/.test(asset), `Not a relative local asset: ${asset}`);
  await access(path.join('dist-desktop', asset));
}
const scripts = assets.filter(asset => asset.endsWith('.js'));
const bundle = (await Promise.all(scripts.map(asset => readFile(path.join('dist-desktop', asset), 'utf8')))).join('');
assert(bundle.includes('AGFzbQ'), 'Expected embedded Rapier WebAssembly bytes');
console.log('Desktop HTML assets are local; Rapier WASM is embedded in the bundle.');
