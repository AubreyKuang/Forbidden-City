# 钩弋夫人剧情立绘

固定编号为 **422**，即程序使用的零基 `portraitCell` / `portraitOverride`
编号，**不要加一**。具名常量：`STORY_CONSORT_PORTRAITS.gouyi`。

```js
consort.artPortrait = STORY_CONSORT_PORTRAITS.gouyi;
consort.portraitOverride = STORY_CONSORT_PORTRAITS.gouyi;
```

在剧情妃创建时设置上述字段即可；两种字段均支持独立显示。保存的编号
不会因册封、迁宫、换装、重读存档或再次调用 `assignConsortPortrait` 改变。
这张图不在任何普通、异域或宫女的随机立绘池里，保留为钩弋夫人专用。
剧情模块 `js/gouyi-consort.js` 已绑定此编号；出巡 → 浩荡巡狩可遇见她，入宫后续有「钩弋掌心」三幕经历。

图集：`assets/images/palace-consort-gouyi.webp`。画面位于第一格，
物理大小 448 × 560，游戏逻辑大小 112 × 140；图集其余格为空。
使用现有 `porImg(consort)` / `portraitCell(consort)` 即可显示。
不要将整个四列图集直接作为单张角色 `<img>` 展示。

美术：月白与青玉色、金绣云鸟纹、汉风交领宽袖，清婉秀美的半身构图。
玉钩是钩弋传说的艺术化意象，并非有据可考的真实容貌或服饰复原。
原图与稳定编号的对应关系见 `gouyi-portrait-source.json`。

原图：`exec-3f04e16c-396b-419b-8119-510234ffe1bd.png`。
原图只做比例缩放和透明图集排版，没有重绘人物。
