/* Keep identities, families and portraits when the point of view changes reign. */
const ROYAL_KIN_PER_REIGN=10;
function dowagerCourtMembers(){
  const f=S?.flags;
  return f?[f.dowager,f.birthDowager,...(f.seniorDowagers||[])].filter(Boolean):[];
}
function dowagerResidence(d){
  if(d===S.flags.birthDowager)return '慈宁宫西殿';
  return d===S.flags.dowager&&S.flags.birthDowager?'慈宁宫东殿':'慈宁宫';
}
A.greetBirthDowager=function(){
  const d=S.flags.birthDowager;
  if(!d?.alive||modalOpen||S.over||!useE())return;
  const seen=d.conversations?.topics?.['own-room']!=null;
  const ev=seen?dowagerEverydayEvent(d):trackDowagerTalk(d,{
    title:'西殿初叙',por:dowagerPerson(d),text:`${d.name}让人把窗下的椅子挪近些：“你小时候怕打雷，总找个由头来问我一句话。如今有了自己的朝廷，还肯走到西殿来，哀家也能听听你近来的日子。”`,
    choices:[{t:'在生母身边坐坐，听她说往事',f:()=> '你在她窗下坐了许久。她说起几桩旁人早已忘了的小时候的事，临走还嘱你得空再来。'}]
  },'own-room');
  if(!ev)return;
  const title=ev.title.replace(/^慈宁宫 · /,'');
  pushEv({...ev,title:`${dowagerResidence(d)} · ${title}`,choices:ev.choices.map(choice=>({...choice,f:()=>{
    const line=choice.f?.();
    if(line)dowagerRecord(d,title,line);
    return line;
  }}))});
};
function dowagerAge(d,turn=d.mourning?.turn??S.turn){
  return Number.isFinite(d.age)?d.age+Math.max(0,Math.floor((turn-(d.atTurn??0))/12)):null;
}
function rememberDowagerAge(d){
  if(!Number.isFinite(d.age)){d.age=E().age+19+voiceHash('dowager-age:'+String(d.seed||d.sur||d.name))%8;d.atTurn=S.turn;}
}
function retainSeniorDowagers(){
  const previous=[S.flags.dowager,S.flags.birthDowager].filter(d=>d?.alive);
  if(!previous.length)return;
  const senior=S.flags.seniorDowagers||=[];
  for(const d of previous){
    rememberDowagerAge(d);
    d.portrait||=dowagerPerson(d);
    d.memoryId??=d.personId??'dowager-'+S.gen;
    d.name=(d.sur||'')+'太皇太后';
    d.relation='先帝母后 · 祖母辈';
    d.seniorSince=S.gen+1;
    if(d.lastYears?.caregiver!=null){d.lastYears.caregiver=null;d.lastYears.careAssigned=false;}
    senior.push(d);
    dowagerRecord(d,'晋尊太皇太后','新帝即位，她以祖母辈长者受尊为太皇太后，仍居慈宁宫。');
  }
}
function seniorDowagerAccessionLine(){
  return (S.flags.seniorDowagers||[]).filter(d=>d.alive&&d.seniorSince===S.gen)
    .map(d=>`${d.fullName||'先帝的母后'}受尊为${d.name}，仍居慈宁宫。`).join('');
}
A.greetSeniorDowager=function(index){
  const d=(S.flags.seniorDowagers||[])[index];
  if(modalOpen||S.over||mourningActive()||!d?.alive||!useE())return;
  const ill=dowagerIll(d);
  pushEv({title:'慈宁宫 · '+d.name,por:dowagerPerson(d),valid:()=>d.alive&&!S.over,
    text:ill?'她靠在软枕上，听见你来，仍让宫人给你搬了张靠近些的凳子。':
      '她仍用从前那只茶盏，见你进门先问近来睡得好不好。说到先帝从前来请安，也常是这个时辰，她把茶盖合上，停了片刻。',
    choices:[{t:ill?'陪她在榻边坐一会儿':'坐下听她说说先朝的家常',f:()=>{
      d.mood=clamp((d.mood??65)+4);
      const line=ill?'你陪她在榻边坐了一会儿。她说，听见晚辈的声音，便觉得屋里没有那么静。':'她讲起先帝小时候来请安，背熟了礼词却忘了带帽子。说完自己先笑了，叫你今天多坐一会儿。';
      dowagerRecord(d,'慈宁宫问安',line);return line;
    }}]});
};
function dowagerPerson(d){
  // Rendering must never overwrite a predecessor's saved appearance or roll RNG.
  let portrait=d?.portrait;
  if(!portrait&&d?.personId!=null){
    const previous=(S?.retainedFamilies||[]).find(c=>c.id===d.personId)||
      [...(S?.previousCourts||[])].reverse().flatMap(court=>court.consorts||[]).find(c=>c.id===d.personId)||
      (S?.consorts||[]).find(c=>c.id===d.personId);
    if(previous)portrait={...previous,portraitOverride:portraitCell(previous),rank:8};
  }
  if(!portrait){
    const seed=Number.isFinite(d?.seed)?d.seed:Number.isFinite(S?.emp?.seed)?S.emp.seed:91;
    const explicit=d?.portraitOverride??d?.artPortrait;
    const inherited=d?.personId!=null||(S?.gen||1)>1;
    portrait={isMom:true,seed,portraitOverride:Number.isInteger(explicit)&&explicit>=0&&explicit<PORTRAIT_COUNT?explicit:
      inherited?9:DOWAGER_PORTRAITS[(seed>>>0)%DOWAGER_PORTRAITS.length]};
  }
  return {...portrait,dowagerName:d?.name||'太后',alive:!!d?.alive};
}
// Older courts kept dated admissions and promotions in each woman's own chronicle.
function consortAdmission(c){
  return c?.story?.find(e=>/，封为[^，。]+，赐居/.test(e.t)||/^潜邸.*新帝登基，册为/.test(e.t));
}
function recordedConsortRanks(c){
  if(!c)return [];
  const ranks=[...(c.courtRanks||[])];
  if(!ranks.length){
    const titles=[...RANKS].reverse();
    for(const entry of c.story||[]){
      const text=entry.t||'';
      const match=text.match(/(?:，封为|新帝登基，册为|^晋封为|^蒙恩晋为|^诊出喜脉，晋为|被降为|废去后位，降为|出冷宫，复为)([^，。]+)/);
      const rank=text.startsWith('钦天监择吉日，行册后大典')?8:match?RANKS.indexOf(titles.find(t=>match[1].endsWith(t))):-1;
      if(rank>=0&&rank!==ranks.at(-1))ranks.push(rank);
    }
  }
  if(RANKS[c.rank]&&c.rank!==ranks.at(-1))ranks.push(c.rank);
  return ranks;
}
function trackConsortRanks(previous){
  if(journalContentVersion()<86||!previous||previous.gen!==S.gen)return;
  const old=new Map(previous.consorts.map(c=>[c.id,c]));
  for(const c of S.consorts){
    const before=old.get(c.id);
    if(before&&!c.maid&&RANKS[c.rank]&&(before.rank!==c.rank||before.maid)){
      c.courtRanks=before.maid?[]:recordedConsortRanks(before);
      if(c.courtRanks.at(-1)!==c.rank)c.courtRanks.push(c.rank);
    }
  }
}
function dowagerChildren(id,children){
  const counts={sons:0,daughters:0,fostered:0};
  for(const k of children){
    if(k.mom===id){if(k.sex==='m')counts.sons++;else if(k.sex==='f')counts.daughters++;}
    else if(k.foster===id)counts.fostered++;
  }
  return counts;
}
function makeDowager(c,relation){
  return {name:c?`${c.sur}太后`:'太后',fullName:c?fullName(c):'',personId:c?.id,relation,
    ...(c&&journalContentVersion()>=86?{childrenSummary:dowagerChildren(c.id,S.children)}:{}),
    age:c?.age,atTurn:S.turn,portrait:c?{...JSON.parse(JSON.stringify(c)),portraitOverride:portraitCell(c),rank:8}:undefined,
    sur:c?.sur,fam:c?{...c.fam}:undefined,clan:c?clanKey(c):undefined,lastOffer:null,cooldown:24,
    alive:!!(c?.alive&&!c.gone&&!c.cold)};
}
function inheritDowager(h){
  retainAccessionFamilies(h);
  const past=archivePastLives();
  for(const id of [h.mom,empress()?.id])if(id!=null&&!past.excluded.includes(id))past.excluded.push(id);
  const mother=byId(h.mom),queen=empress();
  const main=queen||mother;
  if(PalaceActions.longLivedDowagers)retainSeniorDowagers();
  S.flags.dowager=makeDowager(main,main?.id===h.mom?'生母 · 先帝皇后':queen?'嫡母 · 先帝皇后':'生母');
  if(!queen&&main)S.flags.dowager.relation='生母';
  S.flags.birthDowager=mother&&mother.id!==main?.id?makeDowager(mother,'生母 · 尊为皇太后'):null;
  S.previousCourts ||= [];
  S.previousCourts.push({gen:S.gen,turn:S.turn,emperor:{...E()},consorts:JSON.parse(JSON.stringify(S.consorts))});
  if(S.previousCourts.length>5)S.previousCourts.shift();
  const rosterEnabled=journalContentVersion()>=45;
  const relatives=S.children.filter(k=>k.id!==h.id).map(k=>{
    const elder=rosterEnabled?royalBirthOrder(k,h)<0:k.born<=h.born;
    return {...k,reign:S.gen,kinship:k.princeSpouseOrigin?'宗室寄养':k.sex==='m'?(elder?'皇兄':'皇弟'):(elder?'皇姐':'皇妹')};
  });
  S.royalRelatives=[...new Map([...(S.royalRelatives||[]),...relatives].map(k=>[k.id,k])).values()];
  if(rosterEnabled)(S.royalKinRoster||={})[S.gen]=royalKinCandidates(relatives).slice(0,ROYAL_KIN_PER_REIGN).map(k=>k.id);
}
function inheritHousehold(h,queen){
  const household=h.household;if(!household||!queen)return;
  const adopted=princeAdoptionActive()?household.children.filter(c=>c.princeAdoption):[];
  if(adopted.length)(S.princeAdoptionOrigins||=[]).push({...h,away:false,princeEstate:undefined,princeAdoptionOrigin:true,household:{...household,children:adopted}});
  const mothers=new Map([[h.spouse.id,queen]]);
  for(const partner of household.concubines||[]){
    if(partner.alive===false||!partner.appearance)continue;
    const c=JSON.parse(JSON.stringify(partner.appearance));c.age=kidAge(partner);c.alive=true;
    addConsort(c,3,'潜邸旧人，随新帝入宫');if(journalContentVersion()>=85)c.accessionArrival={gen:S.gen,started:S.turn};mothers.set(partner.id,c);
  }
  for(const child of household.children||[]){
    if(princeAdoptionActive()&&child.princeAdoption)continue;
    const mother=mothers.get(child.mother)||queen;
    const k=makeKid(mother,child.sex,child.given||child.name);
    for(const field of ['born','seed','portraitVariant','lit','mar','vir','hp','amb','alive'])if(child[field]!==undefined)k[field]=child[field];
    k.story=[{d:dateStr(),t:`原在潜邸长成，随父皇登基入宫。生母${fullName(mother)}。`}];
  }
  for(const pregnancy of household.pregnancies||[]){
    const mother=mothers.get(pregnancy.mother);if(mother?.alive)mother.preg=Math.max(1,Math.min(9,S.turn-pregnancy.conceived+1));
  }
  S.ys={c:0,b:0,n:0};
}
function archivedAdmissionDate(c,court){
  if(!Number.isInteger(c?.enteredAt)||!court?.emperor?.era)return '';
  const start=court.gen===1?0:S.previousCourts.find(p=>p.gen===court.gen-1)?.turn;
  if(start==null||c.enteredAt<start||c.enteredAt>court.turn)return '';
  const month=court.gen===1?3:1+((S.month-1-(S.turn-start)%12+12)%12);
  const elapsed=month-1+c.enteredAt-start;
  return dateStr({emp:court.emperor,year:1+Math.floor(elapsed/12),month:elapsed%12+1});
}
function dowagerBiography(d){
  const opening=(S.gen===1||d.seniorSince!=null)&&d.personId==null;
  if(!opening&&d.personId==null)return '';
  const court=d.personId!=null&&S.previousCourts?.findLast(court=>(court.consorts||[]).some(c=>c.id===d.personId));
  const archived=court?.consorts?.find(c=>c.id===d.personId)||S.retainedFamilies?.find(c=>c.id===d.personId);
  // The display portrait is always dressed as an empress, even for a former concubine.
  const c=archived||(d.portrait&&{...d.portrait,rank:undefined});
  const [surname,origin]=(d.clan||c?.clan||'').split('|');
  const sur=d.sur||c?.sur||surname,house=origin||d.fam?.t||c?.fam?.t;
  const lines=[];
  if(sur){
    let family='出自'+sur+'氏';
    if(house&&house!=='太后母家')family+='（'+house+'）';
    else if(opening)family+='，母家是京中旧族，家中设有族塾';
    if(!opening&&c?.house?.father?.name)family+='，父亲名'+c.house.father.name;
    lines.push(family+'。');
  }
  if(opening){
    const niece=d.natalBrotherId!=null&&S.consorts.find(c=>c.house?.father?.id===d.natalBrotherId&&c.dowagerKin?.relation==='侄女');
    lines.push(niece?'母家的侄女'+fullName(niece)+'也进了宫。她仍按家里的旧习，收着侄女从潜邸带来的家书。':
      ['她在母家跟着长辈认字，出阁时带进宫的那册家训，至今还放在慈宁宫案头。','在家时，每逢岁末都由她替长辈誊写家信。入宫多年，她看见旧信封，仍认得娘家的字。','她记得母家庭院里有一株老梅。初入宫的那个冬日，家里捎来的头一封信里就夹着梅花。'][(d.sur||'').charCodeAt(0)%3]||'她至今还收着入宫时从母家带来的家书。');
  }else if(d.personId!=null){
    const admission=consortAdmission(c),entered=admission?.d||archivedAdmissionDate(c,court);
    if(entered)lines.push(entered+(/潜邸/.test(admission?.t)?'自潜邸随驾入宫。':/选秀/.test(admission?.t)?'经选秀入宫。':'入宫受封。'));
    const ranks=recordedConsortRanks(c);
    if(ranks.length){
      const trail=ranks.slice(1).map((r,i)=>(r>ranks[i]?'晋为':'降为')+RANKS[r]);
      lines.push('前朝曾为'+[RANKS[ranks[0]],...trail].join('，')+'。');
    }
    let children=d.childrenSummary;
    if(!children&&Array.isArray(S.royalRelatives)){
      // The old kin roster excludes the heir who succeeded, but retains deceased siblings.
      children=dowagerChildren(d.personId,S.royalRelatives.filter(k=>k.reign===S.gen-1));
      if(d.relation?.startsWith('生母'))children.sons++;
    }
    if(children)lines.push((children.sons||children.daughters?'亲生皇子'+cnNum(children.sons)+'人、公主'+cnNum(children.daughters)+'人':'膝下无亲生皇子公主')+
      (children.fostered?'，另抚养皇嗣'+cnNum(children.fostered)+'人':'')+'。');
    const milestone=c?.story?.findLast(e=>e.birthOutcome||/^【(?:初领宫务|协理六宫·|侍疾送别|母家晚辈)/.test(e.t))||c?.story?.at(-1);
    if(milestone&&milestone!==admission){
      const text=milestone.t.replace(/^【[^】]+】/,'');
      lines.push([milestone.d,text.match(/^[^。！？]*[。！？]/)?.[0]||text].filter(Boolean).join('，'));
    }
  }
  return lines.map(line=>'<p>'+esc(line)+'</p>').join('');
}
function dowagerCourtPanel(){
  const seniors=S.flags.seniorDowagers||[];
  return dowagerCourtMembers().sort((a,b)=>Number(b.seniorSince!=null)-Number(a.seniorSince!=null)).map(d=>{
    const age=dowagerAge(d),index=seniors.indexOf(d);
    const dual=!!S.flags.birthDowager,birth=d===S.flags.birthDowager;
    const call=index>=0?`A.greetSeniorDowager(${index})`:birth?'A.greetBirthDowager()':dual?'A.greet()':'';
    const action=call&&d.alive?`<button class="btn jade" onclick="${call}">给${esc(d.name)}请安<small>精力−1</small></button>`:'';
    const history=(index>=0||birth)&&d.story?.length?detailFold('人物纪事',detailStory({...d,id:d.memoryId||d.personId})):'';
    const residents=d.alive?S.children.filter(k=>raisedByDowager(k)&&upbringingDowager(k)===d&&k.princeSpouseOrigin):[];
    const children=residents.map(k=>`<button class="btn sm" onclick="A.go('kid',${k.id})">查看${esc(k.name)}</button>`).join('');
    return `<section class="detail-head dowager-court">${porImg(dowagerPerson(d),160)}<div class="grow"><h3>${esc(d.name)}</h3><p>${esc(d.fullName||'')}${d.relation?' · '+esc(d.relation):''}</p><p>${age!=null?age+'岁 · ':''}${d.alive?esc(dowagerResidence(d)):'已故'}</p>${d.portrait?.trait?`<p>${esc(d.portrait.trait)} · ${esc(TRAITS[d.portrait.trait]?.d||'')}</p>`:''}${dowagerBiography(d)}${action}${children}${history}</div></section>`;
  }).join('');
}

function royalBirthOrder(a,b){return a.born-b.born||a.id-b.id;}
function royalKinCandidates(relatives){return relatives.filter(k=>k.alive&&!k.removedFromRoyal).sort(royalBirthOrder);}
function royalKinship(k){
  if(k.princeSpouseOrigin)return '宗室寄养';
  if(k.reign===S.gen-1)return k.kinship||'宗亲';
  if(k.reign===S.gen-2){
    if(k.sex==='f')return '皇姑';
    return k.kinship==='皇兄'?'皇伯父':k.kinship==='皇弟'?'皇叔父':'宗亲';
  }
  return '宗亲';
}
function listedRoyalKin(){
  const cohorts=new Map(),current=new Set(S.children.map(k=>k.id));
  for(const k of royalHouseholds()){
    if(current.has(k.id)||k.princelySuccession||k.princeAdoptionOrigin||k.royalRegisterBranch)continue;
    if(!cohorts.has(k.reign))cohorts.set(k.reign,[]);
    cohorts.get(k.reign).push(k);
  }
  return [...cohorts].flatMap(([reign,relatives])=>{
    const eligible=royalKinCandidates(relatives),ids=S.royalKinRoster?.[reign];
    return Array.isArray(ids)?eligible.filter(k=>ids.includes(k.id)):eligible.slice(0,ROYAL_KIN_PER_REIGN);
  });
}
function royalKinOutside(k){
  if(whiteSpringInPalace(k))return false;
  if(k.jailed)return false;
  const estate=k.princeEstate||k.estate;
  return !!(royalJourneyAway(k)||k.templeStay||k.away||k.princessMarriage==='frontier'||estate?.route==='frontier'||
    (estate?.location&&estate.location!=='京城'));
}
function royalKinContactMode(k,estateContact=false){
  if(estateContact)return princeEstateAvailable(k)?k.away?'letter':'visit':'';
  if(!k?.alive||!k.reign||k.removedFromRoyal||k.pendingName||k.jailed||k.gone)return '';
  return royalKinOutside(k)?'letter':'visit';
}
function royalKinContactPlace(k,mode){
  if(journalContentVersion()>=145&&immortalAway(k)&&royalKinOutside(k))return IMMORTAL_SECTS[k.immortal.route]?.name||'山门';
  if(whiteSpringInPalace(k))return '宫中小住';
  if(k.princessMarriage==='frontier'||k.estate?.route==='frontier')return princessMarriageLand(k);
  if(k.away&&princeFief(k)&&!royalJourneyAway(k)&&!k.templeStay)return princeFief(k);
  return k.away||royalJourneyAway(k)||k.templeStay?childWhereabouts(k):k.princeEstate?.location||k.estate?.location||
    (mode==='visit'?'京城':'外地');
}
function royalKinContactReady(k){
  const contact=k.royalKinContact;
  return !S.over&&S.turn-(contact?.last??-99)>=2&&!contact?.pending&&!contact?.reply?.unread;
}
function royalKinContactButtons(k,estateContact=false){
  const mode=royalKinContactMode(k,estateContact);
  if(journalContentVersion()<47||S.over)return '';
  const pending=k.royalKinContact?.pending,unread=k.royalKinContact?.reply?.unread;
  if(!mode&&(estateContact||journalContentVersion()<145))return '';
  if(!mode&&!unread)return '<small class="hint">暂不能往来</small>';
  const id=royalActionArg(k.id),args=estateContact?`${id},true`:id;
  const button=unread?`<button class="btn sm jade" onclick="A.royalKinReply(${args})">读回信</button>`:
    `<button class="btn sm jade" onclick="A.royalKinContact(${args})" ${royalKinContactReady(k)?'':'disabled'}>${mode==='visit'?(estateContact?'到王府探望':'召见'):'寄家书'}<small>${pending?'等候回信':!royalKinContactReady(k)?'近期已经问候':'精力−1'}</small></button>`;
  return `<div class="acts"><span class="hint">${esc(k.jailed?'宗人府':royalKinContactPlace(k,mode))}</span>${button}</div>`;
}
function royalKinWords(k,topic){
  if(journalContentVersion()>=145&&immortalAway(k)&&royalKinOutside(k)){
    const place=royalKinContactPlace(k,'letter');
    if(topic==='home')return '“'+immortalVoice(k).lines.join('')+'”';
    const news={learning:'晨课散了，师父才叫我把今日学的功课写给您看。',trial:'这些日子随师在外历练，托回山的同门把信带上驿路。',sect:'门中有了我该照看的事务，山路虽远，您的家书还是照旧收得到。'};
    return place+'捎回一封信：“'+news[k.immortal.stage]+'请陛下放心。”';
  }
  const age=kidAge(k),child=princeResidentChildren(k).find(c=>c.alive!==false);
  if(age<3)return topic==='home'?'乳母说，孩子每天醒后都要寻那只熟悉的布虎。':'乳母说，孩子近来吃得好，夜里也睡得安稳。';
  if(topic==='home'&&child)return `“${child.given||child.name}近来有了新本事，一回家就拉着我看。我也想让陛下听听这些小事。”`;
  if(topic==='home'&&k.spouse?.alive!==false&&k.spouse)return `“我同${k.spouse.name}约好，再忙也留一顿饭一起用。府里近来总算有些闲话可说。”`;
  if(topic==='home')return age<10?'“我还留着从前的毽子，等下回见面，想再踢给您看。”':'“我近日翻到旧册，里头还有家里一起题的几行字。看着看着，便想起了从前。”';
  return age<10?'“这些日子我学着自己理书匣，想让您知道我也能管好自己的东西了。”':
    childDisposition(k)==='内敛'?'“起居都好。近来读得几页闲书，原想找个时候与陛下说说。”':'“近来出门走了走，起居都好。也惦记陛下案牍繁重，可还有工夫歇一歇？”';
}
function recordRoyalKinContact(k,title,text,location='御书房'){
  princessMemory(k,'royal-kin-contact',`【${title}】${text}`,location);
  log(`【${title}】${text}`);
}
A.royalKinContact=function(id,estateContact=false){
  if(modalOpen||journalContentVersion()<47)return;
  const k=estateContact?princeEstateById(id):listedRoyalKin().find(k=>k.id===id),mode=royalKinContactMode(k,estateContact);
  if(!mode||!royalKinContactReady(k))return;
  const relation=estateContact&&!k.reign?'':royalKinship(k),where=estateContact?princeEstatePlace(k):royalKinContactPlace(k,mode),visit=mode==='visit';
  const valid=()=>royalKinContactMode(k,estateContact)===mode&&royalKinContactReady(k);
  const finish=topic=>{
    if(!valid()||!useE())return null;
    const contact=k.royalKinContact||={};
    contact.last=S.turn;
    if(visit){
      const lead=estateContact?`陛下到王府看望${relation}${k.name}`:`陛下在御书房召见${relation}${k.name}`;
      const line=`${lead}，${topic==='home'?'谈起家常':'问了近况'}。${royalKinWords(k,topic)}`;
      recordRoyalKinContact(k,estateContact?'王府探望':'皇亲召见',line,estateContact?'王府':'御书房');return line;
    }
    const sender=E().sur+E().name;
    contact.pending={due:S.turn+1,sender,topic};
    if(estateContact)contact.pending.estate=true;
    const line=`${sender}遣人往${where}给${relation}${k.name}寄家书，${topic==='home'?'问候家中起居':'问候近来的平安'}。`;
    recordRoyalKinContact(k,estateContact?'寄王府家书':'寄皇亲家书',line,estateContact?where:'御书房');return '家书已寄出，预计下月有回音。';
  };
  pushEv({title:estateContact?(visit?'王府 · 到府探望':'王府家书'):visit?'御书房 · 召见皇亲':'皇亲家书',por:k,valid,
    text:visit?(estateContact?`${relation}${k.name}在厅中迎你，请你坐下用茶。`:`你打算召${relation}${k.name}来御书房，想同${k.sex==='m'?'他':'她'}说些什么？`):`${relation}${k.name}如今在${where}，你提笔写信问候。`,
    choices:[
      {t:visit?'问问近况':'写信问安',cond:()=>E().energy>0,why:'精力不足',f:()=>finish('well')},
      {t:visit?'说说家常':'写信问问家中',cond:()=>E().energy>0,why:'精力不足',f:()=>finish('home')},
      {t:'改日再说'}
    ]});
};
function royalKinContactTick(){
  if(!S||S.over||journalContentVersion()<47)return;
  for(const k of royalHouseholds()){
    const contact=k.royalKinContact,letter=contact?.pending;
    if(!letter||S.turn<letter.due)continue;
    delete contact.pending;
    const mode=royalKinContactMode(k,!!letter.estate);
    if(!mode)continue;
    const relation=letter.estate&&!k.reign?'':royalKinship(k);
    const text=`${relation}${k.name}回复${letter.sender}所寄的家书：${royalKinWords(k,letter.topic)}`;
    contact.reply={text,unread:true};
    recordRoyalKinContact(k,letter.estate?'王府回信':'皇亲回信',text,letter.estate?princeEstatePlace(k):'御书房');
  }
}
A.royalKinReply=function(id,estateContact=false){
  if(modalOpen||S.over||journalContentVersion()<47)return;
  const k=estateContact?princeEstateById(id):listedRoyalKin().find(k=>k.id===id),reply=k?.royalKinContact?.reply;
  if(!reply?.unread||((estateContact||journalContentVersion()<145)&&!royalKinContactMode(k,estateContact)))return;
  pushEv({title:estateContact?'王府回信':'皇亲回信',por:k,text:reply.text,choices:[{t:'收好回信',f:()=>{reply.unread=false;return null;}}]});
};
function royalRelativeCards(relatives){
  if(!relatives.length)return '';
  const cards=relatives.map(k=>{
    const outside=royalKinOutside(k),household=householdSummary(k);
    const mountain=outside&&immortalAway(k);
    const location=mountain?'在外修行':outside?'在外':'在京';
    const root=mountain&&(k.immortal.root||k.immortalTalent);
    return `<article class="card portrait-card"><button class="child-portrait" aria-label="查看${esc(k.name)}" onclick="A.go('relative',${k.id})">${porImg(k,84)}</button>
      <div class="grow"><button class="person-link nm" onclick="A.go('relative',${k.id})">${esc(k.name)}</button>
      <div><small>${esc(royalKinship(k))} · ${kidAge(k)}岁${k.title?' · '+esc(k.title):''}${k.spouse?' · '+esc(k.spouse.name):''}</small></div>
      <div><span class="tag">${location}</span>${root?` <span class="tag y">${esc(root)}</span>`:''}${k.royalKinContact?.reply?.unread?' <span class="tag y">有回信</span>':''}</div>
      ${household?`<span>${esc(household)}</span>`:''}${royalKinContactButtons(k)}</div></article>`;
  });
  return `<div class="grid portrait-grid">${cards.join('')}</div>`;
}
const ROYAL_KIN_FILTERS=[['all','全部'],['capital','在京'],['outside','在外'],['unread','有回信']];
A.royalKinFilter=function(key){
  if(UI.view!=='home'||!ROYAL_KIN_FILTERS.some(([id])=>id===key))return;
  UI.royalKinFilter=key;renderPanel();
  document.querySelector('#home-kin-filters [aria-pressed="true"]')?.focus?.({preventScroll:true});
};
function royalKinRosterPanel(){
  const relatives=listedRoyalKin();
  if(!relatives.length)return '<p class="hint">目前没有在册的先朝亲族。</p>';
  const lists={
    all:relatives,capital:relatives.filter(k=>!royalKinOutside(k)),outside:relatives.filter(royalKinOutside),
    unread:relatives.filter(k=>k.royalKinContact?.reply?.unread)
  };
  const key=ROYAL_KIN_FILTERS.find(([id])=>id===UI.royalKinFilter)?.[0]||'all',visible=lists[key];
  const tabs=ROYAL_KIN_FILTERS.map(([id,label])=>`<button class="btn sm ${id===key?'on':''}" aria-pressed="${id===key}" onclick="A.royalKinFilter('${id}')">${label} ${lists[id].length}</button>`).join('');
  const groups=[
    ['兄弟姐妹',visible.filter(k=>k.reign===S.gen-1)],
    ['伯叔与姑姑',visible.filter(k=>k.reign===S.gen-2)],
    ['更早世代的宗亲',visible.filter(k=>k.reign!==S.gen-1&&k.reign!==S.gen-2)]
  ];
  const cards=groups.filter(([,kin])=>kin.length).map(([title,kin])=>`<h4>${title}</h4>${royalRelativeCards(kin)}`).join('');
  const empty=key==='unread'?'暂无未读回信。':key==='capital'?'目前没有在京的皇亲。':'目前没有在外的皇亲。';
  return detailSection('先朝亲族',`<div class="acts official-filters" id="home-kin-filters" role="group" aria-label="筛选皇亲">${tabs}</div>`+(cards||`<p class="hint">${empty}</p>`));
}
function viewRoyalRelative(){
  const ruler=E().natalMarriageHeir;
  if(ruler&&ruler.id===UI.sel)return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg('emp',224)}<div class="grow"><h2>${esc(E().sur+E().name)}</h2><p>当朝天子 · ${E().age}岁</p></div></header>${royalNatalPartnerPanel(ruler)}${detailSection('人物纪事',detailStory(ruler))}`;
  const k=royalById(UI.sel);if(!k)return viewFamily();
  return `${personBackButton('family')}<header class="detail-head person-detail-head">${porImg(k,224)}<div class="grow"><h2>${esc(k.name)}</h2><p>${esc(royalKinship(k))} · ${kidAge(k)}岁</p><p>生母 ${esc(k.momName||'未记载')}</p>${princeEstateLink(k)}</div></header>${xieSharedProfilePanel(k)}${listedRoyalKin().includes(k)?royalKinContactButtons(k):''}${detailSection('亲族纪事',detailStory(k))}${immortalPanel(k)}${royalTravelPanel(k)}${marriagePanel(k)}${householdPanel(k)}${princeCirclePanel(k)}${detailSection('出使见闻',diplomaticTraitsPanel(k))}`;
}
