import { lessons, revision } from './data.js';
import { deepSections } from './deep.js';
import { advancedSections } from './advanced.js';
import { workshops } from './workshops.js';
import { coverage } from './coverage.js';
import { blinkComplete } from './blink-complete.js';
import { depsComplete } from './deps-complete.js';
import { ciComplete } from './ci-complete.js';
import { graphComplete } from './graph-complete.js';
import { outline, additions } from './outline.js';
import { glossary } from './glossary.js';
import { connections } from './connections.js';
import { navigationLab, wireNavigationLab } from './navigation-lab.js';
import { outcomes, reviewProblems } from './study-guide.js';
import { withFigures } from './figures.js';

const app = document.querySelector('#app');
const byId = Object.fromEntries(lessons.map(l => [l.id,l]));
const groups = [...new Set(lessons.map(l => l.part))];
const completedKey = 'chr-study-completed-v1';
const noteKey = id => `chr-study-note-${id}`;
let currentRoute = '';
let searchReturnFocus = null;
let sectionObserver;
const readingPositions = new Map();
function stored(key, fallback=''){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
function persist(key,value){try{localStorage.setItem(key,value);return true;}catch{return false;}}
function sectionId(title){return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function sectionUrl(id,title){return `${lessonUrl(id)}?section=${sectionId(title)}`;}
function routeParams(){return new URLSearchParams(location.hash.split('?')[1]||'');}
function contents(lesson,sections){return sections.map(([title])=>`<a href="${sectionUrl(lesson.id,title)}" data-section="${sectionId(title)}">${esc(title)}</a>`).join('');}
function extraContents(lesson){return `${['navigation','journey'].includes(lesson.id)?`<a href="${lessonUrl(lesson.id)}?section=navigation-model">Try the navigation model</a>`:''}${reviewProblems[lesson.id]?`<a href="${lessonUrl(lesson.id)}?section=worked-problem">Worked reasoning problem</a>`:''}`;}
function connectionContents(lesson){return connections.some(([a,b])=>a===lesson.id||b===lesson.id)?`<a href="${lessonUrl(lesson.id)}?section=connections">Connections to other chapters</a>`:'';}
function workedProblem(id){const p=reviewProblems[id];return p?`<section class="worked-problem" id="worked-problem"><div class="tiny-label">REASON THROUGH A CASE</div><h2>${esc(p.title)}</h2><p>${esc(p.problem)}</p><p class="problem-instruction">Write a short answer before opening the reasoning. Name an observation that would change your answer.</p><details><summary>Show worked reasoning</summary><p>${esc(p.answer)}</p><h3>A way to check it</h3><p>${esc(p.experiment)}</p></details></section>`:'';}
function relatedChapters(lesson){const rows=connections.filter(([a,b])=>a===lesson.id||b===lesson.id);return rows.length?`<section class="chapter-connections" id="connections"><h2>Connect this to the rest of the system</h2>${rows.map(([a,b,title,reason])=>{const other=byId[a===lesson.id?b:a];return `<div><h3>${esc(title)}</h3><p>${esc(reason)}</p><a href="${lessonUrl(other.id)}">${esc(other.title)} →</a></div>`;}).join('')}</section>`:'';}


function sectionsFor(lesson){
  const all=[...lesson.sections,...(deepSections[lesson.id]||[]),...(advancedSections[lesson.id]||[]),...(workshops[lesson.id]||[]),...(blinkComplete[lesson.id]||[]),...(depsComplete[lesson.id]||[]),...(ciComplete[lesson.id]||[]),...(graphComplete[lesson.id]||[])];
  if(!outline[lesson.id])return withFigures(lesson,all);
  const byTitle=new Map(all.map(section=>[section[0],section]));
  const before=new Map((additions[lesson.id]||[]).map(([anchor,...titles])=>[anchor,titles]));
  const ordered=outline[lesson.id].flatMap(title=>[...(before.get(title)||[]),title]);
  if(ordered.length!==all.length||ordered.some(title=>!byTitle.has(title)))throw Error(`Incomplete chapter outline: ${lesson.id}`);
  return withFigures(lesson,ordered.map(title=>byTitle.get(title)));
}

// Estimates cover the chapter text, including expandable explanations and exercise
// instructions. Doing a source exercise is separate and varies by reader and setup.
const readingRate=238; // Average adult silent English nonfiction, Brysbaert (2019).
const readingTimeCache=new Map();
function readingMinutes(lesson){
  if(readingTimeCache.has(lesson.id))return readingTimeCache.get(lesson.id);
  const lab=lesson.lab;
  const problem=reviewProblems[lesson.id];
  const fragments=[
    lesson.title,lesson.deck,lesson.lead,...lesson.flow,...(outcomes[lesson.id]||[]),
    ...sectionsFor(lesson).flat(),...(lesson.quiz||[]),...(midChecks[lesson.id]||[]),
    ...(misconceptions[lesson.id]||[]),principles[lesson.id],
    ...(problem?[problem.title,problem.problem,problem.answer,problem.experiment]:[]),
    lab.title,lab.aim,lab.prediction,...lab.steps,lab.observation,lab.conclusion,lab.follow,
    ...lesson.files.map(file=>file.why),
    ...connections.filter(([a,b])=>a===lesson.id||b===lesson.id).flatMap(([, ,title,reason])=>[title,reason]),
    ...(['navigation','journey'].includes(lesson.id)?[navigationLab()]:[])
  ];
  const container=document.createElement('div');
  const words=fragments.reduce((count,fragment)=>{
    container.innerHTML=String(fragment||'');
    container.querySelectorAll('svg title,svg desc').forEach(node=>node.remove());
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
    const text=[];while(walker.nextNode())text.push(walker.currentNode.textContent);
    return count+(text.join(' ').match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length;
  },0);
  const minutes=Math.max(1,Math.ceil(words/readingRate));
  readingTimeCache.set(lesson.id,minutes);
  return minutes;
}

const principles = {
  evidence:'Source reading is an exercise in evidence: documentation describes intent, code shows implementation, tests state expectations, and runtime observations show one execution.',
  checkout:'A reproducible build needs all of its inputs, including dependencies, generated files, host settings, and compiler configuration.',
  rolls:'A dependency update is an integration change across repositories; a pin and every representation of it must agree.',
  remote:'A remote build is correct only when every action declares its full input set and execution environment.',
  owners:'Process isolation is an operating-system boundary. It limits what untrusted page code can access and contains some kinds of failure.',
  startup:'Initialization order and process role determine which services and privileges are available at each point in execution.',
  ipc:'A typed RPC is still a protocol: ownership, authorization, ordering, and disconnection determine its actual behavior.',
  security:'A strong boundary assumes a less privileged participant can send any syntactically valid request and validates authority on the privileged side.',
  network:'The same request interface can produce data from network, cache, workers, or internal pages; the selected source and response policy are part of the result.',
  storage:'Reachability, document activity, origin authority, and disk durability are different properties of state.',
  diagnostics:'A causal performance claim needs a prediction, a controlled comparison, and measurements of the stage that could cause the symptom.',
  journey:'An end-to-end system model is a chain of state transitions, each with an owner, observable evidence, and a possible failure.',
  navigation:'Navigation has explicit states. Code must distinguish a requested change from one that has committed, much as it does in other stateful systems.',
  parsing:'Generated tables move repeated name work to build time; reentrant author code still constrains runtime parsing.',
  time:'Asynchronous code has a causal order even when no single call stack shows the whole operation.',
  pixels:'A staged graphics pipeline can reuse unchanged results and prepare a new frame while an older frame remains visible.',
  bindings:'Generated bindings connect two programming languages while enforcing type conversion and API exposure rules.',
  lifetime:'Garbage collection answers whether an object remains reachable. Lifecycle checks answer whether using it still makes sense.',
  features:'A feature passes through compilation, runtime state, context, tests, and rollout; each stage answers a different question.',
  graphs:'A dependency graph represents a partial order: operations may move only when value, control, and effect constraints allow it.',
  factory:'CI is a distributed system. Its configuration and its recorded executions are both needed to explain a result.',
  release:'Shipping requires evidence across source branches, builds, configuration, and rollout.',
  independent:'A source investigation becomes useful when another engineer can follow its paths, check its observations, and see its unanswered questions.'
};
const misconceptions = {
  startup:['Creating a process host means its child is ready.','Browser-side management state can exist before a renderer completes launch and initialization. Find the readiness transition.'],
  ipc:['A typed Mojo message is automatically trusted.','Generated serialization enforces shape, while the browser must separately validate authority and lifecycle.'],
  security:['The sandbox makes renderer messages safe.','A sandbox limits OS access; browser-side receivers must still validate what a renderer may ask them to do.'],
  network:['A successful navigation means every resource loaded.','Navigation commit and later subresource loads have separate results, owners, and failures.'],
  storage:['Returning with Back always rebuilds the page.','BFCache may retain a paused document and JavaScript context; inspect lifecycle evidence.'],
  journey:['A committed document is already fully visible.','Commit establishes the new document; loading, style, paint, raster, and display may still be pending.'],
  diagnostics:['A long trace span means a thread was busy for its whole duration.','A logical span can include queueing and waiting; inspect thread slices and profiles.'],
  owners:['A browser tab is a process.','A visible page may span several renderer processes, and process placement changes over time. Model frames and sites separately.'],
  rolls:['A dependency roll is a one-line version bump.','A roll can also update a Git gitlink and must pass integration tests against Chromium.'],
  remote:['Remote execution is just running the same command on another machine.','The worker also needs a complete, content-addressed input tree, toolchain, and platform description.'],
  navigation:['The URL in the address bar is the current document’s security identity.','Visible, pending, and last-committed URLs serve different purposes. Use committed origin for current-document authority.'],
  parsing:['HTML parsing just allocates elements from tokens.','Tree-building follows insertion modes, and custom element construction can synchronously run author code.'],
  time:['A callback is part of the stack that scheduled it.','Posting and running are separate events; a task hop may cross a queue, sequence, or process.'],
  pixels:['The DOM is what gets drawn.','The DOM is transformed through style, layout, paint, compositor state, raster, and final draw.'],
  bindings:['Finding a matching C++ method proves a web API is exposed.','IDL, bindings, context, feature flags, and tests determine exposure and behavior.'],
  lifetime:['Garbage collection makes asynchronous pointers safe.','Tracing, rooting, cancellation, sequence, and semantic lifetime all need separate arguments.'],
  features:['The C++ implementation exists, so the API is available to pages.','IDL exposure, feature state, context, and rollout all affect availability.'],
  graphs:['Sea of Nodes means operations can run in any order.','Value, control, and effect edges encode the order that semantics require.'],
  factory:['A green tryjob proves the submitted commit is identical.','Patch base, checkout materialization, builder config, selection, and post-submit conditions may differ.'],
  release:['Landing on main means the fix has shipped.','A release branch needs its own merge, build, and rollout evidence.']
};

const midChecks = {
  evidence:['A test passes for a fake service. Does that establish the real service’s behavior?', 'It establishes behavior under the fake and test setup. Check an integration test or a real run for claims about the actual service.'],
  checkout:['A DEPS condition excludes a package on Linux. Should a Linux bot download it during sync?', 'Not for that evaluated dependency graph. Check the condition inputs and bot configuration before generalizing.'],
  rolls:['DEPS points to V8 commit B but the Git gitlink points to A. What should you investigate first?', 'Check whether sync or a roll left the two representations inconsistent before debugging V8 source.'],
  remote:['The .cc file is unchanged but an included header changed. Can the old object file be reused?', 'Only if the change is irrelevant under a proven dependency model. Normally the header digest changes the action identity and triggers recompilation.'],
  startup:['A renderer is launched with a process type. Has it necessarily accepted a document?', 'No. Process launch, renderer initialization, and document commit are separate transitions.'],
  ipc:['A Remote sends a request and its peer closes before replying. What does the caller observe?', 'That depends on callback and disconnect handling. Read the owner and test rather than assuming a successful reply.'],
  security:['A renderer sends a valid origin string. Which origin should authorize storage?', 'Use browser-known committed origin or validate the claim against it. Valid syntax does not establish authority.'],
  network:['A 204 response arrives for a navigation. Does it replace the current document?', 'No. The navigation documentation says 204/205 have no new document content, so the old document remains active.'],
  storage:['A page object remains in memory after navigation. Can its old callback act on the new page?', 'Reachability is insufficient. Check lifecycle state, origin authority, and whether the work was cancelled or frozen.'],
  journey:['The address bar changed while old pixels remain. Which state is authoritative?', 'Check whether the new navigation is merely pending or has committed; then locate visual work in the renderer and compositor.'],
  diagnostics:['A renderer OOM stack points to V8 allocation. Does that prove V8 leaked?', 'No. The failing allocation can be the victim of pressure elsewhere. Compare memory history and the exact OOM mode.'],
  owners:['An iframe is cross-site. Which process owns its DOM?', 'The renderer hosting that iframe owns its DOM. The parent may hold a remote-frame proxy; the browser keeps frame relationships.'],
  navigation:['The address bar shows B while A is still visible. Which document is current?', 'A remains the committed document until B commits. Visible URL and document origin answer different questions.'],
  parsing:['A custom element constructor runs during parsing. What can it invalidate?', 'It can mutate document and parser-visible state before tree construction resumes. Look for reentrancy protection at the construction site.'],
  time:['Input is queued behind a running 200 ms script task. Can queue priority interrupt the script?', 'Ordinary main-thread tasks are not preempted mid-callback. Priority affects which queued task runs next.'],
  pixels:['Only an element’s color changes. Which earliest rendering stage must change?', 'Computed style changes. Layout may remain valid if geometry is unaffected; paint output must change.'],
  bindings:['The C++ implementation exists, but the API is absent in one execution world. Where do you look?', 'Inspect IDL exposure, generated installer conditions, runtime feature state, and the world/context.'],
  lifetime:['A Persistent root keeps an object alive after navigation. Is the callback correct to use it?', 'Reachability is established. Document and operation validity remain separate; check teardown and cancellation.'],
  features:['A web test passes with an experimental flag. Is the API on for stable users?', 'No. The test proves behavior under that flag and context; inspect stable status and rollout separately.'],
  graphs:['Two pure calculations have no edge between them. What may the scheduler do?', 'It may place them in either order if their value and control dependencies are satisfied.'],
  factory:['A test fails only with the patch on one shard and passes once on retry. What can you conclude?', 'The evidence is mixed. Compare base and patched runs, retry history, shard environment, and test records.'],
  release:['A fix is on main after the branch cut. Which further evidence establishes stable inclusion?', 'Find the branch merge, build revision, and rollout for the target version.'],
  independent:['Your trace supports a call path but a source file is absent locally. How should the note state it?', 'State the observation, cite the path and revision, and mark the implementation step unverified until inspected.']
};

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function doneSet(){try{return new Set(JSON.parse(localStorage.getItem(completedKey)||'[]'));}catch{return new Set();}}
function saveDone(set){return persist(completedKey,JSON.stringify([...set]));}
function route(){let h=location.hash.split('?')[0].replace(/^#\/?/,'');if(!h)return ['home'];let [kind,id]=h.split('/');return [kind,id];}
function lessonUrl(id){return `#/lesson/${id}`;}
function localSourceUrl(f){const [kind,id]=route();return `#/source/${f.repo}/${f.path}${kind==='lesson'?'?from='+id+'&back='+encodeURIComponent(location.hash):''}`;}
function sourceUrl(f){if(f.repo==='depot')return `https://chromium.googlesource.com/chromium/tools/depot_tools/+/0306e4682b4ac35287c726fa35a983157a625902/${f.path}`;if(f.repo==='v8')return `https://chromium.googlesource.com/v8/v8/+/315d9c945ac3b1612c3690fbe69e48acce263bed/${f.path}`;return `https://chromium.googlesource.com/chromium/src/+/${revision}/${f.path}`;}
function nav(){let done=doneSet();return `<aside class="sidebar"><a class="brand" href="#/"><img class="brand-logo" src="assets/chromium-logo.png" width="38" height="38" alt="Chromium logo"><strong>Chromium Study</strong></a><div class="sidebar-scroll"><div class="nav-heading">THE BOOK</div><a class="nav-top" href="#/">Overview</a><a class="nav-top" href="#/map">Architecture map</a>${groups.map(g=>`<div class="nav-group"><div class="nav-heading">${esc(g)}</div>${lessons.filter(l=>l.part===g).map(l=>`<a class="nav-lesson" data-nav="${l.id}" href="${lessonUrl(l.id)}"><span class="nav-num">${l.n}</span><span>${esc(l.title)}</span>${done.has(l.id)?'<span class="done-dot" aria-label="Completed"></span>':''}</a>`).join('')}</div>`).join('')}<div class="nav-group"><div class="nav-heading">REFERENCE</div><a class="nav-top" href="#/fieldguide">Source reading guide</a><a class="nav-top" href="#/glossary">Glossary</a><a class="nav-top" href="#/library">Source and scope</a><a class="nav-top" href="#/coverage">Material coverage</a><a class="nav-top" href="#/evidence">Evidence index</a></div></div><div class="sidebar-bottom"><div class="progress-head"><span>Study progress</span><strong>${done.size} / ${lessons.length}</strong></div><div class="progress-track"><span style="width:${100*done.size/lessons.length}%"></span></div><small>Saved in this browser</small></div></aside>`;}
function shell(content,active){
  app.innerHTML=`<a class="skip-link" href="#main">Skip to content</a><div class="shell">${nav()}<div class="main-column"><header class="topbar"><button class="menu-btn" id="menuBtn" aria-label="Open navigation" aria-expanded="false" aria-controls="bookSidebar">☰</button><span class="topbar-context">Chromium architecture and engineering</span><button class="search-trigger" id="searchTrigger"><span aria-hidden="true">⌕</span> Search <kbd>/</kbd></button></header><main id="main" tabindex="-1">${content}</main></div><div class="mobile-backdrop" id="backdrop"></div></div><div id="searchOverlay" class="search-overlay" hidden></div>`;
  const sidebar=document.querySelector('.sidebar');sidebar.id='bookSidebar';
  const selected=document.querySelector(`[data-nav="${active}"]`)||[...document.querySelectorAll('.nav-top')].find(a=>a.getAttribute('href')===location.hash.split('?')[0]);
  if(selected){selected.classList.add('active');selected.setAttribute('aria-current','page');const scroll=document.querySelector('.sidebar-scroll');scroll.scrollTop=Math.max(0,selected.offsetTop-scroll.offsetTop-scroll.clientHeight/2);}
  const menu=document.querySelector('#menuBtn');const closeMenu=()=>{document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');};
  menu.onclick=()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));if(open)sidebar.querySelector('[aria-current]')?.focus();};
  document.querySelector('#backdrop').onclick=closeMenu;
  sidebar.addEventListener('keydown',e=>{if(e.key==='Tab'&&document.body.classList.contains('menu-open')){const links=[...sidebar.querySelectorAll('a')];if(e.shiftKey&&document.activeElement===links[0]){links.at(-1).focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===links.at(-1)){links[0].focus();e.preventDefault();}}});
  document.querySelector('#searchTrigger').onclick=openSearch;
  document.querySelectorAll('.sidebar a').forEach(a=>a.addEventListener('click',closeMenu));
  document.querySelector('.skip-link').onclick=e=>{e.preventDefault();document.querySelector('#main').focus();document.querySelector('#main').scrollIntoView();};
}
function flow(nodes,caption){return `<figure class="flow-figure"><div class="flow-nodes">${nodes.map((n,i)=>`<div class="flow-node"><span class="flow-index">${String(i+1).padStart(2,'0')}</span><span>${esc(n)}</span></div>${i<nodes.length-1?'<span class="flow-arrow" aria-hidden="true">→</span>':''}`).join('')}</div><figcaption>${esc(caption)}</figcaption></figure>`;}
function home(){
  const done=doneSet();
  const last=stored('chr-study-last-read');
  const resume=last.startsWith('#/lesson/')&&byId[last.split('/')[2]?.split('?')[0]]?last:null;
  const next=resume||lessonUrl(done.size?lessons.find(l=>!done.has(l.id))?.id||'independent':'evidence');
  return `<div class="home page">
    <div class="eyebrow">CHROMIUM STUDY</div>
    <h1>How Chromium’s<br><em>systems work together.</em></h1>
    <p class="hero-deck">A practical book about Chromium’s architecture and the source code behind it. Study how a large system is divided into parts, how those parts cooperate, and how to verify your understanding in code.</p>
    <div class="hero-actions"><a class="button primary" href="${next}">${resume||done.size?'Continue studying':'Start chapter 1'} <span>↗</span></a><a class="text-link" href="#/map">View the architecture map →</a></div>
    <div class="home-rule"></div>
    <section class="home-intro" id="expectations" aria-labelledby="expectations-title">
      <div><div class="eyebrow">WHAT TO EXPECT</div><h2 id="expectations-title">See how the pieces<br>fit together.</h2></div>
      <div>
        <p>Chromium is made of systems that solve different problems: source and builds, process isolation, communication, navigation, networking, Blink and V8, rendering, state, testing, and release. Studying them together reveals why each boundary exists, what crosses it, and what must remain true as work moves through the system. The <a href="#/map">architecture map</a> shows these connections.</p>
        <p>A single action can pass through many owners, threads, and processes. You will trace those paths in real source, ask what each layer knows and guarantees, and use tests or runtime observations to check your model. This is where the design of a complex system becomes visible.</p>
        <p>The chapters begin with guided explanations and exercises, then ask you to investigate more independently. By the end, you should be able to enter an unfamiliar subsystem, identify its responsibilities and interfaces, and reason about a change from evidence you found yourself.</p>
      </div>
    </section>
    <section class="home-intro" id="why-chromium" aria-labelledby="why-chromium-title">
      <div><div class="eyebrow">WHY CHROMIUM?</div><h2 id="why-chromium-title">One browser.<br>Many engineering problems.</h2></div>
      <div>
        <p>Even a simple page load crosses process boundaries, security checks, network requests, parsing, script execution, scheduling, and graphics. Chromium gives you a real system in which to see how those concerns meet, and how a decision in one part changes behavior elsewhere.</p>
        <p>Its source, design documents, and tests let you move between an architectural idea and an implementation you can inspect. That makes it a useful place to practice the transferable skill this book emphasizes: build a precise model, find the evidence, and revise the model when the code or runtime disagrees.</p>
      </div>
    </section>
    <section class="home-intro" aria-labelledby="how-to-use-title">
      <div><div class="eyebrow">HOW TO USE THIS BOOK</div><h2 id="how-to-use-title">Read the explanation.<br>Then inspect the code.</h2></div>
      <div>
        <p>Each chapter explains a Chromium component in plain language, shows how it fits into the browser, and points to the source files that implement it. A short question and source exercise help you check the explanation.</p>
        <p>The final chapter shows how to investigate a new subsystem on your own.</p>
      </div>
    </section>
    <div class="section-label"><span>CHAPTERS</span><span>${lessons.length} chapters · about ${Math.round(lessons.reduce((sum,l)=>sum+readingMinutes(l),0)/60)} hours of reading</span></div>
    <p class="reading-note">Reading times are estimates at 238 words per minute for English nonfiction. Source exercises and investigations take additional time. <a href="https://biblio.ugent.be/publication/8647789" target="_blank" rel="noopener noreferrer">About the reading rate ↗</a></p>
    <div class="chapter-list">${lessons.map(l=>`<a class="chapter-row" href="${lessonUrl(l.id)}"><span class="chapter-no">${l.n}</span><span class="chapter-main"><b>${esc(l.title)}</b><small>${esc(l.deck)}</small></span><span class="chapter-meta">${esc(l.part)}<br>~${readingMinutes(l)} min read</span><span class="chapter-go">↗</span></a>`).join('')}</div>
    <div class="provenance-banner"><div><div class="eyebrow">PROVENANCE</div><h3>Which Chromium revision?</h3></div><p>This course is based on research into Chromium <code>src@f288fed6</code> in September 2026. Source paths are labeled when the sparse local checkout omits them. The separate V8 checkout is a different revision from Chromium’s V8 pin.</p><a href="#/library">See source and scope →</a></div>
  </div>`;
}
function map(){const columns=[['Source, processes, and services',['checkout','rolls','remote','owners','startup','ipc','navigation','security','network']],['Renderer, page, and state',['parsing','time','pixels','bindings','lifetime','storage','features']],['Compiler, delivery, and practice',['graphs','factory','release','diagnostics','journey','independent']]];return `<div class="page map-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Architecture map</div><div class="eyebrow">SYSTEM MAP</div><h1>Chromium architecture<br><em>at a glance.</em></h1><p class="intro">These chapters follow the path from obtaining Chromium source, through browser and renderer behavior, to testing and releasing changes. Use the links below to move between related topics.</p><div class="map-grid">${columns.map(([head,ids])=>`<section class="map-column"><h2>${head}</h2>${ids.map(id=>{let l=byId[id];return `<a href="${lessonUrl(id)}" class="map-node"><span>${l.n}</span><b>${esc(l.title)}</b><small>${esc(l.skill)}</small></a>`}).join('')}</section>`).join('')}</div><div class="map-legend"><div><strong>How a page reaches the screen</strong><p>The browser starts navigation. A renderer runs Blink and V8. The compositor prepares frames, and Viz combines them for display. Individual paths depend on the page and platform.</p></div><div><strong>How to use the source</strong><p>Start with a question, find the relevant declaration and implementation, read a test, and check the result in a run.</p></div></div><div class="map-crosslinks"><h2>Connections between chapters</h2>${connections.map(([a,b,title,reason])=>`<section class="map-connection"><h3>${esc(title)}</h3><p>${esc(reason)}</p><div><a href="${lessonUrl(a)}">${esc(byId[a].title)}</a><span aria-hidden="true"> ↔ </span><a href="${lessonUrl(b)}">${esc(byId[b].title)}</a></div></section>`).join('')}</div><div class="coverage"><div class="tiny-label">WHAT THE SUPPLIED MATERIAL SUPPORTS</div><div><b>Deeply documented here</b><p>Blink’s parsing, scheduling, rendering, bindings, memory, and feature testing; dependencies and remote builds; LUCI/CQ and releases; and compiler graph representation.</p></div><div><b>Architecture from checked-in docs</b><p>Startup, Mojo, navigation, network boundaries, security, page state, and performance investigation are taught from Chromium documents. Their missing implementation files are linked at the pinned revision.</p></div><div><b>Where the archive ends</b><p>Network and storage engine internals, platform sandbox code, media, extensions, and internal services need additional source work. The last chapter gives a method for that work.</p></div></div></div>`;}
function sources(files){return `<div class="source-list">${files.map(f=>`<div class="source-item"><span class="source-icon" aria-hidden="true">↗</span><span><a class="source-file" href="${f.local?localSourceUrl(f):sourceUrl(f)}" ${f.local?'':'target="_blank" rel="noopener noreferrer"'}><code>${esc(f.repo==='src'?'src/':f.repo==='v8'?'v8/':'depot_tools/')}${esc(f.path)}</code></a><small>${esc(f.why)}</small></span>${f.local?`<a class="source-action" href="${localSourceUrl(f)}">Read snapshot</a>`:''}<a class="source-action external" href="${sourceUrl(f)}" target="_blank" rel="noopener noreferrer">Pinned upstream ↗</a><span class="source-state ${f.local?'':'remote'}">${f.local?'local + pinned':'research cited'}</span></div>`).join('')}</div>`;}
function linkSourceMentions(body,files){
  const names=new Map();
  for(const f of files){const prefix=f.repo==='depot'?'depot_tools':f.repo;for(const name of [f.path,`${prefix}/${f.path}`,...(f.path.startsWith('third_party/blink/renderer/')?[f.path.slice(26)]:[])])names.set(name,f);}
  const template=document.createElement('template');template.innerHTML=body;
  template.content.querySelectorAll('code').forEach(code=>{const file=names.get(code.textContent);if(!file||code.closest('a,pre'))return;const link=document.createElement('a');link.className='inline-source';link.href=file.local?localSourceUrl(file):sourceUrl(file);if(!file.local){link.target='_blank';link.rel='noopener noreferrer';}code.replaceWith(link);link.append(code);});
  return template.innerHTML;
}
function sourcePage(repo,path){let known=lessons.flatMap(l=>l.files).find(f=>f.local&&f.repo===repo&&f.path===path);if(!known)return `<div class="page"><h1>Source not in this archive</h1><a href="#/library">Return to source and scope →</a></div>`;let prefix=repo==='depot'?'depot_tools':repo;const origin=byId[routeParams().get('from')];const users=origin?[origin]:lessons.filter(l=>l.files.some(f=>f.repo===repo&&f.path===path));return `<div class="page source-page"><nav class="source-return">${users.map(l=>`<a href="${esc(routeParams().get('back')?.startsWith(lessonUrl(l.id)+'?')?routeParams().get('back'):lessonUrl(l.id))}">← ${esc(l.title)}</a>`).join('')}</nav><div class="crumb"><a href="#/">Home</a><span>›</span><a href="#/library">Source and scope</a><span>›</span> Snapshot</div><div class="eyebrow">PINNED SOURCE SNAPSHOT</div><h1>${esc(path.split('/').at(-1))}</h1><p class="source-path"><code>${esc(prefix+'/'+path)}</code></p><p class="intro">${esc(known.why)}. This file was copied from the supplied sparse checkout. Read it here with line numbers, then follow the pinned upstream link for surrounding files and history.</p><div class="source-toolbar"><a href="${sourceUrl(known)}" target="_blank" rel="noopener noreferrer">Open pinned upstream ↗</a><label>Go to line <input type="number" id="goLine" min="1" placeholder="42"></label></div><div id="sourceCode" class="source-code"><p>Loading source…</p></div></div>`;}
function lesson(l){let ix=lessons.indexOf(l),done=doneSet(),next=lessons[ix+1],prev=lessons[ix-1],sections=sectionsFor(l);return `<div class="lesson-layout"><article class="lesson page"><div class="crumb"><a href="#/">Home</a><span>›</span><a href="#/map">${esc(l.part)}</a><span>›</span>${l.n}</div><div class="lesson-kicker"><span>CHAPTER ${l.n}</span><span>ABOUT ${readingMinutes(l)} MIN READING · EXERCISE TIME VARIES</span></div><h1>${esc(l.title)}</h1><p class="lesson-deck">${esc(l.deck)}</p><div class="lesson-meta"><span><b>Previous chapters:</b> ${l.deps.length?l.deps.map(id=>`<a href="${lessonUrl(id)}">${esc(byId[id].title)}</a>`).join(' · '):'No prerequisites'}</span></div><p class="lead">${esc(l.lead)}</p><div class="learning-goals"><b>After this chapter, you should be able to:</b><ul>${(outcomes[l.id]||[]).map(goal=>`<li>${esc(goal)}</li>`).join('')}</ul></div><details class="mobile-contents"><summary>In this chapter · ${sections.length} sections</summary><nav aria-label="Chapter contents">${contents(l,sections)}${extraContents(l)}<a href="${lessonUrl(l.id)}?section=experiment">Source exercise</a>${connectionContents(l)}<a href="${lessonUrl(l.id)}?section=sources">Source files</a><a href="${lessonUrl(l.id)}?section=notebook">Your notes</a></nav></details>${flow(l.flow,`${l.title}: the main stages discussed below.`)}${sections.map(([title,body],i)=>`<section class="prose-section" id="${sectionId(title)}"><div class="section-number">${String(i+1).padStart(2,'0')}</div><h2><a class="section-link" href="${sectionUrl(l.id,title)}" aria-label="Link to ${esc(title)}">${esc(title)}<span aria-hidden="true"> #</span></a></h2>${linkSourceMentions(body,l.files)}</section>${i===0?`<div class="prediction"><div class="prediction-head"><span>CHECK YOUR UNDERSTANDING</span><span></span></div><p>${esc(l.quiz[0])}</p><details><summary>Show explanation <span>↓</span></summary><div>${esc(l.quiz[1])}</div></details></div>`:''}${i===3&&midChecks[l.id]?`<div class="prediction mid-check"><div class="prediction-head"><span>PAUSE AND PREDICT</span></div><p>${esc(midChecks[l.id][0])}</p><details><summary>Show explanation <span>↓</span></summary><div>${esc(midChecks[l.id][1])}</div></details></div>`:''}`).join('')}${['navigation','journey'].includes(l.id)?navigationLab():''}${misconceptions[l.id]?`<div class="misconception"><span class="tiny-label">COMMON MISCONCEPTION</span><h3>“${esc(misconceptions[l.id][0])}”</h3><p>${esc(misconceptions[l.id][1])}</p></div>`:''}${workedProblem(l.id)}<div class="principle"><span class="tiny-label">RELATED COMPUTER SCIENCE</span><p>${esc(principles[l.id])}</p></div><section class="lab" id="experiment"><div class="lab-kicker">SOURCE EXERCISE <span>↗</span></div><h2>${esc(l.lab.title)}</h2><p class="lab-aim">${esc(l.lab.aim)}</p><label class="prediction-label" for="labPrediction">Before you start, predict what you will observe.</label><textarea id="labPrediction" class="lab-prediction" placeholder="My prediction and the observation that would disprove it…"></textarea><details class="lab-hypothesis"><summary>Compare with the expected result</summary><p>${esc(l.lab.prediction)}</p></details><h3>Steps</h3><ol class="lab-steps">${l.lab.steps.map((s,i)=>`<li><label><input type="checkbox" data-step="${i}"><span>${esc(s)}</span></label></li>`).join('')}</ol><div class="lab-result"><div><b>What to look for</b><p>${esc(l.lab.observation)}</p></div><div><b>How to interpret it</b><p>${esc(l.lab.conclusion)}</p></div></div><div class="follow"><b>Next question</b><p>${esc(l.lab.follow)}</p></div></section>${relatedChapters(l)}<section class="source-section" id="sources"><div class="section-label"><span>SOURCE FILES</span><span>${l.files.length} entry points</span></div><p>Open these at the revision used by the supplied research. “Research cited” paths are absent from the sparse local checkout.</p>${sources(l.files)}</section><section class="notebook" id="notebook"><div class="section-label"><span>YOUR NOTES</span><span>Saved locally</span></div><label for="notes">Write down what the source confirmed, what it changed, and what you want to check next.</label><textarea id="notes" placeholder="My model:\nSource and revision:\nWhat I observed:\nWhat changed my mind:\nNext experiment:"></textarea><div class="note-footer"><button class="button" id="exportNotes">Export study notes</button><span id="noteStatus" role="status">Notes stay in this browser.</span><button class="button primary" id="completeBtn">${done.has(l.id)?'✓ Marked complete':'Mark chapter complete'}</button></div></section><nav class="lesson-pager">${prev?`<a href="${lessonUrl(prev.id)}"><small>← PREVIOUS</small><b>${esc(prev.title)}</b></a>`:'<span></span>'}${next?`<a href="${lessonUrl(next.id)}"><small>NEXT →</small><b>${esc(next.title)}</b></a>`:'<a href="#/map"><small>CONTINUE →</small><b>Architecture map</b></a>'}</nav></article><aside class="right-rail"><div class="rail-inner"><div class="rail-label">ON THIS PAGE</div>${contents(l,sections)}${extraContents(l)}<a href="${lessonUrl(l.id)}?section=experiment">Source exercise</a>${connectionContents(l)}<a href="${lessonUrl(l.id)}?section=sources">Source files</a><a href="${lessonUrl(l.id)}?section=notebook">Notes</a><div class="rail-divider"></div><div class="rail-label">IN THIS CHAPTER</div><p>${esc(l.skill)}</p><div class="rail-divider"></div><div class="rail-label">NEXT</div>${next?`<a href="${lessonUrl(next.id)}">${esc(next.title)} →</a>`:'<p>Choose another chapter.</p>'}</div></aside></div>`;}
function glossaryPage(){return `<div class="page reference-page glossary-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Glossary</div><div class="eyebrow">REFERENCE</div><h1>Chromium terms in context</h1><p class="intro">Use these definitions to identify an object or boundary, then follow the chapter link for its ownership, runtime behavior, source path, and experiment.</p><div class="glossary-list">${glossary.map(([term,definition,id])=>`<div class="glossary-row" id="term-${term.toLowerCase().replace(/[^a-z0-9]+/g,'-')}"><h2>${esc(term)}</h2><p>${esc(definition)}</p><a href="${lessonUrl(id)}">${esc(byId[id].title)} →</a></div>`).join('')}</div></div>`;}
function guide(){return `<div class="page reference-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Source reading guide</div><div class="eyebrow">SOURCE READING GUIDE</div><h1>How to investigate<br><em>Chromium source code.</em></h1><p class="intro">Use these steps when you want to understand code that this course does not explain. Start with a behavior you can observe, then find the source and tests that explain it.</p><div class="method-list">${[
['01','Choose a behavior to explain','Choose a user action, test failure, or trace event. Describe exactly what happened before searching for classes.'],
['02','Read the overview and identify the components','Read the nearest README or design document. List the relevant processes, threads, and objects, then check those names in the source.'],
['03','Find the entry point','Search public interfaces, message handlers, command-line switches, and tests. Use rg --files to narrow directories, then rg -n for symbols.'],
['04','Follow the call path and task posts','Record callers and callees. When work is asynchronous, find both the task post and callback; when it crosses processes, find the IPC sender and receiver.'],
['05','Read a relevant test','Read a unit, browser, or web test. Note the exact behavior it checks and any platform or fixture conditions.'],
['06','Run a test or observe the behavior','Run a focused test or trace. If you change one condition, compare the result with the original behavior.'],
['07','Update your explanation','Write a short explanation with source paths and revision. Include any fact you could not verify and the next check that would resolve it.']
].map(([n,t,d])=>`<div class="method-row"><span>${n}</span><h2>${t}</h2><p>${d}</p></div>`).join('')}</div><div class="command-sheet"><div class="tiny-label">USEFUL COMMANDS</div><pre><code>rg --files chromium-ref/src | rg 'navigation|frame|scheduler'\nrg -n 'ClassOrMethod' chromium-ref/src/content chromium-ref/src/cc\ngit -C chromium-ref/src log --oneline -- path/to/file\ngit -C chromium-ref/src blame -L 40,80 -- path/to/file</code></pre><p>Use the exact tree revision when comparing claims. This local checkout is sparse; absence of a file is not absence of the mechanism.</p></div></div>`;}
function libraryPage(){return `<div class="page reference-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Source and scope</div><div class="eyebrow">SOURCE AND SCOPE</div><h1>What this course is based on</h1><p class="intro">The chapters on this site are the study material. They rewrite and extend the supplied research into explanations, code paths, and exercises. Use the pinned source links inside each chapter to inspect the implementation directly.</p><div class="provenance-box"><div class="tiny-label">REVISION</div><p><b>Chromium:</b> <code>src@${revision.slice(0,8)}</code>, Chrome 156.0.8067.0, checked out 18 September 2026. <b>depot_tools:</b> <code>0306e468</code>. The separate V8 checkout reports 15.6.0, while Chromium DEPS pins 15.6.19. The checkout is sparse; some implementation paths are research cited and link to the pinned upstream revision.</p><p>The original research supports detailed treatment of Blink, dependency rolls and remote compilation, LUCI and release work, and compiler graphs. Checked-in Chromium documents support the added chapters on startup, Mojo, security, loading, state, and measurement. The network implementation, storage engines, platform-specific sandbox code, media, extensions, and many product features still need separate source investigations; this sparse checkout does not establish their internal call paths.</p></div><div class="section-label"><span>HOW TO CHECK A CLAIM</span></div><p>Each chapter lists source paths and labels local snapshots. Open a local snapshot for line-by-line reading, then use the pinned upstream source for neighboring files and history. When a path is research cited, the file is absent from this sparse checkout; verify it upstream before relying on implementation details.</p><p><a class="text-link" href="#/fieldguide">Use the source reading guide →</a> · <a class="text-link" href="#/glossary">Look up a term →</a> · <a class="text-link" href="#/coverage">Check material coverage →</a> · <a class="text-link" href="#/evidence">Search the evidence index →</a></p></div>`;}
function coveragePage(){return `<div class="page reference-page coverage-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Material coverage</div><div class="eyebrow">COURSE AUDIT</div><h1>Where the collected material is taught</h1><p class="intro">Every main section of the five supplied writings is mapped to the chapters that teach it. The bibliography sections are represented by the source links and evidence index. These are links within this study site.</p>${coverage.map(group=>`<section class="coverage-group"><h2>${esc(group.source)}</h2><div>${group.sections.map(row=>`<div class="coverage-row"><span>${esc(row.title)}</span><div>${row.bibliography?'<a href="#/evidence">Evidence index →</a>':row.lessons.map(id=>`<a href="${lessonUrl(id)}">${esc(byId[id].title)} →</a>`).join('')}</div></div>`).join('')}</div></section>`).join('')}</div>`;}
function evidencePage(){return `<div class="page reference-page evidence-page"><div class="crumb"><a href="#/">Home</a><span>›</span> Evidence index</div><div class="eyebrow">RESEARCH RECORD</div><h1>Evidence index</h1><p class="intro">The lessons explain the system. This index keeps every claim from the three supplied research dossiers, with its source, supporting evidence, and confidence label. It also lists questions the research could not settle. The index is part of this site; it does not send you to the original writings.</p><div class="evidence-controls"><input id="evidenceQuery" type="search" placeholder="Search claims, symbols, paths, or IDs…" aria-label="Search evidence"><select id="evidenceDomain" aria-label="Filter domain"><option value="">All subjects</option><option>Blink</option><option>Dependencies</option><option>CI and releases</option></select><select id="evidenceKind" aria-label="Filter record type"><option value="facts">Research claims</option><option value="questions">Open questions</option></select></div><div id="evidenceStatus" class="evidence-status">Loading the research record…</div><div id="evidenceResults"></div><nav id="evidencePager" class="evidence-pager"></nav></div>`;}
async function loadEvidence(){const host=document.querySelector('#evidenceResults');if(!host)return;try{const res=await fetch('data/evidence.json');if(!res.ok)throw Error('Unable to load data/evidence.json');const data=await res.json();if(!host.isConnected)return;let page=0;const perPage=30,q=document.querySelector('#evidenceQuery'),domain=document.querySelector('#evidenceDomain'),kind=document.querySelector('#evidenceKind'),status=document.querySelector('#evidenceStatus'),pager=document.querySelector('#evidencePager');function draw(){const term=q.value.toLowerCase().trim();const rows=(kind.value==='questions'?data.openQuestions:data.facts).filter(r=>(!domain.value||r.domain===domain.value)&&(!term||Object.values(r).some(v=>String(v).toLowerCase().includes(term))));const pages=Math.max(1,Math.ceil(rows.length/perPage));page=Math.min(page,pages-1);const shown=rows.slice(page*perPage,(page+1)*perPage);status.textContent=`${rows.length.toLocaleString()} ${kind.value==='questions'?'open questions':'fact-ledger entries'} · ${data.facts.length.toLocaleString()} facts and ${data.openQuestions.length} open questions in the archive`;host.innerHTML=shown.length?shown.map(r=>kind.value==='questions'?`<article class="evidence-row"><div class="evidence-top"><b>${esc(r.domain)}</b><span>OPEN QUESTION</span></div><p>${esc(r.question)}</p></article>`:`<article class="evidence-row"><div class="evidence-top"><b>${esc(r.id)} · ${esc(r.domain)}</b><span>${esc(r.confidence)}</span></div><h2>${esc(r.claim)}</h2><p><strong>Source:</strong> ${esc(r.source)}</p><p><strong>Evidence:</strong> ${esc(r.evidence)}</p></article>`).join(''):'<p class="no-results">No matching records. Try a class, path, or shorter phrase.</p>';pager.innerHTML=pages>1?`<button id="evidencePrev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1} of ${pages}</span><button id="evidenceNext" ${page===pages-1?'disabled':''}>Next →</button>`:'';pager.querySelector('#evidencePrev')?.addEventListener('click',()=>{page--;draw();host.scrollIntoView();});pager.querySelector('#evidenceNext')?.addEventListener('click',()=>{page++;draw();host.scrollIntoView();});}q.oninput=()=>{page=0;draw();};domain.onchange=kind.onchange=()=>{page=0;draw();};draw();}catch(e){host.innerHTML='<p>Could not load the evidence index. Serve this directory over HTTP with <code>python3 -m http.server</code>.</p>';document.querySelector('#evidenceStatus').textContent='Unavailable';}}
async function loadSource(repo,path){let container=document.querySelector('#sourceCode');if(!container)return;try{let prefix=repo==='depot'?'depot_tools':repo;let response=await fetch(`source-tree/${prefix}/${path}`);if(!response.ok)throw Error(`HTTP ${response.status}`);let lines=(await response.text()).split('\n');if(!container.isConnected)return;container.innerHTML=lines.map((line,i)=>`<div class="code-line" id="L${i+1}"><span class="line-number">${i+1}</span><code>${esc(line)||' '}</code></div>`).join('');let input=document.querySelector('#goLine');input.max=lines.length;input.onchange=()=>document.querySelector(`#L${Math.min(lines.length,Math.max(1,Number(input.value)||1))}`)?.scrollIntoView({block:'center'});}catch(e){container.innerHTML=`<p>Could not load this local source snapshot. Serve this directory over HTTP: <code>python3 -m http.server</code>.</p>`;}}
function render(){
  const firstRender=!currentRoute;
  if(currentRoute)readingPositions.set(currentRoute,window.scrollY);
  sectionObserver?.disconnect();document.body.classList.remove('menu-open','search-open');
  const [kind,id]=route(),params=routeParams();let content,active;
  const path=location.hash.split('?')[0].replace(/^#\/source\/[^/]+\//,'');
  if(kind==='lesson'&&byId[id]){content=lesson(byId[id]);active=id;}
  else if(kind==='map')content=map();else if(kind==='fieldguide')content=guide();else if(kind==='glossary')content=glossaryPage();else if(kind==='library')content=libraryPage();else if(kind==='evidence')content=evidencePage();else if(kind==='coverage')content=coveragePage();else if(kind==='source')content=sourcePage(id,path);else if(kind==='home')content=home();
  else content='<div class="page"><h1>Page not found</h1><p>This address does not match a chapter or reference page.</p><a class="text-link" href="#/">Return to the book →</a></div>';
  shell(content,active);currentRoute=location.hash||'#/';
  document.title=kind==='home'?'How Chromium’s Systems Work Together · Chromium Study':`${active?byId[active].title:document.querySelector('main h1')?.textContent||'Book'} · Chromium Study`;
  if(active){wireLesson(active);wireNavigationLab();persist('chr-study-last-read',currentRoute);}
  if(kind==='source')loadSource(id,path);if(kind==='evidence')loadEvidence();
  const routeAtRender=currentRoute;
  requestAnimationFrame(()=>{if(currentRoute!==routeAtRender)return;const target=params.get('section');const element=target&&document.getElementById(target);if(readingPositions.has(currentRoute)){window.scrollTo({top:readingPositions.get(currentRoute),behavior:'instant'});}else if(element){element.scrollIntoView({behavior:'instant'});const heading=element.querySelector('h2')||element;heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}else {let saved=0;if(firstRender){try{const pos=JSON.parse(stored('chr-study-reading-position','{}'));if(pos.route===currentRoute&&Number.isFinite(pos.y))saved=pos.y;}catch{}}window.scrollTo({top:readingPositions.get(currentRoute)||saved,behavior:'instant'});}});
}
function wireLesson(id){
  const note=document.querySelector('#notes'),status=document.querySelector('#noteStatus');
  note.value=stored(noteKey(id));
  note.addEventListener('input',()=>{status.textContent=persist(noteKey(id),note.value)?'Saved in this browser.':'Storage unavailable. Export your notes to keep them.';});
  const prediction=document.querySelector('#labPrediction');prediction.value=stored(`chr-study-prediction-${id}`);
  prediction.addEventListener('input',()=>{status.textContent=persist(`chr-study-prediction-${id}`,prediction.value)?'Prediction saved.':'Storage unavailable. Export your notes to keep them.';});
  document.querySelectorAll('[data-step]').forEach(box=>{const key=`chr-study-step-${id}-${box.dataset.step}`;box.checked=stored(key)==='true';box.onchange=()=>{if(!persist(key,String(box.checked)))status.textContent='Step checked for this session; browser storage is unavailable.';};});
  document.querySelector('#completeBtn').onclick=()=>{const set=doneSet();set.has(id)?set.delete(id):set.add(id);if(!saveDone(set)){status.textContent='Could not save progress in this browser.';return;}const y=window.scrollY;render();requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}));};
  document.querySelector('#exportNotes').onclick=()=>{const lines=['# Chromium study notes',`Source revision: ${revision}`];for(const l of lessons){const notes=l.id===id?note.value:stored(noteKey(l.id)),prediction=l.id===id?document.querySelector('#labPrediction').value:stored(`chr-study-prediction-${l.id}`);if(!notes&&!prediction)continue;lines.push(`\n## ${l.title}`,`\nPrediction:\n${prediction||'(not recorded)'}`,`\nInvestigation notes:\n${notes||'(not recorded)'}`);}const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='chromium-study-notes.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Notes exported as Markdown.';};
  const links=[...document.querySelectorAll('.right-rail [data-section]')];
  if('IntersectionObserver' in window){sectionObserver=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!visible)return;links.forEach(a=>{const current=a.dataset.section===visible.target.id;a.classList.toggle('current-section',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-80px 0px -65% 0px'});document.querySelectorAll('.prose-section').forEach(section=>sectionObserver.observe(section));}
}
function searchResults(q){
  const term=q.toLowerCase().trim();
  const items=lessons.flatMap(l=>[
    {type:'Chapter',title:l.title,sub:l.deck,url:lessonUrl(l.id)},
    ...sectionsFor(l).map(([title,body])=>({type:'Section',title,sub:body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' '),chapter:l.title,url:sectionUrl(l.id,title)})),
    ...l.files.map(f=>({type:'Source',title:f.path,sub:f.why,chapter:l.title,url:f.local?`#/source/${f.repo}/${f.path}?from=${l.id}`:sourceUrl(f)}))
  ]).concat(glossary.map(([title,sub,id])=>({type:'Term',title,sub,url:lessonUrl(id)})));
  if(!term)return items.filter(item=>item.type==='Chapter');
  return items.filter(item=>`${item.title} ${item.sub}`.toLowerCase().includes(term)).sort((a,b)=>Number(b.title.toLowerCase().includes(term))-Number(a.title.toLowerCase().includes(term))).slice(0,60).map(item=>{const at=item.sub.toLowerCase().indexOf(term),start=Math.max(0,at-55);return {...item,sub:(start?'…':'')+item.sub.slice(start,start+190)};});
}
function openSearch(){
  const overlay=document.querySelector('#searchOverlay');if(!overlay.hidden)return;
  searchReturnFocus=document.activeElement;overlay.hidden=false;document.body.classList.add('search-open');
  overlay.innerHTML=`<div class="search-scrim"></div><div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search the book"><div class="search-input-wrap"><label for="searchInput" class="sr-only">Search chapters, passages, terms, and sources</label><input id="searchInput" autocomplete="off" placeholder="Find a concept, symbol, or source path…"><button id="closeSearch" aria-label="Close search">Close</button></div><div id="searchCount" class="search-count" role="status"></div><div id="searchList" class="search-list"></div><div class="search-hint">↑ ↓ to choose · Enter to open · Escape to close</div></div>`;
  const input=overlay.querySelector('input'),list=overlay.querySelector('#searchList');let selected=0,results=[];
  function draw(){results=searchResults(input.value);selected=Math.max(0,Math.min(selected,results.length-1));document.querySelector('#searchCount').textContent=`${results.length}${results.length===60?' (first 60)':''} results`;list.innerHTML=results.length?results.map((r,i)=>`<a class="search-result ${i===selected?'selected':''}" href="${esc(r.url)}" ${r.url.startsWith('#')?'':'target="_blank" rel="noopener noreferrer"'}><span>${esc(r.type)}</span><strong>${esc(r.title)}</strong><small>${esc(r.chapter||'')} ${r.chapter?'· ':''}${esc(r.sub)}</small></a>`).join(''):'<p class="no-results">No matching passage. Try a shorter name or source symbol.</p>';list.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeSearch(false)));}
  input.oninput=()=>{selected=0;draw();};input.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){selected=Math.max(0,Math.min(results.length-1,selected+(e.key==='ArrowDown'?1:-1)));draw();list.querySelector('.selected')?.scrollIntoView({block:'nearest'});e.preventDefault();}if(e.key==='Enter'){list.querySelectorAll('a')[selected]?.click();e.preventDefault();}};
  overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeSearch();}if(e.key==='Tab'){const focusable=[...overlay.querySelectorAll('input,button,a[href]')],first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}};
  overlay.querySelector('.search-scrim').onclick=()=>closeSearch();overlay.querySelector('#closeSearch').onclick=()=>closeSearch();draw();input.focus();
}
function closeSearch(restore=true){const overlay=document.querySelector('#searchOverlay');if(overlay)overlay.hidden=true;document.body.classList.remove('search-open');if(restore&&searchReturnFocus?.isConnected)searchReturnFocus.focus();}
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();openSearch();}if(e.key==='Escape'&&document.body.classList.contains('menu-open')){document.body.classList.remove('menu-open');document.querySelector('#menuBtn')?.setAttribute('aria-expanded','false');document.querySelector('#menuBtn')?.focus();}});
let readingTimer;
function saveReadingPosition(){if(route()[0]==='lesson'&&currentRoute===location.hash)persist('chr-study-reading-position',JSON.stringify({route:currentRoute,y:window.scrollY}));}
window.addEventListener('scroll',()=>{clearTimeout(readingTimer);readingTimer=setTimeout(saveReadingPosition,250);},{passive:true});
window.addEventListener('pagehide',saveReadingPosition);
document.addEventListener('click',e=>{const link=e.target.closest('a'),href=link?.getAttribute('href');if(!href?.startsWith('#/'))return;if(href.startsWith('#/lesson/')&&href.includes('?section='))readingPositions.delete(href);if(href===location.hash){e.preventDefault();const section=routeParams().get('section');if(section)document.getElementById(section)?.scrollIntoView();else window.scrollTo({top:0,behavior:'instant'});}});
window.addEventListener('hashchange',render);render();
