#!/usr/bin/env node
/* Image encoding for the Xiaohongshu build (called by scripts/build-xhs.py).
   node scripts/lib/xhs-images.cjs job.json   ->  JSON report on stdout
   job = {tools, cache, images:[{src, out, width, quality, alphaQuality}]}
   Uses sharp (libwebp) from the tools folder: it supports alphaQuality, which matters
   because every portrait sheet has a transparent background. Results are cached by
   source bytes and settings. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const job=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const sharp=require(path.join(job.tools,'node_modules','sharp'));
sharp.concurrency(0);
fs.mkdirSync(job.cache,{recursive:true});
(async()=>{
  const out=[];
  const queue=job.images.slice();
  async function worker(){
    while(queue.length){
      const item=queue.shift();
      const data=fs.readFileSync(item.src),meta=await sharp(data).metadata();
      const width=item.width&&meta.width>item.width?item.width:meta.width;
      const key=crypto.createHash('sha1').update(data).update(JSON.stringify([width,item.quality,item.alphaQuality,'v3'])).digest('hex').slice(0,20);
      const cached=path.join(job.cache,key+'.webp');
      if(!fs.existsSync(cached)){
        const buf=await sharp(data).resize({width}).webp({quality:item.quality,alphaQuality:item.alphaQuality,effort:6,smartSubsample:true}).toBuffer();
        fs.writeFileSync(cached,buf);
      }
      fs.mkdirSync(path.dirname(item.out),{recursive:true});
      fs.copyFileSync(cached,item.out);
      const after=await sharp(cached).metadata();
      out.push({src:item.src,out:item.out,before:[meta.width,meta.height],after:[after.width,after.height],bytesBefore:data.length,bytesAfter:fs.statSync(item.out).size});
    }
  }
  await Promise.all(Array.from({length:6},worker));
  process.stdout.write(JSON.stringify(out));
})().catch(error=>{console.error(error);process.exit(1);});
