/* Marriage news belongs in the mother's own account, with the actual courtship as context. */
const maternalWeddingsActive=()=>journalContentVersion()>=131;
const MATERNAL_WEDDING_VOICES={
  gentle:{news:'她让人把消息细说一遍，尤其想知道两个孩子问婚期时是什么神情。',gesture:'把手边的活计放下，招呼两人坐近一些',lines:[
    '日子里的喜事，多半是能说给对方听的小事。遇上了就留一句，晚上慢慢讲。',
    '记得给对方留一碗热饭，也记得忙起来先捎个话。有人等的时候，一句平安就够管用。'
  ]},
  direct:{news:'她立时问礼官，两个孩子是怎么开口的，听说二人都亲自问了，才笑着点头。',gesture:'把身旁的两张凳子拖了出来，自己先开了口',lines:[
    '心里打了结，就趁它还小的时候说。若有争执，先把对方的话听完，再轮到自己。',
    '往后有事，谁也别只顾闷着猜。哪一句听岔了，便当面再问一遍。'
  ]},
  ordered:{news:'她把新定的安排记在婚帖旁，又核对了一遍两人的生辰。',gesture:'将礼单收好，另把两人的名字并着写在笺上',lines:[
    '府里用什么规矩，由你们先商量。家里人来问，也等两个人都有话说过了再回。',
    '钱粮怎么用，亲眷怎么往来，早些坐下来议。定好的事，也许日后还要一起改。'
  ]},
  thoughtful:{news:'她独自把来话想了一遍，打算等他们得空，再听一听两人盼的是怎样的日子。',gesture:'把灯拨亮了些，等两人都坐定才说话',lines:[
    '各留一件自己真心喜欢的事。哪天想邀对方一道来，问一声，等人家答应。',
    '有时谁也没想好怎么答，便留一夜慢慢想。第二日还愿意接着说，这就好。'
  ]},
  bright:{news:'她一听便笑了，想把喜信转告亲人，又先问两个孩子想不想自己去说。',gesture:'几次想端起茶盏，最后还是笑着把它放下了',lines:[
    '婚帖上没写日子该怎么过。想赏花便相约去，想吃哪家的点心，记得留一半带回去。',
    '配得上今天这双喜字的，还有往后两个人说起一桩小事，忽然一块儿笑起来。'
  ]},
  whiteSpring:{news:'她下意识敲了两下案沿，想起家乡哪一段鼓点最宜报这样的喜。',gesture:'指尖在案沿轻敲了两回，像在寻一段家乡的旧鼓点',lines:[
    '往后跑得快的那个，要记得回头看看。一起走两步，再挑两个人都想看的路。',
    '我离家时收过一首旧曲，想家的时候便唱一遍。你们也给自己留些这样的东西。'
  ]}
};
function maternalWeddingVoice(c){
  if(c.fixedStory==='ayimu')return MATERNAL_WEDDING_VOICES.whiteSpring;
  if(['爽直','将门','刚烈'].includes(c.trait))return MATERNAL_WEDDING_VOICES.direct;
  if(['持重','城府','善妒','骄矜','骄纵','好胜'].includes(c.trait))return MATERNAL_WEDDING_VOICES.ordered;
  if(isSolitary(c)||['淡泊','沉静','才女','好学','聪慧','巧手'].includes(c.trait))return MATERNAL_WEDDING_VOICES.thoughtful;
  if(['活泼','好客','爽朗'].includes(c.trait))return MATERNAL_WEDDING_VOICES.bright;
  return MATERNAL_WEDDING_VOICES.gentle;
}
function maternalWeddingMemory(k,p,b,history){
  if(!b)return '';
  if(history.item)return `她想起两人小时候留下的${history.item}。那纸婚帖旁，也该有他们自己选来珍重的东西。`;
  const moment=history.moments[0];
  if(moment){
    const thought={childhood:'那时他们说起一桩小事，就能聊上半日。',journey:'她读过两人记的同一程，才知道他们各自留心的是什么。',
      letter:'读信时，她留意到两人已经有了大人插不上话的旧话题。',visit:'从那次相见的回音里，她听出了两人自己的主意。',
      gift:'那时的岁礼还得大人经手，礼送到后，两个孩子各有一句想自己捎去的话。'}[moment.kind];
    return `她记得${moment.date}的旧事。${moment.text}${thought}`;
  }
  return `她想起当年请准两家交换婚帖的日子。如今${k.name}与${p.name}各自有了主意，她想再听听他们的话。`;
}
function maternalWeddingMother(k){
  const c=familyHostById(k.mom);
  return c?.alive&&!c.cold&&!c.gone?c:null;
}
function maternalWeddingEvent(k,p,b=null,finish=null){
  const c=maternalWeddingMother(k);
  if(!c)return null;
  const title='婚前听母亲说几句话',thread=`maternal-wedding:${k.id}:${p.personId??p.id??p.name}`;
  if(c.story?.some(e=>e.thread===thread))return null;
  const history=b?betrothalWeddingHistory(k,p,b):null,voice=maternalWeddingVoice(c);
  const own=voice.lines[marriageHash(thread+':'+c.id)%voice.lines.length];
  const trust=p.trust??50,tone=weddingAffectionTone(history||{royal:trust,relative:trust});
  const tender={
    close:b?'你们从前愿意等对方把话说完。我最放心的，正是这一件小事，往后还要记得。':
      '听你提起这门婚事，声音都是有笑意的。我盼着这份欢喜也能留到寻常日子里。',
    uneven:`${history?.royal<history?.relative?k.name:p.name}，你若心里还有没想明白的，慢慢说出来。另一个人给足工夫听，急的事也可先放一放。`,
    careful:'我知道你们有些话还说不出口。今日先说一件，再给彼此留足工夫。',
    steady:'婚礼的热闹过了，才有一天天自己的日子。往后想家的时候，就写封信回来。'
  }[tone];
  const letter=!inPalace(c)||k.away||royalJourneyAway(k)||k.princessMarriage==='frontier'||p.away||p.commission||
    p.diplomaticJourney||p.incognitoCase||k.foster&&k.foster!==c.id&&k.visitRule==='closed';
  const lead=`${fullName(c)}得知${k.name}与${p.name}即将成婚。`+(letter?'她亲笔写信，请礼官将同样的话各递一份给两人。':
    `她${voice.gesture}，愿在婚礼前同他们说几句家常。`);
  const memory=maternalWeddingMemory(k,p,b,history);
  const text=`${lead}${memory?'\n'+memory:''}\n${letter?'信中写道':'她说'}：“${own}${tender}”`;
  const valid=()=>c.alive&&!c.cold&&!c.gone&&k.alive&&p.alive!==false&&
    (b?k.betrothal===b&&!k.married&&!p.married&&royalNatalEngaged(p)&&p.betrothal.personId===k.id&&royalNatalWeddingReady(k,p,b):
      k.married&&k.spouse===p);
  return {title,por:c,cast:[k,b?natalPortrait(p):spouseAppearance(k)],valid,text,
    onShow:()=>{
      if(c.story?.some(e=>e.thread===thread))return;
      c.story ||= [];
      story(c,`【${title}】${memory||lead}${letter?'提笔时又想了片刻，最终写下':'说给两人听的是'}：“${own}${tender}”`);
      const entry=c.story.at(-1);
      entry.thread=thread;
      entry.life={kind:'family',title,turn:S.turn,gen:S.gen,source:'婚前家话',summary:text,
        people:[{id:c.id,name:fullName(c)},{id:k.id,name:k.name},{id:p.personId??p.id,name:p.name}]};
    },
    choices:[{t:finish?'听完她的叮嘱，照礼成婚':letter?'把她的家书收好':'让她把话说完',f:finish?()=>{if(valid())finish();}:undefined}]};
}
function royalNatalPrepareWedding(k,p,host,b){
  const finish=()=>royalNatalMarry(k,p,host,b);
  const event=maternalWeddingsActive()?maternalWeddingEvent(k,p,b,finish):null;
  if(!event){finish();return;}
  if(PalaceActions.busy)pushNow(event);
  else{event.onShow();finish();}
}
function maternalWeddingChanges(previous){
  if(!maternalWeddingsActive()||!previous||S.over||previous.gen!==S.gen)return;
  const unwed=new Set([...(previous.children||[]),...(previous.royalRelatives||[]),...(previous.princessRelatives||[])]
    .filter(k=>!k.married).map(k=>k.id));
  if(!unwed.size)return;
  for(const k of royalHouseholds()){
    if(!k.alive||!k.married||!k.spouse||k.spouse.natalHost!=null||!unwed.has(k.id))continue;
    pushEv(maternalWeddingEvent(k,k.spouse));
  }
}
