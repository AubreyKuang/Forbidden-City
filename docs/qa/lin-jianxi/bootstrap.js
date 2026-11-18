(()=>{
 const scenes=JSON.parse(document.getElementById('lin-demo-data').textContent);
 const requested=new URLSearchParams(location.search).get('scene');
 const key=Object.hasOwn(scenes,requested)?requested:'profile';
 const scene=scenes[key];
 localStorage.setItem('chengongji_v1_auto',JSON.stringify(scene.world));
 A.load('auto');
 if(!S||PalaceActions.blocked)throw Error('林见溪的试玩存档未能恢复。');
 if(scene.view==='fenghua')A.go(scene.view,'linJianxi');
 else if(scene.view!=='event')A.go(scene.view,scene.id);
 document.querySelector(`[data-lin-demo-scene="${key}"]`)?.setAttribute('aria-current','page');
 document.documentElement.dataset.linDemo='ready';
})();
