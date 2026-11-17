const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Removing readiness, visibility, activation recovery or deduplication breaks these cases.
function fixture(videos = [], extra = {}) {
  let observerCount = 0, requests = 0, timers = [], callback;
  const document = {
    pictureInPictureEnabled: true, pictureInPictureElement: null,
    querySelectorAll: selector => selector === 'video' ? videos : [],
    addEventListener() {}, documentElement: {},
    exitPictureInPicture: async () => { document.pictureInPictureElement = null; }
  };
  const ctx = vm.createContext({ document, innerWidth: 1920, innerHeight: 1080,
    getComputedStyle: v => ({display: v.hidden ? 'none' : 'block', visibility:'visible', opacity:'1'}),
    MutationObserver: class {constructor(cb) {observerCount++; callback = cb;} observe() {} disconnect() {}},
    setTimeout: cb => {timers.push(cb); return timers.length;}, clearTimeout() {},
    addEventListener() {}, console, ...extra
  });
  for (const v of videos) if (!('requestPictureInPicture' in v)) v.requestPictureInPicture = async () => {requests++; document.pictureInPictureElement = v;};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../extension/player.js'), 'utf8'), ctx);
  return {ctx, document, run: mode => ctx.floatPlayerTask(mode),
    get requests() {return requests;}, get observers() {return observerCount;},
    mutate: async () => {callback([]); for (const cb of timers.splice(0)) cb();}};
}
function video(width=640, height=360, overrides={}) {
  let blocked = true;
  return {readyState:4, videoWidth:width, videoHeight:height, paused:false, ended:false,
    hidden:false, disablePictureInPicture:true,
    getBoundingClientRect:()=>({width,height,top:0,left:0,right:width,bottom:height}),
    hasAttribute:()=>blocked, removeAttribute:()=>{blocked=false;}, ...overrides};
}
test('probe finds largest playing video without modifying the page', async()=>{
  const small=video(), large=video(1280,720); const f=fixture([small,large]);
  const r=await f.run('probe'); assert.equal(r.code,'ready'); assert.equal(r.area,921600);
  assert.equal(large.disablePictureInPicture,true); assert.equal(f.observers,0);
});
test('playing video wins over a larger paused preview', async()=>{
  const f=fixture([video(1280,720,{paused:true}), video()]);
  assert.equal((await f.run('probe')).area,230400);
});
test('hidden videos are excluded', async()=>{
  assert.equal((await fixture([video(1280,720,{hidden:true}),video()]).run('probe')).area,230400);
});
test('empty pages and loading videos have different feedback', async()=>{
  assert.equal((await fixture().run('probe')).code,'no-video');
  assert.equal((await fixture([video(640,360,{readyState:0,videoWidth:0})]).run('probe')).code,'loading');
});
test('activation removes both PiP blockers and opens native PiP', async()=>{
  const v=video(), f=fixture([v]); assert.equal((await f.run('toggle')).code,'opened');
  assert.equal(v.hasAttribute('disablepictureinpicture'),false); assert.equal(v.disablePictureInPicture,false);
  assert.equal(f.requests,1); assert.equal(f.observers,1);
});
test('second activation closes PiP and observers are not duplicated', async()=>{
  const f=fixture([video()]); await f.run('toggle');
  assert.equal((await f.run('toggle')).code,'closed'); await f.run('toggle'); assert.equal(f.observers,1);
});
test('episode replacement is unlocked by activated document observer', async()=>{
  const videos=[video()], f=fixture(videos); await f.run('toggle');
  const next=video(); videos.splice(0,1,next); await f.mutate();
  assert.equal(next.disablePictureInPicture,false); assert.equal(next.hasAttribute(),false);
});
test('Firefox without the standard API gets truthful native guidance', async()=>{
  const v=video(); v.requestPictureInPicture=null;
  const f=fixture([v]); assert.equal((await f.run('toggle')).code,'native-help'); assert.equal(f.requests,0);
});
test('permissions policy restriction is reported without opening a window', async()=>{
  const f=fixture([video()]); f.document.pictureInPictureEnabled=false;
  assert.equal((await f.run('toggle')).code,'policy'); assert.equal(f.requests,0);
});
test('unsupported media produces useful error', async()=>{
  const f=fixture([video(640,360,{requestPictureInPicture:async()=>{throw {name:'NotSupportedError'};}})]);
  assert.equal((await f.run('toggle')).code,'media');
});
test('gesture rejection offers a direct page button', async()=>{
  const f=fixture([video(640,360,{requestPictureInPicture:async()=>{throw {name:'NotAllowedError'};}})]);
  // DOM facade only for rendering a button; browser smoke test checks the real element.
  const element=()=>({style:{}, append(){}, remove(){}, addEventListener(){}, setAttribute(){}, textContent:'',
    attachShadow(){return {append(){}};}});
  f.document.createElement=element; f.document.documentElement.append=()=>{};
  assert.equal((await f.run('toggle')).code,'gesture');
});
test('open shadow roots are searched', async()=>{
  const f=fixture([]), v=video();
  const shadow={querySelectorAll:s=>s==='video'?[v]:[]};
  f.document.querySelectorAll=s=>s==='video'?[]:[{shadowRoot:shadow}];
  assert.equal((await f.run('probe')).code,'ready');
});
test('same-origin child video is found beside an inaccessible iframe', async()=>{
  const f=fixture([]), v=video();
  const child={querySelectorAll:s=>s==='video'?[v]:[]};
  f.document.querySelectorAll=s=>s==='video'?[]:[{tagName:'IFRAME',contentDocument:null},{tagName:'IFRAME',contentDocument:child}];
  assert.equal((await f.run('probe')).code,'ready');
});
test('offscreen same-origin iframe cannot outrank the visible main video', async()=>{
  const visible=video(), hidden=video(1280,720), f=fixture([visible]);
  const child={querySelectorAll:s=>s==='video'?[hidden]:[]};
  const frame={tagName:'IFRAME',contentDocument:child,ownerDocument:f.document,
    getBoundingClientRect:()=>({left:0,top:2000,right:1280,bottom:2720,width:1280,height:720})};
  child.defaultView={innerWidth:1280,innerHeight:720,frameElement:frame,getComputedStyle:f.ctx.getComputedStyle};
  hidden.ownerDocument=child;
  f.document.querySelectorAll=s=>s==='video'?[visible]:[frame];
  assert.equal((await f.run('probe')).area,230400);
});
test('PiP opened in a child document is detected and closed', async()=>{
  const f=fixture([]); let closed=false;
  const child={querySelectorAll:()=>[],pictureInPictureElement:video(),exitPictureInPicture:async()=>{closed=true;}};
  f.document.querySelectorAll=s=>s==='video'?[]:[{tagName:'IFRAME',contentDocument:child}];
  assert.equal((await f.run('probe')).active,true);
  assert.equal((await f.run('toggle')).code,'closed'); assert.equal(closed,true);
});
