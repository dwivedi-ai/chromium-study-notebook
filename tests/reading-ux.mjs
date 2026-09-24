// Requires a dedicated Chrome instance with remote debugging on port 9227.
// This test clears study data in that browser profile.
import {writeFileSync} from 'node:fs';
const page=(await (await fetch('http://127.0.0.1:9227/json/list')).json()).find(x=>x.type==='page');
const socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let next=0;const waits=new Map(),errors=[];
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const w=waits.get(m.id);waits.delete(m.id);m.error?w.reject(Error(m.error.message)):w.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;waits.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const run=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value;};
async function until(expr){for(let i=0;i<80;i++){if(await run(expr))return;await new Promise(r=>setTimeout(r,75));}throw Error('Timed out: '+expr);}
function check(ok,label){if(!ok)throw Error(label);console.log('PASS',label);}
const url=new URL('../index.html',import.meta.url).href;
await call('Runtime.enable');await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:url+'#/lesson/navigation'});await until("!!document.querySelector('#navigationState')");
await run("localStorage.clear()");await call('Page.reload');await until("!!document.querySelector('#navigationState')");
check(await run("document.querySelectorAll('a a').length===0"),'No nested source links');
await run("document.querySelector('.source-file').click()");await until("!!document.querySelector('.code-line')");
check(await run("location.hash.startsWith('#/source/')"),'Source filename opens snapshot');
await run("document.querySelector('.source-return a').click()");await until("!!document.querySelector('#navigationState')");
check(await run("location.hash.startsWith('#/lesson/navigation')"),'Source returns to chapter');
await run("window.scrollTo({top:650,behavior:'instant'});document.querySelector('[data-nav=navigation]').click()");check(await run("window.scrollY===0"),'Current chapter link returns to its beginning');
for(const stage of ['request','response']){await run(`document.querySelector('[data-state="${stage}"]').click()`);check(await run("document.querySelector('.model-state dd').textContent==='A'"),'A remains committed at '+stage);}
await run("document.querySelector('[data-state=commit]').click()");check(await run("document.querySelector('.model-state dd').textContent==='B'"),'B becomes committed after acknowledgement');
await run("document.querySelector('[data-state=resourceFailure]').click()");check(await run("document.querySelector('.model-state dd').textContent==='B'"),'Subresource failure preserves committed B');
await run("document.querySelector('#searchTrigger').click();document.querySelector('#searchInput').value='The old document';document.querySelector('#searchInput').dispatchEvent(new Event('input'))");
check(await run("!!document.querySelector('.search-result[href*=\"?section=\"]')"),'Search includes passage links');
await run("document.querySelector('.search-result[href*=\"?section=\"]').click()");await until("location.hash.includes('?section=')&&document.querySelector('#searchOverlay').hidden");
await new Promise(r=>setTimeout(r,150));
check(await run("Math.abs(document.getElementById(new URLSearchParams(location.hash.split('?')[1]).get('section')).getBoundingClientRect().top-90)<20"),'Passage link scrolls to matching heading');
await run("document.querySelector('#labPrediction').value='I predict A remains committed.';document.querySelector('#labPrediction').dispatchEvent(new Event('input'));document.querySelector('#notes').value='Observed response before commit.';document.querySelector('#notes').dispatchEvent(new Event('input'));document.querySelector('[data-step]').click();location.hash='#/lesson/ipc'");await until("document.querySelector('.lesson h1')?.textContent.includes('communicate')");
await run("location.hash='#/lesson/navigation'");await until("!!document.querySelector('#navigationState')");
check(await run("document.querySelector('#labPrediction').value==='I predict A remains committed.'&&document.querySelector('#notes').value==='Observed response before commit.'&&document.querySelector('[data-step]').checked"),'Prediction, notes, and lab steps survive navigation');
await run("document.querySelector('#searchTrigger').focus();document.querySelector('#searchTrigger').click()");await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});check(await run("document.querySelector('#searchOverlay').hidden&&document.activeElement.id==='searchTrigger'"),'Escape closes search and restores focus');
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
check(await run("getComputedStyle(document.querySelector('.mobile-contents')).display!=='none'"),'Mobile chapter contents is available');
await run("document.querySelector('.mobile-contents summary').click();document.querySelector('.mobile-contents a').click()");await until("location.hash.includes('?section=')");
await run("document.querySelector('#menuBtn').click()");check(await run("document.querySelector('#menuBtn').getAttribute('aria-expanded')==='true'"),'Mobile menu exposes expanded state');
await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});check(await run("!document.body.classList.contains('menu-open')&&document.activeElement.id==='menuBtn'"),'Escape closes mobile menu and restores focus');
await run("location.hash='#/lesson/navigation?section=navigation-model'");await until("location.hash.includes('navigation-model')");await new Promise(r=>setTimeout(r,150));
check(await run("document.documentElement.scrollWidth<=innerWidth"),'No horizontal overflow on mobile chapter');
await run("location.hash='#/lesson/pixels?section=worked-problem'");await until("!!document.querySelector('.worked-problem')");
await run("document.querySelector('.worked-problem summary').click()");check(await run("document.querySelector('.worked-problem details').open"),'Worked reasoning reveals on request');
await run("document.querySelector('#notes').value='A test observation.';document.querySelector('#notes').dispatchEvent(new Event('input'));window.testMakeURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.testExport=blob;return 'blob:test';};window.testAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(!this.download)window.testAnchorClick.call(this);};document.querySelector('#exportNotes').click()");
check(await run("testExport.text().then(text=>text.includes('A test observation.')&&text.includes('Source revision:'))"),'Export contains notes and source revision');
await run("URL.createObjectURL=window.testMakeURL;HTMLAnchorElement.prototype.click=window.testAnchorClick");
const chapters=await run("[...document.querySelectorAll('[data-nav]')].map(a=>a.dataset.nav)");
for(const id of chapters){await run(`location.hash='#/lesson/${id}'`);await until(`document.querySelector('[data-nav="${id}"]')?.getAttribute('aria-current')==='page'`);check(await run("document.querySelectorAll('.prose-section').length>0&&document.querySelectorAll('a a').length===0&&document.querySelectorAll('.learning-goals li').length===2&&!document.querySelector('main').textContent.includes('undefined')&&document.documentElement.scrollWidth<=innerWidth"),'Chapter content, source links, goals, and width: '+id);}
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await run("location.hash='#/lesson/ipc'");await until("!!document.querySelector('.worked-problem')&&document.querySelector('[data-nav=ipc]').getAttribute('aria-current')==='page'");
await run("window.scrollTo({top:0,behavior:'instant'})");
const desktop=await call('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/chr-ux-desktop.png',Buffer.from(desktop.data,'base64'));
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await run("location.hash='#/lesson/navigation?section=navigation-model'");await until("!!document.querySelector('#navigationState')");await new Promise(r=>setTimeout(r,150));
const shot=await call('Page.captureScreenshot',{format:'png'});writeFileSync('/tmp/chr-ux-mobile.png',Buffer.from(shot.data,'base64'));
check(errors.length===0,'No browser JavaScript errors');socket.close();
