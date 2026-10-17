# 推小球闯关 V2 · ORBIT BALL

在原有 React / Three.js / Rapier 3D 游戏上升级，保留平台、真实球体碰撞、双关卡、暂停/失败/胜利/重试和「天下无敌」称号。

## 下载离线游戏

下载仓库根目录的 `推小球闯关-V2-离线版.html`：打开文件页面，点击 **Download raw file**（下载原始文件）。保存为 `.html` 后用 Windows Chrome 或 Edge 打开。所有 JavaScript、CSS、图标和 Rapier WASM 已内嵌，不需要服务器或网络。

当前验收环境禁止浏览器导航到 `file://`，因此未验证 Windows 上双击文件的运行方式。完整 HTML 已在断网 Chromium 中直接载入并显示 3D 场景，未发起 HTTP 请求，未出现运行错误。

## 玩法

- WASD / 方向键移动，左 Shift / 空格冲刺，Esc 暂停。
- 同色入洞 +1，错色入洞 -1，最低 0 分；间接碰撞入洞也结算，每颗球只结算一次。
- 玩家落洞或离开平台失败。
- 第一关 16 颗彩球，10 分通关，解锁第二关与「天下无敌」。
- 第二关 32 颗彩球，20 分通关。天空只掉炸弹，不再生成彩球。预警 1.5 秒后炸弹下落，接触平台或球体立即爆炸，玩家在 2.4 单位范围内扣 1 分并受物理击退。
- 炸弹本身不会直接判失败；击退后落洞仍失败。彩球不足以达标时需重试。
- 音效默认开启，顶部支持开关及音量调整；声音在开始或首次操作时解锁。

## 开发与验证

Node.js 24：

```sh
npm install
npm run dev
npm run build
npm test
npm run export:offline
```

离线输出：`dist-offline/推小球闯关-V2-离线版.html`。可指定输出路径：`node scripts/export-offline.mjs "推小球闯关-V2-离线版.html"`。

浏览器回归（另一个终端先运行 `npm run dev`）：

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
npm run export:offline
CHROMIUM_PATH=/usr/bin/chromium npm run test:offline
```

浏览器脚本使用本机 Chromium，`CHROMIUM_PATH` 可以指定其他 Chrome/Edge 可执行文件。`GAME_URL` 可覆盖开发地址。调试接口只存在于开发构建。离线测试通过直接载入 HTML 验证断网运行，不等价于 `file://` 双击验收。

## 代码结构与调参

- `src/game/config.ts`：物理参数、炸弹参数、关卡、随机生成。每个场地区域包含所有颜色；采样检查球间距、洞口和出生点安全距离。
- `src/game/store.ts`：得分事件、去重、关卡状态、炸弹伤害去重。
- `src/game/audio.ts`：Web Audio 程序音效，无外部音频。
- `src/components/Game.tsx`：物理/落洞监测、镜头、场景；记录入洞颜色，避免下落漂移丢失判定。
- `src/components/Balls.tsx`：玩家与目标球刚体、24 点轻量轨迹缓存。
- `src/components/Bombs.tsx`：预警、物理下落、接触爆炸、径向冲量、统一生命周期清理；暂停时移除现存炸弹并重置生成倒计时。
- `src/components/Effects.tsx`：漂浮分数、粒子与冲击波，播放结束自动清理。
- `scripts/export-offline.mjs`：内联构建结果及图标；Rapier compat 自带内嵌 WASM。

玩家质量 1，目标球质量 1.7；普通球线性阻尼 0.35、角阻尼 0.5；冲刺冲量保持 10.5。炸弹间隔从 4 秒递减到 1.5 秒，同时最多 5 颗。所有时间均随游戏模拟推进，暂停时不会积压系统定时器。

详细验证结果见 `TEST_REPORT.md`。
