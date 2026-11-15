/* 家世是生活经验，不是性格判词。稀疏抽取原创小事，不把文物材料冒充人物实录。 */
const ORIGIN_VIGNETTES={
 noble:[['礼器的分寸','看见宴饮器皿的纹样，想起家中教过的礼数，逐件核对是否合自己的身份。'],['旧藏重理','将家中带来的旧书与小画重新包好，在题签旁记下保存时的细节。'],['一幅绣样','翻出旧日描过的绣样，辨认出一处自己年轻时留下的改笔。'],['衣缘与心事','挑选常服的绦边时，记起昔日衣箱里的颜色，最后仍照今日的心意选了一条。']],
 scholar:[['书页有痕','理旧书时发现页边的批注，想起求学时那个尚未想明白的问题。'],['校一处错字','在抄本里发现一处讹字，取另一本仔细核对，未急着笑话执笔的人。'],['雨中护书','雨气渐重，将书页摊在晴窗下晾过，再收回干燥的匣中。'],['不署家门','写下一小段自己的见闻，题的是自己的名字，想留下一点不只关乎家门的东西。']],
 farm:[['听雨想田','夜里听见雨声，想起乡间灌田的时节。隔着高墙，也能记起湿土的气味。'],['一粒米','看见饭粒落在案边，记起稻谷从收刈、舂碓到入仓的劳作，轻轻将碗往里挪了挪。'],['桑叶新绿','见新桑发芽，想起旧时采桑、看蚕的忙碌，辨认出叶子还嫩时的颜色。'],['旧布补衣','替一件旧衣挑了相称的补布。做完才发现，家中教过的手势一直没有忘。']],
 merchant:[['一尺绸的价','见两匹绸料色泽相近，仍从织纹与分量认出不同，想起旧日听过的买卖道理。'],['不只会算账','翻过一本旧账，留心的不只是收支，也记得每笔银钱背后的吃穿用度。'],['路远货迟','听说一批货路上耽搁，想起往来商旅看天候、候渡口的辛苦，没有只怨送得慢。'],['乡味的包纸','收好包过点心的印花纸，想起家乡铺面里熟悉的香气与叫卖声。']],
 foreign:[['故乡的小调','哼起一段故乡小调，记起的是自己的旧日生活，并不愿只被当作席上的异域新鲜。'],['两种称呼','为一个熟悉的物件写下两种叫法，反复念了念，觉得两种声音都属于自己。'],['异乡食味','尝到一口似曾相识的香料，先笑了一下，随后又因味道并不全同而有些想家。'],['织纹记忆','看到织物上相似的纹路，想起故乡衣饰。她说明那只是自己的来处，不代表所有异乡人的习惯。']],
 medicine:[['药香旧忆','闻见煎药的气味，想起家中辨认药材的耐心，却没有把记得的名字当作可以随意开方的本领。'],['一张旧方笺','收好旧日留下的方笺，把纸上的字迹描了一遍，想到医家最看重的谨慎。'],['先问安睡','听人说身体困倦，先问饮食和睡眠，再请通医理的人仔细看过。'],['晒药的晴天','见到连日放晴，想起药材受潮时家中忙着翻晒的样子，觉得日光也有让人安心的分量。']],
 military:[['旧弓弦','整理旧物时看见弓弦，想起家中说过，手上的准头须靠长久练习。'],['御寒针线','看见厚实的衣料，首先想起边地风寒，缝边时特意把针脚收得密些。'],['地图边角','在地图边角找到一个熟悉的地名，想起军户家里等平安信时的沉默。'],['不止捷报','听见有人只说军功荣耀，想到军旅还有行囊、伤病和漫长的归途。']],
 humble:[['量入为出','挑日用物件时，习惯先问是否耐用。旧日的小日子并不富足，却教会她珍惜合手的东西。'],['手作小物','修好一件不起眼的小物，没有添金描彩，只因它用起来仍然顺手。'],['一碗乡味','试着调出家常汤的味道，想起寻常人家也有值得惦记的热饭与灯火。'],['邻里旧事','想起从前街巷里互相照应的小事。门第不高的日子，也不是只有窘迫与委屈。']]
};
function originGroup(c){
  const title=familyTitle(c)||c.fam?.t||'';
  if(c.rescue||/西域|异族|异乡|外邦/.test(title))return 'foreign';
  if(/太医|医家/.test(title))return 'medicine';if(/将军|军户|武将/.test(title))return 'military';
  if(/皇商|商户|盐商/.test(title))return 'merchant';if(/书香|翰林/.test(title))return 'scholar';
  if(/农家/.test(title)||title==='寒门'&&houseOf(c)?.father.office==='务农')return 'farm';
  return familyIsNoble(c)?'noble':'humble';
}
function originThought(p){
  if(isSolitary(p))return '她不想把这段往事说给许多人听，只在独处时认真记下。';
  if(['骄纵','骄矜'].includes(p.trait))return '她仍有自己的讲究，却也承认，这点习惯并非人人都得懂。';
  if(['才女','好学','聪慧'].includes(p.trait))return '她把所见与旧日读过的文字对照，又多记下一点自己的理解。';
  if(['活泼','爽直','好客'].includes(p.trait))return '她说起这件小事时语气鲜活，倒像又回到从前熟悉的日子。';
  if(['善妒','城府'].includes(p.trait))return '她先留意旁人的反应，最终仍把真正的感受留给自己。';
  if(p.trait==='体弱')return '她做了一会儿便歇下，事情不急着做完，心里却比先前安稳些。';
  return '她没有觉得这是什么大事，记起时，却发现自己一直记得。';
}
function originLifeEligible(c,p){
  const consort=S.consorts.includes(p),age=consort?p.age:natalAge(p);
  return p.alive&&age>=18&&!p.consortId&&(!consort||inPalace(p)&&!p.maid&&p.hp>=40&&!maternalUnsettled(p))&&
    !p.natalPregnancy&&!p.widow&&(!consort||!['悲恸','心如死灰','惶恐','怨恨'].includes(xinOf(p)))&&S.turn-(p.originLife?.last??-99)>=12;
}
function recordOriginLife(c,p,index){
  if(!careersActive()||!originLifeEligible(c,p))return null;
  const group=originGroup(c),items=ORIGIN_VIGNETTES[group],entry=items[index],key=group+':'+index;if(!entry||S.turn-(p.originLife?.seen?.[key]??-99)<36)return null;
  const life=p.originLife ||= {seen:{}};life.last=S.turn;life.seen[key]=S.turn;
  const text=`${entry[1]}${originThought(p)}`,name=S.consorts.includes(p)?fullName(p):p.name;life.latest={title:entry[0],text,turn:S.turn,group};
  if(S.consorts.includes(p))story(p,`【家世日常·${entry[0]}】${name}${text}`);else natalRecord(c,p,`【家世日常·${entry[0]}】${name}在家书中说起：${text}`,.2);
  NPCMemory.record(S,{type:'origin-life',time:S.turn,participants:[p.id],object:entry[0]},[{person:p.id,subject:'self',interpretation:text,emotion:.2,impact:35}]);return life.latest;
}
function originLifeTick(){
  if(!careersActive()||S.flags.originLifeChecked===S.turn)return;S.flags.originLifeChecked=S.turn;
  if(S.turn-(S.flags.lastOriginLife??0)<3||!chance(.35))return;
  const pool=[],seen=new Set();for(const c of S.consorts){if(originLifeEligible(c,c))pool.push({c,p:c});const h=houseOf(c);if(!h||seen.has(h.father.id))continue;seen.add(h.father.id);
    for(const p of natalPeople(h))if(p.sex==='f'&&originLifeEligible(c,p))pool.push({c,p});}
  if(!pool.length)return;const {c,p}=pick(pool),group=originGroup(c),options=ORIGIN_VIGNETTES[group].map((_,i)=>i).filter(i=>S.turn-(p.originLife?.seen?.[group+':'+i]??-99)>=36);
  if(options.length&&recordOriginLife(c,p,pick(options)))S.flags.lastOriginLife=S.turn;
}
function originLifeVoice(c){const m=c.originLife?.latest;return m&&S.turn-m.turn<=6?voiceLine('origin-life','她提起一件与家世和旧日生活有关的小事。',m.text):null;}

/* 亲姐妹与堂姐妹：同姓不自动结亲，私下诉苦也不等于另一方已经知情。 */
function palaceSisters(c){return harem().filter(o=>o!==c&&(/^[亲堂族][姐妹]/.test(c.kin?.[o.id]||'')||sameFather(c,o)));}
function sisterKinName(c,o){return c.kin?.[o.id]||((o.age>c.age?'姐姐':'妹妹'));}
function sisterPairReady(c,o){return cohabAvailable(c)&&cohabAvailable(o)&&palaceSisters(c).includes(o);}
function sisterPrivateLine(c,o){
  const kin=sisterKinName(c,o),name=fullName(o),bad=relGet(c,o)<=-25;
  if(bad)return isSolitary(c)?`${kin}${name}与臣妾虽有亲缘，想法却不同。各留些清静，比勉强时时作伴好。`:['骄纵','骄矜','善妒'].includes(c.trait)?`${kin}${name}近来说话总让臣妾难受。家里人只叫我们和气，却不问臣妾受了什么委屈。`:`与${kin}${name}有些旧结。臣妾也想和气，只是心里不舒服，总得找个地方说说。`;
  return isSolitary(c)?`${kin}${name}来时，知道臣妾喜静。我们各看各的书，不必一直说话，也不觉得生分。`:`${kin}${name}还记得臣妾从前的小习惯。得空分一碟点心、说几句家常，比在人前叫姐妹更叫人安心。`;
}
function sisterTalkPartner(c){if(!careersActive()||!cohabAvailable(c)||S.turn-(c.sisterTalkAt??-99)<6)return null;return palaceSisters(c).filter(o=>sisterPairReady(c,o)&&(relGet(c,o)>=35||relGet(c,o)<=-25)).sort((a,b)=>Math.abs(relGet(c,b))-Math.abs(relGet(c,a)))[0]||null;}
function sisterChatLine(c){const o=sisterTalkPartner(c);if(!o||!chance(.4))return '';c.sisterTalkAt=S.turn;const line=sisterPrivateLine(c,o);story(c,`【说起姐妹】与陛下私下谈起${fullName(o)}：“${line}”`);remember(c,'sister-talk',line);return `她又说起${fullName(o)}：“${line}”`;}
function sisterVisitCandidate(name,c){
  if(!careersActive()||!c||!cohabAvailable(c))return null;
  return palaceSisters(c).find(o=>sisterPairReady(c,o)&&o.palace!==name&&relGet(c,o)>=35&&S.turn-(S.flags.sisterVisits?.[cohabKey(c,o)]?.turn??-99)>=6&&voiceHash(`${S.gen}:${S.turn}:${c.id}:${o.id}:sister-visit`)%((isSolitary(c)||isSolitary(o))?10:4)===0)||null;
}
function recordSisterVisit(c,o){
  if(!sisterPairReady(c,o))return null;const key=cohabKey(c,o);if(S.flags.sisterVisits?.[key]?.turn===S.turn)return S.flags.sisterVisits[key];
  const quiet=isSolitary(c)||isSolitary(o),text=`${fullName(o)}来${c.palace}探望${sisterKinName(o,c)}${fullName(c)}。${quiet?'两人各看一卷书，偶尔说一句，彼此都知道何时该留些安静。':'两人分着一碟点心，提起旧日家中的小事，连彼此挑食的习惯也还记得。'}`;
  const record={turn:S.turn,host:c.id,guest:o.id,text};(S.flags.sisterVisits ||= {})[key]=record;
  for(const p of [c,o])story(p,`【姐妹串门】${text}`);relAdd(c,o,quiet?1:3);return record;
}
const sistersArrival=palaceArrivalEvent;
palaceArrivalEvent=function(name,id){
  const ev=sistersArrival(name,id);if(!ev||id!=null||ev.arrival.together)return ev;
  const c=ev.arrival.c,o=sisterVisitCandidate(name,c);if(!o)return ev;
  ev.arrival.sisterGuest=o;ev.cast=[c,o];ev.present=[c,o];const show=ev.onShow,valid=ev.valid;
  ev.valid=()=>valid()&&sisterPairReady(c,o)&&o.palace!==name;
  ev.onShow=()=>{show?.();recordSisterVisit(c,o);save('auto');};
  ev.choices.splice(1,0,{t:'和姐妹一同坐坐 · 精力−1',cond:()=>E().energy>0,why:'精力不足',f:()=>{if(!ev.valid()||!useE())return null;const text=`陛下到${name}时遇见${fullName(c)}与${fullName(o)}相伴，听两人把旧日家常说完。`;for(const p of [c,o])story(p,`【姐妹同坐】${text}`);relAdd(c,o,2);return text;}});return ev;
};
const sistersArrivalHTML=palaceArrivalHTML;
palaceArrivalHTML=function(ev){const o=ev.arrival.sisterGuest;return sistersArrivalHTML(ev)+(o?`<section class="detail-section"><h3>姐妹也在这里</h3><p>${porImg(o,76)} ${esc(fullName(o))}正来探望${esc(sisterKinName(o,ev.arrival.c))}。她是来作客，并未迁入此宫。</p><p>${esc(sisterPrivateLine(ev.arrival.c,o))}</p></section>`:'');};
const familyDailyTick=livedRelationshipsTick;
livedRelationshipsTick=function(...args){const result=familyDailyTick.apply(this,args);originLifeTick();return result;};
