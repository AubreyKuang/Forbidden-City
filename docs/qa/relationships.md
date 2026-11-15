# 选秀交好、探亲留宫、首饰与家中牵挂

## 玩法与边界

- **候选交好**：候选名册生成时，至多两对具名友人，每人最多参与一对。关系至少 30 且双方均无仇怨，名单确定后才会有私语。两人都留选、一人留选分别有不同对白；都落选时不触发。善妒、温婉、活泼、谨慎、才女与喜静者各有回应。入宫不重抽原有交情，未留选的好友保留姓名与共同来处。
- **探亲留宫**：同一家族可以从不同姐妹的家谱进入来访者资料，按实际接待人识别探亲。资料页直接提供「询问留宫意愿」，未成年、已婚、已赐婚、已婉拒、归家与位分不足仍受限制。议亲未定者可以留宫，最终册封才取消原议亲。
- **佩戴位置**：皇后默认九凤点翠冠，六种御赐首饰均戴在头部，使用各立绘的头部定位。详情、头像与 Canvas 路径使用同一套定位；收起自选首饰后恢复皇后默认凤冠。自动检查覆盖全部妃嫔图库，浏览器实际换戴金凤冠、牡丹簪并刷新。
- **产后心事**：平安生产后固定一次反应。性情、已有皇子、受眷与失去孩子的经历影响是否遗憾未得皇子；有皇子的本胎不会出现此遗憾。多胎提到全部孩子。母亲记忆指向具体孩子；婴儿只记录照护，不拥有母亲私下的成年心事。难产亡故、死胎、隐瞒小产或已发生换婴不编造温馨相见。分离、丧子与时间推移后，闲谈不继续沿用过时的产后对白。
- **两家姻亲**：具名兄弟与姐妹成婚后，宫中两位亲人的正常关系至少到交好门槛，喜静者显示敬重；旧怨保留。双方留下新人的姓名、亲缘与各自心情，人物「家人与孩子」中可听姻亲道喜，六个月后可以再聊家常。已故、冷宫、离宫或相关亲人亡故时不安排当面相见。重复回调与读档不反复加关系。
- **旧婚事**：核对双方配偶姓名、所属家族和互为夫妻的记录后，补上具名姻亲关联。没有证据的旧婚事不猜人，不编造原婚期；仅议亲、已取消的婚事不算姻亲。

## 验证

2026-11-15 使用独立 Chrome 无头浏览器上下文，真实点击新局、导入演示存档、选项、人物页和人物纪事搜索，刷新后点击「读取自动存档」。页面状态只用于读取断言，未在页面内执行游戏动作或改写状态。桌面 **1440×1000**，手机布局 **390×844**；手机尺寸属于视口测试，并非真机验收。

| 场景 | 每个尺寸刷新次数 | 核对重点 |
| --- | ---: | --- |
| 两位好友都留选 | 6 | 私语、性情、双方具名纪事、一次写入 |
| 第一位留选 | 6 | 未留选者名字、告别与旧交记录 |
| 第二位留选 | 6 | 撂牌在前仍保留人物与告别 |
| 两位都落选 | 4 | 没有私语、没有入宫关系 |
| 原好友已成仇 | 4 | 不强制亲密、不制造友好对白 |
| 从另一位姐妹家谱留宫 | 3 | 实际接待人、直接入口、同一身份册封 |
| 已婚姐妹探亲 | 1 | 显示婚姻状态及不可纳妃原因 |
| 皇后佩戴首饰 | 4 | 默认凤冠、换冠、换簪、收起、名册头像 |
| 生女后的复杂心情 | 2 | 疼爱与遗憾并存、母亲和孩子纪事 |
| 生皇子的反应 | 3 | 赐名、没有未得皇子的矛盾台词 |
| 双生公主 | 4 | 逐个赐名、全部孩子姓名、淡泊性情 |
| 新结两家姻亲 | 5 | 赐婚、交好、道喜、双方纪事 |
| 旧婚书补关联 | 3 | 核对旧婚事、一次补记、对话续接 |

合计 **26 条分支、102 次刷新读档**，各场景检查人物、关系、孩子、纪事和未完弹窗一致，无浏览器脚本错误与横向溢出。结果见 [relationships-browser-results.json](relationships-browser-results.json)。

全套自动测试 **1,060 项**，另有连续六十个月的完整流程验证。真实旧版本 `4f97a46` 生成的版本 11 选秀待决、生产结果、赐婚结果存档分别验证续接；旧事件使用旧版规则完成，之后才适用新内容。月底自动收束选秀也验证了待决告别的刷新恢复。

## 实测截图

| 内容 | 桌面 | 手机视口 |
| --- | --- | --- |
| 两人留选 | [查看](../screenshots/relationships/selection-both-desktop.jpg) | [查看](../screenshots/relationships/selection-both-mobile.jpg) |
| 一人留选 | [查看](../screenshots/relationships/selection-first-desktop.jpg) | [查看](../screenshots/relationships/selection-first-mobile.jpg) |
| 探亲直接入口 | [查看](../screenshots/relationships/sister-desktop.jpg) | [查看](../screenshots/relationships/sister-mobile.jpg) |
| 皇后默认凤冠 | [查看](../screenshots/relationships/empress-default-desktop.jpg) | [查看](../screenshots/relationships/empress-default-mobile.jpg) |
| 换戴金凤冠 | [查看](../screenshots/relationships/empress-goldphoenix-desktop.jpg) | [查看](../screenshots/relationships/empress-goldphoenix-mobile.jpg) |
| 产后复杂心情 | [查看](../screenshots/relationships/birth-daughter-desktop.jpg) | [查看](../screenshots/relationships/birth-daughter-mobile.jpg) |
| 母亲纪事 | [查看](../screenshots/relationships/birth-daughter-chronicle-desktop.jpg) | [查看](../screenshots/relationships/birth-daughter-chronicle-mobile.jpg) |
| 姻亲道喜 | [查看](../screenshots/relationships/marriage-desktop.jpg) | [查看](../screenshots/relationships/marriage-mobile.jpg) |
| 姻亲纪事 | [查看](../screenshots/relationships/marriage-chronicle-desktop.jpg) | [查看](../screenshots/relationships/marriage-chronicle-mobile.jpg) |

## 复现

```sh
node --test tests/*.test.cjs
node tests/palace-flow.cjs
node tests/palace-relationships-browser-fixtures.cjs
python3 -m http.server 8428 --bind 127.0.0.1
# 另一个终端，需可用的 Playwright 和 Chrome：
NODE_PATH=/path/to/node_modules node tests/palace-relationships-browser-acceptance.cjs
```

`PALACE_CHROME` 指定浏览器，`PALACE_QA_URL` 指定页面；`PALACE_FIXTURES`、`PALACE_SHOTS`、`PALACE_BROWSER_RESULTS` 分别指定演示存档、截图与结果目录。`PALACE_CASE` 可以只验证表中的一个场景。
