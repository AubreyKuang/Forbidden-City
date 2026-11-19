/* Temporary leave retains rank, palace and every pending personal story. */
function domesticHomeLeaveAllowed(c){return c?.fixedStory!=='ayimu'||journalContentVersion()<93;}
function homeLeaveEligible(c){return !!(c&&domesticHomeLeaveAllowed(c)&&inPalace(c)&&!c.maid&&!c.rescue&&!c.visitor&&!natalPeople(c.house).some(p=>p.visit?.host===c.id)&&!S.over&&c.hp>=40&&(!c.preg||c.preg<5));}
function startHomeLeave(c,months=2,reason='省亲'){
 if(!homeLeaveEligible(c)||![1,2,3].includes(months))return false;
 c.homeLeave={from:S.turn,due:S.turn+months,reason};c.lastHomeLeave=S.turn;
 const text=`奉旨回娘家${reason}，约${cnNum(months)}个月后回宫。保留位分与${c.palace}居所，随侍护送；宫中事务暂交掌事人照应。${homeDeparture(c,reason)}`;
 homeRecord(c,text,homeWorryActive(c)?-.3:.6);log(`${fullName(c)}暂离宫中，回家${reason}。`,1);npcSync();return true;
}
function returnHomeLeave(c,early=false){
 if(!c?.homeLeave)return false;
 if(!c.alive||c.gone){delete c.homeLeave;return false;}
 if(c.homeLeave.field){storyCastFrontierReturn(c,early);return true;}
 const leave=c.homeLeave;delete c.homeLeave;
 homeReturn(c,leave,early);log(`${fullName(c)}${early?'提前':'期满'}回宫。`,1);npcSync();return true;
}
function homeLeaveTick(){for(const c of S.consorts){homeMotherTick(c);if(c.homeLeave){if(!c.alive||c.gone||c.cold)delete c.homeLeave;else if(c.homeLeave.field)storyCastFrontierTick(c);else if(S.turn>=c.homeLeave.due)returnHomeLeave(c);}}}
function homeLeaveLocation(c){return c.homeLeave?.field?'北境军驿':'娘家';}
function homeLeaveStatus(c){return '暂离宫中 · '+homeLeaveLocation(c);}
function homeLeavePanel(c){
 if(!c.homeLeave)return '';
 return `<section class="personal-experience"><h3>暂离宫中 · ${esc(c.homeLeave.reason)}</h3><p>正在${homeLeaveLocation(c)}，约${Math.max(0,c.homeLeave.due-S.turn)}个月后回宫。原位分与${esc(c.palace)}居所保留，暂不参加宫内活动。</p><button class="btn" onclick="A.recallHomeLeave(${c.id})">提前召回</button></section>`;
}
A.homeLeave=function(id){const c=byId(id);if(modalOpen||!homeLeaveEligible(c))return;pushEv({title:'回家省亲',por:c,valid:()=>homeLeaveEligible(c),text:'可准她限期回娘家省亲。随侍护送，原宫室保留；离宫期间不能在宫中相见、召幸或赴宴。',choices:[...[1,2,3].map(months=>({t:`准省亲${cnNum(months)}个月`,f:()=>startHomeLeave(c,months,homeWorryActive(c)?'探病':'省亲')?'她收拾行装，按约暂离宫中。':null})),{t:'暂不安排'}]});};
A.recallHomeLeave=function(id){if(modalOpen)return;const c=byId(id);if(returnHomeLeave(c,true)){save('auto');render();}};
function sickMotherEvent(c){
 const previous=homeMother(c);
 if(!domesticHomeLeaveAllowed(c)||!inPalace(c)||c.rescue||c.wound==='mom'||c.visitor||previous&&(previous.status!=='well'||S.turn-previous.from<24))return null;
 let done=false;const valid=()=>!done&&inPalace(c)&&!c.visitor&&c.wound!=='mom';
 return {title:'家中病讯',por:c,present:[c],valid,onQueue:()=>beginMotherIllness(c),text:`${cName(c)}收到家中病讯：母亲病重，眼下不宜远行。她想知道能否请太医前往，也盼亲自回去照料。`,choices:[
  {t:'派太医赴家诊治 · 国库−15',cond:()=>E().treasury>=15,f:()=>{if(!valid()||E().treasury<15)return null;done=true;const r=beginMotherIllness(c);r.care='physician';r.due=S.turn+2;chg({treasury:-15});cchg(c,{aff:6,mood:2});homeRecord(c,'母亲重病，陛下派太医赴家诊治，未让病人远行入宫。她感激这份照应，病况未明，仍在担忧。',.25);return '太医携必要药材赴她家中诊治，病况将由家人转报；她记着这份照应，尚不能因此安心，更不能断言已经痊愈。';}},
  {t:'准她回家探病两个月',cond:()=>homeLeaveEligible(c),why:'须身体允许、孕程未满五个月且无在宫探亲家眷',f:()=>{if(!valid()||!startHomeLeave(c,2,'探病'))return null;done=true;cchg(c,{aff:8});return '她由随侍护送回家探病，暂不在宫中。两个月后按约回宫。';}},
  {t:'暂不准离宫，准家人传报病况',f:()=>{if(!valid())return null;done=true;beginMotherIllness(c);cchg(c,{mood:-6});homeRecord(c,'母亲病重，未获准离宫，只能等待家中病况。她将家信读了又读，心里担忧，也有未能亲自照料的遗憾。',-.6,null,true);return '她留在宫里等信，病讯带来的忧虑没有就此消失。';}}]};
}
