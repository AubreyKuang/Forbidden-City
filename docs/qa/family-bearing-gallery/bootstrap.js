(()=>{
 const check=(ok,text)=>{if(!ok)throw Error(text);},scene=JSON.parse(document.getElementById('bearing-scene').textContent);
 const click=(selector,text)=>{const b=[...document.querySelectorAll(selector)].find(b=>b.textContent.includes(text));check(b&&!b.disabled,'按钮不可用：'+text);b.click();};
 const reread=()=>{save('auto');A.load('auto');check(!PalaceActions.blocked,'未完事件无法续接');};
 try{
  localStorage.setItem('chengongji_v1_auto',document.getElementById('bearing-save').textContent);A.load('auto');check(!PalaceActions.blocked,'初始存档不可用');let c=S.consorts[0];
  if(scene==='growth'){
   A.go('consort',c.id);click('#panel button','闲话家常');check(curEv.title==='闲话家常','闲聊未打开');check(c.chatThread.lastTopic==='family-bearing','未谈及家世日常');
   check(curEv.text.includes('从前会为这些细节反复踌躇'),'没有体现已适应宫中生活');check(c.story.some(s=>s.t.includes('家世日常')),'缺少生活纪事');reread();
  }else{
   A.go('xx');click('#panel button','去问候她');check(curEv.title==='初入宫门','安顿事件未打开');
   const content=document.querySelector('#mbox').textContent;
   if(scene==='noble')check(content.includes('家中用度向来宽裕'),'高门语气缺失');
   if(scene==='humble'||scene==='allowance')check(content.includes('暗记')&&content.includes('月例'),'寒门观察与用度缺失');
   if(scene==='proud')check(content.includes('自己的体面'),'骄矜者的自尊缺失');
   if(scene==='merchant')check(content.includes('银钱能置办东西'),'商家财力与礼数未区分');
   if(scene==='allowance'){
    const before=E().treasury;click('#mbox button','另赐安置银');check(E().treasury===before-1,'安置银扣款错误');check(c.story.some(s=>s.t.includes('宫中立足')&&s.t.includes('安置银')),'照应未写入人物纪事');
    reread();c=S.consorts[0];check(c.entryAdjustment.answer==='allowance'&&c.familyBearing.helpUntil===S.turn+6,'照应未保存');check(!familyBearingContext(c).constrained,'零用顾虑未缓解');
   }else reread();
  }
  document.documentElement.dataset.familyBearingCheck='passed';const label=document.createElement('p');label.textContent='浏览器校验通过 · '+({noble:'高门家教与用度',humble:'寒门观察学礼',proud:'手头紧但自尊仍在',merchant:'商家财力与宫中礼序',allowance:'安置银 · 一次扣款 · 人物纪事',growth:'三年后的从容 · 生活纪事与闲聊'}[scene])+' · 存读档';label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:8px;background:#214b3d;color:white;text-align:center;font-size:14px';document.body.appendChild(label);
 }catch(error){document.documentElement.dataset.familyBearingCheck='failed';const label=document.createElement('p');label.textContent='浏览器校验失败：'+error.message;label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;padding:16px;background:#951d2b;color:white';document.body.appendChild(label);console.error(error);}
})();
