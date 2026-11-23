import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {evaluate,inspectRun,parseNumber,canonical,serializedFingerprintMaterial,sha256} from '../dist/assets/engine.js';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const json=p=>JSON.parse(readFileSync(join(root,p),'utf-8'));
const data={scenario:json('public/data/scenario_input.json'),runs:json('public/data/measured_laboratory_products.json'),rules:json('public/data/rules.json'),profiles:json('public/data/lab_sample_profiles.json'),literature:json('public/data/literature_register.json')};
const defaults={ore:'C',lossModel:'constant_recovery',mineralogyAvailable:true,testworkAvailable:true,heapSiteFeasible:true};
const run=(overrides={})=>evaluate(data,{...defaults,...overrides});
const supported=(e,id)=>e.alternatives.find(x=>x.route_id===id);

test('all 14 PUBLIC, independently generated Python control vectors have parity',()=>{
 const vectors=json('tests/public_vectors.json');
 assert.equal(vectors.length,14);
 for(const v of vectors){
  const e=run({grade:v.grade_gpt,lossModel:v.model});
  assert.deepEqual(e.leaders,v.leaders,`${v.model}@${v.grade_gpt} leaders`);
  assert.deepEqual(e.hypotheticalLeaders,v.hypothetical_leaders,`${v.model}@${v.grade_gpt} hypothetical`);
  assert.equal(e.resultLabel,v.result_label,`${v.model}@${v.grade_gpt} label`);
  assert.equal(e.evidenceStatus,v.evidence_status,`${v.model}@${v.grade_gpt} evidence`);
  for(const [id,expected] of Object.entries(v.scores)){
   const actual=supported(e,id).screening_value_USD_per_t;
   assert.ok(Math.abs(actual-Number(expected))<0.011,`${v.model}@${v.grade_gpt} ${id}: ${actual} ≠ ${expected}`);
  }
 }
});

test('A–D baseline routes match synthetic reference calculations',()=>{
 const expected={A:['DIRECT_CIL',.908226],B:['FLOT_POX_CIL',.818164],C:['HEAP_ADR',.760694],D:['GRAVITY_TAILS_CIL',.878392]};
 for(const [ore,[rid,r]] of Object.entries(expected)){
  const e=run({ore,grade:undefined});
  assert.equal(e.leaders[0],rid);
  assert.ok(Math.abs(supported(e,rid).recovery-r)<.0000015,`${ore}: incorrect recovery`);
 }
});

test('a different ore does not automatically change historical laboratory measurements',()=>{
 for(const ore of ['A','D']){
  const e=run({ore,grade:undefined,mineralogyAvailable:false});
  assert.equal(e.rules.filter(x=>x.status==='triggered').length,0);
  assert.equal(e.resultLabel,'provisional_calculation_only');
  assert.equal(e.leaders.length,0);
  assert.ok(supported(e,'DIRECT_CIL').recovery>0);
 }
});

test('missing testwork prevents all numeric routes',()=>{
 const e=run({testworkAvailable:false});
 assert.equal(e.leaders.length,0);
 assert.equal(e.alternatives.filter(x=>x.status==='synthetic_supported').length,0);
});

test('heap site feasibility toggles route without fabricating a recovery change',()=>{
 const good=run(),bad=run({heapSiteFeasible:false});
 assert.equal(good.leaders[0],'HEAP_ADR');
 assert.equal(supported(bad,'HEAP_ADR').status,'blocked_constraint');
 assert.equal(bad.leaders[0],'DIRECT_CIL');
 assert.equal(supported(bad,'DIRECT_CIL').recovery,supported(good,'DIRECT_CIL').recovery);
});

test('grade outside tested domain is out_of_scope',()=>{
 const e=run({grade:'1,85'});
 assert.equal(e.resultLabel,'no_comparison');
 assert.equal(e.evidenceStatus,'out_of_scope');
 assert.equal(e.leaders.length,0);
 assert.equal(supported(e,'HEAP_ADR').status,'out_of_scope');
});

test('constant-residue yields no qualified leader and disagrees with endpoint residues',()=>{
 const e=run({grade:'1.4',lossModel:'constant_residue'});
 assert.equal(e.leaders.length,0);
 assert.deepEqual(e.hypotheticalLeaders,['HEAP_ADR']);
 assert.equal(e.resultLabel,'hypothesis_only_no_qualified_ranking');
 assert.ok(e.modelVsObservations.some(x=>Math.abs(x.residual_difference_gpt)>.01));
});

test('indifference zone avoids floating-point winner on near parity',()=>{
 const e=run({grade:'1.28'});
 assert.equal(e.resultLabel,'indifference_zone');
 assert.equal(e.leaders.length,2);
});

test('stage splits use independent product assays and rejected repeat is excluded',()=>{
 const grav=run({ore:'D',grade:undefined});
 const split=supported(grav,'GRAVITY_TAILS_CIL').source_traces[0];
 const direct=split.feed_au_g,calculated=split.calculated_head_au_g;
 assert.ok(Math.abs(direct-calculated)>.001);
 assert.ok(split.stage_recovery_fraction<.48);
 const c=run({grade:'0.8'});
 assert.ok(supported(c,'DIRECT_CIL').excluded_lab_repeats.some(x=>x.run_id==='C_CIL_BAD_REPEAT'));
 assert.equal(inspectRun(data.runs.find(r=>r.run_id==='C_CIL_BAD_REPEAT'),.05).quality_status,'suspect');
});

test('rules propose different investigative studies from A–D while avoiding unsupported POX for A',()=>{
 const a=run({ore:'A',grade:undefined}),b=run({ore:'B',grade:undefined}),c=run(),d=run({ore:'D',grade:undefined});
 assert.ok(a.candidateInvestigations.some(x=>x.route_id==='GRAVITY_TAILS_CIL'));
 assert.ok(b.candidateInvestigations.some(x=>x.route_id==='FLOT_POX_CIL'));
 assert.ok(c.candidateInvestigations.some(x=>x.route_id==='HEAP_ADR'));
 assert.ok(d.candidateInvestigations.some(x=>x.route_id==='GRAVITY_TAILS_CIL'));
 assert.ok(!a.candidateInvestigations.some(x=>x.route_id==='FLOT_POX_CIL'));
});

test('testwork four states keep existing experiments separate from hypothetical missing tests',()=>{
 const b=run({ore:'B',grade:undefined});
 assert.ok(b.testworkPlan.some(x=>x.status==='available'&&x.test_id==='flotation_split'));
 assert.ok(b.testworkPlan.some(x=>x.status==='needed'&&x.test_id==='concentrate_direct_cil_control'));
 assert.ok(b.testworkPlan.some(x=>x.status==='not_indicated'));
 const c=run({heapSiteFeasible:false});
 assert.ok(c.testworkPlan.some(x=>x.status==='blocked_constraint'));
});

test('number parsing accepts decimal commas but rejects booleans, mixed separators and nonsense',()=>{
 assert.equal(parseNumber('1,2'),1.2);
 assert.equal(parseNumber('0.80'),.8);
 for(const bad of ['abc','1,2.3',true,null,NaN,Infinity])assert.throws(()=>parseNumber(bad));
});

test('canonical serialization is stable for equivalent decimal formatting',async()=>{
 assert.deepEqual(canonical({p:'0.80',nested:{k:'1.200'}}),canonical({nested:{k:'1.2'},p:'0.8'}));
 const a=run({grade:'0.80'}),b=run({grade:'0.8'});
 assert.equal(serializedFingerprintMaterial(a.inputFingerprintMaterial),serializedFingerprintMaterial(b.inputFingerprintMaterial));
 assert.equal(await sha256(a.inputFingerprintMaterial),await sha256(b.inputFingerprintMaterial));
});

test('fingerprint includes rule and cost modifications',async()=>{
 const a=await sha256(run().inputFingerprintMaterial);
 const other=structuredClone(data);other.scenario.costs_USD_per_t_feed.C.HEAP_ADR='26';
 const b=await sha256(evaluate(other,defaults).inputFingerprintMaterial);
 assert.notEqual(a,b);
});

test('failed lab hydraulic screening blocks heap, even when site flag is true',()=>{
 const clone=structuredClone(data);
 clone.scenario.lab_observations.C.scoping_infiltration_screen_pass.measured_value='2.0';
 const evaluated=evaluate(clone,defaults);
 assert.equal(supported(evaluated,'HEAP_ADR').status,'blocked_constraint');
 assert.equal(evaluated.leaders[0],'DIRECT_CIL');
});

test('rejected central C laboratory node does not silently bridge gap or rank surviving route',()=>{
 const clone=structuredClone(data);
 const middle=clone.runs.find(x=>x.run_id==='C_HEAP_08');
 middle.products.find(x=>x.name==='residue').assay_au_gpt='0.6';
 const evaluated=evaluate(clone,{...defaults,grade:'1.2'});
 assert.equal(supported(evaluated,'HEAP_ADR').status,'requires_testwork');
 assert.equal(supported(evaluated,'DIRECT_CIL').status,'synthetic_supported');
 assert.equal(evaluated.resultLabel,'comparative_evidence_missing');
 assert.deepEqual(evaluated.leaders,[]);
});

test('changing a measured product or a cost invalidates fingerprint',async()=>{
 const baseline=await sha256(run().inputFingerprintMaterial);
 const price=structuredClone(data);
 price.scenario.gold_price_USD_per_g='101';
 assert.notEqual(baseline,await sha256(evaluate(price,defaults).inputFingerprintMaterial));
 const measured=structuredClone(data);
 measured.runs.find(x=>x.run_id==='C_CIL_08').products.find(x=>x.name==='residue').assay_au_gpt='0.082';
 assert.notEqual(baseline,await sha256(evaluate(measured,defaults).inputFingerprintMaterial));
});

test('gravity stream mass balance includes concentrate finishing and tails CIL',()=>{
 const e=run({ore:'D',grade:undefined});
 const rec=supported(e,'GRAVITY_TAILS_CIL');
 const rates=rec.source_traces.map(x=>x.stage_recovery_fraction);
 const correct=rates[0]*rates[1]+(1-rates[0])*rates[2];
 assert.ok(Math.abs(rec.recovery-correct)<1e-12);
 assert.ok(Math.abs(rec.recovery-rates[0]*rates[1])>.3);
});

test('contradicted hypothesis without testwork is no-comparison, not a supported model',()=>{
 const e=run({lossModel:'constant_residue',testworkAvailable:false});
 assert.equal(e.leaders.length,0);
 assert.equal(e.hypotheticalLeaders.length,0);
 assert.equal(e.resultLabel,'no_comparison');
 assert.equal(e.evidenceStatus,'requires_testwork');
});
