// Teaching figures are attached to named sections so they appear at the point
// of explanation. Examples are deliberately small; none is a recorded trace.
const box=(title,text='')=>`<div class="visual-box"><strong>${title}</strong>${text?`<span>${text}</span>`:''}</div>`;
const arrow=label=>`<div class="visual-arrow"><span>${label||''}</span><b aria-hidden="true">↓</b></div>`;
const columns=(...items)=>`<div class="visual-columns">${items.join('')}</div>`;
const lane=(title,body)=>`<div class="visual-lane"><div class="visual-lane-title">${title}</div>${body}</div>`;
const table=(label,heads,rows)=>`<div class="visual-scroll" role="region" aria-label="${label}; scroll horizontally on narrow screens" tabindex="0"><table class="visual-table"><caption>${label}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r[0]}</th>${r.slice(1).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const code=s=>`<pre class="visual-code"><code>${s}</code></pre>`;
const reachabilityGraph=rooted=>{
  const id=rooted?'rooted-cycle':'weak-cycle';
  return `<svg class="visual-graph" viewBox="0 0 300 240" role="img" aria-labelledby="${id}-title ${id}-desc">
    <title id="${id}-title">${rooted?'Strong root reaches both objects':'A weak path does not retain the cycle'}</title>
    <desc id="${id}-desc">${rooted?'A persistent root strongly reaches A. A and B have strong references to each other, so both are reachable.':'A reachable owner has only a weak reference to A. A and B refer strongly to each other, but neither has a strong path from a root.'}</desc>
    <defs><marker id="${id}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#45684f"/></marker></defs>
    <rect x="55" y="12" width="190" height="42" rx="3"/>
    <text x="150" y="38" text-anchor="middle">${rooted?'Persistent root':'Reachable owner'}</text>
    <path class="graph-edge${rooted?'':' graph-weak'}" d="M150 54 L150 85 L65 85 L65 139" marker-end="url(#${id}-arrow)"/>
    <text class="graph-label" x="92" y="119">${rooted?'strong':'weak'}</text>
    <rect x="22" y="142" width="86" height="48" rx="3"/><text x="65" y="171" text-anchor="middle">A</text>
    <rect x="192" y="142" width="86" height="48" rx="3"/><text x="235" y="171" text-anchor="middle">B</text>
    <path class="graph-edge" d="M108 154 L187 154" marker-end="url(#${id}-arrow)"/>
    <path class="graph-edge" d="M192 178 L113 178" marker-end="url(#${id}-arrow)"/>
    <text class="graph-label" x="150" y="217" text-anchor="middle">${rooted?'A and B are reachable':'Cycle alone does not retain A or B'}</text>
  </svg>`;
};

export const figures={
checkout:[{
  after:'A checkout is a graph of three dependency types',
  title:'One revision selects several kinds of input',
  lead:'Imagine checking out the same src commit on Linux and Windows. The manifest is the same, but conditions can select different packages. Trace both the revision and the configuration into the resulting checkout.',
  diagram:box('src revision + .gclient + host conditions','Inputs to DEPS evaluation')+arrow('select eligible dependencies')+columns(
    box('Git repositories','A repository URL and revision select source history.'),
    box('CIPD packages','A package and pinned instance identify installed tool or library files.'),
    box('GCS objects','Object metadata identifies downloaded artifacts.')
  )+arrow('materialize inputs; run configured preparation')+box('Working tree + generated settings + prepared tools','GN and the compiler consume this result.'),
  explanation:'A src commit fixes the manifest’s contents. It does not erase host conditions, local configuration, or the need to obtain the referenced inputs. When builds differ, compare the evaluated checkout before comparing compiler output. This is the same distinction as a program versus one execution of that program.',
  question:'If src is unchanged but args.gn changes, must the resulting binary stay identical?',
  answer:'No. args.gn is another build input. A reproducible result requires the relevant source, toolchain, generated inputs, and configuration to agree. The diagram shows checkout preparation, not every input to compilation.',
  sources:['DEPS','gclient.py']
}],
remote:[{
  after:'What remote execution stores',
  title:'A cache hit reuses a declared computation',
  lead:'Keep two stores separate: a content store holds bytes by digest; an action cache maps the identity of a computation to its result. The following is a conceptual view of the Remote Execution API described in the supplied research.',
  diagram:columns(box('Input tree','Source, headers, generated files, and tools, named by their content.'),box('Command and execution properties','Arguments, relevant environment, platform, and other action fields.'))+arrow('form the action identity')+box('Look up the action result')+columns(
    lane('Hit',arrow('matching result exists')+box('Fetch output bytes','Reuse the recorded result.')),
    lane('Miss',arrow('no usable result')+box('Execute using declared inputs','Store output bytes and the action result.'))
  ),
  explanation:'Suppose a generated header changes from H₁ to H₂ while the .cc file stays unchanged. If the header affects compilation, the input tree must reflect H₂. Otherwise the cache can correctly match the declared action while returning an output that is wrong for the intended build. The defect is in the description of the work.',
  question:'Would turning the cache off fix an undeclared input?',
  answer:'It may hide stale reuse, but it does not make the remote action complete. The worker can still lack that input. Compare the action’s declared files with what the compiler actually reads.',
  sources:['build/toolchain/rbe.gni','build/toolchain/gcc_toolchain.gni']
}],
owners:[{
  after:'The objects behind one tab',
  title:'One visible page, two renderer address spaces',
  lead:'Consider a.example embedding b.example in an iframe, with site isolation placing them in different renderers. The three labeled process regions have separate address spaces. The inner boxes describe the state each process holds.',
  diagram:lane('Browser process',box('WebContents → primary frame tree','Main-frame node A has a child-frame node B. Browser-side frame hosts represent their documents.'))+arrow('frame relationships and IPC connect to renderer state')+columns(
    lane('Renderer A',box('Local frame A','Owns A’s DOM and script context.')+box('Remote representation of B','Represents the child relationship; does not contain B’s DOM.')),
    lane('Renderer B',box('Local frame B','Owns B’s DOM and script context.'))
  ),
  explanation:'The browser knows that B is a child of A even though A’s renderer cannot dereference B’s DOM pointers. Cross-process work needs a protocol. If renderer B crashes, B’s in-process state disappears; the browser can still retain the frame relationship and arrange recovery. This example omits proxies and host details that are not needed to show the ownership boundary.',
  question:'Does reading the parent renderer’s heap give you every DOM node in the tab?',
  answer:'No. In this placement, the child’s DOM lives in renderer B. A complete investigation needs both renderer identities and the browser’s frame tree. The same visible tab is not a single heap.',
  sources:['docs/frame_trees.md','docs/process_model_and_site_isolation.md']
},{
  after:'What changes when a frame navigates',
  title:'A frame position can outlive its document',
  lead:'Follow a child frame across a cross-document navigation that replaces its current host. Keep the stable position separate from the document occupying it.',
  diagram:table('Frame identity across a host-replacing navigation',['Identity','Before commit','After commit'],[
    ['FrameTreeNode','The child’s position in the tree','The same position'],
    ['Current RenderFrameHost','Host for document A','Host for document B'],
    ['Renderer document state','A’s DOM and execution context','B’s DOM and execution context'],
    ['Previous document','Current and active','Teardown or a retained lifecycle state, such as BFCache, when eligible']
  ]),
  explanation:'A cached pointer to a document host does not automatically follow the frame to its next document. An operation intended for “whatever is current in this frame” needs a different lifetime contract from an operation started by A. The exact host-reuse rules are revision-dependent; the table illustrates a replacement, not a claim that every navigation allocates every object again.',
  question:'A delayed result for A arrives after B commits. Which identity should the callback check?',
  answer:'It must establish that the document or operation that requested the work is still valid. Finding the same frame-tree position is insufficient: that position may now contain B. Look for document-scoped ownership or cancellation.',
  sources:['docs/frame_trees.md','docs/render_document.md']
}],
ipc:[{
  after:'Ordering is local to a connection',
  title:'An asynchronous reply does not share the caller’s stack',
  lead:'Read this sequence from top to bottom. The columns identify the sequences doing the work; blank time in either column may contain unrelated tasks.',
  diagram:table('One request and its response',['Step','Caller sequence','Service sequence'],[
    ['1 · send','Remote sends a request; caller continues.','Message awaits dispatch.'],
    ['2 · receive','May run other work or begin teardown.','Receiver dispatches to the implementation.'],
    ['3 · complete','No result has been delivered yet.','Implementation sends a response when ready.'],
    ['4 · deliver','Response callback runs if the reply path is still valid.','May already be handling other work.'],
    ['Alternative · disconnect','Handle the documented failure or dropped-callback behavior.','Peer, pipe, or owner may have gone away.']
  ]),
  explanation:'The send, implementation, and response callback are different execution points. The request may have been delivered even when the caller never receives a result. Per-pipe ordering also does not order unrelated pipes or all posted tasks. To reason about a race, record the endpoint, receiving sequence, and owner at each step.',
  question:'If the caller retries after losing the reply, can it assume the first operation never happened?',
  answer:'No. Losing the reply does not establish whether the service performed the operation. A retry policy needs the interface’s contract; an operation with side effects may need deduplication or a way to query the result. This is a protocol-design question, not an automatic Mojo guarantee.',
  sources:['docs/mojo_and_services.md','docs/mojo_testing.md']
}],
security:[{
  after:'Typed IPC does not imply authorized IPC',
  title:'A well-formed message can still request the wrong authority',
  lead:'This is a review model for a privileged operation. The checks may be distributed across binding and implementation code rather than living in one function.',
  diagram:lane('Less privileged renderer',box('Request','An operation plus sender-controlled arguments.'))+arrow('cross the trust boundary')+lane('Privileged receiver',
    box('Validate message shape','Can the request be decoded as the declared type?')+arrow('then establish authority')+
    box('Use trusted context','Which document or worker obtained this endpoint? What may it do now?')+arrow('authorize the particular operation')+
    box('Perform or reject','Do not turn an unverified origin or path into authority.')
  ),
  explanation:'Suppose a request contains a syntactically valid origin for another site. Type validation can succeed while authorization must fail. A correctly scoped endpoint lets the browser associate the request with context it already knows. The method must still enforce the operation’s policy and consider whether that context has changed or been destroyed.',
  question:'Which test adds more evidence after serialization tests pass: another valid request, or a validly encoded request for another origin’s data?',
  answer:'The cross-origin request tests the missing authorization boundary. Assert rejection at the privileged receiver, using the trusted context that the real binding supplies. A fake that skips binding may not exercise that boundary.',
  sources:['docs/security/mojo.md','docs/security/compromised-renderers.md']
}],
network:[{
  after:'Debug a load in phases',
  title:'The same “page failed” symptom has several boundaries',
  lead:'Track what has actually become true. Receiving bytes, committing a document, and loading its subresources are distinct observations.',
  diagram:table('Locate the first failed boundary',['Observed state','What it establishes','What to inspect next'],[
    ['Request created','Some caller requested a resource.','Selected loader path, interception, cancellation, or transport.'],
    ['Response received','A response source supplied headers or data.','Status, policy, and whether this response can commit.'],
    ['Document committed','The new document became current.','Its subresource requests and renderer work.'],
    ['Stylesheet failed after commit','A resource needed for appearance is missing.','That resource’s result and policy; the committed document may remain.'],
    ['Bytes arrived, pixels are late','Transfer alone does not explain the remaining delay.','Parsing, script, style, layout, and compositor progress.']
  ]),
  explanation:'A URLLoader abstraction does not prove that a response came from a network socket: caches, workers, and other loaders can participate. Begin with the request’s owner and selected path. If the document is already committed, a failed stylesheet should not be diagnosed as though navigation never happened.',
  question:'An HTML request succeeds, but the page is unstyled. What is the smallest useful next observation?',
  answer:'Check the stylesheet request and whether its rules reached style calculation. A successful HTML request establishes neither stylesheet success nor a completed visual update.',
  sources:['docs/navigation.md','services/network/public/mojom/url_loader_factory.mojom']
}],
parsing:[{
  after:'Why element construction can run script',
  title:'Reentrancy changes state inside one call stack',
  lead:'The danger is not limited to two threads running at once. Calling author JavaScript can change the very document that the parser is in the middle of constructing.',
  diagram:lane('Renderer main thread · conceptual nested call',
    box('Parser enters element construction','Tree construction has state about where and how to insert nodes.')+
    `<div class="visual-nested">${box('Custom-element construction runs author code','JavaScript can mutate the document or trigger other work.')}${arrow('return to the caller')}</div>`+
    box('Parser resumes','Use the protected state and reentrancy rules required by this path; do not assume nothing changed.')
  ),
  explanation:'A local C++ variable can survive across the call while the object it describes has changed. Keeping a pointer alive solves only part of the problem: the insertion point or surrounding document state may no longer mean what it meant before script ran. In the construction-site source, mark every call that can run script, then identify the guards and invariants around it.',
  question:'Would a mutex around the parser automatically prevent this case?',
  answer:'No. The example involves nested work on one thread. A mutex does not restore assumptions invalidated by a callback; a non-reentrant lock could instead deadlock. The code needs an explicit contract for reentry and state validity.',
  sources:['third_party/blink/renderer/core/html/parser/html_construction_site.cc']
}],
time:[{
  after:'A task is scheduled work, not a suspended function',
  title:'Priority affects selection after the running task finishes',
  lead:'The times below are a hypothetical example, not a Chromium trace. An input task becomes ready at 50 ms while a 200 ms JavaScript task occupies the same main thread.',
  diagram:`<div class="visual-timeline" role="img" aria-label="From 0 to 200 milliseconds a script task occupies the main thread. Input arrives at 50 milliseconds and waits 150 milliseconds until the script returns."><div class="visual-ticks"><span>0 ms</span><span>50 ms</span><span>200 ms</span></div><div class="visual-bar"><strong>Running JavaScript task</strong><span>Returns at 200 ms</span></div><div class="visual-wait"><strong>Input ready at 50 ms</strong><span>Waiting for the thread: 150 ms →</span></div></div>`,
  explanation:'Even if input has the highest eligible queue priority, it cannot take over this ordinary task halfway through. Priority matters when the scheduler can select the next task. The wait shown here is caused by a busy thread, so changing queue policy alone cannot remove it.',
  question:'How could you reduce the wait without removing the calculation?',
  answer:'If the algorithm permits it, split work into smaller tasks or move suitable work to a worker. Measure responsiveness and total completion time: splitting introduces scheduling overhead, and moving work introduces communication and ownership costs. Repeatedly queueing microtasks does not provide the same opportunity for ordinary tasks to run.',
  sources:['docs/threading_and_tasks.md','third_party/blink/renderer/platform/scheduler/']
},{
  after:'A more precise microtask rule',
  title:'A real click and a script-triggered click can have different checkpoints',
  lead:'Use a button with these two listeners. First click it yourself. Then call button.click() from another script. Predict the order before trying each case.',
  diagram:code("button.addEventListener('click', () => {\n  console.log('A');\n  Promise.resolve().then(() => console.log('B'));\n});\nbutton.addEventListener('click', () => console.log('C'));" )+table('Reason about the surrounding script stack',['Case','Boundary to inspect','Expected simple case'],[
    ['Browser-dispatched user click','Each listener can exit the outermost script scope.','A → B → C'],
    ['button.click() within a running script','The outer script remains on the stack during dispatch.','A → C → B, after the outer script yields']
  ]),
  explanation:'The Promise reaction is the same in both runs. What differs is the surrounding script scope. This is why “microtasks run after tasks” is too coarse for source investigation. The example assumes ordinary listeners without additional nested work; inspect the actual event dispatch and checkpoint path when the setup changes.',
  question:'Does the B log establish that the browser painted before C?',
  answer:'No. Running a microtask is not evidence of a rendering opportunity or frame presentation. Use rendering events or a trace to establish when visual work happened.',
  sources:['third_party/blink/renderer/platform/scheduler/public/event_loop.h']
}],
pixels:[{
  after:'From immutable stage outputs to caches',
  title:'Each representation answers a different question',
  lead:'Follow a paragraph whose color changes, then the same paragraph whose width changes. Look for the first output that must differ; later work follows from those changed inputs.',
  diagram:table('Representations on the path to pixels',['Representation','Question answered','Example input change'],[
    ['DOM + style rules','What content and styling instructions exist?','A class or text mutation.'],
    ['ComputedStyle','Which resolved style values apply?','Color changes from black to blue.'],
    ['Layout fragments','What geometry results under these constraints?','Width changes, so text may wrap differently.'],
    ['Paint artifact + property state','What drawing commands and visual properties describe the scene?','Text must be recorded with the new color.'],
    ['Compositor state + raster resources','Which prepared content can form the next frame?','Updated content needs the appropriate resources and activation.'],
    ['Viz display output','Which surfaces contribute to the displayed image?','A new compositor frame becomes part of the display.']
  ]),
  explanation:'A color change can leave geometry valid while changing paint. A width change can invalidate line breaks and fragment positions. These are examples of dependency-based reuse: retain an output only while the inputs relevant to it remain valid. The table is not a promise that every property change follows one fixed path; trace the actual page and its compositing conditions.',
  question:'Computed style is correct but a line wraps too early. Which representation would you inspect first?',
  answer:'Inspect the layout inputs and resulting fragments: available inline size, font metrics, and relevant constraints. Correct style does not establish correct geometry.',
  sources:['third_party/blink/renderer/core/dom/document_lifecycle.h','third_party/blink/renderer/platform/graphics/paint/paint_artifact.h']
},{
  after:'Why the compositor keeps more than one tree',
  title:'Prepare the next state while retaining something drawable',
  lead:'This is the two-tree model described in the cc overview. Read each row as a snapshot, not as a claim about exact thread interleaving or the timing of every tile.',
  diagram:table('Active and pending compositor state',['Moment','Active tree','Pending tree'],[
    ['Before the update','State A is available for drawing.','No newer state shown in this example.'],
    ['After a new commit','A can remain drawable.','State B is being prepared; required raster work may remain.'],
    ['Ready to activate','A remains the current active state until the switch.','B satisfies the conditions for activation.'],
    ['After activation','B is now active.','Preparation can begin for a later update.']
  ]),
  explanation:'Without retaining old state, preparing the next frame could leave nothing coherent to draw. Keeping both states costs memory and introduces readiness and activation rules. It also explains why a successful main-thread update is not proof that the display has shown it: commit, activation, frame submission, and presentation are different observations.',
  question:'A trace shows B committed, but the screen still shows A. Is that alone a paint bug?',
  answer:'No. Check whether B activated and whether a frame containing it was submitted and presented. The next missing event tells you which boundary to investigate.',
  sources:['cc/README.md','cc/scheduler/scheduler_state_machine.cc']
}],
bindings:[{
  after:'What happens before a generated binding exists',
  title:'Build-time generation and runtime dispatch are different paths',
  lead:'The generated binding is the point where these two paths meet. It is real compiled implementation, even when you cannot find it among the checked-in source files.',
  diagram:columns(
    lane('During the build',box('IDL inputs','Interfaces, partial interfaces, mixins, types, exposure.')+arrow('collect and resolve')+box('IDL database','Combined contract used by generators.')+arrow('generate and compile')+box('V8 binding code','Installers, conversions, overload handling.')),
    lane('When a page runs',box('JavaScript call','In a particular context and execution world.')+arrow('enter an exposed binding')+box('Generated checks and conversions','Can reject the call before Blink implementation runs.')+arrow('invoke if checks pass')+box('Blink C++ method','May perform local work or request browser-side work.'))
  ),
  explanation:'If an implementation breakpoint is never hit, first distinguish an absent API from a present API whose generated binding throws during conversion. Those failures occur at different points. For an overloaded method, inspect the combined IDL and generated dispatcher; a single handwritten C++ overload cannot explain the whole JavaScript contract.',
  question:'Would editing the generated C++ file be a durable fix for a wrong IDL type?',
  answer:'No. Regeneration would replace that edit. Fix the source declaration or generator rule that produced it, then regenerate and test the web-visible behavior.',
  sources:['third_party/blink/renderer/bindings/scripts/','third_party/blink/renderer/bindings/']
}],
lifetime:[{
  after:'Tracing answers reachability',
  title:'A cycle can be alive or collectible depending on its roots',
  lead:'Solid arrows are reported strong references; the dashed arrow is weak. The same two-object cycle has a different outcome depending on whether a root can reach it through strong edges.',
  diagram:columns(
    lane('Rooted cycle',reachabilityGraph(true)),
    lane('Only a weak path into the cycle',reachabilityGraph(false))
  )+`<div class="visual-rule">A weak edge from a reachable owner does not turn the unrooted cycle into a strongly reachable one.</div>`,
  explanation:'Tracing begins from roots and follows reported strong references. It does not count how many neighbors point at an object. That is why tracing can reclaim an unreachable cycle that simple reference counting would retain. In real Blink code, inspect the containing object’s Trace method as well as the field type; the collector needs to see the edge.',
  question:'A Member points to B. Is that enough to prove B stays alive?',
  answer:'No. The owner must itself be reachable, and its tracing must report the strong edge. An unreachable owner does not make its fields into roots. Weak references and cross-heap wrappers add different edge semantics that must be checked separately.',
  sources:['include/cppgc/member.h','include/cppgc/persistent.h']
},{
  after:'A concrete teardown investigation',
  title:'Object lifetime and operation validity run on separate timelines',
  lead:'Consider work started by document A. This example deliberately keeps its object rooted after navigation so you can see what garbage collection alone cannot decide.',
  diagram:table('Delayed callback after navigation',['Stage','Document A','Managed object','Queued operation'],[
    ['Start','Active','Reachable','Waiting for a result'],
    ['Navigate away','Detached or otherwise no longer current','Can still be reachable through an owner or root','May still be queued unless cancelled'],
    ['Callback dispatch','B may now be current','Dereferencing may be memory-safe','Must establish whether work for A is still allowed'],
    ['Cleanup','Lifecycle determines remaining work','Can be collected when no longer strongly reachable','Complete, cancel, or report failure under the API contract']
  ]),
  explanation:'There are three separate obligations: a valid memory reference, the correct execution sequence, and a still-valid operation. A persistent handle establishes reachability; it does not establish the other two. A weak callback can avoid some stale dereferences, but it also does not substitute for document-level authority checks.',
  question:'What should a regression test delay to expose this bug?',
  answer:'Delay the result until after navigation or document teardown, then assert the API’s specified outcome. Also check which document’s state changed. Merely asserting “no crash” can miss a result incorrectly applied to B.',
  sources:['include/cppgc/persistent.h','third_party/blink/renderer/platform/heap/member.h']
}],
storage:[{
  after:'Navigation can destroy or retain a document',
  title:'Returning to a page can restore an object or reconstruct it',
  lead:'These two paths can produce similar pixels. They make very different promises about the old document’s in-memory state.',
  diagram:box('Leave document A')+columns(
    lane('Eligible for BFCache and retained',arrow('freeze and retain')+box('A remains in memory','It is not the current active page.')+arrow('Back, if still restorable')+box('Restore A','Reuse the retained document and context.')),
    lane('Not retained, or later evicted',arrow('discard')+box('Old document state is gone','Persistent storage has its own lifetime.')+arrow('Back')+box('Create a new document','Load and reconstruct state from available sources.'))
  ),
  explanation:'BFCache retention is temporary and conditional. A retained entry can be evicted before the user returns. Neither path means that all origin storage disappears on navigation, and neither lets a frozen document behave as though it were still active. To debug lost state, first establish which path occurred.',
  question:'A global JavaScript variable survives Back. Does that prove it was written to disk?',
  answer:'No. The original context may have been retained and restored. Check BFCache evidence and distinguish in-memory state from an explicit storage write. The same appearance can also be reconstructed by new script.',
  sources:['docs/bfcache.md','docs/user_data_storage.md']
}],
features:[{
  after:'Several gates can affect exposure',
  title:'Presence, permission, and success are separate questions',
  lead:'Use these checkpoints when an API behaves differently in a web test and a normal browser. They are a diagnostic order, not a universal call stack for every feature.',
  diagram:table('Locate the first differing condition',['Checkpoint','Evidence to inspect','Possible observation'],[
    ['Implementation is built','Build configuration and implementation files.','The C++ code exists in this binary.'],
    ['Feature state permits exposure','Generated runtime accessor, defaults, overrides, dependencies.','The test enables a feature that the normal run leaves disabled.'],
    ['This context exposes the member','IDL exposure, world, and any origin-trial condition.','The property exists in one context but not another.'],
    ['This call is allowed and succeeds','Arguments, permission checks, browser service, current lifecycle.','The property exists but the call fails or rejects.']
  ]),
  explanation:'Finding a method in the binary does not establish JavaScript visibility. Finding a JavaScript property does not establish permission to perform the requested operation. Record the first checkpoint at which two runs differ; later implementation debugging cannot explain an API that was never installed.',
  question:'A virtual test suite passes with a feature enabled. What additional evidence establishes the default user experience?',
  answer:'Inspect normal runtime configuration, platform conditions, context exposure, and rollout at the relevant revision. The test establishes behavior under its own setup, including overrides.',
  sources:['third_party/blink/renderer/platform/runtime_enabled_features.json5','docs/testing/web_tests.md']
}],
graphs:[{
  after:'Branches need matching value and control',
  title:'A PHI preserves the pairing between path and value',
  lead:'This is a teaching graph for the branch below, using the paper’s REGION/PHI terminology. It is not a dump of a current V8 compiler pipeline.',
  diagram:code('if (flag) x = 1;\nelse      x = 2;\nreturn x;')+columns(lane('True predecessor',box('Control slot 1','Value slot 1: x₁ = 1')),lane('False predecessor',box('Control slot 2','Value slot 2: x₂ = 2')))+arrow('preserve predecessor positions at the join')+box('REGION(control₁, control₂)','PHI(REGION, x₁, x₂) selects the value associated with the arriving control path.')+arrow('selected value')+box('return x'),
  explanation:'The important information is the correspondence, not the drawing’s left and right positions. If a transformation swaps the REGION inputs without swapping the matching PHI values, a true branch can produce 2. Each individual value still looks valid; the relationship between them is what broke.',
  question:'Can an optimizer swap both the control slots and the corresponding value slots?',
  answer:'For this join, preserving the correspondence preserves its selection meaning. A complete transformation must also preserve other users and dependencies. Check every PHI attached to the changed join, not just the one shown.',
  sources:[]
},{
  after:'Memory is an abstract value with a dependency chain',
  title:'An effect edge carries ordering even without a numeric result',
  lead:'Use a simple memory example with one known location. Real JavaScript property operations can have additional semantics; this graph isolates the ordering problem.',
  diagram:code('store(address, 1);\nstore(address, 2);\nresult = load(address);')+box('Initial memory M₀')+arrow('STORE(address, 1) consumes M₀')+box('Memory M₁ · location contains 1')+arrow('STORE(address, 2) consumes M₁')+box('Memory M₂ · location contains 2')+arrow('LOAD(address) consumes M₂')+box('result = 2'),
  explanation:'The second store need not use a numeric value produced by the first. It still must happen later because both affect the same location. The memory-state edges express that constraint. For two provably independent locations, an optimizer may have more freedom, but proving independence is the job of alias analysis.',
  question:'If the load consumed M₀ instead of M₂, what illegal schedule would become possible?',
  answer:'The load could observe the old value before either store. The graph would have lost the source program’s memory order. This is why removing an effect edge requires a semantic argument.',
  sources:[]
}],
factory:[{
  after:'Builder, build, and task',
  title:'Configuration, execution, and test attempts have different identities',
  lead:'A builder name tells you which configured job you requested. To reproduce one result, you also need the identities of the build, its inputs, and its test attempts.',
  diagram:box('Builder configuration','Recipe, platform, and scheduling choices.')+arrow('one scheduled invocation')+box('Build record','Source and patch inputs, resolved recipe/configuration, logs, and results.')+arrow('dispatch work; exact layout depends on builder')+columns(box('Test task / shard 1','Binary identity, environment, and result.'),box('Test task / shard 2','Binary identity, environment, and result.'))+arrow('a retry creates another observed attempt')+box('Compare attempts','Keep the original failure and record what changed.'),
  explanation:'Two green runs with the same builder name need not have tested the same checkout, binary, or environment. Likewise, a retry is another observation, not an erasure of the first failure. Begin an attribution table with patch/base revision, binary, shard, environment, and attempt outcome before deciding that a failure is flaky or caused by the patch.',
  question:'A retry passes. Which claim can you safely make?',
  answer:'The failure did not recur in that attempt. To evaluate causation, compare baseline and patched runs under controlled conditions. A timing-sensitive regression can fail intermittently.',
  sources:['docs/infra/glossary.md','docs/cq_fault_attribution.md']
}],
release:[{
  after:'How a fix moves to a branch',
  title:'Landing and shipping follow different branches of evidence',
  lead:'The letters below are hypothetical commits. A release branch shares history with main at the cut, then develops independently.',
  diagram:box('Shared history up to branch cut C')+columns(
    lane('Main',arrow('continues')+box('Commit D')+arrow('later')+box('Fix F lands')),
    lane('Release branch',arrow('branched at C')+box('Branch-specific commits')+arrow('approved backport, if selected')+box('Backport F′','May have a different commit ID.')+arrow('build and deliver')+box('Release artifact and rollout','Verify which revision was built and who received it.'))
  ),
  explanation:'F landing on main does not place it into a branch that already split at C. An approved backport can create F′, which may need adaptation to older code. Even branch inclusion is not the same observation as a built artifact or completed rollout. Each step needs its own record.',
  question:'A release notes page mentions the fix. What source evidence would strengthen an inclusion claim?',
  answer:'Identify the branch commit containing the fix and the revision used for the particular release build. Then distinguish inclusion in that artifact from deployment to a particular user population.',
  sources:['docs/process/release_cycle.md','chrome/VERSION']
}],
diagnostics:[{
  after:'A trace shows temporal relationships',
  title:'Wall-clock latency includes work and waiting',
  lead:'This invented 100 ms operation spends only 10 ms executing on the caller thread. Its long asynchronous span must not be read as 100 ms of caller CPU time. Read the labeled durations; the widths are schematic.',
  diagram:`<div class="visual-duration" role="img" aria-label="An operation lasts 100 milliseconds: 5 milliseconds caller setup, 90 milliseconds waiting or remote work, and 5 milliseconds caller completion."><div class="visual-duration-parts"><span class="visual-work">5 ms<br>setup</span><span class="visual-idle">90 ms<br>waiting / remote work</span><span class="visual-work">5 ms<br>finish</span></div><div class="visual-duration-total">Start ← 100 ms wall-clock duration → Complete</div></div>`,
  explanation:'A CPU profile of the caller may show little work even when the operation feels slow. The middle interval could include a remote service, queueing, I/O, or other causes; the broad span alone does not choose among them. Use a trace to connect posting, dispatch, remote work, and completion, then profile the process and interval where CPU work is actually suspected.',
  question:'If you made both caller portions twice as fast, what would the new duration be in this simplified model?',
  answer:'95 ms: 2.5 + 90 + 2.5. Optimizing the caller cannot remove a dominant wait. This arithmetic is useful for rejecting an optimization hypothesis before undertaking a large rewrite; real overlapping work requires a critical-path analysis.',
  sources:['docs/trace_events.md','docs/profiling.md']
}]
};

export function figureMarkup(lesson,item,index){
  const id=`figure-${lesson.id}-${index+1}`;
  return `<figure class="concept-figure" id="${id}" aria-labelledby="${id}-title">
    <figcaption><span>Figure ${lesson.n}.${index+1}</span><strong id="${id}-title">${item.title}</strong></figcaption>
    <p>${item.lead}</p><div class="visual-diagram">${item.diagram}</div><p>${item.explanation}</p>
    <details class="visual-check"><summary>${item.question}</summary><p>${item.answer}</p></details>
    ${item.sources.length?`<p class="visual-sources">Inspect the source: ${item.sources.map(path=>`<code>${path}</code>`).join(' · ')}</p>`:''}
  </figure>`;
}

export function withFigures(lesson,sections){
  const entries=figures[lesson.id]||[];
  return sections.map(([title,body])=>[title,body+entries.map((item,i)=>item.after===title?figureMarkup(lesson,item,i):'').join('')]);
}
