// The public annals survive the rolling activity log. The sealed register is separate.
const regnalChronicleActive=outerHouseholdUpdates;
const regnalAccessionMarker=/^━━ 第.+代 ━━ /;

function regnalLogKind(text,backfill=false){
  if(/新帝.+登基/.test(text)&&(/改元.+大赦天下。$/.test(text)||regnalAccessionMarker.test(text)))return '登基';
  if(text.endsWith('，开选秀，各地秀女入宫待选。')||text.startsWith('选秀定榜，')||text==='选秀礼毕，本次未留新人。')return '选秀';
  if(/^立.+为皇太子。$/.test(text))return '立储';
  if(/庙号.+。$/.test(text)&&/崩于养心殿|自缢于宫中/.test(text))return '帝纪终篇';
  if(backfill&&/，帝认皇[子女].+，入玉牒。$/.test(text))return '归宗';
  if(backfill&&/^[^：]+：[恩正]科殿试，钦点状元，授/.test(text))return '科举';
  return null;
}

function regnalLogEntries(gen,skipEntry){
  let reign=S.gen-S.log.filter(e=>regnalAccessionMarker.test(e.t)).length;
  const entries=[];
  for(const entry of S.log){
    if(regnalAccessionMarker.test(entry.t))reign++;
    if(reign!==gen||entry===skipEntry)continue;
    const kind=regnalLogKind(entry.t,true);
    if(kind)entries.push({kind,d:entry.d,t:entry.t,turn:gen===S.gen?selectionLogTurn(entry.d):null});
  }
  return entries;
}

function openRegnalChronicle(skipEntry){
  S.regnalChronicles||=[];
  let book=S.regnalChronicles.find(b=>b.gen===S.gen);
  if(!book){
    book={gen:S.gen,era:E().era,emperor:E().sur+E().name,entries:regnalLogEntries(S.gen,skipEntry)};
    S.regnalChronicles.push(book);
  }
  return book;
}

function recordRegnalEntry(kind,text,d=dateStr(),turn=S.turn,source){
  if(!regnalChronicleActive())return;
  const book=openRegnalChronicle(source);
  if(book.closedAt||kind==='归宗'&&book.entries.some(e=>e.kind===kind&&e.d===d&&e.t===text))return;
  book.entries.push({kind,d,t:text,turn});
}

function recordRegnalLog(entry){
  const kind=regnalLogKind(entry.t);
  if(kind)recordRegnalEntry(kind,entry.t,entry.d,S.turn,entry);
}

function closeRegnalChronicle(){
  if(!regnalChronicleActive())return;
  const book=openRegnalChronicle();
  book.closedAt ||= dateStr();
  if(outerBook())outerBook().closedTurn??=S.turn;
}

function viewRegnalChronicle(){
  const gen=Number(UI.sel)||S.gen;
  const summary=S.history[gen-1];
  const book=(S.regnalChronicles||[]).find(b=>b.gen===gen)||{
    era:gen===S.gen?E().era:summary?.era,
    emperor:gen===S.gen?E().sur+E().name:summary&&summary.sur+summary.name,
    entries:regnalLogEntries(gen)
  };
  const title=book.era?'皇帝本纪 · '+book.era:'皇帝本纪';
  const status=book.closedAt?`${book.emperor} · ${book.closedAt}定稿`:book.emperor||'';
  const reigns=S.history.slice(0,S.gen-1).map((record,i)=>({gen:i+1,era:record.era}));
  reigns.push({gen:S.gen,era:E().era});
  const links=reigns.filter(reign=>reign.gen!==gen).map(({gen:n,era})=>
    outerLink('第'+cnNum(n)+'代 · '+era,`A.go('regnal',${n})`)).join(' ');
  const rows=[...book.entries].sort((a,b)=>a.turn==null||b.turn==null?0:a.turn-b.turn);
  return pageHeading(title,status,outerLink('返回起居注',"A.go('log')"))+links+
    (rows.length?'<ol class="story">'+rows.map(e=>`<li><time>${esc(e.d)} · ${esc(e.kind)}</time><p>${esc(e.t)}</p></li>`).join('')+'</ol>':'<p>尚无可查的本纪条目。</p>');
}
