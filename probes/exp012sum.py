# exp012 summary: the founding wave with and without children at the start. By 5-year span:
# alive/adults at its end, births, child hunger deaths, adult hunger deaths, other deaths; children
# alive at year end (low and high, with the year); births a year (mean, sd, coefficient of
# variation, years 1-40 and 11-40); the age profile at years 10-40.
#   python probes/exp012sum.py   (run from sim/)
import json, statistics as st
for arm in ('limit', 'adults'):
    for s in (1, 2, 3):
        D = json.load(open(f'results/exp012_founding-children/{arm}_s{s}.json'))
        R = D['seasons']
        yrs = {}
        for r in R:
            y = int((r['year'] - 0.01) // 1) + 1
            Y = yrs.setdefault(y, {'b': 0, 'ch': 0, 'ah': 0, 'o': 0})
            Y['b'] += r['births']; Y['end'] = r
            for k, v in r['deaths'].items():
                if k == 'child hunger': Y['ch'] += v
                elif k == 'adult hunger': Y['ah'] += v
                else: Y['o'] += v
        print(f'=== {arm} s{s} ===  start: alive {R[0]["alive"]}, adults {R[0]["adults"]} (end of first season)')
        for a in range(1, 41, 5):
            span = [yrs[y] for y in range(a, a + 5) if y in yrs]
            e = span[-1]['end']
            print(f"{a:2}-{a+4:2}  {e['alive']}/{e['adults']}, {sum(x['b'] for x in span)}, {sum(x['ch'] for x in span)}, {sum(x['ah'] for x in span)}, {sum(x['o'] for x in span)}")
        kids = {y: yrs[y]['end']['alive'] - yrs[y]['end']['adults'] for y in yrs}
        lo = min(kids, key=kids.get); hi = max(kids, key=kids.get)
        print(f'children at year end: low {kids[lo]} (year {lo}), high {kids[hi]} (year {hi}), year 40 {kids[40]}')
        for a, b in ((1, 40), (11, 40)):
            B = [yrs[y]['b'] for y in range(a, b + 1)]
            m, sd = st.mean(B), st.pstdev(B)
            print(f'births a year, years {a}-{b}: mean {m:.1f}, sd {sd:.1f}, cv {sd/m:.2f}')
        for y in (10, 20, 30, 40):
            print(f'ages at year {y}:', ' '.join(str(x) for x in yrs[y]['end']['ages']))
