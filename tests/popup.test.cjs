const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(executeScript) {
  const ctx=vm.createContext({chrome:{scripting:{executeScript}}, document:{addEventListener(){}}, floatPlayerTask(){}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../extension/popup.js'),'utf8'),ctx);
  return ctx;
}
test('cross-frame selection prioritizes existing PiP then playing video',()=>{
  const c=load();
  const values=[{frameId:0,result:{code:'ready',area:900,playing:false}},
    {frameId:7,result:{code:'ready',area:100,playing:true}}];
  assert.equal(c.pickFrame(values).frameId,7);
  values.push({frameId:4,result:{code:'ready',area:1,active:true}});
  assert.equal(c.pickFrame(values).frameId,4);
});
test('missing frame results are ignored',()=>{
  assert.equal(load().pickFrame([{frameId:3}, {frameId:1,result:{code:'no-video'}}]),null);
});
test('scan injects only top document to preserve access beside cross-origin frames', async()=>{
  const calls=[]; const c=load(async options=>{
    calls.push(options.target); if(options.target.allFrames) throw Error('inaccessible frame');
    return [{frameId:0,result:{code:'ready',area:200}}];
  });
  const r=await c.scanFrames(12); assert.equal(r.frames[0].frameId,0);
  assert.equal(calls.length,1); assert.equal(calls[0].frameIds[0],0);
});
test('restricted-page injection failure reaches the caller', async()=>{
  await assert.rejects(()=>load(async()=>{throw Error('restricted');}).scanFrames(1),/restricted/);
});
