(()=>{
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 try{
  const payload=document.getElementById('royal-heart-save').textContent,view=JSON.parse(document.getElementById('royal-heart-view').textContent);
  localStorage.setItem('chengongji_v1_auto',payload);A.load('auto');assert(!PalaceActions.blocked,'存档未恢复');
  const id=S.children[0].id;let p=xieAn(),k=kidById(id);
  if(view==='check'){
   assert(curEv.title==='谢安辞婚','辞婚未显示');
   const button=document.querySelector('#mbox .mch button');assert(button&&!button.disabled,'赐婚按钮不可用');button.click();
   assert(k.married&&p.married&&k.spouse.personId===p.id,'夫妻身份未连接');assert(p.artPortrait===433,'立绘编号错误');
   assert(!householdCanConceive(k,k.spouse),'分房期间可以怀孕');assert(k.household.concubines.length===0,'出现妾室');
   const before=JSON.stringify([k.xieAdmiration,p.xiean.marriage]);save('auto');A.load('auto');
   assert(!PalaceActions.blocked,'选择结果无法重放');p=xieAn();k=kidById(id);assert(before===JSON.stringify([k.xieAdmiration,p.xiean.marriage]),'读档改变夫妻关系');
   for(let i=0;modalOpen&&modalResult&&i<8;i++)document.querySelector('#mbox .mch button').click();
   assert(!modalOpen,'结果未正常关闭');A.go('scholar',p.id);
   assert(document.querySelector('#panel').textContent.includes('谢安'),'人物页未显示');
   assert(document.querySelector('#panel [data-portrait-cell="433"]'),'人物页未使用实际433图格');
   assert(portraitCell(k.spouse)===433,'驸马小像未使用433');
   const label=document.createElement('p');label.id='browser-check-result';label.textContent='浏览器校验：通过 · 赐婚点击、夫妻身份、433立绘、分房禁孕、无妾、存读档续接';
   label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:8px;background:#214b3d;color:white;text-align:center;font-size:14px';document.body.appendChild(label);
   document.documentElement.dataset.royalHeartCheck='passed';
  }else if(['romance-check','proposal-check','betrothal-check'].includes(view)){
   const choice=()=>{const button=document.querySelector('#mbox .mch button');assert(button&&!button.disabled,'选项不可用');button.click();};
   const close=()=>{for(let i=0;modalOpen&&modalResult&&i<8;i++)choice();assert(!modalOpen,'结果未关闭');};
   if(view==='romance-check'){
    A.go('scholar',p.id);const invite=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('安排相遇机会'));assert(invite,'撮合按钮未显示');invite.click();choice();close();
    assert(p.xiean.path.kind==='return'&&p.xiean.path.pending==='meeting','邀请未改变相识进展');
    const follow=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('听听辞婚之后'));assert(follow,'后续入口未显示');follow.click();choice();close();
    assert(p.xiean.path.stage===1&&!p.married&&!k.married,'相识被误写成结婚');
   }else{
    choice();
    if(view==='betrothal-check')assert(k.betrothal?.personId===p.id&&p.betrothal?.personId===k.id&&!k.married&&!p.married&&!k.spouse&&!k.household,'未满十五岁未正确订婚');
    else assert(k.married&&p.married&&p.xiean.marriage.joinedAt===S.turn&&p.xiean.marriage.separateUntil===null,'自愿婚姻被强制分房');
   }
   const before=JSON.stringify([k.betrothal,k.married,p.xiean]);save('auto');A.load('auto');assert(!PalaceActions.blocked,'新分支不能续接');p=xieAn();k=kidById(id);
   assert(before===JSON.stringify([k.betrothal,k.married,p.xiean]),'读档改变剧情状态');close();
   const scroll=()=>jumpToPageSection('child-family');
   if(view==='romance-check'){A.go('scholar',p.id);assert(document.querySelector('#panel [data-portrait-cell="433"]'),'谢安实际立绘错误');}
   else{A.go('kid',id);window.addEventListener('load',scroll,{once:true});scroll();}
   const label=document.createElement('p');label.id='browser-check-result';label.textContent='浏览器校验：通过 · '+({'romance-check':'撮合按钮、相识进展、单一追求者、433立绘、存读档','proposal-check':'主动提亲、自愿成婚、不强制分房、存读档','betrothal-check':'十四岁只订婚、双方婚约、无夫妻家庭、存读档'}[view]);
   label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:8px;background:#214b3d;color:white;text-align:center;font-size:14px';document.body.appendChild(label);document.documentElement.dataset.royalHeartCheck='passed';
  }else if(view==='profile'){A.go('scholar',p.id);}
  else if(view==='marriage'){A.go('kid',id);const scroll=()=>jumpToPageSection('child-family');window.addEventListener('load',scroll,{once:true});scroll();}
  else if(view==='chronicle'){A.go('scholar',p.id);const scroll=()=>{const el=[...document.querySelectorAll('h2,h3,h4')].find(x=>x.textContent==='人物纪事');el?.scrollIntoView({block:'start'});};window.addEventListener('load',scroll,{once:true});scroll();}
 }catch(error){document.documentElement.dataset.royalHeartCheck='failed';const el=document.createElement('pre');el.textContent='浏览器校验失败：'+error.message;el.style.cssText='position:fixed;inset:0;z-index:99999;background:#fff;color:#a00;padding:40px';document.body.appendChild(el);}
})();
