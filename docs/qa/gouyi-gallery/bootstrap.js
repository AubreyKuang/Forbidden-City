(()=>{
  const payload=document.getElementById('gouyi-demo-save').textContent;
  const view=JSON.parse(document.getElementById('gouyi-demo-view').textContent);
  localStorage.setItem('chengongji_v1_auto',payload);A.load('auto');
  if(!S||PalaceActions.blocked)throw Error('The demonstration save did not restore.');
  const g=S.consorts.find(c=>c.gouyi);
  if(view==='profile'||view==='chronicle')A.go('consort',g.id);
  if(view==='chronicle'){
    const scroll=()=>{const heading=[...document.querySelectorAll('h3,h2,summary')].find(el=>el.textContent.includes('人物纪事'));if(heading)heading.scrollIntoView({block:'start'});};
    window.addEventListener('load',scroll,{once:true});scroll();
  }
  document.documentElement.dataset.gouyiDemo='ready';
})();
