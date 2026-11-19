/* Families age and make choices outside the palace; offices still require appointment. */
function natalLifeThread(p){return `natal:${p.id}:life`;}
function natalLifeRecord(c,people,title,text,thoughts=[]){
 const family=paternalFamily(c).filter(x=>x.alive&&!x.gone&&S.consorts.includes(x));
 const cast=[...new Set([...people,...family])];
 livedRecord(cast,'family',title,natalLifeThread(people[0]),text,cast.map(p=>thoughts[people.indexOf(p)]||
  (people.includes(p)?'家中的日子也有自己的打算。':relGet(c,people[0])<0?'虽未亲厚，仍留意家中消息。':'隔着宫门，仍想知道家人过得怎样。')));
}
function initialNatalSpouse(p,age){
 const sur=SUR[(p.seed>>>3)%SUR.length];
 return {id:`spouse:${p.id}`,sur,name:sur+BROTHER_NAMES[p.seed%BROTHER_NAMES.length],born:S.turn-(age+1)*12,alive:true};
}
function natalLifeTick(){
 const seen=new Set();for(const c of S.consorts){const h=houseOf(c);if(!h||seen.has(h)||!c.alive||c.gone)continue;seen.add(h);
  for(const p of natalPeople(h).slice()){
   if(!p.alive||p.exiled||p.visit||p.consortId||p.royalCompanionTrip)continue;const age=natalAge(p),life=p.lifeCourse||=( {} );
   if(p.married&&!p.spouse&&age>=18)p.spouse=initialNatalSpouse(p,age);
   if(age>=18&&!life.adult){life.adult=S.turn;natalLifeRecord(c,[p],'家中也有前程',`${p.name}已到成年，家书里说起自己的打算：${p.sex==='m'?'先把学业与生计安排踏实；有功名也须依程序候选，并非自然有官可做':'想有自己擅长的事情，也愿按自己的心意考虑婚事'}。`);}
   if(age<18||S.turn-(life.last??life.adult??S.turn)<24||life.year===S.year)continue;life.year=S.year;
   if(!chance(.16))continue;
   if(p.sex==='f'&&(!careersActive()||!p.widow)&&!p.married&&!p.betrothal&&age>=20&&age<=40&&p.seed%3!==0){
    p.spouse=initialNatalSpouse(p,age);p.married=true;life.last=S.turn;
    natalLifeRecord(c,[p],'手足成家',`${p.name}与${p.spouse.name}相识相知，双方亲自点头后成婚。她托家书报来喜讯，也说婚后仍要留时间做自己喜欢的事。`,['姻缘是自己的日子，不是为了给宫中的亲人分宠。']);
   }else if(p.married&&(!careersActive()||!p.widow&&p.spouse?.alive!==false&&(!p.spouse?.personId||officialAlive(careerPeopleForMarriage(p.spouse.personId)?.p)))&&p.sex==='f'&&age>=21&&age<=38&&(life.children||0)<2&&S.turn-(life.lastBirth??life.adult)>=24){
    if(careersActive()){beginNatalPregnancy(c,p);continue;}
    const seed=voiceHash(p.id+':child:'+ (life.children||0)),baby=addNatalPerson(c,h,seed%2?'f':'m',0,seed,false);baby.parentRelativeId=p.id;baby.sur=p.spouse?.sur||c.sur;baby.name=baby.sur+baby.given;baby.born=S.turn;baby.age=0;life.children=(life.children||0)+1;life.lastBirth=S.turn;life.last=S.turn;
    natalLifeRecord(c,[p,baby],'外家的新生儿',`${p.name}家添了${baby.sex==='m'?'男孩':'女孩'}${baby.name}，报来母子平安的家书。孩子的出生、年龄与亲缘已经记入家中名册。`,['初为人母才懂，喜悦里也有许多牵挂。','出生后由家中照料，此事由长辈记下。']);
   }else if(!life.path&&(p.sex==='f'||p.career==='student')){
    life.path=p.sex==='m'?'授课谋生':p.trait==='才女'||p.trait==='聪慧'?'整理家藏书卷':p.trait==='活泼'||p.trait==='爽直'?'料理家中账目':'教家中晚辈针线';life.last=S.turn;
    natalLifeRecord(c,[p],'自己的生计',`${p.name}在家中${life.path}。${p.sex==='m'?'仍保留原有科名；若愿意，可继续应试，此事并不等同授官。':'没有入宫，也不是在等着成为谁的妃嫔。家人往来中渐渐有了她自己的位置。'}`);
   }
  }
 }
}
function natalLifePanel(c,p){const l=p.lifeCourse,children=natalChildrenOf(c,p.id);
 return detailSection('家中的日子',`${natalSpouseSummary(p)}${typeof natalMarriageLine==='function'?natalMarriageLine(p):''}${l?.path?`<p>近况：${esc(l.path)}</p>`:''}${children.map(x=>{
  const link=`<button class="btn quiet" onclick="A.go('natal','${c.id}:${x.id}')">${esc(x.name)} · ${x.sex==='m'?'儿子':'女儿'} · ${natalAge(x)}岁</button>`;
  const nomination=nieceSelectionEntryActive()&&familyNominationButton(c,x);
  return nomination?`<div class="acts">${link}${nomination}</div>`:link;
 }).join('')}${l?.path||p.married||p.betrothal?`<button class="btn" onclick="A.natalLifeTalk(${c.id},${p.id})" ${S.turn-(l?.talk??-99)<6?'disabled':''}>回信问问近况<small>精力1 · 每半年一次</small></button>`:''}`);
}
A.natalLifeTalk=function(id,relative){const e=natalEntry(id,relative);if(modalOpen||!e||!inPalace(e.c)||!e.p.alive||e.p.consortId)return;const {c,p}=e;
 const valid=()=>inPalace(c)&&p.alive&&!p.consortId&&S.turn-(p.lifeCourse?.talk??-99)>=6;
 if(!valid())return;
 const resolve=kind=>{if(!valid()||!useE())return null;(p.lifeCourse||={}).talk=S.turn;
  const t=kind==='respect'?`陛下准${fullName(c)}把问候随家书寄给${p.name}，尊重${p.lifeCourse.path||'经营自己家庭'}的打算。回信说起近来的小事，未借此许诺官职或入宫。`:`${fullName(c)}写信问${p.name}能否分担家中照料。回信说会量力商议，不因亲人在宫中便独自承担所有家务。`;
  natalLifeRecord(c,[p],kind==='respect'?'各有自己的日子':'家中如何分担',t);if(kind==='respect')relAdd(c,p,3);return t;};
 pushEv({title:'家书里的日常',por:c,present:[c],valid,text:`说起${natalLabel(c,p)}${p.name}，${fullName(c)}翻出家书。${p.lifeCourse?.path?'近来在'+p.lifeCourse.path+'。':''}${p.widow?'也提到守寡后的生活与亡夫留下的旧物。':p.spouse?'也提到与'+p.spouse.name+'成家的日子。':''}她想回几句自己的话。`,choices:[{t:'问候近况，尊重自己的打算 · 精力1',f:()=>resolve('respect')},{t:'商量家中照料如何分担 · 精力1',f:()=>resolve('care')},{t:'留待下次回信'}]});
};
