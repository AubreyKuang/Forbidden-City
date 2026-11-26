/* Save compression for small key-value hosts (the Xiaohongshu mini-tool Storage allows
   10MB in total). LZW over UTF-16 code units with variable-width codes, packed into a
   base64 alphabet: the result is plain ASCII, so it is always a valid JSON string.
   Codes 0 / 1 introduce an 8 / 16-bit literal, 2 ends the stream; the dictionary grows in
   step on both sides, and the code width is the bit length of the next free code. */
const PalaceCompress=(()=>{
  const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const REVERSE={};for(let i=0;i<ALPHABET.length;i++)REVERSE[ALPHABET[i]]=i;
  const PREFIX='z1:';
  const width=n=>32-Math.clz32(n);
  function compress(input){
    const text=String(input);
    const out=[];let acc=0,filled=0;
    const write=(value,bits)=>{
      for(let i=0;i<bits;i++){
        acc|=((value>>>i)&1)<<filled;
        if(++filled===6){out.push(ALPHABET[acc]);acc=0;filled=0;}
      }
    };
    const dict=new Map();let next=3,w='';
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(w!==''&&dict.has(w+c)){w+=c;continue;}
      if(w!==''){write(dict.get(w),width(next));dict.set(w+c,next++);}
      w=c;
      if(!dict.has(c)){
        const code=c.charCodeAt(0),wide=code>255;
        write(wide?1:0,width(next));write(code,wide?16:8);
        dict.set(c,next++);w='';
      }
    }
    if(w!==''){write(dict.get(w),width(next));next++;}
    write(2,width(next));
    if(filled)out.push(ALPHABET[acc]);
    return PREFIX+out.join('');
  }
  function decompress(input){
    const s=String(input);
    if(!s.startsWith(PREFIX))throw new Error('不是压缩存档');
    let pos=PREFIX.length,acc=0,left=0;
    const read=bits=>{
      let value=0;
      for(let i=0;i<bits;i++){
        if(!left){
          if(pos>=s.length)throw new Error('压缩存档不完整');
          acc=REVERSE[s[pos++]];if(acc===undefined)throw new Error('压缩存档字符错误');left=6;
        }
        value|=(acc&1)<<i;acc>>>=1;left--;
      }
      return value>>>0;
    };
    const dict=[],out=[];let next=3,prev=null;
    for(;;){
      const pending=prev!==null;
      const code=read(width(next+(pending?1:0)));
      if(code===2)break;
      if(code===0||code===1){
        const ch=String.fromCharCode(read(code?16:8));
        if(pending)dict[next++]=prev+ch;
        dict[next++]=ch;out.push(ch);prev=null;continue;
      }
      let entry;
      if(code<next&&dict[code]!==undefined)entry=dict[code];
      else if(pending&&code===next)entry=prev+prev[0];
      else throw new Error('压缩存档编码错误');
      if(pending)dict[next++]=prev+entry[0];
      out.push(entry);prev=entry;
    }
    return out.join('');
  }
  const isCompressed=s=>typeof s==='string'&&s.startsWith(PREFIX);
  return {compress,decompress,isCompressed,PREFIX};
})();
