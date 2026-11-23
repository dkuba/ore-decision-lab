import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const json=f=>JSON.parse(readFileSync(join(root,f),'utf-8'));

test('dist contains only intended static artifacts and no oracle, private source or generation code',()=>{
 const manifest=json('dist/build-manifest.json');
 const all=manifest.files.map(x=>x.path);
 for(const required of ['index.html','styles.css','site_config.json','assets/engine.js','assets/main.js','data/scenario_input.json','data/rules.json','data/literature_register.json','protocols/SYN-P01.md','protocols/SYN-P12.md'])assert.ok(all.includes(required),`missing ${required}`);
 assert.ok(!all.some(name=>/oracle|expected\.json|generate_|rebuild_|\.py$|secret|credentials/i.test(name)),`private files detected: ${all}`);
 assert.equal(all.filter(name=>name.startsWith('protocols/SYN-')).length,12);
 for(const f of manifest.files){const bytes=readFileSync(join(root,'dist',f.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,`mismatch ${f.path}`);}
});

test('the publication gate is unconfigured by default',()=>{
 const config=json('public/site_config.json');
 assert.equal(config.operator_name,'');
 assert.equal(config.contact_email,'');
 assert.ok(existsSync(join(root,'scripts/check_publication.py')));
 const workflow=readFileSync(join(root,'.github/workflows/pages.yml'),'utf-8');
 assert.match(workflow,/ODL_PUBLISH_ENABLED/);
});

test('public fixtures do not embed the hidden oracle',()=>{
 const names=readdirSync(join(root,'public','data'));
 assert.ok(!names.some(name=>/oracle|expected/i.test(name)));
 const scenarios=json('public/data/scenario_input.json');
 assert.deepEqual(Object.keys(scenarios.ores),['A','B','C','D']);
 assert.equal(Object.keys(scenarios.routes).length,6);
});
