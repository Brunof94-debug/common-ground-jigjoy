import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PlanningDesk} from './runtime.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),port=4351,clients=new Set();
const desk=new PlanningDesk({onChange:s=>{const data='data: '+JSON.stringify(s)+'\n\n';for(const client of clients)client.write(data);}});
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'"};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const allowed=new Set(['/','/index.html','/style.css','/app.mjs','/icon.svg','/recorded-run.json','/README.md']);
function json(res,status,data){res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))throw new Error('JSON content type required');let size=0,data='';for await(const chunk of req){size+=chunk.length;if(size>8192)throw new Error('Request too large');data+=chunk;}return JSON.parse(data);}
const server=http.createServer(async(req,res)=>{
 try{
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)){json(res,403,{error:'Local host required'});return;}
  const url=new URL(req.url,'http://127.0.0.1:'+port),route=url.pathname;
  if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin)){json(res,403,{error:'Local origin required'});return;}
  if(req.method==='GET'&&route==='/app-config.json'){json(res,200,{backend:true});return;}
  if(req.method==='GET'&&route==='/api/info'){
   let modelReady=false;try{modelReady=(await fetch('http://127.0.0.1:4350/health',{signal:AbortSignal.timeout(1500)})).ok;}catch{}
   json(res,200,{modelReady,model:'Qwen3-0.6B-Q8_0',mozaik:'4.1.0',localOnly:true});return;
  }
  if(req.method==='GET'&&route==='/api/state'){json(res,200,desk.snapshot());return;}
  if(req.method==='GET'&&route==='/api/events'){
   res.writeHead(200,{...headers,'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write('data: '+JSON.stringify(desk.snapshot())+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  if(req.method==='POST'&&route==='/api/constraints'){
   const patch=await body(req);let healthy=false;try{healthy=(await fetch('http://127.0.0.1:4350/health',{signal:AbortSignal.timeout(1500)})).ok;}catch{}
   if(!healthy){json(res,503,{error:'The local model is offline. Run npm run model in a separate terminal. No simulated answer was substituted.'});return;}
   json(res,200,desk.change(patch));return;
  }
  if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return;}
  if(!allowed.has(route)){json(res,404,{error:'Not found'});return;}
  const target=route==='/README.md'?path.join(root,'README.md'):path.join(root,'public',route==='/'?'index.html':route.slice(1));
  const data=await readFile(target);res.writeHead(200,{...headers,'Content-Type':mime[path.extname(target)]??'application/octet-stream'});res.end(data);
 }catch(error){json(res,400,{error:String(error.message).slice(0,200)});}
});
server.requestTimeout=10000;server.headersTimeout=10000;
server.listen(port,'127.0.0.1',()=>console.log('Common Ground: http://127.0.0.1:'+port));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{for(const c of clients)c.end();server.close(()=>process.exit());});
