/* A rescued woman keeps her own name, choices and verifiable family clues. */
WOUNDS.exile='曾被人骗离故乡，路引被扣，辗转来到异地。获救以后，她仍需要时间重新相信自己能够作主。';
WISHES.rescueLetter={t:'想把自己的旧名寄回远方',btn:'请译者陪她整理家书',f:c=>{if(!c.rescue)return '她仍在整理想说的话。';c.rescue.trust=clamp(c.rescue.trust+5);return '译者陪她记下旧名与家中线索，尚未核实的地址仍留空；后续可在「人生长卷」继续寻亲。';}};
function marketRescueEvent(){
 if(S.flags.marketRescueSeen||S.over)return null;
 const g=makeGirl({sur:'阿',given:'依娜',age:21,trait:'沉静',fam:{t:'西域流寓',p:5}});
 delete g.solitary;g.rescuedGuest=true;g.palace='宫中客舍';g.hp=65;g.aff=35;g.enteredAt=S.turn;g.wound='exile';g.wish='rescueLetter';g.t2='念旧';g.like='字画';g.hate='兵器';g.mem=[];
 g.rescue={at:S.turn,trust:20,lastTalk:-99,oldName:'依娜',motherName:'萨依拉',clues:['河湾旁的织坊','蓝白相间的六瓣织纹'],familyContact:'unknown'};
 let rescued=false,settled=false;
 const valid=()=>!S.flags.marketRescueSeen&&!rescued;
 return {title:'集市异乡人',por:g,valid,text:`集市旁，一名商贩正扣着${g.age}岁的异乡女子讨价。她用断续的汉话说自己被骗离乡，想请人捎一封信，却被推回门后。随从查到她的路引被扣，人贩手中并无合法雇契。`,choices:[
  {t:'救下她，交官府查办贩卖者',f:()=>{
   if(!valid())return null;rescued=true;S.flags.marketRescueSeen={turn:S.turn,name:fullName(g)};log(`微服集市救下被贩卖的${fullName(g)}，命官府追查路引与贩卖者。`,1);
   story(g,'【集市获救】被骗离乡、路引被扣，辗转来到异地后被陛下救下。获还自由，她既感激又惊惶，在陌生地方还不知道能够依靠谁。');
   pushNow({title:'获救之后',por:g,valid:()=>rescued&&!settled,text:'她裹着送来的披衣，仍不敢离救她的人太远。“我不知道这里还有谁可以信。”你说明她已经自由，不必以任何身份报答。她说若有安全住处，愿先留下养好身体。',choices:[
    {t:'资助路费，安排可靠女眷护送 · 国库−20',cond:()=>E().treasury>=20,f:()=>{if(settled||E().treasury<20)return null;settled=true;chg({treasury:-20});S.flags.marketRescueSeen.outcome='护送离开';log(`${fullName(g)}自愿随护送者离开，留下谢意，未入宫籍。`,1);return '她道了谢，带着自己的路引离开。官府继续追查贩卖案，她的自由不以入宫为条件。';}},
    {t:'按她的意愿，安置在宫中客舍',f:()=>{if(settled)return null;settled=true;(S.shelteredGuests||=[]).push(g);story(g,'获救后自愿在宫中客舍暂住，尚未入妃嫔名册。');return '女官与译者安排了起居。她暂不入妃嫔名册；在「出巡」页可以探问近况、帮助寻亲，或资助她离开。';}},
    {t:'请官府女眷提供住处，由她自行去留',f:()=>{if(settled)return null;settled=true;S.flags.marketRescueSeen.outcome='城中安置';return '她在城中获得住处和自己的路引，不必入宫，也不必立刻踏上陌生的归途。';}}]});return null;
  }},{t:'交随行官员解救安置，继续巡访',f:()=>{if(!valid())return null;S.flags.marketRescueSeen={turn:S.turn,name:fullName(g),outcome:'官府安置'};log('命随行官员解救被贩卖的异乡女子，安排女眷照护并追查贩卖者。');return '随行官员接手查办，她被送往安全住处。';}}]};
}
function rescueVoice(c){
 const r=c?.rescue;if(!r)return null;
 return voiceLine('rescued-home',r.familyContact==='confirmed'?'她把远方的回信仔细收好。':journalContentVersion()>=96&&c.palaceSpeech?.stage===3?'她用中原话说起故乡，遇到家人才用的小名，仍按原来的读音念。':'她说汉话仍有不熟的地方，却已愿意慢慢说完。',r.familyContact==='confirmed'?'知道远处还有人记得我，心里终于不只剩这里的一扇门。陛下救我的情分，我仍记着。':r.trust<50?'刚来时，我连要找谁问路都不知道。您肯听我说，我就安心些。':'从前我只敢等您来，怕旁人一句话就把我送走。如今我想学会自己写信，也想请您帮我找找家人。');
}
function rescuedGuestEvent(g){
 if(!g||!g.rescuedGuest||!inPalace(g)||!S.shelteredGuests?.includes(g))return null;
 const r=g.rescue,valid=()=>S.shelteredGuests?.includes(g)&&g.rescuedGuest&&!g.gone;
 const release=()=>{if(!valid()||E().treasury<20)return null;chg({treasury:-20});g.gone=true;story(g,r.familyContact==='confirmed'?'按自己的心愿循已核实的信路归乡。':'带着路引与资助，自行选择往后的住处。');log(`${fullName(g)}自愿离开客舍，已安排护送。`,1);return '她带走自己的信笺与路引，谢过这些日子的照料，按自己的心愿启程。';};
 return {title:'客舍近况',por:g,valid,text:rescueVoice(g).lines.join('\n'),choices:[
  {t:'陪她学着写一封信 · 精力−1',cond:()=>E().energy>0&&S.turn-r.lastTalk>=2,why:'每两个月可陪她写一次',f:()=>{if(!valid()||S.turn-r.lastTalk<2||!useE())return null;r.lastTalk=S.turn;r.trust=clamp(r.trust+15);g.aff=clamp(g.aff+5);story(g,'有人陪她核对读音、学写自己的名字，不以亲近换取照料。');return '她慢慢写下自己的旧名，也问起如何独自找到译者。依赖还在，却开始有了自己能做的事。';}},
  ...(r.trust>=50&&S.turn-r.at>=6&&rankCount(1)<RANK_CAP[1]?[{t:'她愿留下相伴，依礼册为答应',f:()=>{if(!valid()||r.trust<50||rankCount(1)>=RANK_CAP[1])return null;S.shelteredGuests=S.shelteredGuests.filter(x=>x!==g);delete g.rescuedGuest;addConsort(g,1,'客舍相处后，自愿留下相伴');return '她已经听明白去留和身份的区别，愿意入宫相伴。寻亲的信路仍可继续，不因册封截断。';}}]:[]),
  {t:r.familyContact==='confirmed'?'按她心愿护送归乡 · 国库−20':'资助她自由离开 · 国库−20',cond:()=>E().treasury>=20,f:release},{t:'让她歇息'}]};
}
A.rescuedGuest=function(id){if(modalOpen)return;const ev=rescuedGuestEvent((S.shelteredGuests||[]).find(g=>g.id===id));if(ev)pushEv(ev);};
A.rescuedReturn=function(id){const c=byId(id);if(modalOpen||!inPalace(c)||c.rescue?.familyContact!=='confirmed')return;pushEv({title:'归信之后',por:c,text:'她已核实远方亲人的回信，提出归乡相见的心愿。若准她离宫，她会带走信笺与路引，这段宫中身份也随之结束。',choices:[{t:'尊重她的心愿，安排归乡 · 国库−20',cond:()=>E().treasury>=20&&!c.preg,f:()=>{if(!inPalace(c)||E().treasury<20||c.preg)return null;chg({treasury:-20});c.gone=true;story(c,'寻亲后自愿离宫归乡，陛下安排了护送。');log(`${fullName(c)}循已核实的家书归乡。`,1);return '她带着家书离宫。昔日相救与相伴仍保留在彼此纪事里。';}},{t:'先继续通信，改日再议'}]});};
function rescuedGuestsPanel(){return (S.shelteredGuests||[]).filter(g=>!g.gone).map(g=>`<section class="personal-experience"><h3>宫中客舍 · ${esc(fullName(g))}</h3><p>成年异乡来客 · 自愿暂住，尚未册封</p><p>${esc(rescueVoice(g).lines[0])}</p><button class="btn jade" data-onclick="A.rescuedGuest(${g.id})">探问近况与去留</button><h3>人物纪事</h3>${detailStory(g)}${journeyPanel(g)}</section>`).join('');}

/* Prejudice belongs to actors and institutions; it is not a truth about origins. */
const outsiderConsort=c=>!!c.rescue||['西域贡女','西域流寓','东瀛贵族','海西贵族'].includes(c.fam.t);
function originAttitude(a,b){
 if(a===b||!inPalace(a)||!inPalace(b))return null;
 const outsider=outsiderConsort(b),gap=a.fam.p-b.fam.p;
 if(!outsider&&!(a.fam.p>=60&&gap>=35))return null;
 if(isSolitary(a)||['温婉','持重','淡泊','爽直','好学'].includes(a.trait))return 'reserved';
 if(['骄纵','骄矜','善妒'].includes(a.trait))return 'mock';
 if(a.trait==='城府'||a.scheme>=75)return 'rules';
 return 'distant';
}
function originPressureEvent(){
 const pace=S.flags.originPressure||={last:-99,people:{}};
 if(S.turn-pace.last<12)return null;
 const candidates=harem().filter(c=>(c.fam.p<=20||outsiderConsort(c))&&S.turn-(pace.people[c.id]??-99)>=24);
 if(!candidates.length)return null;const target=pick(candidates),actor=harem().find(a=>['mock','rules'].includes(originAttitude(a,target)));
 const foreign=outsiderConsort(target),tone=actor&&originAttitude(actor,target);
 const witness=harem().find(a=>a!==target&&a!==actor&&originAttitude(a,target)==='reserved');
 const text=actor?tone==='mock'?`${cName(actor)}当面挑剔${cName(target)}${foreign?'的口音与衣饰，说她不懂宫里的体面':'的出身，说小门小户终究学不会世家的规矩'}。`:`${cName(actor)}以旧例为由，将${cName(target)}应有的席次挪后，又故意不把礼仪安排说全。`:`宫人见${cName(target)}${foreign?'来自异乡、在此没有亲族':'娘家无势、眼下也不受宠'}，送来的衣料与册上不符，还推说是她不懂旧例。`;
 let done=false;const valid=()=>!done&&inPalace(target)&&(!actor||inPalace(actor))&&(!witness||inPalace(witness));
 const response=mode=>{if(!valid())return null;done=true;
  const result=text+(mode==='fair'?`陛下查明份例与当事人的做法，要求依身份与实际行事相待，不许以出身、口音夺去应有待遇。${cName(target)}记得这次是非被说清。`:
   mode==='gift'?`陛下另赏${cName(target)}衣料，暂解眼前的窘迫，却未追问原来的份例为何被扣。`:`陛下默认了这次怠慢。${cName(target)}没有再当众辩解，此后对在场的人多了戒心。`);
  cchg(target,{aff:mode==='fair'?7:mode==='gift'?2:-7,mood:mode==='fair'?6:mode==='gift'?2:-9});
  if(actor)relAdd(target,actor,mode==='fair'?-3:-10);if(witness&&mode==='fair')relAdd(target,witness,3);
  if(target.rescue)target.rescue.trust=clamp(target.rescue.trust+(mode==='fair'?8:mode==='gift'?2:-8));
  story(target,result);if(actor)story(actor,`与${fullName(target)}之间的门第争执：${result}`);
  if(witness)story(witness,`【门第争执中的公道话】见${fullName(target)}受到怠慢，自己虽未与她亲近，仍说明礼数不能只凭来处改换。${result}`);
  NPCMemory.record(S,{type:'origin-prejudice',time:S.turn,participants:[target.id,...(actor?[actor.id]:[])],outcome:result},[{person:target.id,subject:'emperor',interpretation:result,emotion:mode==='ignore'?-.8:.5,impact:80}]);return result;
 };
 return {title:foreign?'异乡与宫规':'门第与份例',por:target,present:[target,...(actor?[actor]:[]),...(witness?[witness]:[])],valid,text:text+(witness?`\n${cName(witness)}虽未与她亲近，仍说：“礼数自有定例，不能只凭来处改换。”`:'')+'\n她来问的是事情能否论清，不只是再得一份赏赐。',onQueue:()=>{pace.last=S.turn;pace.people[target.id]=S.turn;},choices:[{t:'查清并纠正待遇，不以出身定是非',f:()=>response('fair')},{t:'另赏衣料安抚，不追究旧例',f:()=>response('gift')},{t:'让她自行适应',f:()=>response('ignore')}]};
}
HAREM.push(originPressureEvent);
