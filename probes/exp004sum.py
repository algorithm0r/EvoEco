# Summarize exp004 (giftprobe) runs as EXPLOG tables, exp003's columns plus where the carer's
# gifts went on days the sum paid but the child got none, and the run totals.
#   python probes/exp004sum.py [exp004_child-projection]
import json, os, sys
d = sys.argv[1] if len(sys.argv) > 1 else 'exp004_child-projection'
base = os.path.join(os.path.dirname(__file__), '..', 'results', d)
for f in sorted(os.listdir(base)):
    if not f.endswith('.json'): continue
    r = json.load(open(os.path.join(base, f)))
    r = r.get('data', r)
    print('From', f[:-5])
    print('| level | days | in hand | store | got | died | pays | loss | weight | w×gain | carer | paid, got none | went to charge / other child / adult / nobody |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    T = dict(days=0, got=0, died=0, pays=0, run=0, hand=0)
    for k, b in sorted(r['byLevel'].items(), key=lambda x: int(x[0])):
        g = b.get('carerGaveInsteadTo', {})
        print(f"| {int(k)} | {b['childDays']} | {b['carerHeldDay']} | {b['carerStoreHeldDay']} | {b['gotFood']} | {b['died']} | {b['sumPays']}/{b['sumsRun']} | "
              f"{b['meanCarerLoss']:.3f} | {b['meanWeight']:.3f} | {b['meanWeightedGain']:.3f} | {b['meanCarerLevel']:.2f} | {b.get('paysButGotNothing', '')} | "
              f"{g.get('charge', '')} / {g.get('otherChild', '')} / {g.get('adult', '')} / {g.get('nobody', '')} |")
        T['days'] += b['childDays']; T['got'] += b['gotFood']; T['died'] += b['died']; T['pays'] += b['sumPays']; T['run'] += b['sumsRun']; T['hand'] += b['carerHeldDay']
    print(f"| all | {T['days']} | {T['hand']} | | {T['got']} | {T['died']} | {T['pays']}/{T['run']} | | | | | | |")
    print('totals:', json.dumps(r.get('totals')))
    print()
