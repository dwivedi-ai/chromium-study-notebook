// Relationships are bidirectional so the same explanation is available
// from either chapter and from the architecture map.
export const connections = [
  ['checkout','factory','Reproduce the input before blaming the code','A local build and a tryjob can disagree because of dependency pins, generated GN settings, or the patch base. Compare those inputs before investigating a compiler failure.'],
  ['rolls','remote','A dependency roll changes cache identity','A changed header or toolchain should change the declared action inputs. A suspicious cache hit is a reason to inspect dependency discovery.'],
  ['owners','startup','An owner can exist before its process is ready','A RenderProcessHost is browser-side management state. Child launch, initialization, and document commit are separate transitions.'],
  ['ipc','security','The receiver decides which requests are authorized','Mojo defines message shape. Browser-side context and validation decide whether the sender may perform the operation.'],
  ['navigation','network','Commit and resource loading have different failure paths','A document can commit while a stylesheet is still pending. Find the first failed phase before choosing a source directory to investigate.'],
  ['navigation','lifetime','A pending callback may belong to an old document','Trace both the callback owner and the document it refers to. An object remaining in memory does not authorize work for the current page.'],
  ['lifetime','storage','A retained object is not necessarily an active page','BFCache can keep a document alive while it is paused. Check lifecycle state as well as reachability before acting on it.'],
  ['parsing','bindings','Creating an element can enter JavaScript','Custom-element construction connects parser state to author code. Look for reentrancy assumptions at that boundary.'],
  ['time','pixels','Scheduling determines when changes can become visible','A long main-thread task can delay style and layout even when compositor work continues. Locate the blocked stage in a trace.'],
  ['bindings','features','Implementation and exposure are separate','A C++ method can exist while generated bindings omit the API in a particular context. Follow IDL and feature conditions before editing the method.'],
  ['features','release','Code inclusion does not prove user exposure','A release can contain a feature whose runtime gates are still off. Record branch, build, context, and feature state.'],
  ['graphs','time','Dependencies constrain legal execution order','A compiler graph encodes value, control, and effect order. A task graph also needs causal edges, but its queues and scheduling policies are a separate mechanism.'],
  ['pixels','diagnostics','A timeline can locate the first missing stage','Check style, layout, paint, compositor commit, raster, and display in order. The earliest divergence narrows the source investigation.'],
  ['diagnostics','journey','Combine source and runtime evidence','The page-load case asks you to pair each cross-process transition with a source path and an observed event.'],
  ['journey','independent','Repeat the investigation with less guidance','Change one condition, such as adding an iframe or service worker, and identify which owners and transitions change.']
];
