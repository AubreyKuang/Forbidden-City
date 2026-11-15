const {boot}=require('./playtest-harness.cjs');
function world(){const b=boot(821);b.run(`A.start();drain();S.turn=60;S.year=6;S.month=1;S.consorts=[];S.children=[];S.rel={};E().sur='萧';E().energy=10;E().treasury=900;
 var c=makeGirl({sur:'沈',given:'知微',age:23,trait:'温婉',fam:{t:'吏部尚书',p:78}});addConsort(c,4,'入宫');c.solitary=null;var h=houseOf(c);h.relatives=[];
 h.brother={id:'marriage-brother',name:'沈明远',sur:'沈',age:25,career:'official',appointedAt:0,post:'礼部主事',office:'礼部主事',alive:true,married:false,story:[],seed:27};houseOf(c);var key=c.id+':brother';
 var other=makeGirl({sur:'魏',given:'清微',age:24,trait:'温婉',fam:{t:'礼部侍郎',p:65}});addConsort(other,4,'入宫');other.solitary=null;var oh=houseOf(other);oh.relatives=[];
 var sister=addNatalPerson(other,oh,'f',22,791,false);sister.married=false;delete sister.spouse;delete sister.betrothal;sister.willing=false;sister.marriageChecked=S.turn;
 var k=makeKid(other,'f','清宁');k.born=S.turn-15*12;delete k.pendingName;
 var scholar=makeScholar();scholar.name='陆怀瑾';scholar.sur='陆';scholar.age=25;scholar.office='翰林院编修';S.scholars=[scholar];
 for(var p of [h.brother,sister,k,scholar])p.marriageNature={temperament:'温厚',hobby:'books',spending:'节俭',space:'喜欢相伴'};
 var ref=officialMarriageRef(courtPerson(key)),br={kind:'family',id:sister.id,host:other.id,gen:S.gen},kr={kind:'princess',id:k.id,gen:S.gen};
 var option=(label)=>{var i=curEv.choices.findIndex(x=>x.t.includes(label));if(i<0)throw Error('Missing choice '+label+' in '+curEv.title);choose(i);};
 var agree=(r,b)=>{var man=officialMarriagePerson(r),bride=officialMarriageBride(b),offer=officialMarriageOffers(man);offer.answers[officialBrideToken(b)]=officialMarriageAnswer(man,bride);return offer.round;};
 PalaceActions.reset();`);return b;}
module.exports={world};
