# 推小球闯关 Windows 版

支持 Windows 10 / Windows 11 x64。不需要安装 Node.js，不需要联网或运行开发服务器。

## 下载和运行

在 GitHub 仓库的 **Actions → Windows Desktop EXE** 中打开最新成功的运行，下载页面底部 **Artifacts → Ballgame-Windows-x64**，解压 ZIP。

- `推小球闯关-Setup.exe`：运行安装向导，选择安装位置，通过桌面或开始菜单启动。
- `推小球闯关-Portable.exe`：无需安装，双击启动，首次解压可能需要稍等。

程序没有购买代码签名证书，Windows 可能显示发布者未知。请核对下载来源及附带的 SHA256 校验值。

默认游戏内容尺寸为 1280×720，支持最大化。Alt + Enter 切换全屏；全屏时 Esc 返回窗口；窗口模式的 Esc 保留游戏原有暂停操作。WASD 移动，Left Shift 冲刺。游戏和声音在现有主菜单开始交互后启动。

进度与声音设置保存在当前用户 `%APPDATA%\Ballgame`，安装版和便携版共用此存档目录，不向安装目录写入存档。退出后重新启动仍会保留。网页版浏览器的存档独立，不会自动迁移到 EXE。

## 从源代码构建

安装 Node.js 24，然后在项目目录运行：

```sh
npm ci
npm run build
npm test
npm run dist:win
npm run test:desktop -- --packaged
```

Windows 输出在 `release/`。`npm run desktop` 启动前先运行 `npm run build:desktop`。网页版 `npm run build` 和 `npm run export:offline` 原样保留，桌面构建单独输出 `dist-desktop/`。

GitHub Actions 使用 Windows Runner 自动执行上述构建和打包测试；合并到 main 后也可在 Actions 页面点击 Run workflow 手动重建。Artifact 默认保留 30 天，过期后可重新构建。

Electron 使用本地 file:// 页面，Rapier WASM 已内嵌在构建的 JavaScript 中，背景音乐和音效由现有 Web Audio 系统离线生成。未启用 Node.js 网页接口；开启上下文隔离和沙箱，并阻止远程网络请求、导航、新窗口和权限请求。
