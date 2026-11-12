/* ============ 皇嗣 ============ */
function suggestName(sex){const used=new Set(S.children.map(k=>k.name));let n,t=0;do{n=sex==='m'?S.genChar+pick(BOYC):pick(GIRLA)+pick(GIRLB)}while(used.has(n)&&++t<40);return n}
function makeKid(c,sex,name){
  const e=E();const ord=S.children.filter(k=>k.sex===sex).length+1;
  const k={id:S.nid++,name,sex,mom:c.id,momName:fullName(c),born:S.turn,birthMonth:S.month,ord,
    lit:clamp(c.talent*.3+e.wen*.2+ri(0,15)+(e.style==='文雅'?8:0)),mar:clamp(e.wu*.3+(c.trait==='将门'?18:0)+ri(0,15)+(e.style==='尚武'?8:0)),
    vir:clamp(c.virtue*.3+ri(0,18)),hp:clamp(55+ri(0,35)-(c.trait==='体弱'?15:0)),amb:clamp(c.scheme*.5+ri(0,30)),
    love:50,policy:'均衡',tutor:false,title:'',alive:true,married:false,adult:false,story:[],seed:ri(1,2e9)};
  S.children.push(k);S.ys.b++;initKidRel(k);return k;
}
function swapEvent(c,k){const a=harem().find(x=>x!==c&&x.scheme>=70);k.alive=false;k.lost=true;
  return {title:'狸猫',ref:'狸猫换太子（宋·民间传说）',por:c,sfx:'gong',text:`可第二天一早，稳婆跪在殿前，说${cName(c)}产下的是一只剥了皮的狸猫——是妖孽。襁褓里的孩子不见了。${cName(c)}哭得昏死过去。`,choices:[
   {t:'彻查，掘地三尺也要找到孩子',f:()=>{if(a&&chance(.45+E().prestige/250)){k.alive=true;k.lost=false;kstory(k,'出生当夜险些被人用狸猫调包，幸被宫女藏在妆盒里救下。');a.known=true;pushNow(punishEv(a,c,'狸猫换子'));return '一个叫寇珠的宫女跪着捧出一只妆盒——孩子在里面，睡得正香。'}story(c,'孩子出生当夜被人调包，下落不明。');setXin(c,'悲恸','孩子下落不明');return `孩子下落不明。${fx(cchg(c,{mood:-40}))}`}},
   {t:'信了稳婆的话，将她打入冷宫',f:()=>{c.cold=true;c.palace='冷宫';story(c,'产下“狸猫”，被视为妖孽，打入冷宫。');setXin(c,'怨恨','被诬产下妖孽','emp');log(`${fullName(c)}产“妖孽”，打入冷宫。`,1);return fx(cchg(c,{mood:-60,aff:-30}))}}]}}
function kstory(k,t){k.story.push({d:dateStr(),t})}
function growKid(k){
  const a=kidAge(k);if(a<3)return;const m=k.tutor?1.6:1,g=()=>R()*.9*m;
  if(k.policy==='读书')k.lit+=g()*1.7;else if(k.policy==='习武'){k.mar+=g()*1.7;k.hp+=.08}else if(k.policy==='修德')k.vir+=g()*1.7;
  else if(k.policy==='放养'){k.hp+=.25;k.amb+=.1;k.love+=.05}else{k.lit+=g()*.65;k.mar+=g()*.65;k.vir+=g()*.65}
  {const fm=fosterOf(k);if(fm&&fm.alive){if(fm.virtue>65)k.vir+=.15;if(fm.talent>65)k.lit+=.15;if(fm.scheme>65)k.amb+=.12}}['lit','mar','vir','hp','amb','love'].forEach(s=>k[s]=clamp(k[s]));supTick(k);
}
A.kidVisit=function(id){const k=kidById(id);if(!useE())return;const a=kidAge(k);
  k.love=clamp(k.love+10);const st=pick(['lit','mar','vir']);k[st]=clamp(k[st]+2);
  const t=a<3?pick(['襁褓中的孩子攥住了你的手指，咿咿呀呀，不肯松开。','乳母说孩子近来能认人了，一见你便咯咯直笑。']):
    a<8?pick(['孩子奶声奶气地背了一首诗，背到一半忘了词，急得直挠头。','孩子献宝似的捧出自己捏的泥人，说这是父皇。','孩子拉着你去看御花园里新孵的小鸭子。']):
    pick(['你与孩子在上书房说了半日话，他的见识长进了不少。','孩子向你请教治国之道，你耐心作答。','你考校了几句功课，孩子对答如流。']);
  kstory(k,`父皇来探望。${t}`);setScene('harem');
  pushEv({title:'探望皇嗣',por:k,text:t+fx(`父爱+10　${({lit:'才学',mar:'武艺',vir:'品德'})[st]}+2`),choices:[{t:'好'}]})};
A.kidPolicy=function(id,p){const k=kidById(id);k.policy=p;AU.sfx('click');render()};
A.kidTutor=function(id){const k=kidById(id);k.tutor=!k.tutor;if(k.tutor){kstory(k,'陛下延请当世大儒为师。');toast('已延请太傅（每月5万两）')}render()};
A.kidHeir=function(id){const k=kidById(id);const old=S.heir&&kidById(S.heir);
  pushEv({title:'册立太子',por:k,text:old?`太子${old.name}尚在。改立${k.name}为太子，必将引起朝野震动（威望-6）。`:`立${kidName(k)}为皇太子，昭告天下？`,choices:[
    {t:'册立太子',f:()=>{let s='';if(old){s=chg({prestige:-6});kstory(old,'被废去太子之位。');old.amb=clamp(old.amb+20)}else s=chg({prestige:5});
      S.heir=k.id;kstory(k,'被册立为皇太子，入主东宫。');{const mm=byId(k.foster||k.mom);if(mm&&mm.alive)setXin(mm,mm.scheme>=55?'野心':'欢喜',`${k.name}被立为太子`)}log(`立${k.name}为皇太子。`,1);
      const m=byId(k.mom);if(m&&m.alive){cchg(m,{mood:25,aff:10});story(m,`其子${k.name}被立为太子。`)}
      harem().forEach(o=>{if(o.id!==k.mom&&o.scheme>60)o.mood=clamp(o.mood-12)});AU.sfx('gong');
      return `东宫大典，百官朝贺。${fx(s)}`}},{t:'再想想'}]})};
A.kidTitle=function(id){const k=kidById(id);pushEv({title:k.sex==='m'?'封王':'公主封号',por:k,text:k.sex==='m'?'请拟王号（一至二字）：':'请为公主拟封号（二字）：',input:{def:k.sex==='m'?pick(['睿','恭','诚','和','裕','庆','端','宁'])+'亲王':pick(['昭阳','长乐','永安','和静','宁华','嘉柔']),max:4},
  choices:[{t:'赐封',f:v=>{k.title=v+(k.sex==='f'&&!v.endsWith('公主')?'公主':'');kstory(k,`受封为${k.title}。`);log(`封${k.name}为${k.title}。`);return `${k.name}叩谢父皇恩典，自此称${k.title}。`}},{t:'作罢'}]})};

/* ============ 皇嗣事件 ============ */
function kcd(k,t,n=24){k.cd=k.cd||{};if(S.turn-(k.cd[t]===undefined?-99:k.cd[t])<n)return false;k.cd[t]=S.turn;return true}
function kidEvent(){
  const ks=shuffle(kidsAlive().filter(k=>!k.estate));if(!ks.length)return null;
  for(const k of ks){const a=kidAge(k);
    if(a<8&&S.turn-(k.sick===undefined?-99:k.sick)>=18&&chance(.3)){k.sick=S.turn;const ill=pick([['夜里发起高热，乳母急得团团转','一场高热'],['出了痘疹，浑身滚烫','出痘'],['贪凉吃多了冰酪，上吐下泻','积食腹泻'],['着了风寒，咳得小脸通红','风寒咳嗽']]); return {title:'皇嗣染恙',por:k,text:`${kidName(k)}${ill[0]}。`,choices:[
      {t:'宣太医',f:()=>{if(chance(.9)||k.hp>60){kstory(k,`${a}岁时${ill[1]}，所幸太医及时诊治。`);return '服了几剂药，烧退了。'}k.alive=false;kstory(k,'幼时染病夭折。');{const mm=byId(k.mom);if(mm&&mm.alive)setXin(mm,'悲恸',`${k.name}夭折`)}log(`${kidName(k)}夭折。`,1);AU.sfx('sad');return `太医尽力了……${kidName(k)}没能熬过去。`}},
      {t:'亲自守夜（精力-1）',cond:()=>E().energy>0,why:'精力不足',f:()=>{E().energy--;k.love=clamp(k.love+15);k.hp=clamp(k.hp+5);kstory(k,`${a}岁时${ill[1]}，父皇亲自守了一夜。`);return '你守在床边，替孩子换了一夜的帕子。天亮时，孩子睡安稳了。'}}]}}
    if(a>=6&&k.lit>=45&&chance(.5)&&kcd(k,'bright')){const w=pick([['近日所作策论颇有见地','策论得太傅夸赞'],['能把《资治通鉴》的汉纪一卷背得一字不差','背书一字不差'],['替太傅算清了上书房一年的笔墨账','算清笔墨账'],['画了一幅京城九门图，连城墙的垛口都没漏','画京城九门图']]);
      return {title:'上书房',por:k,text:`太傅奏报：${kidName(k)}${w[0]}。`,choices:[
      {t:'赏文房四宝',f:()=>{k.lit=clamp(k.lit+3);k.love=clamp(k.love+5);kstory(k,`${a}岁，${w[1]}，父皇赏了文房四宝。`);return '§才学+3　父爱+5'}},
      {t:'勉励几句，戒骄戒躁',f:()=>{k.vir=clamp(k.vir+3);kstory(k,`${a}岁，${w[1]}，父皇勉励他戒骄戒躁。`);return '§品德+3'}}]}}
    if(a>=5&&a<=13&&chance(.4)&&kcd(k,'mis')){const w=pick([['在上书房顽皮，打碎了太傅心爱的端砚','打碎太傅的端砚'],['偷偷爬上御花园的假山掏鸟窝，被侍卫抱了下来','爬假山掏鸟窝'],['把太傅的胡子画进了课业里','把太傅画进课业'],['偷溜出宫门，在护城河边钓了一下午鱼','偷溜出宫钓鱼'],['在御膳房偷吃，把一屉点心都吃光了','偷吃御膳房点心']]);
      return {title:'顽童',por:k,text:`${kidName(k)}${w[0]}。`,choices:[
      {t:'罚跪一个时辰',f:()=>{k.vir=clamp(k.vir+4);k.love=clamp(k.love-5);kstory(k,`${a}岁，${w[1]}，被罚跪一个时辰。`);return '§品德+4　父爱-5'}},
      {t:'一笑置之',f:()=>{k.amb=clamp(k.amb+3);k.love=clamp(k.love+3);kstory(k,`${a}岁，${w[1]}，父皇一笑置之。`);return '§父爱+3'}}]}}
    if(k.sex==='m'&&a>=12&&k.amb>=60&&S.heir&&S.heir!==k.id&&chance(.5)){const h=kidById(S.heir);if(h&&h.alive) return {title:'兄弟阋墙',por:k,text:`有宫人密报：${kidName(k)}私下结交朝臣，对太子颇有微词。`,choices:[
      {t:'严厉申斥',f:()=>{k.amb=clamp(k.amb-15);k.love=clamp(k.love-10);kstory(k,'私结朝臣，被父皇严厉申斥。');return '§野心-15　父爱-10'}},
      {t:'暗中观察',f:()=>{k.amb=clamp(k.amb+5);return '你没有声张。'}},
      {t:'改立他为太子',f:()=>{A.kidHeir(k.id);return null}}]}}
  }
  return null;
}
function milestone(){
  for(const k of kidsAlive()){const a=kidAge(k);
    if(k.sex==='f'){const event=princessMilestone(k);if(event)return event;}
    if(k.sex==='m'&&a>=16&&!k.adult){k.adult=true;if(S.heir===k.id)continue;return {title:'皇子成年',por:k,text:`${kidName(k)}年满十六，按祖制当封王开府。`,choices:[
      {t:'封亲王，留京辅政',f:()=>{A.kidTitle(k.id);k.amb=clamp(k.amb+10);return null}},
      {t:'封王，就藩地方',f:()=>{k.title=pick(['晋','楚','燕','蜀','吴','齐'])+'王';k.amb=clamp(k.amb-10);kstory(k,`受封${k.title}，就藩地方。`);log(`封${k.name}为${k.title}，就藩。`);return `${k.name}辞别父皇，前往封地。`}}]}}
  }
  return null;
}

/* ============ 夺嫡 ============ */
function supTick(k){if(k.sex!=='m'||!k.alive||k.away||k.jailed)return;if(kidAge(k)<10)return;const m=byId(k.foster||k.mom);
  const d=k.amb/140+(m&&m.alive&&!m.cold?m.fam.p/220+(m.rank>=6?.25:0):0)+(S.heir===k.id?.5:0)+(k.lit+k.vir)/400-(k.amb<30?.4:0);
  k.sup=clamp((k.sup||0)+d-.25)}
function heirTick(){
  const sons=kidsAlive().filter(k=>k.sex==='m'&&!k.away&&!k.jailed);if(!sons.length)return null;
  const heir=S.heir&&kidById(S.heir);
  const reb=sons.find(k=>k.id!==S.heir&&kidAge(k)>=16&&k.amb>=78&&(k.sup||0)>=65&&(E().prestige<60||E().health<45));
  if(reb&&chance(.3))return coupEvent(reb);
  if(heir&&heir.alive){const rv=sons.filter(k=>k!==heir&&kidAge(k)>=12&&(k.sup||0)>(heir.sup||0)+15&&k.amb>=60).sort((a,b)=>b.sup-a.sup)[0];
    if(rv&&chance(.35))return {title:'储位之争',por:rv,text:`朝中渐成两党：一派拥立太子${heir.name}，一派推举${kidName(rv)}。今日早朝，两边几乎当廷吵了起来。\n（太子得朝臣支持${rd(heir.sup||0)}，${rv.name}得${rd(rv.sup)}）`,choices:[
      {t:'力挺太子，申斥结党之人',f:()=>{rv.sup=clamp(rv.sup-25);rv.amb=clamp(rv.amb-8);rv.love=clamp(rv.love-10);heir.sup=clamp((heir.sup||0)+10);kstory(rv,'拥立他的大臣遭父皇申斥。');return fx(chg({prestige:3}))}},
      {t:`顺应人心，改立${rv.name}`,f:()=>{A.kidHeir(rv.id);return null}},
      {t:`命${rv.name}就藩，远离京城`,cond:()=>kidAge(rv)>=14,why:'年纪尚小',f:()=>{rv.away=true;rv.title=rv.title||pick(['晋','楚','燕','蜀','吴','齐'])+'王';rv.sup=clamp(rv.sup-40);rv.amb=clamp(rv.amb-15);kstory(rv,'被命就藩，离京而去。');log(`${rv.name}就藩。`,1);const m=byId(rv.mom);if(m&&m.alive)cchg(m,{mood:-25,aff:-10});return `${rv.name}跪别父皇，出了京城。`}}]}}
  const c=sons.find(k=>k.id!==S.heir&&kidAge(k)>=12&&k.amb>=55&&!k.facAsked);
  if(c&&chance(.3)){c.facAsked=true;const m=byId(c.mom);return {title:'皇子结党',por:c,text:`有人密报：${kidName(c)}近来与${m?m.fam.t+'一系的':''}几位大臣过从甚密，常在府中宴饮至深夜。`,choices:[
    {t:'严加申斥',f:()=>{c.amb=clamp(c.amb-15);c.sup=clamp((c.sup||0)-15);c.love=clamp(c.love-10);kstory(c,'私结朝臣，被父皇严加申斥。');return '§野心-15　朝臣支持-15　父爱-10'}},
    {t:'默许，看他有几分本事',f:()=>{c.sup=clamp((c.sup||0)+12);c.amb=clamp(c.amb+5);return '§朝臣支持+12　野心+5'}},
    {t:'交给他一桩差事历练',f:()=>{c.lit=clamp(c.lit+4);c.mar=clamp(c.mar+4);c.sup=clamp((c.sup||0)+6);kstory(c,'奉旨办差，颇有建树。');return '§才学+4　武艺+4　朝臣支持+6'}}]}}
  return null}
function coupEvent(k){return {title:'逼宫',por:k,sfx:'gong',text:`三更时分，宫门外火光冲天。${kidName(k)}率府兵与九门提督的人马围住了宸极殿，递进一道“请父皇颐养天年”的折子。`,choices:[
  {t:'调禁军平叛',f:()=>{const h=S.heir&&kidById(S.heir);const p=.35+E().prestige/180+(h&&h.alive?(h.sup||0)/400:0);
    if(chance(p)){k.jailed=true;k.sup=0;k.title='庶人';kstory(k,'起兵逼宫，兵败被擒，圈禁于宗人府。');log(`${k.name}逼宫失败，圈禁宗人府。`,1);const m=byId(k.mom);if(m&&m.alive){m.cold=true;m.palace='冷宫';story(m,'其子逼宫失败，她被打入冷宫。')}return `禁军在午门外击溃了叛军。${fx(chg({prestige:6}))}`}
    log(`${k.name}逼宫，禁军倒戈，帝被迫禅位。`,1);pushNow(abdicateEvent(k));return '禁军倒戈了。'}},
  {t:'开门，和他谈',f:()=>{S.heir=k.id;k.amb=clamp(k.amb-20);kstory(k,'起兵逼宫，迫使父皇立他为太子。');log(`${k.name}兵谏，被立为太子。`,1);return `你答应立他为太子。他跪下叩头，眼里却没有一丝愧色。${fx(chg({prestige:-12}))}`}},
  {t:'禅位于他',f:()=>{pushNow(abdicateEvent(k));return null}}]}}
function abdicateEvent(k){S.over=true;const e=E();S.history.push({sur:e.sur,name:e.name,era:e.era,yrs:S.year,miao:'太上皇',shi:''});
  return {title:'禅位',por:'emp',text:`${dateStr()}，${e.sur}${e.name}禅位于${k.name}，移居西苑，称太上皇。`,choices:[{t:`以${k.name}的身份继续`,f:()=>{succeed(k);return null}},{t:'重新开局',f:()=>{S=null;UI.view='title';return null}}]}}

/* ============ 皇嗣抚养与过继 ============ */
const fosterOf=k=>k.foster?byId(k.foster):null;
const raisesKid=c=>S.children.some(x=>x.alive&&(x.foster===c.id||(x.mom===c.id&&!x.foster)));
A.foster=function(id){const k=kidById(id);const m=byId(k.mom);
  const cands=harem().filter(c=>c.id!==k.mom&&c.id!==k.foster&&c.rank>=2).sort((a,b)=>b.rank-a.rank||b.virtue-a.virtue).slice(0,6);
  if(!cands.length){toast('眼下没有合适的妃嫔（需贵人及以上）');return}
  pushEv({title:'抚养',por:k,text:`把${kidName(k)}交给谁抚养？\n${m&&m.alive?`生母${cName(m)}会很难过。`:'孩子的生母已经不在了。'}养母的德行、才情、心机会影响孩子的成长，她的家世也会成为孩子将来的倚仗。`,
    choices:[...cands.map(c=>({t:`${cName(c)}（德${rd(c.virtue)} 才${rd(c.talent)}${c.known?' 心机'+rd(c.scheme):''}，${c.fam.t}，${raisesKid(c)?'已有孩子':'膝下无子'}）`,f:()=>doFoster(k,c)})),{t:'再想想'}]})};
function doFoster(k,c){const m=byId(k.mom),old=fosterOf(k),childless=!raisesKid(c);if(m&&m.alive&&m!==c&&!k.motherBonds?.[m.id]){(k.motherBonds ||= {})[m.id]={trust:childTrust(k,m)}}
  if(old&&old!==c&&!k.motherBonds?.[old.id]){(k.motherBonds ||= {})[old.id]={trust:childTrust(k,old)}}
  k.foster=c.id;k.fosterT=S.turn;relAdd(c,k,Math.max(0,50-relGet(c,k)));
  kstory(k,`交由${fullName(c)}抚养。`);story(c,`陛下将${kidName(k)}交给她抚养。`);log(`${kidName(k)}交由${fullName(c)}抚养。`,1);
  setXin(c,'欢喜',`得以抚养${k.name}`);let s=cchg(c,{aff:childless?12:6,mood:childless?20:8});
  if(m&&m.alive&&m!==c){relAdd(m,c,-25);const hate=m.scheme>=60||m.t2==='记仇';setXin(m,hate?'怨恨':'悲恸',`亲生的${k.name}被抱给了${fullName(c)}`,hate?c.id:null);s+='　'+cchg(m,{mood:-30,aff:-8});story(m,`亲生的${k.name}被抱去给${fullName(c)}抚养。`)}
  if(old&&old.alive&&old!==c){setXin(old,'委屈',`养了多年的${k.name}被抱走`);cchg(old,{mood:-15})}
  return `${fullName(c)}接过孩子，抱得很紧。${fx(s)}`}
A.unfoster=function(id){const k=kidById(id),c=fosterOf(k),m=byId(k.mom);if(!m||!m.alive){toast('生母已不在');return}
  if(c&&!k.motherBonds?.[c.id]){(k.motherBonds ||= {})[c.id]={trust:childTrust(k,c)}}
  k.foster=null;delete k.visitRule;kstory(k,'回到生母身边。');if(c&&c.alive){setXin(c,'委屈',`${k.name}被抱回生母身边`);cchg(c,{mood:-15})}
  setXin(m,'欢喜',`${k.name}回到身边`);cchg(m,{mood:25,aff:6});story(m,`${k.name}回到了她身边。`);toast('孩子回到了生母身边');render()};
function fosterOffer(k,why){return {title:'抚养',por:k,text:why+'\n按宫中旧例，可将孩子交给位分高的妃嫔抚养，将来也好有个倚仗。',choices:[{t:'挑一位妃嫔抚养',f:()=>{A.foster(k.id);return null}},{t:'不必',f:()=>'你没有把孩子交给旁人。'}]}}
function fosterEvent(){const ks=kidsAlive().filter(k=>{const m=byId(k.mom),f=fosterOf(k);return !k.visitRule&&familyVisitAllowed(k,m)&&inPalace(f)&&kidAge(k)<14});if(!ks.length)return null;
  const k=pick(ks),m=byId(k.mom),f=fosterOf(k);
  return {title:'生母',por:m,text:`${cName(m)}趁${cName(f)}去请安，偷偷去看了${k.name}。${childTrust(k,m)>=48?'孩子认得她，拉着她说了好一会儿话。':'孩子怯生生地往乳母身后躲。'}${cName(f)}回来撞见，两人在廊下僵持着。`,choices:[
   {t:`准${cName(m)}平日探望`,f:()=>{A.familyVisitRule(k.id,'open');relAdd(m,f,5);setXin(m,'感激','准她每月看望孩子');return fx(cchg(m,{mood:15,aff:6}),cchg(f,{mood:-5}))}},
   {t:'暂缓私下探望',f:()=>{A.familyVisitRule(k.id,'closed');relAdd(m,f,-15);setXin(m,'悲恸','不许她再见孩子');return fx(cchg(m,{mood:-20}),cchg(f,{aff:4}))}},
   {t:'把孩子还给生母',f:()=>{A.unfoster(k.id);return null}}]}}
function fosterLine(c){const fk=S.children.filter(k=>k.foster===c.id&&k.alive),own=S.children.filter(k=>k.mom===c.id&&k.foster&&k.alive);
  return (fk.length?`<div>养育：${fk.map(k=>`<button class="btn sm" onclick="A.go('kid',${k.id})">${esc(k.name)}</button>`).join(' ')}</div>`:'')+(own.length?`<div class="hint">亲生却交给旁人抚养：${own.map(k=>`${esc(k.name)}（养母${esc(fullName(fosterOf(k)))}）`).join('、')}</div>`:'')}

/* ============ 人际关系：妃嫔、皇嗣 ============ */
function relWord(v,kind,c,k){
  if(kind==='ck'&&c&&k&&k.mom===c.id)return k.sex==='m'?'亲生皇子':'亲生公主';
  if(kind==='ck')return v>=60?'视如己出':v>=25?'疼爱':v>-25?'寻常':v>-60?'冷淡':'敌视';
  if(kind==='kk')return v>=60?'手足情深':v>=25?'亲近':v>-25?'寻常':v>-60?'不和':'势同水火';
  return v>=60?'情同姐妹':v>=30?'交好':v>-30?'泛泛':v>-60?'不睦':'势同水火'}
const relCls=v=>v>=25?'g':v<=-25?'r':'';
const raisers=k=>[byId(k.mom),fosterOf(k)].filter(x=>x&&x.alive);
function initKidRel(k){if(k.relInit)return;k.relInit=1;const m=byId(k.mom);
  if(m&&m.alive)relAdd(m,k,80-relGet(m,k));const f=fosterOf(k);if(f&&f.alive)relAdd(f,k,Math.max(0,50-relGet(f,k)));
  harem().forEach(c=>{if(c===m||c===f)return;let v=ri(-5,10);if(m)v+=Math.round(relGet(c,m)*.4);if(c.trait==='温婉')v+=8;if(TRAITS[c.trait].jealous)v-=6;
    if(c.scheme>=65&&k.sex==='m'&&S.children.some(x=>x!==k&&x.alive&&x.sex==='m'&&(x.mom===c.id||x.foster===c.id)))v-=12;relAdd(c,k,v)});
  kidsAlive().forEach(o=>{if(o===k)return;let v=o.mom===k.mom?40:ri(-5,15);const om=byId(o.mom);if(m&&om&&om!==m)v+=Math.round(relGet(m,om)*.3);relAdd(o,k,v)})}
function kidRelTick(){const ks=kidsAlive(),h=harem();
  for(const k of ks){if(!k.relInit)initKidRel(k);const m=byId(k.mom),f=fosterOf(k);
    for(const c of h){let d=0;
      if(c===m)d+=(f&&f!==m)?-.3:.5;else if(c===f)d+=1.2;
      else{if(m)d+=relGet(c,m)*.01;if(c.scheme>=65&&k.sex==='m'&&kidAge(k)>=8&&S.children.some(x=>x.alive&&x!==k&&x.sex==='m'&&(x.mom===c.id||x.foster===c.id)))d-=.8}
      if(d)relAdd(c,k,d)}
    for(const o of ks){if(o.id<=k.id)continue;let d=0;
      if(o.mom===k.mom||(o.foster&&o.foster===k.foster))d+=.6;
      const mo=byId(o.foster||o.mom),mk=byId(k.foster||k.mom);if(mo&&mk&&mo!==mk)d+=relGet(mo,mk)*.008;
      if(o.sex==='m'&&k.sex==='m'&&kidAge(o)>=12&&kidAge(k)>=12)d-=(o.amb+k.amb)/200;
      if(S.heir&&(S.heir===o.id||S.heir===k.id)&&o.sex==='m'&&k.sex==='m')d-=.4;
      relAdd(o,k,d-relGet(o,k)*.01)}}}
function relEvent(){const ks=shuffle(kidsAlive()),h=harem();if(!ks.length)return null;
  const evs=[
   ()=>{for(const k of ks){if(kidAge(k)<3||kidAge(k)>12)continue;const c=h.find(c=>!raisers(k).includes(c)&&relGet(c,k)>=40);if(!c)continue;const m=byId(k.mom);
     return {title:'别宫的娘娘',por:c,text:`${cName(c)}常把${kidName(k)}叫到${c.palace}，教${k.sex==='m'?'他':'她'}描红、给${k.sex==='m'?'他':'她'}做点心。孩子一去就是大半天，回来嘴里全是“${c.sur}娘娘说……”`,choices:[
       {t:`让${cName(c)}多照看这孩子`,f:()=>{relAdd(c,k,10);k.vir=clamp(k.vir+2);k.lit=clamp(k.lit+2);let s=cchg(c,{aff:4,mood:8});if(m&&m.alive&&m!==c&&relGet(m,c)<10){relAdd(m,c,-8);s+='　'+cchg(m,{mood:-8});}return fx(s)+'\n§孩子才学+2　品德+2'}},
       {t:'孩子还是多陪陪自己的母亲',f:()=>{if(m&&m.alive)relAdd(m,k,5);return fx(cchg(c,{mood:-5}))}}]}}return null},
   ()=>{for(const k of ks){if(kidAge(k)<4||kidAge(k)>14)continue;const c=h.find(c=>!raisers(k).includes(c)&&relGet(c,k)<=-40);if(!c)continue;const m=byId(k.mom);const low=m&&(m.maid||m.rank<=1||m.fam.t==='宫女');
     return {title:'奚落',por:k,text:`御花园里，${cName(c)}当着一众宫人的面对${kidName(k)}说：“${low?'宫女生的孩子，也配在这里放纸鸢？':'你母妃没教过你规矩么？'}”孩子红着眼眶跑开了。`,choices:[
       {t:`当众训斥${cName(c)}`,f:()=>{relAdd(c,k,-5);k.love=clamp(k.love+8);setXin(c,'委屈','因奚落皇嗣被训斥');if(m&&m.alive)relAdd(m,c,-10);return fx(cchg(c,{mood:-12,favor:-5}))+'\n§孩子父爱+8'}},
       {t:'把孩子叫来，好好安慰',f:()=>{k.love=clamp(k.love+10);k.vir=clamp(k.vir+2);return '§孩子父爱+10　品德+2'}},
       {t:'孩子之间的事，不必理会',f:()=>{k.amb=clamp(k.amb+5);k.vir=clamp(k.vir-3);kstory(k,`被${fullName(c)}当众奚落，父皇没有过问。`);return '§孩子野心+5　品德-3'}}]}}return null},
   ()=>{for(const a of ks)for(const b of ks){if(a===b||kidAge(a)<=kidAge(b)||kidAge(a)<6||relGet(a,b)<35)continue;
     return {title:'手足',por:a,text:`${kidName(b)}在御花园摔破了膝盖，${kidName(a)}二话不说背起${b.sex==='m'?'弟弟':'妹妹'}，一路背回了宫。`,choices:[
       {t:'重赏，当众夸奖',f:()=>{relAdd(a,b,10);a.vir=clamp(a.vir+4);a.love=clamp(a.love+5);kstory(a,`背着摔伤的${b.name}走回了宫，父皇当众夸奖。`);kstory(b,`摔伤了腿，是${a.name}背回来的。`);return '§品德+4　父爱+5　兄弟姐妹更亲近了'}}]}}return null},
   ()=>{for(const a of ks)for(const b of ks){if(a.id>=b.id||kidAge(a)<5||kidAge(b)<5||relGet(a,b)>-25)continue;
     return {title:'阋墙',por:a,text:`${kidName(a)}和${kidName(b)}为了${pick(['一匹西域进贡的小马','一方御赐的端砚','谁先给父皇请安','一只蝈蝈笼子'])}在上书房打了起来，太傅拉都拉不开。`,choices:[
       {t:'两个都罚跪一个时辰',f:()=>{a.vir=clamp(a.vir+2);b.vir=clamp(b.vir+2);relAdd(a,b,-3);return '两个孩子跪在一起，谁也不看谁。'}},
       {t:'罚他们一起抄一卷《孝经》',f:()=>{if(chance(.55)){relAdd(a,b,18);kstory(a,`和${b.name}一起抄书，抄着抄着就和好了。`);return '抄到后半夜，两个孩子头靠着头睡着了。§关系缓和'}relAdd(a,b,-5);return '两人各抄各的，谁也不理谁。'}},
       {t:`偏向${a.name}`,f:()=>{relAdd(a,b,-12);b.love=clamp(b.love-8);a.amb=clamp(a.amb+3);const mb=byId(b.mom);if(mb&&mb.alive)setXin(mb,'委屈','陛下偏心');return `§${b.name}父爱-8，两人更不和了`}}]}}return null},
   ()=>{for(const k of ks){if(kidAge(k)<4||kidAge(k)>10)continue;const m=byId(k.mom);if(!m||!m.alive||m.cold)continue;const c=h.find(c=>c!==m&&!raisers(k).includes(c)&&relGet(c,k)>=55);if(!c)continue;
     return {title:'童言',por:k,text:`${kidName(k)}抱着你的腿说：“父皇，儿臣想去${c.sur}娘娘宫里住，${c.sur}娘娘做的糕最好吃，还从来不骂儿臣。”\n话传到${cName(m)}耳朵里，她一夜没睡。`,choices:[
       {t:'“你母妃最疼你。”',f:()=>{relAdd(m,k,5);return fx(cchg(m,{mood:5}))}},
       {t:'把孩子交给那位娘娘抚养',f:()=>{const r=doFoster(k,c);return r}},
       {t:'一笑置之',f:()=>{setXin(m,'委屈','孩子说更喜欢别宫的娘娘');relAdd(m,c,-10);return fx(cchg(m,{mood:-10}))}}]}}return null},
  ];
  for(const f of shuffle(evs)){const ev=f();if(ev)return ev}return null}
function kidRelLine(k){const sib=kidsAlive().filter(o=>o!==k).map(o=>[o,relGet(o,k)]).filter(x=>Math.abs(x[1])>=25).sort((a,b)=>b[1]-a[1]);
  const con=harem().filter(c=>!raisers(k).includes(c)).map(c=>[c,relGet(c,k)]).filter(x=>Math.abs(x[1])>=25).sort((a,b)=>b[1]-a[1]);
  const tag=(o,v,kd,n)=>`<span class="tag ${relCls(v)}" title="${rd(v)}">${esc(n)}·${relWord(v,kd)}</span>`;
  return `<div style="margin-top:4px">手足：${sib.length?sib.map(([o,v])=>tag(o,v,'kk',o.name)).join(''):'<span class="hint">都还寻常</span>'}</div><div>宫中娘娘：${con.length?con.map(([c,v])=>tag(c,v,'ck',cName(c))).join(''):'<span class="hint">都还寻常</span>'}</div>`}

function conKidLine(c){const ks=kidsAlive().map(k=>[k,relGet(c,k)]).filter(([k,v])=>raisers(k).includes(c)||Math.abs(v)>=25).sort((a,b)=>b[1]-a[1]);if(!ks.length)return '';
  return `<div>对皇嗣：${ks.map(([k,v])=>`<span class="tag ${relCls(v)}" title="${rd(v)}">${esc(k.name)}·${relWord(v,'ck',c,k)}</span>`).join('')}</div>`}
