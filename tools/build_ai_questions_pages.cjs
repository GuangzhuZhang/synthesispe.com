const fs = require('fs');

const source = fs.readFileSync('data/ai-seven-questions-bilingual-source.txt', 'utf8').replace(/^\uFEFF/, '');
const [zhPart, enPart = ''] = source.split('以下为英文译文：');
const zh = zhPart.trim();
const en = enPart.replace(/^\s*_+\s*/, '').replace(/\s*_+\s*几处译名说明：[\s\S]*$/, '').trim();
const notes = (source.match(/几处译名说明：[\s\S]*$/) || [''])[0].trim();
const escapeHtml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render({lang, text, notes = ''}) {
  const zhPage = lang === 'zh-CN';
  const base = zhPage ? '' : '/en';
  const title = zhPage ? 'AI时代的七大社会难题，有解吗？' : 'Seven Major Social Dilemmas of the AI Era: Are There Solutions?';
  const boundary = zhPage
    ? '编辑说明：以下为作者提供的原文，包含作者有意保留的瑕疵与开放问题。本站不在正文中静默修正事实、术语或推测。'
    : 'Editorial note: the text below is the author-supplied version, including deliberate imperfections and open questions. The site does not silently correct facts, terminology, or conjectures inside the text.';
  const speculation = zhPage
    ? '边界提示：其中关于硅基生命、独立意志、SI社会及未来演化的表述属于设问、猜想或情景推演，不是对现有AI系统的事实描述。'
    : 'Boundary note: passages on silicon-based life, independent will, SI society and future evolution are questions, conjectures or scenario explorations, not factual descriptions of present AI systems.';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · Synthesis Political Economy</title><link rel="canonical" href="https://synthesispe.com${base}/ai-questions/full-text/"><link rel="alternate" hreflang="${zhPage ? 'en' : 'zh-CN'}" href="https://synthesispe.com/${zhPage ? 'en/' : ''}ai-questions/full-text/"><link rel="stylesheet" href="/assets/css/main.css"></head><body><nav><div class="nav-inner"><a class="nav-logo" href="${zhPage ? '/' : '/en/'}"><div class="nav-logo-en">Synthesis Political Economy</div><div class="nav-logo-zh">合三为一政治经济学</div></a><div class="nav-links"><a href="${base}/">${zhPage ? '导论' : 'Introduction'}</a><a href="${base}/flagship-research/">${zhPage ? '研究' : 'Research'}</a><a href="${base}/ai-questions/">${zhPage ? 'AI七问' : 'AI Questions'}</a><a href="${base}/discussion/">${zhPage ? '讨论' : 'Discussion'}</a><a href="${base}/about/">${zhPage ? '关于' : 'About'}</a><a href="/${zhPage ? 'en/' : ''}ai-questions/full-text/">${zhPage ? 'EN' : '中文'}</a></div></div></nav><main class="simple-page"><p class="article-series">${zhPage ? 'AI七问 · 中文原文' : 'Seven Questions on AI · English translation'}</p><h1>${escapeHtml(title)}</h1><p class="boundary-note">${boundary}</p><p class="boundary-note">${speculation}</p><article class="source-text">${escapeHtml(text)}</article>${notes ? `<section class="simple-section"><h2>译名说明</h2><p>${escapeHtml(notes)}</p></section>` : ''}<section class="simple-section"><h2>${zhPage ? '修订记录' : 'Revision record'}</h2><p>${zhPage ? '2026-10-19：依据作者提供文本建立完整原文页；未增加问题，未润色正文。' : '19 October 2026: full-text page created from the author-supplied translation; no question added and no prose polished.'}</p></section><div data-comments data-page="${base}/ai-questions/full-text/"></div></main><script src="/assets/js/comments-config.js"></script><script src="/assets/js/comments.js" defer></script></body></html>`;
}

fs.mkdirSync('ai-questions/full-text', { recursive: true });
fs.mkdirSync('en/ai-questions/full-text', { recursive: true });
fs.writeFileSync('ai-questions/full-text/index.html', render({ lang: 'zh-CN', text: zh, notes }), 'utf8');
fs.writeFileSync('en/ai-questions/full-text/index.html', render({ lang: 'en', text: en }), 'utf8');

function verify(file, expected) {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('<article class="source-text">') + '<article class="source-text">'.length;
  const end = html.indexOf('</article>', start);
  const decoded = html.slice(start, end).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (start < 0 || end < 0 || decoded !== expected) throw new Error(`source preservation check failed: ${file}`);
  console.log(`EXACT PASS: ${file}`);
}

verify('ai-questions/full-text/index.html', zh);
verify('en/ai-questions/full-text/index.html', en);
