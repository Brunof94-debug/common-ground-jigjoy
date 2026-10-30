import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=path.join(root,'.runtime');
const files=[
 {name:'llama-b11960-bin-win-cpu-x64.zip',url:'https://github.com/ggml-org/llama.cpp/releases/download/b11960/llama-b11960-bin-win-cpu-x64.zip',sha256:'73f962f82850d244db47eaacb9d913637027b82399124324298576d58c5f4287',bytes:24407745},
 {name:'Qwen3-0.6B-Q8_0.gguf',url:'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/23749fefcc72300e3a2ad315e1317431b06b590a/Qwen3-0.6B-Q8_0.gguf',sha256:'9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031',bytes:639446688}
];
await mkdir(runtime,{recursive:true});
async function digest(file){const h=createHash('sha256');for await(const c of createReadStream(file))h.update(c);return h.digest('hex');}
for(const f of files){const target=path.join(runtime,f.name);let valid=false;try{valid=(await stat(target)).size===f.bytes&&(await digest(target))===f.sha256;}catch{}
 if(!valid){console.log('Downloading official public file:',f.name);const r=await fetch(f.url,{signal:AbortSignal.timeout(600000)});if(!r.ok)throw new Error('Download failed '+r.status);await pipeline(Readable.fromWeb(r.body),createWriteStream(target));if((await stat(target)).size!==f.bytes||(await digest(target))!==f.sha256)throw new Error('Checksum failed for '+f.name);}
 console.log('SHA-256 verified:',f.name);
}
if(process.platform!=='win32')throw new Error('This helper prepares Windows only. Install the official llama.cpp server on your OS and follow README.md.');
const q=s=>"'"+s.replaceAll("'","''")+"'";
const extract=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Expand-Archive -LiteralPath '+q(path.join(runtime,files[0].name))+' -DestinationPath '+q(path.join(runtime,'llama'))+' -Force'],{stdio:'inherit',windowsHide:true});
if(extract.status!==0)throw new Error('Extraction failed');
await writeFile(path.join(runtime,'model-manifest.json'),JSON.stringify({verifiedAt:new Date().toISOString(),model:'Qwen3-0.6B-Q8_0',revision:'23749fefcc72300e3a2ad315e1317431b06b590a',llamaCpp:'b11960',files},null,2));
console.log('Local model ready; no account, credential, or paid service was used.');
