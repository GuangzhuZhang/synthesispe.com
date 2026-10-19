const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target);
    if (entry.isFile() && entry.name.endsWith('.html')) update(target);
  }
}

function update(file) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;
  if (file.includes(`${path.sep}en${path.sep}`)) {
    next = next.replace(
      /(<div class="nav-links"><a href="\/en\/">Introduction<\/a>)(?!<a href="\/en\/contents\/">)/g,
      '$1<a href="/en/contents/">Contents</a>'
    );
  } else {
    next = next.replace(
      /(<div class="nav-links"><a href="\/(?:introduction\/)?">导论<\/a>)(?!<a href="\/contents\/">)/g,
      '$1<a href="/contents/">总目录</a>'
    );
  }
  if (next !== original) fs.writeFileSync(file, next, 'utf8');
}

walk(root);

const generator = path.join(root, 'tools', 'build_ai_questions_pages.cjs');
const generatorSource = fs.readFileSync(generator, 'utf8');
const generatorNext = generatorSource.replace(
  `<a href="${'${base}'}/flagship-research/">${"${zhPage ? '研究' : 'Research'}"}</a>`,
  `<a href="${'${base}'}/contents/">${"${zhPage ? '总目录' : 'Contents'}"}</a><a href="${'${base}'}/flagship-research/">${"${zhPage ? '研究' : 'Research'}"}</a>`
);
if (generatorNext !== generatorSource) fs.writeFileSync(generator, generatorNext, 'utf8');
