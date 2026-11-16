/* ============ 像素立绘（逐像素生成） ============ */
const PC=document.createElement('canvas');PC.width=48;PC.height=60;const pcx=PC.getContext('2d');
const POR=new Map();
const SKINS=[['#fbe4d3','#f0c6ae','#e2aa92'],['#f6d7be','#e8b795','#d39c7a'],['#fdebdf','#f3cdb9','#e5b39c']];
const HAIRS=[['#1b1421','#3b2c47','#665276'],['#2a1914','#4f3429','#7a5644'],['#131319','#2f2f3d','#505068']];
const IRIS=['#4a2c1e','#70401f','#30233d','#3b2b1a','#5a2a24'];
const INK='#2a1712',GOLD='#e8b84a',GOLDD='#a87a26',RED='#d0303a',JADE='#5fb08f',PEARL='#f7f1e3',LASH='#1d1218',EW='#fffaf2';
const PIBO=['#f6c9d4','#cfe3f2','#e6dcf6','#f8e6b8','#d6eedf','#fbd9c4'];
function portrait(sp){
  const key=JSON.stringify(sp);if(POR.has(key))return POR.get(key);
  const W=48,H=60,g=new Array(W*H).fill(null),r=mulberry32(sp.seed||7);
  const set=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)g[y*W+x]=c};
  const get=(x,y)=>(x>=0&&y>=0&&x<W&&y<H)?g[y*W+x]:null;
  const clr=(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)g[y*W+x]=null};
  const ell=(cx,cy,rx,ry,c,f)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const d=((x-cx)/rx)**2+((y-cy)/ry)**2;if(d<=1&&(!f||f(x,y,d)))set(x,y,typeof c==='function'?c(x,y,d):c)}};
  const hole=(cx,cy,rx,ry)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)clr(x,y)};
  const rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(x+i,y+j,c)};
  const flower=(x,y,c1,c2)=>{set(x,y,'#ffe08a');set(x-1,y,c1);set(x+1,y,c1);set(x,y-1,c1);set(x,y+1,c1);set(x-1,y-1,c2);set(x+1,y+1,c2);set(x+1,y-1,c2);set(x-1,y+1,c2)};
  const sk=SKINS[r()*3|0],hr=HAIRS[r()*3|0],iris=IRIS[r()*5|0],es0=r()*4|0,es=sp.elder?3:es0,mark=r()<.22,hd=r()*4|0,mouth=r()*2|0,extraFlower=r()<.4;
  const k=sp.kind,cx=24;
  if(k==='baby'){
    ell(cx,47,17,14,'#c8323a');for(let i=0;i<10;i++){set(9+i*3,46+(i%2)*4,GOLD);set(10+i*3,47+(i%2)*4,GOLD)}ell(cx,40,10,3.5,'#f7efe2',(x,y)=>y<=41);
    ell(cx,33,10,9.5,(x,y,d)=>d>.7&&x>cx+3?sk[1]:sk[0]);
    ell(cx,25,11,7,'#e8862a',(x,y)=>y<=27);ell(cx-9,19,3,3,'#e8862a');ell(cx+9,19,3,3,'#e8862a');set(cx-9,19,'#f6c9d4');set(cx+9,19,'#f6c9d4');
    rect(cx-3,21,7,1,'#5a2a10');rect(cx,20,1,4,'#5a2a10');rect(cx-2,23,5,1,'#5a2a10');for(let x=cx-10;x<=cx+10;x+=4)set(x,26,'#7a3d14');set(cx-6,22,'#fff');set(cx+6,22,'#fff');
    [cx-6,cx+4].forEach(x=>{set(x,33,LASH);set(x+1,32,LASH);set(x+2,33,LASH)});
    ell(cx-7,36,2,1,'#f4a0a8');ell(cx+7,36,2,1,'#f4a0a8');set(cx,38,'#d9536a');set(cx+1,38,'#d9536a');
  } else {
    const child=k==='boy'||k==='girl',male=k==='emp'||k==='prince'||k==='boy',adultF=k==='f';
    const fy=child?32:28,frx=child?10:8.6,fry=child?9.2:9.6,sy=child?44:41;
    // 后发
    if(adultF){ell(cx,fy-3,12.5,13,hr[0],(x,y)=>y<=fy+9);if(sp.hs===4||sp.hs===5){rect(cx-14,fy,5,22,hr[0]);rect(cx+10,fy,5,22,hr[0]);for(let y=fy+2;y<fy+22;y+=3){set(cx-12,y,hr[1]);set(cx+12,y,hr[1])}}}
    if(k==='girl')ell(cx,fy-3,11.5,11,hr[0],(x,y)=>y<=fy+6);
    // 衣袍
    const robe=sp.robe,rD=shade(robe,-.25),rL=shade(robe,.25),lin=sp.lin||'#f7efe2',lin2=shade(robe,.5);
    for(let y=sy;y<H;y++){const hw=Math.min(23.5,(male&&!child?10.5:8.5)+(y-sy)*1.2);for(let x=Math.round(cx-hw);x<=Math.round(cx-1+hw);x++)set(x,y,x>cx-1+hw-4?rD:robe)}
    for(let x=cx-10;x<cx-3;x++)set(x,sy+1,rL);
    const pat=child?-1:(adultF?(sp.pat===undefined?0:sp.pat):0),cs=adultF?(sp.cs||0):0;
    const onR=(x,y)=>{const c0=get(x,y);return c0===robe||c0===rD};
    if(pat===0){for(let y=sy+5;y<H-3;y+=5)for(let x=cx-21+((y/5|0)%2)*4;x<cx+21;x+=8)if(onR(x,y)){set(x,y,rL);set(x+1,y,rL);set(x+1,y-1,rL);set(x+2,y,rL)}}
    else if(pat===1){for(let y=sy+5;y<H-2;y+=6)for(let x=cx-20+((y/6|0)%2)*3;x<cx+21;x+=7)if(onR(x,y)){set(x-1,y,rL);set(x+1,y,rL);set(x,y-1,rL);set(x,y+1,rL);set(x,y,lin)}}
    else if(pat===2){for(const [px,py] of [[cx-13,sy+11],[cx+12,sy+11],[cx-6,H-4],[cx+6,H-4]])for(let y=py-3;y<=py+3;y++)for(let x=px-3;x<=px+3;x++){const d=((x-px)/3)**2+((y-py)/3)**2;if(d<=1&&onR(x,y))set(x,y,d>.45?rL:(d<.15?lin:rD))}}
    else if(pat===3){for(let i=0;i<15;i++){const x=cx-21+i*3,y=H-2-Math.round(i*.9);if(onR(x,y)){set(x,y,'#5a3a2a');if(onR(x+1,y))set(x+1,y,'#5a3a2a')}if(i%2&&onR(x,y-2)){set(x,y-2,'#f6b3c4');set(x+1,y-2,'#fbd7e2')}}}
    else if(pat===4){for(let x=cx-22;x<cx+22;x+=4)for(let y=sy+3;y<H;y++)if(onR(x,y))set(x,y,rL)}
    else if(pat===5){for(let y=H-3;y<H;y++)for(let x=0;x<W;x++)if(onR(x,y))set(x,y,y===H-3?lin:lin2)}
    if(cs===1){for(let y=sy-1;y<H;y++){for(let x=cx-2;x<=cx+1;x++)set(x,y,sp.inner||lin);set(cx-3,y,lin2);set(cx-4,y,lin2);set(cx+2,y,lin2);set(cx+3,y,lin2)}}
    else if(cs===2){ell(cx,sy,5.6,2.6,lin2,(x,y)=>y>=sy-1);ell(cx,sy,3.6,1.4,lin);for(let i=0;i<6;i++)set(cx+4+i,sy+2+i,lin2)}
    else if(cs===3){for(let y=sy+1;y<H;y++)set(cx,y,lin2);rect(cx-4,sy-2,9,3,lin);rect(cx-4,sy,9,1,lin2);[3,6,9,12].forEach(d=>{set(cx-1,sy+d,GOLD);set(cx+1,sy+d,GOLD)})}
    else{for(let i=0;i<12;i++){set(cx-5+i,sy-1+i,lin);set(cx-4+i,sy-1+i,lin);set(cx-3+i,sy-1+i,lin2)}for(let i=0;i<7;i++){set(cx+5-i,sy-1+i,lin);set(cx+4-i,sy-1+i,lin2)}}
    if(adultF&&sp.fur){const fw='#f6f3ec',fg='#d8d0c4';for(let y=sy;y<sy+3;y++){const hw=Math.min(23.5,8.5+(y-sy)*1.2)+1;for(let x=Math.round(cx-hw);x<=Math.round(cx-1+hw);x++)if(Math.abs(x-cx)>2)set(x,y,(x*7+y*3)%5?fw:fg)}for(let x=0;x<W;x++)if(get(x,H-1)){set(x,H-1,x%3?fw:fg);set(x,H-2,(x+1)%4?fw:fg)}}
    if(!child){const sc=k==='emp'?'#8a1c1c':(sp.rank>=6?GOLD:shade(robe,-.45));for(let x=0;x<W;x++)if(get(x,H-6)){set(x,H-6,sc);set(x,H-5,sc)}set(cx+2,H-4,sc);set(cx+2,H-3,sc);set(cx+1,H-2,GOLD);set(cx+3,H-2,GOLD)}
    if(adultF&&sp.pibo&&!sp.fur&&cs!==2){const pb=sp.pibo,pb2=shade(pb,-.14);
      for(const s of[-1,1])for(let d=7;d<=16;d++){const y=sy+1+Math.floor((d-7)/3),x=cx+s*d-(s>0?1:0);set(x,y,pb);set(x,y+1,pb2)}
      for(const s of[-1,1])for(let y=sy+4;y<H;y++){const x=cx+s*(17+Math.floor((y-sy)/8))-(s>0?1:0);set(x,y,pb);set(x+s,y,pb2)}}
    if(k==='emp'){for(const dx of[-7,8]){ell(cx+dx,sy+9,3.4,3.4,'#c0392b');ell(cx+dx,sy+9,2,2,GOLD);set(cx+dx,sy+9,'#c0392b');set(cx+dx-1,sy+8,'#c0392b')}for(let x=4;x<44;x+=3)if(get(x,H-1))set(x,H-1,'#5b86c4')}
    if(k==='prince'&&sp.crown){ell(cx-7,sy+9,2.6,2.6,GOLD);set(cx-7,sy+9,'#c0392b')}
    // 颈、脸
    rect(cx-3,fy+8,6,sy-fy-7,sk[1]);set(cx-3,fy+9,sk[2]);set(cx+2,fy+9,sk[2]);
    const face=(x,y,d)=>(d>.72&&(x>cx+2||y>fy+5))?sk[1]:sk[0];
    ell(cx,fy-1,frx,fry-1,face);ell(cx,fy+3,frx-2.6,6.2,face,(x,y)=>y>=fy);
    if(male){set(cx-frx-1,fy+1,sk[1]);set(cx-frx-1,fy+2,sk[1]);set(cx+frx,fy+1,sk[1]);set(cx+frx,fy+2,sk[1])}
    // 眼睛：眼白、虹膜、瞳孔、高光、睫毛
    const ey=child?fy+1:fy;
    const eye=(x0,fl)=>{const X=i=>fl?x0+4-i:x0+i;
      if(male&&!child){for(let i=0;i<5;i++)set(X(i),ey,LASH);set(X(-1),ey-1,LASH);set(X(4),ey+1,EW);set(X(0),ey+1,EW);for(let i=1;i<=3;i++)set(X(i),ey+1,iris);set(X(2),ey+1,'#120a10');set(X(1),ey+1,shade(iris,.45));for(let i=1;i<=3;i++)set(X(i),ey+2,sk[2]);return}
      const rows=(es===3&&!child)?2:3;
      for(let i=1;i<=3;i++)set(X(i),ey-3,sk[2]);
      for(let i=0;i<5;i++)set(X(i),ey-1,LASH);set(X(-1),ey-1,LASH);
      if(es===0||es===3)set(X(-1),ey-2,LASH);else set(X(0),ey-2,LASH);
      set(X(0),ey,LASH);if(es===2){set(X(0),ey+1,LASH);set(X(-1),ey+1,LASH)}
      set(X(4),ey,EW);set(X(4),ey+1,EW);if(rows===3)set(X(4),ey+2,EW);
      for(let j=0;j<rows;j++)for(let i=1;i<=3;i++)set(X(i),ey+j,j===0?shade(iris,-.35):iris);
      set(X(2),ey+1,'#120a10');set(X(1),ey,'#ffffff');set(X(3),ey+1,'#fff3ea');if(child)set(X(2),ey,'#ffffff');
      if(rows===3)set(X(3),ey+2,shade(iris,.45));
      for(let i=1;i<=3;i++)set(X(i),ey+rows,sk[2])};
    eye(cx-8,false);eye(cx+4,true);
    // 眉
    if(male){rect(cx-9,ey-4,5,1,hr[0]);rect(cx+5,ey-4,5,1,hr[0]);set(cx-9,ey-3,hr[0]);set(cx+9,ey-3,hr[0]);set(cx-5,ey-5,hr[0]);set(cx+5,ey-5,hr[0])}
    else{const by=ey-4;[[cx-9,0],[cx-8,-1],[cx-7,-1],[cx-6,-1],[cx-5,0]].forEach(([x,d],i)=>set(x,by+d,i===0?hr[1]:hr[0]));[[cx+9,0],[cx+8,-1],[cx+7,-1],[cx+6,-1],[cx+5,0]].forEach(([x,d],i)=>set(x,by+d,i===0?hr[1]:hr[0]))}
    // 鼻、口、腮红
    set(cx,ey+4,sk[1]);set(cx+1,ey+5,sk[2]);
    const my=child?ey+7:ey+8,LIP=male?'#b0655a':'#d9536a';
    if(child){set(cx,my,LIP);set(cx+1,my,LIP)}
    else if(male){rect(cx-1,my,3,1,LIP)}
    else{set(cx-1,my,LIP);set(cx,my,shade(LIP,-.2));set(cx+1,my,LIP);set(cx,my+1,shade(LIP,.25));if(mouth===1){set(cx-2,my-1,shade(LIP,.35));set(cx+2,my-1,shade(LIP,.35))}}
    if(!male||child){const bc='#f4a0a8',bc2='#f8c4c4';[cx-7,cx+7].forEach(x=>{set(x-1,ey+4,bc2);set(x,ey+4,bc);set(x+1,ey+4,bc2);set(x,ey+5,bc2)})}
    if(adultF&&mark)set(cx+8,ey+3,'#6b3a2a');
    if(k==='emp'&&sp.age>=28){set(cx-3,my-1,hr[0]);set(cx-2,my-1,hr[0]);set(cx+2,my-1,hr[0]);set(cx+3,my-1,hr[0])}
    if(k==='emp'&&sp.age>=40)rect(cx-1,my+2,3,3,hr[0]);
    // 发型与冠饰
    if(k==='emp'){
      ell(cx,fy-9,10,6.5,'#1b1b24',(x,y)=>y<=fy-6);ell(cx,fy-14,6.5,4.5,'#1b1b24');rect(cx-10,fy-6,21,1,GOLD);
      rect(cx-19,fy-12,8,3,'#1b1b24');rect(cx+12,fy-12,8,3,'#1b1b24');set(cx-19,fy-11,GOLD);set(cx+19,fy-11,GOLD);
      [[0,-17],[-2,-16],[2,-16],[-1,-15],[1,-15],[0,-14],[-3,-15],[3,-15]].forEach(([dx,dy])=>set(cx+dx,fy+dy,GOLD));set(cx,fy-15,RED);
      rect(cx-10,fy-5,2,6,hr[0]);rect(cx+9,fy-5,2,6,hr[0]);
    } else if(k==='prince'){
      ell(cx,fy-7,10,6,hr[0],(x,y)=>y<=fy-5);rect(cx-10,fy-5,2,7,hr[0]);rect(cx+9,fy-5,2,7,hr[0]);for(let x=cx-5;x<cx+4;x++)set(x,fy-11,hr[1]);
      ell(cx,fy-14,4,3,hr[0]);rect(cx-5,fy-14,11,2,sp.crown?GOLD:'#cfd6dd');rect(cx-1,fy-16,3,1,sp.crown?GOLD:'#cfd6dd');set(cx,fy-17,sp.crown?RED:JADE);for(let i=0;i<5;i++)set(cx+6+i,fy-14-(i%2),GOLD);
    } else if(k==='boy'){
      ell(cx,fy-6,10.5,5,hr[0],(x,y)=>y<=fy-4);for(let x=cx-8;x<=cx+8;x+=3)set(x,fy-3,hr[0]);
      ell(cx-8,fy-11,3.4,3.4,hr[0]);ell(cx+8,fy-11,3.4,3.4,hr[0]);set(cx-9,fy-12,hr[1]);set(cx+7,fy-12,hr[1]);rect(cx-9,fy-8,3,1,RED);rect(cx+7,fy-8,3,1,RED);set(cx-10,fy-7,RED);set(cx+10,fy-7,RED);
    } else if(k==='girl'){
      ell(cx,fy-6,11,5.4,hr[0],(x,y)=>y<=fy-3);rect(cx-10,fy-3,21,1,hr[0]);for(let x=cx-9;x<=cx+9;x+=2)set(x,fy-2,hr[0]);
      ell(cx-10,fy-11,4,4,hr[0]);ell(cx+10,fy-11,4,4,hr[0]);set(cx-11,fy-13,hr[1]);set(cx+9,fy-13,hr[1]);
      flower(cx-10,fy-7,'#f07a9a','#f9c0cf');flower(cx+10,fy-7,'#f07a9a','#f9c0cf');rect(cx-11,fy+1,2,8,hr[0]);rect(cx+10,fy+1,2,8,hr[0]);
    } else {
      const hs=sp.hs,bang=sp.bang;
      ell(cx,fy-7,10.6,7.4,hr[0],(x,y)=>y<=fy-6);
      if(bang===0){for(let y=fy-9;y<=fy-6;y++){const w=Math.round((y-(fy-10))*1.4);for(let x=cx-w;x<=cx+w-1;x++)set(x,y,sk[0])}}
      else if(bang===1){for(let y=fy-8;y<=fy-6;y++)for(let x=cx;x<=cx+8-(fy-6-y)*2;x++)set(x,y,sk[0])}
      else if(bang===2){rect(cx-9,fy-6,19,1,hr[0]);for(let x=cx-9;x<=cx+9;x+=3)set(x,fy-5,hr[0])}
      else{for(let y=fy-9;y<=fy-6;y++){const w=Math.round((y-(fy-10))*0.9);for(let x=cx-w;x<=cx+w-1;x++)set(x,y,sk[0])}set(cx-4,fy-5,hr[0]);set(cx+3,fy-5,hr[0])}
      rect(cx-11,fy-6,3,14,hr[0]);rect(cx+9,fy-6,3,14,hr[0]);set(cx-10,fy+8,hr[0]);set(cx+10,fy+8,hr[0]);
      for(let y=fy-4;y<fy+7;y+=3){set(cx-10,y,hr[1]);set(cx+10,y,hr[1])}
      for(let x=cx-7;x<=cx+5;x++){const y=fy-12+Math.round(Math.abs(x-cx+1)/3);set(x,y,(x%3)?hr[1]:hr[2])}
      if(hs===0){ell(cx,fy-17,6.4,5,hr[0]);for(let x=cx-3;x<=cx+2;x++)set(x,fy-20,hr[1]);set(cx-4,fy-19,hr[2])}
      else if(hs===1){ell(cx-8,fy-16,4.4,5.4,hr[0]);ell(cx+8,fy-16,4.4,5.4,hr[0]);hole(cx-8,fy-16,1.6,2.2);hole(cx+8,fy-16,1.6,2.2);ell(cx,fy-13,6.5,2.8,hr[0]);set(cx-10,fy-19,hr[1]);set(cx+6,fy-19,hr[1])}
      else if(hs===2){ell(cx+7,fy-15,7.4,4.6,hr[0]);ell(cx-3,fy-14,5.4,3.4,hr[0]);for(let x=cx+3;x<=cx+10;x++)set(x,fy-18,hr[1])}
      else if(hs===3){ell(cx,fy-20,3.6,7.5,hr[0]);ell(cx-8,fy-14,3.8,3.2,hr[0]);ell(cx+8,fy-14,3.8,3.2,hr[0]);set(cx-1,fy-25,hr[1]);set(cx-1,fy-23,hr[1])}
      else if(hs===4){ell(cx,fy-14,6.8,3.2,hr[0]);set(cx-2,fy-16,hr[1]);set(cx+1,fy-16,hr[1])}
      else{ell(cx-4,fy-16,5.6,3.6,hr[0]);ell(cx+3,fy-20,4.6,3.2,hr[0]);ell(cx+7,fy-17,3,2.4,hr[0]);set(cx-5,fy-18,hr[1]);set(cx+2,fy-22,hr[1])}
      const rank=sp.rank||0,fc=[['#e85a7a','#f6b3c4'],['#f0a23a','#ffd88a'],['#c46ad0','#e8c0f0'],['#e84a4a','#ff9a8a']][hd];
      if(sp.crown){
        rect(cx-11,fy-12,23,3,GOLD);for(let x=cx-10;x<=cx+10;x+=4){set(x,fy-11,RED);set(x+1,fy-12,'#ffe7a0')}
        [[0,-20],[-1,-19],[1,-19],[-3,-18],[3,-18],[-5,-17],[5,-17],[-2,-17],[2,-17],[-1,-16],[0,-16],[1,-16],[0,-15],[-6,-16],[6,-16],[-7,-15],[7,-15]].forEach(([dx,dy])=>set(cx+dx,fy+dy,GOLD));set(cx,fy-18,RED);set(cx-6,fy-17,RED);set(cx+6,fy-17,RED);
        for(const s of[-1,1]){const x=cx+s*12-(s>0?1:0);for(let y=fy-9;y<=fy+1;y++)set(x,y,y%2?PEARL:'#d9d0c0');set(x,fy+2,RED)}
        set(cx,fy-8,PEARL);set(cx,fy-7,RED);
      } else {
        const px=hs===2?cx+11:cx+6,py=hs===3?fy-21:fy-17;
        for(let i=0;i<6;i++)set(px+i,py-i,rank>=2?GOLD:'#c8c8d6');set(px+6,py-6,rank>=3?RED:JADE);
        if(rank>=3){for(let y=py-5;y<=py-1;y++)set(px+6,y,GOLDD);set(px+6,py,PEARL);set(px+6,py+1,RED);set(px+5,py+1,GOLDD);set(px+5,py+2,PEARL)}
        if(rank>=5){const qx=cx-7,qy=fy-17;for(let i=0;i<5;i++)set(qx-i,qy-i,GOLD);for(let y=qy-4;y<=qy;y++)set(qx-5,y,GOLDD);set(qx-5,qy+1,PEARL);set(qx-5,qy+2,JADE);rect(cx-4,fy-12,8,1,rank>=6?GOLD:JADE);for(let x=cx-4;x<cx+4;x+=2)set(x,fy-11,rank>=6?GOLDD:'#3f8a6e')}
        if(rank>=6){[[0,0],[1,-1],[2,-1],[3,-2],[4,-2],[5,-3],[2,-2],[3,-3]].forEach(([dx,dy])=>set(cx-9+dx,fy-20+dy,GOLD));set(cx-4,fy-23,RED)}
        flower(hs===1?cx:cx-8,hs===1?fy-12:fy-13,fc[0],fc[1]);if(rank>=4||extraFlower)flower(cx+9,fy-12,fc[0],fc[1]);
        if(bang===0||bang===3){const x0=cx,y0=fy-7;if(hd===0){set(x0,y0,RED);set(x0-1,y0,RED);set(x0,y0-1,RED);set(x0-1,y0-1,'#ffe08a')}else if(hd===1){set(x0,y0,RED);set(x0,y0+1,RED)}else if(hd===2){set(x0-1,y0,RED);set(x0,y0-1,GOLD);set(x0+1,y0,RED)}else{set(x0,y0,GOLD)}}
      }
      if(rank>=2||sp.crown){const ec=rank>=5?JADE:PEARL;for(const x of[cx-12,cx+11]){set(x,fy+3,GOLD);set(x,fy+4,ec);set(x,fy+5,ec)}}
      if(sp.elder){for(let i=0;i<g.length;i++){if(g[i]===hr[1]||g[i]===hr[2])g[i]='#b8b4be';else if(g[i]===hr[0]&&i%7===0)g[i]='#8a8692'}rect(cx-10,fy-7,21,2,'#3b2a33');set(cx,fy-7,JADE);set(cx,fy-6,JADE);set(cx-4,ey+6,sk[2]);set(cx+4,ey+6,sk[2]);set(cx-9,ey+1,sk[2]);set(cx+9,ey+1,sk[2]);for(const x of[cx-8,cx-7,cx-6,cx+6,cx+7,cx+8])set(x,ey+4,sk[0]);set(cx-7,ey+5,sk[0]);set(cx+7,ey+5,sk[0])}
    }
  }
  const out=g.slice();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(g[i])continue;if(get(x-1,y)||get(x+1,y)||get(x,y-1)||get(x,y+1))out[i]=INK}
  pcx.clearRect(0,0,W,H);
  for(let i=0;i<W*H;i++)if(out[i]){pcx.fillStyle=out[i];pcx.fillRect(i%W,Math.floor(i/W),1,1)}
  const url=PC.toDataURL();POR.set(key,url);return url;
}
function porSpec(x){
  if(x.official!==undefined)return {kind:'prince',seed:x.seed,robe:x.official%2?'#8d4e37':'#3c6a68'};
  if(x&&x.isMom)return {kind:'f',seed:x.seed,hs:0,bang:2,robe:'#6e5a4c',rank:2,cs:1,pat:1,lin:'#efe6d6',elder:true};
  if(x==='emp'){const e=E();return {kind:'emp',seed:e.seed,robe:'#e8b52c',age:e.age}}
  if(x.sex){const a=kidAge(x);
    if(a<3)return {kind:'baby',seed:x.seed};
    if(a<12)return {kind:x.sex==='m'?'boy':'girl',seed:x.seed,robe:x.sex==='m'?'#4a7fb5':'#e79ab4'};
    return x.sex==='m'?{kind:'prince',seed:x.seed,robe:S.heir===x.id?'#d9a92f':'#3b5fa8',crown:S.heir===x.id}:{kind:'f',seed:x.seed,hs:x.seed%2?1:4,bang:2,robe:'#e07a9c',rank:4,pibo:PIBO[x.seed%6]}}
  if(x.maid)return {kind:'f',seed:x.seed,hs:4,bang:2,robe:seasonTint('#7f9db3'),rank:0,cs:0,pat:5,lin:'#eef2f4',fur:S&&season()===3};
  return {kind:'f',seed:x.seed,hs:x.seed%6,bang:(x.seed>>3)%4,robe:seasonTint(robeOf(x)),rank:x.rank,crown:x.rank===8&&!x.cold,
    pibo:(x.seed>>12)%3?PIBO[(x.seed>>5)%6]:null,cs:(x.trait==='将门'||x.t2==='擅骑射')?2:[0,1,3,0][(x.seed>>6)%4],pat:(x.seed>>9)%6,lin:LINS[(x.seed>>14)%4],
    fur:!!S&&season()===3&&!x.cold};
}
const RPAL=[['#9fb3a8','#a9b8c9','#c9b8a6','#b7c4a0','#c4b0c8','#d8c9a8'],['#8fb8d6','#9ccaa4','#e3a3b8','#d8b26a','#b9a3dc','#e8c5a0','#7fb3b0'],
  ['#c26f93','#5d8fc4','#4f9a7a','#b0588a','#d07a4a','#7c6cc2','#c24f5d'],['#a8243a','#2f5aa8','#7a2e7e','#b5651d','#1f6f6a','#8e1f4f'],['#d9a92f','#c0392b']];
const LINS=['#f7efe2','#fbe3ea','#e6f2ea','#fbf0d2'];
const rTier=r=>r<=1?0:r<=3?1:r<=5?2:r<=7?3:4;
function robeOf(x){if(x.maid)return '#7f9db3';const p=RPAL[rTier(x.rank)];return (x.robeC&&p.includes(x.robeC))?x.robeC:p[(x.seed>>2)%p.length]}
function seasonTint(c){return S?shade(c,[.1,.2,0,-.1][season()]):c}
const PORTRAIT_WIDTH=112,PORTRAIT_HEIGHT=140,PORTRAIT_COLUMNS=4;
const portraitAtlas=document.createElement('img');
const familyAtlas=document.createElement('img');
const descendantAtlas=document.createElement('img');
const beautyAtlas=document.createElement('img');
const youngRoyalAtlas=document.createElement('img');
const FAMILY_PORTRAIT_START=28;
const DESCENDANT_PORTRAIT_START=44;
const LEGACY_DESCENDANT_VARIANTS=10;
const ROYAL_GROWTH_SETS={f:[380,383,392,395],m:[386,389]};
const DESCENDANT_VARIANTS=29+ROYAL_GROWTH_SETS.m.length;
const EXISTING_PRINCE_VARIANTS=4;
const EXTRA_PRINCE_VARIANTS=LEGACY_DESCENDANT_VARIANTS-EXISTING_PRINCE_VARIANTS;
const BEAUTY_PORTRAIT_START=92, YOUNG_ROYAL_PORTRAIT_START=136, PORTRAIT_COUNT=489;
// Opening-generation dowagers only. Inherited empresses keep their saved faces.
const DOWAGER_PORTRAITS=Object.freeze(Array.from({length:18},(_,i)=>441+i));
// Reserved story art never enters the random consort pools. Stable zero-based IDs.
const STORY_CONSORT_PORTRAITS=Object.freeze({gouyi:422,hongjian:438});
// Dedicated story characters are bound with portraitOverride, outside random pools.
const STORY_NPC_PORTRAITS=Object.freeze({capitalNoble:433,shangguanLantai:435,gaoHuaibi:436,jiShuye:437,xueHongjian:438,sunYunxiu:439,liuZhaoshuang:440});
const PRINCESS_VARIANTS=33+ROYAL_GROWTH_SETS.f.length;
const EXPANDED_ROYAL_START=294;
const EMPEROR_PORTRAITS=[12,13,312,313,314,315];
const EMPEROR_PORTRAIT_LABELS={12:'原版青年',13:'原版壮年',312:'温润青年',313:'英武青年',314:'威严壮年',315:'儒雅长者'};
const portraitVariantCount=child=>child.sex==='f'?PRINCESS_VARIANTS:DESCENDANT_VARIANTS;
const portraitSheets=[
  {start:0,rows:7,scale:2,src:'./assets/images/palace-portraits-b.webp?v=original-hd-1',image:portraitAtlas},
  {start:FAMILY_PORTRAIT_START,rows:4,scale:2,src:'./assets/images/palace-family.webp?v=original-hd-1',image:familyAtlas},
  {start:DESCENDANT_PORTRAIT_START,rows:12,scale:2,src:'./assets/images/palace-descendants.webp?v=original-hd-1',image:descendantAtlas},
  {start:BEAUTY_PORTRAIT_START,rows:11,scale:2,src:'./assets/images/palace-beauties.webp?v=1',image:beautyAtlas},
  {start:YOUNG_ROYAL_PORTRAIT_START,rows:9,scale:2,src:'./assets/images/palace-young-royals.webp?v=1',image:youngRoyalAtlas},
  {start:172,rows:9,scale:2,src:'./assets/images/palace-young-royals-2.webp?v=1',image:document.createElement('img')},
  {start:208,rows:2,scale:2,src:'./assets/images/palace-regalia.webp?v=1',image:document.createElement('img')},
  {start:216,rows:6,scale:2,src:'./assets/images/palace-royal-regalia.webp?v=1',image:document.createElement('img')},
  {start:240,rows:2,scale:4,src:'./assets/images/palace-gentle-portraits.webp?v=1',image:document.createElement('img')},
  {start:248,rows:5,scale:4,src:'./assets/images/palace-consorts-expanded.webp?v=1',image:document.createElement('img')},
  {start:268,rows:7,scale:4,src:'./assets/images/palace-relatives-expanded.webp?v=1',image:document.createElement('img')},
  {start:294,rows:5,scale:4,src:'./assets/images/palace-royals-expanded.webp?v=1',image:document.createElement('img')},
  {start:312,rows:1,scale:4,src:'./assets/images/palace-emperors-expanded.webp?v=1',image:document.createElement('img')},
  {start:316,rows:6,scale:4,src:'./assets/images/palace-consorts-legends.webp?v=1',image:document.createElement('img')},
  {start:340,rows:2,scale:4,src:'./assets/images/palace-consorts-foreign.webp?v=1',image:document.createElement('img')},
  {start:346,rows:3,scale:4,src:'./assets/images/palace-consorts-finery.webp?v=1',image:document.createElement('img')},
  {start:358,rows:4,scale:4,src:'./assets/images/palace-consorts-closeups.webp?v=1',image:document.createElement('img')},
  {start:371,rows:3,scale:4,src:'./assets/images/palace-consorts-flowers.webp?v=1',image:document.createElement('img')},
  {start:380,rows:3,scale:4,src:'./assets/images/palace-royal-growth.webp?v=1',image:document.createElement('img')},
  {start:392,rows:2,scale:4,src:'./assets/images/palace-princess-petite-growth.webp?v=1',image:document.createElement('img')},
  {start:398,rows:6,scale:4,src:'./assets/images/palace-officials-expanded.webp?v=1',image:document.createElement('img')},
  {start:422,rows:1,scale:4,src:'./assets/images/palace-consort-gouyi.webp?v=1',image:document.createElement('img')},
  {start:423,rows:2,scale:4,src:'./assets/images/palace-jinyiwei.webp?v=1',image:document.createElement('img')},
  {start:429,rows:1,scale:4,src:'./assets/images/palace-officials-selected.webp?v=1',image:document.createElement('img')},
  {start:433,rows:1,scale:4,src:'./assets/images/palace-capital-noble.webp?v=1',image:document.createElement('img')},
  {start:434,rows:1,scale:4,src:'./assets/images/palace-brother-jade-white.webp?v=1',image:document.createElement('img')},
  {start:435,rows:2,scale:4,src:'./assets/images/palace-fenghua-people.webp?v=1',image:document.createElement('img')},
  {start:441,rows:2,scale:4,src:'./assets/images/palace-dowagers-ceremonial.webp?v=1',image:document.createElement('img')},
  {start:447,rows:2,scale:4,src:'./assets/images/palace-dowagers-daily.webp?v=1',image:document.createElement('img')},
  {start:453,rows:2,scale:4,src:'./assets/images/palace-dowagers-young.webp?v=1',image:document.createElement('img')},
  {start:459,rows:2,scale:4,src:'./assets/images/palace-consorts-colors-one.webp?v=1',image:document.createElement('img')},
  {start:465,rows:2,scale:4,src:'./assets/images/palace-consorts-colors-two.webp?v=1',image:document.createElement('img')},
  {start:471,rows:2,scale:4,src:'./assets/images/palace-consorts-ruqun-pink-green.webp?v=1',image:document.createElement('img')},
  {start:477,rows:2,scale:4,src:'./assets/images/palace-consorts-ruqun-varied.webp?v=1',image:document.createElement('img')},
  {start:483,rows:2,scale:4,src:'./assets/images/palace-consorts-ruqun-legends.webp?v=1',image:document.createElement('img')}
];
const portraitSheet=cell=>portraitSheets.slice().reverse().find(sheet=>cell>=sheet.start)||portraitSheets[0];
function ensurePortraitSheet(cell){const sheet=portraitSheet(cell);if(!sheet.image.src)sheet.image.src=sheet.src;}
function portraitTile(cell,sheet){
  const tile=cell-sheet.start;
  return [(tile%PORTRAIT_COLUMNS)*PORTRAIT_WIDTH,Math.floor(tile/PORTRAIT_COLUMNS)*PORTRAIT_HEIGHT];
}
const atlasCanvas=document.createElement('canvas');
atlasCanvas.width=PORTRAIT_WIDTH;atlasCanvas.height=PORTRAIT_HEIGHT;
const atlasInk=atlasCanvas.getContext('2d');
const ART_CACHE=new Map();

const CONSORT_PORTRAITS=[1,2,3,4,5,6,7,21,...Array.from({length:44},(_,i)=>92+i).filter(cell=>![102,103,134,135].includes(cell)),...Array.from({length:8},(_,i)=>208+i),240,241,242,243,...Array.from({length:20},(_,i)=>248+i).filter(cell=>cell!==263),...Array.from({length:24},(_,i)=>316+i),...Array.from({length:25},(_,i)=>346+i),...Array.from({length:9},(_,i)=>371+i)];
const WESTERN_PORTRAITS=[22,23,24,102,103,134,135,263,340,343];
const EASTERN_PORTRAITS=[341,344],OVERSEAS_PORTRAITS=[342,345];
const COLOR_CONSORT_PORTRAITS=Object.freeze(Array.from({length:30},(_,i)=>459+i));
const NEW_DOMESTIC_CONSORT_PORTRAITS=[...CONSORT_PORTRAITS,...COLOR_CONSORT_PORTRAITS];
const ALL_CONSORT_PORTRAITS=[...NEW_DOMESTIC_CONSORT_PORTRAITS,...WESTERN_PORTRAITS,...EASTERN_PORTRAITS,...OVERSEAS_PORTRAITS];
const PORTRAIT_CLOTHES={
  422:'钩弋夫人·青玉云纹汉衣',
  1:'圆领袍',2:'齐胸襦裙',3:'宋式褙子',4:'窄袖骑装',5:'齐腰襦裙',
  6:'宋式褙子',7:'交领襦裙',10:'交领宫装',21:'宋式褙子',
  22:'西域舞衣',23:'西域舞衣',24:'西域舞衣'
};
// Row-major entries match scripts/build-portrait-atlases.py; IDs never move on expansion.
[
  '齐胸襦裙','宋式褙子','齐腰襦裙','圆领袍','交领襦裙','宋式褙子','齐胸襦裙','窄袖骑装','宋式褙子','交领襦裙','西域舞衣','西域舞衣',
  '交领襦裙','华绣宫装','齐胸襦裙','宋式褙子','宋式褙子','华绣宫装','齐腰襦裙','交领襦裙',
  '交领襦裙','宋式褙子','华绣宫装','交领襦裙','齐腰襦裙','交领襦裙','齐胸襦裙','宋式褙子','华绣宫装','宋式褙子','交领襦裙','齐腰襦裙',
  '宋式褙子','齐胸襦裙','窄袖骑装','齐胸襦裙','交领襦裙','宋式褙子','宋式褙子','华绣宫装','齐腰襦裙','宋式褙子','西域舞衣','西域舞衣'
].forEach((clothes,i)=>{PORTRAIT_CLOTHES[BEAUTY_PORTRAIT_START+i]=clothes;});
for(let cell=208;cell<216;cell++)PORTRAIT_CLOTHES[cell]='盛装华服';
['华绣宫装','宋式褙子','交领襦裙','齐腰襦裙'].forEach((name,i)=>{PORTRAIT_CLOTHES[240+i]=name;});
['交领襦裙','华绣宫装','齐胸襦裙','宋式褙子','窄袖骑装','交领襦裙','华绣宫装','交领襦裙',
 '披帛襦裙','宽袖交领袍','圆领骑装','冬日披风','短袄襦裙','立领长衫',
 '宋式褙子','西域锦衣','长褙甲','短衫襦裙','披帛襦裙','鹤纹圆领袍'].forEach((name,i)=>{PORTRAIT_CLOTHES[248+i]=name;});
['水纹褙子','锦裘披风','绛纱襦裙','牡丹华服','流云宽袖','梅纹长褙甲',
 '玄朱曲裾','半臂披帛','织金长褙甲','茉莉短披','锦绣骑装','云肩霞裙',
 '素衣玉簪','金黄短袄','朱绣云肩','紫绣褙甲','窄袖锦袍','玫色披肩',
 '雪绒冬衣','抱猫春衫','青瓷礼服','绣花襦裙','绛纱灯影','碧格长褙',
 '西域榴金锦衣','东瀛菊纹小袖','海西珍珠宫装','西域艾德莱斯锦衣','东瀛藤色重衣','海西紫金宫装',
 '玄金流云','牡丹霓裳','玉羽流仙','翠影金枝','凤冠霞帔','绛紫珠翠',
 '月华琼宫','敦煌流金','洛水凝碧','牡丹天香','星河紫阙','金霞映雪'].forEach((name,i)=>{PORTRAIT_CLOTHES[316+i]=name;});
['朱金凤华','翠金云肩','海棠珠绣','紫晶莲纹','玄金团花','月白银枝','桂月玉兔','茉莉初雪','玉兰雪裘','月白银枝·近景','桂月珠华·近景','茉莉初雪·近景','玉兰雪裘·近景'].forEach((name,i)=>{PORTRAIT_CLOTHES[358+i]=name;});
['山茶绯玉','梅花雪霁','海棠春酣','幽兰碧岫','紫藤烟霞·近景','虞美人绛绡','紫藤烟霞·半身','牡丹国色·近景','牡丹国色·半身'].forEach((name,i)=>{PORTRAIT_CLOTHES[371+i]=name;});
const consortPortraits=c=>(c.rescue||['西域贡女','西域流寓'].includes(c.fam?.t))?WESTERN_PORTRAITS:c.fam?.t==='东瀛贵族'?EASTERN_PORTRAITS:c.fam?.t==='海西贵族'?OVERSEAS_PORTRAITS:CONSORT_PORTRAITS;
['绛红牡丹','青玉兰香','孔雀蓝鹤','杏金银杏','紫藤书韵','海棠粉绣','墨绿竹影','浅蓝梅雪','橘红回眸','玄金菊华','藕紫莲影','黛蓝书信','冰蓝扶花','粉绿回眸','紫藤香囊','绣球蓝扇','绿粉捧桃','青莲披帛','鹅黄春绦','湖青玉笛','石榴折扇','月白紫藤','蜜桃香囊','青莲书韵','清荷玉露','雪梅红裘','月华绮梦','牡丹金绡','春燕轻纱','玉兰书香'].forEach((name,i)=>{PORTRAIT_CLOTHES[459+i]=name;});

const LEGACY_FATHER_PORTRAITS=[268,269,270,271,276,277,278,282,283,284,288,289,290];
const LEGACY_BROTHER_PORTRAITS=[272,273,274,275,279,280,281,285,286,287,291,292,293];
// Corrected hats/feiyu robes/sabres: guards only, in approved row-major order.
const JINYIWEI_PORTRAITS=Object.freeze([423,424,425,426,427,428]);
const JINYIWEI_PORTRAIT_LABELS=Object.freeze({423:'玄黑金绣',424:'朱红金绣',425:'藏青银绣',426:'墨绿金绣',427:'月白金绣',428:'绛紫金绣'});
// Four explicitly selected cells (0,1,2,4) from the earlier, loose-haired batch.
const SHARED_OFFICIAL_PORTRAITS=Object.freeze([429,430,431,432]);
const BROTHER_ONLY_PORTRAITS=Object.freeze([434]);
const OFFICIAL_PORTRAITS={
  civil:{young:[272,274,275,279,280,281,291,292,293,398,399,400,402,410,411,412,413,414,415,...SHARED_OFFICIAL_PORTRAITS],mature:[268,270,271,276,277,278,288,289,290,401,403]},
  army:{young:[273,285,286,287,404,405,406,408,416,417,418,419,420,421,...SHARED_OFFICIAL_PORTRAITS],mature:[269,282,283,284,407,409]}
};
const FATHER_PORTRAITS=[...LEGACY_FATHER_PORTRAITS,401,403,407,409];
const BROTHER_PORTRAITS=[...LEGACY_BROTHER_PORTRAITS,398,399,400,402,404,405,406,408,410,411,412,413,414,415,416,417,418,419,420,421,...SHARED_OFFICIAL_PORTRAITS,...BROTHER_ONLY_PORTRAITS];
const ALL_OFFICIAL_PORTRAITS=[...FATHER_PORTRAITS,...BROTHER_PORTRAITS,...JINYIWEI_PORTRAITS];
function expandedOfficialPortraitsActive(){return journalContentVersion()>=14;}
function dedicatedJinyiweiPortraitsActive(){return journalContentVersion()>=16;}
function jinyiweiPortraitCell(person){
  if(JINYIWEI_PORTRAITS.includes(person.artPortrait))return person.artPortrait;
  // Render older guards in the new uniform without mutating a saved transcript.
  return JINYIWEI_PORTRAITS[Math.floor(mulberry32(person.seed||7)()*JINYIWEI_PORTRAITS.length)];
}
function assignJinyiweiPortrait(person){person.artPortrait=jinyiweiPortraitCell(person);}
function ordinaryOfficialPortrait(person){
  const pool=OFFICIAL_PORTRAITS[person.official===3?'army':'civil'][person.age>=40?'mature':'young'];
  return pool[Math.floor(mulberry32(person.seed||7)()*pool.length)];
}
// One pool for court officers and consorts' relatives. Identity is assigned once,
// using local seeded randomness so adding artwork never shifts gameplay rolls.
function assignCourtOfficialPortrait(person,bloc,{mature=person.age>=40,house={},peers=[],brother=false}={}){
  if(person.storyPerson==='xiean'||STORY_NPC_PORTRAITS[person.fenghuaKey]!==undefined)return;
  if(person.jinyiwei&&dedicatedJinyiweiPortraitsActive())return assignJinyiweiPortrait(person);
  if(ALL_OFFICIAL_PORTRAITS.includes(person.artPortrait)&&!(journalContentVersion()>=19&&!person.jinyiwei&&JINYIWEI_PORTRAITS.includes(person.artPortrait)))return;
  const basePool=OFFICIAL_PORTRAITS[bloc==='army'?'army':'civil'][mature?'mature':'young'];
  // Preserve pending v20 (and earlier) scenes; new brothers may use the approved white portrait.
  const pool=brother&&!mature&&journalContentVersion()>=21?[...basePool,...BROTHER_ONLY_PORTRAITS]:basePool;
  const cells=dedicatedJinyiweiPortraitsActive()?pool:pool.filter(cell=>!SHARED_OFFICIAL_PORTRAITS.includes(cell));
  const usage=new Map(cells.map(cell=>[cell,0])),seen=new Set();
  const families=[...(S?.consorts||[]),...(S?.cands||[]),...(S?.flags?.frontierHouses||[]).map(x=>x.guest)].filter(Boolean);
  const people=families.flatMap(c=>Object.values(c.house||{}));
  people.push(...Object.values(house),...(S?.scholars||[]),S?.jinyiwei?.commander,...peers);
  for(const p of people){
    if(!p||typeof p!=='object'||p===person||!p.id||seen.has(p.id))continue;
    seen.add(p.id);const cell=p.portraitOverride??p.artPortrait;
    if(usage.has(cell))usage.set(cell,usage.get(cell)+1);
  }
  const start=Math.floor(mulberry32(person.seed||7)()*cells.length);
  let best=cells[start];
  for(let i=1;i<cells.length;i++){const cell=cells[(start+i)%cells.length];if(usage.get(cell)<usage.get(best))best=cell;}
  person.artPortrait=best;
}
function assignOfficialPortrait(person,house,role){
  const father=role==='father';
  if(expandedOfficialPortraitsActive())return assignCourtOfficialPortrait(person,house.bloc,{mature:father,house,brother:/^brother(?:[2-9]\d*)?$/.test(role)});
  // A saved version 13 (or earlier) pending scene must recreate its original faces.
  const cells=father?LEGACY_FATHER_PORTRAITS:LEGACY_BROTHER_PORTRAITS;
  if(cells.includes(person.artPortrait))return;
  const preferred=house.bloc==='army'?(father?[269,282,283,284]:[273,285,286,287]):
    house.bloc==='civil'?(father?[268,270,276,277,278]:[272,274,279,280,281]):
    house.bloc==='kin'?(father?[271,288]:[275,291]):
    house.bloc==='dowager'?(father?[289,277]:[292,272]):(father?[290,289,277]:[293,292,280]);
  // Read already-created households directly: calling houseOf here would recurse.
  const usage=new Map(cells.map(cell=>[cell,0])),seen=new Set();
  for(const c of [...(S?.consorts||[]),...(S?.cands||[])])for(const p of Object.values(c.house||{})){
    if(!p||typeof p!=='object'||p===person||!p.id||seen.has(p.id))continue;
    seen.add(p.id);const cell=p.portraitOverride??p.artPortrait;
    if(usage.has(cell))usage.set(cell,usage.get(cell)+1);
  }
  // Include a household being constructed before it is added to the roster.
  for(const p of Object.values(house))if(p&&typeof p==='object'&&p!==person&&!seen.has(p.id)){
    seen.add(p.id);const cell=p.portraitOverride??p.artPortrait;
    if(usage.has(cell))usage.set(cell,usage.get(cell)+1);
  }
  const start=Math.floor(mulberry32(person.seed||7)()*cells.length);
  const score=cell=>usage.get(cell)*(cells.length+1)+(preferred.includes(cell)?0:1);
  let best=cells[start];
  for(let i=1;i<cells.length;i++){const cell=cells[(start+i)%cells.length];if(score(cell)<score(best))best=cell;}
  person.artPortrait=best;
}
function emperorPortraitCell(e){
  if(e.imperialPortrait===0)return e.age>=40?315:312;
  if(e.imperialPortrait===1)return e.age>=40?314:313;
  return e.age>=40?13:12;
}

function assignConsortPortrait(c,newlyCreated=false){
  if(Object.values(STORY_CONSORT_PORTRAITS).includes(c.artPortrait)||COLOR_CONSORT_PORTRAITS.includes(c.artPortrait))return;
  // Older pending scenes and missing-art migrations retain the original seed mapping.
  // Strict true matters: Array.forEach passes a numeric index to this function.
  const base=consortPortraits(c);
  const cells=newlyCreated===true&&journalContentVersion()>=36&&base===CONSORT_PORTRAITS?NEW_DOMESTIC_CONSORT_PORTRAITS:base;
  if(cells.includes(c.artPortrait))return;
  const usage=new Map(cells.map(cell=>[cell,0]));
  const relatives=(S.children||[]).flatMap(k=>[k.spouse,...Object.values(k.marriageCandidates||{})]).filter(Boolean).map(p=>p.appearance).filter(Boolean);
  const seen=new Set();
  for(const other of [...S.consorts,...(S.cands||[]),...relatives]){
    if(seen.has(other.id))continue;seen.add(other.id);
    const cell=other.portraitOverride??other.artPortrait;
    if(other!==c&&other.alive&&!other.gone&&!other.maid&&usage.has(cell)){
      usage.set(cell,usage.get(cell)+1);
    }
  }
  const start=Math.floor(mulberry32(c.seed||7)()*cells.length);
  let best=cells[start];
  for(let i=1;i<cells.length;i++){
    const cell=cells[(start+i)%cells.length];
    if(usage.get(cell)<usage.get(best))best=cell;
  }
  c.artPortrait=best;
}
function childPortraitVariant(child){
  const ordinal=child.ord>0?child.ord:S.children.filter(k=>k.sex===child.sex).findIndex(k=>k.id===child.id)+1;
  // Old saves derived identity from ten variants. Keep that fallback permanently stable.
  return Number.isInteger(child.portraitVariant)&&child.portraitVariant>=0&&child.portraitVariant<portraitVariantCount(child)?child.portraitVariant:ordinal>0?(ordinal-1)%LEGACY_DESCENDANT_VARIANTS:Math.floor(mulberry32(child.seed||7)()*LEGACY_DESCENDANT_VARIANTS);
}
function assignChildPortrait(child){
  // New adult faces share four childhood sets; keep young siblings distinct too.
  const existing=S.children.filter(k=>k.sex===child.sex);
  const count=portraitVariantCount(child),youngCount=count-(child.sex==='f'?4:0),usage=Array(count).fill(0),youngUsage=Array(youngCount).fill(0);
  const young=v=>child.sex==='f'?(v>=30?v-4:v>=26?v-26:v):v;
  existing.forEach(k=>{const v=childPortraitVariant(k);if(v<count){usage[v]++;youngUsage[young(v)]++;}});
  const score=v=>usage[v]+(existing.length<youngCount?youngUsage[young(v)]*(existing.length+1):0);
  const start=Math.floor(mulberry32(child.seed||7)()*count);
  let best=start;
  for(let i=1;i<count;i++){const v=(start+i)%count;if(score(v)<score(best))best=v;}
  child.portraitVariant=best;
}
function childPortraitCell(child){
  const age=kidAge(child),stage=age<3?0:age<12?1:2;let variant=childPortraitVariant(child);
  // These appended sheets store each identity's three stages consecutively.
  const growthStart=ROYAL_GROWTH_SETS[child.sex]?.[variant-(child.sex==='f'?33:29)];
  if(Number.isInteger(growthStart))return growthStart+stage;
  const expandedVariant=variant-(child.sex==='f'?30:26);
  if(expandedVariant>=0)return EXPANDED_ROYAL_START+(child.sex==='f'?9:0)+stage*3+expandedVariant;
  if(child.sex==='f'&&variant>=26){if(age>=18)return 244+variant-26;variant-=26;}
  if(variant>=22)return 216+(child.sex==='m'?0:12)+stage*4+variant-22;
  if(variant>=LEGACY_DESCENDANT_VARIANTS){
    const extra=variant-LEGACY_DESCENDANT_VARIANTS;
    return YOUNG_ROYAL_PORTRAIT_START+Math.floor(extra/6)*36+(child.sex==='m'?0:18)+stage*6+extra%6;
  }
  if(child.sex==='m'){
    if(variant<EXISTING_PRINCE_VARIANTS)return FAMILY_PORTRAIT_START+stage*EXISTING_PRINCE_VARIANTS+variant;
    return DESCENDANT_PORTRAIT_START+stage*EXTRA_PRINCE_VARIANTS+variant-EXISTING_PRINCE_VARIANTS;
  }
  return DESCENDANT_PORTRAIT_START+3*EXTRA_PRINCE_VARIANTS+stage*LEGACY_DESCENDANT_VARIANTS+variant;
}

function portraitCell(x){
  if(x?.appearance)x=x.appearance;
  const override=(x==='emp'?E():x)?.portraitOverride;
  if(Number.isInteger(override)&&override>=0&&override<PORTRAIT_COUNT&&!(journalContentVersion()>=19&&!x.jinyiwei&&JINYIWEI_PORTRAITS.includes(override)))return override;
  if(x==='emp')return emperorPortraitCell(E());
  if(x.storyPerson==='xiean'||x.personId&&S?.scholars?.some(p=>p.id===x.personId&&p.storyPerson==='xiean'))return STORY_NPC_PORTRAITS.capitalNoble;
  const fixedStoryFace=STORY_NPC_PORTRAITS[x.fenghuaKey]??(x.personId?STORY_NPC_PORTRAITS[S?.scholars?.find(p=>p.id===x.personId)?.fenghuaKey]:undefined);
  if(fixedStoryFace!==undefined)return fixedStoryFace;
  if(x.jinyiwei)return jinyiweiPortraitCell(x);
  if(x.official!==undefined)return journalContentVersion()>=19&&JINYIWEI_PORTRAITS.includes(x.artPortrait)?ordinaryOfficialPortrait(x):ALL_OFFICIAL_PORTRAITS.includes(x.artPortrait)?x.artPortrait:FAMILY_PORTRAIT_START+12+x.official;
  if(x.isMom)return 9;
  if(COLOR_CONSORT_PORTRAITS.includes(x.artPortrait))return x.artPortrait;
  if(x.maid)return CONSORT_PORTRAITS.includes(x.artPortrait)?x.artPortrait:CONSORT_PORTRAITS[Math.floor(mulberry32(x.seed||7)()*CONSORT_PORTRAITS.length)];
  if(x.sex)return childPortraitCell(x);
  if(Object.values(STORY_CONSORT_PORTRAITS).includes(x.artPortrait))return x.artPortrait;
  const cells=consortPortraits(x);
  return cells.includes(x.artPortrait)?x.artPortrait:cells[Math.floor(mulberry32(x.seed||7)()*cells.length)];
}

const jewelryAtlas=document.createElement('img');
function ensureJewelryAtlas(){if(!jewelryAtlas.src)jewelryAtlas.src=JEWELRY_ART;}
function portraitJewelry(rank,id){return JEWELRY[id]|| (rank===8?JEWELRY.phoenix:null);}
// Coordinates are in the stable 112 × 140 portrait tile: brow centre and head width.
// Half-length paintings need much smaller ornaments than the original close-ups.
const PORTRAIT_HEADS={
  433:[61,26,26],
  434:[62,26,26],
  435:[55,40,25],436:[64,40,25],437:[61,42,25],438:[55,44,25],439:[62,48,26],440:[65,41,24],
  441:[62,30,30],442:[51,31,30],443:[61,30,30],444:[63,29,30],445:[61,31,30],446:[57,30,30],
  447:[61,27,30],448:[58,30,29],449:[60,28,30],450:[62,22,30],451:[59,27,30],452:[60,27,30],
  453:[60,29,30],454:[60,30,30],455:[59,28,30],456:[61,29,30],457:[60,28,30],458:[59,29,30],
  459:[54,34,25],460:[53,31,25],461:[54,33,25],462:[53,32,24],463:[53,32,25],464:[51,32,25],
  465:[69,33,28],466:[58,34,28],467:[64,34,28],468:[60,30,28],469:[52,32,28],470:[68,31,28],
  471:[67,31,28],472:[65,30,28],473:[61,30,28],474:[62,32,28],475:[63,31,28],476:[64,31,28],
  477:[63,31,28],478:[64,29,28],479:[66,30,28],480:[62,31,28],481:[63,31,28],482:[65,31,28],
  483:[61,30,28],484:[64,29,28],485:[65,30,28],486:[63,31,28],487:[62,31,28],488:[64,31,28],
  422:[51,38,27],
  248:[47,39,34],249:[59,40,34],250:[65,39,32],251:[66,38,32],252:[60,39,34],253:[54,39,34],254:[59,38,34],255:[59,39,34],
  256:[57,28,23],257:[50,31,27],258:[60,31,27],259:[56,31,27],260:[62,29,27],261:[65,30,25],262:[58,30,27],263:[59,31,27],264:[56,28,25],265:[60,28,26],266:[61,27,26],267:[50,29,27],
  316:[56,24,24],317:[56,24,24],318:[58,25,24],319:[60,25,24],320:[54,37,25],321:[60,24,23],322:[58,22,23],323:[53,24,23],324:[56,24,24],325:[58,26,24],
  326:[54,25,24],327:[57,24,24],328:[60,25,24],329:[62,24,24],330:[56,24,24],331:[59,27,24],332:[56,25,24],333:[50,24,24],334:[55,25,24],335:[56,24,24],
  336:[54,25,24],337:[63,25,24],338:[57,25,24],339:[60,23,24],340:[55,24,24],341:[57,23,24],342:[54,25,24],343:[57,25,24],344:[61,25,24],345:[56,25,24],
  346:[56,28,23],347:[58,29,23],348:[58,25,23],349:[59,26,23],350:[56,28,23],351:[60,25,23],352:[57,26,23],353:[57,27,23],354:[62,27,23],355:[62,25,23],356:[56,26,23],357:[60,26,23],
  363:[55,35,27],364:[42,33,27],365:[54,28,28],366:[42,27,27],371:[55,29,27],372:[50,31,27],373:[56,30,27],377:[61,27,27],379:[59,31,27]
};
function portraitHead(cell){return PORTRAIT_HEADS[cell]||[56,42,38];}
function portraitFrame(cell,bust=false){
  if(!bust)return [0,0,PORTRAIT_WIDTH,PORTRAIT_HEIGHT];
  const [cx,,headWidth]=portraitHead(cell),w=Math.min(112,Math.max(62,headWidth*2.4));
  return [Math.max(0,Math.min(112-w,cx-w/2)),0,w,w*1.25];
}
function fittedPortraitJewelry(cell,rank,id='',head=portraitHead(cell)){
  const ornament=portraitJewelry(rank,id);if(!ornament)return null;
  const full=ornament.cell<3;
  const [cx,brow,headWidth]=head,w=headWidth*(full?1.85:1.12);
  // Smaller half-body heads need the pin seated inside the hair, not outside it.
  const sideOffset=headWidth<=30?.42:.83;
  const box=full?[cx-w/2,Math.max(-2,brow-w*.42-6),w,w]:[cx-headWidth*sideOffset-w*.5,Math.max(0,brow-w*.55),w,w];
  return {ornament,box};
}
function atlasPortrait(cell,rank,jewelry=''){
  const key=cell+':'+rank+(jewelry?':'+jewelry:'');
  if(ART_CACHE.has(key))return ART_CACHE.get(key);
  const sheet=portraitSheet(cell);
  const [x,y]=portraitTile(cell,sheet);
  const scale=sheet.scale||1,w=PORTRAIT_WIDTH*scale,h=PORTRAIT_HEIGHT*scale;
  atlasCanvas.width=w;atlasCanvas.height=h;
  atlasInk.clearRect(0,0,w,h);
  atlasInk.imageSmoothingEnabled=true;atlasInk.imageSmoothingQuality='high';
  atlasInk.drawImage(sheet.image,x*scale,y*scale,w,h,0,0,w,h);
  // Keep the same face on promotion. Add the ornaments above the existing hair.
  const fit=fittedPortraitJewelry(cell,rank,jewelry),ornament=fit?.ornament;
  if(ornament&&portraitImageReady(jewelryAtlas)){
    const [dx,dy,dw,dh]=fit.box;
    atlasInk.drawImage(jewelryAtlas,ornament.cell%3*512,Math.floor(ornament.cell/3)*512,512,512,dx*scale,dy*scale,dw*scale,dh*scale);
  }else if(rank===8){
    const crownScale=portraitSheets[0].scale||1;
    atlasInk.drawImage(portraitAtlas,26*crownScale,702*crownScale,60*crownScale,30*crownScale,26*scale,scale,60*scale,30*scale);
  }
  const src=atlasCanvas.toDataURL();
  ART_CACHE.set(key,src);
  return src;
}

// WebP dimensions can arrive before its pixels finish decoding. Do not cache
// a blank canvas during that interval, especially for the larger source atlases.
const portraitImageReady=image=>image.complete&&image.naturalWidth>0&&image.naturalHeight>0;
const portraitAtlasReady=(cell,rank,jewelry='')=>portraitImageReady(portraitSheet(cell).image)&&(!jewelry||portraitImageReady(jewelryAtlas))&&(rank!==8||portraitImageReady(jewelryAtlas)||portraitImageReady(portraitAtlas));
function refreshAtlasPortraits(){
  document.querySelectorAll('img[data-portrait-cell]').forEach(img=>{
    const cell=Number(img.dataset.portraitCell);
    const rank=Number(img.dataset.portraitRank);
    const jewelry=img.dataset.portraitJewelry||'';
    if(portraitAtlasReady(cell,rank,jewelry))img.src=atlasPortrait(cell,rank,jewelry);
  });
}
portraitSheets.forEach(sheet=>sheet.image.addEventListener('load',()=>{
  // Also discard rendered images if an atlas is reloaded or replaced.
  ART_CACHE.clear();
  refreshAtlasPortraits();
}));
portraitAtlas.src=portraitSheets[0].src;
familyAtlas.src=portraitSheets[1].src;
jewelryAtlas.addEventListener('load',()=>{ART_CACHE.clear();refreshAtlasPortraits();});

// Local images can be displayed directly. Reading their canvas pixels is restricted on file URLs.
// Detail art is a rendering variant of the same saved ID, never a new identity.
// Thumbnails and the developer's source-atlas gallery retain their original art.
function portraitView(cell,bust=false){
  const detail=!bust&&CONSORT_DETAIL_ART[cell];
  if(detail)return {sheet:CONSORT_DETAIL_SHEETS[detail.atlas],cell:detail.tile,head:detail.head};
  const source=bust?cell:(CONSORT_DETAIL_PAIRS[cell]??cell);
  return {sheet:portraitSheet(source),cell:source,head:portraitHead(source)};
}
function localPortrait(cell,rank,attrs,jewelry='',bust=false){
  const view=portraitView(cell,bust),sheet=view.sheet,[x,y]=portraitTile(view.cell,sheet),frame=portraitFrame(cell,bust);
  const fit=fittedPortraitJewelry(cell,rank,jewelry,view.head),ornament=fit?.ornament;
  let crown='';
  if(ornament){
    const box=fit.box;
    crown=`<svg data-headpiece="${ornament.cell}" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" viewBox="${ornament.cell%3*512} ${Math.floor(ornament.cell/3)*512} 512 512" overflow="hidden"><image href="${JEWELRY_ART}" width="1536" height="1024"/></svg>`;
  }
  return `<svg ${attrs} aria-hidden="true" viewBox="${frame.join(' ')}" overflow="hidden">
    <svg width="${PORTRAIT_WIDTH}" height="${PORTRAIT_HEIGHT}" viewBox="${x} ${y} ${PORTRAIT_WIDTH} ${PORTRAIT_HEIGHT}" overflow="hidden"><image href="${sheet.src}" width="${PORTRAIT_COLUMNS*PORTRAIT_WIDTH}" height="${sheet.rows*PORTRAIT_HEIGHT}"/></svg>${crown}</svg>`;
}

function porImg(x,size=64){
  if(Number.isInteger(x?.courtCraneCell))return courtSpecialPortrait(x,size);
  if(x?.appearance)x=x.appearance;
  if(x?.daoMaster||Number.isInteger(x?.courtCraneCell))return courtSpecialPortrait(x,size);
  const cold=x&&x.cold,dead=x&&x.alive===false;
  const cell=portraitCell(x),rank=x!=='emp'&&!x.sex&&!x.isMom&&!x.maid&&!cold&&x.rank===8?8:0;
  const jewelry=!cold?jewelryWorn(x):'',bust=size<=84;
  const attrs=`class="por palace-portrait${cold||dead?' cold':''}" data-portrait-cell="${cell}" data-portrait-rank="${rank}" data-portrait-jewelry="${jewelry}" data-portrait-framing="${bust?'bust':'full'}" width="${size}" height="${size*1.25}"`;
  // SVG crops reuse the original atlas directly: no pixel-placeholder flash,
  // canvas readback, or duplicate base64 paintings for every thumbnail size.
  return localPortrait(cell,rank,attrs,jewelry,bust);
}
function porName(x){ if(x?.dowagerName)return x.dowagerName; if(x?.official!==undefined)return x.name; if(Number.isInteger(x?.courtCraneCell))return x.name; if(x?.daoMaster)return x.name+(x.daoTitle||'国师'); if(x?.courtGuest)return x.name+' · '+kidAge(x)+'岁'; if(x&&x.isMom) return x.name; if(x&&x.sur&&!x.sex&&S&&!S.consorts.includes(x)) return fullName(x); if(x==='emp') return `${E().sur}${E().name}`; if(x.sex) return kidName(x); return cName(x)}

function courtSpecialPortrait(person,size=64){
  const master=!!person.daoMaster,cell=master?person.cell:person.courtCraneCell;
  const name=master?person.name+(person.daoTitle||'国师'):person.name||'宫中来客';
  const src='./assets/images/'+(master?'palace-daoist-portraits.png':'palace-court-crane-portraits.png');
  return `<svg class="por palace-portrait court-special-portrait" role="img" aria-label="${esc(name)}" width="${size}" height="${size*1.25}" viewBox="${cell%2*561} ${Math.floor(cell/2)*701} 561 701" overflow="hidden"><image href="${src}" width="1122" height="1402"/></svg>`;
}
