const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const errors = [];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const registry = JSON.parse(read('data/article-registry.json'));
const articlePages = [];

for (const article of registry.articles) {
  for (const lang of ['zh', 'en']) {
    const url = article.urls[lang];
    const rel = `${url.replace(/^\//, '')}index.html`;
    articlePages.push(rel);
    if (!exists(rel)) errors.push(`missing registered page: ${rel}`);
    else if (!read(rel).includes(`data-page="${url}"`)) errors.push(`missing comment mount: ${rel}`);
  }
}

const requiredPages = ['index.html','en/index.html','ai-questions/index.html','en/ai-questions/index.html','ai-questions/full-text/index.html','en/ai-questions/full-text/index.html','flagship-research/index.html','en/flagship-research/index.html'];
for (const rel of requiredPages) {
  if (!exists(rel)) { errors.push(`missing required page: ${rel}`); continue; }
  const html = read(rel);
  if (!html.includes('name="viewport"')) errors.push(`missing viewport: ${rel}`);
  if (!html.includes('rel="canonical"') && !['index.html','en/index.html'].includes(rel)) errors.push(`missing canonical: ${rel}`);
}

for (const rel of [...requiredPages, ...articlePages]) {
  const html = read(rel);
  for (const match of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const url = match[1];
    if (/\.[a-z0-9]+$/i.test(url)) {
      if (!exists(url.slice(1))) errors.push(`broken asset ${url} in ${rel}`);
    } else {
      const target = url === '/' ? 'index.html' : `${url.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
      if (!exists(target)) errors.push(`broken internal link ${url} in ${rel}`);
    }
  }
}

const productionText = fs.readdirSync(root, {recursive:true}).filter(x=>/\.(html|xml|json|cff)$/.test(x)&&x!=='LOCAL_IMPLEMENTATION_REPORT_20261019.md').map(read).join('\n');
if (productionText.includes('10.5281/zenodo.22700237')) errors.push('stale A-4 DOI remains in production surfaces');
if (!productionText.includes('10.5281/zenodo.22770261')) errors.push('corrected A-4 DOI missing');
const expectedA4PdfHashes = {
  'assets/pdf/a-4-en.pdf': '248F575C8BC44F8C670034A9DB794F6FC7BD21910B172CA080DB1B105BCD6669',
  'assets/pdf/a-4-zh.pdf': 'E7FA19DBA0A163E97B949DCB6CC6805451E4427C08DB5DC67A64FA8ADE76024C'
};
for (const [rel, expectedHash] of Object.entries(expectedA4PdfHashes)) {
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex').toUpperCase();
  if (actualHash !== expectedHash) errors.push(`A-4 PDF is not the sealed corrected file: ${rel}`);
}

const source = read('data/ai-seven-questions-bilingual-source.txt').replace(/^\uFEFF/, '');
const [zhPart, enPart = ''] = source.split('以下为英文译文：');
const expected = {
  'ai-questions/full-text/index.html': zhPart.trim(),
  'en/ai-questions/full-text/index.html': enPart.replace(/^\s*_+\s*/, '').replace(/\s*_+\s*几处译名说明：[\s\S]*$/, '').trim()
};
for (const [rel, value] of Object.entries(expected)) {
  const html = read(rel), marker = '<article class="source-text">', start = html.indexOf(marker) + marker.length, end = html.indexOf('</article>', start);
  const actual = html.slice(start,end).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  if (actual !== value) errors.push(`AI source text changed: ${rel}`);
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`PASS: ${registry.articles.length} articles, ${articlePages.length} bilingual article pages, ${requiredPages.length} key pages, links, DOI, comments and exact AI source text.`);
