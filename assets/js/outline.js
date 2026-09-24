// The teaching order is explicit. Every teaching section remains in the
// reading path; the additional sections below introduce or connect the
// deeper walkthroughs at the point where they are useful.
export const outline = {
  checkout: [
    'A checkout is a graph of three dependency types',
    'What fetch, gclient, and the three local files own',
    'How the restricted DEPS grammar protects the reader',
    'The sync queue and its epilogue',
    'Pins, generated settings, and toolchain identity',
    'Compiler versions are part of the checkout',
    'What a CI checkout actually does'
  ],
  rolls: [
    'What a roll changes',
    'How setdep edits without rewriting the file',
    'What an autoroller does',
    'The submodule migration is a two-representation state',
    'A roll as a reproducibility test'
  ],
  remote: [
    'A compile command is not its complete input',
    'The useful idea that survived Goma',
    'Why the tools changed',
    'What remote execution stores',
    'Which build switch actually selects a remote action',
    'Why a cache hit is a technical claim',
    'Debug a remote-only failure'
  ],
  owners: [
    'The browser and renderer processes',
    'Why Blink forked, and why that history matters',
    'Blink’s directory boundaries are enforced',
    'The public Blink API is an embedder contract',
    'Tabs, frames, and processes are different',
    'The objects behind one tab',
    'Process placement has more than one identity',
    'A frame tree is not always the whole tab',
    'What changes when a frame navigates',
    'What survives a renderer crash'
  ],
  navigation: [
    'The three URLs you may see',
    'Why the address bar sometimes shows a pending URL',
    'The old document remains real while a request is pending',
    'What cancellation means',
    'Two overlapping navigations are possible',
    'A cross-document call path',
    'Navigation and loading cross different interfaces',
    'Follow one input event across the boundary'
  ],
  parsing: [
    'The input is text; the implementation uses IDs',
    'Generated HTML and CSS tables at this revision',
    'The HTML path from token to element',
    'Why element construction can run script',
    'Parsing must share the main thread',
    'Where CSS parsing leads next'
  ],
  time: [
    'Main thread, compositor thread, and workers',
    'A task is scheduled work, not a suspended function',
    'Why frame-specific task queues exist',
    'How to follow an asynchronous call',
    'Tasks, microtasks, and frame updates',
    'A more precise microtask rule',
    'A frame update is a scheduled transaction',
    'How to prove a thread claim'
  ],
  pixels: [
    'Style, layout, and paint',
    'How style avoids testing every selector',
    'Style and layout produce different answers',
    'The lifecycle is an enforced state machine',
    'From immutable stage outputs to caches',
    'Pre-paint and paint record a scene',
    'Why the compositor keeps more than one tree',
    'The handoff from paint to Viz',
    'A useful performance experiment',
    'Using the stages to debug'
  ],
  bindings: [
    'Web IDL is a program input',
    'The scale and phases of Web IDL generation',
    'What happens before a generated binding exists',
    'Where the JavaScript object lives',
    'Contexts, worlds, and snapshots',
    'From a script element to running JavaScript',
    'When an API needs browser-process work'
  ],
  lifetime: [
    'Why Blink uses tracing garbage collection',
    'Strong and weak references',
    'Oilpan, cppgc, and the remaining allocators',
    'Reachable does not mean valid for the current document',
    'A concrete teardown investigation'
  ],
  features: [
    'A feature row is only the first gate',
    'Several gates can affect exposure',
    'An origin trial is a context check',
    'Test expectations are part of the feature story',
    'From implementation to shipping'
  ],
  graphs: [
    'Why a list of instructions can overconstrain optimization',
    'Start from SSA and ordered inputs',
    'Value, control, and effect edges',
    'REGION, PHI, and projections encode control precisely',
    'Work through a branch and a memory write',
    'Memory is an abstract value with a dependency chain',
    'What execution means without blocks',
    'The implementation and parse-time optimization',
    'What the paper measured, and what it did not',
    'The cost of a flexible graph',
    'Use the same reasoning outside a compiler'
  ],
  factory: [
    'Four pipelines share LUCI, but have different jobs',
    'Builder, build, and task',
    'How configuration reaches the fleet',
    'The Linux Builder as a configuration example',
    'Two generations of test configuration coexist',
    'What a tryjob actually tests',
    'From upload to a selected tryjob',
    'Why the orchestrator and compilator are separate',
    'The retry ladder is causal attribution',
    'Submission, numbering, and the tree are separate systems',
    'Post-submit failures have different owners',
    'The infrastructure has deliberate costs'
  ],
  release: [
    'Main and branch answer different questions',
    'The pinned cadence and branch identity',
    'What the version fields identify',
    'How a fix moves to a branch',
    'Release scripts turn known-good source into versioned refs',
    'A worked inclusion check'
  ],
  independent: [
    'Find the relevant code',
    'Choose and explain one behavior',
    'When the evidence runs out',
    'What a strong investigation should contain',
    'Make the next investigation less guided'
  ]
};

// Entries are inserted immediately before the named anchor in outline.
// This keeps the whole collected teaching corpus in the chapters, without
// leaving the original research writings as a second reading track.
export const additions = {
  checkout: [
    ['A checkout is a graph of three dependency types', 'What DEPS and gclient do'],
    ['What fetch, gclient, and the three local files own', 'How a DEPS file becomes a checkout'],
    ['How the restricted DEPS grammar protects the reader', 'Why DEPS is a restricted language'],
    ['The sync queue and its epilogue', 'What happens during sync'],
    ['Pins, generated settings, and toolchain identity', 'How dependencies affect the build'],
    ['Compiler versions are part of the checkout', 'From remote compilation to Siso']
  ],
  rolls: [
    ['What an autoroller does', 'How an automated roll remains reviewable'],
    ['The submodule migration is a two-representation state', 'Why .gitmodules does not replace DEPS yet']
  ],
  remote: [['Which build switch actually selects a remote action', 'Where Siso is selected']],
  owners: [
    ['The browser and renderer processes', 'Where the module boundaries matter'],
    ['Process placement has more than one identity', 'Why site and frame are separate choices']
  ],
  navigation: [
    ['The three URLs you may see', 'From request to commit'],
    ['Navigation and loading cross different interfaces', 'A document also needs a loader']
  ],
  parsing: [['Generated HTML and CSS tables at this revision', 'Read generated code as part of the source']],
  time: [
    ['A task is scheduled work, not a suspended function', 'What a task queue does'],
    ['A frame update is a scheduled transaction', 'When rendering can happen']
  ],
  pixels: [['Why the compositor keeps more than one tree', 'Commit, raster, and display']],
  bindings: [
    ['Web IDL is a program input', 'What Web IDL describes'],
    ['Where the JavaScript object lives', 'From JavaScript to Blink'],
    ['What happens before a generated binding exists', 'Generated tables also shape HTML and CSS'],
    ['When an API needs browser-process work', 'A complete feature investigation']
  ],
  lifetime: [
    ['Why Blink uses tracing garbage collection', 'Callbacks after a document goes away'],
    ['Strong and weak references', 'Tracing answers reachability'],
    ['Oilpan, cppgc, and the remaining allocators', 'Why multiple memory systems coexist']
  ],
  features: [
    ['A feature row is only the first gate', 'A feature starts as structured data'],
    ['Test expectations are part of the feature story', 'What a web test establishes']
  ],
  graphs: [
    ['Why a list of instructions can overconstrain optimization', 'What the graph records'],
    ['Value, control, and effect edges', 'Why this representation helps and costs'],
    ['REGION, PHI, and projections encode control precisely', 'Branches need matching value and control'],
    ['What the paper measured, and what it did not', 'What the old paper can and cannot tell you']
  ],
  factory: [
    ['Post-submit failures have different owners', 'From passing tests to a release', 'Landing is separate from shipping'],
    ['How configuration reaches the fleet', 'Configuration is compiled before a build runs'],
    ['The Linux Builder as a configuration example', 'Expand one builder instead of memorizing the fleet'],
    ['From upload to a selected tryjob', 'Follow a change through the commit queue'],
    ['The retry ladder is causal attribution', 'A red test is evidence, not a verdict', 'Read a CQ failure as a sequence of comparisons']
  ],
  release: [
    ['Release scripts turn known-good source into versioned refs', 'What the V8 release scripts illustrate'],
    ['A worked inclusion check', 'A release question you can actually answer']
  ],
  independent: [['What a strong investigation should contain', 'Write a source-backed engineering note']]
};
