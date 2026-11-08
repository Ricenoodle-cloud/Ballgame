const {app,BrowserWindow,session}=require('electron');
const path=require('node:path'),fs=require('node:fs');
// Desktop game audio must not depend on Chromium's website gesture policy.
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
const testArg=process.argv.find(a=>a.startsWith('--audio-self-test='));
async function verifyAudio(win){
  const reportPath=testArg.slice('--audio-self-test='.length);
  try{
    const report=await win.webContents.executeJavaScript(`(async()=>{
      const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(800);
      const {audio,music}=window.__LIGHT__;await audio.unlock();
      const analyser=audio.ctx.createAnalyser();analyser.fftSize=2048;audio.master.connect(analyser);
      const data=new Float32Array(analyser.fftSize);
      async function peak(ms){let max=0;for(let i=0;i<ms/50;i++){await pause(50);analyser.getFloatTimeDomainData(data);max=Math.max(max,Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length))}return max}
      music.set(true);music.schedule();const pianoRms=await peak(1600);
      music.set(false);await pause(3500);audio.play('win');const sfxRms=await peak(650);
      audio.enabled=false;audio.master.gain.setTargetAtTime(0,audio.ctx.currentTime,.03);audio.play('turn');await pause(350);const mutedRms=await peak(550);
      const result={state:audio.ctx.state,pianoRms,sfxRms,mutedRms,lastError:audio.lastError,pass:audio.ctx.state==='running'&&pianoRms>.0001&&sfxRms>.0001&&mutedRms<.0001};
      audio.master.disconnect(analyser);return result;
    })()`);
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2));app.exit(report.pass?0:1);
  }catch(e){fs.writeFileSync(reportPath,JSON.stringify({pass:false,error:String(e)},null,2));app.exit(1)}
}
function createWindow(){const win=new BrowserWindow({width:1280,height:850,minWidth:700,minHeight:600,backgroundColor:'#e8e9e7',autoHideMenuBar:true,title:'光的旅程',webPreferences:{autoplayPolicy:'no-user-gesture-required',contextIsolation:true,nodeIntegration:false,sandbox:true}});win.setMenu(null);win.webContents.setAudioMuted(false);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());if(testArg)win.webContents.once('did-finish-load',()=>verifyAudio(win));win.loadFile(path.join(__dirname,'app','index.html'),{query:{desktop:'1'}});}
app.whenReady().then(()=>{session.defaultSession.setPermissionRequestHandler((webContents,permission,callback)=>callback(false));createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow()})});app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
