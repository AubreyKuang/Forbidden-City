# 科举日程与入口验收

默认三年一科。新档由元年三月开始，正常推进 36 个月后，在四年三月自动弹出「殿试 · 钦点三甲」，其后为七年、十年三月。正科按本朝年次排定，可选每年、三年、五年或十年一科；恩科仍单独奏开。

线上检查确认周期设置已经发布。本次没有复现正常转月漏触发，但设置原来只在六部的礼部卡片中，首科日期也容易误解。理政和六部页上方现直接展示当前周期、下一科日期、最近一科状元及「调整科举周期」按钮。礼部尚书空缺不会阻止正科殿试。

## 自动回归

```sh
node --test tests/palace-exam-schedule.test.cjs tests/palace-offices.test.cjs tests/palace-governance-life.test.cjs
node --test tests/palace-gouyi-gallery.test.cjs tests/palace-dev.test.cjs
```

共 88 项相关回归通过，其中包含真实新档连续 36 个月、四种周期从二月转入三月、没有礼部尚书时开考、未完殿试刷新恢复、三甲身份不变与授官不重复。同时验证旧事件显示期间入口仍保留、六部页入口位于任命卡片上方。新增面板只读取现有日程，不改变游戏存档或既有未完事件的抽签。

## 浏览器验收

```sh
NODE_PATH=/path/to/playwright/node_modules node tests/exam-schedule-browser-acceptance.cjs
```

使用真实按钮新开一局，在理政页直接调整周期；另通过文件导入四年二月的测试档，再点击结束本月触发殿试。桌面 1440×1000、手机 390×844 共 4 场景、10 次刷新恢复全部通过。报告：[本地验收](exam-schedule-local-browser-results.json)。

正式站验证及截图在部署后补充。
