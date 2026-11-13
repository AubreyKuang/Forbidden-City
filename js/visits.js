/* ============ 出巡 ============ */
A.out=function(kind){ if(!useE())return; const e=E();
  if(kind==='garden'){setScene('garden');
    const h=harem();
    const roll=R();
    if(roll<.5&&h.length){const c=pick(h);const t=pick([`${cName(c)}正在亭中扑蝶，见你来了，红着脸躲到柱子后面。`,`你远远听见琴声，循声而去，原来是${cName(c)}在水榭抚琴。`,`${cName(c)}在池边喂鱼，鱼儿聚了一大片。她笑着分了你一把鱼食。`,`细雨忽至，你与${cName(c)}在回廊下躲雨，说了许多话。`]);
      story(c,`与陛下在御花园偶遇。${t}`);pushEv({title:'御花园偶遇',por:c,text:t+fx(cchg(c,{favor:6,aff:6,mood:10})),choices:[{t:'今夜便召她侍寝',cond:()=>E().energy>0&&!c.preg,why:c.preg?'她有孕在身':'精力不足',f:()=>{nightWith(c);return null}},{t:'与她作别'}]});}
    else {
      const encounter=roll>=.5&&roll<.6?maidEvent('御花园'):null;
      if(encounter){pushEv(encounter);return;}
      const s=chg({health:2});pushEv({title:'御花园',text:`${pick(['春日融融，百花争艳。','荷风送香，蝉鸣阵阵。','丹桂飘香，层林尽染。','红梅映雪，暗香浮动。'][season()])}你独自走了一圈，心旷神怡。${fx(s)}`,choices:[{t:'回宫'}]});
    }
  }
  else if(kind==='city'){setScene('city');
    const ev=pick(['girl','tea','porridge','assassin','girl']);
    if(ev==='girl'){const g=makeGirl({fam:pick([{t:'寒门',p:5},{t:'书香门第',p:15},{t:'皇商',p:30}]),age:ri(16,19)});
      const t=pick([`街角书肆里，一位姑娘正与掌柜争论一句诗的出处，句句有据，掌柜哑口无言。`,`桥头一个卖花的姑娘不小心把花篮撞翻在你脚边，抬头一笑，你怔了一怔。`,`茶楼上有位姑娘凭栏而立，正在吹一支竹笛，曲调清越。`]);
      pushEv({title:'市井奇缘',por:g,text:`${t}\n随从打听到，她名唤${fullName(g)}，${g.fam.t}出身，年方${g.age}。`,choices:[
        {t:'接她入宫，封为答应（大臣或有非议）',f:()=>{addConsort(g,1,'陛下微服出宫时结识，接入宫中');g.aff=40;g.favor=30;const s=chg({prestige:-2});return `她又惊又喜，跪下谢恩。${fx(s)}`}},
        {t:'赏她些银钱，就此别过',f:()=>'她屈膝道谢，转身没入人群。'}]})}
    else if(ev==='tea'){pushEv({title:'茶馆闻声',text:'你在茶馆里听见几个商贩议论：某地知县强征“修河银”，百姓苦不堪言。',choices:[
      {t:'回宫立即严查',f:()=>{const s=chg({people:6,prestige:2,treasury:40});log('帝微服私访，查办贪墨知县，抄没家产。');return `知县被革职拿问，抄没的赃银充入国库。${fx(s)}`}},{t:'记下，暂不声张',f:()=>'你把这件事记在了心里。'}]})}
    else if(ev==='porridge'){pushEv({title:'城门施粥',text:'城门外聚着不少逃荒的百姓，衣衫褴褛。',choices:[
      {t:'命人设粥棚（国库-30万两）',f:()=>{const s=chg({treasury:-30,people:5});log('帝于城门设粥棚，赈济流民。');return `百姓不知你的身份，只一个劲地道谢。${fx(s)}`}},{t:'默然离开',f:()=>'你转身离去，心里沉甸甸的。'}]})}
    else {const p=.45+e.wu/200;pushEv({title:'遇刺',sfx:'err',text:'巷口忽然窜出一名黑衣人，手持短刃直扑而来！',choices:[{t:'迎战',f:()=>{if(chance(p)){const s=chg({prestige:3});log('帝微服遇刺，亲手擒贼。',1);return `你侧身避过，反手将刺客制住。${fx(s)}`}const s=chg({health:-12});log('帝微服遇刺，负伤回宫。',1);return `你虽击退刺客，左臂却被划了一道口子。${fx(s)}`}}]})}
  }
  else if(kind==='hunt'){setScene('garden');const p=.4+e.wu/180;
    if(chance(p)){const s=chg({prestige:6,health:2});log('帝于南苑围猎，亲射猛虎。',1);pushEv({title:'南苑围猎',text:`你纵马入林，弯弓射中一头吊睛白额虎，将士欢声雷动。${fx(s)}`,choices:[{t:'凯旋'}]})}
    else if(chance(.3)){const s=chg({health:-10});pushEv({title:'南苑围猎',sfx:'err',text:`马匹受惊，你从马背上摔下，扭伤了腰。${fx(s)}`,choices:[{t:'回宫养伤'}]})}
    else{const s=chg({prestige:2});pushEv({title:'南苑围猎',text:`收获平平，猎得几只野兔獐子。${fx(s)}`,choices:[{t:'回宫'}]})}}
  else if(kind==='temple'){setScene('garden');S.flags.bless=S.turn;const s=chg({people:2,health:2,treasury:-20});log('帝往护国寺进香祈福。');
    pushEv({title:'护国寺祈福',sfx:'chime',text:`你在护国寺上香，为国祚、为子嗣祈福。方丈说：“陛下仁心，必有福报。”\n也可在这里安排皇子公主祈福，或妃嫔入寺清修。\n（本月宠幸妃嫔更易得子）${fx(s)}`,choices:[
      {t:'安排皇子公主来祈福',f:()=>{pushNow(templeRosterEvent('kids'));return null;}},
      {t:'安排妃嫔来祈福或清修',f:()=>{pushNow(templeRosterEvent('consorts'));return null;}},{t:'回宫'}]})}
  else if(kind==='spa'){setScene('garden');const s=chg({health:5,treasury:-60});log('帝往西山温泉行宫休养。');
    pushEv({title:'温泉行宫',text:`西山温泉氤氲，你静养了几日，精神好了许多。${fx(s)}`,choices:[{t:'回宫'}]})}
};
function maidEncounterReady(){return S.turn-(S.flags.lastMaidEncounter??-Infinity)>=4;}
function maidEvent(where){
  if(!maidEncounterReady())return null;
  const g=makeGirl({fam:{t:'宫女',p:3},age:ri(16,19)});
  return {title:'宫女',maidEncounter:true,por:g,text:`${where}的花径上，一个小宫女正低头扫落花，口中轻轻哼着家乡的小调。你问她名字，她慌忙跪下：“奴婢${fullName(g)}。”`,choices:[
    {t:'今夜召她侍寝（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{g.maid=true;g.near=false;g.palace='尚衣局';g.favor=20;g.aff=25;S.consorts.push(g);deepen(g);story(g,`本是${where}一带当差的宫女，被陛下看中。`);maidNight(g);return null}},
    {t:'收为官女子',f:()=>{addConsort(g,0,'本为宫女，蒙陛下青眼');g.favor=25;g.aff=30;return `${fullName(g)}受宠若惊，磕了好几个头。`}},
    {t:'赏她一支簪子',f:()=>'她捧着簪子，红着脸退下了。'}]};
}

/* ============ 太后与节令 ============ */
// Persist maternal identity, recommendation history and continuous eligibility across saves.
function ensureDowager(){
  const d=S.flags.dowager;if(!d)return null;
  const legacy=S.consorts.filter(c=>c.fam.t==='太后母家');
  d.sur=d.sur||d.name.replace(/太后$/,'')||legacy[0]?.sur||pick(SUR.filter(x=>x!==S.emp.sur));
  d.fam=d.fam||{t:'太后母家',p:72};
  d.clan=d.clan||d.sur+'|'+d.fam.t;
  for(const c of legacy){c.sur=d.sur;c.clan=d.clan;c.fam={...d.fam,p:c.fam.p};}
  if(d.lastOffer===undefined)d.lastOffer=(d.recommended||legacy.length)?S.turn:null;
  if(d.cooldown===undefined)d.cooldown=24;
  delete d.recommended;delete d.candidate;
  for(const c of S.consorts.filter(c=>c.clan===d.clan)){
    if(c.enteredAt===undefined)c.enteredAt=S.turn;
  }
  return d;
}
function dowagerKin(){const d=ensureDowager();return d?S.consorts.filter(c=>c.clan===d.clan&&c.alive&&!c.gone&&!c.maid):[]}
function dowagerTick(){
  for(const c of dowagerKin()){
    if(c.favor<20&&!c.cold){if(c.neglectedSince===undefined)c.neglectedSince=S.turn}
    else delete c.neglectedSince;
  }
}
function dowagerProposal(d){
  if(d.lastOffer!==null&&S.turn-d.lastOffer<d.cooldown)return null;
  const kin=dowagerKin();
  // A pregnancy or a family member in disgrace makes another introduction inappropriate.
  if(kin.some(c=>c.preg||c.cold))return null;
  const eligible=kin.filter(c=>c.age>=17&&S.turn-c.enteredAt>=24);
  const neglected=eligible.find(c=>c.favor<20&&c.neglectedSince!==undefined&&S.turn-c.neglectedSince>=12);
  const childless=eligible.find(c=>c.lastBirth<0&&!S.children.some(k=>k.mom===c.id));
  const sister=neglected||childless;
  if(kin.length&&!sister)return null;
  const reason=sister?(neglected?'久未承宠，独居宫中':'入宫已有两年，膝下仍无子女'):'';
  const g=makeGirl({sur:d.sur,fam:{...d.fam},age:sister?Math.min(ri(16,19),sister.age-1):ri(16,19)});
  g.clan=d.clan;
  const text=sister?`${d.name}说：“${fullName(sister)}${reason}，哀家想着，让她的堂妹${fullName(g)}入宫，也好有个说话的伴儿。皇帝意下如何？”`:
    `${d.name}说：“哀家母族有位姑娘${fullName(g)}，性子${g.trait}，模样也周正，皇帝看看？”`;
  return {title:'太后荐人',por:g,text,onShow:()=>{d.lastOffer=S.turn;d.cooldown=24},choices:[
    {t:'准她入宫，封为贵人',f:()=>{
      if(S.consorts.some(c=>c.id===g.id))return '她已经入宫了。';
      if(sister){g.kin={[sister.id]:'堂姐'};g.kinRival={};sister.kin=sister.kin||{};sister.kin[g.id]='堂妹';g.kinNote=`${fullName(sister)}的堂妹`;}
      addConsort(g,3,'由太后举荐入宫');
      remember(g,'family',sister?`太后因${fullName(sister)}${reason}，举荐我入宫与堂姐相伴。`:'太后举荐我入宫，陛下准许，封为贵人。');
      if(sister){story(sister,`太后因她${reason}，举荐堂妹${fullName(g)}入宫相伴。`);remember(sister,'family',`陛下准许太后举荐的堂妹${fullName(g)}入宫，与我作伴。`);}
      return '太后点头，嘱咐她入宫后恪守宫规。'+fx(chg({prestige:1}));}},
    {t:'婉拒，暂不添新人',f:()=>{d.cooldown=12;if(sister)remember(sister,'family','太后想让堂妹入宫陪伴我，陛下暂未答应。');return '太后收起画像：“也罢，此事以后再议。”';}}
  ]};
}
function dowagerEvent(){const d=ensureDowager();if(!d||!d.alive)return null;
  const r=R();
  if(r<.35&&kidsAlive().length===0&&S.turn>=12) return {title:'慈宁宫',por:dowagerPerson(d),text:`${d.name}召你去慈宁宫，拉着你的手叹气：“皇帝登基也有些时日了，膝下却还空着，哀家这心里不踏实啊。”`,choices:[{t:'儿臣明白',f:()=>'太后点点头，又絮絮叨叨嘱咐了许多。'}]};
  if(r<.6){const proposal=dowagerProposal(d);if(proposal)return proposal;}
  if(S.month===9) return {title:'太后千秋',por:dowagerPerson(d),text:`今日是${d.name}千秋节。`,choices:[
    {t:'大办寿宴（国库-60万两）',f:()=>fx(chg({treasury:-60,prestige:3,people:1}))},{t:'一切从简',f:()=>fx(chg({people:2}))}]};
  return null;
}
function festival(){const m=S.month,h=harem();if(!h.length)return null;
  const top=h.slice().sort((a,b)=>b.favor-a.favor).slice(0,3);
  const pickOne=(name,desc,act)=>({title:name,text:desc,choices:[...top.map(c=>({t:`携${cName(c)}同往`,f:()=>{story(c,act);harem().forEach(o=>{if(o!==c&&TRAITS[o.trait].jealous)o.mood=clamp(o.mood-4)});return fx(cchg(c,{aff:10,favor:6,mood:12}))}})),{t:'独自一人',f:()=>'你独自站了很久。'}]});
  if(m===1) return pickOne('上元灯节','正月十五，宫中张灯结彩，太液池畔挂满了花灯。',`上元节陪陛下赏灯，猜中了最难的一道灯谜。`);
  if(m===7) return pickOne('七夕','七月初七，鹊桥相会。宫中女子都在穿针乞巧。','七夕之夜陪陛下看星，许了一个不肯说出口的愿。');
  if(m===8) return {title:'中秋家宴',text:'八月十五，月圆人团圆。',choices:[{t:'设中秋家宴，六宫同乐（国库-30万两）',f:()=>{h.forEach(c=>c.mood=clamp(c.mood+6));kidsAlive().forEach(k=>k.love=clamp(k.love+5));log('中秋家宴，六宫同乐。');return fx(chg({treasury:-30}))+'\n§后宫心情+6　皇嗣父爱+5'}},{t:'简单赏月',f:()=>'你独自登上角楼赏月。'}]};
  return null;
}

A.greet=function(){if(!S.flags.dowager?.alive){A.go('place','cn');return;}if(!useE())return;const ev=dowagerEvent();if(ev){pushEv(ev);return}
  pushEv({title:'请安',por:dowagerPerson(S.flags.dowager),text:`${S.flags.dowager.name}${pick(['拉着你的手问长问短，叮嘱你夜里早些歇息。','说起你小时候爬树摔破了膝盖，笑出了眼泪。','让你尝了尝她亲手做的素点心。'])}${fx(chg({prestige:1,health:1}))}`,choices:[ok1]})};

/* ============ 母亲入宫小住 ============ */
function momVisitState(c){
  if(!inPalace(c)||c.maid)return {ready:false,hint:'眼下不能安排家眷入宫'};
  if(c.visitor){const left=Math.max(0,Math.ceil(c.visitor.until-S.turn)||0);return {ready:false,hint:left?`母亲在宫 · 还住${left}个月`:'母亲在宫 · 本月出宫'};}
  const last=c.lastVisit==null?null:Number(c.lastVisit);
  const wait=Number.isFinite(last)&&last<=S.turn?Math.max(0,24-(S.turn-last)):0;
  if(wait)return {ready:false,hint:`距上次探亲未满两年 · 还需${Math.ceil(wait)}个月`};
  return {ready:E().treasury>=15,hint:E().treasury>=15?'国库-15万两 · 小住两三个月':'国库不足 · 需15万两'};
}
function momVisitButton(c){
  const state=momVisitState(c);
  return `<button class="btn" onclick="A.momIn(${c.id})" ${state.ready?'':'disabled'}>接母亲入宫<small>${esc(state.hint)}</small></button>`;
}
const momObj=c=>c.visitor?{isMom:true,seed:c.visitor.seed,name:c.visitor.name,alive:true}:null;
function momVisit(c,months){const v=c.visitor;if(v){v.until=Math.max(v.until,S.turn+months);return}
  c.visitor={name:`${c.sur}夫人`,full:`${c.sur}门${pick(SUR.filter(x=>x!==c.sur))}氏`,from:S.turn,until:S.turn+months,seed:(c.seed%999983)*7+13};c.lastVisit=S.turn;
  story(c,`母亲${c.visitor.name}奉旨入宫，在${c.palace}小住${cnNum(months)}个月。`);log(`准${fullName(c)}之母入宫小住。`)}
function visitorTick(c){const v=c.visitor;if(!v)return;if(!inPalace(c)){delete c.visitor;return}
  c.mood=clamp(c.mood+3);
  if(S.turn>=v.until){story(c,`母亲${v.name}出宫回家了，临走前拉着她的手说了很久的话。`);toast(`${cName(c)}的母亲出宫回家了`);delete c.visitor;if(chance(.4))setXin(c,'思念','母亲出宫回家')}}
function visitorEvent(){const vs=alive().filter(c=>c.visitor&&inPalace(c)&&S.turn-(c.visitor.ev===undefined?-9:c.visitor.ev)>=2);if(!vs.length)return null;const c=pick(vs),v=c.visitor,m=momObj(c);v.ev=S.turn;deepen(c);
  if(!c.woundKnown&&chance(.5))return {title:'母女夜话',por:m,text:`你路过${c.palace}，听见${v.name}在屋里低声叮嘱女儿：“……娘知道你心里苦。可这宫里不比家里，凡事要忍。”\n后来你才知道，${cName(c)}${WOUNDS[c.wound].replace(/^。/,'')}`,choices:[
    {t:'进去坐坐',f:()=>{c.woundKnown=true;remember(c,'care','母亲在宫时陛下来坐');story(c,'母亲在宫时，陛下进来坐了坐，第一次听她说起从前的事。');return fx(cchg(c,{aff:8,mood:8}))}},
    {t:'悄悄走开',f:()=>{c.woundKnown=true;return '你没有进去。'}}]};
  return {title:'谢恩',por:m,text:`${v.name}求见陛下，跪下谢恩：“小女自幼${pick(['娇惯','体弱','心思重','性子倔'])}，在宫里承蒙陛下照拂，民妇感激不尽。”`,choices:[
    {t:'赐座，闲话家常',f:()=>{story(c,`母亲${v.name}在宫中时，陛下赐座与她说了许久的话。`);return fx(cchg(c,{aff:6,mood:10}))}},
    {t:'赏她一柄玉如意（国库-5万两）',f:()=>fx(chg({treasury:-5}),cchg(c,{aff:4,mood:6}))},
    {t:'“夫人不必多礼。”',f:()=>fx(cchg(c,{mood:3}))}]}}
function visitorLine(c){const v=c.visitor;if(!v)return '';const left=v.until-S.turn;
  return `<div class="row" style="gap:10px;align-items:center;margin-top:6px;background:#fff3cf;border:2px solid var(--gold2);padding:6px 10px">${porImg(momObj(c),44)}<div class="grow">母亲 <b>${esc(v.name)}</b>（${esc(v.full)}）正在${esc(c.palace)}小住，${left>0?`还有 ${left} 个月出宫`:'本月出宫'}。<div class="hint">母亲在宫的日子，她每月心情都会好一些。</div></div></div>`}
A.momIn=function(id){if(!S||S.over||modalOpen)return;const c=byId(id),state=momVisitState(c);if(!state.ready){toast(state.hint);return}chg({treasury:-15});momVisit(c,ri(2,3));setXin(c,'欢喜','母亲进宫来了');AU.sfx('joy');
  pushEv({title:'母亲入宫',por:momObj(c),text:`${c.visitor.name}进宫来了，要在${c.palace}住上几个月。母女俩一见面就抱头哭了。`+fx(cchg(c,{mood:20,aff:8})),choices:[ok1]});save('auto')};
