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
const MATERNAL_WEDDING_ADVICE={
  温婉:'我年轻时爱在门边等人，等到汤凉了，又怕说出来显得小气。其实一句“我饿了，咱们先吃吧”，也可以好好地说。',
  持重:'你们头一回一起收礼，最好一人念，一人记。我当年漏记过一包茶，到第二年春天才知道，该谢的是谁。',
  爽直:'从前我生气摔过一只杯子。杯子白赔进去，那人还不知道我气什么。你们倒省下那只杯子，把话说给该听的人听。',
  将门:'从前出门骑马，我最怕同伴明明鞍子松了，还咬牙赶路。过日子也是一样，谁难受了，谁就喊一声停。等这一程的是自家人。',
  善妒:'我也有过这样的日子：听人转述一句话，自己翻来覆去想一宿。若谁来告诉你“那一位怎么说”，回去问本人。别把好好的长夜白送给传话的人。',
  城府:'旁人来探你们的口风，大可留他喝完这盏茶。等客走了，关上门，你们才把心里那句说出来。这句话，可得对彼此说实在的。',
  骄矜:'我年轻时肯把一匣珠子送出去，却舍不得先说一句“是我错了”。后来才知道，叫亲近的人等那一句，比丢了珠子可惜。',
  骄纵:'我从前赌气，专挑人最多的时候发作，觉得这样才痛快。等人散了，台阶却难找。你们若恼了对方，就先把旁人请出去。',
  聪慧:'我也有猜错的时候。你以为明白对方在愁什么，先问一句“我想得对么”。省下的力气，两个人正好一起想办法。',
  淡泊:'屋里留一扇窗，窗下只摆两把椅子。哪一日都累了，去那里并排坐一会儿，连茶也可以不煮。',
  活泼:'我原想把喜钱藏在喜鞋里，想了想，怕你走一路硌一路。瞧，逗人笑也得挑时候！往后记着，得两个人都笑才算好玩。',
  好客:'摆头一桌家宴，先问身边的人爱吃什么。我从前满桌子招待得妥妥当当，偏偏忘了给陪我张罗的人留座。',
  巧手:'喜服上的结我原想缝死，总归牢靠。后来又拆了，改成活扣。日子长着呢，衣裳要改，家里的规矩也容你们慢慢改。',
  贪财:'我备了两份礼单，一份记花销，一份记人情。谁曾在落雨天亲自跑来帮忙，那一笔，添上多少银子也算不清。',
  痴情:'我懂天天盼着见一个人的滋味。可若对方今日累了，你先去做自己喜欢的事。等人歇好了，正好听你讲讲今日的见闻。',
  体弱:'我生病时最怕一屋子人围着问好些没有。你们哪天要照顾对方，先问想吃点什么，再问想不想一个人静一会儿。',
  沉静:'若一时说不出口，写两行字，放在对方常翻的书里也好。我有过说不清的心事，一盏茶凉了，纸上倒写明白了。',
  才女:'做诗能把一句藏得深些，写家书就免了。想念谁，开头便写想念，莫叫收信的人读完三页还猜不准。',
  好学:'我当年看了不少持家的书，偏没有一本告诉我，两个人口味一甜一咸怎么办。后来同桌摆了两碟酱，这才算学会。',
  白泉:'我家乡的鼓曲有一段要两人轮着击。小时候我总抢那半拍，阿娘便把鼓槌按住，让我听清另一个人的鼓声。你们也听听彼此。'
};
const WEDDING_CHILD_PLANS={
  好奇:{f:'我想带一张空白的京城图。往后两个人各领一次路，把自己喜欢的地方画给对方看。',m:'我只尝过宫里的年糕，她家是蒸的还是煎的？头一个年节，我想照着她家的法子也做一碟。'},
  好胜:{f:'我们约了一盘棋。我先说好了，谁也不许让。若我输了，我来收子，再请人家教我那一手。',m:'我原想头一回管家就半点错也没有。听您这么说，我倒想把账摊开，两个人一起学。'},
  仁厚:{f:'我总在想旁人吃得惯什么。您猜我方才添了哪道菜？是我自己爱吃的桂花藕，这回也给自己留一碟。',m:'明日人人都会来向我道喜。等客散了，我想倒盏茶问问她，这一天可有谁叫她为难。'},
  内敛:{f:'我想了半天，一句吉利话也没想出。可我留了两张信纸，一张写给您，还有一张……等回去了，我自己交给那个人。',m:'我在人前说话总慢半拍。头一件，我想把府里的钥匙亲手交给她，趁安静，把每一把管哪扇门都讲给她听。'},
  爽直:{f:'我要先商量一件事。往后谁想回家看看，就痛快开口。母亲，下回我回来吃饭，您还给我留老位子。',m:'那我头一桩就问她，府里照我脾气摆的那些东西，哪件最想挪走。说实话最好，我这就好预备力气搬。'},
  灵动:{f:'我打算在门后记下我们头一天闹的笑话。往后吵了嘴，就一起去念。若是我的糗事，我也认。',m:'我想请她猜一猜，两个人搬进新屋，第一件找不着的东西会是什么。我押库房钥匙，所以已经给它系了条红绳。'},
  审慎:{f:'我写了一张单子，连头一顿饭都排上了。方才我把最后三行空出来了，那三行等两个人坐下再填。',m:'礼官排的是明日的时辰。我想问她的是后日，愿不愿意睡迟些，哪些客能改天再见。'},
  自矜:{f:'礼单上样样都有人夸。我倒想留一幅自己画的画挂在新屋里，角上署我的名字。那才是我自己带去的东西。',m:'旁人见了我都先行礼。关起门来，我想让她叫我的名字。若我哪件事做得欠妥，她照样可以喊我一声。'}
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
  const expanded=PalaceActions.maternalWeddingTalk;
  const own=(expanded&&MATERNAL_WEDDING_ADVICE[c.fixedStory==='ayimu'?'白泉':c.trait])||voice.lines[marriageHash(thread+':'+c.id)%voice.lines.length];
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
  const reply=expanded?WEDDING_CHILD_PLANS[childDisposition(k)][k.sex]:'';
  const exchange=expanded?(letter?
    `信末另留了一问：“安下家来，头一件想做什么？”${k.name}另取信纸，回母亲道：“${reply}”`:
    `说到这里，她才问${k.name}：“安下家来，你自己头一件想做什么？”${k.name}答道：“${reply}”`):'';
  const hasAlbum=expanded&&k.sex==='f'&&kidAge(k)>=18&&marriageHash(thread+':dowry-album')%4===0;
  const gift=hasAlbum?(letter?
    '家书旁另有一只扁匣，封签上只写着女儿的名字。匣里是一册素绫裹好的避火图。母亲留了几个小字：“这一册给你压箱。哪日有话想问娘，只管另封一信来。”她把匣子收到自己的妆奁里，连那张封签也留着。':
    '临别，母亲单独留了女儿一会儿，把一册素绫包着的避火图塞到她手里，声音也放轻了：“这一册给你压箱。什么时候想翻，由你自己。往后有不好开口的话，还可以回来问娘。”女儿将册子收进妆奁，握了握母亲还搭在箱沿上的手。'):'';
  const text=`${lead}${memory?'\n'+memory:''}\n${letter?'信中写道':'她说'}：“${own}${tender}”`+[exchange,gift].filter(Boolean).map(part=>'\n'+part).join('');
  const valid=()=>c.alive&&!c.cold&&!c.gone&&k.alive&&p.alive!==false&&
    (b?k.betrothal===b&&!k.married&&!p.married&&royalNatalEngaged(p)&&p.betrothal.personId===k.id&&royalNatalWeddingReady(k,p,b):
      k.married&&k.spouse===p);
  return {title,por:c,cast:[k,b?natalPortrait(p):spouseAppearance(k)],valid,text,
    onShow:()=>{
      if(c.story?.some(e=>e.thread===thread))return;
      c.story ||= [];
      story(c,`【${title}】${memory||lead}${letter?'提笔时又想了片刻，最终写下':'说给两人听的是'}：“${own}${tender}”`);
      if(expanded){
        const maternal=letter?'她在信尾问孩子想怎样安家，把回信的位置留给了孩子。':`${k.name}想了想，答她：“${reply}”`;
        c.story.at(-1).t+=maternal+(hasAlbum?'她还为女儿备了一册压箱的避火图。':'');
        k.story ||= [];
        kstory(k,`【婚前家话】${letter?'母亲从家中寄来叮嘱':'临行前听母亲叮嘱'}：“${own}”${letter?'我回信告诉她':'我当面告诉她'}：“${reply}”${hasAlbum?'母亲给我的那册避火图，已经收进我自己的妆奁里。':''}`);
      }
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
