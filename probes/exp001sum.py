# exp001 summary: child hunger deaths by year, deaths by cause, and the weighings, against the baseline.
#   python probes/exp001sum.py   (run from sim/)
import json,sys
def load_new(s): return json.load(open(f'results/exp001_mothers-count/limit_s{s}.json'))['seasons']
def load_old(s): return [json.loads(l) for l in open(f'../analysis/archive/f94422b9_nov13/cp_gear10_{s}.txt') if l.startswith('{')]
for s in (1,2,3):
  for tag,R in (('base',load_old(s)),('exp001',load_new(s))):
    yrs={}
    for r in R:
      y=int((r['year']-0.01)//1)+1
      d=yrs.setdefault(y,{})
      for k,v in r['deaths'].items(): d[k]=d.get(k,0)+v
    ch=[yrs.get(y,{}).get('child hunger',0) for y in range(1,11)]
    tot={}
    for y in yrs:
      for k,v in yrs[y].items(): tot[k]=tot.get(k,0)+v
    last=R[-1]
    print(f"s{s} {tag:6} child hunger by year {ch} y6-10={sum(ch[5:])} | end alive {last['alive']} adults {last['adults']} | all deaths {dict(sorted(tot.items()))}")
  W={}
  for r in load_new(s):
    for k,B in r.get('weigh',{}).items():
      T=W.setdefault(k,[0,0,0,0]); T[0]+=B[0];T[1]+=B[1];T[2]+=B[2];T[3]+=B[3]*B[0]
  print('   weighings by kids in care [n, worth it, worth it w/o crowding, mean crowding h]:',{k:[T[0],T[1],T[2],round(T[3]/max(1,T[0]))] for k,T in sorted(W.items())})
# births: alive children at end
