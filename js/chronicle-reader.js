/* Filters live only in UI. Reading a life never mutates people, memories or RNG. */
function chronicleYear(e){return e.d?.includes('年')?e.d.split('年')[0]+'年':e.d||'日期未详';}
function chronicleTopic(e){return (LIFE_CHAPTERS.find(c=>e.life?.kind?c.key===e.life.kind:c.re.test(e.t))||LIFE_CHAPTERS.at(-1)).key;}
function chronicleThread(e){return e.thread||(e.life?.source?`life:${e.life.gen}:${e.life.title}:${e.life.source}`:'');}
function chronicleCast(e){return [...new Map([...(e.life?.people||[]),...(e.event?.participants||[])].map(p=>[p.id,p])).values()];}
function chronicleMatches(e,f={}){return (!f.year||chronicleYear(e)===f.year)&&(!f.topic||chronicleTopic(e)===f.topic)&&(!f.person||chronicleCast(e).some(p=>String(p.id)===f.person))&&(!f.thread||chronicleThread(e)===f.thread)&&(!f.query||[e.d,e.t,e.life?.source,e.event?.situation,e.event?.choice,e.event?.outcome,...chronicleCast(e).map(p=>p.name)].join(' ').toLocaleLowerCase().includes(f.query.toLocaleLowerCase()));}
function chroniclePersonTarget(id){
 const number=Number(id),consort=familyHostById(number),child=royalById(number),scholar=scholarById(id);
 if(consort)return {person:consort,view:'consort',id:number};
 if(child)return {person:child,view:S.children.includes(child)?'kid':'relative',id:number};
 if(scholar)return {person:scholar,view:'scholar',id};
 for(const c of familyCourtHosts()){
  const h=c.house;if(!h)continue;
  for(const role of ['father',...brotherRoles(h)])if(String(h[role]?.id)===String(id))return {person:h[role],view:'official',id:`${c.id}:${role}`};
  const relative=h.relatives?.find(p=>String(p.id)===String(id));
  if(relative)return {person:relative,view:'natal',id:`${c.id}:${relative.id}`};
 }
 return null;
}
function chroniclePersonLink(p){
 const target=chroniclePersonTarget(p.id);
 return target?`<button class="btn quiet sm" onclick="A.go('${target.view}',${esc(JSON.stringify(target.id))})">${esc(p.name)}</button>`:esc(p.name);
}
function chronicleGroupedLetters(story){
 const entries=[],groups=new Map();
 for(const [i,e] of story.entries()){
  const row={e,i},letter=String(e.t).match(/^【娘家来信】(.+?)得知(.+?(?:降为.+?|被迁入冷宫)，托人传话：“.+”)$/);
  if(letter){
   const [,writer,body]=letter,key=JSON.stringify([e.d,body]),group=groups.get(key);
   if(group){
    group.names.push(writer);
    group.row.e={...group.row.e,t:'【娘家来信】'+group.names.join('、')+'得知'+body};
    continue;
   }
   groups.set(key,{row,names:[writer]});
  }
  entries.push(row);
 }
 return entries;
}
function chronicleVisibleEntries(story){
 const personalPromotions=new Set(),brotherExchanges=new Set();
 for(const e of story){
  const promotion=String(e.t).match(/^【父亲升黜·[^】]+】家书传来：父亲(.+?)由(.+?)(?:升任|贬任)(.+?)。/);
  if(promotion)personalPromotions.add(JSON.stringify([e.d,...promotion.slice(1)]));
 }
 return chronicleGroupedLetters(story).filter(({e})=>{
  const text=String(e.t),promotion=text.match(/^父亲(.+?)：[^：]+：由(.+?)改任(.+?)。$/);
  if(promotion&&personalPromotions.has(JSON.stringify([e.d,...promotion.slice(1)])))return false;
  const exchange=text.match(/^(?:[长二三四五]兄|兄长|弟弟)[^：]+：([^。]+(?:举荐自己的(?:兄长|弟弟)|给弟弟[^。]+写信).+)$/);
  if(!exchange)return true;
  const key=JSON.stringify([e.d,exchange[1]]);
  if(brotherExchanges.has(key))return false;
  brotherExchanges.add(key);return true;
 });
}
function chronicleReader(person){
 const source=person.story||[];if(!source.length)return '<p class="hint">尚无记载。</p>';
 const entries=chronicleVisibleEntries(source);
 const key=`${S.gen}:${person.id}`,f=UI.chronicleFilters?.[key]||{},years=[...new Set(source.map(chronicleYear))].reverse(),people=[...new Map(source.flatMap(chronicleCast).filter(p=>p.id!==person.id).map(p=>[p.id,p])).values()];
 const select=(field,title,options)=>`<label>${title}<select aria-label="纪事${title}" onchange="A.chronicleFilter('${key}','${field}',this.value)"><option value="">全部</option>${options.map(([value,label])=>`<option value="${esc(value)}" ${String(f[field])===String(value)?'selected':''}>${esc(label)}</option>`).join('')}</select></label>`;
 const results=entries.filter(({e})=>chronicleMatches(e,f)).reverse();
 const rows=results.map(({e,i})=>{
  const ev=e.event,thread=chronicleThread(e),related=thread?source.filter(x=>chronicleThread(x)===thread):[],cast=chronicleCast(e).filter(p=>p.id!==person.id);
  const context=ev&&!ev.embedded?detailFold('回看事由与处理',`<p>${esc(ev.title)} · ${esc((ev.participants||[]).map(p=>p.name).join('、'))}</p><p>${esc(ev.situation)}</p><p>陛下回应：${esc(ev.choice)}</p>${ev.outcome?`<p>${esc(ev.outcome)}</p>`:''}`):'';
  return `<li><time>${esc(e.d)}</time>${esc(e.t)}${e.life?.source?`<p class="hint">缘起：${esc(e.life.source)}</p>`:''}${cast.length?`<div class="chronicle-cast">相关人物：${cast.map(chroniclePersonLink).join(' ')}</div>`:''}${related.length>1?`<button class="btn quiet sm" onclick="A.chronicleThread('${key}',${i})">回看前因与后续 · ${related.length}则</button>`:''}${context}</li>`;
 });
 const active=Object.values(f).some(Boolean),list=a=>`<ul class="story">${a.join('')}</ul>`;
 return `<div class="chronicle-tools"><div class="chronicle-filters">${select('year','年份',years.map(y=>[y,y]))}${select('topic','主题',LIFE_CHAPTERS.map(c=>[c.key,c.title]))}${people.length?select('person','人物',people.map(p=>[p.id,p.name])):''}</div><div class="acts"><input id="chronicle-search-${key}" aria-label="搜索人物纪事" maxlength="100" placeholder="搜索人名、往事或一句话" value="${esc(f.query||'')}" onkeydown="if(event.key==='Enter') A.chronicleSearch('${key}')"><button class="btn sm" onclick="A.chronicleSearch('${key}')">搜索纪事</button>${active?`<button class="btn quiet sm" onclick="A.chronicleClear('${key}')">显示全部纪事</button>`:''}</div><p class="hint">${f.thread?'正在回看同一件事的前因与后续 · ':''}共${entries.length}则${active?`，找到${results.length}则`:''}。筛选不会删去原始记载。</p></div>${rows.length?(active?list(rows):list(rows.slice(0,6))+(rows.length>6?detailFold(`翻阅更早的纪事（${rows.length-6}条）`,list(rows.slice(6))):'')):'<p class="hint">没有符合筛选的纪事，可清除筛选重新翻看。</p>'}`;
}
A.chronicleFilter=function(key,field,value){if(!['year','topic','person'].includes(field))return;((UI.chronicleFilters||={})[key]||={})[field]=String(value);render();};
A.chronicleSearch=function(key){((UI.chronicleFilters||={})[key]||={}).query=(document.getElementById?.('chronicle-search-'+key)||$('[id="chronicle-search-'+key+'"]'))?.value?.trim().slice(0,100)||'';render();};
A.chronicleClear=function(key){if(UI.chronicleFilters)delete UI.chronicleFilters[key];render();};
A.chronicleThread=function(key,index){
 const id=key.slice(key.indexOf(':')+1),person=chroniclePersonTarget(id)?.person;
 const thread=person&&chronicleThread(person.story?.[index]||{});if(thread){(UI.chronicleFilters||={})[key]={thread};render();}
};
