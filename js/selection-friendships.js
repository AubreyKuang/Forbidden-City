/* Candidate friendships exist before the roster is decided. Only an actual
   friendly pair with at least one retained member gets a closing conversation. */
const selectionFriendsEnabled=()=>journalContentVersion()>=12;
function plausibleOldFriendPair(a,b){return Math.abs(a.age-b.age)<=5&&Math.abs((a.upbringing?.power??a.fam.p)-(b.upbringing?.power??b.fam.p))<=20;}
const selectionFriendsClose=(a,b)=>!!a&&!!b&&a.alive!==false&&b.alive!==false&&relGet(a,b)>=30&&!isRival(a,b)&&!isRival(b,a);
function selectionPeer(s,id){return byId(id)||S.cands.find(c=>c.id===id)||(s.peerDeparted||[]).find(c=>c.id===id);}
function linkSelectionFriends(a,b,{kind='waiting',memory='候选时常坐在一起，把不熟悉的礼数互相讲清',score=36}={}){
  const s=S.selection;if(!s||a===b||!S.cands.includes(a)||!S.cands.includes(b)||isRival(a,b)||isRival(b,a))return null;
  if(journalContentVersion()>=32&&['childhood','households'].includes(kind)&&!plausibleOldFriendPair(a,b))return null;
  s.peerPairs||=[];if(s.peerPairs.some(p=>[p.a,p.b].includes(a.id)||[p.a,p.b].includes(b.id))||s.peerPairs.length>=2)return null;
  const pair={a:a.id,b:b.id,kind,memory};s.peerPairs.push(pair);
  const key=rk(a,b);if(S.rel[key]===undefined)S.rel[key]=score;
  for(const [p,o] of [[a,b],[b,a]]){
    p.kinNote=[p.kinNote,`候选交好：${fullName(o)}（${kind==='childhood'?'幼时相识':kind==='households'?'世交旧友':'候选相熟'}）`].filter(Boolean).join('；');
    story(p,`【候选旧交】与${fullName(o)}${memory}。`);
  }
  return pair;
}
function assignSelectionFriendships(){
  if(!selectionFriendsEnabled()||!S.selection||S.selection.peerInitialized)return;
  const s=S.selection;s.peerInitialized=true;
  for(let i=0;i<S.cands.length;i++)for(let j=i+1;j<S.cands.length;j++){
    if((s.peerPairs||[]).length>=2)return;
    const a=S.cands[i],b=S.cands[j];
    if((s.peerPairs||[]).some(p=>[p.a,p.b].includes(a.id)||[p.a,p.b].includes(b.id))||a.age<18||b.age<18||isRival(a,b)||isRival(b,a))continue;
    if(S.rel[rk(a,b)]!==undefined){if(selectionFriendsClose(a,b))linkSelectionFriends(a,b);continue;}
    const native=!a.timeTraveler&&!b.timeTraveler&&!a.rescue&&!b.rescue&&!/西域|东瀛|海西/.test(a.fam.t+b.fam.t);
    const household=native&&(journalContentVersion()>=32?plausibleOldFriendPair(a,b):Math.abs(a.fam.p-b.fam.p)<=30);
    const compatible=socialPair(a,b)&&consortCompatibility(a,b)>=3;
    if(!(household||compatible)||!chance(.22))continue;
    if(household&&chance(.5)){
      const childhood=Math.abs(a.age-b.age)<=8;
      linkSelectionFriends(a,b,{kind:childhood?'childhood':'households',score:42,
        memory:childhood?'幼时随长辈赴花宴便相识，两家多年交好，彼此一直通着问候':'两家多年交好，年节来往时渐渐熟悉，也常互通书信'});
    }else if(compatible){const hobby=sharedConsortHobby(a,b);linkSelectionFriends(a,b,{memory:hobby?`候选时因都喜欢${hobby}而谈得投契，等候点名时常相伴`:'候选时互相照应，听她说完家里的事后渐渐相熟'});}
  }
}
const selectionPeersGen=genCands;
genCands=function(...args){const result=selectionPeersGen.apply(this,args);assignSelectionFriendships();return result;};
function keepSelectionPeer(s,p){
  if(!(s?.peerPairs||[]).some(pair=>[pair.a,pair.b].includes(p.id)))return;
  s.peerDeparted||=[];if(!s.peerDeparted.some(x=>x.id===p.id))s.peerDeparted.push(p);
}
const selectionPeersDrop=A.xxDrop;
A.xxDrop=function(id){
  if(selectionFriendsEnabled()){const p=S.cands.find(x=>x.id===id);if(p)keepSelectionPeer(S.selection,p);}
  return selectionPeersDrop.call(this,id);
};
const selectionPeersAdmission=addConsort;
addConsort=function(c,...args){
  const prior=selectionFriendsEnabled()?(S.selection?.peerPairs||[]).filter(p=>[p.a,p.b].includes(c.id)).map(p=>{
    const o=selectionPeer(S.selection,p.a===c.id?p.b:p.a);return o?{key:rk(c,o),value:S.rel[rk(c,o)]}:null;
  }).filter(x=>x&&x.value!==undefined):[];
  const result=selectionPeersAdmission.call(this,c,...args);
  for(const {key,value} of prior)S.rel[key]=value;
  return result;
};
function selectionPeerLine(c,o,kept,otherKept){
  const quiet=isSolitary(c)||['沉静','淡泊'].includes(c.trait),jealous=TRAITS[c.trait]?.jealous;
  const bold=['活泼','爽直','将门'].includes(c.trait),careful=['聪慧','持重','城府'].includes(c.trait);
  if(kept&&otherKept){
    if(quiet)return '还好有个熟悉的人。往后各自安顿，清静时来坐一会便好。';
    if(jealous)return c.rank<o.rank?'你的位分比我高，我也会眼热。可想到是你留下，还是替你欢喜；从前的情分，我记得。':'一同留下，我心里安稳些。往后若有眼热的时候，也盼我们仍肯把话说明白。';
    if(bold)return '原来我们两个都留下了！等认清了路，我来找你，可别又笑我走错宫门。';
    if(careful)return '先把各自的住处和请安规矩记清。有不明白的，私下商量，别叫你我失了分寸。';
    if(c.trait==='才女')return '来时还一起读那页书，如今可以慢慢读完了。往后也别只记宫规，忘了自己的欢喜。';
    return '方才一直替你悬着心。幸而你也留下了，往后有难处，记得来同我说。';
  }
  if(kept){
    if(quiet)return '临别不多说了。你回家后好好过日子，今日说过的话，我会记得。';
    if(jealous)return '我的名字留下了，心里却不全是欢喜。你不必强作笑脸，我们从前的交情也不会因此作废。';
    if(bold)return '方才还说要一起认路呢……你回去替我看看城里的春色，也替自己挑一份喜欢的日子。';
    if(careful)return '出宫的车马与行李都核对好了么？往后各有日子，不必把今日的留落看作高低。';
    return '我舍不得你走，也盼你回家自在。今日替我理过衣袖的那份情，我会记得。';
  }
  if(quiet)return '我回家去了，你也安心住下。能把这一程同你走完，已经很好。';
  if(['骄纵','骄矜','好胜'].includes(c.trait))return '这回没留我的名字，我还不至于过不好自己的日子。你留下便好好站稳，我仍认你这个朋友。';
  if(jealous)return '我也会不甘，也会眼热。可落选不是你的错，今日仍想亲口道一声恭喜。';
  if(bold)return '我回家也有一大堆想做的事。你别只顾替我难过，往后还等着听你的好消息呢。';
  if(careful)return '各人的去处不同，交情不必跟着名册改。我先回家，你把宫里的日子慢慢安顿好。';
  return '你留下，我替你欢喜。只是到了宫门口，才真的舍不得；往后也要记得好好照顾自己。';
}
function selectionPeerEvent(s,pair){
  const a=selectionPeer(s,pair.a),b=selectionPeer(s,pair.b),kept=new Set(s.accepted||[]);
  const members=[a,b].filter(p=>p&&kept.has(p.id));
  if(!members.length||!selectionFriendsClose(a,b)||members.some(p=>!inPalace(p)))return null;
  const both=members.length===2,gen=S.gen,turn=S.turn;
  const valid=()=>S.gen===gen&&S.turn-turn<=1&&!pair.recorded&&selectionFriendsClose(a,b)&&members.every(inPalace);
  const title=both?'留选后的悄悄话':'宫门前的私语';
  const fact=both?`${fullName(a)}与${fullName(b)}都获留选。`:`${fullName(members[0])}获留选，${fullName(kept.has(a.id)?b:a)}此次未留选，将随家人归去。`;
  const lines=[selectionPeerLine(a,b,kept.has(a.id),kept.has(b.id)),selectionPeerLine(b,a,kept.has(b.id),kept.has(a.id))];
  const text=`两人先前${pair.memory}，如今仍然交好。${fact}\n${both?'听完各自的封位，她们避开人声，在廊下低声说了几句。':'临别前，她们在宫门内的廊下停了一会，悄悄把话说给对方听。'}\n${fullName(a)}：“${lines[0]}”\n${fullName(b)}：“${lines[1]}”`;
  return {title,por:a,cast:[b],present:members,valid,text,choices:[{t:'让她们把话说完',f:()=>{
    if(!valid())return null;pair.recorded=true;pair.outcome=both?'together':'farewell';
    livedRecord([a,b],'bond',title,`selection-friend:${s.batch}:${rk(a,b)}`,text,lines);
    relAdd(a,b,2);
    for(const [p,o] of [[a,b],[b,a]]){
      p.selectionBonds||=[];p.selectionBonds.push({id:o.id,name:fullName(o),source:pair.memory,outcome:pair.outcome,otherKept:kept.has(o.id),date:s.date,turn});
    }
    return both?'话说完，两人各自随宫人安顿。这段交情也一同留在了宫里。':'宫人催着启程，两人终于道别。留下的人记得对方，也记得这场选秀让她们走向了不同的日子。';
  }}]};
}
const selectionPeersFinish=finishSelection;
finishSelection=function(...args){
  const s=S.selection,enabled=selectionFriendsEnabled()&&s&&s.phase!=='arrivals';
  const pairs=enabled?(s.peerPairs||[]).filter(p=>selectionFriendsClose(selectionPeer(s,p.a),selectionPeer(s,p.b))):[];
  if(enabled)for(const p of S.cands)keepSelectionPeer(s,p);
  const result=selectionPeersFinish.apply(this,args);
  if(result&&enabled&&(s.accepted||[]).length)for(const pair of pairs)pushEv(selectionPeerEvent(s,pair));
  return result;
};
const selectionPeersCohort=selectionCohortHTML;
selectionCohortHTML=function(c){return selectionPeersCohort(c)+(c.selectionBonds||[]).map(b=>
  `<p class="hint">选秀交好 · ${b.otherKept&&byId(b.id)?parentLink(b.id):esc(b.name)+'（此次未留选，已归家）'} · ${esc(b.source)}</p>`).join('');};
