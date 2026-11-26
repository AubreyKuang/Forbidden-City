/* TapTap H5 host. TapTap injects a global `tap` object; in a normal browser it is
   absent and this file does nothing. The game has no server: the login code that
   tap.login returns is never sent anywhere. Logging in lets the host run its own
   account, real-name and play-time checks. Play is never blocked on the result. */
const TapTapHost=(()=>{
  const host=()=>typeof globalThis.tap?.login==='function';
  let state='none',started=false;
  function login(){
    if(!host())return Promise.resolve(false);
    state='pending';
    return new Promise(resolve=>{
      try{
        globalThis.tap.login({
          success(){state='ok';resolve(true);},
          fail(error){state='failed';console.warn('TapTap login:',error?.errMsg||error);resolve(false);}
        });
      }catch(error){state='failed';console.warn('TapTap login:',error);resolve(false);}
    });
  }
  function start(){
    if(started||!host())return;
    started=true;
    globalThis.document?.documentElement?.classList?.add('taptap-host');
    login();
  }
  // The host may inject `tap` after the first scripts run.
  start();
  globalThis.addEventListener?.('load',start);
  return {get inHost(){return host();},get state(){return state;},login};
})();
