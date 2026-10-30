import {PlanningDesk} from './runtime.mjs';
import {disruption} from './domain.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const desk=new PlanningDesk();desk.change({});
if(process.argv.includes('--midflight')){await new Promise(r=>setTimeout(r,500));desk.change(disruption);}
let initial=await desk.waitForIdle();
console.log('INITIAL',JSON.stringify({revision:initial.revision,proposal:initial.proposal?.plan.id,review:initial.review?.verdict,errors:initial.errors,metrics:initial.metrics}));
if(!process.argv.includes('--midflight')){desk.change(disruption);initial=await desk.waitForIdle();}
const result=initial;
await mkdir('evidence',{recursive:true});
const filename=process.argv.includes('--midflight')?'evidence/live-midflight.json':'evidence/live-run.json';
const receipt={recordedAt:new Date().toISOString(),description:'Actual local Qwen3-0.6B-Q8_0 inference on Mozaik 4.1.0. Fictional workshop catalog. No simulated fallback.',...result};
await writeFile(filename,JSON.stringify(receipt,null,2)+'\n');
console.log('FINAL',JSON.stringify({file:filename,proposal:result.proposal?.plan.id,total:result.proposal?.plan.total,review:result.review?.verdict,metrics:result.metrics,errors:result.errors,sha256:createHash('sha256').update(JSON.stringify(receipt)).digest('hex')}));
if(result.metrics.overlappingLivePairs<1||result.errors.length||result.review?.verdict!=='ready_for_host'||!result.review?.checks.valid)process.exitCode=1;
