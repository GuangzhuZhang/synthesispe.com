from html.parser import HTMLParser
from pathlib import Path
import json, sys

ROOT=Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1=[]; self.series=[]; self.meta=[]; self._h1=0; self._sup=0; self._series=0; self._meta=0; self.nav_chains=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs); classes=set(a.get('class','').split())
        if tag=='h1': self._h1+=1
        if tag=='sup' and self._h1: self._sup+=1
        if 'article-series' in classes: self._series+=1
        if 'article-meta' in classes: self._meta+=1
        if 'site-article-nav' in classes: self.nav_chains+=1
    def handle_endtag(self,tag):
        if tag=='sup' and self._sup: self._sup-=1
        if tag=='h1' and self._h1: self._h1-=1
        if tag=='div' and self._series: self._series-=1
        if tag=='div' and self._meta: self._meta-=1
    def handle_data(self,data):
        if self._h1 and not self._sup: self.h1.append(data)
        if self._series: self.series.append(data)
        if self._meta: self.meta.append(data)

def compact(parts): return ' '.join(''.join(parts).split())

reg=json.loads((ROOT/'data/article-registry.json').read_text(encoding='utf-8'))
errors=[]
for article in reg['articles']:
    for lang in ('zh','en'):
        path=ROOT/article['urls'][lang].lstrip('/')/'index.html'
        raw=path.read_text(encoding='utf-8'); p=Page(); p.feed(raw)
        actual=compact(p.h1); expected=article['titles'][lang]
        if actual!=expected: errors.append(f"{article['displayId']} {lang} H1: {actual!r} != {expected!r}")
        series=compact(p.series)
        if article['displayId'] not in series: errors.append(f"{article['displayId']} {lang}: article-series lacks code: {series!r}")
        if lang=='en':
            prefix={'foundational-theory':'FOUNDATIONAL THEORY','mankiw-trilogy':'FOUNDATIONAL THEORY','heheism':'FOUNDATIONAL THEORY','ai-applied':'APPLIED RESEARCH','china-studies':'CHINA STUDIES'}[article['collection']]
            if prefix not in series: errors.append(f"{article['displayId']} en: article-series lacks {prefix!r}")

all_html='\n'.join(p.read_text(encoding='utf-8') for p in ROOT.rglob('index.html'))
for stale in ('AI革命将怎样影响就业市场和人口结构？','How Will the AI Revolution Affect the Labour Market and Demographic Structure?','Family Rights','State Power','FOUNDATIONAL THEORY · T-1.1 · T-1.1','栏目：应用研究 · 第三篇','栏目：应用研究 · 右栏目 · C-1','T-2：曼昆批判'):
    if stale in all_html: errors.append(f"stale visible string: {stale}")
for rel in ('applied/ai-employment-population/index.html','applied/humanoid-robots-households/index.html'):
    p=Page(); p.feed((ROOT/rel).read_text(encoding='utf-8'))
    if p.nav_chains: errors.append(f"legacy partial article chain: {rel}")
if '0<u(\\bar\\theta)' in (ROOT/'applied/humanoid-robots-households/index.html').read_text(encoding='utf-8'):
    errors.append('raw < in A-4 feasible-region formula')

if errors:
    print('\n'.join('ERROR: '+x for x in errors)); sys.exit(1)
print(f"registry contract passed: {len(reg['articles'])} bilingual articles")
