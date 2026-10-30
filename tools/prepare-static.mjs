import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const receipt=JSON.parse(await readFile('evidence/live-run.json','utf8'));
if(receipt.mode!=='live-local'||receipt.metrics.overlappingLivePairs<1||receipt.errors.length||!receipt.review.checks.valid)throw new Error('A verified real local run is required for the public recording');
await mkdir('docs',{recursive:true});
for(const name of ['index.html','style.css','app.mjs','icon.svg','app-config.json'])await copyFile('public/'+name,'docs/'+name);
await copyFile('README.md','docs/README.md');await copyFile('evidence/live-run.json','public/recorded-run.json');await copyFile('evidence/live-run.json','docs/recorded-run.json');await writeFile('docs/.nojekyll','');
const files=['runtime.mjs','domain.mjs','server.mjs','public/app.mjs','public/style.css'];const checksums={};for(const file of files)checksums[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('evidence/source-manifest.json',JSON.stringify({checkedAt:new Date().toISOString(),recordedRun:'live-run.json',checksums},null,2)+'\n');
console.log('Static demonstration prepared from actual run '+receipt.runId);
