/* A death is committed only when its mandatory announcement enters the queue. */
function mourningOf(){return S?.flags.dowager?.mourning}
function mourningActive(){const m=mourningOf();return !!(m&&!m.legacy&&S.turn===m.turn)}
function mourningWomen(){const d=ensureDowager();return d?dowagerKin().filter(c=>!c.cold):[]}
function mourningReaction(c){
  if(c.cold)return '消息传到冷宫，她伏在窗前哭了许久，连晚膳也没有动。';
  if(['沉静','持重','聪慧'].includes(c.trait))return '在人前一直强忍，替姐妹拢好素衣，转身扶住廊柱时，眼泪才掉下来。';
  if(c.trait==='城府')return '一遍遍擦着太后留下的念珠，泪水落在手背上：“往后再没人叫我一声家里的小姑娘了。”';
  if(['骄纵','骄矜'].includes(c.trait))return '摘了满头珠翠，伏在灵前哭得直不起身。平日的骄矜此刻全没了。';
  return '跪在灵前哭成了泪人，攥着太后生前赐的帕子，宫人劝了几回都不肯起身。';
}
function beginDowagerMourning(d){
  if(!d.alive)return;
  d.alive=false;
  const kin=dowagerKin();
  d.mourning={turn:S.turn,date:dateStr(),handled:false,followed:false,kin:kin.map(c=>c.id),reactions:{}};
  log(`${d.name}于慈宁宫崩逝，宫门悬素，停宴举哀。`,1);
  for(const c of alive()){
    const related=kin.includes(c);c.mood=clamp(c.mood-(related?28:5));
    if(related){
      const reaction=mourningReaction(c);d.mourning.reactions[c.id]=reaction;
      setXin(c,'悲恸',`${d.name}崩逝，痛失母族长辈`);story(c,`${d.name}崩逝。${reaction}`);
      remember(c,'family',`${d.name}去世，往后慈宁宫里再没有这位长辈等我了。`);
    }
  }
}
function migrateMourning(){
  const d=ensureDowager();
  if(d&&!d.alive&&!d.mourning)d.mourning={legacy:true,handled:true,followed:true,kin:[],reactions:{}};
}
function mourningScene(){
  const d=S.flags.dowager;
  return `<section class="mourning-scene" aria-label="慈宁宫丧仪画面"><div class="mourning-lintel">慈 宁 宫</div><div class="mourning-streamer left"></div><div class="mourning-streamer right"></div><div class="mourning-altar"><i class="mourning-candle"></i><div class="mourning-tablet"><small>追思</small><strong>${esc(d?.name||'皇太后')}</strong><span>之灵位</span></div><i class="mourning-candle"></i></div><div class="mourning-incense">素帷低垂 · 长明灯未熄</div></section>`;
}
function mourningCast(){const m=mourningOf();return m?.legacy?mourningWomen():(m?.kin||[]).map(byId).filter(c=>c?.alive&&!c.gone&&!c.cold)}
function dowagerPassingEvent(){
  const d=ensureDowager();if(!d)return null;
  if(!d.alive)return d.mourning&&!d.mourning.handled?dowagerFuneralEvent(d):null;
  if(S.turn<=36||!chance(.006))return null;
  return dowagerFuneralEvent(d);
}
function dowagerFuneralEvent(d=S.flags.dowager){
  const kin=d.alive?mourningWomen():mourningCast();
  const reactions=kin.slice(0,3).map(c=>`${cName(c)}${d.mourning?.reactions[c.id]||mourningReaction(c)}`).join('\n');
  const settle=(simple)=>{
    const m=d.mourning;if(!m||m.handled)return null;
    const cost=simple?20:80;if(E().treasury<cost&&!simple)return '国库不足，仍请从简安排。';
    m.handled=true;m.rite=simple?'从简尽礼':'厚葬守孝';
    const women=mourningCast();women.forEach(c=>{cchg(c,{aff:simple?2:5,mood:5});remember(c,'family',`陛下为${d.name}${m.rite}，并让家中姐妹相伴守灵。`);});
    log(`为${d.name}${m.rite}，母族妃嫔相伴守灵。`,1);
    const paid=Math.min(Math.max(0,E().treasury),cost);
    const result=`灵前香烟缓缓升起。${women.length?women.map(cName).join('、')+'靠在一起，哭声渐渐低了。':'宫人默默换过灯烛。'}你在素帷前停了很久。${fx(chg({treasury:-paid,people:simple?2:4,prestige:2}))}`;
    save('auto');return result;
  };
  return {title:'太后崩逝 · 宫中举哀',scene:'mourning',sfx:'sad',cast:kin.slice(0,3),
    text:`慈宁宫传来长长的哭声。掌事姑姑跪在御前，几次哽咽，才说出：“${d.name}……去了。”\n宫门撤去彩饰，换上素幡。${d.name}生前常坐的榻边，只剩一盏未熄的灯。${reactions?'\n'+reactions:''}\n请陛下安排丧仪。本月宫中暂停宴饮。`,
    onQueue:()=>beginDowagerMourning(d),choices:[
      {t:'厚葬守孝，亲赴慈宁宫送别（国库-80）',cond:()=>E().treasury>=80,why:'国库银两不足，可从简尽礼',f:()=>settle(false)},
      {t:'丧仪从简，仍亲自守灵（国库至多-20）',f:()=>settle(true)}]};
}
A.openMourning=function(){
  const d=S.flags.dowager;if(!d||d.alive||modalOpen)return;
  migrateMourning();
  if(!d.mourning.handled){pushEv(dowagerFuneralEvent(d));return;}
  const women=(d.mourning.legacy?mourningWomen():mourningCast()).slice(0,3);
  pushEv({title:'慈宁宫 · 追思',scene:'mourning',sfx:'sad',cast:women,
    text:`${d.name}已经不在了，慈宁宫里仍留着她用过的念珠与茶盏。${women.length?'\n'+women.map(c=>`${cName(c)}换了素净的衣裳，在灯下说起太后生前的小事。`).join('\n'):''}\n你来到灵前，陪众人站了一会儿。`,choices:[
      {t:'陪母族妃嫔坐一会儿，听她们说旧事',f:()=>finishMourningVisit(women,'陪坐')},
      {t:'亲自添香，嘱姐妹相互照应',f:()=>finishMourningVisit(women,'添香')} ]});
};
function finishMourningVisit(women,action){
  const m=mourningOf();if(m.lastVisitYear===S.year)return '灯烛仍亮着，你又静静站了一会儿。';
  m.lastVisitYear=S.year;m.followed=true;
  for(const c of women){
    cchg(c,{mood:8,aff:3});if(xinOf(c)==='悲恸')setXin(c,'释然','陛下陪自己追思太后，姐妹也在身旁');
    story(c,`在慈宁宫追思太后，陛下亲自${action}，陪她谈起旧事。`);remember(c,'care','太后去世后，陛下在慈宁宫陪我说起她的旧事。');
  }
  for(let i=0;i<women.length;i++)for(let j=i+1;j<women.length;j++)relAdd(women[i],women[j],5);
  log('帝赴慈宁宫追思太后，安抚母族妃嫔。');save('auto');
  return '说到太后从前总把糕点留给晚到的人，有人含泪笑了一下。她们将灯芯拨亮，约好往后也相互照应。';
}
function mourningNotice(){
  const d=S.flags.dowager,m=d?.mourning;if(!m||(m.legacy?m.lastVisitYear!=null:m.handled&&S.turn-m.turn>3))return '';
  return `<section class="mourning-notice" role="status"><strong>${esc(d.name)}已故</strong><span>${m.handled?'慈宁宫已设灵，可前往追思、安抚族女。':'慈宁宫已悬素幡，丧仪尚待陛下安排。'}</span><button class="btn sm" onclick="A.visitMapActivity('cn')">前往慈宁宫 →</button></section>`;
}
function mourningPlacePanel(){
  const d=S.flags.dowager,m=d?.mourning;
  if(!d||d.alive)return '';
  return `${mourningScene()}${activityPortraits(...mourningCast().slice(0,3))}<p>${esc(d.name)}已故${m?.date?' · '+esc(m.date):''}。</p>
    ${Object.keys(m?.reactions||{}).length?'<h3>送别时的身影</h3>':''}${Object.entries(m?.reactions||{}).slice(0,3).map(([id,text])=>{const c=byId(+id);return c?`<p>${parentLink(c.id)} · ${esc(text)}</p>`:'';}).join('')}
    <button class="btn" onclick="A.openMourning()">${m?.handled?'上一炷香 · 追思太后':'料理太后丧仪'}</button>`;
}
