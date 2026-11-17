/* New reports keep the evidence, rating and recommended office in the save.
   Pending reports from older editions continue through their original decisions. */
const localMeritsActive=()=>!!S&&!S.over&&journalContentVersion()>=24&&!PalaceActions.blocked;
const LOCAL_MERIT_TASKS=[
  {id:'water',title:'堤工安澜',unit:'段险堤',target:12,department:'工部',good:['堤工逐段验收，工料与民夫工簿相符，沿河村落已安然度汛。','汛前修固险段，乡老与河工联名回报，沿岸田庐未受水患。'],great:'另设巡堤与报汛章程，邻县沿用之后也保住了秋粮。',bad:['上游涨水冲坏未完工段，须补运石料，原定工期未能赶上。','复勘发现两处护岸仍不牢固，已退回重修，暂不准销账。']},
  {id:'grain',title:'赈济有方',unit:'户灾民',target:600,department:'户部',good:['赈册逐户核验，老弱有人送粮，受灾人家已领足口粮。','设粥棚并分批发放种粮，灾户签领与仓册相合，没有另派杂费。'],great:'以工代赈修好了村渠，灾户既得口粮，又赶上复耕，流民陆续归乡。',bad:['山路阻断，偏远灾村尚有口粮未送到，请求改走水路补运。','赈册漏列了新迁来的灾户，须重核名单、补发口粮。']},
  {id:'justice',title:'清讼雪冤',unit:'件积案',target:30,department:'刑部',good:['逐案覆验人证与旧卷，积年争讼得以了结，没有以逼供催结。','重访证人与里正，错记的田界已经厘清，判牍与实地相符。'],great:'查明一宗多年冤案，归还被占田产，并将复核办法整理成册供各县参照。',bad:['旧证人尚未寻齐，几件疑案暂留复核，不能为凑定额草率定罪。','退回复审的案卷还缺关键契据，原定清讼期限未能完成。']},
  {id:'school',title:'兴学育才',unit:'间学舍',target:10,department:'礼部',good:['学舍修葺齐备，塾师与里正联名回报孩童复学，贫寒学童免收束脩。','核定学田租入，补齐书册与塾师，数处荒置乡学重新开课。'],great:'增设义学与女童识字课，贫寒子弟也有书可读；学田有了常年供给，不再只热闹一季。',bad:['木料延误，两处学舍未能如期开课，已先借祠堂安置学童。','新聘塾师未到任，学舍虽修好，仍需补齐教习。']},
  {id:'irrigation',title:'引水润田',unit:'里支渠',target:18,department:'工部',good:['渠首与支渠一并验收，旱田通水，轮灌次序由各村具结。','清淤之后水量抵达下游，乡民按议定时辰灌田，争水的诉状少了。'],great:'把上游与下游的水约订明，连年弃耕的薄田重新收成，办法可推及邻郡。',bad:['勘线遇到石层，几段渠路需改线，暂未全线通水。','下游分水闸未调平，须再勘高差，不能照原册报成。']},
  {id:'bridges',title:'修桥通路',unit:'座桥梁',target:6,department:'工部',good:['危桥逐座换梁，验载合格，农人赶集和学童过河不必再绕远路。','新桥与引道同时交验，工价付清，驿夫与乡老共同核实。'],great:'连通山中集镇，救急运粮不再受渡口阻隔，还留下可常年检修的工料册。',bad:['山洪冲坏引道，两座桥仍不能通车，须先补牢路基。','验载发现一座桥梁开裂，已封桥返工，未准交付。']},
  {id:'granary',title:'常平仓丰备',unit:'处粮仓',target:8,department:'户部',good:['逐仓盘验旧粮，霉变及时剔除，补入新粮后仓册与实存相符。','修好仓顶通风与防鼠设施，按市价平粜，未借储粮抬高米价。'],great:'以轮换办法压低耗损，备荒之粮足额，邻县缺粮时也能及时接济。',bad:['梅雨损坏两仓旧粮，已据实报损，补购尚未办完。','盘仓数目与旧册有出入，正在逐笔核验，不肯先报足额。']},
  {id:'tax',title:'清赋息民',unit:'乡税册',target:16,department:'户部',revenue:4,good:['逐乡清除重复税项，正赋如数入库，百姓不再交重赋。','核清隐漏与错籍，依法减免灾田，实收钱粮与库单相合。'],great:'追还胥吏私收的杂费，正赋仍足额，轻徭与足用两得，获各乡联名称颂。',bad:['数乡旧册残缺，税籍尚待复核，已暂停争议税项以免误征。','运解延误，部分正赋尚未到库，不能以催逼灾户填账。']},
  {id:'market',title:'商路生春',unit:'处市集',target:5,department:'户部',revenue:3,good:['撤去重复关卡，统一斗斛秤尺，商旅回流，税单与市册相符。','修整货场、明示市税，往来货物增多，行商不再被层层索费。'],great:'邻郡共同推行验契通行，客商纷至，新增正税来自商贸兴旺，并非另加摊派。',bad:['两处货场修整未毕，商户还不能迁回，须暂免摊租。','旧关卡裁撤未尽，商人仍受重复查验，已责令逐处复核。']},
  {id:'medicine',title:'施药安民',unit:'处义诊所',target:9,department:'礼部',good:['延请医者坐诊，药材出入可核，贫病之家有人登门照料。','核验药材后分送乡里，诊簿与发药册相符，未向病家另收费用。'],great:'设常年义诊与洁水办法，乡民病后有处休养，医者将有效的照护方法送邻县共享。',bad:['两处诊所缺少医者，已先将急症转送县中，原定布点未齐。','药材受潮未过验收，已退换重购，暂未按期送达。']},
  {id:'reclamation',title:'劝农复业',unit:'户复耕人家',target:240,department:'户部',good:['种粮与农具送到流离人家，荒田逐块复耕，没有强夺原主田契。','核清荒田归属后劝民返乡，农具借领有册，秋收已有着落。'],great:'兼顾返乡灾户与原住人家，田界争端一并调解，多年流民终于能够安家。',bad:['春雨不足，部分新垦田未能成苗，需补种耐旱作物。','几块荒田的旧契尚有争议，暂缓分配，避免再起田讼。']},
  {id:'public-order',title:'乡里安业',unit:'处巡防铺',target:12,department:'刑部',good:['调整夜巡与报案轮值，盗案依证查办，乡民夜行安稳些了。','撤去扰民的私设哨卡，捕役按册巡防，失窃物件陆续归还。'],great:'破获跨县盗案而未株连无辜，邻县联防有了章程，商旅与乡民皆称便。',bad:['数处巡铺轮值仍有缺额，夜巡不能全线衔接，须补齐人手。','跨县案牍往返延误，赃物尚未全部追回，仍需会同邻县查访。']}
];
Object.assign(OFFICE_GRADES,{'通政使司副使':7});
const localMeritReport=r=>localMeritsActive()&&r?.kind==='local'&&r.edition===24;
function localMeritOdds(p){return clamp(.68+((p.ability??50)-50)*.004+((p.trust??45)-45)*.0015,.35,.94);}
function localCentralOffice(p,department){
  const grade=officialGrade(p);
  if(!grade)return null;
  return grade<=3?'协办大学士':grade<=5?department+'侍郎':grade<=7?'内阁学士':grade<=9?'通政使司副使':grade<=11?department+'郎中':department+'主事';
}
function localCentralTarget(person){
  const p=person?.p,r=p?.report;
  if(!localMeritReport(r)||!r.verified||r.rating!=='exceptional'||r.outcome!=='success'||!careerEligible(p)||r.office!==(p.office||p.post)||p.ability<75||p.merit<65||S.turn-(p.lastCareerChange??-99)<6)return null;
  const title=localCentralOffice(p,r.department),grade=officialGrade({office:title});
  return title&&grade<=officialGrade(p)?[grade,title]:null;
}
const localMeritsOriginalReport=createLocalReport;
createLocalReport=function(person){
  if(!localMeritsActive())return localMeritsOriginalReport(person);
  if(!person||!localReportEligible(person))return null;
  const p=person.p,recent=[...(S.flags.localMeritRecent||[]),...(p.reportHistory||[]).slice(-2).map(r=>r.taskId)],pool=LOCAL_MERIT_TASKS.filter(t=>!recent.includes(t.id)),task=pick(pool.length?pool:LOCAL_MERIT_TASKS);
  const good=chance(localMeritOdds(p)),roll=good?R():1,exceptional=p.ability>=75&&p.merit>=45?clamp(.14+(p.ability-75)*.008+(p.merit-45)*.002,.14,.42):0;
  const rating=!good?'setback':roll<exceptional?'exceptional':roll<exceptional+.32?'excellent':'sound',label={setback:'尚有疏漏',sound:'办差妥当',excellent:'实绩卓著',exceptional:'地方殊绩'}[rating];
  const done=good?task.target:Math.floor(task.target*ri(45,82)/100),region=p.region||(p.office||p.post).replace(/知县|县令|知府|知州|同知|通判|道员|总督/g,'')||'任所';
  const evidence=pick(good?task.good:task.bad)+(rating==='exceptional'?task.great:rating==='excellent'?'复核另见乡民具结与收支明册，办事稳妥，未额外加派。':'');
  const quote=good?{持正:'民生有了着落，才算没有辜负这一任。',谨慎:'诸项已复核，臣仍留册备查，不敢以一时成绩自满。',进取:'臣愿把奏效的办法整理出来，若蒙任用，也愿多担些事。',圆融:'此事赖官民同心，臣愿将其中办法说清，让旁处少走弯路。'}[p.temperament]||'臣将核验册一并呈上，请陛下查阅。':'臣将未竟之处据实呈报，愿补办善后。';
  const people=good?(rating==='exceptional'?3:rating==='excellent'?2:1):0,revenue=good?(task.revenue||0)*(rating==='exceptional'?2:1):0;
  p.lastLocalReport=S.turn;p.report={id:`local-${p.id}-${S.turn}`,edition:24,kind:'local',taskId:task.id,department:task.department,title:`${region} · ${task.title}`,office:p.office||p.post,turn:S.turn,outcome:good?'success':'setback',rating,region,target:task.target,done,unit:task.unit,verified:true,benefits:{people,treasury:revenue},
    text:`${p.name}呈报${task.title}：定额${task.target}${task.unit}，核实完成${done}${task.unit}。${evidence}\n考课：${label}。${p.name}道：“${quote}”${good?`\n实绩所及：民心＋${people}${revenue?`，正税入库＋${revenue}万两`:''}（已入账）。`:''}`};
  p.merit=clamp((p.merit??0)+(rating==='exceptional'?22:rating==='excellent'?14:good?8:-5));
  if(good)chg({people,treasury:revenue});
  S.flags.localMeritRecent=[...(S.flags.localMeritRecent||[]),task.id].slice(-3);
  courtPersonRecord(person,`【呈奏】${p.report.title}。${p.report.text} 待御批。`);noteLocalChronicle(person,p.report);careerFamilyEcho(person,'submitted',p.report.text,p.report);return p.report;
};
const localMeritsOriginalTarget=careerTarget;
careerTarget=function(person,direction){
  const target=localMeritsOriginalTarget(person,direction);
  if(!target||direction!=='promote'||!localMeritReport(person.p.report))return target;
  // A county achievement normally advances the local career; exceptional service has a separate capital appointment.
  return [[2,'两江总督'],[6,'盐运使'],[7,'道员'],[8,'知府'],[9,'同知'],[10,'知州'],[11,'通判'],[13,'知县']].filter(([grade])=>grade<officialGrade(person.p)).at(-1)||target;
};
