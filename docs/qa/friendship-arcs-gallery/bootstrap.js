(()=>{
 const check=(ok,text)=>{if(!ok)throw Error(text);},scenario=JSON.parse(document.getElementById('friendship-scene').textContent);
 const click=(selector,text)=>{const button=[...document.querySelectorAll(selector)].find(b=>b.textContent.includes(text));check(button&&!button.disabled,'按钮不可用：'+text);button.click();};
 const reload=()=>{save('auto');A.load('auto');check(!PalaceActions.blocked,'未完事件续接失败');};
 const scroll=selector=>{const target=document.querySelector(selector);check(target,'缺少 '+selector);target.scrollIntoView({block:'center'});};
 try{
  localStorage.setItem('chengongji_v1_auto',document.getElementById('friendship-save').textContent);A.load('auto');check(!PalaceActions.blocked,'初始存档失败');let [a,b]=S.consorts;
  A.go('consort',b.id);
  if(['gift','favor','repair'].includes(scenario)){
   click('#panel button','听她谈与');check(curEv.title==='说起渐远的旧交','未打开本人谈话');check(!curEv.cast?.includes(a),'不应把未在场的旧友画成出席者');
   if(scenario==='gift')check(curEv.text.includes('回礼')&&curEv.text.includes('好意'),'赠礼心事缺失');
   if(scenario==='favor')check(curEv.text.includes('嫉妒')&&curEv.text.includes('有了嫌隙'),'恩宠心事缺失');
   if(scenario==='repair'){
    const energy=E().energy;click('#mbox button','分别听过');check(E().energy===energy-1,'精力扣款错误');check(friendshipArc(a,b).pending?.due===S.turn+3,'没有约下后续');
    check(a.story.some(s=>s.t.includes('问过彼此的心意'))&&b.story.some(s=>s.t.includes('问过彼此的心意')),'双方纪事不全');
   }
   reload();[a,b]=S.consorts;if(scenario==='repair')check(friendshipArc(a,b).history.filter(n=>n.title==='问过彼此的心意').length===1,'重复记录');
  }else if(scenario==='distance'){
   check(document.querySelector('.friendship-history').textContent.includes('渐渐疏远'),'疏远关系未展示');
   reload();A.go('consort',b.id);scroll('.friendship-history');
  }else if(scenario==='chronicle'){
   const filter=document.querySelector('select[aria-label="纪事主题"]');check(filter,'纪事主题未显示');filter.value='bond';filter.dispatchEvent(new Event('change',{bubbles:true}));
   click('#panel button','回看前因与后续');check(document.querySelector('.chronicle-tools').textContent.includes('找到3则'),'前因后续未关联');
   const diary=[...document.querySelectorAll('.detail-section')].find(s=>s.querySelector('h3,h4')?.textContent==='人物纪事');check(diary?.querySelector('.story')?.textContent.includes('柳知微记下'),'缺少本人感受');reload();A.go('consort',b.id);
   const section=[...document.querySelectorAll('.detail-section')].find(s=>s.querySelector('h3,h4')?.textContent==='人物纪事');check(section,'人物纪事缺失');section.scrollIntoView({block:'start'});
  }else{
   const month=S.turn;A.endMonth();for(let guard=0;modalOpen&&guard<150;guard++){
    if(modalResult)nextEv();else choose(curEv.choices.findIndex(c=>!c.cond||c.cond()));
   }
   check(S.turn===month+1&&!modalOpen,'月末未完成');[a,b]=S.consorts;check(friendshipArc(a,b).stage==='renewed','约定后续未发生');
   check(a.story.some(s=>s.t.includes('再坐一回'))&&b.story.some(s=>s.t.includes('再坐一回')),'重修旧好未双向记录');reload();A.go('consort',b.id);scroll('.friendship-history');
  }
  document.documentElement.dataset.friendshipCheck='passed';const label=document.createElement('p');label.textContent='浏览器校验通过 · '+({gift:'赠礼误会 · 本人的心事',favor:'恩宠落差 · 善妒者的坦白',distance:'渐渐疏远 · 人际关系',chronicle:'双向纪事 · 前因后续',repair:'先听双方 · 一次扣款 · 后续约定',reunion:'真实月末 · 再坐一回 · 重拾交情'}[scenario])+' · 存读档';label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:8px;background:#214b3d;color:white;text-align:center;font-size:14px';if(modalOpen){label.style.cssText='margin:12px 0 0;padding:8px;border-radius:6px;background:#214b3d;color:white;text-align:center;font-size:13px';document.querySelector('#mbox').appendChild(label);}else document.body.appendChild(label);
 }catch(error){document.documentElement.dataset.friendshipCheck='failed';const label=document.createElement('p');label.textContent='浏览器校验失败：'+error.message;label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;padding:16px;background:#951d2b;color:white';document.body.appendChild(label);console.error(error);}
})();
