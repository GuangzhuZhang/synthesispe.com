const progress=document.getElementById('progress');
const links=[...document.querySelectorAll('.toc a')];
const heads=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
function onScroll(){
  const h=document.documentElement;
  if(progress) progress.style.width=((h.scrollTop)/(h.scrollHeight-h.clientHeight)*100)+'%';
  let current=null;
  for(const head of heads){ if(head.getBoundingClientRect().top<120) current=head.id; }
  links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+current));
}
document.addEventListener('scroll',onScroll,{passive:true}); onScroll();