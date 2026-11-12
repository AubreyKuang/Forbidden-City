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
const atlasCanvas=document.createElement('canvas');
atlasCanvas.width=PORTRAIT_WIDTH;atlasCanvas.height=PORTRAIT_HEIGHT;
const atlasInk=atlasCanvas.getContext('2d');
const ART_CACHE=new Map();

const CONSORT_PORTRAITS=[1,2,3,4,5,6,7,21];
const WESTERN_PORTRAITS=[22,23,24];
const PORTRAIT_CLOTHES={
  1:'圆领袍',2:'齐胸襦裙',3:'宋式褙子',4:'窄袖骑装',5:'齐腰襦裙',
  6:'宋式褙子',7:'交领襦裙',10:'交领宫装',21:'宋式褙子',
  22:'西域舞衣',23:'西域舞衣',24:'西域舞衣'
};
const consortPortraits=c=>c.fam?.t==='西域贡女'?WESTERN_PORTRAITS:CONSORT_PORTRAITS;

function assignConsortPortrait(c){
  const cells=consortPortraits(c);
  if(cells.includes(c.artPortrait))return;
  const usage=new Map(cells.map(cell=>[cell,0]));
  for(const other of [...S.consorts,...(S.cands||[])]){
    const cell=other.artPortrait;
    if(other!==c&&other.alive&&!other.gone&&!other.maid&&usage.has(cell)){
      usage.set(cell,usage.get(cell)+1);
    }
  }
  const favorite={骄纵:1,骄矜:1,温婉:2,才女:3,将门:4,活泼:5,淡泊:6}[c.trait];
  const start=cells.includes(favorite)?cells.indexOf(favorite):Math.floor(mulberry32(c.seed||7)()*cells.length);
  let best=cells[start];
  for(let i=1;i<cells.length;i++){
    const cell=cells[(start+i)%cells.length];
    if(usage.get(cell)<usage.get(best))best=cell;
  }
  c.artPortrait=best;
}
function portraitCell(x){
  const pickIndex=(seed,count)=>Math.floor(mulberry32(seed||7)()*count);
  if(x==='emp')return E().age>=40?13:12;
  if(x.isMom)return 9;
  if(x.maid)return 10;
  if(x.sex){
    const age=kidAge(x);
    if(age<3)return 18+pickIndex(x.seed,2);
    if(age<12)return x.sex==='m'?16:17;
    return x.sex==='m'?(S.heir===x.id?15:14):11;
  }
  const cells=consortPortraits(x);
  return cells.includes(x.artPortrait)?x.artPortrait:cells[pickIndex(x.seed,cells.length)];
}

function atlasPortrait(cell,rank){
  const key=cell+':'+rank;
  if(ART_CACHE.has(key))return ART_CACHE.get(key);
  const x=(cell%PORTRAIT_COLUMNS)*PORTRAIT_WIDTH;
  const y=Math.floor(cell/PORTRAIT_COLUMNS)*PORTRAIT_HEIGHT;
  atlasInk.clearRect(0,0,PORTRAIT_WIDTH,PORTRAIT_HEIGHT);
  atlasInk.imageSmoothingEnabled=false;
  atlasInk.drawImage(portraitAtlas,x,y,PORTRAIT_WIDTH,PORTRAIT_HEIGHT,0,0,PORTRAIT_WIDTH,PORTRAIT_HEIGHT);
  // Keep the same face on promotion. Add the ornaments above the existing hair.
  if(rank===8)atlasInk.drawImage(portraitAtlas,26,702,60,30,26,1,60,30);
  const src=atlasCanvas.toDataURL();
  ART_CACHE.set(key,src);
  return src;
}

const portraitAtlasReady=()=>portraitAtlas.naturalWidth&&typeof location!=='undefined'&&location.protocol!=='file:';
portraitAtlas.addEventListener('load',()=>{
  if(!portraitAtlasReady())return;
  document.querySelectorAll('img[data-portrait-cell]').forEach(img=>{
    img.src=atlasPortrait(Number(img.dataset.portraitCell),Number(img.dataset.portraitRank));
  });
});
portraitAtlas.src='./palace-portraits-b.webp';

function porImg(x,size=64){
  const cold=x&&x.cold, dead=x&&x.alive===false;
  const cell=portraitCell(x),rank=x!=='emp'&&!x.sex&&!x.isMom&&!x.maid&&!cold&&x.rank===8?8:0;
  const src=portraitAtlasReady()?atlasPortrait(cell,rank):portrait(porSpec(x));
  return `<img class="px por palace-portrait${cold||dead?' cold':''}" alt="" src="${src}" data-portrait-cell="${cell}" data-portrait-rank="${rank}" width="${size}" height="${size*1.25}">`;
}
function porName(x){ if(x&&x.isMom) return x.name; if(x&&x.sur&&!x.sex&&S&&!S.consorts.includes(x)) return fullName(x); if(x==='emp') return `${E().sur}${E().name}`; if(x.sex) return kidName(x); return cName(x)}
