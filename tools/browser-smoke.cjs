/* Optional browser check: npm install --no-save playwright, then run this file.
 * CHROME_PATH selects an installed Chrome. BROWSER_ARTIFACTS selects screenshots.
 * Tests real native PiP, then uses a browser-API facade to exercise popup UI.
 * This does not substitute for loading the extension from a browser toolbar.
 */
const {chromium} = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname,'..');
(async()=>{
 const browser = await chromium.launch({headless:true,
   ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  console.log('Starting native PiP smoke check');
  await page.setContent('<video muted autoplay width="640" height="360" disablepictureinpicture></video><canvas width="640" height="360"></canvas>');
  await page.evaluate(async()=>{
    const canvas=document.querySelector('canvas'), video=document.querySelector('video');
    const pen=canvas.getContext('2d'); pen.fillStyle='#285444'; pen.fillRect(0,0,640,360);
    video.srcObject=canvas.captureStream(10); await video.play();
  });
  await page.addScriptTag({content:fs.readFileSync(path.join(source,'extension/player.js'),'utf8')});
  assert.equal((await page.evaluate(()=>floatPlayerTask('probe'))).code,'ready');
  await page.evaluate(()=>{
    const button=document.createElement('button'); button.textContent='Native PiP test';
    button.onclick=async()=>{globalThis.outcome=await floatPlayerTask('toggle');}; document.body.append(button);
  });
  await page.getByText('Native PiP test').click();
  await page.waitForFunction(()=>globalThis.outcome);
  assert.equal((await page.evaluate(()=>globalThis.outcome)).code,'opened');
  assert.equal(await page.evaluate(()=>!!document.pictureInPictureElement),true);
  assert.equal((await page.evaluate(()=>floatPlayerTask('toggle'))).code,'closed');
  await page.evaluate(()=>{
    const next=document.createElement('video'); next.setAttribute('disablepictureinpicture','');
    document.querySelector('video').replaceWith(next);
  });
  await page.waitForFunction(()=>!document.querySelector('video').hasAttribute('disablepictureinpicture'));
  console.log('Native PiP and replacement passed');
  // A direct-gesture helper must be a usable, real DOM button.
  await page.evaluate(async()=>{
    const v=document.querySelector('video'), c=document.querySelector('canvas');
    v.srcObject=c.captureStream(10); const ready=v.play(); c.getContext('2d').fillRect(0,0,640,360); await ready;
    v.requestPictureInPicture=()=>Promise.reject(new DOMException('gesture','NotAllowedError'));
    globalThis.gestureResult=await floatPlayerTask('toggle');
  });
  assert.equal((await page.evaluate(()=>globalThis.gestureResult)).code,'gesture');
  await page.getByRole('button',{name:'Open picture-in-picture',exact:true}).click();
  await page.getByRole('button',{name:'Dismiss',exact:true}).click();
  console.log('Gesture helper passed');
  await page.evaluate(async()=>{
    const original=document.querySelector('video'); original.width=300; original.height=150;
    const frame=document.createElement('iframe');
    frame.style.cssText='position:absolute;left:0;top:2000px;width:640px;height:360px;border:0';
    const loaded=new Promise(resolve=>frame.onload=resolve);
    frame.srcdoc='<style>body{margin:0}</style><video muted autoplay width=640 height=360></video>';
    document.body.append(frame); await loaded;
    const v=frame.contentDocument.querySelector('video'), c=document.querySelector('canvas');
    v.srcObject=c.captureStream(10); const ready=v.play(); c.getContext('2d').fillRect(0,0,640,360); await ready;
  });
  assert.equal((await page.evaluate(()=>floatPlayerTask('probe'))).area,45000);
  await page.evaluate(()=>{
    document.querySelector('iframe').style.top='0'; document.querySelector('video').style.display='none';
    globalThis.outcome=null;
  });
  assert.equal((await page.evaluate(()=>floatPlayerTask('probe'))).area,230400);
  await page.getByText('Native PiP test').click();
  await page.waitForFunction(()=>globalThis.outcome);
  assert.equal((await page.evaluate(()=>globalThis.outcome)).code,'opened');
  assert.equal((await page.evaluate(()=>floatPlayerTask('toggle'))).code,'closed');
  console.log('Real same-origin iframe visibility and PiP passed');
  // The UI facade checks DOM wiring; extension permission behavior remains manual.
  const ui=await browser.newPage({viewport:{width:360,height:620},colorScheme:'light'});
  ui.on('pageerror',e=>errors.push(e.message));
  await ui.addInitScript(()=>{
    globalThis.chrome={tabs:{query:async()=>[{id:1,url:'https://example.com/video'}]},
      scripting:{executeScript:async options=>[{frameId:0,result: options.args[0]==='probe' ?
        {code:'ready',area:230400,playing:true} : {code:'opened'}}]}};
  });
  await ui.goto('file://'+path.join(source,'extension/popup.html'));
  await ui.getByRole('heading',{name:'Ready when you are.'}).waitFor();
  assert.equal(await ui.locator('body').evaluate(e=>e.scrollWidth),360);
  if(process.env.BROWSER_ARTIFACTS){
    fs.mkdirSync(process.env.BROWSER_ARTIFACTS,{recursive:true});
    await ui.screenshot({path:path.join(process.env.BROWSER_ARTIFACTS,'popup-preview.png'),fullPage:true});
  }
  await ui.getByRole('button',{name:'Open picture-in-picture',exact:true}).click();
  await ui.getByRole('heading',{name:'Your video is floating.'}).waitFor();
  await ui.emulateMedia({colorScheme:'dark'});
  if(process.env.BROWSER_ARTIFACTS) await ui.screenshot({path:path.join(process.env.BROWSER_ARTIFACTS,'popup-dark-preview.png'),fullPage:true});
  await ui.goto('file://'+path.join(source,'extension/help.html'));
  assert.equal(await ui.title(),'Float PiP — Help and privacy');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:await browser.version(),nativePip:'passed',replacement:'passed',gestureUI:'passed',iframePip:'passed',popupFacade:'passed',errors},null,2));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
