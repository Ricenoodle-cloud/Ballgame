# 推小球闯关 V3 · 梦幻几何世界

基于 V2 的完整 React / Three.js / Rapier 游戏升级。原创的「Aurelia Orbit」悬浮几何花园，以奶油白、雾蓝、浅粉与香槟金呈现圆形竞技场、魔法光轨和宁静的程序音乐。场景、建筑、几何装饰、旋律与音色均通过项目代码创作，不使用其他游戏的关卡或音频素材。

## 下载离线游戏

打开当前分支根目录 `推小球闯关-V3-梦幻几何版.html`，点击 GitHub 的 **Download raw file**，保存为 `.html`。在 Windows Edge / Chrome 中双击打开。

所有 JavaScript、CSS、图标、Rapier WASM 和音乐生成程序均内嵌；不需要服务器、CDN 或在线音频。V2 离线 HTML 也保留在仓库中。

当前测试环境的浏览器管理员策略可能禁止 `file://` 导航。测试脚本会首先尝试直接打开文件，仅在明确收到该策略错误时改用断网浏览器直接载入完整 HTML。实际结果见 `TEST_REPORT.md`；不能把这种替代验证当作 Windows 双击验收。

## 玩法与声音

- WASD / 方向键移动；左 Shift / 空格冲刺；Esc 暂停。
- 同色能量井 +1，错色 -1，最低 0 分。间接碰撞进洞照常结算，球只结算一次。
- 玩家落井或滚出圆形平台失败。
- 第一关：16 颗混合彩球，10 分通关，解锁「天下无敌」及第二关。
- 第二关：32 颗地面彩球，20 分通关。天空只掉炸弹：预警 1.5 秒后下落，接触地面或球体即爆炸，玩家在 2.4 单位范围内扣 1 分并受真实冲量。模型与预警同步清理。
- 顶部声音按钮可分别开关背景音乐、游戏音效，调整两个音量。设置与关卡解锁分别存入 localStorage；存储不可用时仍可游玩，但无法保存设置。
- 浏览器要求首次点击/按键后才能发声，主菜单初次加载时不会强行自动播放。解锁后菜单及游戏均播放原创 BGM，第二关加入少量悬念音符；暂停时音乐降低音量。

## V3 实现

- 半径 9 的平滑圆盘，厚度 0.9；四井中心位于 `(±4.4, ±3.6)`。渲染与静态 Trimesh Collider 使用同一开孔几何体，没有完整圆柱/方形碰撞体。侧面金线及环形台阶只是开放装饰环，不会封井。
- 彩球使用 `sqrt(U)` 的圆形面积均匀采样，再检查球间距、洞口、出生点与边缘安全距离。每个象限包含所有颜色。炸弹落点也采用圆形采样并避开洞口。
- 金色 Ribbon Trail 使用 64 点轨迹上限、预分配动态 GPU 缓冲区和 16 个复用闪光粒子。渐细/渐淡、跟随转弯、冲刺增强，暂停/失败/重开时清理；不参与碰撞。
- 原创拱门、悬浮阶梯、石柱、漂浮几何块和光点都放在可玩圆盘外；柔光、阴影、轻雾与无 Bloom 的清晰色彩。
- Web Audio 原创乐曲为 72 BPM、32 小节，约 106.7 秒；四组八小节变化乐句，包含钟琴/钢琴式衰减音、温暖和弦铺底及本地生成的混响。持续调度音符并保留尾音跨越循环，无音频文件或网络请求。

## 开发与测试

Node.js 24：

```sh
npm install
npm run dev -- --port 5174
npm test
npm run build
npm run export:offline
```

输出：`dist-offline/推小球闯关-V3-梦幻几何版.html`。也可执行 `node scripts/export-offline.mjs "推小球闯关-V3-梦幻几何版.html"` 指定路径。

另开终端，在开发服务器运行时执行：

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
CHROMIUM_PATH=/usr/bin/chromium node tests/audio-trail-browser.mjs
CHROMIUM_PATH=/usr/bin/chromium npm run test:offline
```

`GAME_URL` 可覆盖默认 `http://localhost:5174`；音频回归会实际等待完整乐曲跨越循环边界，约两分钟。浏览器需支持 WebGL、Web Audio。调试接口仅存在于开发构建，正式离线包不包含这些接口。

## 主要文件

- `src/game/config.ts`：物理、关卡、圆盘生成与安全距离。
- `src/game/arenaGeometry.ts` / `src/components/Arena.tsx`：同源圆形开孔渲染与物理、装饰。
- `src/components/DreamWorld.tsx`：原创几何建筑背景。
- `src/components/GoldenTrail.tsx`：动态金色渐变光带与粒子。
- `src/game/audio.ts`：原创乐谱、实时音乐调度、合成音效及音频设置存档。
- `src/game/store.ts`：得分去重、炸弹伤害、解锁与胜负状态。
- `tests/`：真实 Rapier 物理、规则、生成、音频、浏览器与离线回归。

详细测试结果及平台限制见 `TEST_REPORT.md`。
