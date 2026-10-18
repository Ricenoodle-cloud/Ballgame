import { Component, useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  MoveUpRight,
  ChevronRight,
  Lock,
  Check,
  Sparkles,
  Target,
  Zap,
  Keyboard,
  Volume2,
  Orbit,
  Home,
  X,
  Trophy,
  HelpCircle,
} from "lucide-react";
import { MenuArt, MenuTitleFlower, StartOrnaments } from "./components/MenuArt";
import { useMenuStart } from "./components/useMenuStart";
import { Game } from "./components/Game";
import { useGame } from "./game/store";
import { COLORS, COLOR_NAMES, CONFIG, LEVELS } from "./game/config";
import { audio } from "./game/audio";
import { formatTime, normalizeNickname, readNickname, recordsFor, saveNickname } from "./game/records";
import { input } from "./game/input";
class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="scene-error">
        3D 场景加载失败，请使用支持 WebGL 的现代浏览器并刷新页面。
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const feedback = useGame(s => s.feedback);
  const [audioSettings, setAudioSettings] = useState(audio.settings);
  const [audioOpen, setAudioOpen] = useState(false);
  const updateAudio = (patch: Partial<typeof audioSettings>) => { audio.configure(patch); setAudioSettings({...audio.settings}); };
  const status = useGame((s) => s.status);
  const level = useGame((s) => s.level);
  useEffect(() => {
    audio.setScene(level, status);
    if (status === "victory") audio.play("victory");
    if (status === "failed") audio.play("failed");
    if (import.meta.env.DEV) Object.assign(window, { __orbitAudio: audio });
  }, [status, level]);
  const [nickname,setNickname]=useState(readNickname());
  const [nameError,setNameError]=useState("");
  const [leaderboardLevel,setLeaderboardLevel]=useState(0);
  const score = useGame((s) => s.score);
  const combo = useGame((s) => s.combo);
  const comboFlashAt = useGame((s) => s.comboFlashAt);
  const portal = useGame((s) => s.portal);
  const elapsed = useGame((s) => s.elapsed);
  const unlocked = useGame((s) => s.unlocked);
  const cooldown = useGame((s) => s.cooldown);
  const balls = useGame((s) => s.balls.length);
  const reason = useGame((s) => s.reason);
  const recordResult = useGame((s) => s.lastRecord);
  const [view, setView] = useState<"main" | "levels" | "help" | "leaderboard">("main");
  const [help, setHelp] = useState(false);
  const data = LEVELS[level - 1];
  const menu = status === "menu";
  const {starting,start: startFromMenu} = useMenuStart(menu);
  const begin=(target:number)=>{const n=normalizeNickname(nickname);if(!n){setNameError('请输入 1～12 个字符的昵称');return;}setNickname(saveNickname(n));setNameError('');startFromMenu(target);};
  const active = ["playing", "paused", "falling"].includes(status);
  const time = `${Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(elapsed % 60)
    .toString()
    .padStart(2, "0")}`;
  return (
    <main className={menu ? `app is-menu ${starting ? "menu-starting" : ""}` : "app is-game"} onPointerDown={() => audio.unlock()} onClickCapture={e=>{
      if(starting){e.preventDefault();e.stopPropagation();return;}
      if(menu&&(e.target as Element).closest('button:not(:disabled)'))audio.menuClick();
    }}>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            useGame.getState().menu();
            setView("main");
          }}
        >
          <span className="brand-icon">
            <Orbit size={25} />
          </span>
          <span>
            AURELIA<span className="brand-light"> ORBIT</span>
            <small>推小球闯关</small>
          </span>
        </a>
        <div className="top-nav">
          <span className="edition">
            DREAM GEOMETRY <i /> VOL. 03
          </span>
          <button
            className="icon-button"
            title="操作说明"
            aria-label="操作说明"
            onClick={() => {
              if (useGame.getState().status === "playing")
                useGame.getState().pause();
              setHelp(true);
            }}
          >
            <HelpCircle size={19} />
          </button>
          <button className="icon-button" aria-label="音频设置" aria-expanded={audioOpen} onClick={() => setAudioOpen(!audioOpen)}><Volume2 size={18} /></button>
          {audioOpen && <section className="audio-panel" aria-label="音频设置面板">
            <h3>声音花园 <small>SOUND GARDEN</small></h3>
            <label><span>背景音乐</span><input aria-label="背景音乐开关" type="checkbox" checked={audioSettings.musicEnabled} onChange={e=>updateAudio({musicEnabled:e.target.checked})} /></label>
            <label><span>音乐音量</span><input aria-label="背景音乐音量" type="range" min="0" max="1" step="0.01" value={audioSettings.musicVolume} onChange={e=>updateAudio({musicVolume:Number(e.target.value)})} /></label>
            <label><span>游戏音效</span><input aria-label="音效开关" type="checkbox" checked={audioSettings.sfxEnabled} onChange={e=>updateAudio({sfxEnabled:e.target.checked})} /></label>
            <label><span>音效音量</span><input aria-label="音效音量" type="range" min="0" max="1" step="0.01" value={audioSettings.sfxVolume} onChange={e=>updateAudio({sfxVolume:Number(e.target.value)})} /></label>
            <p>原创旋律 · 在第一次点击后轻轻响起</p>
          </section>}
        </div>
      </header>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      {menu && (
        <aside className={`menu-panel menu-view-${view}`} aria-label="主菜单">
          <MenuArt />
          <div className="eyebrow">
            <span /> A QUIET WORLD. A GOLDEN TRACE.
          </div>
          {view === "main" ? (
            <>
              <div className="menu-title-block">
                <p className="menu-title-caption"><span/> THE ART OF A LITTLE PUSH</p>
                <h1 aria-label="推小球闯关">推小球<br/><span className="gradient-word">闯关</span><span className="title-dot" aria-hidden="true">✦</span></h1>
                <MenuTitleFlower />
                <p className="menu-title-whisper">轻推，唤醒光芒。</p>
              </div>
              <p className="intro">
                推动彩球，精准入洞！
                <br />
                在漂浮的几何花园，留下一道金色轨迹。
              </p>
              <button
                className="primary start"
                aria-label="开始游戏"
                disabled={starting}
                onClick={() => begin(1)}
              >
                <StartOrnaments />
                <Play className="start-play-icon" size={17} fill="currentColor" aria-hidden="true"/>
                <span className="start-copy"><b>开始游戏</b><small aria-hidden="true">BEGIN THE JOURNEY</small></span>
                <ArrowUpRight className="start-arrow" size={19} aria-hidden="true"/>
              </button>
              <div className="menu-actions">
                <label className="nickname-field"><span>留下你的名字，开始挑战</span><input aria-label="玩家昵称" value={nickname} maxLength={12} onChange={e=>{setNickname(e.target.value);setNameError('')}} placeholder="例如：星河旅人" /></label>
                {nameError && <p className="name-error">{nameError}</p>}
                <button onClick={() => setView("levels")}>
                  <span>
                    <Target size={17} />
                    关卡选择
                  </span>
                  <ChevronRight size={17} />
                </button>
                <button onClick={() => setView("leaderboard")}><span><Trophy size={17}/>历史排行榜</span><ChevronRight size={17}/></button>
                <button onClick={() => setView("help")}>
                  <span>
                    <Keyboard size={17} />
                    操作说明
                  </span>
                  <ChevronRight size={17} />
                </button>
                <button onClick={() => setAudioOpen(!audioOpen)} aria-expanded={audioOpen}>
                  <span><Volume2 size={17}/>声音设置</span><ChevronRight size={17}/>
                </button>
              </div>
              <div className="small-achievement">
                <span className="achievement-icon">
                  <Trophy size={19} />
                </span>
                <div>
                  <b>{unlocked ? "天下无敌" : "你的第一个小目标"}</b>
                  <p>
                    {unlocked
                      ? "称号已解锁 · 第二阶段已开放"
                      : "完成第一阶段，解锁「天下无敌」"}
                  </p>
                </div>
                {unlocked && <Check size={17} />}
              </div>
            </>
          ) : (
            <>
              <button
                className="text-button back"
                onClick={() => setView("main")}
              >
                <ArrowLeft size={16} />
                返回主菜单
              </button>
              <h2>{view === "levels" ? "选一场挑战。" : view === "leaderboard" ? "星辰竞速榜" : "轻推，巧冲。"}</h2>
              {view === "leaderboard" ? <Leaderboard level={leaderboardLevel} setLevel={setLeaderboardLevel}/> : view === "levels" ? (
                <div className="level-list">
                  {LEVELS.map((l, i) => (
                    <button
                      className={`level-card ${i === 1 && !unlocked ? "locked" : ""}`}
                      disabled={i === 1 && !unlocked}
                      key={l.id}
                      onClick={() => begin(l.id)}
                    >
                      <span className="level-no">0{l.id}</span>
                      <div>
                        <small>{l.en}</small>
                        <b>{l.name}</b>
                        <p>
                          {i === 1 && !unlocked
                            ? "完成静态推球后解锁"
                            : `目标 ${l.goal} 分 · ${i === 0 ? "16 颗彩球" : "32 颗彩球 · 炸弹空袭"}`}
                        </p>
                      </div>
                      {i === 1 && !unlocked ? (
                        <Lock size={18} />
                      ) : (
                        <ArrowUpRight size={19} />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <Instructions />
              )}
            </>
          )}
          <div className="menu-note">
            <span className="live-dot" />
            真实物理 · 无限连锁 · 刚好上头
          </div>
        </aside>
      )}
      <section className="stage" aria-label="3D 游戏区域">
        <SceneBoundary>
          <Game />
        </SceneBoundary>
        <div className="stage-top">
          <div className="stage-label">
            <span className="live-dot" />
            {menu
              ? "准备好，来一场漂亮的连锁。"
              : `第 ${level} 阶段 · ${data.name}`}
          </div>
          {menu ? (
            <span className="stage-tag">
              FLOATING GARDEN <MoveUpRight size={13} />
            </span>
          ) : (
            <div className="game-actions">
              <span className="timer">{time}</span>
              <button
                className="icon-button"
                aria-label="暂停或继续"
                title="暂停 / Esc"
                onClick={() => useGame.getState().pause()}
              >
                {status === "paused" ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                className="icon-button"
                aria-label="重新开始"
                title="重新开始"
                onClick={() => useGame.getState().start(level)}
              >
                <RotateCcw size={18} />
              </button>
            </div>
          )}
        </div>
        {!menu && (
          <div key={feedback.id} className={`scoreboard feedback-${feedback.kind}`}>
            <div>
              <span>第 {level} 关 · {data.name}</span>
              <b key={score} className="score-pop">
                {score}
                <small>/ {data.goal}</small>
              </b>
            </div>
            <div className="progress-track">
              <div
                style={{
                  width: `${Math.min(100, (score / data.goal) * 100)}%`,
                }}
              />
            </div>
            <p>
              {feedback.text || data.en}
              <span>{Math.round((score / data.goal) * 100)}%</span>
            </p>
            <div className={`combo-readout ${comboFlashAt >= 0 && elapsed - comboFlashAt < 1.6 ? "combo-ready" : ""}`} aria-live="polite">
              {comboFlashAt >= 0 && elapsed - comboFlashAt < 1.6 ? "✦ 完美连击" : "连续正确"} ×{combo}
            </div>
            {portal.active && <div className="portal-readout">幻彩之门 · {portal.color === "blue" ? "蓝色" : portal.color === "red" ? "粉色" : portal.color === "green" ? "绿色" : "黄色"} · 双倍奖励</div>}
          </div>
        )}
        {menu && (
          <>
            <div className="player-callout">
              <span>你的珍珠魔法球</span>
              <i />
            </div>
            <div className="scene-caption">
              <span>01 — THE FIRST PUSH</span>
              <b>静态推球</b>
              <p>四座能量井，一场轻盈的金色漫游。</p>
            </div>
          </>
        )}
        <div className="color-legend">
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key}>
              <i
                style={{ background: color, boxShadow: `0 0 12px ${color}44` }}
              />
              <span>{COLOR_NAMES[key as keyof typeof COLORS]}</span>
            </div>
          ))}
        </div>
        <div className="stage-bottom">
          <span>
            <i /> {menu ? "真实 3D 刚体模拟" : `${balls} 颗彩球在场`}
          </span>
          <span>
            {menu ? "每一次碰撞，都有可能。" : "同色 +1 · 错色 -1 · 小心洞口"}
          </span>
        </div>
        {["paused", "failed", "victory"].includes(status) && (
          <div className="modal-scrim">
            <section
              className={`modal ${status === "victory" ? "victory" : ""}`}
            >
              <div className="modal-symbol">
                {status === "paused" ? (
                  <Pause size={30} />
                ) : status === "victory" ? (
                  <Trophy size={35} />
                ) : (
                  <RotateCcw size={30} />
                )}
              </div>
              <span className="eyebrow">
                {status === "paused"
                  ? "TAKE A BREATHER"
                  : status === "victory"
                    ? "BEAUTIFULLY DONE"
                    : "ONE MORE PUSH"}
              </span>
              <h2>
                {status === "paused"
                  ? "歇一会儿，再出发。"
                  : status === "victory"
                    ? "恭喜通关！"
                    : "游戏失败"}
              </h2>
              {status === "victory" ? (
                <>
                  <div className="unlocked-title">
                    <Sparkles size={18} />
                    {level === 1 ? "获得称号：天下无敌" : "双阶段挑战完成"}
                  </div>
                  <p>玩家昵称：{nickname || "匿名旅人"}<br/>本关用时：{formatTime(elapsed)}<br/>历史排名：第 {recordResult?.rank || "—"} 名{recordResult?.best && <><br/><b className="personal-best">✦ 刷新个人纪录</b></>}</p>
                </>
              ) : (
                <p>
                  {status === "paused" ? "物理模拟与关卡计时已暂停。" : reason}
                </p>
              )}
              <div className="result-score">
                <b>{score}</b>
                <span>/ {data.goal} 目标分数</span>
              </div>
              {status === "paused" ? (
                <button
                  className="primary"
                  onClick={() => useGame.getState().pause()}
                >
                  <Play size={17} />
                  继续游戏
                </button>
              ) : status === "victory" && level === 1 ? (
                <button
                  className="primary"
                  onClick={() => useGame.getState().start(2)}
                >
                  下一关 · 天上来敌
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() => useGame.getState().start(level)}
                >
                  <RotateCcw size={17} />
                  重新挑战
                </button>
              )}
              {(status === "paused" ||
                (status === "victory" && level === 1)) && (
                <button
                  className="secondary"
                  onClick={() => useGame.getState().start(level)}
                >
                  重新挑战
                </button>
              )}
              <button
                className="text-button centered"
                onClick={() => {
                  useGame.getState().menu();
                  setView("main");
                }}
              >
                <Home size={15} />
                返回主菜单
              </button>
            </section>
          </div>
        )}
      </section>
      <footer className="bottom-bar">
        <div className="controls">
          <span className="keys">
            <kbd>W</kbd>
            <span>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </span>
          </span>
          <div>
            <b>自由滚动</b>
            <span>轻推彩球，找准方向</span>
          </div>
          <i className="control-divider" />
          <kbd className="shift-key">
            SHIFT <Zap size={12} />
          </kbd>
          <div>
            <b>瞬间冲刺</b>
            <span>
              {menu
                ? "给连锁反应一点力量"
                : cooldown > 0
                  ? `${cooldown.toFixed(1)} 秒后就绪`
                  : "冲刺已就绪"}
            </span>
            {!menu && (
              <div className="dash-track">
                <i
                  style={{
                    width: `${(1 - cooldown / CONFIG.dashCooldown) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="footer-note">
          <span className="mini-balls">
            {Object.values(COLORS).map((c) => (
              <i style={{ background: c }} key={c} />
            ))}
          </span>
          同色入洞，才能得分
          <span className="desktop-only"> · 先想一想，再推一下</span>
        </div>
      </footer>
      {active && (
        <div className="touch-controls">
          <div>
            {["KeyW", "KeyA", "KeyS", "KeyD"].map((key, i) => (
              <button
                key={key}
                aria-label={["向前", "向左", "向后", "向右"][i]}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  input.keys.add(key);
                }}
                onPointerUp={() => input.keys.delete(key)}
                onPointerCancel={() => input.keys.delete(key)}
              >
                {["↑", "←", "↓", "→"][i]}
              </button>
            ))}
          </div>
          <button
            className="touch-dash"
            onPointerDown={() => {
              input.dash = true;
            }}
          >
            <Zap />
            冲刺
          </button>
        </div>
      )}
      {help && (
        <div className="global-scrim">
          <section className="modal help-modal">
            <button
              className="close-modal icon-button"
              aria-label="关闭"
              onClick={() => setHelp(false)}
            >
              <X size={19} />
            </button>
            <span className="eyebrow">HOW TO PLAY</span>
            <h2>轻推，巧冲。</h2>
            <Instructions />
            <button className="primary" onClick={() => setHelp(false)}>
              明白了，开始滚动
              <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
function Leaderboard({level,setLevel}:{level:number;setLevel:(n:number)=>void}){
  const rows=recordsFor(level);return <section className="leaderboard-panel">
    <div className="leaderboard-tabs"><button className={level===0?'active':''} onClick={()=>setLevel(0)}>全部关卡</button>{LEVELS.map(l=><button key={l.id} className={level===l.id?'active':''} onClick={()=>setLevel(l.id)}>第 {l.id} 关</button>)}</div>
    {rows.length===0?<div className="leaderboard-empty"><Trophy size={30}/><p>完成一次挑战，就能留下你的第一份纪录</p><small>成绩只保存在当前浏览器或设备</small></div>:<div className="leaderboard-list"><div className="leaderboard-head"><span>排名</span><span>昵称</span><span>用时</span><span>日期</span></div>{rows.slice(0,100).map((r,i)=><div className={`leader-row ${i<3?'podium':''}`} key={r.id}><b>{i+1}</b><span>{r.nickname}</span><strong>{formatTime(r.timeMs)}</strong><small>{new Date(r.date).toLocaleDateString()}</small></div>)}</div>}
  </section>;
}
function Instructions() {
  return (
    <div className="instructions">
      <div>
        <span>01</span>
        <p>
          <b>WASD / 方向键 · 滚动</b>
          持续施加推力。松开按键后自然减速，普通彩球更易推动，多个球仍有阻力。
        </p>
      </div>
      <div>
        <span>02</span>
        <p>
          <b>左 Shift / 空格 · 冲刺</b>
          沿当前方向瞬间加速；没有输入时沿上次方向。冷却 1.5 秒。
        </p>
      </div>
      <div>
        <span>03</span>
        <p>
          <b>同色入洞 · +1 分</b>
          连锁撞击同样计分。错色入洞 -1，自己的球掉入洞口则失败。
        </p>
      </div>
      <div>
        <span>04</span>
        <p>
          <b>10 分通关 · 解锁下一关</b>
          第一关彩球有限，失误过多需重试；第二关躲避炸弹，命中 -1，目标 20 分。Esc 暂停。
        </p>
      </div>
    </div>
  );
}
export default App;
