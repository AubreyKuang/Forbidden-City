// A visit can pick up a real gift, fitting or performance after the month it happened.
const SACHET_STORIES={
 gouyi:'赵令仪把囊口的细绳换成了宽袢，手掌轻轻一勾就开了。“下回再有人问我的手，先让他看看这袢子，是我自己改的。”',
 qingyi:'沈清漪把素笺比着香囊折了一道，在露出的纸角写上一个“漪”字。“从前帖子上常写京城第一美人。若是我自己的东西，写这一个字就够了。”',
 luwan:'陆绾把香囊系在腰侧，试着做了个上马的动作。银穗果然勾住衣带，她笑着解下来：“在马上，少一样挂碍比好看要紧。”',
 ayimu:'阿依慕把新香囊和母亲缝的那只并在膝上。她教你念白泉话里收针的叫法，等你念对了，才把两只都系回去。',
 chuwan:'她另裁一小条布，在里衬绣下自己如今用的名字。“从前总是别人拿着簿子问我叫什么。这件东西，我想亲手落款。”',
 suheng:'苏蘅把两撮香分开放了一夜，先请你闻便宜的那撮。等你选定，她才展开包纸给你看价钱：“贵的那味倒把别的气味都盖过去了。”',
 xiaoman:'岑小满把空囊翻给你看，手腕一转，囊口却滚出一枚铜钱。她让你再试一次，这回放慢了手，好教你看清钱从哪里来。',
 hongjian:'薛红笺裁了几张窄笺试写香囊上的小字。最漂亮的一张洇了，她留着给做纸的人看，另外挑了一张写得清楚的系在囊上。'
};
const LADY_GIFT_VOICES={
 温婉:'那天人人催我谢恩，倒是今日这样坐着，我才好说一句贴心话。',
 骄纵:'我还想挑一次自己喜欢的。陛下若问，我就直说，免得底下的人猜。',
 骄矜:'那日我很喜欢。等人散了才肯承认，是怕一屋子的人只盯着我的脸看。',
 聪慧:'我问了经手的人，才明白中间有一道工夫先前想错了。您猜是哪一道？',
 善妒:'那天我先看了别人得了什么，回去才细想自己喜不喜欢。今日我想只说我这份。',
 淡泊:'劳您还记着。那天安静坐一会儿的工夫，我也一样喜欢。',
 活泼:'我本来想端端正正谢一回，见您当真问起，倒想先讲件好笑的。',
 城府:'那天人多，我说的都是稳妥话。今日门掩着，有一句我可以照实讲。',
 痴情:'东西是哪天来的我记得。您那日多坐了半盏茶，我记得更清楚。',
 体弱:'昨日精神短，没说完就歇了。今儿好些，正想把后半句讲给您听。',
 将门:'好不好，总要自己试过才算。那天急着谢恩，今日我倒能说出个实在来。',
 才女:'我想记两句，写到“蒙恩”便写不下去。换成自己的话，忽然有得写了。',
 贪财:'我问过市价，也打听了做这件事的人实得多少。两个数可差得远。',
 沉静:'人一多，想说的话便慢半拍。今日只您听，我慢慢讲。',
 爽直:'喜欢哪里，不惯哪里，我都直说。您既问了，就许我说到底。',
 持重:'那日还有一件小事没交代清。我记着，等您得空再说。',
 好客:'那天席边最安静的那个人，我倒想听听她的意思。总得给人留个说话的空。',
 巧手:'我惦着那日经手的人。做得齐整，往往叫人看不出费过多少工夫。',
 好学:'我回去记了个问题。您若也不晓得，咱们改日找懂行的人问。'
};
const SCHOOL_BAG_VOICES={
 好奇:'把袋里的笔一支支换了位置，想试出怎样跑起来最不响。',好胜:'掏出两张描红放在一处，请你猜哪张是后来重写的。',
 仁厚:'在侧袋多放了一支笔，说同窗若是忘了带，就借给人家。',内敛:'等旁人走过去，才给你看里袋夹着的那张小画。',
 爽直:'把袋口一翻：“里头这道缝挂笔尖。能不能照我画的样子改一改？”',灵动:'给每个小袋起了个名字，最窄的一个叫“小笔胡同”。',
 审慎:'把怕沾墨的纸隔开收妥，合上袋口又轻轻摇了摇。',自矜:'把亲手打的结拆了重系，待两头一般长才肯给你看。'
};
function markPalaceRemembrance(p,kind,item,taste){
 if(!palaceDetailsActive())return;
 const memories=p.palaceRemembrances||={};
 const old=memories[kind];
 if(old?.gen===S.gen&&(!Number.isFinite(old.ended)||S.turn-old.ended<6))return;
 memories[kind]={gen:S.gen,turn:S.turn,item,taste};
}
function canHearRemembrance(p,m){
 if(!p||!palaceDetailsActive()||S.over||!m||m.gen!==S.gen||m.ended!=null||S.turn<=m.turn)return false;
 return p.sex?childInPalace(p)&&!p.pendingName:workshopPresent(p);
}
function remembrancePanel(p){
 const entries=Object.entries(p.palaceRemembrances||{}).filter(([,m])=>canHearRemembrance(p,m));
 return entries.length?detailSection('上回的事',entries.map(([kind,m])=>`<button class="btn sm" onclick="A.hearRemembrance(${p.id},'${kind}',${!!p.sex})">再谈${esc(m.item)}</button>`).join('')):'';
}
function remembranceWords(p,kind,item){
 if(p.sex){
   const age=kidAge(p),name=kidName(p);
   if(kind==='music')return name+'在桌沿敲了几下，敲到《'+item+'》停顿的地方，特意把手举了起来：“这里要让一拍。我那天差点跟错了。”';
   if(item==='夹衣')return age<3?'乳母把那件夹衣拿来，孩子摸到熟悉的软领就攥在了手里。':name+'翻出尚衣局做的夹衣，比了比当初折过的袖口，伸手请你再量一次。';
   return name+(SCHOOL_BAG_VOICES[childDisposition(p)]||'打开尚衣局做的书袋，给你看最常用的那一格。');
 }
 const name=fullName(p);
 if(item==='香囊'&&SACHET_STORIES[storyQueenKey(p)])return SACHET_STORIES[storyQueenKey(p)];
 const lead=kind==='music'?`说起席上那支《${item}》，${name}轻轻哼了末尾的两拍。`:
   kind==='gift'?`谈起那回御赐的${item}，${name}记得当时接赏的情形。`:`${name}取出尚衣局做的香囊，把系带绕在指间。`;
 return lead+'“'+(LADY_GIFT_VOICES[p.trait]||'那天匆忙，今儿才好细说。')+'”';
}
A.hearRemembrance=function(id,kind,child){
 const p=child?kidById(id):byId(id),m=p?.palaceRemembrances?.[kind];
 const valid=()=>UI.view===(child?'kid':'consort')&&Number(UI.sel)===id&&canHearRemembrance(p,m)&&p.palaceRemembrances[kind]===m;
 if(modalOpen||!valid())return;
 const partner=child?byId(p.foster||p.mom):(m.taste==='disliked'?[]:harem()).filter(o=>o!==p&&workshopPresent(o)&&sisterVigilBond(p,o)==='close').sort((a,b)=>relGet(p,b)-relGet(p,a))[0];
 const together=()=>valid()&&partner&&workshopPresent(partner)&&(child?familyVisitAllowed(p,partner)&&partner.id===(p.foster||p.mom):sisterVigilBond(p,partner)==='close');
 let words=remembranceWords(p,kind,m.item);
 if(kind==='gift'&&m.taste==='disliked')words=fullName(p)+'说起上次的'+m.item+'：“那日照礼谢了恩。今日您肯再问，我才敢说，这一样我实在用不惯。”';
 else if(kind==='gift'&&m.taste==='liked')words+=' 她又补了一句：“这回挑的，确是我自己喜欢的。”';
 const pattern=kind==='wardrobe'&&m.item==='香囊'&&SACHET_PATTERNS[storyQueenKey(p)];
 function finish(invite){
   if(!valid()||invite&&!together())return null;
   m.ended=S.turn;
   const name=child?kidName(p):fullName(p);
   const result=invite?(child?`${fullName(partner)}挨着${name}坐下。她想知道的，正是上回分别后这孩子自己做过的那一点事。`:
     `${fullName(partner)}应邀坐下，听${name}把当日来不及细说的话说完。两人约好，往后有话也这样当面讲。`):
     child&&kidAge(p)<3?'你坐到乳母身边，等孩子自己松开手才轻轻起身。':'你多坐了一会儿，让这件小事只留在你们之间。';
   if(invite){relAdd(p,partner,3);m.listener=partner.id;}
   if(child)p.love=clamp(p.love+2);else cchg(p,{mood:3,aff:invite?1:2});
   const cast=invite?[p,partner]:[p],title='再谈'+m.item;
   livedRecord(cast,'family',title,'remembrance:'+S.gen+':'+p.id+':'+kind+':'+m.turn,words+result,
     [child&&kidAge(p)<3?'摸着熟悉的衣领，在大人身边安定下来。':invite?'上回匆匆过去的小事，今天终于说给想说的人听了。':'有人肯留心这点小事，我很欢喜。',invite?'记住了'+name+'自己留意的地方。':'']);
   return result;
 }
 pushEv({title:'再谈'+m.item,por:p,text:words,valid,choices:[
   {t:child&&kidAge(p)<3?'坐下陪一会儿':'留下单独听完',f:()=>finish(false)},
   ...(pattern&&!p.personalLife?.works?.some(w=>w.id===`sachet-${S.gen}-${p.id}`)?[{t:'陪她留一页《'+pattern[0]+'》 · 精力−1',cond:()=>valid()&&E().energy>0,f:()=>valid()?makeSachetPattern(p,m,pattern):null}]:[]),
   ...(together()?[{t:'请'+fullName(partner)+'一道坐坐',cond:together,f:()=>finish(true)}]:[]),{t:'改日再来看'}]});
};

const SACHET_PATTERNS={
 gouyi:['宽袢开合图','用一只手也能揭开的宽袢，末页还画着怎样把结藏在里侧。','照着宽袢图，把常用囊袋改得一只手就能打开。'],
 qingyi:['折笺入囊式','信纸依着旧折痕再折一次，写字的那面便不磨外层。','把一封珍重的家书依旧法折好收起。'],
 luwan:['马上束囊图','容易钩住衣带的银穗被画了个叉，旁边添了贴身的短绳。','动身前重新系过行囊，剪去了会绊手的长穗。'],
 ayimu:['白泉双语针样','白泉话的针法旁写着中原读音，是她自己念一句、记一句的。','循着双语针样，边练那几个白泉音节边收好最后一针。'],
 chuwan:['里衬落款小样','原来的姓名留在内侧，后补的一针另起一行，谁也盖不掉谁。','翻着里衬小样，在自己的物件里面端端正正署了名。'],
 suheng:['两味盲评香单','两份香样先编字号，价格折在纸背，闻过再揭开。','蒙住香样的价签试了一回，才发现自己偏爱价低的那一味。'],
 xiaoman:['一枚铜钱的手法','一只空囊也能练。图上标出翻腕的那一刻，叫学的人看得清楚。','把空囊翻了两次，终于将铜钱稳稳接在掌心。'],
 hongjian:['窄笺试墨谱','同一句字分写在三种笺纸上，洇墨的那张也贴在了册里。','照着笺谱试墨，将容易洇湿的纸从要紧的书信里换了出来。']
};
function makeSachetPattern(p,m,pattern){
 const work={id:`sachet-${S.gen}-${p.id}`,title:pattern[0],hobby:'刺绣',kind:'craft',gen:S.gen,date:dateStr(),turn:S.turn,
   authors:[{id:p.id,name:fullName(p)}],mode:'private',source:'上回亲手用过的尚衣局香囊',grownEcho:pattern[2]};
 const works=lifeState(p).works;if(works.some(w=>w.id===work.id)||!useE())return null;
 works.push(work);m.ended=S.turn;
 const text=fullName(p)+'亲手留下一页《'+work.title+'》。'+pattern[1];
 lifeRecord([p],'craft',work.title,text,work.source);return text;
}
function packChildKeepsake(k){
 if(!palaceDetailsActive()||k.estateKeepsake)return;
 const piece=k.keepsakes?.at(-1),order=k.palaceRemembrances?.wardrobe;
 if(!piece&&!order)return;
 const item=piece?'《'+piece.title+'》':order.item;
 k.estateKeepsake={turn:S.turn,item};
 const text=piece?k.name+'收拾开府的行李时，将'+piece.fromName+'当年亲手交给自己的'+item+'搁在随身的一箱里。':
   k.name+'开府收拾行李，在箱底翻到幼时尚衣局做的'+item+'，吩咐照旧带走。';
 kstory(k,'【开府行箧】'+text);
 const giver=piece&&byId(piece.from);
 if(inPalace(giver))story(giver,'【开府行箧】'+k.name+'从府里报来平安，信末还提了一句：“您给我的'+item+'，我带来了。”');
}
function rememberBanquetFriends(tables,label){
 if(!palaceDetailsActive())return '';
 for(const table of tables)for(let i=1;i<table.length;i++){
   const a=table[i-1],b=table[i];if(a.sex||b.sex)continue;
   const tie=a.oldCourtFriend?.id===b.id?a.oldCourtFriend:b.oldCourtFriend?.id===a.id?b.oldCourtFriend:null;
   if(!tie?.memory||[a,b].some(c=>c.lastOldFriendTable!=null&&S.turn-c.lastOldFriendTable<12))continue;
   a.lastOldFriendTable=b.lastOldFriendTable=S.turn;
   const tense=sisterVigilBond(a,b)==='tense';
   const fact=fullName(a)+'与'+fullName(b)+'今日邻座'+label+'。两人记得'+tie.memory+'。'+(tense?'递盏时彼此点了点头，那件旧事终究谁也没有提。':'一人只说了开头，另一人就把旧事的下半句接了过去。');
   livedRecord([a,b],'bond','席边认旧人','table-friends:'+S.gen+':'+rk(a,b),fact,tense?['还记得从前，今日只想守礼。','我也认出了那眼神，便没有追问。']:['有些话只有老相识一听就懂。','她竟还记得那件小事，倒叫我又笑了一回。']);
   if(!tense)relAdd(a,b,2);
   return fact;
 }
 return '';
}
