function lifePersonLink(p){
 const c=byId(p.id),k=kidById(p.id),view=c?'consort':k?'kid':null;
 return view?`<button class="btn quiet sm" data-onclick="A.go('${view}',${p.id})">${esc(p.name)}</button>`:esc(p.name);
}
function lifeWorksPanel(person){
 const works=person.sex||person===E()?person.keepsakes||[]:person.personalLife?.works||[];
 if(!works.length)return '';
 return `<div class="life-works">${works.slice(-6).reverse().map(w=>{
  const receivers=!person.sex&&person!==E()?S.children.filter(k=>lifeGiftReady(person,k,w)):[];
  return `<article><strong>《${esc(w.title)}》${w.incomplete?' · 未完稿':''}</strong><p>${esc(w.date)} · ${w.authors.map(lifePersonLink).join('、')} ${w.mode==='public'?'· 署名传阅':'· 私藏手稿'}</p>
   <p class="hint">${esc(w.source)}</p>${w.fromName?`<p>${esc(w.fromName)}亲手相赠${w.echo?' · 已写下长大后的新心得':''}</p>`:''}
   ${w.given?`<p>这一份已交给${esc(kidById(w.given)?.name||'当年的孩子')}。</p>`:''}
   ${receivers.length?`<div class="acts">${receivers.map(k=>`<button class="btn sm" data-onclick="A.lifePass(${person.id},${k.id},'${w.id}')">陪${esc(k.name)}翻读并相赠<small>精力-1</small></button>`).join('')}</div>`:''}</article>`;
 }).join('')}</div>`;
}
function personalLifePanel(c){
 const l=c.personalLife,p=l?.project,b=lifeBoundary(c),proposal=lifeProposal(c),ready=inPalace(c),r=l?.ritual;
 const links=Object.entries(l?.links||{}).map(([id,v])=>`<p>${lifePersonLink({id:+id,name:v.name})} · ${v.trust<0?'做事仍可相助，私稿暂不轻托':v.helps?'有过合编，也有后来互相搭手的往来':'一起做成过东西，合作有了底'}<br><span class="hint">缘起：《${esc(v.source)}》</span>${v.trust<0&&ready&&inPalace(byId(+id))?`<button class="btn sm" data-onclick="A.lifeCoauthor(${c.id},${+id})">再谈合编的分寸</button>`:''}</p>`).join('');
 if(!l&&!proposal)return '';
 return detailSection('自己的打算',`${p?`<p><strong>${esc(p.title)}</strong> · ${p.progress>=3?'初稿已成':`已整理${p.progress}个月`}</p><p>${esc(p.cause)}</p><p>“${esc(p.wish)}”</p>${!lifeProjectReady(c,p)?`<p class="hint">${p.partner&&(p.dispute||lifeCooperationBroken(c,byId(p.partner)))?'合作者有了隔阂，先各自收好稿件；不会自动续编。':'参与者暂不能相见，先把稿子收好。'}</p>`:''}`:proposal?`<p>${esc(proposal.cause)}</p><p>“${esc(proposal.wish)}”</p>`:''}
 ${ready&&(proposal||p&&(lifeProjectReady(c,p)||p.partner&&(p.dispute||lifeCooperationBroken(c,byId(p.partner)))))?`<button class="btn jade" data-onclick="A.lifePlan(${c.id})">${p?'接着谈这份打算':'听她说说想做的事'}</button>`:''}
 ${b?`<div class="life-boundary"><p>仍在意的事：${esc(b.cause)}</p><p class="hint">${b.acknowledged?'已把话说清，信任要看日后的行动。':'她领情，也需要自己的意愿被认真对待。'}</p>${ready&&!b.acknowledged?`<button class="btn sm" data-onclick="A.lifeReconcile(${c.id})">把心结说清</button>`:''}</div>`:''}
 ${links}${lifeWorksPanel(c)}
 ${r?`<p>与${r.gen===S.gen?'陛下':'先朝陛下'}的旧约 · ${esc(r.date)}<br>${esc(r.title)}，每年${cnNum(r.month)}月，得闲便聚。</p>`:''}
 ${ready&&!b&&r?.gen===S.gen?(lifeRitualReady(c)?`<button class="btn" data-onclick="A.lifeRitual(${c.id})">得闲赴旧约<small>精力-1</small></button>`:''):ready&&!b&&l?.works.length&&c.aff>=40?`<button class="btn" data-onclick="A.lifeRitual(${c.id})">留一个得闲的日子</button>`:''}`);
}
function lifeChapters(person){
 const groups=new Map();
 for(const {i:index,e:entry} of chronicleGroupedLetters(person.story||[])){
  if(entry.t.startsWith('【心境'))continue;
  const chapter=LIFE_CHAPTERS.find(c=>entry.life?.kind?c.key===entry.life.kind:c.re.test(entry.t))||LIFE_CHAPTERS.at(-1);
  if(!groups.has(chapter.key))groups.set(chapter.key,{...chapter,entries:[]});groups.get(chapter.key).entries.push({entry,index});
 }
 return [...groups.values()].sort((a,b)=>a.entries[0].index-b.entries[0].index);
}
function lifeBiography(person){
 const chapters=lifeChapters(person);if(!chapters.length)return '';
 const subjective=NPCMemory.recall(S,person.id).filter(m=>m.type==='personal-life').slice(0,3);
 return detailSection('人生篇章',`<p class="hint">按实际纪事归拢；同一段经历可以翻回原文。心中所记单独列出，不替代事实。</p><div class="life-chapters">${chapters.map(c=>{
  const first=c.entries[0].entry,last=c.entries.at(-1).entry,people=[...new Map(c.entries.flatMap(({entry})=>entry.life?.people||entry.event?.participants||[]).filter(p=>p.id!==person.id).map(p=>[p.id,p])).values()];
  return `<article><h4>${c.title}</h4><p class="hint">${esc(first.d)}${first.d!==last.d?' — '+esc(last.d):''} · ${c.entries.length}则纪事</p>
   <p>${esc(last.t.length>120?last.t.slice(0,120)+'…':last.t)}</p>${people.length?`<div>${people.slice(-6).map(lifePersonLink).join(' ')}</div>`:''}
   ${detailFold('翻阅这一篇的原始纪事',`<ul class="story">${c.entries.map(({entry})=>`<li><time>${esc(entry.d)}</time>${esc(entry.t)}${chronicleSummary(entry)}${entry.life?.source?`<p class="hint">缘起：${esc(entry.life.source)}</p>`:''}${entry.event&&!entry.event.embedded?`<p>事由：${esc(entry.event.situation)}<br>回应：${esc(entry.event.choice)}<br>${esc(entry.event.outcome)}</p>`:''}</li>`).join('')}</ul>`)}</article>`;
 }).join('')}</div>${subjective.length?detailFold('她心中所记'.replace('她',person.sex==='m'?'他':'她'),subjective.map(m=>`<p>“${esc(m.interpretation)}”</p>`).join('')):''}`);
}
