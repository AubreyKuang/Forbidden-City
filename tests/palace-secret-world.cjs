const {world}=require('./official-marriage-world.cjs');
function secretWorld(kind='clear'){
 const b=world();b.run(`A.establishJinyiwei();choose(0);drain();E().energy=10;E().treasury=900;
 var guard=jinyiwei().commander;guard.ability=90;var cid=c.id,kid=k.id;
 var setupSecret=(kind)=>{
  if(kind==='clear'){k.parentage={father:{...k.birthTraits.father},status:'suspected',clue:{kind:'whisper',text:'起居簿有疑点'}};return;}
  if(kind==='loss'){Object.assign(c,{preg:5,scheme:90,virtue:10,favor:70,swapAsked:false});beginConcealedLoss(c);return;}
  if(kind==='swap'||kind==='no-swap'){c.preg=8;c.swapAsked=false;planBirthSwap(c,c,kind==='no-swap');k.mom=c.id;k.momName=fullName(c);k.sex='f';settleBirthSwap(c,k);return;}
  var prince=makeKid(other,'m','承安');prince.born=S.turn-20*12;prince.adult=true;prince.title='宁王';c.enteredAt=S.turn-1;c.aff=20;c.favor=20;
  var pairKey=prince.id+'-'+c.id;palaceRomanceState().pairs[pairKey]={key:pairKey,prince:prince.id,consort:c.id,stage:3,status:'concealed',pending:false,known:false,started:S.turn-12,place:'yh'};
  if(kind==='romance')return;
  k.parentage={father:{kind:'prince',id:prince.id,name:E().sur+prince.name,gen:S.gen},status:'hidden',claimedFather:E().sur+E().name};
 };
 var currentCase=()=>palaceCases().find(x=>x.kind==='palace-secret');
 `);b.force(...Array(30).fill(0));b.run(`setupSecret('${kind}');PalaceActions.reset();`);
 // Do not leave setup's forced draws in the gameplay queue.
 b.run(`Math.random=()=>0;`);return b;
}
module.exports={secretWorld};
