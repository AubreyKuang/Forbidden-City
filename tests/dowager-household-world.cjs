const {world:base}=require('./official-marriage-world.cjs');
function world(){const b=base();b.run(`var d=ensureDowager();d.alive=true;d.lastOffer=S.turn;delete d.conversations;delete d.household;delete d.feeling;d.story=[];d.mood=65;c.clan=d.clan;other.clan='魏|礼部侍郎';c.favor=55;other.favor=20;S.children=[];var cid=c.id,oid=other.id;PalaceActions.reset();`);return b;}
module.exports={world};
