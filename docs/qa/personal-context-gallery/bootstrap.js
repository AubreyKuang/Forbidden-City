(()=>{
 const check=(ok,text)=>{if(!ok)throw Error(text);},scene=JSON.parse(document.getElementById('context-scene').textContent);
 const clickChoice=()=>{const b=document.querySelector('#mbox .mch button');check(b&&!b.disabled,'事件选项不可用');b.click();};
 const close=()=>{for(let n=0;modalOpen&&modalResult&&n<8;n++)clickChoice();check(!modalOpen,'结果未关闭');};
 const reread=()=>{save('auto');A.load('auto');check(!PalaceActions.blocked,'存档无法续接');};
 const scrollTo=text=>{const f=()=>{const node=[...document.querySelectorAll('#panel h3,#panel h2,#panel div')].find(el=>el.textContent.startsWith(text)&&el.textContent.length<600);node?.scrollIntoView({block:'center'});};window.addEventListener('load',f,{once:true});f();};
 try{
  localStorage.setItem('chengongji_v1_auto',document.getElementById('context-save').textContent);A.load('auto');check(!PalaceActions.blocked,'演示存档未恢复');
  let result='';
  if(scene==='profile'||scene==='past'){
   let g=S.consorts.find(c=>c.gouyi);A.go('consort',g.id);
   check(document.querySelector('#panel').textContent.includes('往事：自幼双手蜷握'),'旧档往事未修复');check(!document.querySelector('#panel').textContent.includes('undefined'),'人物页出现 undefined');
   if(scene==='past'){
    const button=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('听令仪讲河间旧事'));check(button&&!button.disabled,'旧事入口未显示');button.click();
    check(curEv.title.includes('宽袖藏春'),'旧事未打开');const energy=E().energy;clickChoice();check(g.gouyi.past.stage===1&&E().energy===energy-1,'旧事未正确结算');
    reread();g=S.consorts.find(c=>c.gouyi);check(g.gouyi.past.history.length===1,'读档重复或丢失旧事');check(g.story.some(s=>s.thread==='gouyi-past:'+S.gen+':'+g.id),'缺少人物纪事');
    result='旧事按钮、选择、一次扣费、人物纪事、存读档';
   }else{reread();g=S.consorts.find(c=>c.gouyi);A.go('consort',g.id);scrollTo('往事：自幼');result='旧档缺失编号、专属往事、422立绘、人物页恢复';check(document.querySelector('#panel [data-portrait-cell="422"]'),'422立绘缺失');}
  }else if(scene==='prayer'||scene==='foster'){
   const c=S.consorts.find(c=>c.preg>=2),wish=pregnancyPrayerWish(c);check(!curEv.text.includes('头一回'),'错误的初次为母');check(curEv.text.includes(scene==='prayer'?'明珠':'并非臣妾亲生'),'未使用真实育儿经历');
   clickChoice();reread();const mother=byId(c.id);check(mother.pregnancyPrayer.wish===wish,'祈愿变化');check(mother.story.some(s=>s.t.includes(wish)),'问题未进人物纪事');close();A.pregnancyPrayer(mother.id);
   check(curEv.title==='重读孕中祈愿','重读入口错误');result=scene==='prayer'?'先朝子女、育儿经历、纪事、祈愿重读':'养母身份、无虚构亲生、纪事、祈愿重读';
  }else{
   check(curEv.title==='新君登基','传代入口错误');const input=document.querySelector('#minput');if(input)input.value='承平';clickChoice();check(S.gen===2,'改元未完成');reread();close();
   let e=officialEntries().find(e=>e.p.name==='许长风');check(e&&e.p.commission?.title==='河堤修缮','国舅或差事丢失');check(!S.consorts.includes(e.c),'旧妃错误进入新后宫');
   if(scene==='official'){
    A.go('official',e.key);check(document.querySelector('#panel').textContent.includes('国舅'),'亲缘称谓未显示');
    const btn=[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('赐书问候'));check(btn&&!btn.disabled,'新朝无法联系外臣');btn.click();clickChoice();reread();close();A.go('official',e.key);
    check(officialEntry(e.key).p.id===e.p.id,'官员身份改变');result='传代、国舅主页、在办差事、问候按钮、存读档';
   }else{A.go('family');check(document.querySelector('#panel').textContent.includes('太后母家与先朝外戚'),'家族入口缺失');check(document.querySelector('#panel').textContent.includes('许长风'),'家族成员丢失');scrollTo('太后母家与先朝外戚');result='传代改元、太后母家、国舅与外祖父、旧家族、存读档';}
  }
  document.documentElement.dataset.personalContextCheck='passed';const label=document.createElement('p');label.textContent='浏览器校验通过 · '+result;label.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;margin:0;padding:8px;background:#214b3d;color:white;text-align:center;font-size:14px';document.body.appendChild(label);
 }catch(error){document.documentElement.dataset.personalContextCheck='failed';const el=document.createElement('pre');el.textContent='浏览器校验失败：'+error.message;el.style.cssText='position:fixed;inset:0;z-index:99999;background:white;color:#a00;padding:40px';document.body.appendChild(el);}
})();
