# 赵令仪：固定身份、钦安殿问缘与后宫反响

本次入口、规则与剧情见 [人物经历说明](../character-experiences/court-family-life.md#令仪问缘钦安殿与国师)。实现位于 `js/gouyi-consort.js` 与 `js/gouyi-court-life.js`。

## 自动验证

2026-11-15：问缘与后宫反应版本全量 **1,244 项通过**；新增读史联动后 **1,275 项通过**，再合入半身立绘后 **1,279 项通过**。包括 50 项问缘专属测试、23 项读史状态与续接测试、8 个演示页导入检查。此前另通过 60 个月连续流程试玩、脚本语法与补丁空白检查。

- 12 个种子验证姓名赵令仪、沉静／念旧、422 号立绘与一致往事；不附加随机穿越身份，不占其他稀有经历名额。
- 四章的两种结果、暂缓后再来、实际国师、精力扣除、人物纪事及读档续接。
- 概率与月份间隔、同月防重、页面读取不抽签或修改状态。
- 死亡、冷宫、离宫、省亲、清修、病弱、晚孕、悲恸及传代时暂停；恢复条件后保留原问题。
- 六类后宫反应、实际关系变化、双方心声、在场限制、陈旧选择防重；新任皇后不会继续使用旧的低位场景。
- 本次修改之前由版本 16 实际生成的四份存档：相见、待入宫、已入宫结果、月结；保留其原有随机序列与未完选择。

执行命令：

```sh
node --test tests/palace-gouyi-life.test.cjs
node --test tests/*.test.cjs
node tests/palace-flow.cjs
```

## 浏览器验收状态

**8 张真实浏览器截图已拍摄并逐张检查**：河间初遇、人物页、掌心问因、灯下验影、友善邀茶、争宠反应、人物纪事与本人读史。文本、选项与立绘已检查，裁切不完整或立绘未加载的初拍已重新拍摄。[图文说明](../character-experiences/court-family-life.md#固定剧情妃赵令仪钩弋夫人) · [来源、修订与图片哈希](gouyi-screenshots.json)。

使用远程浏览器渲染公开演示页，沿用正式游戏脚本与样式。演示页在游戏加载前将存储替换为页面私有内存，不读写玩家存档。它确认画面能渲染，不等同于下列 84 条完整交互全部通过。当前会话的本地 Chrome、Firefox、WebKit 此前均在开页前退出；其他会话已完成的交互验收另见[宫廷生活验收](court-living.md)。

已经扩充可导入的临时测试存档与浏览器脚本：四段问缘各有两条选择和暂缓；六类反应及制止讥讽；覆盖桌面、手机、双方人物页与刷新。新场景共 40 条浏览器路径，加上原 44 条，共 84 条。这是待执行的验收范围，不是通过数量。

在浏览器可启动的环境执行：

```sh
node tests/court-family-browser-fixtures.cjs
# 启动本地站点，或用已发布的 dev.html 地址
PALACE_CASE=gouyi PALACE_QA_URL=http://127.0.0.1:8767/dev.html \
  node tests/court-family-browser-acceptance.cjs
```

浏览器脚本通过界面导入存档、点击选择、打开人物页与重新读取存档；截图及刷新对比仅在真正执行后产生。

文档截图可复拍：

```sh
node scripts/build-gouyi-gallery.cjs
# 发布演示页后，再拍正式网址；须逐图检查后更新 visualReview。
python3 scripts/capture-gouyi-gallery.py
```

## 发布核验

游戏提交 `bff2a17` 已推送 main。正式入口、测试入口、事务日志、两份钩弋脚本和 422 号图集共六项线上资源均返回 HTTP 200，且与本次提交逐字节一致。[资源核验明细](gouyi-production-results.json) · [Pages 部署](https://github.com/AubreyKuang/Forbidden-City/actions/runs/43771801669)。这是发布与资源核验，浏览器交互仍为上文所列待验收项。
