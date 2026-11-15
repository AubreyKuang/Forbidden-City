# 议亲姐妹探访与选秀旧识

## 玩法与记录

- **来访与婚事并存**：二十岁以上的未婚姐妹可以在探亲时请议婚事；议亲事件也有「召她入宫，亲自听听婚事」。来访者始终是家谱中的同一个人。
- **赐婚**：记录双方姓名、议亲对象和赐婚缘由，双方家庭都收到消息；姐妹领旨归家，不再留宿。沿用现有婚嫁系统，赐婚后立即计作已婚。
- **留宫**：成年未婚且愿意留宫的姐妹可以受封，包括正在议亲者。仅在最终册封时取消原议亲，记入她本人、宫中姐妹、原议亲对象及其在宫亲人的纪事；原本可结姻亲的两家交情下降 6，新妃与对方在宫亲人交情下降 8。双方不会被误标为已经成婚。
- **暂缓或婉拒**：原婚事与探亲归期保持不变。已婚、已有配偶、已赐婚、未成年或已离开探亲地点者不进入新的纳妃分支。没有现成议亲的成年姐妹也可以请议人选。
- **选秀旧缘**：生成候选时，一批至多两位与现有妃嫔有旧识背景，每位旧人在该批只引出一位；每名妃嫔累计至多三位这样入宫的旧识。不是每批必有。家世差距过大、亲姐妹、穿越者及不合来处的外国背景不编造这种共同童年。
- **年龄可核对**：只有两人都曾在 5–14 岁、且早于旧人入宫的时间相识，才写童年往事；其余写两家往来，不称一起长大。
- **重逢有后续**：名册、觐见、双方记事与人物链接都保留同一段旧缘。温和、善妒、清静自持者的回应不同；半年后根据实际恩宠和关系记一次后话。已有敌意不会被旧交抹去，冷宫、离宫者不被编进当面重逢。

## 自动与浏览器验证

合入 `996bfb4` 的页面整理后，全量 **1,019 项自动测试通过**。自动测试覆盖赐婚、改议亲留宫、暂缓、婉拒、国库不足、失效选择、身份立绘保留、禁止重复婚嫁、年龄与婚姻边界、旧识关系双向记录、性格与恩宠差距、界面不重新抽签，以及真实版本 10 未完探亲存档的回放。议亲对象在探亲期间离世或另娶时，会先记明原婚事作罢，不继续把失效对象列作待婚人选，也不会给已故者追加当下的记忆。

Chrome 无头浏览器使用独立临时上下文，按真实界面创建新局、导入四份测试存档、点击选项、刷新页面，再点击「读取自动存档」。状态读取用于断言；不在页面内注入状态或执行选项函数。手机验证为 **390×844 视口**，桌面为 **1440×1000**，并非手机真机测试。

| 场景 | 检查内容 | 每个尺寸刷新次数 |
| --- | --- | --- |
| 探亲请婚后赐婚 | 姐妹与对象同记婚事、扣费一次、领旨归家 | 4 |
| 议亲姐妹留宫 | 原亲事作罢、身份立绘保留、原议亲家庭记事 | 4 |
| 留宫暂缓 | 保留原议亲与探亲归期 | 4 |
| 姐妹婉拒 | 不取消婚事、不重复要求她留宫 | 4 |
| 选秀旧识留选 | 觐见旧事、名册背景、册封与双方纪事、善妒心情 | 5 |
| 选秀旧识落选 | 不凭空产生宫中重逢与入宫关系 | 3 |
| 半年后的恩宠差距 | 「我虽眼热」对白、点名对方、保存记事 | 2 |

共 **14 条分支、52 次刷新读档**。逐次比较人物、候选、关系、国库、记事和未完弹窗；检查页面与弹窗无横向溢出，未出现浏览器脚本错误。结构化结果见 [kin-visits-browser-results.json](kin-visits-browser-results.json)。连续六十个月流程测试亦通过。

## 截图

| 内容 | 桌面 | 手机尺寸 |
| --- | --- | --- |
| 探亲请婚 | [查看](../screenshots/kin-visits/petition-desktop.jpg) | [查看](../screenshots/kin-visits/petition-mobile.jpg) |
| 改议亲留宫 | [查看](../screenshots/kin-visits/courtship-desktop.jpg) | [查看](../screenshots/kin-visits/courtship-mobile.jpg) |
| 原议亲家庭的纪事 | [查看](../screenshots/kin-visits/changed-marriage-chronicle-desktop.jpg) | [查看](../screenshots/kin-visits/changed-marriage-chronicle-mobile.jpg) |
| 选秀时的旧缘 | [查看](../screenshots/kin-visits/old-friend-audience-desktop.jpg) | [查看](../screenshots/kin-visits/old-friend-audience-mobile.jpg) |
| 重逢后的心情 | [查看](../screenshots/kin-visits/old-friend-reunion-desktop.jpg) | [查看](../screenshots/kin-visits/old-friend-reunion-mobile.jpg) |
| 半年后各有际遇 | [查看](../screenshots/kin-visits/old-friend-later-desktop.jpg) | [查看](../screenshots/kin-visits/old-friend-later-mobile.jpg) |

## 复现

```sh
node --test tests/*.test.cjs
node tests/palace-flow.cjs
node tests/kin-visits-browser-fixtures.cjs /tmp/palace-kin-visits-fixtures
python3 -m http.server 8428 --bind 127.0.0.1
# 在单独安装了 Playwright 的运行环境中执行；通过 PALACE_CHROME 指定 Chrome。
NODE_PATH=/path/to/runner/node_modules node tests/kin-visits-browser-acceptance.cjs
```

可用 `PALACE_QA_URL` 指定线上 dev.html，`PALACE_SHOTS` 与 `PALACE_BROWSER_RESULTS` 指定输出位置。截图来自实际浏览器，README 仅展示功能。

## 存档兼容

事务日志版本为 11，继续接受 2–10。版本 10 及以前未结束的场景不追加这些选项、不生成旧识，也不额外消耗随机数。结束旧事件后，下一次操作使用新规则；`tests/fixtures/kin-visits-legacy-v10.json` 从未改动的 `737857f` 生成，不靠修改版本号伪造旧档。
