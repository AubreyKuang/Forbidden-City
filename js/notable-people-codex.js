function notablePeopleCodex(){
 if(!S||journalContentVersion()<21)return '';
 const p=xieAn(),preview=p||{name:'谢安',storyPerson:'xiean',age:22,seed:433,official:2,alive:true,portraitOverride:433};
 const status=!p?'尚未相遇':!officialAlive(p)?'已故':p.xiean.widowed?'旧人长留':p.married?'奉旨尚主':'上京诗客';
 return `<article class="story-consort-card" data-notable="xiean"><div class="story-consort-picture">${porImg(preview,224)}<span class="tag y">${status}</span></div><div class="story-consort-copy"><h3>谢安 · 上京诗客</h3><p>惊才绝艳，疏朗自持。诗名满京华，偏不肯以声名换仕途。此为游戏原创固定人物，并非历史人物生平复刻。</p><dl><dt>世家与来处</dt><dd>${p?esc(xieHouse(p)?.name||p.origin):'初遇时随机系于一个上京世家，也可能是宫中无人入仕的独立谢氏。此后家世与身份固定。'}</dd><dt>相遇方法</dt><dd>出巡 → 微服出宫，在京中书肆有概率听闻诗名。每四个月可再寻访；皇嗣的诗话也可能先传来他的名字。</dd><dt>往来</dt><dd>相识后可从人物页单独召见、听诗、劝仕。他自称酒囊饭袋，辞官并非待价而沽；江湖往来只是传言。</dd><dt>婚后相处</dt><dd>成年公主倾慕后可议婚。他会明确辞婚；若奉旨尚主，仍温柔负责，绝不纳妾。婚初一年分房，可劝夫妻多相伴；妻子先逝则终身不再娶。</dd></dl><div class="acts">${p?`<button class="btn jade" onclick="A.go('scholar','${p.id}')">查看谢安与人物纪事</button>`:'<button class="btn jade" onclick="A.go(\'out\')">去京中走走</button>'}</div></div></article>`;
}
