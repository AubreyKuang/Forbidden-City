const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./playtest-harness.cjs');
const {world}=require('./official-marriage-world.cjs');
const begin=(seed=42001)=>{const b=boot(seed);b.ctx.assert=assert;b.run(`A.start();drain();E().energy=10;E().treasury=1000;PalaceActions.reset();
  var until=(title)=>{for(let n=0;modalOpen&&curEv.title!==title&&n<60;n++){if(modalResult)nextEv();else choose(0);}assert.equal(curEv?.title,title);};
  var pickChoice=(label)=>{var i=curEv.choices.findIndex(x=>x.t.includes(label));if(i<0)throw Error('Missing choice '+label+' in '+curEv.title);choose(i);};
  var rolling=(value,fn)=>{var old=Math.random;Math.random=()=>value;try{return fn();}finally{Math.random=old;}};
  var always=(fn)=>rolling(.001,fn),never=(fn)=>rolling(.999,fn);`);return b;};

test('a new reign is reminded to set up the Jinyiwei, and the reminder can set them up',()=>{
 const b=boot(42002);b.ctx.assert=assert;
 b.run(`A.start();for(let n=0;modalOpen&&curEv.title!=='御前提醒 · 设立锦衣卫'&&n<20;n++){if(modalResult)nextEv();else choose(0);}
  assert.equal(curEv.title,'御前提醒 · 设立锦衣卫');assert.match(curEv.text,/治国理政 → 锦衣卫/);
  assert.equal(curEv.choices[0].t,'稍后再议');assert.ok(curEv.choices[1].primary);
  choose(1);assert.ok(jinyiwei());assert.equal(jinyiweiAccessionReminder(),null);drain();`);
 const later=boot(42003);later.ctx.assert=assert;
 later.run(`A.start();drain();assert.equal(jinyiwei(),null);assert.ok(S.log.some(x=>x.t.includes('暂缓设立锦衣卫')));`);
});

test('a child the Jinyiwei verify as the husband\'s is no longer labelled of unclear parentage, and emperor fatherhood is likelier',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`officialMarriageConfirm(ref,br,agree(ref,br));E().energy=20;E().treasury=1000;A.establishJinyiwei();choose(0);drain();
  assert.equal(outsideImperialPercent(),72);
  beginNatalPregnancy(other,sister,{unconfirmed:true});Object.assign(sister.natalPregnancy,{imperialParentage:false,husbandSuspects:false,difficult:false});
  S.turn=sister.natalPregnancy.due;natalPregnancyTick();var child=oh.relatives.find(p=>p.parentRelativeId===sister.id);
  for(let n=0;modalOpen&&curEv.title!=='锦衣卫密报 · 宫外添丁'&&n<5;n++)choose(0);
  choose(0);drain();var q=child.outsideParentage.privateInquiry;S.turn=q.due;outsidePaternityTick();
  assert.equal(curEv.title,'锦衣卫回奏 · 宫外生父');assert.match(curEv.text,/标签将撤去/);assert.match(curEv.choices[0].t,/撤去身世未明/);
  choose(0);drain();
  assert.equal(child.unconfirmedParentage,undefined);assert.equal(child.outsideParentage.status,'cleared');
  assert.doesNotMatch(outsideChildBadge(child),/身世未明/);assert.equal(hasUnclearBirthRecord(child),false);
  assert.match(outsideParentagePanel(other,child),/锦衣卫已核明生父/);assert.match(child.story.at(-1).t,/撤去/);`);
});

test('the dowager proposes her kin more often, and less often after each refusal',()=>{
 const b=begin();
 b.run(`var d=ensureDowager();assert.ok(d?.alive);assert.equal(dowagerProposalShare(d),.2);
  for(var c of S.consorts)c.clan='other-clan';d.lastOffer=null;d.kinRefusals=0;
  var ev=dowagerProposal(d);assert.equal(ev.title,'太后荐人');pushEv(ev);pickChoice('婉拒');
  assert.equal(d.kinRefusals,1);assert.equal(d.cooldown,36);assert.equal(dowagerProposalShare(d),.08);
  d.kinRefusals=3;assert.equal(dowagerProposalShare(d),.02);`);
});

test('envoys are chosen through one picker per country and report back in person',()=>{
 const b=begin(42004);
 b.run(`var html=diplomacyPanel();assert.doesNotMatch(html,/sendDiplomaticEnvoy/);assert.equal((html.match(/diplomacyEnvoyPicker/g)||[]).length,3);
  assert.match(html,/diplomacy-card/);assert.match(html,/使臣须为在京任职的朝臣/);
  A.diplomacyEnvoyPicker('sea');assert.equal(curEv.title,'邦交 · 遣使海岚');pickChoice('商议通商');
  assert.equal(curEv.title,'邦交 · 商议通商');assert.ok(curEv.choices.length>1);choose(0);
  var m=diplomacyState().missions[0];assert.equal(m.kind,'trade');assert.match(modalResult?.text||$('#mbox').innerHTML,/三个月后回奏/);drain();
  assert.match(diplomacyPanel(),/出使中/);S.turn=m.due;diplomacyTick();
  assert.equal(curEv.title,'使臣回奏 · 海岚');drain();
  var county=officialEntries().find(e=>officialServing(e.p))?.p;county.office=county.post='县令';county.away=false;
  assert.equal(diplomacyEnvoyInCapital(county),false);assert.ok(!diplomacyEnvoyEntries().some(e=>e.p===county));`);
});

test('a virtuous consort summoned night after night asks the emperor to visit the others',()=>{
 const b=begin(42005);
 b.run(`var c=makeGirl({trait:'温婉',age:20});addConsort(c,4,'入宫');c.virtue=86;c.scheme=18;c.known=true;
  assert.ok(consortTraitLabels(c).some(r=>r.name==='贤良淑德'));E().energy=10;
  never(()=>{nightWith(c);drain();nightWith(c);drain();});assert.equal(S.flags.nightStreak.count,2);never(()=>nightWith(c));
  assert.equal(curEv.title,'春宵');assert.equal(Q[0].title,'贤良 · 枕边进言');nextEv();
  assert.equal(curEv.title,'贤良 · 枕边进言');assert.match(curEv.text,/连着第三回/);choose(0);
  assert.equal(S.flags.nightStreak.count,0);assert.match(c.story.at(-1).t,/枕边进言/);drain();
  var bold=makeGirl({trait:'骄纵',age:20});addConsort(bold,4,'入宫');bold.virtue=40;
  never(()=>{for(let i=0;i<3;i++){nightWith(bold);if(i<2)drain();}});assert.ok(!Q.some(e=>e.title==='贤良 · 枕边进言'));drain();`);
});

test('a forceful queen may ask to raise the eldest prince and is relieved once she does',()=>{
 const b=begin(42006);
 b.run(`var q=empress();q.trait='骄矜';q.age=24;var mother=S.consorts.find(c=>c!==q&&!c.maid);
  var k=makeKid(mother,'m','长安');k.born=S.turn-12;delete k.pendingName;
  always(()=>queenEldestRequestMonth());assert.equal(curEv.title,'中宫请养 · 皇长子');assert.match(curEv.text,/嫡长之议/);
  choose(0);assert.equal(k.foster,q.id);assert.equal(xinOf(q),'释然');assert.ok(q.story.some(e=>e.t.startsWith('【中宫释怀】')));
  assert.match(modalResult.text,/如释重负|舒了一口气/);drain();
  S.flags.queenHeirFeelings={};queenHeirFeelings({gen:S.gen,turn:S.turn-1,children:[]});
  assert.ok(!q.story.some(e=>e.t.startsWith('【中宫子嗣心事】')));`);
});

test('senior consorts without children worry, and another consort\'s pregnancy weighs on them',()=>{
 const b=begin(42007);
 b.run(`var q=empress();q.enteredAt=S.turn-30;var mother=S.consorts.find(c=>c!==q&&!c.maid);mother.preg=2;
  assert.equal(childlessAnxious(q),true);pushEv(pregEvent(mother));pickChoice('赏');
  assert.ok(q.story.some(e=>e.t.startsWith('【闻喜心事】')));assert.match(modalResult.text,/闻讯心绪低落/);drain();
  S.turn+=13;always(()=>childlessAnxietyMonth());assert.ok(q.story.some(e=>e.t.startsWith('【子嗣心事】')));`);
});

test('a sister admitted with children may bring her daughter; sons stay in the original family',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`sister.married=true;sister.spouse={id:'former-husband',name:'周文',sur:'周',alive:true};
  var girl=addNatalPerson(other,oh,'f',6,3301,false);girl.parentRelativeId=sister.id;girl.sur='周';girl.name='周'+girl.given;
  var boy=addNatalPerson(other,oh,'m',4,3302,false);boy.parentRelativeId=sister.id;
  admitMarriedSister(other,sister,false);var g=byId(sister.id);
  for(let n=0;modalOpen&&!curEv.title.endsWith('孩子随行')&&n<10;n++){if(modalResult)nextEv();else choose(0);}
  assert.match(curEv.title,/孩子随行/);assert.match(curEv.text,/男孩，按宫规不能随母入宫/);assert.match(curEv.text,/周小姐/);
  choose(0);assert.equal(girl.motherWard.consortId,g.id);assert.equal(girl.motherWard.address,'周小姐');assert.equal(boy.motherWard,undefined);
  assert.match(natalStatus(girl),/随母居/);assert.match(marriedSisterChildrenPanel(g),/随母入宫的女儿/);drain();`);
});

test('sisters in the palace share more scenes, and their father hears of it',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`var younger=makeGirl({sur:c.sur,age:20,trait:'活泼'});addConsort(younger,3,'入宫');younger.house=c.house;younger.fatherId=c.fatherId;
  c.kin={...c.kin,[younger.id]:'亲妹'};younger.kin={[c.id]:'亲姐'};S.rel[rk(c,younger)]=60;
  var h=houseOf(c);assert.ok(h.father);h.father.alive=true;
  var old=Math.random;Math.random=()=>.001;try{palaceSisterBondsMonth();}finally{Math.random=old;}
  assert.ok(c.story.some(e=>e.t.includes('【宫中姐妹】')));assert.ok(younger.story.some(e=>e.t.includes('【宫中姐妹】')));
  assert.ok(h.father.story.some(e=>e.t.includes('【欣慰】')));
  S.rel[rk(c,younger)]=-40;S.turn+=13;Math.random=()=>.001;try{palaceSisterBondsMonth();}finally{Math.random=old;}
  assert.ok(h.father.story.some(e=>e.t.includes('【难过】')));`);
});

test('the cousin introduced for a childhood betrothal can be visited at home',()=>{
 const b=world();b.ctx.assert=assert;
 b.run(`var cousin=addNatalPerson(other,oh,'f',30,4401,false);cousin.natalCollateral=true;cousin.married=true;cousin.spouse={id:'cousin-husband',name:'李衡',sur:'李',alive:true};
  assert.equal(marriedSisterAvailable(other,cousin),false);
  cousin.betrothalIntroduction={host:other.id,turn:S.turn};
  assert.equal(marriedSisterAvailable(other,cousin),true);assert.match(marriedSisterVisitButton(other,cousin),/到她的住所求见/);
  var g=makeNatalConsort(other,cousin);assert.match(g.kin[other.id],/^堂/);`);
});

test('a consort who long admired Ayimu is excited by the news and befriends her first',()=>{
 const b=begin(42008);
 b.run(`E().age=20;var admirer=ensurePalaceWhiteSpringAdmirer();assert.ok(admirer);assert.notEqual(admirer,empress());
  assert.equal(admiresWhiteSpring(admirer),true);assert.ok(admirer.story.some(e=>e.t.startsWith('【仰慕阿依慕】')));
  assert.equal(ensurePalaceWhiteSpringAdmirer(),null);
  var ay=storyCastCreate('ayimu').person;storyCastAdmit(ay,storyCastRecord('ayimu'),'准白泉公主留宫');
  until('闻讯 · 白泉公主入宫');assert.match(admirer.story.at(-1).t,/闻讯欣喜/);drain();
  meetWhiteSpringMerchants();assert.equal(admirer.whiteSpringFriend.princess,ay.id);assert.ok(admirer.story.some(e=>e.t.startsWith('【愿追随阿依慕】')));`);
});

test('Shen Qingyi\'s old letter shows her portrait and a scene illustration',()=>{
 const b=begin(42009);
 b.run(`var ev=palacePetition('qingyi');assert.ok(ev.portraitArt.src.includes('story-cast/qingyi.webp'));assert.equal(ev.illustration,'frontier-family-letter');
  pushEv({...ev,valid:()=>true});assert.equal(curEv.title,'沈清漪 · 姑苏递来的旧信');var html=$('#mbox').innerHTML;assert.match(html,/event-full-portrait/);assert.match(html,/沈清漪自己的字/);assert.match(html,/data-illustration="frontier-family-letter"/);`);
});
