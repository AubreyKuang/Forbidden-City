/* Kinship does not erase rivalry; bereaved succession remains a separate story. */
function sisterArrivalFeeling(c,g,admission=true){
  const relation=relGet(c,g),cousin=/堂/.test(c.kin?.[g.id]||g.kin?.[c.id]||''),rival=isRival(c,g)||relation<0;
  const jealous=['善妒','骄纵','骄矜','痴情'].includes(c.trait),quiet=isSolitary(c)||c.trait==='淡泊';
  if(!admission){
    if(rival)return {kind:'guarded',delta:-2,text:`${fullName(c)}与${fullName(g)}旧交不睦，听到来访消息，只说按礼相待。`};
    return {kind:quiet?'reserved':'reunion',delta:quiet?2:6,text:`${fullName(c)}${quiet?'只叮嘱少些迎送，想留一段亲人说话的时辰':'想到能与亲人相见，开始整理要说的家中旧事'}。`};
  }
  const branch=cousin?'她们虽是同族，却分属不同父亲的家支。':'';
  if(rival)return {kind:'rival',delta:-16,text:`${branch}${fullName(c)}听说${fullName(g)}入宫，想起两人旧有的嫌隙，愈加戒备：“有亲缘，也不代表事事都能交心。”`};
  if(!quiet&&relation<55&&(jealous||cousin||c.favor<25)){
    const words=c.favor<25?'臣妾近来少见陛下，家中便另送人来。是不是他们也觉得，臣妾已经不值得等了？':
      c.favor>=65?'臣妾才有些安稳的日子，家中就又送人来。她是亲人，可这份恩宠，臣妾也会舍不得。':
      cousin?'她是堂姐妹，自有她父亲那一房的打算。臣妾怕的，是从此连家书也要处处分个彼此。':'臣妾知道她也是家人，可一想到往后要分这一份眷顾，心里还是会难受。';
    return {kind:c.favor<25?'replaced':'uneasy',delta:cousin?-18:-12,text:`${branch}${fullName(c)}没有露出喜色：“${words}”`};
  }
  if(quiet)return {kind:'reserved',delta:0,text:`${branch}${fullName(c)}按礼相迎：“各人有各人的日子。她若要问宫里的规矩，臣妾会告诉她；也请留给彼此清静。”`};
  if(relation>=55)return {kind:'welcome',delta:8,text:`${branch}${fullName(c)}记着两人原本的好交情：“往后有人能说家中旧事，自然是好。可她有她的心思，臣妾也不能替她安排一生。”`};
  return {kind:'mixed',delta:2,text:`${branch}${fullName(c)}既盼亲人作伴，也有一点难言的忐忑，只先把宫中起居的规矩说清。`};
}
function familyAdmissionReactions(g){
  if(g.sisterArrivalRecorded)return;
  g.sisterArrivalRecorded=true;
  for(const c of S.consorts){
    if(c===g||!c.alive||c.gone||!c.kin?.[g.id])continue;
    const feeling=sisterArrivalFeeling(c,g,true);if(!inPalace(c))feeling.text=feeling.text.replace('按礼相迎','从家信得知消息');relAdd(c,g,feeling.delta);cchg(c,{mood:feeling.delta});
    if(relGet(c,g)<=-25){(c.kinRival||={})[g.id]=1;(g.kinRival||={})[c.id]=1;}
    c.sisterArrival={other:g.id,turn:S.turn,kind:feeling.kind,text:feeling.text};
    if(familyScenesEnabled())sisterAdmissionChronicle(c,g,feeling);
    else{story(c,`【姐妹入宫】${feeling.text}`);story(g,`【姐妹初见】${feeling.text}`);}
    remember(c,feeling.delta<0?'hurt':'family',feeling.text);
    if(feeling.delta<0&&!['悲恸','心如死灰'].includes(xinOf(c)))setXin(c,'委屈',`家中另送${fullName(g)}入宫，心中不安`);
  }
}
function sisterThread(c,g){return `sister:${S.gen}:${c.id}:${g.id}`;}
function sisterNewcomerThought(c,g,feeling){
 if(['rival','replaced','uneasy'].includes(feeling.kind))return ['骄纵','骄矜','好胜','城府'].includes(g.trait)?'我看得出她不痛快，可我也要有自己的日子；亲缘不能让我永远退让。':'原以为有亲人在便不那么怕，如今才懂，她也有失落。我愿守分寸，却不能替她消去所有不安。';
 if(isSolitary(g)||g.trait==='淡泊')return '亲人同在宫中，也不必日日相依。我会记得旧情，仍想保留自己的清静。';
 if(feeling.kind==='reserved')return '她仍如从前寡言，肯把规矩讲明白，已是她给的照应；不必逼她在人前亲热。';
 if(feeling.kind==='welcome')return ['活泼','爽直'].includes(g.trait)?'有她在，我敢多问几句，也盼有一天能反过来帮她一回。':'有人记得宫门外的我，心里便有了着落。但往后的日子，也要自己学着走。';
 return '从来访的亲眷变成宫里的人，一切都得重新学；我想靠近她，也不愿只做她身后的影子。';
}
function natalSceneRecord(c,p,text,emotion=0){
 if(!familyScenesEnabled())return natalRecord(c,p,text,emotion);
 const age=natalAge(p),guarded=relGet(c,p)<0,title=/暂缓/.test(text)?'探亲暂缓':/明言|尚未定下/.test(text)?'留宫与归家的心意':'探亲时的相聚';
 const elder=guarded?'亲人相见仍有旧日的疙瘩，按礼接待，不代表已经释怀。':isSolitary(c)?'不想大张旗鼓，只盼留一段没人打搅的亲人时辰。':'宫里的人知道我的位分，家里的人还记得从前的我。这些寻常问候也舍不得漏听。';
 const younger=age<3?'由长辈照料，听见说话声转过头来。':age<18?'带来的小物终于能亲手交给她，宫里的规矩仍要听长辈提醒。':guarded?'她待我守礼而疏远，不能把这次见面当作旧嫌已经解开。':p.trait==='活泼'?'备了一路的话，真正相见又怕说得太多；见她肯听，才慢慢放松。':p.trait==='才女'?'那页旧书上的批注还在，想问她如今是否仍有空读。':'见到她过得怎样，比家书里一句“安好”真切得多。我也有自己的打算，想让她听见。';
 livedRecord([c,p],'family',title,sisterThread(c,p),text,[elder,younger]);
}
function sisterAdmissionChronicle(c,g,feeling){
 const visiting=g.natalOrigin?.host===c.id;
 const fact=`【姐妹入宫】${fullName(g)}${visiting?'原是入宫探亲的'+natalLabel(c,{born:S.turn-g.age*12,sex:'f'})+'，与陛下相识后自愿留下':'依亲缘入宫'}，册为${RANKS[g.rank]}，赐居${g.palace}。${fullName(c)}得知了这件事。${inPalace(c)?'从此两人既是家人，也各有宫中的身份。':'她眼下不能在宫中迎接，只收到消息，没有当面相见。'}`;
 const newcomer=sisterNewcomerThought(c,g,feeling);
 livedRecord([c,g],'family','姐妹入宫',sisterThread(c,g),fact,[feeling.text,newcomer]);
 g.sisterArrival={other:c.id,turn:S.turn,kind:feeling.kind,text:newcomer};
 if(visiting)g.sisterLife={host:c.id,gen:S.gen,started:S.turn,first:false,later:false};
}
function sisterArrivalTick(){
 if(!familyScenesEnabled())return;
 for(const g of S.consorts){const s=g.sisterLife,c=byId(s?.host);if(!s||s.gen!==S.gen||!inPalace(g)||!inPalace(c))continue;
  const age=S.turn-s.started;if(age<1||s.first&&(age<6||s.later))continue;
  const hostile=relGet(c,g)<0||isRival(c,g)||isRival(g,c),close=relGet(c,g)>=55&&!hostile,quiet=isSolitary(c)||isSolitary(g),thread=sisterThread(c,g);
  let title,text,thoughts,delta=0;
  if(!s.first){s.first=true;title='入宫后的第一封家书';
   text=`${fullName(g)}探亲留宫后，家中来信问两人的起居。${hostile?'她们分别写了回信，没有冒称在宫中亲密无间。':quiet?'两人各自写下近况，只把共同要报的平安核对一遍。':'两人把想报的平安写在一起，也各留一页说自己的日子。'}`;
   thoughts=hostile?['见到家中问候仍会心软，可对她入宫分宠的不安尚未散去。','我把新住处和起居写清，没有替她说她不愿说的话。']:quiet?['亲人有自己的分寸，能各自安好便好。','不必时时结伴，家书里仍有彼此的位置。']:['从前只等家里来信，如今在宫里也有人认得那些旧事。','这封信写的是我自己的新日子，也有她教我的一点照应。'];delta=hostile?0:2;
  }else{s.later=true;title='姐妹各有际遇';
   const favored=c.favor>=g.favor?c:g,gap=Math.abs(c.favor-g.favor)>=30;
   text=`${fullName(g)}留宫已过半年。${gap?`${fullName(favored)}近来更受眷顾，两人的际遇已有不同。`:'两人渐渐熟悉各自的起居，已不再是初来探亲时的模样。'}${hostile?'请安时仍按礼相见，私下各自离开，没有因同姓就和解。':quiet?'她们仍各有独处的习惯，见面说几句家常便各自回宫。':close?'见面时留下一碟家乡点心，把想家的话慢慢说完。':'她们谈了几句家中近况，也各自保留不愿说的心事。'}`;
   thoughts=[c,g].map(p=>hostile?'家里人不等于没有嫌隙，眼下仍想留些距离。':isSolitary(p)?'能守礼相处便好，不必把亲近演给旁人看。':gap&&p!==favored?(close?'也会眼热，但她昔日的照应并没有因此作废。':'看见差别，心里有些不是滋味；往后的亲疏还要看怎样相处。'):close?'入宫之后各有际遇，仍愿为家中旧事留一段说话的时辰。':'她不是当年只来探亲的亲眷了，也有自己的心思。');delta=hostile?-2:close&&!quiet?3:0;
  }
  relAdd(c,g,delta);livedRecord([c,g],'family',title,thread,text,thoughts);
 }
}
function sisterArrivalVoice(c){const news=c.sisterArrival,other=byId(news?.other);
  if(!news||!other?.alive||!c.alive||S.turn-news.turn>6)return null;
  return voiceLine('sister-arrival','她仍记着亲人入宫时自己的心情。',news.text);
}
