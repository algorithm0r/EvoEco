# exp002 summary: the founding wave (births, deaths, population, age profile by year) and the
# child hunger trace.   python probes/exp002sum.py   (run from sim/)
import json
for s in (1, 2, 3):
    D = json.load(open(f'results/exp002_founding-wave/limit_s{s}.json'))
    R, H = D['seasons'], D['hungerDeaths']
    print(f'=== seed {s} ===')
    print('year alive adults kids births | childHunger adultHunger other')
    yrs = {}
    for r in R:
        y = int((r['year'] - 0.01) // 1) + 1
        Y = yrs.setdefault(y, {'b': 0, 'ch': 0, 'ah': 0, 'o': 0})
        Y['b'] += r['births']; Y['end'] = r
        for k, v in r['deaths'].items():
            if k == 'child hunger': Y['ch'] += v
            elif k == 'adult hunger': Y['ah'] += v
            else: Y['o'] += v
    for y in sorted(yrs):
        Y = yrs[y]; e = Y['end']
        print(f"{y:4} {e['alive']:5} {e['adults']:6} {e['alive']-e['adults']:4} {Y['b']:6} | {Y['ch']:11} {Y['ah']:11} {Y['o']:5}")
    for y in (10, 20, 30, 40):
        if y in yrs: print(f'ages at year {y} (5-y bins, last 60+):', yrs[y]['end']['ages'])
    n = len(H)
    inf = [h for h in H if h['infant']]; old = [h for h in H if not h['infant']]
    print(f'hunger deaths traced: {n}; infants {len(inf)}, older {len(old)}')
    for name, G in (('infant', inf), ('older', old)):
        if not G: continue
        noc = [h for h in G if not h['carer']]
        wc = [h for h in G if h['carer']]
        fed = [h for h in wc if h['carer']['foodDays'] >= 1]
        campfed = [h for h in G if h['camp'] and h['camp']['perAdult'] >= 1]
        med = lambda L: sorted(L)[len(L)//2] if L else None
        print(f"  {name}: no carer {len(noc)}; with carer {len(wc)} (carer is mother {sum(h['carer']['isMother'] for h in wc)}),"
              f" carer held >=1 food-day {len(fed)}, median carer food-days {med([h['carer']['foodDays'] for h in wc])},"
              f" median carer food level {med([h['carer']['food'] for h in wc])}, median carer other kids {med([h['carer']['otherKids'] for h in wc])};"
              f" camp held >=1 food-day per adult {len(campfed)}/{len(G)}, median camp per adult {med([h['camp']['perAdult'] for h in G if h['camp']])};"
              f" mother alive {sum(h['motherAlive'] for h in G)}; median age {med([h['age'] for h in G])}; own food >=1 day {sum(h['ownFood']>=1 for h in G)}")
