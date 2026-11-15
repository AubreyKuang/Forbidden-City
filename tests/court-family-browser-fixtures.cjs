/* Deterministic disposable saves for real browser imports. */
const fs=require('node:fs'),path=require('node:path'),{boot}=require('./playtest-harness.cjs');
function world(){const b=boot(717);b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.children=[];S.rel={};S.scholars=[];E().energy=20;E().treasury=2000;
 var a=makeGirl({sur:'沈',given:'知微',age:32,trait:'温婉',fam:{t:'吏部尚书',p:70}}),b=makeGirl({sur:'许',given:'清容',age:30,trait:'持重',fam:{t:'镇国大将军',p:70}}),q=makeGirl({sur:'陆',given:'明华',age:42,trait:'善妒',fam:{t:'知府',p:40}});
 for(var c of [a,b,q]){addConsort(c,c===q?8:3,'选秀入宫');delete c.solitary;delete c.timeTraveler;c.aff=75;c.hp=95;c.enteredAt=0;c.xin={k:'平和',t:60};}
 var ah=houseOf(a),bh=houseOf(b),wife=addNatalPerson(a,ah,'f',24,32134,false);wife.given='清月';wife.name='沈清月';wife.married=false;wife.willing=true;delete wife.spouse;delete wife.betrothal;wife.marriageChecked=S.turn;
 bh.brother={id:'test-husband',name:'许长风',sur:'许',age:32,post:'江南知府',office:'江南知府',career:'official',alive:true,ability:80,merit:65,trust:70,story:[]};houseOf(b);
 var husband=bh.brother,e=officialEntry(b.id+':brother'),person=courtPerson(e.key),match={kind:'alliance',name:husband.name,sur:b.sur,desc:'许清容的兄长',consortId:b.id,personId:husband.id,role:'brother'};
 var wed=()=>marrySister(a,wife,match,{source:'奉旨赐婚'});
 var report=(outcome='success')=>{husband.report={title:'河堤修缮',text:outcome==='success'?'十二段河堤全部验收，工簿与实地相合。':'十二段河堤仅修完五段，剩余险段仍漏水。',outcome,turn:S.turn,office:husband.office};};
 var setupExam=()=>{var k=makeKid(q,'f','昭宁');k.born=S.turn-20*12;k.pendingName=false;k.willing=true;var p=makeScholar();p.name='顾闻道';p.sur='顾';p.age=27;p.examRank='探花';p.office=p.post='翰林院编修';p.willing=true;S.scholars.push(p);return {p,k};};
 var setupJyw=()=>{S.jinyiwei={commander:{id:'jyw-test',name:'程秉直',sur:'程',age:36,alive:true,career:'official',office:'锦衣卫指挥使',ability:90,trust:60,merit:30,seed:4,story:[],official:3,artPortrait:273},established:30,searched:{}};};
 UI.view='government';PalaceActions.reset();`);return b;}
const scenarios={
 'report-good':`wed();report();PalaceActions.reset();A.officialReport(e.key)`,
 'report-bad':`wed();report('setback');PalaceActions.reset();A.officialReport(e.key)`,
 'widow-permission':`wed();officialDeath(b,'brother','前线遇伏，力战殉国。','battle');S.turn+=6;PalaceActions.reset();A.widowFuture(a.id,wife.id)`,
 'widow-visit':`wed();officialDeath(b,'brother','前线遇伏，力战殉国。','battle');S.turn+=6;wife.visit={host:a.id,from:S.turn,until:S.turn+2};PalaceActions.reset();A.natalMeet(a.id,wife.id)`,
 'sister-pregnancy':`wed();beginNatalPregnancy(a,wife);wife.natalPregnancy.difficult=false;wife.visit={host:a.id,from:S.turn,until:S.turn+2};PalaceActions.reset();A.natalMeet(a.id,wife.id)`,
 'sister-birth':`wed();beginNatalPregnancy(a,wife);wife.natalPregnancy.difficult=false;S.turn+=9;natalPregnancyTick();UI.view='natal';UI.sel=a.id+':'+wife.id;PalaceActions.reset();save('auto')`,
 'sister-death':`wed();beginNatalPregnancy(a,wife);wife.natalPregnancy.difficult=true;S.turn+=9;natalPregnancyTick();UI.view='official';UI.sel=e.key;PalaceActions.reset();save('auto')`,
 'exam-marriage':`setupExam();PalaceActions.reset();A.examMarriage(S.scholars[0].id)`,
 'exam-refusal':`var x=setupExam();x.k.willing=false;PalaceActions.reset();A.examMarriage(x.p.id)`,
 'exam-roster':`setupExam();S.scholars=[];ministryState().examDue=S.turn+1;PalaceActions.reset();A.endMonth();for(var guard=0;modalOpen&&!curEv.title.includes('钦点三甲')&&guard<40;guard++){if(modalResult)nextEv();else choose(curEv.choices.findLastIndex(c=>!c.cond||c.cond()));}`,
 'jinyiwei-clue':`setupJyw();wed();report('setback');createJinyiweiClue(jinyiweiClueSources()[0]);PalaceActions.reset();A.jinyiweiClue(jinyiwei().clues[0].id)`,
 'gouyi':`PalaceActions.reset();A.out('procession')`
};
if(require.main===module){const out=process.argv[2]||'/tmp/palace-court-family-fixtures';fs.mkdirSync(out,{recursive:true});for(const [name,script] of Object.entries(scenarios)){const b=world();b.run(script);fs.writeFileSync(path.join(out,name+'.json'),b.run('JSON.stringify(PalaceActions.payload())'));}console.log('Wrote '+Object.keys(scenarios).length+' scenarios.');}
module.exports={world,scenarios};
