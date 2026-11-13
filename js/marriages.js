/* 皇嗣议婚：入口、固定名帖与皇子赐婚。公主仍沿用开府和旧日相识路线。 */
const marriageEligible=k=>!!(k?.alive&&S.children.includes(k)&&kidAge(k)>=15&&!k.jailed&&!k.married&&!k.pendingName&&!S.over);
const marriageReady=k=>marriageEligible(k)&&S.turn>=(k.marriageAfter??0);
const PRINCE_MATCHES={
  scholar:{name:'书香人家',note:'她喜欢校书作画，希望婚后还能保留自己的书房。',stat:'lit',gain:5},
  martial:{name:'将门人家',note:'她自幼习骑射，愿与他一道练习，也不愿被困在内宅。',stat:'mar',gain:5},
  household:{name:'清正官宦',note:'她性情温厚，擅理家事，愿同他商量府中的大小安排。',stat:'vir',gain:5}
};
function marriageCandidate(k,route){
  k.marriageCandidates ||= {};
  if(k.marriageCandidates[route])return k.marriageCandidates[route];
  const excluded=new Set([E().sur,byId(k.mom)?.sur,byId(k.foster)?.sur,...Object.values(k.marriageCandidates).map(p=>p.sur)]);
  const sur=pick(SUR.filter(s=>!excluded.has(s))),sex=k.sex==='m'?'f':'m';
  const name=sur+(sex==='f'?pick(GIV)+pick(GIV):pick(['子','景','怀','允','修','知'])+pick(BOYC));
  const person={id:`match-${k.id}-${route}`,courtGuest:true,sex,name,sur,born:S.turn-(Math.max(15,kidAge(k))+ri(0,2))*12,
    seed:ri(1,2e9),alive:true,route,background:k.sex==='m'?PRINCE_MATCHES[route].name:PRINCESS_MATCHES[route].name};
  if(sex==='f')person.appearance=makeGirl({sur,given:name.slice(sur.length),age:kidAge(person),
    trait:{scholar:'好学',martial:'将门',household:'温婉'}[route],
    fam:{t:{scholar:'翰林学士',martial:'镇国大将军',household:'知府'}[route],p:{scholar:50,martial:65,household:38}[route]}});
  k.marriageCandidates[route]=person;
  return person;
}
function marriageEmpress(k){
  const spouse=k.married&&k.spouse;if(!spouse)return null;
  const em=spouse.appearance?JSON.parse(JSON.stringify(spouse.appearance)):makeGirl({sur:spouse.sur,given:spouse.name.slice((spouse.sur||'').length)});
  em.age=Math.max(15,kidAge(spouse));return em;
}
function marriageStatus(k){
  if(!k.alive)return '';
  if(k.married)return k.spouse?`已赐婚 · ${k.spouse.name}`:'婚事已定';
  if(k.jailed)return '圈禁期间暂不议婚';
  if(k.pendingName||kidAge(k)<15)return '满十五岁可议婚赐婚';
  if(S.turn<(k.marriageAfter??0))return `婚事暂缓 · 还需${k.marriageAfter-S.turn}个月`;
  return '已满十五岁 · 可以议婚';
}
function marriageButton(k,small=false){
  return marriageEligible(k)?`<button class="btn ${small?'sm ':''}gold" onclick="A.kidMarriage(${k.id})" ${marriageReady(k)?'':'disabled'}>议婚 / 赐婚${marriageReady(k)?' →':`<small>还需${k.marriageAfter-S.turn}个月</small>`}</button>`:'';
}
function marriagePanel(k){
  if(!k.alive)return '';
  const spouse=k.spouse;
  return `<section class="marriage-panel" aria-label="皇嗣婚事"><div><strong>${esc(marriageStatus(k))}</strong><p class="hint">${spouse?esc(spouse.background||spouse.fatherName&&spouse.fatherName+'之子'||'双方心意已定'):
    k.married?'这门婚事已经记入起居注。':kidAge(k)<15?'长成后可在这里查看人选，先问心意，再下赐婚诏。':'先看名帖、听本人意愿，再确认赐婚；也可以暂缓半年。'}</p>${Number.isFinite(spouse?.trust)?`<p class="hint">夫妻信任 ${rd(spouse.trust)} / 100${spouse.story?.length?' · '+esc(spouse.story[spouse.story.length-1].t):''}</p>`:''}</div>${marriageButton(k)}</section>`;
}
function princeMarriage(k){
  const order=k.lit>=k.mar&&k.lit>=k.vir?['scholar','household','martial']:k.mar>=k.vir?['martial','household','scholar']:['household','scholar','martial'];
  const people=order.map(route=>marriageCandidate(k,route));
  return {title:'皇子议婚',por:k,valid:()=>marriageReady(k),text:`礼部送来三家的名帖。${kidName(k)}请你先听听他的心意，再决定这门婚事。\n名帖上写着家世与平日喜好，可逐一细问，或留待日后再议。`,choices:[
    ...people.map(p=>({t:`看看${p.name} · ${p.background}`,person:p,f:()=>{pushNow(princeMatchReview(k,p.route));return null;}})),
    {t:'暂缓半年，让他再想想',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '名帖收在礼部，半年后可再从皇嗣详情议婚。';}}
  ]};
}
function princeMatchReview(k,route){
  const p=marriageCandidate(k,route),match=PRINCE_MATCHES[route],statName={lit:'才学',mar:'武艺',vir:'品德'}[match.stat];
  const fits=k[match.stat]>=Math.max(k.lit,k.mar,k.vir);
  return {title:'赐婚前问心意',cast:[k,p],valid:()=>marriageReady(k),text:`${p.name} · ${kidAge(p)}岁 · ${p.background}\n${match.note}\n${k.name}${fits?'听得认真，说两人倒有相投之处。':'想了想，说愿意先听她亲口谈谈将来的打算。'}\n礼部已分别问过双方，二人愿意议定。婚仪需国库五十万两；婚后${statName}+${match.gain}，父爱+${fits?10:5}。`,choices:[
    {t:'下诏赐婚 · 国库−50万两',primary:true,cond:()=>E().treasury>=50&&marriageReady(k),f:()=>{
      if(!marriageReady(k)||E().treasury<50)return null;
      k.married=true;k.spouse={...p,marriedAt:S.turn};k[match.stat]=clamp(k[match.stat]+match.gain);k.love=clamp(k.love+(fits?10:5));
      princessMemory(k,'child_marriage',`经问双方心意，与${p.name}议定婚事。`,'礼部');log(`${kidName(k)}赐婚${p.name}。`,1);
      const result=chg({treasury:-50});save('auto');return `${k.name}与${p.name}的婚事已定。${k.away?'礼部将诏书送往封地。':'婚后仍留京，原有课业和亲人往来照常。'}${fx(result)}`;
    }},
    {t:'再看别的人选',f:()=>{pushNow(princeMarriage(k));return null;}},
    {t:'暂缓半年',f:()=>{k.marriageAfter=S.turn+6;save('auto');return '婚事暂缓半年。';}}
  ]};
}
A.kidMarriage=function(id){
  const k=kidById(id);if(modalOpen||!marriageReady(k))return;
  if(k.sex==='f'){A.princessMarriage(id);return;}
  pushEv(princeMarriage(k));save('auto');
};
