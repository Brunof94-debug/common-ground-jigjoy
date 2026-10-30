// Empty values stop Mozaik's cloud SDK from reading cached pairing credentials.
// This process deliberately uses a local, credential-free inference adapter.
process.env.MOZAIK_API_KEY='';process.env.MOZAIK_PROJECT_KEY='';
import {defineRuntime,RuntimeState,createAgent,createHuman,SituationSpecification,SemanticEvent,ModelContext,SystemMessageItem,ModelMessageItem,TokenUsage,InputTokenDetails,OutputTokenDetails} from '@mozaik-ai/core';
import {randomUUID,createHash} from 'node:crypto';
import {catalog,initialConstraints,validateConstraints,candidates,acceptSelection,checkPlan,priorities,summarizeTrace} from './domain.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
class On extends SituationSpecification{constructor(match){super();this.match=match;}isSatisfiedBy(c){return this.match(c);}}
export class BoardState extends RuntimeState{
 revision=0;constraints=structuredClone(initialConstraints);risk=null;proposal=null;review=null;events=[];jobs={planner:null,sentry:null};pending={planner:null,sentry:null};counts={planner:0,sentry:0};errors=[];
}
export class LocalRunner{
 constructor({endpoint='http://127.0.0.1:4350/v1/chat/completions',timeoutMs=120000,fetchImpl=fetch,live=true}={}){
  const u=new URL(endpoint);if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.protocol!=='http:')throw new Error('Only a loopback model server is supported');
  this.endpoint=u.href;this.timeoutMs=timeoutMs;this.fetchImpl=fetchImpl;this.live=live;
 }
 async run(request){
  const task=request.pcTask;
  const messages=request.context.getItems().filter(x=>x.type==='message').map(x=>({role:x.role==='developer'?'system':x.role,content:x.content.text}));
  const body={model:'ponto-comum-local',messages,temperature:0.2,seed:42,max_tokens:240,stream:false,chat_template_kwargs:{enable_thinking:false},response_format:{type:'json_object',schema:task.schema}};
  let text,row;
  try{
   const response=await this.fetchImpl(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(this.timeoutMs)});
   if(!response.ok)throw new Error('Local model HTTP '+response.status);
   const raw=await response.json();text=raw.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())throw new Error('Local model returned no answer');
   const usage=raw.usage??{};row={live:this.live,model:raw.model,requestId:task.requestId,requestSha256:hash(body),responseSha256:hash(raw),usage,finishReason:raw.choices?.[0]?.finish_reason};
  }catch(error){text=JSON.stringify({_error:String(error.message).slice(0,220)});row={live:false,requestId:task.requestId,error:String(error.message).slice(0,220)};}
  const u=row.usage;
  return {items:[ModelMessageItem.rehydrate({text})],tokenUsage:u?new TokenUsage(u.prompt_tokens??0,u.completion_tokens??0,u.total_tokens??0,new InputTokenDetails(0),new OutputTokenDetails(0)):undefined,rowResponse:row};
 }
 async *stream(){throw new Error('This local adapter uses bounded non-streaming requests');}
}
const objectSchema=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
export class PlanningDesk{
 constructor({runner=new LocalRunner(),onChange=()=>{}}={}){
  this.state=new BoardState();this.onChange=onChange;this.runId=randomUUID();this.loopTasks=new Map();this.roles=new Map();this.notifications=0;
  this.api=defineRuntime();this.api.initializeRuntime({state:this.state,inferenceRunnerConfig:{runner}});
  const observer=createHuman({name:'Trace observer',capabilities:[],handlers:[{specification:new On(()=>true),processor:{apply:({event})=>this.observe(event)}}]});this.observer=observer;this.api.join(observer);
  this.human=createHuman({name:'Workshop host',capabilities:[],handlers:[]});this.api.join(this.human);
  for(const role of ['planner','sentry']){
   const agent=createAgent({name:role==='planner'?'Planner':'Feasibility reviewer',capabilities:['inference'],instruction:'Work on the shared planning board.',tools:[],handlers:[]});
   this.roles.set(role,agent);agent.setHandlers([
    {specification:new On(({event})=>event.type==='board.changed'),processor:{apply:()=>this.request(role,role==='planner'?'plan':'scan')}},
    {specification:new On(({event})=>role==='planner'&&event.type==='risk.reviewed'),processor:{apply:()=>this.request('planner','plan')}},
    {specification:new On(({event})=>role==='sentry'&&event.type==='proposal.changed'),processor:{apply:()=>this.request('sentry','review')}},
    {specification:new On(({event})=>event.type==='model.answer'&&event.producerId===agent.getId()),processor:{apply:({event})=>this.finish(role,event)}}
   ]);this.api.join(agent);
  }
 }
 emit(type,payload={},role){const producer=role?this.roles.get(role).getId():this.human.getId();this.api.sendEvent(SemanticEvent.create(type,producer,payload),producer);}
 observe(event){
  const role=[...this.roles].find(([,a])=>a.getId()===event.producerId)?.[0]??'host';const p=event.payload??{};
  if(event.type==='inference.started')this.loopTasks.set(p.loopId,p.pcTask);
  const task=this.loopTasks.get(p.loopId);let detail={};
  if(event.type==='inference.started')detail={loopId:p.loopId,kind:task.kind,requestId:task.requestId};
  else if(event.type==='inference.completed')detail={loopId:p.loopId,...p.rowResponse};
  else if(event.type==='model.answer')detail={loopId:p.loopId,text:p.answer?.content?.text};
  else if(event.type==='message_received.started'||event.type==='message_received.completed')return;
  else detail=structuredClone(p);
  this.state.events.push({sequence:this.state.events.length+1,at:event.occurredAt.toISOString(),type:event.type,agent:role,revision:task?.revision??this.state.revision,...detail});
  if(this.state.events.length>4000)this.state.events.shift();this.notify();
 }
 notify(){if(this.notifications)return;this.notifications=1;queueMicrotask(()=>{this.notifications=0;this.onChange(this.snapshot());});}
 change(patch){const next=validateConstraints({...this.state.constraints,...patch});this.state.revision++;this.state.constraints=next;this.state.risk=null;this.state.proposal=null;this.state.review=null;this.state.counts={planner:0,sentry:0};this.state.errors=[];this.emit('board.changed',{constraints:structuredClone(next),revision:this.state.revision});return this.snapshot();}
 request(role,kind){
  const s=this.state;if(s.jobs[role]){s.pending[role]=kind;return;}if(!s.revision)return;
  if(kind==='review'&&!s.proposal)return;
  if(kind==='scan'&&s.risk?.revision===s.revision)return;
  if(role==='planner'&&s.proposal?.riskVersion===(s.risk?.version??0)&&s.proposal?.revision===s.revision)return;
  if(s.counts[role]>=4){s.errors.push(role+' reached the four-turn revision limit; a host must review or change the brief.');this.notify();return;}
  s.counts[role]++;
  const task={requestId:randomUUID(),role,kind,revision:s.revision,riskVersion:s.risk?.version??0,proposalId:kind==='review'?s.proposal?.proposalId:null,offered:[],schema:null};
  const c=structuredClone(s.constraints),brief={constraints:c,fictionalData:true};let instruction;
  if(kind==='plan'){
   task.offered=candidates(c,s.risk?.priority??'purpose');brief.priority=s.risk?.priority??'purpose';brief.peerReview=s.risk?.note??'The reviewer is checking the brief concurrently.';
   brief.candidates=task.offered.map(p=>({id:p.id,venue:p.venue.name,activity:p.activity.name,refreshments:p.refreshment.name,totalCents:p.total,reserveCents:p.reserve,capacity:p.venue.capacity,stepFree:p.venue.stepFree,indoor:p.venue.indoor,purpose:p.activity.purpose}));
   const ids=task.offered.map(p=>p.id);if(!ids.length)ids.push('NO_FEASIBLE_PLAN');
   task.schema=objectSchema({candidateId:{type:'string',enum:ids},reason:{type:'string',maxLength:500}});
   instruction='You are the workshop Planner. Choose exactly one offered candidate that best follows the peer priority. Never invent venues, prices, or IDs. All offered candidates already satisfy the hard constraints. If priority is budget, prefer the lowest total; if purpose, prefer the highest purpose; if comfort, prefer a comfortable venue. Explain the tradeoff briefly in English. If no candidates exist choose NO_FEASIBLE_PLAN. Return only the requested JSON. /no_think';
  }else if(kind==='scan'){
   brief.venues=catalog.venues;brief.budgetBand=c.budget<60000?'tight':'adequate';brief.policy='A 10% contingency is required. A reduced budget needs budget priority; otherwise prioritize the workshop purpose. Step-free access and rain shelter are hard constraints checked by code.';
   task.schema=objectSchema({priority:{type:'string',enum:c.budget<60000?['budget']:['purpose','comfort']},note:{type:'string',maxLength:500}});
   instruction='You are the independent Feasibility reviewer. Inspect the workshop brief and decide the planning priority. Use the computed budgetBand: tight means budget priority; adequate means purpose or comfort. The band is calculated by code. Explain the tradeoff without quoting numbers or inventing needs. You are scanning while the Planner is already working. Return only the requested JSON. /no_think';
  }else{
   brief.proposal=structuredClone(s.proposal);brief.verifiedChecks=checkPlan(s.proposal.plan,c);
   task.schema=objectSchema({verdict:{type:'string',enum:['ready_for_host','needs_host_attention']},reason:{type:'string',maxLength:500}});
   instruction='You are the independent Feasibility reviewer. Inspect the current proposal and verified hard-constraint checks. Verify total includes reserve, capacity, access, shelter and closures. Return ready_for_host if verifiedChecks.valid is true; otherwise needs_host_attention. Explain the tradeoff and any limitation concisely in English. This is a planning note, never a booking. Return only the requested JSON. /no_think';
  }
  s.jobs[role]=task;s.pending[role]=null;
  const context=ModelContext.create().addContextItem(SystemMessageItem.create(instruction));
  this.api.runLoop(this.roles.get(role).getId(),JSON.stringify(brief),{model:'Qwen3-0.6B-Q8_0',context,tools:[],pcTask:task});this.notify();
 }
 finish(role,event){
  const s=this.state,task=s.jobs[role];if(!task)return;s.jobs[role]=null;
  try{
   if(task.revision!==s.revision){this.emit('answer.discarded',{reason:'Constraint revision changed during inference',fromRevision:task.revision,nowRevision:s.revision},role);}
   else{
    const answer=JSON.parse(event.payload.answer.content.text);if(answer._error)throw new Error(answer._error);
    if(task.kind==='scan'){
     if(!priorities.includes(answer.priority)||(s.constraints.budget<60000&&answer.priority!=='budget')||(s.constraints.budget>=60000&&answer.priority==='budget')||typeof answer.note!=='string')throw new Error('Invalid reviewer scan');
     s.risk={revision:s.revision,version:task.riskVersion+1,priority:answer.priority,note:answer.note.slice(0,500)};this.emit('risk.reviewed',s.risk,role);
    }else if(task.kind==='plan'){
     if(task.riskVersion!==(s.risk?.version??0)){this.emit('answer.discarded',{reason:'Peer review arrived during inference; replan with shared state',fromRiskVersion:task.riskVersion},role);s.pending.planner='plan';}
     else if(!task.offered.length&&answer.candidateId==='NO_FEASIBLE_PLAN'){s.errors.push('No catalog combination meets all hard constraints. Change the brief; no plan will be forced.');this.emit('plan.infeasible',{revision:s.revision},role);}
     else{const plan=acceptSelection(answer,task.offered,s.constraints);s.proposal={proposalId:randomUUID(),revision:s.revision,riskVersion:task.riskVersion,plan};s.review=null;this.emit('proposal.changed',{proposalId:s.proposal.proposalId,candidateId:plan.id,total:plan.total,riskVersion:task.riskVersion},role);}
    }else{
     if(task.proposalId!==s.proposal?.proposalId){this.emit('answer.discarded',{reason:'Proposal changed while being reviewed'},role);s.pending.sentry='review';}
     else if(!['ready_for_host','needs_host_attention'].includes(answer.verdict)||typeof answer.reason!=='string')throw new Error('Invalid review response');
     else{s.review={revision:s.revision,proposalId:task.proposalId,verdict:answer.verdict,reason:answer.reason.slice(0,500),checks:checkPlan(s.proposal.plan,s.constraints)};this.emit('proposal.reviewed',{...s.review},role);}
    }
   }
  }catch(error){s.errors.push(role+': '+error.message);this.emit('agent.error',{requestId:task.requestId,error:error.message},role);}
  const pending=s.pending[role];s.pending[role]=null;if(task.revision!==s.revision){queueMicrotask(()=>this.request(role,role==='planner'?'plan':'scan'));}else if(pending){queueMicrotask(()=>this.request(role,pending));}
  this.notify();
 }
 snapshot(){const s=this.state;return {runId:this.runId,revision:s.revision,constraints:structuredClone(s.constraints),risk:structuredClone(s.risk),proposal:structuredClone(s.proposal),review:structuredClone(s.review),jobs:Object.fromEntries(Object.entries(s.jobs).map(([r,t])=>[r,t?{kind:t.kind,revision:t.revision,requestId:t.requestId}:null])),errors:[...s.errors],events:structuredClone(s.events),metrics:summarizeTrace(s.events),mode:'live-local',fictionalData:true};}
 async waitForIdle(timeout=180000){const start=Date.now();while(Date.now()-start<timeout){await new Promise(r=>setTimeout(r,100));if(!Object.values(this.state.jobs).some(Boolean)&&!Object.values(this.state.pending).some(Boolean))return this.snapshot();}throw new Error('Planning did not settle within the time limit');}
}

