/* Character-specific aftermath follows the existing coronation, never replaces it. */
const STORY_QUEEN_SCENES={
 gouyi:{title:'赵令仪 · 留在掌心的名字',text:'册礼散后，赵令仪把册文上的名字看了两遍，又慢慢展开手掌。殿外有人说，河间的祥瑞果然应了今日的册封。她望向你：“他们记着那一天，我也记着。只是做了皇后，我仍想让人先听见赵令仪说的话。”',choices:[['请她亲自写下中宫第一道吩咐','她在纸上写下自己的名字，又逐条问过女官的职责，才落下第一道中宫吩咐。'],['陪她静坐，不以祥瑞预言一生','你陪她在窗下坐了一会儿，没有拿展掌旧事预言她往后的命运。她把册文收好，说往后还想亲自决定许多事。']]},
 hongjian:{title:'薛红笺 · 皇后与她的署名',text:'红笺把皇后宝册、写了一半的诗稿与铺中账本分开放好。“中宫的事我会担起来，铺子有阿绫，诗稿却还得由我自己写。”她请你看一张采买单：宫中用笺的价格和她私铺的往来仍应分清。',choices:[['同她核清中宫采买与私铺账目','你陪她将宫中采购、私铺账目和经手人的署名逐一分开；阿绫仍照约代管铺子。'],['给她留一晚写完署名的诗','你替她挡下几份不急的传话。她在诗稿末尾署上薛红笺，之后再同女官商议中宫事务。']]},
 qingyi:{title:'沈清漪 · 未寄完的家书',text:'沈清漪把凤印放稳，才从书匣里取出当年没有寄出的信。旧日婚议因沈家的处境而断，如今她终于能以皇后身份回望那段日子。“母亲等过我的信，我不想让这一封又只剩下旁人替我写的好消息。”',choices:[['陪她写一封自己的家书','你陪她把往日的遗憾与今日的心意写成家书，落款仍由她自己写。'],['听她讲完旧事，再整理中宫书案','你听她把未说完的话讲完，又陪她把私信与中宫公文分开放好。']]},
 luwan:{title:'陆绾 · 凤冠与马簿',text:'陆绾摘下沉重的凤冠，先问北苑那匹伤蹄的老马近来如何。礼官呈上中宫仪注，她逐条看过：“规矩我会学，可别叫我只坐着，不许再问军驿和孩子们骑马的事。”',choices:[['陪她看中宫仪注，也留下骑课时日','你与她对过礼官呈来的仪注，在她的日程中留出骑课和查看马匹的时间。'],['听她说北境旧事，替她收好马簿','她把旧马簿摊开，指着曾走过的驿路说到天色渐暗。你替她收好册页，约定往后仍听她直言。']]},
 ayimu:{title:'阿依慕 · 白泉家书与凤印',text:'册礼后，阿依慕摸了摸母亲缝的香囊，又将凤印放在案上。她想先用白泉话写一封信，也担心礼官把自己的家乡只写成一行进贡的名字。“我愿学中宫的规矩，也想让他们知道，我还是阿依慕。家里人的信，还能照旧送来吗？”\n白泉的亲眷仍在故国，家书须随使团或商路往来；皇嗣的身份与本朝储位规则照旧。',choices:[['陪她写白泉家书，请通译核对称谓','她用白泉话写下册后的第一封家信，请通译核对中原礼称；回信仍依现有使团和驿路递送。'],['听她说白泉旧俗，为她留好香囊','你听她讲完母亲缝香囊的针法和白泉舞曲的来历。她亲自将香囊收在凤印旁，愿意慢慢学中宫礼仪。']]},
 chuwan:{title:'楚晚 · 旧籍与新册',text:'楚晚看着册立文书，问礼官旧籍中照养她的人是否也有一份安置记录。前朝楚氏的姓名已查清，但旧粮册上的冤屈不会因她成为皇后而自行消失。“我是楚晚，也记得方晚过过的日子。请把两份册子都留好。”',choices:[['陪她核对旧籍与照养人的记录','你同她将旧籍、核查结果与照养人的记录分别收好，没有把前朝旧案写成已经解决。'],['听她说照养人的事，再谈中宫','她讲起照养人如何带她过日子，你把话听完，随后陪她与女官核对中宫事务。']]},
 suheng:{title:'苏蘅 · 香炉与领用册',text:'苏蘅接过凤印，先请女官把各宫供香的领用册送来。她闻出两包香料配方相同，价格却不同：“先别急着说是谁有意做手脚，得看契约和验收。”她请女官将货样和领用簿分开保存，先把经手的事实核清。',choices:[['同她逐项核对供香与验收','你陪她核对两包香的供货与验收记录，只记下实际查到的差异，没有凭猜测定罪。'],['听她先说清经手供香的打算','她将自己了解的供香流程说清，随后同女官约好日后先核凭据再议处置。']]},
 xiaoman:{title:'岑小满 · 凤印旁的工钱簿',text:'岑小满规规矩矩地接了册，回到殿里便摊开旧戏单，数起替她抬箱子、拉幕布的人：“当了皇后，工钱也得照数给呀。台前只站两个人，后头可不止两个人忙。”说完又忍不住问，旧街坊冬天有没有备足炭。',choices:[['陪她核对演出名册与工钱','你同她逐项核对台前幕后名册和应付工钱，记下尚需经办的人，没有凭空结算一笔银子。'],['听她说大杂院的旧事','她掰着手指数起戏班和街坊的近况，笑着讲旧日铜钱戏法，又惦记孩子们过冬的衣物。']]}
};
function storyQueenKey(c){return c?.gouyi?'gouyi':c?.hongjian?'hongjian':Object.hasOwn(STORY_QUEEN_SCENES,c?.fixedStory)?c.fixedStory:null;}
function storyQueenCoronationEvent(c){
 if(journalContentVersion()<98||!inPalace(c)||c.rank!==8)return null;
 const key=storyQueenKey(c),base=STORY_QUEEN_SCENES[key];if(!base)return null;
 let data=base;
 if(key==='suheng'){
  const r=storyCastRecord('suheng');
  if(r?.id===c.id&&r.palaceStage>0)data={...base,text:base.text+'她记得自己曾擅自换香，知道旧事不能因册封抹去。',choices:[base.choices[0],['听她说起换香旧事与今后的分寸','她说起自己曾擅自换香的过错，随后同女官约好日后先核凭据再议处置。']]};
 }
 let done=false;const valid=()=>!done&&inPalace(c)&&c.rank===8&&!S.over;
 return {title:data.title,por:c,valid,text:data.text,choices:data.choices.map(([label,conclusion])=>({t:label,f:()=>{
  if(!valid())return null;done=true;const text=`【册后心事】${conclusion}`;story(c,text);log(`${fullName(c)}册后：${conclusion}`,1);remember(c,'care',conclusion);cchg(c,{aff:3,mood:4});return conclusion;
 }}))};
}
// The white-spring dance has its own actual banquet scene and music; the generic
// Green-Waist episode would invent a different performance and occasion.
const genericDanceEpisode=QEV['擅舞'];
QEV['擅舞']=c=>journalContentVersion()>=98&&c?.fixedStory==='ayimu'?null:genericDanceEpisode(c);
