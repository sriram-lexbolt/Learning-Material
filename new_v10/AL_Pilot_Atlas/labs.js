'use strict';
// Labs: JS copies of three rules from the v5.1.2 code. Phase lab is verified against the Python code by tools/verify_labs.py.
window.WIDGETS = {};
const opt = (id, label, options, val) => `<label>${label}<select id="${id}">${options.map(([v, t]) => `<option value="${v}" ${v === val ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
const YN = [['no', 'No'], ['yes', 'Yes']];

// 1. Status ladder: pilot_assessment.assess() precedence.
window.LADDER = function (s) {
  let status, why;
  if (s.scope === 'excluded' || s.scope === 'future') { status = 'not_applicable'; why = 'Scope excludes it (fact = No, reviewer exclusion, or not in force on the planned build date).'; }
  else if (s.decision === 'retest') { status = 'retest'; why = 'A reviewer decision says retest.'; }
  else if (s.decision === 'review') { status = 'engineering_review'; why = 'A reviewer decision says review.'; }
  else if (s.gvw === 'yes') { status = 'engineering_review'; why = 'N1 request declares GVW above 3,500 kg: review classification before reusing N1 evidence.'; }
  else if (s.scope === 'unknown') { status = 'edition_review'; why = 'A scope fact this row depends on is unknown.'; }
  else if (s.eligible === 'yes') { status = 'reuse'; why = 'An eligible accepted report exists.'; }
  else if (s.gaps === 'yes') { status = 'input_gap'; why = 'A required input is missing / unresolved / conflicting.'; }
  else if (s.confirmed === 'no') { status = 'edition_review'; why = 'No reviewer confirmation of edition and applicability for the current seed.'; }
  else if (s.changed === 'yes') { status = 'engineering_review'; why = 'A mapped value changed and nothing covers it.'; }
  else { status = 'missing_evidence'; why = 'Configuration unchanged but no eligible evidence.'; }
  if (s.update !== 'none' && s.update !== 'upcoming' && (s.update === 'scope_review' || s.updConfirmed === 'no')) { status = 'edition_review'; why = 'Overridden by an active regulatory update: ' + (s.update === 'scope_review' ? 'set Vehicle scope and ' : '') + (s.updConfirmed === 'no' ? 'confirm the new edition.' : 'review scope.'); }
  return { status, why };
};
const LABEL = { reuse: ['Evidence reused', 'green'], input_gap: ['Inputs needed', 'amber'], edition_review: ['Edition review', 'blue'], engineering_review: ['Engineering review', 'orange'], missing_evidence: ['Evidence missing', 'amber'], retest: ['Retest recorded', 'red'], not_applicable: ['Not applicable', ''] };
WIDGETS.ladder = {
  title: 'Status ladder: why does this row say that?', sub: 'Set the facts for one test row; the app\'s precedence picks the status. Code: `pilot_assessment.assess()`.',
  render(el) {
    el.innerHTML = `<div class="controls">
      ${opt('l-scope', 'Scope for this row', [['applies', 'Applies'], ['unknown', 'A scope fact is unknown'], ['excluded', 'Excluded (fact = No / reviewer exclusion)'], ['future', 'Not yet in force on planned build date']], 'applies')}
      ${opt('l-decision', 'Reviewer engineering decision', [['none', 'None'], ['review', 'Engineering / CEA review required'], ['retest', 'New verification / retest required']], 'none')}
      ${opt('l-gvw', 'N1 request with GVW above 3,500 kg?', YN, 'no')}
      ${opt('l-eligible', 'Is any report eligible (passes every reuse check)?', YN, 'no')}
      ${opt('l-gaps', 'Missing / unresolved required inputs?', YN, 'no')}
      ${opt('l-confirmed', 'Edition & applicability confirmed by a reviewer?', YN, 'yes')}
      ${opt('l-changed', 'Did a mapped value change?', YN, 'yes')}
      ${opt('l-update', 'Active regulatory update on this test?', [['none', 'None'], ['upcoming', 'Yes, phase upcoming'], ['scope_review', 'Yes, phase scope review'], ['effective', 'Yes, phase effective']], 'none')}
      ${opt('l-updConfirmed', '…new edition confirmed after activation?', YN, 'no')}
     </div><div class="result" id="l-out"></div>
     <p><b>Presets:</b> <button class="btn" data-p="bada">Bada Dost braking after 5.13</button> <button class="btn" data-p="demo">Demo N1 braking after 5.13</button> <button class="btn" data-p="horn">Horn after a rule change</button> <button class="btn" data-p="abs">ABS with wrong edition text</button></p>`;
    const ids = ['scope', 'decision', 'gvw', 'eligible', 'gaps', 'confirmed', 'changed', 'update', 'updConfirmed'];
    const P = { bada: { eligible: 'no', gaps: 'yes', confirmed: 'yes', changed: 'yes' }, demo: { eligible: 'no', gaps: 'no', confirmed: 'yes', changed: 'yes' }, horn: { eligible: 'yes', gaps: 'no', confirmed: 'yes', changed: 'no', update: 'effective', updConfirmed: 'no' }, abs: { eligible: 'no', gaps: 'no', confirmed: 'yes', changed: 'no' } };
    const draw = () => { const s = {}; ids.forEach(k => s[k] = el.querySelector('#l-' + k).value); const r = LADDER(s); const [t, c] = LABEL[r.status]; el.querySelector('#l-out').innerHTML = `<span class="pill ${c}">${t}</span> ${r.why}`; };
    el.addEventListener('change', draw);
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const base = { scope: 'applies', decision: 'none', gvw: 'no', update: 'none', updConfirmed: 'no' }; const p = { ...base, ...P[b.dataset.p] }; ids.forEach(k => el.querySelector('#l-' + k).value = p[k]); draw(); });
    draw();
  }
};

// 2. Rule-change phase: regulatory_updates.match().
window.PHASE = function (u, o, today) {
  if (u.model_route !== 'all' && o.route && o.route !== u.model_route) return 'not affected';
  let unknown = u.model_route !== 'all' && !o.route, future;
  if (o.manufacture) future = o.manufacture < u.effective;
  else { future = today < u.effective; unknown = true; }
  return future ? 'upcoming' : unknown ? 'scope_review' : 'effective';
};
WIDGETS.phase = {
  title: 'Rule-change phase calculator', sub: 'For one active update and one request. Code: `regulatory_updates.match()` (verified against the Python by `tools/verify_labs.py`).',
  render(el) {
    const today = new Date().toISOString().slice(0, 10);
    el.innerHTML = `<div class="controls">
      <label>Update effective date<input type="date" id="p-eff" value="2026-01-01"></label>
      ${opt('p-uroute', 'Update model route', [['all', 'All models'], ['new', 'New models only'], ['existing', 'Existing models only']], 'all')}
      <label>Request planned manufacture date (blank = not set)<input type="date" id="p-man" value=""></label>
      ${opt('p-route', 'Request model route', [['', 'Unknown / review'], ['new', 'New model'], ['existing', 'Existing model']], '')}
      <label>Today<input type="date" id="p-today" value="${today}"></label></div><div class="result" id="p-out"></div>`;
    const M = { upcoming: 'Plan only; old evidence gates stay until the date.', scope_review: 'Set Vehicle scope (manufacture date and/or model route), then confirm the edition.', effective: 'Confirm the new edition, fill required labels, get evidence under the new edition.', 'not affected': 'This request is outside the update\'s model route.' };
    const draw = () => { const v = id => el.querySelector(id).value; const p = PHASE({ effective: v('#p-eff'), model_route: v('#p-uroute') }, { manufacture: v('#p-man') || null, route: v('#p-route') || null }, v('#p-today')); el.querySelector('#p-out').innerHTML = `<b>Phase: ${p}</b><br>${M[p]}`; };
    el.addEventListener('input', draw); el.addEventListener('change', draw); draw();
  }
};

// 3. Will this report be reused? pilot_assessment.compare_report() checks.
WIDGETS.reuse = {
  title: 'Will this report be reused?', sub: 'Tick what is true. Every unticked item is a reason the app prints under `Not eligible`. Code: `pilot_assessment.compare_report()`.',
  render(el) {
    const C = [
      ['Source vehicle has a recorded homologation', 'Source vehicle has no recorded homologation'],
      ['Report and request are both demo, or both customer', 'Demo evidence is isolated from customer vehicles'],
      ['Report status is approved', 'Report has not been accepted or was withdrawn'],
      ['Report result is pass', 'Passing result not established'],
      ['Stored file fingerprint still matches', 'Report bytes missing or hash mismatch'],
      ['No expiry, or valid until today or later', 'Expired or validity unconfirmed'],
      ['Request has a reviewer edition confirmation (current seed)', 'Target test edition and applicability need confirmation'],
      ['Confirmed edition text = report edition text', 'Test edition does not match'],
      ['Request category is in the report\'s categories', 'Vehicle category outside report scope'],
      ['Every mapped value equals the coverage (or is inside an accepted CEA with the same edition)', 'N test parameter(s) outside recorded coverage'],
      ['No missing / unresolved required inputs on the request', 'Incomplete test inputs / unresolved source references'],
      ['Request maps at least the parameters the report covered', 'Target has fewer parameters than the recorded test scope'],
      ['No active rule change requiring a different edition', 'Regulatory update: evidence uses a superseded or different edition']];
    el.innerHTML = `<ul class="check">${C.map((c, i) => `<li><label><input type="checkbox" data-i="${i}" checked>${c[0]}</label></li>`).join('')}</ul><div class="result" id="r-out"></div>`;
    const draw = () => { const bad = [...el.querySelectorAll('[data-i]')].filter(x => !x.checked).map(x => C[+x.dataset.i][1]); el.querySelector('#r-out').innerHTML = bad.length ? `<span class="pill amber">Not eligible</span><ul>${bad.map(b => `<li>${b}</li>`).join('')}</ul>` : '<span class="pill green">Eligible</span> The row becomes Evidence reused (unless a scope/decision rule above it wins).'; };
    el.addEventListener('change', draw); draw();
  }
};
