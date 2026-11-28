/* Issue 42: sisters in the palace keep living alongside each other.
   A sister who enters with children may ask to bring a daughter (sons stay in the original household);
   sisters share more scenes whether close or estranged, and their father and brothers hear of it. */
const sisterBondsActive=()=>!!S&&journalContentVersion()>=168;

/* —— 带孩子入宫 —— */
function sisterAdmissionHost(g){return g?.natalOrigin?familyHostById(g.natalOrigin.host)||byId(g.natalOrigin.host):null;}
function sisterAdmissionChildren(g){
  const c=sisterAdmissionHost(g),h=c&&houseOf(c);if(!h)return [];
  return (h.relatives||[]).filter(p=>p.alive!==false&&outsideMotherId(p)===g.natalOrigin.relative&&!p.consortId&&!p.married&&natalAge(p)<15);
}
const motherWardActive=p=>!!(p?.motherWard&&p.motherWard.ended==null&&p.alive!==false&&inPalace(byId(p.motherWard.consortId)));
function wardAddress(p,daughters){
  const verified=p.outsideParentage?.privateInquiry?.status==='complete'&&p.outsideParentage.privateInquiry.imperial||['proved','stayed'].includes(p.outsideParentage?.status);
  if(verified)return '小公主';
  const order=daughters.slice().sort((a,b)=>(a.born??0)-(b.born??0)).indexOf(p);
  return daughters.length>1?['大','二','三','四'][order]+'小姐':(p.sur||p.name?.[0]||'')+'小姐';
}
function sisterChildAdmissionEvent(g,again=false){
  const c=sisterAdmissionHost(g),children=sisterAdmissionChildren(g);
  const daughters=children.filter(p=>p.sex==='f'&&!p.motherWard),sons=children.filter(p=>p.sex==='m');
  if(!c||!inPalace(g)||!daughters.length&&(again||!sons.length))return null;
  const gen=S.gen,state=g.childAdmission||={asks:0};
  const valid=()=>S.gen===gen&&inPalace(g)&&sisterAdmissionChildren(g).some(p=>daughters.includes(p)&&!p.motherWard);
  const mother=c.house?.relatives?.find(p=>p.id===g.natalOrigin.relative);
  const carer=mother?.formerSpouses?.at(-1)?.name||mother?.spouse?.name||'原家长辈';
  const names=list=>list.map(p=>`${p.name}（${natalAge(p)}岁）`).join('、');
  const sonLine=sons.length?`${names(sons)}是男孩，按宫规不能随母入宫，仍留在原家，由${carer}照料。`:'';
  if(!daughters.length)return {title:`${cName(g)} · 孩子留在原家`,por:g,valid:()=>S.gen===gen&&inPalace(g),
    text:`${g.name}入宫前，把孩子的事托付妥当。${sonLine}\n她只求陛下准她常给孩子写信。`,choices:[{t:'准她常寄家书',f:()=>{
      if(S.gen!==gen||!inPalace(g))return null;
      for(const son of sons){son.story||=[];story(son,`【母亲入宫】母亲${g.name}入宫，他是男孩，按宫规留在原家，由${carer}照料。`);}
      story(g,`【孩子留在原家】${names(sons)}是男孩，不能随她入宫，留在原家由${carer}照料。陛下准她常寄家书。`);
      return '她郑重谢恩，把孩子的生辰与喜好一一写给原家。';
    }}]};
  const addresses=daughters.map(p=>[p,wardAddress(p,daughters)]);
  const text=again?
    `${cName(g)}隔了些日子，又小心翼翼地提起：“女儿夜里总问娘什么时候回去。陛下若肯开恩，臣妾想把${daughters.map(p=>p.name).join('、')}接到身边，一定不叫她给宫里添乱。”`:
    `${g.name}入宫前，托人来问：能否把女儿${names(daughters)}带在身边？\n${sonLine}${sonLine?'\n':''}女儿若随母入宫，宫人按旧例称她${addresses.map(([p,a])=>`“${a}”`).join('、')}，仍记在原家的家籍上。`;
  const take=()=>{
    if(!valid())return null;
    state.status='accepted';state.turn=S.turn;
    for(const [p,address] of addresses){
      if(p.motherWard)continue;
      p.motherWard={consortId:g.id,host:c.id,gen:S.gen,turn:S.turn,address};
      p.story||=[];story(p,`【随母入宫】随母亲${g.name}入宫，住在${g.palace}，宫人称她“${address}”。原家的家籍与姓名不变。`);
    }
    for(const son of sons){son.story||=[];story(son,`【母亲入宫】母亲${g.name}带着姐妹入宫。他是男孩，按宫规留在原家，由${carer}照料。`);}
    const former=mother?.formerSpouses?.at(-1);
    if(former)(former.story||=[]).push({d:dateStr(),t:`【女儿随母入宫】${daughters.map(p=>p.name).join('、')}随母入宫。${sons.length?'儿子仍留在家中由他照料。':''}`});
    story(g,`【女儿随母入宫】陛下准她把${daughters.map(p=>p.name).join('、')}带在身边，宫人称${addresses.map(([,a])=>a).join('、')}。${sons.length?`儿子${sons.map(p=>p.name).join('、')}按宫规留在原家。`:''}`);
    if(inPalace(c)&&c!==g)story(c,`【外甥女入宫】姐妹${g.name}获准把女儿带进宫来，她特意备了一盒点心去看孩子。`);
    setXin(g,'感激','准她把女儿带在身边');
    log(`${fullName(g)}获准携女儿${daughters.map(p=>p.name).join('、')}入宫同住。`,1);
    return `${g.name}眼圈一红，跪下谢恩。孩子被领进${g.palace}，宫人改口称${addresses.map(([,a])=>`“${a}”`).join('、')}。${fx(cchg(g,{mood:15,aff:6}))}`;
  };
  const leave=()=>{
    if(!valid())return null;
    state.status='declined';state.turn=S.turn;state.asks=(state.asks||0)+1;
    setXin(g,'思念',`女儿留在宫外，不能带在身边`);
    for(const p of daughters){p.story||=[];story(p,`【留在原家】母亲${g.name}入宫，她没能跟去，仍由${carer}照料。`);}
    story(g,`【孩子留在原家】${again?'再一次':''}请求把女儿${daughters.map(p=>p.name).join('、')}带进宫，陛下没有答应。`);
    return `她低头应了，再没有多说。${fx(cchg(g,{mood:again?-10:-6}))}`;
  };
  return {title:again?`${cName(g)} · 又问起女儿`:`${cName(g)} · 孩子随行`,por:g,present:[g],valid,text,choices:[
    {t:`准女儿随母入宫（称${addresses.map(([,a])=>a).join('、')}）`,f:take},
    {t:'孩子留在原家',f:leave}]};
}
const earlierSisterBondsAddConsort=addConsort;
addConsort=function(g,...args){
  const result=earlierSisterBondsAddConsort(g,...args);
  if(sisterBondsActive()&&g?.natalOrigin&&!g.childAdmission&&sisterAdmissionChildren(g).length){
    const ev=sisterChildAdmissionEvent(g);if(ev)pushEv(ev);
  }
  return result;
};
function sisterChildAskAgainMonth(){
  for(const g of harem()){
    const state=g.childAdmission;
    if(state?.status!=='declined'||state.asks!==1||S.turn-state.turn<6||!chance(.05))continue;
    const ev=sisterChildAdmissionEvent(g,true);if(!ev)continue;
    state.status='asking';pushEv(ev);
  }
}
function motherWardMonth(){
  const seen=new Set();
  for(const c of familyCourtHosts()){
    const h=houseOf(c);if(!h||seen.has(h))continue;seen.add(h);
    for(const p of h.relatives||[]){
      const ward=p.motherWard;if(!ward||ward.ended!=null)continue;
      const g=byId(ward.consortId);
      if(p.alive===false||!g?.alive||!inPalace(g)||natalAge(p)>=15||p.married){
        ward.ended=S.turn;
        if(p.alive!==false){p.story||=[];story(p,`【回到原家】${!g?.alive?'母亲故去后':!inPalace(g)?'母亲离宫，':'年岁渐长，'}她从宫里回到原家。`);}
      }
    }
  }
}
const earlierSisterBondsNatalStatus=natalStatus;
natalStatus=function(p){
  const base=earlierSisterBondsNatalStatus(p);
  if(!sisterBondsActive()||!motherWardActive(p))return base;
  const g=byId(p.motherWard.consortId);
  return `${base} · 随母居${g.palace} · 宫中称“${p.motherWard.address}”`;
};
const earlierSisterBondsChildrenPanel=marriedSisterChildrenPanel;
marriedSisterChildrenPanel=function(c){
  const html=earlierSisterBondsChildrenPanel(c);
  if(!sisterBondsActive()||!c?.natalOrigin)return html;
  const wards=sisterAdmissionChildren(c).filter(motherWardActive);
  return html+(wards.length?detailSection('随母入宫的女儿',wards.map(p=>`<p><button class="person-link" data-onclick="A.go('natal','${c.natalOrigin.host}:${p.id}')">${esc(p.name)} ↗</button> · 宫中称“${esc(p.motherWard.address)}” · ${natalAge(p)}岁</p>`).join('')):'');
};

/* —— 宫中姐妹纪事 —— */
function palaceSisterPairs(){
  const people=harem().filter(c=>inPalace(c)&&!c.maid),pairs=[];
  for(let i=0;i<people.length;i++)for(let j=i+1;j<people.length;j++){
    const a=people[i],b=people[j],label=a.kin?.[b.id]||b.kin?.[a.id]||'';
    if(/[姐妹]/.test(label)||sameFather(a,b))pairs.push([a,b]);
  }
  return pairs;
}
function sisterBondTone(a,b){
  const bond=Math.min(relGet(a,b),relGet(b,a)||relGet(a,b));
  if(isRival(a,b)||isRival(b,a)||relGet(a,b)<0)return 'tense';
  return bond>=40?'close':'plain';
}
const SISTER_BOND_SCENES={
  close:[
    ['互赠针线',(a,b)=>`${fullName(a)}给${fullName(b)}缝了一对护膝，针脚密密的，说冬日去请安路远，别冻着了。${fullName(b)}回赠一只香囊，里头装着娘家常用的安神草。`,
      ['她总记得我膝头怕冷。宫里这么多人，记得这种小事的只有她。','那对护膝我舍不得用，先收进箱里，香囊倒是天天带着。']],
    ['同读家书',(a,b)=>`家中来信，${fullName(a)}特意等${fullName(b)}来了才拆，两人头挨着头读完，又一起商量回信该写些什么。`,
      ['有人和我一起读家书，信里的“安好”二字才像是真的。','她念到娘的那几句时声音发颤，我就接着替她念完。']],
    ['请安时解围',(a,b)=>`请安时有人话里有话，提起${fullName(b)}的出身。${fullName(a)}笑着把话头接过去，几句就带开了。散了以后，${fullName(b)}拉着她的袖子道谢。`,
      ['我们姐妹的事，轮不到旁人拿来做文章。','她护着我的样子，和小时候在家一模一样。']],
    ['夜话旧事',(a,b)=>`${fullName(a)}留${fullName(b)}在宫里用晚膳，说起小时候一起偷摘邻家枇杷的事，笑得宫女都探头来看。`,
      ['好些年没有这样笑过了。','在宫里待久了，差点忘了自己也有那样的时候。']]],
  tense:[
    ['份例之争',(a,b)=>`内务府分月例时，${fullName(a)}的宫人嫌${fullName(b)}那边领得多，两边在廊下争了几句。两人后来见面，谁也没提，却也谁都没让。`,
      ['不是我计较，是她宫里的人欺人太甚。','一样是家里出来的，凭什么处处要我让着。']],
    ['请安冷语',(a,b)=>`坤宁宫请安时，${fullName(a)}与${fullName(b)}隔着两个座位，旁人说笑，她们一句话也没对上。出门时${fullName(a)}先走一步，连头也没回。`,
      ['亲姐妹又怎样，心里的结不是一句“家人”就能解开。','她不肯看我，我也不必上赶着。']],
    ['家书各说各话',(a,b)=>`家里来信问姐妹俩近况，${fullName(a)}与${fullName(b)}各写了一封回信，说的是同一件事，口气却全然不同。`,
      ['我写的是实情。她要怎么说，那是她的事。','爹娘读到两封信，大概又要叹气了。']],
    ['宴席座次',(a,b)=>`宫宴排座，${fullName(a)}被排在${fullName(b)}下首。席间有人敬酒，${fullName(b)}笑着替妹妹应了，${fullName(a)}却把杯子搁下，没有喝。`,
      ['她替我应酒，像是要众人看看谁是长姐。','我是好意，她偏要往坏处想。']]],
  plain:[
    ['节下往来',(a,b)=>`节下${fullName(a)}给${fullName(b)}送去一盒家乡点心，${fullName(b)}回了一包新茶。两人说了几句家常，各自回宫。`,
      ['礼数到了便好，不必太亲近，也不必生分。','她送来的点心还是从前家里的味道。']],
    ['同去请安',(a,b)=>`${fullName(a)}与${fullName(b)}在御花园碰见，便结伴去慈宁宫请安。一路说的都是天气和花，倒也自在。`,
      ['能这样说几句闲话，也算难得。','她比从前沉稳了，我竟有些不认得。']]]
};
function sisterBondScene(a,b,tone,used){
  const pool=SISTER_BOND_SCENES[tone],fresh=pool.filter(([title])=>!used.includes(title));
  const [title,write,thoughts]=pick(fresh.length?fresh:pool);
  return {title,text:write(a,b),thoughts};
}
const SISTER_FAMILY_LINES={
  close:{father:(a,b)=>`【欣慰】读到${a.name}与${b.name}在宫中互相照应，捋须笑了半晌，把信念给家里人也听了一遍，又亲笔回信叮嘱两人互相扶持。`,
    brother:(a,b)=>`【欣慰】听说两个妹妹在宫中和睦，在回信里说：“你们好好的，我在外头也就安心了。”`},
  tense:{father:(a,b)=>`【难过】听说${a.name}与${b.name}在宫中不睦，一夜没睡好。提笔写信劝和，写了又撕，最后只写了一句“你们是一家人”。`,
    brother:(a,b)=>`【难过】听说两个妹妹在宫中生了嫌隙，在信里替两人各说了几句好话，盼她们念着从前在家的日子。`}
};
function sisterFamilyReaction(a,b,tone){
  if(!SISTER_FAMILY_LINES[tone]||!sameFather(a,b))return '';
  const h=houseOf(a);if(!h)return '';
  const roles=officialRoles(h).filter(role=>role==='father'||/^brother/.test(role));
  const reached=[];
  for(const role of roles){
    const p=officialPerson(h,role);if(!officialAlive(p))continue;
    const kind=role==='father'?'father':'brother';
    if(kind==='brother'&&reached.some(r=>r.kind==='brother'))continue;
    officialRecord(a,role,SISTER_FAMILY_LINES[tone][kind](a,b),{emotion:tone==='close'?.4:-.4});
    if(tone==='tense'){p.householdMood='为女儿们不睦难过';}else p.householdMood='欣慰';
    reached.push({kind,p});
  }
  return reached.map(r=>r.p.name).join('、');
}
function palaceSisterBondsMonth(){
  const flags=S.flags.sisterBonds||={};
  let shown=0;
  for(const [a,b] of shuffle(palaceSisterPairs())){
    if(shown>=1)break;
    const key=`${S.gen}:${Math.min(a.id,b.id)}:${Math.max(a.id,b.id)}`,state=flags[key]||={last:-99,family:-99,used:[]};
    if(S.turn-state.last<6||!chance(.3))continue;
    const tone=sisterBondTone(a,b),scene=sisterBondScene(a,b,tone,state.used);
    state.last=S.turn;state.used=[...state.used.filter(x=>x!==scene.title),scene.title].slice(-3);shown++;
    const [first,second]=chance(.5)?[a,b]:[b,a];
    livedRecord([first,second],'family',`姐妹 · ${scene.title}`,sisterThread(first,second),`【宫中姐妹】${scene.text}`,scene.thoughts);
    relAdd(a,b,tone==='close'?3:tone==='tense'?-3:1);
    if(tone!=='plain'){cchg(a,{mood:tone==='close'?2:-2});cchg(b,{mood:tone==='close'?2:-2});}
    if(tone!=='plain'&&S.turn-state.family>=12&&chance(.5)){
      const who=sisterFamilyReaction(first,second,tone);
      if(who)state.family=S.turn;
    }
  }
}
function sisterBondsMonth(){
  if(!sisterBondsActive()||S.over||mourningActive())return;
  sisterChildAskAgainMonth();motherWardMonth();palaceSisterBondsMonth();
}
