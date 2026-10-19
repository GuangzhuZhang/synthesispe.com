const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '..', 'next-stage-preview-20261019');
fs.mkdirSync(output, { recursive: true });
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.xml':'application/xml'};
const server = http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, pathname.slice(1));
  if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end('not found'); return; }
    response.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
    response.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({ headless: true, executablePath: edge });
  const targets = [
    ['home', '/'],
    ['ai-questions', '/ai-questions/'],
    ['ai-full-text', '/ai-questions/full-text/'],
    ['flagship', '/flagship-research/']
  ];
  const issues = [];
  for (const [name, url] of targets) {
    for (const [mode, viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
      const page = await browser.newPage({ viewportSize: viewport });
      page.on('pageerror', error => issues.push(`${name}/${mode}: ${error.message}`));
      await page.goto(`http://127.0.0.1:4173${url}`, { waitUntil: 'networkidle' });
      const metrics = await page.evaluate(() => ({title:document.title,h1:document.querySelector('h1')?.textContent?.trim(),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,comments:document.querySelectorAll('[data-comments]').length,fallbacks:[...document.querySelectorAll('.comment-fallback')].filter(x=>!x.hidden).length}));
      if (!metrics.title || !metrics.h1) issues.push(`${name}/${mode}: missing title or h1`);
      if (metrics.overflow > 2) issues.push(`${name}/${mode}: horizontal overflow ${metrics.overflow}px`);
      if (name !== 'home' && metrics.comments && metrics.fallbacks !== metrics.comments) issues.push(`${name}/${mode}: comment fallback not visible`);
      await page.screenshot({ path:path.join(output, `${name}-${mode}.png`), fullPage:true });
      console.log(`${name}/${mode}`, JSON.stringify(metrics));
      await page.close();
    }
  }
  await browser.close();
  server.close();
  if (issues.length) { console.error(issues.join('\n')); process.exit(1); }
  console.log(`PASS: visual QA screenshots written to ${output}`);
})().catch(error => { console.error(error); server.close(); process.exit(1); });
