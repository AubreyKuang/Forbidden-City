# 朝臣、婚育家书、巡访与钩弋：验证记录

本批包括官品与实绩批奏、家庭心绪、姻亲婚育与丧偶、家世日常、姐妹互动、兄弟提携、中宫心事、探花指婚、扩名防重、锦衣卫密札、门第议论，以及钩弋固定妃和 25 张立绘。

## 自动检查

使用 Node 22。完整结果在最终提交时填写；测试代码可独立复跑：

```sh
python3 scripts/build-dev.py
node --test tests/*.test.cjs
node tests/palace-flow.cjs
node tests/court-family-browser-fixtures.cjs
```

重点边界包括旧版 8／10／11 未完场景的回放，现职变化后旧折不可升迁，晋降上下界与间隔，真实血缘／姻亲，既有妊娠与丧偶后的区别，死亡与未成年过滤，个人心愿，单次事件重复操作，以及每个新演示场景各首层选择后的保存恢复。

## 浏览器状态：未验收

2026-11-15，尝试用项目 Playwright 测试脚本启动独立临时 Chrome。启动在创建页面前退出（SIGABRT），环境同时报告进程权限受限。提升权限的请求被当前策略自动拒绝（`sandbox_approval: false`）。本次没有成功运行任何浏览器场景，没有新实机截图，不能把自动化逻辑测试等同于浏览器通过。

已备好 12 份可从游戏存档界面导入的演示档，和桌面 1440×1000／手机 390×844 共 44 个分支的浏览器验收脚本：

```sh
node tests/court-family-browser-fixtures.cjs
python3 -m http.server 8767 --bind 127.0.0.1
# 在已安装 Playwright 且允许启动独立浏览器的环境运行：
node tests/court-family-browser-acceptance.cjs
# 上线后可改用生产页面：
PALACE_QA_URL=https://aubreykuang.github.io/Forbidden-City/dev.html node tests/court-family-browser-acceptance.cjs
```

浏览器脚本通过真实存档导入、按钮点击、人物链接与刷新读档验证；页面脚本仅用于读取状态和布局。仍需实跑，结果写入 `court-family-browser-results.json`，截图写入 `docs/screenshots/court-family/`。如果界面或选择器与预期不符，须修复后再验。

人工重点检查：

1. 钦点三甲三人姓名和立绘不同；续接探花议婚，公主／姐妹双方人物链接对应同一官员。
2. 批好／坏回奏各三个选项，老婆及妃嫔纪事均保留完整报告与感受，刷新不重复扣钱、升官。
3. 守寡后入宫小住、赐助、再嫁许可不产生即时新婚；孕妇探亲及安全分娩／产厄真实留档。
4. 锦衣卫三种线索处理，未查实不处罚；指挥使及相关人物纪事、下一月回报。
5. 钩弋相见、展掌、入宫／归家；422 号画面、宫室限制、三幕后续及刷新恢复。
6. 家族升迁后的公开／私下议论与知情范围；姐妹串门只出现在宫殿入口。
7. 24 张官员图与 422 号均加载成功，窄屏按钮不溢出、无控制台脚本错误。
