/* Issue 35 personas: small one-time scenes the dossiers describe but the main storylines left out. */
function storyPersonaConsort(key){
  return S.consorts.find(c=>c.fixedStory===key&&inPalace(c)&&!c.homeLeave)||null;
}
function storyPersonaBeatReady(c,beat,months){
  return !!c&&c.personaBeats?.[beat]==null&&S.turn-(c.enteredAt??S.turn)>=months;
}
function markStoryPersonaBeat(c,beat){(c.personaBeats||={})[beat]=S.turn;}

// 陆绾 and her brother argue over reports that say nothing.
function luwanBrotherReportEvent(c){
  const brother=houseOf(c)?.brother;
  if(!officialAlive(brother))return null;
  const valid=()=>inPalace(c)&&!c.homeLeave&&c.personaBeats?.brotherReport==null&&officialAlive(houseOf(c)?.brother);
  const note=text=>{(brother.story||=[]).push({d:dateStr(),t:text});};
  return {title:'陆绾 · 兄长的军报',por:c,valid,
    text:`北境的驿报说上月有游骑犯边，${brother.name}寄来的家书却只有四个字：“边关无恙”。\n陆绾把信拍在桌上：“他每回都这样。军报写得含糊，家书也写得含糊，问他伤着没有，他回我‘无恙’。我爹看了还夸他稳重！”她提笔要回信，写了两行，墨点溅了一纸。`,
    choices:[
      {t:'陪她把回信写完',f:()=>{
        if(!valid())return null;markStoryPersonaBeat(c,'brotherReport');
        story(c,`【兄妹争执】${brother.name}的家书只写“边关无恙”，她回信把军报里含糊的几处一条条问回去。陛下陪她写完，替她把最凶的一句改得客气了些。`);
        note(`【妹妹来信】陆绾回信，把军报里含糊的几处一条条问回来。他读完笑骂一句“还是这个脾气”，下一封信写了满满两页。`);
        return `信写完，陆绾自己先笑了：“陛下改的那句，倒比我原来的还难反驳。”${fx(cchg(c,{aff:4,mood:6}))}`;
      }},
      {t:'劝她别和兄长置气',f:()=>{
        if(!valid())return null;markStoryPersonaBeat(c,'brotherReport');
        story(c,`【兄妹争执】为${brother.name}含糊的家书生气。陛下劝她别和兄长置气，她嘴上应了，回信里还是问了一句“到底伤着没有”。`);
        note('【妹妹来信】陆绾回信里只问了一句“到底伤着没有”。他回了半页，说擦破点皮，叫她别告诉父亲。');
        return `“我不是置气，是担心。”她把信折起来，“他不肯说，我就一直问。”${fx(cchg(c,{mood:2}))}`;
      }}]};
}

// 岑小满 still counts every coin, and still plays for children for next to nothing.
function xiaomanCoinShowEvent(c){
  const valid=()=>inPalace(c)&&c.personaBeats?.coinShow==null;
  const kids=kidsAlive().filter(k=>childInPalace(k)&&kidAge(k)>=3&&kidAge(k)<=12).slice(0,2);
  const audience=kids.length?`连${kids.map(k=>k.name).join('、')}也挤在前头`:'几个小太监也挤在前头';
  return {title:'岑小满 · 三个铜板的戏法',por:c,present:kids.length?[c,...kids]:[c],valid,
    text:`宫人们的孩子听说岑小满会变戏法，凑了三个铜板来请她演一场。${audience}。\n她把铜板收下，一枚一枚数清，揣进袖里：“说好三个，就是三个。”然后从空碗底下变出一串糖葫芦，分给了最小的那个。`,
    choices:[
      {t:'去看她演完，散场后再添一份赏',f:()=>{
        if(!valid())return null;markStoryPersonaBeat(c,'coinShow');
        story(c,'【三个铜板】给宫人的孩子演了一场，只收他们凑来的三个铜板。陛下要添赏，她说这一份留给大杂院的炭钱，别算在今天的场子上。');
        for(const k of kids)kstory(k,`看岑小满变戏法，空碗底下变出了一串糖葫芦。`);
        return `她谢了赏，又特意说清楚：“这是陛下赏大杂院的，不是赏今天这场的。今天的钱，我已经收过了。”${fx(cchg(c,{aff:5,mood:8}),chg({treasury:-3}))}`;
      }},
      {t:'由她们热闹去',f:()=>{
        if(!valid())return null;markStoryPersonaBeat(c,'coinShow');
        story(c,'【三个铜板】给宫人的孩子演了一场戏法，只收了三个铜板，一枚一枚数清了才收进袖里。');
        return '廊下的笑声传了好一阵。';
      }}]};
}
function storyPersonaMonth(){
  if(typeof storyPersonaActive!=='function'||!storyPersonaActive()||S.over||mourningActive())return;
  const luwan=storyPersonaConsort('luwan');
  if(storyPersonaBeatReady(luwan,'brotherReport',3)&&chance(.12)){const ev=luwanBrotherReportEvent(luwan);if(ev){pushEv(ev);return;}}
  const xiaoman=storyPersonaConsort('xiaoman');
  if(storyPersonaBeatReady(xiaoman,'coinShow',2)&&chance(.12)){const ev=xiaomanCoinShowEvent(xiaoman);if(ev)pushEv(ev);}
}
