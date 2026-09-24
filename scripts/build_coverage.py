"""Record where each section of the supplied writings is taught in the site."""
from pathlib import Path
from bs4 import BeautifulSoup
import json

ROOT=Path(__file__).resolve().parent.parent
WRITINGS=ROOT.parent/'chromium-writings'
MAP={
 'blink':[['owners'],['owners'],['owners'],['owners','time'],['owners','navigation'],['parsing'],['bindings'],['time','pixels'],['pixels'],['lifetime'],['features'],['independent'],[]],
 'deps-and-goma':[['checkout'],['checkout'],['checkout'],['checkout'],['checkout','factory'],['checkout'],['rolls'],['rolls'],['rolls'],['remote'],['remote'],['checkout','remote'],[]],
 'ci-cd-and-releases':[['factory'],['factory'],['factory'],['factory'],['factory'],['factory'],['factory'],['factory'],['factory'],['release'],['release'],['factory','release'],[]],
 'sea-of-nodes':[['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],[]],
 'sea-of-nodes-paper':[['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs'],['graphs','independent'],['graphs','independent'],[]],
}
LABEL={'blink':'Blink','deps-and-goma':'Dependencies and remote builds','ci-cd-and-releases':'CI and releases','sea-of-nodes':'Sea of Nodes','sea-of-nodes-paper':'Sea of Nodes paper'}
rows=[]
for slug, targets in MAP.items():
 soup=BeautifulSoup((WRITINGS/slug/'index.html').read_text(),'html.parser')
 heads=[h.get_text(' ',strip=True) for h in soup.select('h2')]
 assert len(heads)==len(targets),(slug,len(heads),len(targets))
 rows.append({'source':LABEL[slug],'sections':[{'title':h,'lessons':ids,'bibliography':not ids} for h,ids in zip(heads,targets)]})
(ROOT/'assets'/'js'/'coverage.js').write_text('export const coverage = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n')
print('Mapped',sum(len(x['sections']) for x in rows),'source sections')
