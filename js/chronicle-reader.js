/* Filters live only in UI. Reading a life never mutates people, memories or RNG. */
function reignAnnals(){
 const rulers=[...S.history.slice(0,S.gen-1),S.history[S.gen-1]||E()].map((r,i)=>({gen:i+1,name:r.sur+r.name,era:r.era,miao:r.miao,years:r.yrs,entries:[]}));
 const publicEntries=new Set();
 for(const book of S.regnalChronicles||[]){
  const ruler=rulers[book.gen-1];if(!ruler)continue;
  ruler.closedAt=book.closedAt;
  for(const entry of book.entries){
    ruler.entries.push(entry);
    publicEntries.add(JSON.stringify([book.gen,entry.d,entry.t]));
  }
 }
 let inferred;
 for(const entry of S.log){
  if(/^—— .+ ——$/.test(entry.t))continue;
  const divider=rulers.find(r=>entry.t.startsWith(`━━ 第${cnNum(r.gen)}代 ━━`));
  if(divider)inferred=divider.gen;
  if(entry.gen)inferred=entry.gen;
  const candidates=rulers.filter(r=>entry.d?.startsWith(r.era));
  const known=entry.gen||divider?.gen;
  const ruler=known?rulers[known-1]:
    candidates.find(r=>r.gen===inferred)||(candidates.length===1?candidates[0]:null);
  if(ruler){
    inferred=ruler.gen;
    if(entry.b&&!publicEntries.has(JSON.stringify([ruler.gen,entry.d,entry.t])))ruler.entries.push(entry);
  }
 }
 const seen=new Set();
 for(const entry of S.reignAnnals||[]){
   rulers[entry.gen-1]?.entries.push(entry);
   seen.add(JSON.stringify([entry.d,entry.title,entry.choice]));
 }
 for(const entry of S.historicalCodex||[]){
  if(seen.has(JSON.stringify([entry.d,entry.title,entry.choice])))continue;
  const matches=rulers.filter(r=>entry.d?.startsWith(r.era));
  if(matches.length===1)matches[0].entries.push(entry);
 }
 for(const ruler of rulers){
  const dates=new Map(ruler.entries.map(entry=>[entry.d,annalDateOrder(entry.d,ruler.era)]));
  ruler.entries.sort((a,b)=>{
    const when=Number.isInteger(a.turn)&&Number.isInteger(b.turn)?a.turn-b.turn:dates.get(a.d)-dates.get(b.d);
    return when||(a.order??-1)-(b.order??-1);
  });
 }
 return rulers;
}
function annalDateOrder(date,era){
 const [year,month]=String(date||'').slice(era.length).split('年');
 const digits='零一二三四五六七八九';
 const digit=x=>Math.max(0,digits.indexOf(x));
 const tens=year?.indexOf('十')??-1;
 const number=year==='元'?1:tens<0?digit(year):(tens===0?1:digit(year[0]))*10+digit(year[tens+1]);
 return number*12+Math.max(0,MONTHS.indexOf(month));
}
function viewReignAnnals(){
 const rulers=reignAnnals(),ruler=rulers.find(r=>r.gen===Number(UI.sel))||rulers.at(-1);
 const years=new Map();
 for(const entry of ruler.entries){
  const year=chronicleYear(entry);
  if(!years.has(year))years.set(year,[]);
  years.get(year).push(entry);
 }
 const pages=[...years.entries()],latest=pages.at(-1)?.[0];
 return `${pageHeading('皇帝本纪','',`<button class="btn sm" data-onclick="openHomeBook('archive');jumpToPageSection('home-collection')">王朝图鉴</button><button class="btn sm" data-onclick="openActivityLog(${ruler.gen})">起居注</button>`)}
   <label class="reign-picker" for="annals-reign"><span>朝代</span><select id="annals-reign" data-onchange="A.go('regnal',Number(this.value))">
     ${[...rulers].reverse().map(r=>`<option value="${r.gen}"${r===ruler?' selected':''}>${esc(reignOptionLabel(r.gen))}${r.miao?' · '+esc(r.miao):''}</option>`).join('')}</select></label>
   <div class="annals-ruler"><h3>${esc(ruler.name)}</h3><p>${esc(ruler.era)}朝${ruler.years!=null?` · 在位${ruler.years}年`:' · 在位中'}${ruler.closedAt?` · ${esc(ruler.closedAt)}定稿`:''}</p></div>
   ${pages.length?pages.map(([year,entries])=>`<details class="annals-year"${year===latest?' open':''}><summary>${esc(year)} · ${entries.length} 则</summary>
     <ul class="story">${entries.map(e=>`<li><time>${esc(e.d)}${e.kind?` · ${esc(e.kind)}`:''}</time>${e.title?`<strong>${esc(e.title)}</strong><p>批答：${esc(e.choice)}</p>${e.outcome?`<p>${esc(e.outcome)}</p>`:''}`:esc(e.t)}</li>`).join('')}</ul></details>`).join(''):'<p class="hint">这一朝尚无留存纪事。</p>'}`;
}
function chronicleYear(e){return e.d?.includes('年')?e.d.split('年')[0]+'年':e.d||'日期未详';}
function chronicleTopic(e){return (LIFE_CHAPTERS.find(c=>e.life?.kind?c.key===e.life.kind:c.re.test(e.t))||LIFE_CHAPTERS.at(-1)).key;}
function chronicleThread(e){return e.thread||(e.life?.source?`life:${e.life.gen}:${e.life.title}:${e.life.source}`:'');}
function chronicleCast(e){return [...new Map([...(e.life?.people||[]),...(e.event?.participants||[])].map(p=>[p.id,p])).values()];}
function chronicleMatches(e,f={}){return (!f.year||chronicleYear(e)===f.year)&&(!f.topic||chronicleTopic(e)===f.topic)&&(!f.person||chronicleCast(e).some(p=>String(p.id)===f.person))&&(!f.thread||chronicleThread(e)===f.thread)&&(!f.query||[e.d,e.t,e.life?.summary,e.life?.source,e.event?.situation,e.event?.choice,e.event?.outcome,...chronicleCast(e).map(p=>p.name)].join(' ').toLocaleLowerCase().includes(f.query.toLocaleLowerCase()));}
function chroniclePersonTarget(id){
 if(typeof id==='string'&&id.startsWith('white-spring-'))return whiteSpringKinTarget(id);
 const number=Number(id),consort=familyHostById(number),child=royalById(number),scholar=scholarById(id);
 if(consort)return {person:consort,view:'consort',id:number};
 if(child)return {person:child,view:S.children.includes(child)?'kid':'relative',id:number};
 if(scholar)return {person:scholar,view:'scholar',id};
 if(typeof id==='string'&&id.startsWith('grand-')){
  const entry=householdChildEntry(id);if(entry)return {person:entry.child,view:'household-child',id};
 }
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
 return target?`<button class="btn quiet sm" data-onclick="A.go('${target.view}',${esc(JSON.stringify(target.id))})">${esc(p.name)}</button>`:esc(p.name);
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
function chronicleSummary(entry){
 const legacy=/^【宫门私约】/.test(entry.t)&&!entry.t.includes('肌肤之亲')?'<p class="hint">旧录只载私情，未记两人是否已有肌肤之亲。</p>':'';
 return legacy+(entry.life?.summary?detailFold('查看这件事的原记',`<p>${esc(entry.life.summary)}</p>`):'');
}
function compareChronicleOccasion(details){
 if(!details.open)return;
 const output=details.querySelector('div');
 const owner=details.dataset.owner,index=Number(details.dataset.index);
 const find=id=>chroniclePersonTarget(id)?.person||fenghuaAll().find(p=>String(p.id)===String(id)||p.hongjian?.previousId===id);
 const p=find(owner),entry=p?.story?.[index];if(!entry)return;
 const notes=[];
 for(const ref of chronicleCast(entry)){
  if(String(ref.id)===owner)continue;
  const other=find(ref.id),notesOf=other?.story||[];
  const note=(entry.occasion&&notesOf.find(e=>e.occasion===entry.occasion))||(entry.sceneOccasion&&notesOf.find(e=>e.sceneOccasion===entry.sceneOccasion));
  if(note)notes.push('<p><strong>'+esc(ref.name)+'</strong>　'+esc(note.t===entry.t?'两份纪事同录了上面这段经过。':note.t)+'</p>');
 }
 output.innerHTML=notes.join('')||'<p class="hint">现存档案里只找到这一份原记。</p>';
}
function chronicleReader(person,{compact=false}={}){
 const source=person.story||[];if(!source.length)return '<p class="hint">尚无记载。</p>';
 const entries=chronicleVisibleEntries(source);
 const key=`${S.gen}:${person.id}`,f=UI.chronicleFilters?.[key]||{},years=[...new Set(source.map(chronicleYear))].reverse(),people=[...new Map(source.flatMap(chronicleCast).filter(p=>p.id!==person.id).map(p=>[p.id,p])).values()];
 const select=(field,title,options)=>`<label>${title}<span class="chronicle-select"><select aria-label="纪事${title}" data-onchange="A.chronicleFilter('${key}','${field}',this.value)"><option value="">全部</option>${options.map(([value,label])=>`<option value="${esc(value)}" ${String(f[field])===String(value)?'selected':''}>${esc(label)}</option>`).join('')}</select></span></label>`;
 const results=entries.filter(({e})=>chronicleMatches(e,f)).reverse();
 const rows=results.map(({e,i})=>{
  const ev=e.event,thread=chronicleThread(e),related=thread?source.filter(x=>chronicleThread(x)===thread):[],cast=chronicleCast(e).filter(p=>p.id!==person.id);
  const context=ev&&!ev.embedded?detailFold('回看事由与处理',`<p>${esc(ev.title)} · ${esc((ev.participants||[]).map(p=>p.name).join('、'))}</p><p>${esc(ev.situation)}</p><p>陛下回应：${esc(ev.choice)}</p>${ev.outcome?`<p>${esc(ev.outcome)}</p>`:''}`):'';
  return `<li><time>${esc(e.d)}</time>${esc(e.t)}${chronicleSummary(e)}${e.life?.source?`<p class="hint">缘起：${esc(e.life.source)}</p>`:''}${cast.length?`<div class="chronicle-cast">相关人物：${cast.map(chroniclePersonLink).join(' ')}</div>`:''}${related.length>1?`<button class="btn quiet sm" data-onclick="A.chronicleThread('${key}',${i})">回看前因与后续 · ${related.length}则</button>`:''}${context}${cast.length&&(e.occasion||e.sceneOccasion)?`<details data-owner="${esc(String(person.id))}" data-index="${i}" data-ontoggle="compareChronicleOccasion(this)"><summary>对读当事人纪事</summary><div></div></details>`:''}</li>`;
 });
 const active=Object.values(f).some(Boolean),list=a=>`<ul class="story">${a.join('')}</ul>`;
 const filters=select('year','年份',years.map(y=>[y,y]))+select('topic','主题',LIFE_CHAPTERS.map(c=>[c.key,c.title]))+(people.length?select('person','人物',people.map(p=>[p.id,p.name])):'');
 const toolbar=`<div class="chronicle-tools">
   <form role="search" aria-label="人物纪事" class="chronicle-search" data-onsubmit="event.preventDefault();A.chronicleSearch('${key}')">
     <input id="chronicle-search-${key}" aria-label="搜索人物纪事" enterkeyhint="search" maxlength="100" placeholder="搜索人名、往事或一句话" value="${esc(f.query||'')}">
     <button type="submit" class="btn jade sm">搜索纪事</button>
   </form>
   <div class="chronicle-filters">${filters}</div>
   <div class="chronicle-results"><p class="hint" role="status">按时间倒序，最近记载在前 · ${f.thread?'正在回看同一件事的前因与后续 · ':''}共${entries.length}则${active?`，找到${results.length}则`:''}。</p>${active?`<button type="button" class="btn quiet sm" data-onclick="A.chronicleClear('${key}')">显示全部纪事</button>`:''}</div>
 </div>`;
 const controls=compact?`<details class="chronicle-filter-fold"${active?' open':''}><summary>搜索与筛选</summary>${toolbar}</details><p class="chronicle-order hint">按时间倒序，最近记载在前 · 共${entries.length}则${active?`，找到${results.length}则`:''}。</p>`:toolbar;
 return `${controls}${rows.length?(active?list(rows):list(rows.slice(0,6))+(rows.length>6?detailFold(`翻阅更早的纪事（${rows.length-6}条）`,list(rows.slice(6))):'')):'<p class="hint">没有符合筛选的纪事，可清除筛选重新翻看。</p>'}`;
}
A.chronicleFilter=function(key,field,value){if(!['year','topic','person'].includes(field))return;((UI.chronicleFilters||={})[key]||={})[field]=String(value);render();};
A.chronicleSearch=function(key){((UI.chronicleFilters||={})[key]||={}).query=(document.getElementById?.('chronicle-search-'+key)||$('[id="chronicle-search-'+key+'"]'))?.value?.trim().slice(0,100)||'';render();};
A.chronicleClear=function(key){if(UI.chronicleFilters)delete UI.chronicleFilters[key];render();};
A.chronicleThread=function(key,index){
 const id=key.slice(key.indexOf(':')+1),person=chroniclePersonTarget(id)?.person;
 const thread=person&&chronicleThread(person.story?.[index]||{});if(thread){(UI.chronicleFilters||={})[key]={thread};render();}
};
