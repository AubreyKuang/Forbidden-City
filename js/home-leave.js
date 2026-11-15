/* Temporary leave retains rank, palace and every pending personal story. */
function homeLeaveEligible(c){return !!(c&&inPalace(c)&&!c.maid&&!c.rescue&&!c.visitor&&!S.over&&c.hp>=40&&(!c.preg||c.preg<5));}
function startHomeLeave(c,months=2,reason='省亲'){
 if(!homeLeaveEligible(c)||![1,2,3].includes(months))return false;
 c.homeLeave={from:S.turn,due:S.turn+months,reason};c.lastHomeLeave=S.turn;
 const text=`奉旨回娘家${reason}，约${cnNum(months)}个月后回宫。保留位分与${c.palace}居所，随侍护送；宫中事务暂交掌事人照应。`;
 story(c,text);remember(c,'care',text);log(`${fullName(c)}暂离宫中，回家${reason}。`,1);npcSync();return true;
}
function returnHomeLeave(c,early=false){
 if(!c?.homeLeave)return false;
 if(!c.alive||c.gone){delete c.homeLeave;return false;}
 const reason=c.homeLeave.reason;delete c.homeLeave;
 const text=`${early?'奉旨提前':'按约'}结束${reason}，回到${c.palace}。家中所见留在自己的纪事里。`;
 story(c,text);log(`${fullName(c)}${early?'提前':'期满'}回宫。`,1);cchg(c,{mood:early?-2:6});npcSync();return true;
}
function homeLeaveTick(){for(const c of S.consorts)if(c.homeLeave){if(!c.alive||c.gone||c.cold)delete c.homeLeave;else if(S.turn>=c.homeLeave.due)returnHomeLeave(c);}}
function homeLeavePanel(c){
 if(!c.homeLeave)return '';
 return `<section class="personal-experience"><h3>暂离宫中 · ${esc(c.homeLeave.reason)}</h3><p>正在娘家，约${Math.max(0,c.homeLeave.due-S.turn)}个月后回宫。原位分与${esc(c.palace)}居所保留，暂不参加宫内活动。</p><button class="btn" onclick="A.recallHomeLeave(${c.id})">提前召回</button></section>`;
}
A.homeLeave=function(id){const c=byId(id);if(modalOpen||!homeLeaveEligible(c))return;pushEv({title:'回家省亲',por:c,valid:()=>homeLeaveEligible(c),text:'可准她限期回娘家省亲。随侍护送，原宫室保留；离宫期间不能在宫中相见、召幸或赴宴。',choices:[...[1,2,3].map(months=>({t:`准省亲${cnNum(months)}个月`,f:()=>startHomeLeave(c,months)?'她收拾行装，按约暂离宫中。':null})),{t:'暂不安排'}]});};
A.recallHomeLeave=function(id){if(modalOpen)return;const c=byId(id);if(returnHomeLeave(c,true)){save('auto');render();}};
function sickMotherEvent(c){
 if(!inPalace(c)||c.rescue||c.wound==='mom'||c.visitor)return null;
 let done=false;const valid=()=>!done&&inPalace(c);
 return {title:'家中病讯',por:c,present:[c],valid,text:`${cName(c)}收到家中病讯：母亲病重，眼下不宜远行。她想知道能否请太医前往，也盼亲自回去照料。`,choices:[
  {t:'派太医赴家诊治 · 国库−15',cond:()=>E().treasury>=15,f:()=>{if(!valid()||E().treasury<15)return null;done=true;chg({treasury:-15});cchg(c,{aff:6,mood:5});story(c,'母亲重病，陛下派太医赴家诊治，未让病人远行入宫。');return '太医携必要药材赴她家中诊治，病况将由家人转报；不会只因送了药便断言痊愈。';}},
  {t:'准她回家探病两个月',cond:()=>homeLeaveEligible(c),why:'须身体允许、孕程未满五个月且无在宫探亲家眷',f:()=>{if(!valid()||!startHomeLeave(c,2,'探病'))return null;done=true;cchg(c,{aff:8});return '她由随侍护送回家探病，暂不在宫中。两个月后按约回宫。';}},
  {t:'暂不准离宫，准家人传报病况',f:()=>{if(!valid())return null;done=true;cchg(c,{mood:-6});story(c,'母亲病重，未获准离宫，只能等待家中病况。');return '她留在宫里等信，病讯带来的忧虑没有就此消失。';}}]};
}
