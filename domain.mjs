export const catalog={
 venues:[
 {id:'V1',name:'Riverside Garden',cost:19000,capacity:48,stepFree:true,indoor:false,comfort:3},
 {id:'V2',name:'Civic Room',cost:26000,capacity:36,stepFree:true,indoor:true,comfort:2},
 {id:'V3',name:'Library Loft',cost:18000,capacity:50,stepFree:false,indoor:true,comfort:3},
 {id:'V4',name:'School Hall',cost:39000,capacity:60,stepFree:true,indoor:true,comfort:2}],
 activities:[{id:'A1',name:'Repair circle',perPerson:650,purpose:3},{id:'A2',name:'Zine making',perPerson:400,purpose:2},{id:'A3',name:'Seed exchange',perPerson:300,purpose:1}],
 refreshments:[{id:'F1',name:'Water and fruit',perPerson:350},{id:'F2',name:'Shared snack',perPerson:600},{id:'F3',name:'Tea and water',perPerson:200}]
};
export const initialConstraints={budget:80000,people:32,stepFree:true,rain:false,closed:[],reserveBps:1000};
export const disruption={budget:48000,rain:true,closed:['V1']};
export const priorities=['purpose','budget','comfort'];
export function validateConstraints(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Expected a constraints object');
 const allowed=Object.keys(initialConstraints);if(Object.keys(value).some(k=>!allowed.includes(k)))throw new Error('Unknown constraint');
 const c=structuredClone({...initialConstraints,...value});
 if(!Number.isSafeInteger(c.budget)||c.budget<0||c.budget>1000000)throw new Error('Budget must be 0 to 1,000,000 cents');
 if(!Number.isInteger(c.people)||c.people<1||c.people>60)throw new Error('People must be 1 to 60');
 if(typeof c.stepFree!=='boolean'||typeof c.rain!=='boolean')throw new Error('Access and rain must be booleans');
 if(c.reserveBps!==1000)throw new Error('The contingency reserve is fixed at 10%');
 if(!Array.isArray(c.closed)||c.closed.length>4||new Set(c.closed).size!==c.closed.length||c.closed.some(id=>!catalog.venues.some(v=>v.id===id)))throw new Error('Unknown or duplicate closed venue');
 return c;
}
export function materialize(id,c){
 if(typeof id!=='string')throw new Error('Missing candidate id');const [vi,ai,fi,...extra]=id.split('-');
 const venue=catalog.venues.find(x=>x.id===vi),activity=catalog.activities.find(x=>x.id===ai),refreshment=catalog.refreshments.find(x=>x.id===fi);
 if(extra.length||!venue||!activity||!refreshment)throw new Error('Unknown catalog candidate');
 const subtotal=venue.cost+c.people*(activity.perPerson+refreshment.perPerson),reserve=Math.ceil(subtotal*c.reserveBps/10000);
 return {id,venue,activity,refreshment,people:c.people,subtotal,reserve,total:subtotal+reserve,sourceIds:[vi,ai,fi]};
}
export function checkPlan(plan,c){
 const errors=[];if(c.closed.includes(plan.venue.id))errors.push('venue_closed');
 if(plan.people!==c.people)errors.push('attendance_changed');
 if(plan.venue.capacity<c.people)errors.push('capacity');
 if(c.stepFree&&!plan.venue.stepFree)errors.push('step_free');
 if(c.rain&&!plan.venue.indoor)errors.push('rain_shelter');
 if(plan.total>c.budget)errors.push('budget');
 return {valid:!errors.length,errors,headroom:c.budget-plan.total};
}
export function candidates(c,priority='purpose'){
 const all=[];for(const v of catalog.venues)for(const a of catalog.activities)for(const f of catalog.refreshments){const p=materialize(`${v.id}-${a.id}-${f.id}`,c);if(checkPlan(p,c).valid)all.push(p);}
 const score=p=>priority==='budget'?-p.total:priority==='comfort'?p.venue.comfort*100000-p.total:p.activity.purpose*100000-p.total;
 return all.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)).slice(0,12);
}
export function acceptSelection(answer,offered,c){
 if(!answer||typeof answer.candidateId!=='string'||!offered.some(p=>p.id===answer.candidateId))throw new Error('Model selected an unoffered candidate');
 if(typeof answer.reason!=='string'||answer.reason.trim().length<5||answer.reason.length>600)throw new Error('Invalid model explanation');
 const plan=materialize(answer.candidateId,c);if(!checkPlan(plan,c).valid)throw new Error('Candidate is no longer feasible');return {...plan,reason:answer.reason.trim()};
}
export function summarizeTrace(events){
 const open=new Map(),spans=[];let peak=0;
 for(const e of events){if(e.type==='inference.started'){open.set(e.loopId,e);peak=Math.max(peak,open.size);}if(e.type==='inference.completed'){const s=open.get(e.loopId);if(s){spans.push({agent:s.agent,loopId:e.loopId,revision:s.revision,start:s.at,end:e.at,live:e.live===true,error:e.error??null});open.delete(e.loopId);}}}
 let overlappingPairs=0;for(let i=0;i<spans.length;i++)for(let j=i+1;j<spans.length;j++){const a=spans[i],b=spans[j];if(a.agent!==b.agent&&a.live&&b.live&&!a.error&&!b.error&&Math.max(Date.parse(a.start),Date.parse(b.start))<Math.min(Date.parse(a.end),Date.parse(b.end)))overlappingPairs++;}
 return {peakConcurrentLoops:peak,overlappingLivePairs:overlappingPairs,completedCalls:spans.length,liveCalls:spans.filter(x=>x.live&&!x.error).length,staleAnswers:events.filter(x=>x.type==='answer.discarded').length,spans};
}
