/* Birth batches are saved before naming so reloading never loses a sibling or rerolls a result. */
const BIRTH_OMENS={
  red:{name:'赤霞映阙',text:'皇嗣啼哭之际，天边赤霞忽然映红了殿窗，宫人将这一幕记入诞生簿。',stat:'hp',label:'体魄',bonus:6},
  star:{name:'文星流彩',text:'诞生之夜，一道流星划过文渊阁上空，值夜的宫人说像一笔银色的墨痕。',stat:'lit',label:'才学',bonus:6},
  rainbow:{name:'长虹贯庭',text:'雨歇时天边横起一道长虹，第一声啼哭恰在此时传出，庭中宫人纷纷抬头。',stat:'mar',label:'武艺',bonus:6}
};
function rollBirthCount(roll=R()){return roll<.001?3:roll<.021?2:1}
function birthType(sexes){return sexes.length===3?'三胞胎':sexes.length===2?(sexes[0]===sexes[1]?'双胞胎':'龙凤胎'):''}
function applyBirthOmen(k,id){
  if(k.birthOmen||!BIRTH_OMENS[id])return;
  const omen=BIRTH_OMENS[id];k.birthOmen=id;k[omen.stat]=clamp(k[omen.stat]+omen.bonus);
  if(k.birthTraits)k.birthTraits.initial[omen.stat]=k[omen.stat];
  kstory(k,`【${omen.name}】${omen.text}出生时${omen.label}+${omen.bonus}。`);
}
function birthTags(k){
  const omen=BIRTH_OMENS[k.birthOmen];
  return `${k.birthType?`<span class="tag">${esc(k.birthType)} · 第${cnNum(k.birthOrder)}个出生</span>`:''}${omen?`<span class="tag y" title="出生时${omen.label}+${omen.bonus}">${omen.name} · ${omen.label}+${omen.bonus}</span>`:''}`;
}
function deliveryKids(c){return (c.delivery?.children||[]).map(kidById).filter(Boolean)}
function pendingDelivery(){return S.consorts.find(c=>c.delivery&&!c.delivery.settled&&deliveryKids(c).some(k=>k.pendingName))}
function birthEvent(c){
  if(c.delivery&&!c.delivery.settled)return birthNamingEvent(c);
  if(c.preg<10)return null;
  const count=rollBirthCount(),sexes=Array.from({length:count},()=>chance(.5)?'m':'f');
  const kind=birthType(sexes),omen=chance(.03)?pick(Object.keys(BIRTH_OMENS)):null;
  const children=sexes.map(sex=>makeKid(c,sex,suggestName(sex)));
  c.delivery={children:children.map(k=>k.id),kind,omen,settled:false,
    difficult:chance(c.trait==='体弱'?.12:.03),swap:!!c.swapRisk&&chance(.7)};
  c.preg=0;c.prot=false;c.swapRisk=false;c.lastBirth=S.turn+1;
  children.forEach((k,i)=>{
    k.pendingName=true;k.birthOrder=i+1;
    if(kind){k.birthType=kind;k.birthGroup=children[0].id;}
    kstory(k,`降生于${c.palace}，生母${k.momName}${kind?`，为${kind}中第${cnNum(i+1)}个出生的孩子`:''}。`);
    if(omen)applyBirthOmen(k,omen);
  });
  return birthNamingEvent(c);
}
function birthNamingEvent(c){
  const children=deliveryKids(c),k=children.find(k=>k.pendingName);if(!k)return null;
  const kind=c.delivery.kind,omen=BIRTH_OMENS[c.delivery.omen];
  const report=kind?`${cName(c)}于${c.palace}诞下${kind}，共${cnNum(children.length)}位皇嗣。`:
    `${cName(c)}于${c.palace}临盆，阵痛一日一夜，诞下一位${k.sex==='m'?'小皇子':'小公主'}。`;
  return {title:kind||'弄璋弄瓦',por:c,cast:children,sfx:'joy',
    text:`${report}${omen?`\n${omen.text}\n§${omen.name}：本胎皇嗣出生时${omen.label}+${omen.bonus}`:''}\n${kind?`请为第${cnNum(k.birthOrder)}位${k.sex==='m'?'小皇子':'小公主'}赐名`:'请陛下赐名'}（不含姓氏）：`,
    input:{def:k.name,max:3},choices:[{t:'赐名',f:value=>{
      if(!k.pendingName)return null;
      const name=(value||k.name).trim().slice(0,3)||k.name;
      if(S.children.some(other=>other!==k&&other.name===name)){
        pushNow(birthNamingEvent(c));return '已有皇嗣使用这个名字，请另赐一名。';
      }
      k.name=name;k.pendingName=false;kstory(k,`陛下赐名“${name}”。`);
      if(children.some(child=>child.pendingName)){
        pushNow(birthNamingEvent(c));save('auto');
        return {text:`${kidName(k)}，${E().sur}${name}。接下来为另一位孩子赐名。`,por:k};
      }
      const result=finishDelivery(c);save('auto');return {text:result,por:children.length===1?k:undefined};
    }}]};
}
function finishDelivery(c){
  const delivery=c.delivery;if(!delivery||delivery.settled)return '';
  const children=deliveryKids(c);if(children.some(k=>k.pendingName))return '';
  delivery.settled=true;deepen(c);
  if(c.wish==='child'&&!c.wishDone){c.wishDone=true;c.wishKnown=true;}
  remember(c,'child',delivery.kind?`诞下${delivery.kind}`:'生下孩子');
  const names=children.map(k=>kidName(k)).join('、');
  let effect=chg({prestige:children.some(k=>k.sex==='m')?4:2}),text=`${names}，均已赐名。`;
  if(delivery.difficult){
    c.alive=false;story(c,`诞下${names}后血崩，撒手人寰。`);log(`${fullName(c)}诞下${names}后薨逝。`,1);AU.sfx('sad');
    children.forEach(k=>kstory(k,`生母${k.momName}因难产薨逝。`));text+=`\n然而产后血崩，${fullName(c)}没能挺过那个夜晚。`;
  }else{
    setXin(c,'欢喜','诞下皇嗣');story(c,`诞下${names}，陛下分别赐名。`);log(`${fullName(c)}诞下${names}${delivery.kind?`（${delivery.kind}）`:''}。`,1);
    effect+='　'+cchg(c,{mood:25,aff:10,favor:8});
  }
  const follow=[];
  if(delivery.swap)follow.push(swapEvent(c,children[0]));
  for(const k of children){
    if(!k.alive)continue;
    if(!c.alive)follow.push(fosterOffer(k,'孩子的生母已经不在了。'));
    else if(c.maid||c.rank<=1)follow.push(fosterOffer(k,`${kidName(k)}的生母只是${c.maid?'宫女':RANKS[c.rank]}。`));
  }
  Q.unshift(...follow);return text+fx(effect);
}
A.resumeBirth=function(id){const c=byId(id);if(c?.delivery&&!c.delivery.settled)pushEv(birthNamingEvent(c));};
function pendingBirthPanel(){
  const c=pendingDelivery();return c?`<p class="hint">${esc(fullName(c))}新生的皇嗣尚待赐名。</p><button class="btn gold" onclick="A.resumeBirth(${c.id})">继续赐名</button>`:'';
}
