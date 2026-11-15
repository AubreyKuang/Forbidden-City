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
    story(c,`【姐妹入宫】${feeling.text}`);story(g,`【姐妹初见】${feeling.text}`);
    // An old rift with the newcomer is between the two of them, not a grievance against the emperor.
    if(feeling.delta<0)NPCMemory.record(S,{type:'family',time:S.turn,location:c.palace,participants:[c.id,g.id],outcome:feeling.text},
      [{person:c.id,subject:g.id,interpretation:feeling.text,emotion:-.6,impact:80}]);
    else remember(c,'family',feeling.text);
    if(feeling.delta<0&&!['悲恸','心如死灰'].includes(xinOf(c)))setXin(c,'委屈',`家中另送${fullName(g)}入宫，心中不安`);
  }
}
function sisterArrivalVoice(c){const news=c.sisterArrival,other=byId(news?.other);
  if(!news||!other?.alive||!c.alive||S.turn-news.turn>6)return null;
  return voiceLine('sister-arrival','她仍记着亲人入宫时自己的心情。',news.text);
}
