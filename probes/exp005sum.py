# Summarize exp005 (deathprobe) runs: deaths by cause and age group, women's deaths with children
# in care, children's deaths by whether carer and mother were alive, the yearly census; and
# exp002's deaths by cause (adult / child) over the same years, from its seasons table.
#   python probes/exp005sum.py [exp005_deaths | exp006_self-care]
import json, os, sys
from collections import Counter
R = os.path.join(os.path.dirname(__file__), '..', 'results')
SPANS = {'exp002_limit_s1_y30': (1, 30, 37), 'exp002_limit_s2_y10': (2, 10, 20)}
d5 = os.path.join(R, sys.argv[1] if len(sys.argv) > 1 else 'exp005_deaths')
for f in sorted(os.listdir(d5)):
    if not f.endswith('.json'): continue
    name = f[:-5]
    r = json.load(open(os.path.join(d5, f))); r = r.get('data', r)
    D = r['deaths']
    print('From', name, '-', len(D), 'deaths')
    def grp(x):
        return 'infant' if x['infant'] else 'child 2-14' if x['child'] else ('adult 15-44' if x['age'] < 45 else 'adult 45+') + (' F' if x['female'] else ' M')
    T = Counter((grp(x), x['cause']) for x in D)
    causes = sorted({c for _, c in T})
    groups = ['infant', 'child 2-14', 'adult 15-44 F', 'adult 15-44 M', 'adult 45+ F', 'adult 45+ M']
    print('| group | ' + ' | '.join(causes) + ' | all |'); print('|---' * (len(causes) + 2) + '|')
    for g in groups:
        row = [T.get((g, c), 0) for c in causes]
        print(f'| {g} | ' + ' | '.join(map(str, row)) + f' | {sum(row)} |')
    W = [x for x in D if not x['child'] and x['female']]
    print('women dead with children in care:', sum(1 for x in W if x['charges'] > 0), 'of', len(W),
          '| by cause:', dict(Counter(x['cause'] for x in W if x['charges'] > 0)))
    if any(x.get('woke') for x in D):   # since exp006: as it woke on the day it died
        Wk = [x for x in W if x.get('woke')]
        print('women dead (as they woke): with children in care', sum(1 for x in Wk if x['woke']['charges'] > 0), 'of', len(Wk),
              '| hungry ones with children:', sum(1 for x in Wk if x['cause'] == 'hunger' and x['woke']['charges'] > 0), 'of', sum(1 for x in Wk if x['cause'] == 'hunger'),
              '| hurt:', sum(1 for x in Wk if x['woke']['hurt'] > 0))
    K = [x for x in D if x['child']]
    print('children: carer alive / mother alive at death, by cause:',
          {c: (sum(1 for x in K if x['cause'] == c and x['carerAlive']), sum(1 for x in K if x['cause'] == c and x['motherAlive']), sum(1 for x in K if x['cause'] == c)) for c in sorted({x['cause'] for x in K})})
    thirst = [x for x in D if x['cause'] == 'thirst']
    print('thirst deaths: ages', sorted(x['age'] for x in thirst), '| water', sorted(x['water'] for x in thirst)[:5], '...')
    print('census:', ' '.join(f"y{c['year']:g}:{c['alive']}/{c['adults']}/{c['children']}/{c['infants']}/{c['mothersWithCharges']}" for c in r['census']), '(alive/adults/children/infants/women with charges)')
    s, a, b = SPANS[name]
    e = json.load(open(os.path.join(R, 'exp002_founding-wave', f'limit_s{s}.json'))); e = e.get('data', e)
    by = Counter()
    for row in e['seasons']:
        if a < row['year'] <= b + 1e-9:
            for k, v in row['deaths'].items(): by[k] += v
    print(f'exp002 limit_s{s} years {a}-{b}: deaths', dict(sorted(by.items())))
    print()
