export type RunRecord={id:string;nickname:string;level:number;timeMs:number;score:number;date:string;version:string};
const KEY='orbit-ball-v9-records',NAME='orbit-ball-v9-nickname';
export function normalizeNickname(value:string){return value.trim().replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,12);}
export function readNickname(){try{return localStorage.getItem(NAME)||'';}catch{return '';}}
export function saveNickname(value:string){const n=normalizeNickname(value);try{localStorage.setItem(NAME,n);}catch{}return n;}
export function readRecords():RunRecord[]{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(valid):[];}catch{return [];}}
function valid(v:any):v is RunRecord{return v&&typeof v.id==='string'&&typeof v.nickname==='string'&&Number.isInteger(v.level)&&typeof v.timeMs==='number'&&typeof v.score==='number';}
export function addRecord(nickname:string,level:number,timeMs:number,score:number){const list=readRecords();const record={id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,nickname:normalizeNickname(nickname),level,timeMs:Math.max(0,Math.round(timeMs)),score,date:new Date().toISOString(),version:'9.0'};list.push(record);list.sort(rankCompare);const next=list.filter(r=>r.level===1).slice(0,100).concat(list.filter(r=>r.level===2).slice(0,100));try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}return {record,rank:next.filter(r=>r.level===level).findIndex(r=>r.id===record.id)+1,best:next.filter(r=>r.level===level&&r.nickname===record.nickname).sort(rankCompare)[0]?.id===record.id};}
export function rankCompare(a:RunRecord,b:RunRecord){return a.timeMs-b.timeMs||b.score-a.score||a.date.localeCompare(b.date);}
export function recordsFor(level:number){return readRecords().filter(r=>!level||r.level===level).sort(rankCompare);}
export function formatTime(ms:number){const t=Math.max(0,Math.round(ms));return `${Math.floor(t/60000).toString().padStart(2,'0')}:${Math.floor(t/1000%60).toString().padStart(2,'0')}.${Math.floor(t%1000/10).toString().padStart(2,'0')}`;}
