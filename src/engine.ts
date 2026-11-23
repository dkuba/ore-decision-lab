/**
 * Ore Decision Lab: an independent, inspectable TypeScript port of the
 * literature-audited synthetic reference. No operational gold processing
 * predictions are authorized by this module.
 *
 * Invariants:
 * - Rules suggest investigations; only measured synthetic lab products yield rates.
 * - Physical split denominator = sum of independently assayed products.
 * - A rejected lab repeat is excluded without erasing accepted replicates.
 * - A constant-residue curve contradicting endpoints is NEVER a qualified winner.
 * - The ±0.50 USD/t band is an invented display convention, not a confidence interval.
 */

export type OreId = 'A' | 'B' | 'C' | 'D';
export type RouteId = 'DIRECT_CIL' | 'CIP' | 'GRAVITY_TAILS_CIL' | 'FLOT_POX_CIL' | 'FLOT_BIOX_CIL' | 'HEAP_ADR';
export type LossModel = 'constant_recovery' | 'constant_residue';
export type RouteStatus = 'synthetic_supported' | 'requires_testwork' | 'not_indicated' | 'blocked_constraint' | 'out_of_scope';
export type RuleStatus = 'triggered' | 'not_triggered' | 'unknown_missing_knowledge';
export type TestStatus = 'available' | 'needed' | 'not_indicated' | 'blocked_constraint';

type EvidenceValue = string | boolean | null;
export interface OreProfile {
  assays: Record<string, string>;
  mineralogy: Record<string, string | boolean>;
  site: Record<string, boolean>;
}
export interface RouteDefinition {
  label: string;
  steps: string[];
  required_site: string[];
  required_lab_gate?: string[];
  equipment: string[];
}
export interface LabGate {
  test_id: string;
  measured_value: string;
  required_minimum: string;
  unit: string;
  source_id: string;
  interpretation: string;
  engineering_qualification: string;
}
export interface Scenario {
  schema_version: string;
  gold_price_USD_per_g: string;
  lab_max_abs_relative_imbalance: string;
  indifference_band_USD_per_t: string;
  C_grade_applicability_scope_gpt: {min:string;max:string};
  C_grade_observed_levels_gpt: string[];
  lab_observations: Partial<Record<OreId, Record<string, LabGate>>>;
  ores: Record<OreId, OreProfile>;
  routes: Record<RouteId, RouteDefinition>;
  costs_USD_per_t_feed: Record<OreId, Record<RouteId, string>>;
  ore_source_ids: Record<OreId, string>;
  stage_run_mapping: Record<OreId, Partial<Record<RouteId, string[]>>>;
}
export interface LabProduct {
  name: string;
  phase: 'solid'|'recovered_gold';
  mass_kg?: string;
  assay_au_gpt?: string;
  measured_recovered_au_g?: string;
}
export interface LabRun {
  run_id: string;
  ore_id: OreId;
  stage: string;
  feed_mass_kg: string;
  feed_assay_au_gpt: string;
  protocol_id: string;
  products: LabProduct[];
}
export interface Predicate {
  all?: Predicate[];
  any?: Predicate[];
  field?: string;
  op?: '=='|'>'|'<'|'>='|'<=';
  value?: string|boolean|number;
}
export interface RuleDefinition {
  id: string;
  description: string;
  priority: number;
  predicate: Predicate;
  candidate_routes: RouteId[];
  testwork: Array<{test_id:string;label:string}>;
  citations: string[];
  inference: string;
}
export interface RuleRegistry {rule_set_version:string;rules:RuleDefinition[];}
export interface FixtureData {
  scenario: Scenario;
  runs: LabRun[];
  rules: RuleRegistry;
  profiles: Record<OreId, Pick<OreProfile,'assays'|'mineralogy'>>;
  literature: {sources:Array<{id:string;title:string;url:string;basis:string;does_not_support:string;authors?:string;year?:number}>};
}
export interface EvaluationInput {
  ore: OreId;
  grade?: string|number;
  lossModel: LossModel;
  mineralogyAvailable: boolean;
  testworkAvailable: boolean;
  heapSiteFeasible: boolean;
}
export interface FactTrace {field:string;observed_value:EvidenceValue;operator:string;rule_threshold:string|boolean|number|null;predicate_result:boolean|null;source_id:string;}
export interface RuleEvaluation {rule_id:string;status:RuleStatus;description:string;priority:number;inference:string;literature_sources:string[];input_facts:FactTrace[];}
export interface Candidate {route_id:RouteId;priority:number;source_rules:string[];purpose:string;}
export interface LabTrace {
  run_id:string;protocol_id:string;feed_au_g:number;calculated_head_au_g:number;
  product_au_g:Record<string,number>;imbalance_percent:number;quality_status:'accepted'|'suspect'|'missing_required_product';
  stage_recovery_fraction:number|null;rate_basis:string;
}
export interface ExcludedRun {run_id:string;reason:string;trace:LabTrace;}
export interface LabGateEvaluation {gate:string;observed:LabGate|null;passed:boolean|null;failure_reason:string|null;}
export interface RouteEvaluation {
  route_id:RouteId;
  label:string;
  status:RouteStatus;
  selection_signal:'indicated_by_rules'|'not_indicated';
  selection_signals:Candidate[];
  blockers:string[];
  calculation_status:'ok'|'not_run';
  recovery?:number;cost_USD_per_t?:number;revenue_USD_per_t?:number;screening_value_USD_per_t?:number;
  source_traces:LabTrace[];excluded_lab_repeats:ExcludedRun[];lab_gate_evaluations:LabGateEvaluation[];
  formula_trace?:string;model_trace?:string;hypothesis_note?:string;equipment:string[];
}
export interface TestPlan {investigation:string;test_id:string|null;candidate_routes:RouteId[];rule_id?:string;priority?:number;literature_sources:string[];status:TestStatus;accepted_run_ids?:string[];source_id?:string;note?:string;}
export interface ModelObservation {route_id:RouteId;grade_gpt:number;observed_tails_gpt:number;hypothesis_predicted_tails_gpt:number;residual_difference_gpt:number;observation_id:string;}
export interface Evaluation {
  inputs:EvaluationInput & {resolvedGrade:number};
  inputFingerprintMaterial:unknown;
  ruleSetVersion:string;fixtureVersion:string;
  mode:string;evidenceStatus:string;resultLabel:string;
  leaders:RouteId[];hypotheticalLeaders:RouteId[];
  lossModelEvidence:string;lossModel:LossModel;
  alternatives:RouteEvaluation[];rules:RuleEvaluation[];candidateInvestigations:Candidate[];testworkPlan:TestPlan[];
  modelVsObservations:ModelObservation[];
  comparisonDifferenceUSDperT:number|null;
  warning:string;
}

export class InputValidationError extends Error {constructor(message:string){super(message);this.name='InputValidationError';}}

export function parseNumber(value:unknown,field='number',{positive=false}:{positive?:boolean}={}):number{
  if(value===null || value===undefined || typeof value==='boolean') throw new InputValidationError(`${field}: число не указано`);
  const input=String(value).trim();
  if(input.includes(',') && input.includes('.')) throw new InputValidationError(`${field}: неоднозначный десятичный разделитель`);
  const normalized=input.replace(',','.');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) throw new InputValidationError(`${field}: некорректное число`);
  const num=Number(normalized);
  if(!Number.isFinite(num) || (positive && num<=0)) throw new InputValidationError(`${field}: значение вне допустимого диапазона`);
  return num;
}
const EPS=1e-10;
const near=(a:number,b:number)=>Math.abs(a-b)<EPS;
export const round=(n:number,d=2)=> Number(n.toFixed(d));
const num=(value:unknown)=>parseNumber(value);
const empty=(s:unknown)=>s===null||s===undefined;
function originalOre(data:FixtureData,ore:OreId){return data.scenario.ores[ore];}
function nested(obs:Record<string,unknown>,field:string,hide:boolean):unknown{
  if(hide && field.startsWith('mineralogy.')) return null;
  return field.split('.').reduce<unknown>((current,key)=>current && typeof current==='object' ? (current as Record<string,unknown>)[key] : null,obs);
}
function evalPredicate(pred:Predicate,obs:Record<string,unknown>,hide:boolean):boolean|null{
  if(pred.all){const items=pred.all.map(p=>evalPredicate(p,obs,hide));return items.includes(false)?false:items.includes(null)?null:true;}
  if(pred.any){const items=pred.any.map(p=>evalPredicate(p,obs,hide));return items.includes(true)?true:items.includes(null)?null:false;}
  const actual=nested(obs,pred.field??'',hide);
  if(empty(actual)) return null;
  if(pred.op==='==' && (typeof actual==='string'||typeof actual==='boolean') && typeof actual===typeof pred.value) return actual===pred.value;
  const a=num(actual),b=num(pred.value);
  switch(pred.op){case'>':return a>b;case'<':return a<b;case'>=':return a>=b;case'<=':return a<=b;case'==':return near(a,b);default:return null;}
}
function atoms(pred:Predicate,obs:Record<string,unknown>,hide:boolean,source:string):FactTrace[]{
  if(pred.all||pred.any)return (pred.all||pred.any||[]).flatMap(p=>atoms(p,obs,hide,source));
  const field=pred.field??'';
  const value=nested(obs,field,hide);
  return [{field,observed_value:(value===undefined?null:value) as EvidenceValue,operator:pred.op??'',rule_threshold:pred.value??null,predicate_result:evalPredicate(pred,obs,hide),source_id:field.startsWith('site.')?'SYNTHETIC_SITE_CONSTRAINT':source}];
}
function assessRules(data:FixtureData,input:EvaluationInput,grade:number,site:Record<string,boolean>){
  const obs=originalOre(data,input.ore);
  const facts:Record<string,unknown>={assays:{...obs.assays,Au_gpt:String(grade)},mineralogy:obs.mineralogy,site};
  const evaluations:RuleEvaluation[]=[];
  const suggested=new Map<RouteId,{priority:number;ids:string[]}>();
  const tests:TestPlan[]=[];
  for(const rule of data.rules.rules){
    const p=evalPredicate(rule.predicate,facts,!input.mineralogyAvailable);
    const status:RuleStatus=p===true?'triggered':p===false?'not_triggered':'unknown_missing_knowledge';
    evaluations.push({rule_id:rule.id,status,description:rule.description,priority:rule.priority,inference:rule.inference,literature_sources:rule.citations,input_facts:atoms(rule.predicate,facts,!input.mineralogyAvailable,data.scenario.ore_source_ids[input.ore])});
    if(p===true){
      for(const route of rule.candidate_routes){
        const x=suggested.get(route)??{priority:rule.priority,ids:[]};x.ids.push(rule.id);x.priority=Math.min(x.priority,rule.priority);suggested.set(route,x);
      }
      for(const test of rule.testwork)tests.push({investigation:test.label,test_id:test.test_id,candidate_routes:rule.candidate_routes,rule_id:rule.id,priority:rule.priority,literature_sources:rule.citations,status:'needed'});
    }
  }
  const candidates:Array<Candidate>=[...suggested.entries()].map(([route_id,v])=>({route_id,priority:v.priority,source_rules:v.ids,purpose:'investigate_not_apply'})).sort((a,b)=>a.priority-b.priority||a.route_id.localeCompare(b.route_id));
  return {evaluations,candidates,tests};
}
function productAu(p:LabProduct){return p.phase==='solid'?num(p.mass_kg)*num(p.assay_au_gpt)/1000:num(p.measured_recovered_au_g);}
export function inspectRun(run:LabRun,threshold:number):LabTrace{
  const feed=num(run.feed_mass_kg)*num(run.feed_assay_au_gpt)/1000;
  const products:Record<string,number>={};for(const p of run.products)products[p.name]=productAu(p);
  const calculatedHead=Object.values(products).reduce((s,x)=>s+x,0);
  const imbalance=(calculatedHead-feed)/feed*100;
  const needed=run.stage==='gravity_split'||run.stage==='flotation_split'?['concentrate','tailings']:['recovered_gold','residue'];
  const quality=needed.some(p=>!Object.hasOwn(products,p))?'missing_required_product':Math.abs(imbalance)/100>threshold?'suspect':'accepted';
  const key=run.stage==='gravity_split'||run.stage==='flotation_split'?'concentrate':'recovered_gold';
  return {run_id:run.run_id,protocol_id:`SYN-${run.protocol_id}`,feed_au_g:feed,calculated_head_au_g:calculatedHead,product_au_g:products,imbalance_percent:imbalance,quality_status:quality,stage_recovery_fraction:quality==='accepted'&&calculatedHead>0?products[key]/calculatedHead:null,rate_basis:'calculated_head_from_independent_products'};
}
function ratesForRoute(data:FixtureData,input:EvaluationInput,grade:number,route:RouteId,lookup:Map<string,LabRun>):{rate:number|null;traces:LabTrace[];excluded:ExcludedRun[];blocker:string|null}{
  const ids=data.scenario.stage_run_mapping[input.ore][route]??[];
  if(!ids.length||!input.testworkAvailable)return {rate:null,traces:[],excluded:[],blocker:'missing_test:route_not_qualified'};
  const threshold=num(data.scenario.lab_max_abs_relative_imbalance);
  const traces:LabTrace[]=[],excluded:ExcludedRun[]=[];
  if(input.ore==='C'){
    const accepted=new Map<number,LabTrace[]>();
    for(const id of ids){
      const run=lookup.get(id);
      if(!run)throw new Error(`Missing required fixture ${id}`);
      const trace=inspectRun(run,threshold);
      if(trace.quality_status!=='accepted'){excluded.push({run_id:id,reason:trace.quality_status,trace});continue;}
      const key=num(run.feed_assay_au_gpt),row=accepted.get(key)??[];
      row.push(trace);accepted.set(key,row);
    }
    const nodes=data.scenario.C_grade_observed_levels_gpt.map(Number).sort((a,b)=>a-b);
    if(!accepted.size)return {rate:null,traces:[],excluded,blocker:'insufficient_qualified_bracketing_points'};
    if(nodes.some(g=>near(g,grade))&&!accepted.has(nodes.find(g=>near(g,grade))!))return {rate:null,traces:[],excluded,blocker:'missing_observed_grade_node'};
    for(let j=0;j<nodes.length-1;j++){
      if(grade>nodes[j]+EPS && grade<nodes[j+1]-EPS && (!accepted.has(nodes[j])||!accepted.has(nodes[j+1])))return {rate:null,traces:[],excluded,blocker:'insufficient_qualified_adjacent_observations'};
    }
    const points=[...accepted.entries()].sort((a,b)=>a[0]-b[0]).map(([g,items])=>({g,rate:items.reduce((s,t)=>s+(t.stage_recovery_fraction??0),0)/items.length,traces:items}));
    for(let j=0;j<points.length;j++){
      if(near(grade,points[j].g))return {rate:points[j].rate,traces:points[j].traces,excluded,blocker:null};
      if(j<points.length-1&&grade>points[j].g&&grade<points[j+1].g){
        const a=points[j],b=points[j+1],rate=a.rate+(grade-a.g)*(b.rate-a.rate)/(b.g-a.g);
        return {rate,traces:[...a.traces,...b.traces],excluded,blocker:null};
      }
    }
    return {rate:null,traces:[],excluded,blocker:'out_of_scope:not_bracketed_by_accepted_lab_points'};
  }
  for(const id of ids){
    const run=lookup.get(id);if(!run)throw new Error(`Missing required fixture ${id}`);
    const trace=inspectRun(run,threshold);
    if(trace.quality_status==='accepted')traces.push(trace);else excluded.push({run_id:id,reason:trace.quality_status,trace});
  }
  if(excluded.length)return {rate:null,traces,excluded,blocker:'missing_test:critical_stage_unqualified'};
  const rates=traces.map(t=>t.stage_recovery_fraction??0);
  let rate:number;
  switch(route){
    case'DIRECT_CIL':case'CIP':case'HEAP_ADR':rate=rates[0];break;
    case'FLOT_POX_CIL':case'FLOT_BIOX_CIL':rate=rates[0]*rates[1];break;
    case'GRAVITY_TAILS_CIL':rate=rates[0]*rates[1]+(1-rates[0])*rates[2];break;
  }
  return {rate,traces,excluded,blocker:null};
}
function resolveTestwork(data:FixtureData,input:EvaluationInput,site:Record<string,boolean>,lookup:Map<string,LabRun>,tests:TestPlan[],candidates:Candidate[]):TestPlan[]{
  const sc=data.scenario,threshold=num(sc.lab_max_abs_relative_imbalance);
  const out:TestPlan[]=tests.map(t=>{
    const relevant=t.candidate_routes.filter(id=>sc.routes[id].steps.includes(t.test_id??''));
    const allIds=relevant.flatMap(id=>sc.stage_run_mapping[input.ore][id]??[]).filter(id=>lookup.get(id)?.stage===t.test_id);
    if(relevant.some(id=>sc.routes[id].required_site.some(flag=>site[flag]!==true)))return {...t,status:'blocked_constraint'};
    if(t.test_id==='loaded_ksat')return {...t,status:'needed',note:'Loaded hydraulic test is absent; site suitability is NOT demonstrated'};
    if(t.test_id==='scoping_infiltration'){
      const gate=sc.lab_observations[input.ore]?.scoping_infiltration_screen_pass;
      return {...t,status:gate&&input.testworkAvailable?'available':'needed',source_id:gate?.source_id,note:'Unloaded rate only, not Ksat under stack load'};
    }
    const accepted=allIds.filter(id=>{const run=lookup.get(id);return run&&inspectRun(run,threshold).quality_status==='accepted';});
    return {...t,status:accepted.length&&input.testworkAvailable?'available':'needed',accepted_run_ids:input.testworkAvailable?accepted:[]};
  });
  const suggested=new Set(candidates.map(c=>c.route_id));
  for(const rid of Object.keys(sc.routes) as RouteId[])if(!suggested.has(rid)){
    const blocked=sc.routes[rid].required_site.some(flag=>site[flag]!==true);
    out.push({investigation:blocked?'Route constrained by current site assumptions':'No route signal: evidence does not currently justify ordering these tests',test_id:null,candidate_routes:[rid],status:blocked?'blocked_constraint':'not_indicated',literature_sources:[]});
  }
  return out;
}
function validateInput(data:FixtureData,input:EvaluationInput):number{
  if(!['A','B','C','D'].includes(input.ore))throw new InputValidationError('Неизвестная руда');
  if(!['constant_recovery','constant_residue'].includes(input.lossModel))throw new InputValidationError('Неизвестная модель потерь');
  for(const flag of ['mineralogyAvailable','testworkAvailable','heapSiteFeasible'] as const)if(typeof input[flag]!=='boolean')throw new InputValidationError(`Ожидался переключатель: ${flag}`);
  if(input.ore!=='C'&&input.lossModel==='constant_residue')throw new InputValidationError('Модель постоянных хвостов применена только к руде C');
  const originalGrade=num(data.scenario.ores[input.ore].assays.Au_gpt);
  const grade=input.grade===undefined?originalGrade:parseNumber(input.grade,'Содержание Au',{positive:true});
  if(input.ore!=='C'&&!near(grade,originalGrade))throw new InputValidationError('Ползунок содержания пока доступен только для C');
  if(grade>100)throw new InputValidationError('Содержание Au превышает допустимую область ввода');
  return grade;
}
export function evaluate(data:FixtureData,input:EvaluationInput):Evaluation{
  const sc=data.scenario,grade=validateInput(data,input),ore=input.ore,obs=sc.ores[ore];
  const site:Record<string,boolean>={...obs.site,...(ore==='C'?{heap_pad_suitable:input.heapSiteFeasible}:{})};
  const {evaluations,candidates,tests}=assessRules(data,input,grade,site);
  const lookup=new Map(data.runs.map(r=>[r.run_id,r]));
  const scope=sc.C_grade_applicability_scope_gpt;
  const gradeOut=ore==='C'&&(grade<num(scope.min)-EPS||grade>num(scope.max)+EPS);
  const alternatives:RouteEvaluation[]=[];
  for(const rid of Object.keys(sc.routes) as RouteId[]){
    const route=sc.routes[rid];const signaled=candidates.some(x=>x.route_id===rid);
    const rec:RouteEvaluation={route_id:rid,label:route.label,status:'requires_testwork',selection_signal:signaled?'indicated_by_rules':'not_indicated',selection_signals:candidates.filter(x=>x.route_id===rid),blockers:[],calculation_status:'not_run',source_traces:[],excluded_lab_repeats:[],lab_gate_evaluations:[],equipment:route.equipment};
    if(gradeOut)rec.blockers.push('out_of_scope:Au_grade_outside_C_tested_range');
    else if(!input.testworkAvailable)rec.blockers.push('missing_test:testwork_hidden_or_missing');
    else{
      if(!(sc.stage_run_mapping[ore][rid]??[]).length)for(const stage of route.steps)rec.blockers.push(`missing_test:${stage}`);
      for(const gate of route.required_lab_gate??[]){
        const o=sc.lab_observations[ore]?.[gate];
        const passed=o?num(o.measured_value)>=num(o.required_minimum):null;
        const reason=passed===null?`missing_lab_gate:${gate}`:passed?'':`laboratory_gate_failed:${gate}`;
        rec.lab_gate_evaluations.push({gate,observed:o??null,passed,failure_reason:reason||null});
        if(reason)rec.blockers.push(reason);
      }
      for(const flag of route.required_site)if(site[flag]!==true)rec.blockers.push(`site_constraint_failed:${flag}`);
      if(!rec.blockers.length){
        const {rate,traces,excluded,blocker}=ratesForRoute(data,input,grade,rid,lookup);
        rec.source_traces=traces;rec.excluded_lab_repeats=excluded;
        if(blocker||rate===null)rec.blockers.push(blocker??'missing_test:unknown');
        else{
          let recovery=rate;
          if(ore==='C'&&input.lossModel==='constant_residue'&&(rid==='DIRECT_CIL'||rid==='HEAP_ADR')){
            const run=lookup.get(rid==='DIRECT_CIL'?'C_CIL_08':'C_HEAP_08');
            if(!run)throw new Error('Missing measured central sample');
            const residue=run.products.find(p=>p.name==='residue');if(!residue)throw new Error('Missing central residue');
            const tails=num(residue.assay_au_gpt);
            recovery=1-tails/grade;
            rec.model_trace=`R = 1 − (${tails.toFixed(6)} / ${grade.toFixed(3)})`;
            rec.hypothesis_note='CONTRADICTS_MEASURED_ENDPOINTS_NOT_A_QUALIFIED_MODEL';
          }
          const price=num(sc.gold_price_USD_per_g),cost=num(sc.costs_USD_per_t_feed[ore][rid]);
          const revenue=price*grade*recovery;
          rec.calculation_status='ok';rec.status='synthetic_supported';rec.recovery=recovery;rec.cost_USD_per_t=cost;rec.revenue_USD_per_t=revenue;rec.screening_value_USD_per_t=revenue-cost;
          rec.formula_trace=`${grade.toFixed(3)} × ${price.toFixed(2)} × ${recovery.toFixed(6)} − ${cost.toFixed(2)} = ${(revenue-cost).toFixed(2)} USD/t`;
        }
      }
    }
    if(rec.calculation_status!=='ok'){
      rec.status=rec.blockers.some(x=>x.startsWith('out_of_scope:'))?'out_of_scope':rec.blockers.some(x=>x.startsWith('site_constraint_failed:')||x.startsWith('laboratory_gate_failed:'))?'blocked_constraint':!signaled?'not_indicated':'requires_testwork';
    }
    alternatives.push(rec);
  }
  const feasible=alternatives.filter(x=>x.status==='synthetic_supported').sort((a,b)=>(b.screening_value_USD_per_t??0)-(a.screening_value_USD_per_t??0)||a.route_id.localeCompare(b.route_id));
  let leaders:RouteId[]=[],hypotheticalLeaders:RouteId[]=[];
  let resultLabel='no_comparison';let difference:number|null=null;
  if(feasible.length){
    if(!input.mineralogyAvailable)resultLabel='provisional_calculation_only';
    else if(feasible.length===1){
      // A missing central observation must not turn an untested competing
      // route into an apparent winner. A route *excluded by site constraints*
      // is a different case: it no longer qualifies as a process alternative.
      const unresolvedCCompetitor=ore==='C'&&(['HEAP_ADR','DIRECT_CIL'] as RouteId[]).some(id=>{
        const other=alternatives.find(r=>r.route_id===id);
        return other&&other.route_id!==feasible[0].route_id&&other.status==='requires_testwork';
      });
      if(unresolvedCCompetitor){resultLabel='comparative_evidence_missing';leaders=[];}
      else{resultLabel='single_supported_alternative';leaders=[feasible[0].route_id];}
    }
    else{
      difference=(feasible[0].screening_value_USD_per_t??0)-(feasible[1].screening_value_USD_per_t??0);
      if(difference<=num(sc.indifference_band_USD_per_t)+EPS){resultLabel='indifference_zone';leaders=[feasible[0].route_id,feasible[1].route_id];}
      else{resultLabel=ore==='C'&&(!near(grade,num(obs.assays.Au_gpt))||input.heapSiteFeasible!==obs.site.heap_pad_suitable)?'illustrative_what_if_leader':'synthetic_screening_leader';leaders=[feasible[0].route_id];}
    }
  }
  if(gradeOut){resultLabel='no_comparison';leaders=[];}
  let evidenceStatus=gradeOut?'out_of_scope':!input.mineralogyAvailable||!input.testworkAvailable||!feasible.length?'requires_testwork':'synthetic_supported';
  let mode=ore==='C'&&(!near(grade,num(obs.assays.Au_gpt))||input.heapSiteFeasible!==obs.site.heap_pad_suitable)?'what_if_assumption':'synthetic_fixture';
  if(input.lossModel==='constant_residue'&&!gradeOut&&feasible.length){
    mode='contradicted_constant_residue_hypothesis';
    hypotheticalLeaders=leaders;
    leaders=[];
    resultLabel='hypothesis_only_no_qualified_ranking';
    evidenceStatus='requires_independent_variability_testwork';
  }
  const validation:ModelObservation[]=[];
  if(ore==='C'&&input.testworkAvailable){
    for(const [rid,prefix] of [['HEAP_ADR','C_HEAP'],['DIRECT_CIL','C_CIL']] as [RouteId,string][]){
      const center=lookup.get(`${prefix}_08`)!;
      const centerResidue=num(center.products.find(p=>p.name==='residue')?.assay_au_gpt);
      const modelRate=alternatives.find(r=>r.route_id===rid)?.recovery;
      for(const [g,suffix] of [[0.6,'06'],[0.8,'08'],[1.6,'16']] as [number,string][]){
        const record=lookup.get(`${prefix}_${suffix}`)!;
        const observed=num(record.products.find(p=>p.name==='residue')?.assay_au_gpt);
        const predicted=input.lossModel==='constant_residue'?centerResidue:g*(1-(modelRate??0));
        validation.push({route_id:rid,grade_gpt:g,observed_tails_gpt:observed,hypothesis_predicted_tails_gpt:predicted,residual_difference_gpt:observed-predicted,observation_id:record.run_id});
      }
    }
  }
  const testworkPlan=resolveTestwork(data,input,site,lookup,tests,candidates);
  const fingerprintMaterial={engine:'odl-ts-candidate-1',params:{...input,grade},scenario:sc,lab_records:data.runs,rule_registry:data.rules,profiles:data.profiles,literature:data.literature};
  return {inputs:{...input,resolvedGrade:grade},inputFingerprintMaterial:fingerprintMaterial,ruleSetVersion:data.rules.rule_set_version,fixtureVersion:sc.schema_version,mode,evidenceStatus,resultLabel,leaders,hypotheticalLeaders,lossModelEvidence:input.lossModel==='constant_residue'?'hypothesis_conflicts_with_endpoint_tests':'synthetic_observations_with_assumed_interpolation',lossModel:input.lossModel,alternatives,rules:evaluations,candidateInvestigations:candidates,testworkPlan,modelVsObservations:validation,comparisonDifferenceUSDperT:difference,warning:'Fully synthetic. Literature supports investigative mechanisms only. No industrial recovery, equipment or project economics is verified.'};
}

/** Stable deep canonicalization: decimal text 0.8 and 0.80 have identical material. */
export function canonical(value:unknown):unknown{
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)]));
  if(typeof value==='number'&&Number.isFinite(value))return Object.is(value,-0)?'0':String(value);
  if(typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))return String(Number(value));
  return value;
}
export function serializedFingerprintMaterial(material:unknown){return JSON.stringify(canonical(material));}
export async function sha256(material:unknown):Promise<string>{
  const bytes=new TextEncoder().encode(serializedFingerprintMaterial(material));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
