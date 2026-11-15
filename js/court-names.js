/* 新生成的朝臣和家人扩名；旧人物不改名，旧事务仍用原字库重放。 */
const COURT_SURNAMES=[...new Set([...SUR,'赵','钱','孙','李','周','吴','王','陈','冯','卫','蒋','徐','袁','杜','程','邵','石','贺','陶','邹','尹','曹','严','范','魏','潘','韦','邵','薛','段','萧','姚','邢','阎','任','邵','孔','邓','欧阳','司马'])];
const COURT_GIVEN=[...new Set([...FATHER_NAMES,...BROTHER_NAMES,
  ...'秉文 秉直 秉衡 秉礼 敬修 敬亭 敬言 敬明 守仁 守诚 守正 守成 文昭 文蔚 文简 文谦 文瀚 文澄 文彦 文叙 延清 延礼 延章 延庭 元礼 元章 元晖 元恺 元祯 元修 允恭 允和 允中 允诚 允执 允文 景明 景初 景澄 景和 景元 景章 景珩 景谦 季同 季衡 季舒 季文 仲礼 仲谦 仲庭 仲明 伯承 伯钧 伯渊 伯昭 仲甫 彦博 彦清 彦章 彦修 彦昭 彦卿 砚舟 砚池 砚庭 怀章 怀信 怀谦 怀素 怀川 怀璋 绍文 绍庭 绍安 绍礼 绍衡 承礼 承允 承谦 承晖 承简 承勋 致知 致和 致诚 致中 思源 思敬 思勉 思衡 思恭 思诚 修竹 修文 修齐 修平 修诚 修明 希声 希文 希仁 希贤 昭衡 昭文 昭远 昭庭 昭礼 明允 明达 明谦 明甫 明诚 明章 崇礼 崇信 崇文 崇岳 崇安 尚德 尚义 尚贤 尚文 经纶 经纬 济川 济民 济安 济远 瑞庭 瑞章 鹤鸣 鹤卿 鹤年 松年 松龄 松庭 柏舟 柏言 柏青 知行 知礼 知远 知章 知节 闻道 闻礼 闻达 惟清 惟敬 惟中 惟正 维桢 维岳 维章 维翰 维新 庭玉 庭琛 庭璋 世衡 世泽 世杰 世勋 国桢 国梁 国维 国钧 安澜 安平 安节 云程 云阶 云鹤 云岑 望岳 望川 振铎 振纲 振武 定远 定邦 定安 定方 靖川 靖远 靖平 靖边 克明 克勤 克俭 克诚 怀瑜 怀钧 怀锋 勉之 慎之 敏之 靖之 安之 求真 应辰 应元 应祥 应麟 孟章 孟谦 孟达 彦 澄 衡 铎 朴 岑 恪 诠 祯 桢 琮 逵 弼 钧 翰 韬 岳 宽 毅 谦 谨 敞 翊 慎 谟'.split(' ')])];
const courtNamesActive=()=>typeof journalContentVersion==='function'&&journalContentVersion()>=15;
function courtUsedNames(){
  const names=new Set(),seen=new Set();
  // Read the saved graph only: naming must not create households or consume RNG.
  const walk=o=>{if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(typeof o.name==='string')names.add(o.name);
    for(const [k,v] of Object.entries(o))if(!['story','npcMemory','pendingActions','history','log'].includes(k))walk(v);};
  walk(S);return names;
}
function courtGivenName(sur,seed,{used=courtUsedNames(),taboo=new Set(),reservedGiven=new Set()}={}){
  const pool=COURT_GIVEN,start=(seed>>>0)%pool.length,ok=g=>!used.has(sur+g)&&!reservedGiven.has(g)&&![...g].some(ch=>taboo.has(ch));
  for(let i=0;i<pool.length;i++){const g=pool[(start+i)%pool.length];if(ok(g))return g;}
  // Finite deterministic fallback even with a fixed RNG; never append digits to names.
  const first=[...'文景怀承绍思敬允明昭元庭维秉靖弘修彦季仲伯云清知守崇安'],last=[...'礼诚正谦衡章远清平安明川岳钧璋琛珩桢翰初宁言和信'];
  for(const a of first)for(const b of last)if(ok(a+b))return a+b;
  // A very long dynasty may exhaust a surname. A third character keeps identities distinct.
  for(const a of first)for(const b of last)for(const c of last)if(ok(a+b+c))return a+b+c;
  throw new Error('此姓可用姓名已尽');
}
