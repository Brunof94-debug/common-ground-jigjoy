import {execFileSync} from 'node:child_process';
const raw=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\nusername=Brunof94-debug\n\n',encoding:'utf8',stdio:['pipe','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});
const credentials=Object.fromEntries(raw.trim().split('\n').map(l=>{const p=l.indexOf('=');return[l.slice(0,p),l.slice(p+1)]}));
const headers={Authorization:'Bearer '+credentials.password,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'};
const me=await(await fetch('https://api.github.com/user',{headers})).json();if(me.login?.toLowerCase()!=='brunof94-debug')throw new Error('Wrong GitHub account; publication stopped');
const repoPath='Brunof94-debug/ponto-comum-jigjoy';let r=await fetch('https://api.github.com/repos/'+repoPath,{headers});
if(r.status===404){r=await fetch('https://api.github.com/user/repos',{method:'POST',headers,body:JSON.stringify({name:'ponto-comum-jigjoy',description:'A Mozaik planning room: two concurrent local agents adapt a fictional community workshop to changing constraints.',private:false,has_issues:true,has_wiki:false})});if(r.status!==201)throw new Error('Repository creation failed, HTTP '+r.status);}
else if(!r.ok)throw new Error('Repository check failed, HTTP '+r.status);
const repo=await r.json();if(repo.owner.login.toLowerCase()!=='brunof94-debug'||repo.private)throw new Error('Unexpected repository owner or visibility');
console.log(JSON.stringify({repository:repo.html_url,visibility:repo.visibility,owner:repo.owner.login}));
