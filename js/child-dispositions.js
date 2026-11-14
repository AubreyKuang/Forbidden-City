/* Temperament is an identity, not whichever school stat is currently highest.
   Fallbacks are deterministic: merely opening a legacy portrait never rolls RNG. */
const CHILD_DISPOSITIONS={
  好奇:{d:'总想弄清缘由，听到答案还会追问，也容易急着下结论。',
    little:'为什么影子一直跟着我？它也要回去睡觉吗？',young:'书上说的我记住了，可我想亲手试一回，看看是不是这样。',older:'我想把猜测和亲眼见到的分开写。若猜错了，也请让我改。'},
  好胜:{d:'肯下苦功，也在意输赢；更希望凭本事被看见。',
    little:'刚才没有算！我还想再搭一次，这回一定不倒。',young:'先别夸我。我想知道差在哪里，下回才能真的赢。',older:'我会羡慕别人得夸奖，也知道不能靠让人闭嘴赢这一局。'},
  仁厚:{d:'容易察觉旁人的难处，有时却把不属于自己的错也揽下来。',
    little:'这块糕留着。刚才那个人一直站着，还没吃呢。',young:'我想帮忙，可要是对方不愿意，是不是该先问一声？',older:'我愿意替人说话，也想先把事情问清，免得好心反而委屈了别人。'},
  内敛:{d:'喜欢先听后说，心思细密；沉默时也未必是赞同。',
    little:'等只有我们两个的时候，我再告诉你，好不好？',young:'我不是没有想法。人一多，话就卡在这里了。',older:'这几句话我在心里想过很久。可否先听完，再问我为什么？'},
  爽直:{d:'对不平之事敢开口，答应得痛快，有时也说得太快。',
    little:'不是这样的！我看见了，你让我说完。',young:'如果大人也说错了，能不能当面告诉他？我不是故意顶嘴。',older:'有些话不好听，我仍想说。但若是我误会了，也会当面认错。'},
  灵动:{d:'爱热闹、点子多，常把规矩玩出新花样；收尾需要一点耐心。',
    little:'这不是乱摆，是给小蚂蚁开的城门！',young:'我们换个玩法好不好？原来的规矩我会，可这样说不定更有趣。',older:'我有个新办法，先试一小处。若行不通，我也会把残局收拾好。'},
  审慎:{d:'做事喜欢核对，珍惜约定；有时怕出差错，迟迟不肯开始。',
    little:'我先数一数，别把哪一只忘在外头。',young:'先说好轮到谁、怎么记数。说清楚了，等会儿才不会吵。',older:'我把能想到的难处列出来了。还有不知道的，想先留一条退路。'},
  自矜:{d:'爱惜自己的体面与作品，不愿被敷衍，也不轻易向人求助。',
    little:'这个是我自己做的，不要说和谁的一样。',young:'不要因为我是皇嗣就说好。哪里不好，你悄悄告诉我。',older:'我珍惜自己的名声，也不想靠身份借来别人的本事。'}
};
function childDisposition(k){
  if(CHILD_DISPOSITIONS[k.temperament])return k.temperament;
  const keys=Object.keys(CHILD_DISPOSITIONS);
  return keys[voiceHash(`child:${k.seed||k.id}`)%keys.length];
}
function ensureChildDisposition(k){k.temperament=childDisposition(k);}
function childDispositionVoice(k){
  const age=kidAge(k),key=childDisposition(k),rule=CHILD_DISPOSITIONS[key];
  return voiceLine('temperament-'+key,age<6?'一点自己的小主意，已经藏不住了。':`${k.sex==='f'?'她':'他'}说着自己的想法，露出平日的性情。`,rule[age<6?'little':age<12?'young':'older']);
}
function childDispositionPanel(k){
  if(k.pendingName||kidAge(k)<3)return '';
  const key=childDisposition(k);
  return `<section class="child-disposition"><strong>性情 · ${esc(key)}</strong><p>${esc(CHILD_DISPOSITIONS[key].d)}</p><small class="hint">教养会增长本领，经历会留下心事。</small></section>`;
}
