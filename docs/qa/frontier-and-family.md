# 军功、昭雪、选秀页面、官员表与慈宁宫

## 规则与边界

- 北境出征记录实际将领，告捷后才论赏。现任军官依履历晋职，顶阶或不适合改职者可受荣衔；致仕后仍可赐金，不再晋职。战死、流放、革职或改朝后不冒出旧人请赏。同一军功不能重复兑现，暂缓可在理政页继续。
- 将领按性情求晋升、金银或荐女；荐女只使用成年、未婚且没有已定婚约的本人。既有父女与姐妹身份保留，不给兄长凭空捏造成年女儿。本人不愿留下也可继续赏功；入宫后移除宫外客籍副本，下一次出征读档不会分裂同一家谱。
- 身世疑云经记录、证词澄清后，母亲有具名纪事、低落心情与受冤后的委屈。性情影响台词与变化幅度；既有深切悲痛保留，近期对白在释怀、丧子、离宫或时过境迁后让位。不会因为查无实据就认定告密者蓄意诬陷。婴儿纪事只记录查证事实，不赋予成年人的主观回忆。
- 新妃安顿页保留选秀结束当月及次月，之后恢复下旨选秀；保留期间也可重新选秀。提前开选沿用国库、民心代价；同批身份、旧交与个人纪事不删。
- 官员表分列年龄与性格，所有筛选均排除未授官读书人，正式授官后列入。家族页面仍可查看和操作其学业、科名、授官。修正了手机插画媒体查询缺少结束括号的问题，恢复桌面官员表样式；桌面表格扩宽，手机为有标签的卡片，平板表格可在容器内横向查看。
- 太后有七类常规话题，以及真实子孙、母子昭雪、新人安顿和北境捷报四类条件话题。请安和朝堂共用称许间隔：全宫至少六个月，同一人至少十二个月；同月再请安为静坐。普通话题至少六个月不重复，并避开最近四个话题；生日与子嗣劝告另有间隔。

## 验证结果

2026-11-15：**1,097 项自动测试通过**，另通过连续六十个月流程。使用真实版本 `f461da2` 的代码生成三个版本 12 兼容存档，验证北境结果、身世昭雪结果与太后称许结果按旧规则续接；版本 11 的选秀、生产及联姻兼容测试同时通过。新动作日志版本为 13，不篡改旧事件的随机记录。

浏览器使用独立 Chrome 无头上下文，从新局的存档页面实际导入演示档，再点击事件、人物、筛选与纪事搜索。每次刷新均实际点击「读取自动存档」，页面脚本只读取断言，不执行游戏动作或改写状态。桌面为 1440×1000、手机视口为 390×844，另验官员表 820×900 平板视口；视口模拟不代表真机验收。

| 场景 | 每个桌面/手机场景刷新次数 | 核对内容 |
| --- | ---: | --- |
| 功臣荐女留宫 | 6 | 同一姓名、父亲、立绘、册封后独立赏功 |
| 女儿不愿留宫 | 5 | 无强纳选项，仍可赐金 |
| 已有妃嫔的姐妹 | 6 | 同一家谱、亲姐妹关系与宫中记事 |
| 晋为骠骑将军 | 4 | 原总兵履历、御前请赏、女儿记事 |
| 求金银 | 4 | 木兰诗化用、一次扣款 |
| 暂缓封赏 | 4 | 关闭后从理政军功册续办 |
| 败军返回 | 1 | 不出现庆功和封赏入口 |
| 母子昭雪 | 3 | 委屈、心情下降、具体孩子与纪事 |
| 安顿页内重新选秀 | 3 | 可取消、代价、生成新人、保留旧批次 |
| 安顿页到期 | 3 | 不再展示旧人为新人、选秀入口恢复 |
| 官员表 | 2 | 独立列、实际样式、四类筛选、未授官者隐藏 |
| 太后称许 | 3 | 刷新保留间隔，同月不重复称许 |
| 太后日常 | 3 | 固定话题与话语、一次记录、同月静坐 |

加上平板官员表，合计 **27 条场景、96 次刷新读档**，全部通过，没有脚本错误或页面横向溢出。官员表额外核验桌面单元格样式与手机卡片布局，避免只凭文字断言漏掉样式失效。候选人的派生宗族键按存档迁移规则归一后比较，人物身份与实际经历仍严格比较。结构化结果见 [frontier-browser-results.json](frontier-browser-results.json)。

官员布局快照只调整官员表对应页面，反映明确要求移除读书人以及拆分两列；其他页面的操作保全快照未改。各功能另有资格、重复回调、死亡、换代、预算不足与旧档测试。

## 实测截图

| 内容 | 桌面 | 手机视口 |
| --- | --- | --- |
| 求晋升 | [查看](../screenshots/frontier/request-promotion-desktop.jpg) | [查看](../screenshots/frontier/request-promotion-mobile.jpg) |
| 功臣荐女 | [查看](../screenshots/frontier/daughter-daughter-desktop.jpg) | [查看](../screenshots/frontier/daughter-daughter-mobile.jpg) |
| 姐妹奉召 | [查看](../screenshots/frontier/daughter-family-daughter-desktop.jpg) | [查看](../screenshots/frontier/daughter-family-daughter-mobile.jpg) |
| 将领履历 | [查看](../screenshots/frontier/general-history-promotion-desktop.jpg) | [查看](../screenshots/frontier/general-history-promotion-mobile.jpg) |
| 昭雪后的委屈 | [查看](../screenshots/frontier/parentage-cleared-desktop.jpg) | [查看](../screenshots/frontier/parentage-cleared-mobile.jpg) |
| 母亲纪事 | [查看](../screenshots/frontier/parentage-chronicle-desktop.jpg) | [查看](../screenshots/frontier/parentage-chronicle-mobile.jpg) |
| 安顿页与重新选秀 | [查看](../screenshots/frontier/arrivals-desktop.jpg) | [查看](../screenshots/frontier/arrivals-mobile.jpg) |
| 安顿页到期 | [查看](../screenshots/frontier/expired-desktop.jpg) | [查看](../screenshots/frontier/expired-mobile.jpg) |
| 官员表 | [查看](../screenshots/frontier/officials-desktop.jpg) | [查看](../screenshots/frontier/officials-mobile.jpg) |
| 慈宁宫日常 | [查看](../screenshots/frontier/dowager-chat-desktop.jpg) | [查看](../screenshots/frontier/dowager-chat-mobile.jpg) |

[平板官员表](../screenshots/frontier/officials-tablet.jpg)。

## 复现

```sh
python3 scripts/build-dev.py
node --test tests/*.test.cjs
node tests/palace-flow.cjs
node tests/palace-frontier-browser-fixtures.cjs
python3 -m http.server 8428
# 另开终端；本机须已安装 Playwright 和 Chrome，可通过环境变量配置路径。
NODE_PATH=/path/to/node_modules node tests/palace-frontier-browser-acceptance.cjs
```

浏览器脚本支持 `PALACE_QA_URL`、`PALACE_CHROME`、`PALACE_FIXTURES`、`PALACE_SHOTS`、`PALACE_BROWSER_RESULTS` 和单场景 `PALACE_CASE`。截图与结果写入仓库对应目录；个人浏览器和玩家存档未使用。
