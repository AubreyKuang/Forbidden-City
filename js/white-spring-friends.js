/* 皇商女儿入宫前听过白泉的故事。相识只发生一次，此后的交情照常变化。 */
function admiresWhiteSpring(c){
  return journalContentVersion()>=104&&c&&!c.maid&&!c.sex&&(c.upbringing?.title||c.fam?.t)==='皇商'&&c.fixedStory!=='ayimu';
}
function whiteSpringFriends(a,b){
  return journalContentVersion()>=104&&((a?.fixedStory==='ayimu'&&b?.whiteSpringFriend?.princess===a.id)||
    (b?.fixedStory==='ayimu'&&a?.whiteSpringFriend?.princess===b.id));
}
function whiteSpringCanMeet(c){
  return inPalace(c)&&!c.maid&&c.hp!==0&&!(dowagerIll(S.flags.dowager)&&S.flags.dowager.lastYears.caregiver===c.id);
}
function meetWhiteSpringMerchants(){
  if(journalContentVersion()<104||!S||S.over||PalaceActions.blocked)return;
  const princess=S.consorts.find(c=>c.fixedStory==='ayimu'&&whiteSpringCanMeet(c));
  for(const c of S.consorts){
    if(!c.alive||c.gone||c.familyArchive||!admiresWhiteSpring(c))continue;
    if(!c.whiteSpringFriend){
      c.whiteSpringFriend={};
      const memory=(c.seed%2===0)?'娘家商队回来，别人问一路的价钱，她却爱听白泉的故事。掌柜说公主会踏鼓，她一直想问，舞步和腕铃怎么合上同一拍。':'她在娘家的货签上见过“白泉舞铃”四字。老伙计说，得听阿依慕亲手摇一遍，才知道铃也有轻重。她把这句话记了许多年。';
      story(c,'【仰慕阿依慕】'+memory);
    }
    const tie=c.whiteSpringFriend;
    if(!princess||tie.princess!=null||!whiteSpringCanMeet(c))continue;
    const old=friendshipArc(c,princess),strained=friendshipTense(c,princess);
    tie.princess=princess.id;tie.met=S.turn;
    relAdd(c,princess,Math.max(0,55-relGet(c,princess)));
    if(strained){old.stage='renewed';delete old.pending;}
    const arc=old||friendshipTrack(c,princess);
    if(arc&&!old)arc.anchor='阿依慕曾解下腕铃，教她听白泉舞步的轻重拍';
    const name=fullName(c);
    const line=strained?`${name}带着一枚旧商铃向阿依慕赔了不是。两人把从前的芥蒂说开，阿依慕握着她的手教她摇响腕铃，又约她明日过来。`:
      `${name}向阿依慕问起白泉的舞铃。公主解下一串系在她腕上，让她先轻轻转腕，再随鼓点落手。她终于听出了商队说的两种铃声。临走时，阿依慕约她下回带家里的铃来，两人好作个比较。`;
    lifeRecord([c,princess],'bond','白泉铃声','【白泉铃声】'+line,'皇商家中的白泉见闻',[
      {text:'从前隔着柜台听人讲，今日是她亲手教我的。',emotion:.5},
      {text:'她真肯坐下来听轻重拍，我愿把家乡的曲子再教她一段。',emotion:.5}
    ]);
  }
}
const WHITE_SPRING_VISITS={
  cloth:{title:'同辨白泉织样',text:'摊开娘家带来的两块织样。阿依慕翻过布角，认出是白泉冬衣的织法。两人拿指尖摸过经纬，把旧货签上的“舞衣”改成了“挡风用”。'},
  bells:{title:'合一回舞铃',text:'依约带来一枚旧商铃。阿依慕说，商铃是让队尾听见前路，舞铃却要等鼓。两人各执一铃试了几回，终于让最后一响落在同一拍上。'}
};
function whiteSpringFriendPanel(person){
  if(journalContentVersion()<104||!inPalace(person))return '';
  const isPrincess=person.fixedStory==='ayimu';
  const girls=isPrincess?S.consorts.filter(c=>whiteSpringFriends(person,c)&&whiteSpringCanMeet(c)):[person];
  const rows=[];
  for(const c of girls){
    const tie=c.whiteSpringFriend,p=byId(tie?.princess);
    if(!p||!whiteSpringFriends(c,p)||!whiteSpringCanMeet(c)||!whiteSpringCanMeet(p))continue;
    const companion=isPrincess?c:p;
    const actions=Object.entries(WHITE_SPRING_VISITS).filter(([key])=>!tie[key]).map(([key,v])=>
      `<button class="btn jade sm" onclick="A.whiteSpringVisit(${c.id},'${key}')" ${S.over||tie.last===S.turn||friendshipTense(c,p)||relGet(c,p)<30?'disabled':''}>${v.title}</button>`).join('');
    rows.push(`<p>与<button class="person-link" onclick="A.go('consort',${companion.id})">${esc(fullName(companion))}</button>有白泉铃声这段旧缘。</p>`+
      (actions?`<div class="acts">${actions}</div>${tie.last===S.turn?'<p class="hint">这月已经相聚，下月可再约。</p>':friendshipTense(c,p)||relGet(c,p)<30?'<p class="hint">两人近来疏远，待交情转好再约。</p>':''}`:''));
  }
  return rows.length?detailSection('白泉旧缘',rows.join('')):'';
}
A.whiteSpringVisit=function(id,key){
  const c=byId(id),tie=c?.whiteSpringFriend,p=byId(tie?.princess);
  if(!p||!whiteSpringFriends(c,p)||!Object.hasOwn(WHITE_SPRING_VISITS,key)||modalOpen||S.over)return;
  const ready=()=>whiteSpringCanMeet(c)&&whiteSpringCanMeet(p)&&!tie[key]&&tie.last!==S.turn&&!friendshipTense(c,p)&&relGet(c,p)>=30;
  if(!ready())return;
  const visit=WHITE_SPRING_VISITS[key],line=fullName(c)+visit.text;
  pushEv({title:visit.title,cast:[c,p],present:[c,p],text:line,valid:ready,choices:[{t:'记下这次相聚',f:()=>{
    if(!ready())return;
    tie[key]=true;tie.last=S.turn;relAdd(c,p,5);cchg(c,{mood:3});cchg(p,{mood:3});
    lifeRecord([c,p],'bond',visit.title,`【${visit.title}】${line}`,'白泉铃声');
  }}]});
};
