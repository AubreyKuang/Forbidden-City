/* 易次元 economy simulation: plays standard reigns under the edition's economy settings and
   reports the treasury, so the numbers in scripts/yiciyuan-edition.json can be tuned.
     node scripts/economy-sim.cjs <old|new> <generous|frugal> [seeds=5] [years=6] [harem=12]
   old  = only economy.upkeep / tribute (the 165 step); new = the whole config (v167 on new games).
   generous picks whatever buys the most 民心 + 威望 (silver counted at 40 万两 a point);
   frugal only spends when 民心 or 威望 drop below 70. Both keep about [harem] consorts,
   take every 三年大选, spend leftover energy on nights, and ignore 破产 warnings. */
const path=require('path'),fs=require('fs');
const repo=path.resolve(__dirname,'..');
const [rules,policy,seedsArg,yearsArg,haremArg]=process.argv.slice(2);
const {boot}=require(path.join(repo,'tests/playtest-harness.cjs'));
const cfg=JSON.parse(fs.readFileSync(path.join(repo,'scripts/yiciyuan-edition.json'),'utf8')).economy;
const economy=rules==='old'?{upkeep:cfg.upkeep,tribute:cfg.tribute}:cfg;
const seeds=+seedsArg||5,years=+yearsArg||6,harem=+haremArg||12;
const out=[];
for(let s=0;s<seeds;s++){
  const b=boot(1000+s*7919,new Map(),{PALACE_EDITION_CONFIG:{edition:'sim',economy}});
  const r=b.run(`(()=>{
  const policy='${policy}';
  const num=(t,k)=>{const m=t.match(new RegExp(k+'\\\\s*([+\\\\-−])\\\\s*(\\\\d+)'));return m?(m[1]==='+'?1:-1)*+m[2]:0};
  const score=c=>{const t=(c.t||'')+' '+(c.preview||'');const tr=num(t,'国库'),p=num(t,'民心'),pr=num(t,'威望');
    if(policy==='frugal')return (E().people<70?p:0)+(E().prestige<70?pr:0)*0.5+tr/15;
    return p+pr+tr/40+(/赏赐/.test(t)?0.5:0);};
  let spent=0,gained=0;
  const dr=()=>{for(let n=0;modalOpen&&n<200;n++){if(modalResult){nextEv();continue;}
    if(S.over)return;
    const opts=curEv.choices.map((c,i)=>({c,i})).filter(x=>!x.c.cond||x.c.cond());
    if(curEv.input)$('#minput').value=curEv.input.def||'安';
    let pick=opts.find(x=>/^进入.月|^略过邀约/.test(x.c.t));
    if(!pick&&curEv.title==='三年大选')pick=opts.find(x=>/前去看看/.test(x.c.t));
    if(!pick&&curEv.title==='留牌子')pick=opts.find(x=>x.c.t==='封为答应')||opts[0];
    if(!pick){const cand=opts.filter(x=>!/稍后再议|再想想|作罢$|重新开局|处死|赐死|自尽/.test(x.c.t));const pool=cand.length?cand:opts;
      pick=pool.reduce((a,x)=>score(x.c)>score(a.c)?x:a,pool[0]);}
    const t0=E().treasury;choose(pick.i);const d=E().treasury-t0;if(d<0)spent-=d;else gained+=d;}};
  A.start();dr();
  const take=()=>{UI.view='xx';const room=${harem}-alive().length;for(const c of (S.cands||[]).slice(0,Math.max(0,room))){A.xxTake(c.id);dr();}A.xxEnd();dr();};
  take();
  const rows=[];let minT=E().treasury,debtMonths=0;
  for(let m=0;m<${years}*12&&!S.over;m++){
    for(let k=0;k<3&&E().energy>0&&!S.over;k++){const en=E().energy;A.court();dr();if(E().energy===en)break;}
    for(let k=0;k<4&&E().energy>0&&!S.over;k++){const cs=harem().filter(x=>inPalace(x)&&!x.preg&&!x.cold).sort((a,b)=>b.favor-a.favor);const c=cs[k%Math.max(1,Math.min(3,cs.length))];if(!c)break;const en=E().energy;A.night(c.id);dr();if(E().energy===en)break;}
    if(S.over)break;
    const turn=S.turn;A.endMonth();dr();
    if(S.cands&&S.cands.length&&UI.view==='xx')take();
    if(!S||S.over)break;
    minT=Math.min(minT,E().treasury);if(E().treasury<0)debtMonths++;
    if(S.month===3)rows.push(E().treasury);
  }
  return JSON.stringify({rows,minT,debtMonths,over:!!(S&&S.over),fall:S&&S.history&&S.history.at(-1)?.shi,end:S&&E().treasury,people:S&&Math.round(E().people),harem:S&&alive().length,kids:S&&kidsAlive().length,spent,gained,turn:S&&S.turn});})()`);
  out.push(JSON.parse(r));
}
for(const o of out)console.log(JSON.stringify(o));
const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length);
console.log(`${rules}/${policy}: end avg ${avg(out.map(o=>o.end??0))}, min avg ${avg(out.map(o=>o.minT))}, debt months avg ${avg(out.map(o=>o.debtMonths))}, fallen ${out.filter(o=>o.over).length}/${out.length}`);
