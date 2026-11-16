# 人物往事与跨代亲族

本次修复包括：赵令仪旧档往事缺失、三段河间旧事、按实际育儿经历问国师，以及传代保留太后母家和先朝外戚。

- 全量回归：1,785 项全部通过；另通过连续 60 个月游戏流程检查。
- 新事务版本为 27，兼容原版 v24、v25、v26 的真实未完存档。先结束原有事件，再启用新规则。
- 传代验证覆盖：原人物 ID 与立绘不变、死讯保留、学生不自动授官、官员差事跨代办结、亲属婚姻不丢失、年龄增长、多次传代超过旧档五朝上限、太后家事纪事与存读档。
- 赵令仪验证覆盖：缺失／失效往事编号、人物页与母女夜话、三段六种回应、冷却、取消、过期选项、一次扣费、人物记忆、分层闲聊与重读。
- 祈愿验证覆盖：已育、现养、曾养、出宫、先朝、年幼／成年、失散／离世、忧虑及隐情保密；显示不会消费随机数，每胎原话保存并进入纪事。

线上演示使用公开的虚构存档与隔离存储，不读取玩家进度。页面在真实浏览器中点击实际 DOM 按钮，并检查结果与存读档；绿色状态条代表断言全部通过。截图采用远程浏览器，不能代替本地 Playwright 的完整鼠标、键盘验收。本环境本地 Chrome 启动失败，因此按此方式补充线上验证。

复现命令：

```sh
node --test tests/*.test.cjs
node scripts/build-personal-context-gallery.cjs
python3 scripts/capture-gouyi-gallery.py --gallery personal-context
```

对应脚本：[浏览器断言](personal-context-gallery/bootstrap.js)、[测试场景生成器](../../scripts/build-personal-context-gallery.cjs)。

## 线上验收场景

六个场景均通过页面内浏览器断言和截图复核；发布资源逐一校验均为 HTTP 200，内容与已测试的本地版本一致。

| 场景 | 核对内容 | 证据 |
| --- | --- | --- |
| 旧档赵令仪主页 | 往事编号缺失仍显示专属背景，422 立绘与人物入口保留 | [截图](../screenshots/personal-context/profile.jpg) |
| 河间旧事 | 点击入口和选择、一次扣费、纪事、存档恢复 | [截图](../screenshots/personal-context/past.jpg) |
| 已育妃嫔问国师 | 正确提及先朝子女，原话进纪事，重读不重复 | [截图](../screenshots/personal-context/prayer.jpg) |
| 养母问国师 | 说明真实抚养关系，不误称第一次为母或亲生 | [截图](../screenshots/personal-context/foster.jpg) |
| 新帝改元 | 实际点击登基，家族页保留太后母家、外祖父、国舅和旧亲族 | [截图](../screenshots/personal-context/succession.jpg) |
| 跨代官员主页 | 原 ID 与在办差事保留，问候后读档可续接 | [截图](../screenshots/personal-context/official.jpg) |

太后立绘中的家族副本只作显示缓存，原家族名册是权威记录。回归测试保留了真实触发过续接失败的 v27 存档，核对不会因 JSON 丢失共享引用而再阻断读档。

[截图与浏览器记录](personal-context-screenshots.json) · [线上资源逐一核对](personal-context-production.json)
