"""Check the atlas Phase lab (labs.js PHASE) against the real regulatory_updates.match() on many cases."""
import sys, json, itertools, subprocess, os
from datetime import date, timedelta
app, atlas = sys.argv[1], sys.argv[2]
sys.path.insert(0, app)
os.environ.setdefault('VALIDATION_DATA_DIR', os.path.join(os.path.dirname(atlas), 'practice_data'))
from validation.regulatory_updates import match
t = date.today()
dates = [(t - timedelta(days=400)).isoformat(), t.isoformat(), (t + timedelta(days=200)).isoformat()]
cases = []
for eff, uroute, man, route in itertools.product(dates, ['all', 'new', 'existing'], [None] + dates, [None, 'new', 'existing']):
    u = {'state': 'active', 'test_ids': ['in-horn-installation'], 'categories': ['N1'], 'powertrains': ['diesel'], 'model_route': uroute, 'effective_date': eff}
    o = {'category': 'N1', 'powertrain': 'diesel', 'regulatory_profile': {'manufacture_date': man, 'model_route': route}}
    py = match(u, o, 'in-horn-installation') or 'not affected'
    cases.append({'u': {'effective': eff, 'model_route': uroute}, 'o': {'manufacture': man, 'route': route}, 'today': t.isoformat(), 'py': py})
js = "global.window=global;require(%r);const c=JSON.parse(require('fs').readFileSync(0,'utf8'));let bad=0;for(const x of c){const j=window.PHASE(x.u,x.o,x.today);if(j!==x.py){bad++;console.log('MISMATCH',JSON.stringify(x),j)}}console.log(c.length+' cases, '+bad+' mismatches');process.exit(bad?1:0)" % os.path.join(atlas, 'labs.js').replace(chr(92), '/')
r = subprocess.run(['node', '-e', js], input=json.dumps(cases), text=True, capture_output=True)
print(r.stdout, r.stderr); sys.exit(r.returncode)
