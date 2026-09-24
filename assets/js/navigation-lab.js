export function navigationLab(){
  return `<section class="navigation-lab" id="navigation-model" aria-labelledby="navigation-model-title">
    <div class="tiny-label">WORK THROUGH A NAVIGATION</div>
    <h2 id="navigation-model-title">When does B become the current document?</h2>
    <p>Start on page A, then request B from the address bar. Predict which document owns the page at each step. This model shows one ordinary cross-document path; it omits redirects, process selection, and error-page commits.</p>
    <div id="navigationState" aria-live="polite" aria-atomic="true"></div>
    <div class="model-actions" id="navigationActions"></div>
    <p class="model-scope">The pending URL shown here is illustrative: visible-URL policy depends on how navigation starts. The browser’s commit acknowledgement establishes the new document. Compare the model with <a href="#/lesson/navigation">navigation</a> and <a href="#/lesson/network">resource loading</a>.</p>
  </section>`;
}

export function wireNavigationLab(){
  const host=document.querySelector('#navigationState');
  if(!host)return;
  const states={
    initial:{stage:'A is active',document:'A',url:'A',work:'No navigation pending',explanation:'A owns the current document state. Requesting another URL will not immediately replace it.',actions:[['request','Request B']]},
    request:{stage:'B is pending',document:'A',url:'B (pending)',work:'Waiting for B’s response',explanation:'The address bar can show the requested URL while A is still the committed document. Current-document authority remains with A.',actions:[['response','Receive B’s headers'],['cancel','Cancel navigation']]},
    response:{stage:'B can be committed',document:'A',url:'B (pending)',work:'Response accepted; commit not acknowledged',explanation:'A successful response does not itself establish a new current document. The chosen renderer must create B and acknowledge commit.',actions:[['commit','Acknowledge B’s commit'],['cancel','Cancel before commit']]},
    commit:{stage:'B is current',document:'B',url:'B',work:'B’s stylesheet is still loading',explanation:'The browser has accepted B’s commit. Parsing, resource loads, and rendering can remain incomplete. The old document may be destroyed or retained in BFCache.',actions:[['complete','Load stylesheet'],['resourceFailure','Fail stylesheet request']]},
    complete:{stage:'B’s stylesheet loaded',document:'B',url:'B',work:'New style can enter the rendering pipeline',explanation:'Successful resource loading supplies input to style and rendering. It does not prove that new pixels have already reached the display.',actions:[]},
    resourceFailure:{stage:'A resource failed after commit',document:'B',url:'B',work:'B remains current with a failed stylesheet',explanation:'A subresource error does not undo B’s document commit. Investigate the stylesheet request and its policy checks; do not assume navigation failed.',actions:[]},
    cancel:{stage:'Pending navigation cancelled',document:'A',url:'A',work:'No new document committed',explanation:'This action cancels before commit, leaving A current. A network failure is a different case: it can lead to an error document being committed.',actions:[]}
  };
  function draw(key){
    const state=states[key];
    host.innerHTML=`<h3>${state.stage}</h3><dl class="model-state"><div><dt>Committed document</dt><dd>${state.document}</dd></div><div><dt>Visible URL in this example</dt><dd>${state.url}</dd></div><div><dt>Pending work</dt><dd>${state.work}</dd></div></dl><p>${state.explanation}</p>`;
    const actions=document.querySelector('#navigationActions');
    actions.innerHTML=state.actions.map(([next,label])=>`<button class="button" data-state="${next}">${label}</button>`).join('')+(key!=='initial'?'<button class="button model-reset" data-state="initial">Start again</button>':'');
    actions.querySelectorAll('button').forEach(button=>button.onclick=()=>{draw(button.dataset.state);actions.querySelector('button')?.focus();});
  }
  draw('initial');
}
