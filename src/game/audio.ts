export type AudioSettings = { musicEnabled:boolean; sfxEnabled:boolean; musicVolume:number; sfxVolume:number };
export const AUDIO_KEY='orbit-ball-audio-v3';
const defaults:AudioSettings={musicEnabled:true,sfxEnabled:true,musicVolume:.32,sfxVolume:.35};
export function sanitizeAudioSettings(value:Partial<AudioSettings>):AudioSettings {
  const volume=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
  return {musicEnabled:typeof value.musicEnabled==='boolean'?value.musicEnabled:true,sfxEnabled:typeof value.sfxEnabled==='boolean'?value.sfxEnabled:true,musicVolume:volume(value.musicVolume,.32),sfxVolume:volume(value.sfxVolume,.35)};
}
function readSettings(){try{return sanitizeAudioSettings(JSON.parse(localStorage.getItem(AUDIO_KEY)||'{}')??{});}catch{return {...defaults};}}
export const MUSIC_BPM=72;
export const MUSIC_STEPS=256; // 32 bars, 106.67 seconds; four evolving eight-bar phrases.
const chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,69],[62,65,69,72],[57,64,67,71],[53,60,64,69],[55,62,67,71]];
export function musicStep(step:number,level:number){
  const loop=((step%MUSIC_STEPS)+MUSIC_STEPS)%MUSIC_STEPS,bar=Math.floor(loop/8),phrase=Math.floor(bar/8),beat=loop%8;
  const chord=chords[bar%8];
  const pattern=[[0,4,6],[1,4],[0,3,7],[2,5,7]][phrase];
  const melody=pattern.includes(beat)?chord[(bar+beat+phrase*2)%4]+12+(phrase===2?12:0):undefined;
  return {chord:beat===0?chord:undefined,melody,tension:level===2&&beat===6?chord[2]+12:undefined};
}
const frequency=(midi:number)=>440*Math.pow(2,(midi-69)/12);
class GameAudio {
  settings=readSettings();
  private context?:AudioContext;
  private musicGain?:GainNode;
  private sfxGain?:GainNode;
  private reverb?:ConvolverNode;
  private analyser?:AnalyserNode;
  private timer?:ReturnType<typeof setInterval>;
  private sources=new Set<OscillatorNode>();
  private nextTime=0;
  private step=0;
  private level=1;
  private paused=false;
  private scheduled=0;
  get enabled(){return this.settings.sfxEnabled;} set enabled(v:boolean){this.configure({sfxEnabled:v});}
  get volume(){return this.settings.sfxVolume;} set volume(v:number){this.configure({sfxVolume:v});}
  configure(patch:Partial<AudioSettings>){
    this.settings=sanitizeAudioSettings({...this.settings,...patch});
    try{localStorage.setItem(AUDIO_KEY,JSON.stringify(this.settings));}catch{}
    this.applyVolumes();
    if(!this.settings.musicEnabled)this.stopMusic();else this.startMusic();
  }
  private applyVolumes(){
    const t=this.context?.currentTime??0;
    this.musicGain?.gain.setTargetAtTime(this.settings.musicEnabled?this.settings.musicVolume*(this.paused ? .5 : 1):0,t,.06);
    this.sfxGain?.gain.setTargetAtTime(this.settings.sfxEnabled?this.settings.sfxVolume:0,t,.02);
  }
  unlock(){
    if(typeof window==='undefined')return;
    try{
      if(!this.context){
        const ctx=this.context=new AudioContext();
        this.musicGain=ctx.createGain();this.sfxGain=ctx.createGain();
        this.analyser=ctx.createAnalyser();this.analyser.fftSize=512;
        const master=ctx.createGain();master.gain.value=.75;master.connect(this.analyser);this.analyser.connect(ctx.destination);
        this.musicGain.connect(master);this.sfxGain.connect(master);
        // Deterministic locally generated room response: no audio files or network.
        this.reverb=ctx.createConvolver();const impulse=ctx.createBuffer(2,ctx.sampleRate*2.6,ctx.sampleRate);
        let seed=7349;for(let c=0;c<2;c++){const channel=impulse.getChannelData(c);for(let i=0;i<channel.length;i++){seed=(seed*1664525+1013904223)>>>0;channel[i]=(seed/4294967296*2-1)*Math.pow(1-i/channel.length,3)*.3;}}
        this.reverb.buffer=impulse;const wet=ctx.createGain();wet.gain.value=.22;this.reverb.connect(wet);wet.connect(master);
        // Reverb branches follow their respective volume controls.
        this.musicGain.connect(this.reverb);this.sfxGain.connect(this.reverb);
        this.applyVolumes();
      }
      void this.context.resume().then(()=>this.startMusic()).catch(()=>{});
    }catch{ /* Audio is optional on unsupported devices. */ }
  }
  setScene(level:number,status:string){this.level=level;this.paused=status==='paused';this.applyVolumes();}
  private startMusic(){
    if(this.timer||!this.settings.musicEnabled||this.context?.state!=='running')return;
    this.nextTime=this.context.currentTime+.07;
    this.schedule();this.timer=setInterval(()=>this.schedule(),80);
  }
  private stopMusic(){
    if(this.timer)clearInterval(this.timer);this.timer=undefined;
    for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();
  }
  private note(midi:number,time:number,duration:number,volume:number,type:OscillatorType,music=true){
    const ctx=this.context;if(!ctx)return;
    const oscillator=ctx.createOscillator(),envelope=ctx.createGain();
    oscillator.type=type;oscillator.frequency.value=frequency(midi);
    envelope.gain.setValueAtTime(0,time);
    envelope.gain.linearRampToValueAtTime(volume,time+(duration>2?.5:.012));
    envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(envelope);envelope.connect((music?this.musicGain:this.sfxGain)!);
    if(music)this.sources.add(oscillator);
    oscillator.start(time);oscillator.stop(time+duration+.02);
    oscillator.onended=()=>{this.sources.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
  }
  private schedule(){
    const ctx=this.context;if(!ctx||ctx.state!=='running')return;
    if(this.nextTime<ctx.currentTime-.5)this.nextTime=ctx.currentTime+.05;
    while(this.nextTime<ctx.currentTime+.2){
      const n=musicStep(this.step,this.level),beat=60/MUSIC_BPM;
      if(n.chord)n.chord.forEach((m,i)=>this.note(m-12,this.nextTime,beat*5,.025+(i===0?.008:0),'sine'));
      if(n.melody!==undefined){this.note(n.melody,this.nextTime,beat*2,.085,'sine');this.note(n.melody+12,this.nextTime+.006,beat*1.5,.018,'sine');}
      if(n.tension!==undefined)this.note(n.tension,this.nextTime,beat,.035,'triangle');
      this.nextTime+=beat/2;this.step++;this.scheduled++;
    }
  }
  play(kind:'score'|'wrong'|'explosion'|'hit'|'victory'|'failed'){
    if(!this.settings.sfxEnabled||this.context?.state!=='running')return;
    const notes=kind==='victory'?[72,76,79,84]:kind==='score'?[81,88]:kind==='explosion'?[29,21]:kind==='failed'?[52,47,40]:[54,45];
    notes.forEach((note,i)=>this.note(note,this.context!.currentTime+i*(kind==='victory'?.13:.075),.3,.16,kind==='score'||kind==='victory'?'sine':'triangle',false));
  }
  perfectCombo(){
    if(!this.settings.sfxEnabled||this.context?.state!=='running')return;
    const now=this.context.currentTime;
    [84,89,96].forEach((note,i)=>this.note(note,now+i*.12,.22,.075,'sine',false));
  }
  // UI-only tap, routed through the existing SFX gain/mute; BGM is unchanged.
  menuClick(){
    this.unlock();const ctx=this.context;
    if(!ctx||!this.settings.sfxEnabled)return;
    void ctx.resume().then(()=>{
      if(this.settings.sfxEnabled&&ctx.state==='running')this.note(79,ctx.currentTime,.14,.045,'sine',false);
    }).catch(()=>{});
  }
  inspect(){
    const data=new Float32Array(this.analyser?.fftSize??0);this.analyser?.getFloatTimeDomainData(data);
    return {state:this.context?.state??'locked',scheduled:this.scheduled,step:this.step,loop:Math.floor(this.step/MUSIC_STEPS),activeMusicSources:this.sources.size,settings:{...this.settings},rms:data.length?Math.sqrt(data.reduce((a,x)=>a+x*x,0)/data.length):0};
  }
}
export const audio=new GameAudio();
