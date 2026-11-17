# Summarize exp008 (mothersprobe): for each mother dead of hunger and her camp peers over the
# same days, means over the window's first 30 days and its last 15: evening food level, food
# held, gathered, net through exchange, her charges' net through exchange, children, infants,
# hours after care, and food eaten (by balance: held before + gathered + exchange − held after;
# it counts rot and goods picked up or left as eaten). Food in food-level units a day.
#   python probes/exp008sum.py
import json, os
base = os.path.join(os.path.dirname(__file__), '..', 'results', 'exp008_mothers-starve')
K = ['food', 'held', 'got', 'xnet', 'kidsXnet', 'kids', 'infants', 'cap', 'ate']
def stats(W):
    for i, r in enumerate(W):
        r['ate'] = (W[i - 1]['held'] if i else None)
        r['ate'] = None if r['ate'] is None else r['ate'] + r['got'] + r['xnet'] - r['held']
    def m(rs, k):
        v = [r[k] for r in rs if r.get(k) is not None]
        return sum(v) / len(v) if v else float('nan')
    early, late = W[:-15], W[-15:]
    return {k: (m(early, k), m(late, k)) for k in K}
for f in sorted(os.listdir(base)):
    if not f.endswith('.json'): continue
    r = json.load(open(os.path.join(base, f))); r = r.get('data', r)
    print('From', f[:-5], '-', len(r['cases']), 'mothers dead of hunger')
    print('| who | year | age | ' + ' | '.join(K) + ' |'); print('|---' * (len(K) + 3) + '|')
    agg = {'dead': [], 'peer': []}
    for c in r['cases']:
        rows = [('dead', c['id'], c['age'], c['window'])] + [('peer', p['id'], p['age'], p['window']) for p in c['peers']]
        for who, i, age, W in rows:
            if len(W) < 20: continue
            s = stats(W); agg[who].append(s)
            print(f"| {who} {i} | {c['year']} | {age} | " + ' | '.join(f"{a:.2f}→{b:.2f}" for a, b in (s[k] for k in K)) + ' |')
    for who, L in agg.items():
        if not L: continue
        print(f"mean {who} (n={len(L)}): " + ', '.join(f"{k} {sum(s[k][0] for s in L)/len(L):.2f}→{sum(s[k][1] for s in L)/len(L):.2f}" for k in K))
    print()
