# 仙缘与古言长卷验证

日期：2026-11-15。玩法、概率和资料见[古言母题与仙缘故事](../romance-and-immortal-stories.md)。

## 宫中修习后续验证（2026-11-16）

`node --test tests/palace-immortal-lessons.test.cjs tests/palace-immortal-journeys.test.cjs`：62 项通过。全量回归 2,282 项通过；合入主线 `3b0d9db` 后复验相关流程与存档兼容 1,188 项，全部通过；连续六十个月流程检查通过。使用脚本上下文与模拟 DOM；以下结果不作为新的浏览器截图验收。

- 真实转过六个月，从月度队列收到「宫中修习」，不再重播仙师初访；未到期不能重复领取收益。
- 两种师承各八类课业、每类八种性格回应；两种静养情节轮换，病中不练剑、不凭对话恢复健康。
- 十五岁十一个月选择暂留，十六岁时单独商议旧约；继续修习、后续再谈启程、正式离家后的两年历练均能接续。
- 储位、婚姻、健康与国库限制继续有效；死亡、离宫、禁闭或过期的对话不能结算。
- 生母、养母记住具体在京经历与各自心绪，已故母亲不新增纪事。
- 未成年暂留不误当作拒绝远行；真正不准皇子远行仍保留再次求情的支线。
- 待选择的课业、选择后的结果均在全新上下文读档验证；具体课业、收益与纪事不重抽、不重复结算。
- 修改前从 `f628294`、`d354daf`、`3b0d9db` 分别留存真实 v49、v50、v51 存档，每个版本均包括初访待答、暂留结果、旧版半年重访；九份存档均按原规则续接，处理完毕才转入新后续。

## 自动检查

使用 Node.js 22.18.0：

```sh
node --test tests/*.test.cjs
node tests/palace-flow.cjs
node tests/immortal-journeys-fixtures.cjs
node scripts/build-experience-catalog.cjs
python3 scripts/build-dev.py
git diff --check
```

合入远端 `118fb41`、`aa1d328` 的最新插画更新后，全量 **925 / 925** 通过。连续六十个月的流程检查，以及六个演示档在新脚本上下文中的实际导入与续接，均通过。其中本功能新增 **35 项** 专项检查：

- 10,000 个种子分别验证公主、一般皇子和嫡出皇子的灵根分布；固定潜质，不因后来晋位改变。
- 年龄、储位、健康、婚姻和真实去向限制；仙师姓名与道号正确，渲染面板不改变人物状态。
- 离家满一年、两年的阶段约束，长期留山不强制归来；山门称号同时要求年限与经历。
- 宫内活动、开府、婚事、立储、夺嫡和旧队列不把已经离家的孩子拉回；同月排队的成年开府失效。
- 八种性格的江湖消息以及君主健康、民心的实际条件；未核实消息无奖励，重复点击不重结算。
- 生母、养母分别记事、牵挂与家书安慰，已故母亲不添加生前新经历。
- 实际执行继位，保留先朝亲族与山门身份，并在新朝获得后续称号、使用正确称呼。
- 实际转月、保存、在全新脚本上下文读档，继续同一段仙师来访；书信冷却也保留。
- 修改前从 `833e3b2` 生成的两个 v6 待办档，分别复演转月与人生长卷；完成后才启用 v7。
- 八条古言长卷各跑完八组选择组合，检查精力、章节间隔、结局、存档、具名亲人纪事；亲人亡故收为未竟，新近丧子暂停新故事。
- 人物页可以主动打开后加入的符合条件长卷，不被原有前三个题目永久遮住。

流程脚本的独立性情场景现清除被删除养母对应的测试孩子，并给其他同季活动设置测试冷却，避免随机新增内容使固定“画扇”断言依赖整局随机数。游戏规则没有为测试修改。

## 可重复导入的演示场景

运行 `node tests/immortal-journeys-fixtures.cjs`，在 `/tmp/palace-immortal-fixtures` 生成六个一次性演示档。它们不读取玩家存档。建议在测试入口 `dev.html` 的独立存档空间导入：

| 文件 | 应验证的行为 |
| --- | --- |
| `master.json` | 十六岁清和公主与具名仙师见面；批准后国库扣一次，详情显示山门、灵根、离家状态；生母沈知微、养母许清容各有纪事 |
| `first-trial.json` | 一年后收到第一次历练来信，选择后再等一年；不是马上成为宗主 |
| `stay-or-return.json` | 两年后可归来或正式入门；选择留山后没有自动回宫期限 |
| `sect-leader.json` | 十五年修行、有实际经历的传闻；核对信牒才确认为宗主，暂存传闻不晋升 |
| `next-reign.json` | 新君继位后的先朝亲族来信；称陛下，保留同一人的年龄、身份、师承与纪事 |
| `window-chess.json` | 孤高才女的西窗残局，三章选择保存、后续页面入口与旧有清冷气质 |

## 浏览器验收结果

**2026-11-15 已完成六个演示场景的真实浏览器验收。** 使用独立的无头 Chrome 157.0.8103.78、Playwright 1.65.1，打开[线上测试页](https://aubreykuang.github.io/Forbidden-City/dev.html)，逐个通过文件导入控件载入演示档，再实际点击页面按钮。每条分支使用新建浏览器上下文，没有连接玩家的浏览器配置或读取正式存档。桌面尺寸为 1440 × 1000，手机视口为 390 × 844；手机结果是 Chrome 窄屏验证，不是 iOS/Android 真机结果。

目标提交为 `ff478c6`；验收时线上版本为其后继 `1ac12f0`，仙缘脚本与目标提交逐字一致。**26 条分支全部通过，102 次刷新读取自动档全部通过，未捕获 JavaScript 异常。** 对话未选择、结果未关闭、事件已结束三个时点均检查恢复后的人物、国库、精力、剧情阶段与纪事一致；西窗残局另检查第二、第三章及完结后的恢复。

| 演示场景 | 桌面、手机各自实际点击的分支与结果 | 截图 |
| --- | --- | --- |
| 仙师来访 | 准许、暂留、放弃三条分支；准许只扣 30 万两，清和转入学艺，另外两条不扣款；沈知微、许清容均能搜索到具体送别纪事。寄家书后刷新仍受六个月冷却限制 | [桌面](../screenshots/immortal-journeys/master-desktop-pending.jpg) · [手机](../screenshots/immortal-journeys/master-mobile-pending.jpg) · [详情](../screenshots/immortal-journeys/master-desktop-detail.jpg) |
| 第一次历练 | 两种回信都进入历练阶段，下次节点为十二个月后，身份仍是门中弟子 | [桌面](../screenshots/immortal-journeys/first-trial-desktop-pending.jpg) · [手机](../screenshots/immortal-journeys/first-trial-mobile-pending.jpg) |
| 留山或归来 | 正式入门与归来两条分支均能保存恢复；留山后“商议归来”尊重其继续修行的意愿，不把孩子强制送回宫 | [桌面](../screenshots/immortal-journeys/stay-or-return-desktop-pending.jpg) · [手机](../screenshots/immortal-journeys/stay-or-return-mobile-pending.jpg) |
| 宗主传闻 | 核实后才升为宗主；暂存传闻保留原身份，国库、威望、民心、文才均不凭传闻增加 | [桌面](../screenshots/immortal-journeys/sect-leader-desktop-pending.jpg) · [手机](../screenshots/immortal-journeys/sect-leader-mobile-pending.jpg) · [核实后详情](../screenshots/immortal-journeys/sect-leader-desktop-detail.jpg) |
| 新朝来信 | 核实与暂存均可续接；人物编号、出生时间、师承与既有纪事保留；从家族进入先朝亲族页后可再寄家书，信中称“陛下”，不误称“父皇” | [桌面](../screenshots/immortal-journeys/next-reign-desktop-pending.jpg) · [手机](../screenshots/immortal-journeys/next-reign-mobile-pending.jpg) · [新朝家书](../screenshots/immortal-journeys/next-reign-letter.jpg) |
| 西窗残局 | 三章分别选择第一项和第二项，各完整走完一遍；每章后刷新、从人物页续接，冷却前按钮不可用；总耗三点精力，保留才女与孤高设定，两个结局及三章纪事均保留 | [开篇](../screenshots/immortal-journeys/window-chess-desktop-pending.jpg) · [完结纪事](../screenshots/immortal-journeys/window-chess-desktop-history.jpg) · [手机纪事](../screenshots/immortal-journeys/window-chess-mobile-history.jpg) |

西窗残局的三个月章节间隔通过测试页自带的“跳过并保存”控件推进；此控件只快进日历，不模拟这期间所有随机事件。这里的浏览器检查覆盖每个选项，八组完整组合仍由前述自动测试覆盖。正文、立绘、选择按钮和搜索后的原始纪事已逐图查看；两个视口均没有横向溢出，长页面可以滚动，按钮文字未被裁切。

双母纪事可直接对照：[生母沈知微](../screenshots/immortal-journeys/master-birth-mother-chronicle.jpg) · [养母许清容](../screenshots/immortal-journeys/master-foster-mother-chronicle.jpg)。她们记住的是同一个清和和同一位照玄道长，心绪分别保留清冷与温婉的区别。

发现并修正一处无障碍称呼：仙师画像的屏幕阅读器标签原为“照玄国师”，画面标题与台词原本正确。标签现使用人物实际道号“照玄道长”（另一师承为“云岑真人”），保留普通国师的原有称呼。修正后在本地同代码的桌面、手机页面再跑实际导入、角色标签及刷新检查；合入当前主线后全量 **927 / 927** 回归通过。

原始逐分支记录、恢复点、布局测量和人物纪事见 [浏览器验收数据](immortal-browser-results.json)。27 张截图保存在 `docs/screenshots/immortal-journeys/`，均取自这些场景的真实浏览器渲染。

### 重跑浏览器检查

```sh
node tests/immortal-journeys-fixtures.cjs /tmp/palace-immortal-browser-fixtures
npm install --prefix /tmp/palace-browser-qa-runtime --ignore-scripts --no-audit --no-fund playwright@1.65.1
NODE_PATH=/tmp/palace-browser-qa-runtime/node_modules PALACE_CHECK_ACCESSIBLE_NAME=1 node tests/immortal-browser-acceptance.cjs
```

运行器默认使用 macOS 已安装的 Google Chrome；其他环境通过 `PALACE_CHROME` 指定兼容浏览器路径。可通过 `PALACE_QA_URL` 指向同版本的本地 `dev.html`，或用 `PALACE_CASE`、`PALACE_VIEWPORT`、`PALACE_CHOICE` 单独重跑某条分支。测试仅在一次性浏览器上下文中导入演示档。
