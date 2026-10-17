# 推小球闯关 · ORBIT BALL

一款完整的浏览器 3D 物理推球游戏。React + TypeScript + Vite、Three.js / React Three Fiber / drei、Rapier、Zustand。美术全部由程序生成，无付费素材、远程字体或外部运行时资源依赖。

## 运行

项目通过 `.nvmrc` 与 `package.json` 固定使用 Node.js 24.x LTS。在项目根目录执行：

```sh
npm install
npm run dev
```

打开 Vite 在终端打印的地址。生产构建与本地预览：

```sh
npm run build
npm run preview
```

`dist/` 可部署到任意静态网站托管服务。标准构建需要通过 HTTP 服务运行，不能直接双击 dist/index.html。

也可运行 `npm run export:offline`，生成 `dist-offline/推小球闯关.html`。该文件内嵌所有 JavaScript、CSS 与物理 WASM，可以下载后直接用浏览器打开，无需联网。需现代浏览器及 WebGL，推荐桌面 Chrome / Edge / Firefox。Rapier 的 WebAssembly 包含在构建产物内。

## 在 Vercel 正式上线

完整源码位于本仓库根目录：`package.json`、`src/`、`public/`、`index.html` 与 `vercel.json` 均在正确位置，无需解压或设置子目录。

1. 先在 GitHub 合并本次 Pull Request 到 `main`。
2. 登录 [Vercel](https://vercel.com/new)，选择 **Add New → Project**，连接你的 GitHub 账号，导入 **Ricenoodle-cloud/Ballgame**。如果列表没有仓库，在 GitHub 授权设置中允许 Vercel 访问此仓库。
3. **Root Directory** 保持根目录（`.`），**Framework Preset** 选择 **Vite**，**Node.js Version** 选择 **24.x**。
4. `vercel.json` 已配置以下设置；如果界面有自定义覆盖值，请改成一致：

   | 设置 | 值 |
   | --- | --- |
   | Install Command | `npm ci` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Production Branch | `main` |

5. 不需要配置任何环境变量，也不需要后端、数据库或 API 密钥。点击 **Deploy**，等待部署完成后，打开 Vercel 提供的 HTTPS 地址即可游玩。
6. 日后合并代码到 `main`，Vercel 会自动重新发布正式版本；其他分支和 Pull Request 可生成预览部署。

上线后请确认场景正常显示，开始游戏后可使用 WASD / Shift，Esc 暂停与继续可用。游戏解锁状态保存在浏览器 localStorage，预览域名、正式域名和自定义域名的存档各自独立。

`dist/`、`node_modules/`、离线导出、交付 ZIP 和本地缓存不提交到 Git。Vercel 会从锁文件重新安装依赖并构建 `dist/`。仓库原有的 `main` 文件保持原样。

## 操作与规则

- WASD / 方向键：相对于屏幕方向持续施加物理冲量，斜向输入归一化，松手自然减速。
- 左 Shift / 空格：沿当前输入方向冲刺；无输入时沿上次有效方向，冷却 1.5 秒。
- Esc：暂停 / 继续；窗口失焦自动暂停。
- 窄屏提供触摸方向键和冲刺按钮。
- 同色目标球自然落入相应洞口 +1；球与球的间接连锁入洞同样计分。
- 错色或离开平台的目标球被清理，不计分。玩家落入任意洞口或离开平台则失败。
- 第一阶段「静态推球」：16 球（四种颜色各 4 球），10 分通关。不补球；当剩余球不足以完成目标时提示重试。
- 完成第一阶段获得「天下无敌」，解锁第二阶段「天上来敌」。解锁和称号写入 localStorage；清除浏览器站点数据将重置进度。
- 第二阶段以 16 球开局，目标 20 分；空中生成间隔由 3 秒逐步缩短至 0.8 秒，最多 40 个活跃目标球。达到上限暂停生成，空位出现后恢复。
- 暂停同时冻结物理、生成计时、关卡时间和冲刺冷却；胜利停止物理和生成。失败先播放短暂的真实下落过程，再停止物理。

## 项目结构

```text
src/
  App.tsx                 主菜单、关卡选择、HUD、暂停、胜败及触控 UI
  style.css               响应式界面与动效
  components/
    Game.tsx              Canvas、摄像机、物理世界、统一进洞扫描、生成调度
    Arena.tsx             平台、边框、洞口光环、固定碰撞体
    Balls.tsx             玩家刚体、冲刺、真实滚动皮肤、目标球、落点预警
    Effects.tsx           粒子、碰撞闪光、+1 浮字与庆祝
  game/
    config.ts             物理参数、关卡参数、洞口与初始球布局、生成策略
    arenaGeometry.ts      带四个真实圆形开口的 ExtrudeGeometry
    input.ts              键盘与触控共享输入
    store.ts              原子状态转换、计分去重、胜败互斥、解锁持久化
 tests/
  physics.test.ts         直接运行 Rapier 的真实地板/洞口/重球/连锁测试
  rules.test.ts           同帧计分、去重、错色、暂停、胜败、生成上限测试
```

## 物理与计分实现

平台从同一带孔网格生成渲染几何和静态 trimesh 碰撞体，洞口上方没有隐藏地板。所有球使用动态刚体和独立球形碰撞体，开启 CCD，物理步长 1/120 秒，玩家质量 1、目标球质量 3.5。玩家运动和冲刺只施加冲量；皮肤直接继承刚体的真实旋转。

目标球中心低于地板 0.7 米才进入统一处理队列，根据其水平位置所在洞口与自身颜色计分。该判定不依赖推动者。当前帧的多球事件合并，按 ID 去重并原子更新分数；移除通过 React 数据更新在物理回调之外完成。玩家下落优先于当帧得分。静态关卡不足以达标时明确结束，避免死局。

## 验证

```sh
npm test
npm run build
```

测试直接使用项目中的真实平台网格和 Rapier 引擎，验证球能落入四个洞口、安全区域能支撑球、轻球能持续推动重球、冲刺动量能传递给第二颗重球。规则测试验证重复事件、同帧多球、错色、死亡优先级和生成上限。

浏览器验证结果见 `TEST_REPORT.md`。测试中的摆球仅用于建立可重复场景，游戏的正常移动逻辑不设置刚体位置或速度。

## 调整与限制

修改 `src/game/config.ts` 的 CONFIG、LEVELS、HOLES 或 initialBalls 可调整手感、目标、掉落频率与布局。若更改平台尺寸或洞口位置，同时调整 arenaGeometry.ts 的外轮廓及 Arena.tsx 的边框。

当前是单人本地游戏，不包含云存档、排行榜、音效和多人。计分进度按局重置，解锁持久保存。性能取决于设备 WebGL 能力；使用 40 球上限、粒子上限、1024 阴影贴图与最多 1.7 的像素比控制开销。包含物理 WASM 的首次下载约 1.2 MB gzip。
