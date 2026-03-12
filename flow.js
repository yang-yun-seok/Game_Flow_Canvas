// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// STATE & HELPERS
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
const NS='http://www.w3.org/2000/svg';
let nodes={},edges={},selId=null,selSet=new Set(),nc=0,ec=0,mode='fc';
let vx=80,vy=60,vs=1,lightMode=false;
let gridSnap=false;   // 그리???�냅 on/off
let drag=null;
let connecting=null; // Click-to-connect state
let reconnecting=null; // Edge endpoint reconnect drag state
let capSVG='';
let globalLineStyle = 'step'; // 기본 ???��???꺾�??�으�??��?
let demoTimer = null; // 초기?????�모 복원 방�?
const MAX_STEP_BENDS = 4; // 꺾�????��? 꺾임 최�? 개수
// Throttled edge redraw queue (for smoother multi-node dragging)
let edgeRedrawRAF = 0;
let edgeRedrawAll = false;
const edgeRedrawSet = new Set();

// ?�?� History (Undo/Redo) Variables ?�?�
let history = [], historyIdx = -1;

// ?�?� Sheet System ?�?�
let sheets = [];       // [{id, name, data}] ??�??�트???�?�된 ?�태
let activeSheetId = null;
let sheetEditingId = null;
// ?�드 ?�이�??�정 ???�용???�??id
let renameTarget = null;
// Copy/Paste buffer
let clipBundle = null;
let pasteSeq = 0;

const msvg=document.getElementById('msvg');
const VP=document.getElementById('VP');
const EL=document.getElementById('EL');
const NL=document.getElementById('NL');
// New layer for edge labels; labels are drawn here so they appear above edges but below nodes
const LBL=document.getElementById('LBL');
const tl=document.getElementById('tl');
const cvs=document.getElementById('cvs');
const selboxDiv=document.getElementById('selbox-div');

// cached UI elements for performance
const el = {
  pname: document.getElementById('pname'),
  thbtn: document.getElementById('thbtn'),
  gridBtn: document.getElementById('grid-btn'),
  zv: document.getElementById('zv'),
  ibd: document.getElementById('ibd'),
  ibg: document.getElementById('ibg'),
  stn: document.getElementById('stn'),
  ste: document.getElementById('ste'),
  sts: document.getElementById('sts'),
  stxy: document.getElementById('stxy'),
  palContent: document.getElementById('pal-content'),
  helpBtn: document.getElementById('help-btn'),
  helpModal: document.getElementById('m-help'),
  helpClose: document.getElementById('help-close')
};

function cm(id){
  const d = el[id] || document.getElementById(id);
  if(d) d.style.display='none';
}
function bgc(e,id){if(e.target===e.currentTarget)cm(id);}
function mkSvg(tag, attrs={}) {
  const el = document.createElementNS(NS, tag);
  for (let k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}
function mk(tag){return document.createElementNS(NS,tag);}

// palette configuration for each mode (minimal sample set)
const paletteData = {
  fc: ['terminal','process','decision','io'],
  fsm: ['initial','state','accepting'],
  bt: ['btroot','btseq','btsel'],
  sc: ['sclife','scmsg'],
  cd: ['cdclass','cdinterface','cdenum']
};

function paletteSvg(type){
  const s=S[type];
  if(!s) return '';
  const w=34, h=18;
  return `<svg width="${w}" height="${h}"><g fill="var(${s.c})" stroke="var(${s.b})" stroke-width="1.4">${s.draw(w,h)}</g></svg>`;
}

function makePaletteItem(type){
  const div=document.createElement('div');
  div.className='pi'; div.draggable=true;
  div.dataset.type=type;
  const label = S[type]?.label||type;
  div.dataset.label = label;
  div.innerHTML = paletteSvg(type) + `<span class="pil" style="color:var(${S[type]?.t})">${label}</span>`;
  return div;
}

function bindPaletteItem(el){
  el.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('nodeType',el.dataset.type);
    e.dataTransfer.setData('nodeLabel',el.dataset.label||'');
  });
  el.addEventListener('click', e => {
    const type = el.dataset.type;
    const label = el.dataset.label;
    const s = S[type] || {w:140, h:44};
    const r = cvs.getBoundingClientRect();
    const cx = (r.width / 2 - vx) / vs;
    const cy = (r.height / 2 - vy) / vs;
    createNode(type, cx - s.w/2, cy - s.h/2, null, label);
    saveState('형태 생성 (클릭)');
  });
}

function renderPalette(){
  const container = el.palContent;
  if(!container) return;
  container.innerHTML = '';
  const list = paletteData[mode] || [];
  list.forEach(t=>{
    const item = makePaletteItem(t);
    container.appendChild(item);
    bindPaletteItem(item);
  });
}

function showAlert(msg) {
  document.getElementById('m-alert-msg').textContent = msg;
  document.getElementById('m-alert').style.display = 'flex';
}
function escAttr(v){
  return String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}
function safeHexColor(v, fallback){
  const s=String(v||'').trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

// ?�?� History Functions ?�?�
function saveState(lbl="?�태 변�?) {
  // If we made changes while in the past, discard the future redo history
  if(historyIdx < history.length - 1) history = history.slice(0, historyIdx + 1);
  const state = JSON.stringify({nodes, edges, nc, ec});
  // Prevent duplicate consecutive states
  if(history.length > 0 && history[historyIdx].data === state) return;
  const time = new Date().toLocaleTimeString('ko-KR', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
  history.push({data: state, label: lbl, time});
  if(history.length > 50) history.shift();
  else historyIdx++;
}

function restoreState(stateStr) {
  if(!stateStr) return;
  const state = JSON.parse(stateStr);
  // Deep copy to prevent reference sharing bugs
  nodes = JSON.parse(JSON.stringify(state.nodes));
  edges = JSON.parse(JSON.stringify(state.edges));
  nc = state.nc; ec = state.ec;
  connecting = null; reconnecting = null;
  clearConnectVisuals();
  
  NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';
  for(const id in nodes) renderNode(id);
  redrawEdges();
  clearSel();
  updateStatus();
}

function undo() {
  if(historyIdx > 0) {
    historyIdx--;
    restoreState(history[historyIdx].data);
  }
}

function redo() {
  if(historyIdx < history.length - 1) {
    historyIdx++;
    restoreState(history[historyIdx].data);
  }
}

function openHistory() {
  const list = document.getElementById('m-hist-list');
  if(history.length === 0) {
    list.innerHTML = '<div style="padding:20px; color:var(--tx2); text-align:center;">?�?�된 ?�업 ?�역???�습?�다.</div>';
  } else {
    // Show newest first (reverse index order visually)
    list.innerHTML = history.map((h, i) => `
      <div class="hi-item ${i === historyIdx ? 'on' : ''}" onclick="jumpHistory(${i})">
        <span style="color:var(--tx2); width:35px; font-family:'JetBrains Mono',monospace;">#${i+1}</span>
        <span style="flex:1; color:var(--tx); font-weight:500;">${h.label}</span>
        <span style="color:var(--txd); font-family:'JetBrains Mono',monospace; font-size:10px;">${h.time}</span>
        ${i === historyIdx ? '<span style="color:var(--ac); font-weight:bold; margin-left:8px; width:40px; text-align:right;">(?�재)</span>' : '<span style="width:48px;"></span>'}
      </div>
    `).reverse().join('');
  }
  document.getElementById('m-hist').style.display='flex';
}

function jumpHistory(idx) {
  historyIdx = idx;
  restoreState(history[historyIdx].data);
  openHistory(); // 갱신
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// SHAPE CATALOGUE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
const S={
  // Flowchart
  terminal:  {w:160,h:56,c:'--c-terminal', b:'--b-terminal',t:'--t-terminal',label:'?��???,   end:true, draw:dTerminal},
  process:   {w:160,h:56,c:'--c-process',  b:'--b-process', t:'--t-process', label:'?�로?�스',end:false,draw:dProcess},
  decision:  {w:160,h:76,c:'--c-decision', b:'--b-decision',t:'--t-decision',label:'조건',    end:false,draw:dDecision},
  io:        {w:170,h:56,c:'--c-io',       b:'--b-io',      t:'--t-io',      label:'I/O',     end:false,draw:dIO},
  output:    {w:160,h:64,c:'--c-output',   b:'--b-output',  t:'--t-output',  label:'출력',    end:true, draw:dOutput, tyRatio:0.42},
  subroutine:{w:168,h:56,c:'--c-subroutine',b:'--b-subroutine',t:'--t-subroutine',label:'?�브루틴',end:false,draw:dSubroutine},
  prepare:   {w:160,h:56,c:'--c-prepare',  b:'--b-prepare', t:'--t-prepare', label:'준�?,    end:false,draw:dPrepare},
  manual:    {w:168,h:56,c:'--c-manual',   b:'--b-manual',  t:'--t-manual',  label:'?�동?�력',end:false,draw:dManual, tyRatio:0.55},
  manualop:  {w:168,h:56,c:'--c-manualop', b:'--b-manualop',t:'--t-manualop',label:'?�동조작',end:false,draw:dManualOp},
  delay:     {w:156,h:56,c:'--c-delay',    b:'--b-delay',   t:'--t-delay',   label:'지??,    end:false,draw:dDelay},
  display:   {w:164,h:56,c:'--c-display',  b:'--b-display', t:'--t-display', label:'?�스?�레??,end:true,draw:dDisplay},
  connector: {w:50, h:50,c:'--c-connector',b:'--b-connector',t:'--t-connector',label:'A',     end:false,draw:dConnector},
  merge:     {w:86, h:70,c:'--c-merge',    b:'--b-merge',   t:'--t-merge',   label:'병합',    end:false,draw:dMerge},
  // Game UI
  screen:    {w:170,h:64,c:'--c-screen',   b:'--b-screen',  t:'--t-screen',  label:'?�면',    end:false,draw:dScreen},
  popup:     {w:160,h:56,c:'--c-popup',    b:'--b-popup',   t:'--t-popup',   label:'?�업',    end:false,draw:dPopup},
  uibutton:  {w:140,h:44,c:'--c-uibutton', b:'--b-uibutton',t:'--t-uibutton',label:'버튼',    end:false,draw:dUIButton},
  uidialog:  {w:160,h:60,c:'--c-uidialog', b:'--b-uidialog',t:'--t-uidialog',label:'?�?�창',  end:false,draw:dUIDialog, tyRatio:0.42},
  uiimage:   {w:140,h:60,c:'--c-uiimage',  b:'--b-uiimage', t:'--t-uiimage', label:'?��?지',  end:false,draw:dUIImage},
  uilist:    {w:140,h:80,c:'--c-uilist',   b:'--b-uilist',  t:'--t-uilist',  label:'리스??,  end:false,draw:dUIList},
  system:    {w:160,h:64,c:'--c-system',   b:'--b-system',  t:'--t-system',  label:'?�스??,  end:false,draw:dSystem},
  db:        {w:140,h:68,c:'--c-db',       b:'--b-db',      t:'--t-db',      label:'DB',      end:true, draw:dDB},
  document:  {w:160,h:64,c:'--c-document', b:'--b-document',t:'--t-document',label:'문서',    end:true, draw:dDocument, tyRatio:0.42},
  // FSM
  state:     {w:150,h:56,c:'--c-state',    b:'--b-state',   t:'--t-state',   label:'?�태',    end:false,draw:dState},
  initial:   {w:50, h:50,c:'--c-initial',  b:'--b-initial', t:'--t-initial', label:'초기',    end:false,draw:dInitial},
  accepting: {w:150,h:56,c:'--c-accepting',b:'--b-accepting',t:'--t-accepting',label:'?�락',  end:true, draw:dAccepting},
  fsmchoice: {w:76, h:76,c:'--c-fsmchoice',b:'--b-fsmchoice',t:'--t-fsmchoice',label:'Choice',end:false,draw:dDecision},
  fsmfork:   {w:160,h:16,c:'--b-fsmfork',  b:'--b-fsmfork', t:'--t-fsmfork', label:'Fork',   end:false,draw:dBar},
  fsmjoin:   {w:160,h:16,c:'--b-fsmjoin',  b:'--b-fsmjoin', t:'--t-fsmjoin', label:'Join',   end:false,draw:dBar},
  fsmhist:   {w:50, h:50,c:'--c-fsmhist',  b:'--b-fsmhist', t:'--t-fsmhist', label:'H',      end:false,draw:dHistCirc},
  fsmentrypt:{w:50, h:50,c:'--c-fsmentrypt',b:'--b-fsmentrypt',t:'--t-fsmentrypt',label:'En', end:false,draw:dSmCirc},
  // Behavior Tree
  btroot:    {w:120,h:56,c:'--c-btroot',   b:'--b-btroot',  t:'--t-btroot',  label:'Root',   end:false,draw:dTerminal},
  btseq:     {w:140,h:56,c:'--c-btseq',    b:'--b-btseq',   t:'--t-btseq',   label:'??,      end:false,draw:dProcess},
  btsel:     {w:140,h:56,c:'--c-btsel',    b:'--b-btsel',   t:'--t-btsel',   label:'?',       end:false,draw:dProcess},
  btpar:     {w:140,h:56,c:'--c-btpar',    b:'--b-btpar',   t:'--t-btpar',   label:'??,      end:false,draw:dProcess},
  btdec:     {w:150,h:56,c:'--c-btdec',    b:'--b-btdec',   t:'--t-btdec',   label:'Decorator',end:false,draw:dPrepare},
  btleaf:    {w:150,h:56,c:'--c-btleaf',   b:'--b-btleaf',  t:'--t-btleaf',  label:'Action',  end:true, draw:dRoundRect},
  btcond:    {w:76, h:76,c:'--c-btcond',   b:'--b-btcond',  t:'--t-btcond',  label:'C',       end:false,draw:dDecision},
  btsub:     {w:150,h:56,c:'--c-btsub',    b:'--b-btsub',   t:'--t-btsub',   label:'SubTree', end:false,draw:dSubroutine},
  // Sequence Chart
  sclife:    {w:170,h:56,c:'--c-sclife',   b:'--b-sclife',  t:'--t-sclife',  label:':Actor',  end:false,draw:dScLifeHead,scLifeline:true},
  scact:     {w:20, h:100,c:'--c-scact',   b:'--b-scact',   t:'--t-scact',   label:'',        end:false,draw:dProcess},
  scmsg:     {w:200,h:30,c:'--c-scmsg',    b:'--b-scmsg',   t:'--t-scmsg',   label:'msg()',   end:false,draw:dScMsg,noAnchors:true},
  scref:     {w:200,h:30,c:'--c-scref',    b:'--b-scref',   t:'--t-scref',   label:'ref()',   end:false,draw:dScMsgDash,noAnchors:true},
  scnote:    {w:160,h:64,c:'--c-scnote',   b:'--b-scnote',  t:'--t-scnote',  label:'Note',    end:false,draw:dScNote},
  scfrag:    {w:220,h:140,c:'--c-scfrag',  b:'--b-scfrag',  t:'--t-scfrag',  label:'loop',    end:false,draw:dScFrag},
  scgate:    {w:24, h:24, c:'--c-scgate',  b:'--b-scgate',  t:'--t-scgate',  label:'',        end:false,draw:dConnector},
  // Class Diagram
  cdclass:   {w:160,h:80,c:'--c-cdclass',  b:'--b-cdclass', t:'--t-cdclass', label:'Class',   end:false,draw:dCDClass},
  cdinterface:{w:160,h:80,c:'--c-cdinterface',b:'--b-cdinterface',t:'--t-cdinterface',label:'Interface',end:false,draw:dCDInterface},
  cdenum:    {w:140,h:80,c:'--c-cdenum',   b:'--b-cdenum',  t:'--t-cdenum',  label:'Enum',    end:false,draw:dCDEnum},
};

function nW(n){return n.sw||S[n.type]?.w||140;}
function nH(n){return n.sh||S[n.type]?.h||44;}

// Draw functions
function dTerminal(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h/2}" ry="${h/2}"/>`;}
function dProcess(w,h){return `<rect x="0" y="0" width="${w}" height="${h}"/>`;}
function dDecision(w,h){return `<polygon points="${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}"/>`;}
function dIO(w,h){const s=h*.28;return `<polygon points="${s},0 ${w},0 ${w-s},${h} 0,${h}"/>`;}
function dOutput(w,h){return `<path d="M0,0 L${w},0 L${w},${h*.68} Q${w*.75},${h} ${w/2},${h*.68} Q${w*.25},${h*.36} 0,${h*.68} Z"/>`;}
function dSubroutine(w,h){const m=10;return `<rect x="0" y="0" width="${w}" height="${h}"/><line x1="${m}" y1="0" x2="${m}" y2="${h}" stroke-width="1.8"/><line x1="${w-m}" y1="0" x2="${w-m}" y2="${h}" stroke-width="1.8"/>`;}
function dPrepare(w,h){const c=h*.35;return `<polygon points="${c},0 ${w-c},0 ${w},${h/2} ${w-c},${h} ${c},${h} 0,${h/2}"/>`;}
function dManual(w,h){return `<polygon points="0,${h*.35} ${w},0 ${w},${h} 0,${h}"/>`;}
function dManualOp(w,h){const s=h*.25;return `<polygon points="0,0 ${w},0 ${w-s},${h} ${s},${h}"/>`;}
function dDelay(w,h){const r=h/2;return `<path d="M0,0 L${w-r},0 Q${w},0 ${w},${r} Q${w},${h} ${w-r},${h} L0,${h} Z"/>`;}
function dDisplay(w,h){const lx=h*.5;return `<path d="M${lx},0 L${w},0 L${w},${h} L${lx},${h} Q0,${h/2} ${lx},0 Z"/>`;}
function dConnector(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/>`;}
function dMerge(w,h){return `<polygon points="${w/2},${h} ${w},0 0,0"/>`;}
function dScreen(w,h){return `<rect x="0" y="0" width="${w}" height="${h}"/><rect x="0" y="0" width="${w}" height="${h*.22}" opacity="0.45"/>`;}
function dPopup(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="7" ry="7"/>`;}
function dUIButton(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h/2}" ry="${h/2}"/>`;}
function dUIDialog(w,h){const t=12, r=6; return `<path d="M${r},0 L${w-r},0 Q${w},0 ${w},${r} L${w},${h-t-r} Q${w},${h-t} ${w-r},${h-t} L35,${h-t} L10,${h} L20,${h-t} L${r},${h-t} Q0,${h-t} 0,${h-t-r} L0,${r} Q0,0 ${r},0 Z"/>`;}
function dUIImage(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4" ry="4"/><circle cx="${w/2}" cy="${h/2-5}" r="${h/4}" opacity="0.15"/><polygon points="${w*.2},${h*.8} ${w*.5},${h*.3} ${w*.8},${h*.8}" opacity="0.15"/>`;}
function dUIList(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4" ry="4"/><line x1="12" y1="25" x2="${w-12}" y2="25" stroke="var(--t-uilist)" stroke-width="2" opacity="0.3"/><line x1="12" y1="40" x2="${w-12}" y2="40" stroke="var(--t-uilist)" stroke-width="2" opacity="0.3"/><line x1="12" y1="55" x2="${w-12}" y2="55" stroke="var(--t-uilist)" stroke-width="2" opacity="0.3"/>`;}
function dSystem(w,h){const c=h*.28;return `<polygon points="${w*.18},0 ${w*.82},0 ${w},${c} ${w},${h-c} ${w*.82},${h} ${w*.18},${h} 0,${h-c} 0,${c}"/>`;}
function dDB(w,h){const ry=h*.17;return `<ellipse cx="${w/2}" cy="${ry}" rx="${w/2}" ry="${ry}"/><path d="M0,${ry} L0,${h-ry} Q0,${h} ${w/2},${h} Q${w},${h} ${w},${h-ry} L${w},${ry}"/><ellipse cx="${w/2}" cy="${ry}" rx="${w/2}" ry="${ry}" opacity="0.35"/>`;}
function dDocument(w,h){return `<path d="M0,0 L${w},0 L${w},${h*.68} Q${w*.75},${h} ${w/2},${h*.68} Q${w*.25},${h*.36} 0,${h*.68} Z"/>`;}
function dState(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h/2}" ry="${h/2}"/>`;}
function dInitial(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/><circle cx="${r}" cy="${r}" r="${r*.44}" fill="var(--b-initial)" opacity="0.8"/>`;}
function dAccepting(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h/2}" ry="${h/2}"/><rect x="5" y="5" width="${w-10}" height="${h-10}" rx="${(h-10)/2}" ry="${(h-10)/2}" fill="none" stroke="var(--b-accepting)" stroke-width="1.4"/>`;}
function dBar(w,h){return `<rect x="0" y="0" width="${w}" height="${h}"/>`;}
function dHistCirc(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/><text x="${r}" y="${r+1}" font-size="${r*.9}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="var(--t-fsmhist)">H</text>`;}
function dSmCirc(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/>`;}
function dRoundRect(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="6" ry="6"/>`;}
function dScLifeHead(w,h){return `<rect x="0" y="0" width="${w}" height="${h}"/>`;}
function dScMsg(w,h){return `<line x1="0" y1="${h/2}" x2="${w-8}" y2="${h/2}" stroke-width="1.8"/><polygon points="${w-16},${h/2-5} ${w},${h/2} ${w-16},${h/2+5}"/>`;}
function dScMsgDash(w,h){return `<line x1="0" y1="${h/2}" x2="${w-8}" y2="${h/2}" stroke-width="1.8" stroke-dasharray="5 3"/><polygon points="${w-16},${h/2-5} ${w},${h/2} ${w-16},${h/2+5}"/>`;}
function dScNote(w,h){const f=10;return `<polygon points="0,0 ${w-f},0 ${w},${f} ${w},${h} 0,${h}"/><line x1="${w-f}" y1="0" x2="${w-f}" y2="${f}" stroke-width="1" opacity=".6"/><line x1="${w-f}" y1="${f}" x2="${w}" y2="${f}" stroke-width="1" opacity=".6"/>`;}
function dScFrag(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" fill-opacity="0.35"/><rect x="0" y="0" width="28" height="14" opacity=".8"/>`;}

function dCDClass(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="2" ry="2"/><g class="cd-props"></g>`;}
function dCDInterface(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="2" ry="2"/><text x="${w/2}" y="10" font-size="10" fill="currentColor" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">«interface»</text><g class="cd-props"></g>`;}
function dCDEnum(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="2" ry="2"/><text x="${w/2}" y="10" font-size="10" fill="currentColor" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">«enum»</text><g class="cd-props"></g>`;}

// Anchors helper (single definition will be updated later)
function anchorW(nid,aid){
  const n=nodes[nid]; if(!n) return {x:0,y:0};
  const list=getAnchors(n);
  const a=list.find(x=>x.id===aid)||list[1]||{cx:nW(n)/2,cy:nH(n)/2};
  return {x:n.x+a.cx,y:n.y+a.cy};
}

function collectEdgeIdsForNodes(nodeIds){
  const set=new Set(nodeIds||[]);
  const out=[];
  for(const eid in edges){
    const e=edges[eid];
    if(!e) continue;
    if(set.has(e.from)||set.has(e.to)) out.push(eid);
  }
  return out;
}
function collectAlignRefs(excludeIds){
  const ex=new Set(excludeIds||[]);
  const xs=[], ys=[];
  for(const id in nodes){
    if(ex.has(id)) continue;
    const n=nodes[id];
    const w=nW(n), h=nH(n);
    xs.push(n.x, n.x+w/2, n.x+w);
    ys.push(n.y, n.y+h/2, n.y+h);
  }
  return {xs, ys};
}
function snapAxisToRefs(value, refs, threshold){
  let best=value, bestAbs=Infinity;
  refs.forEach(r=>{
    const d=Math.abs(r-value);
    if(d<bestAbs){ bestAbs=d; best=r; }
  });
  return bestAbs<=threshold ? best : value;
}
function applyNodeAlignSnap(x, y, drag){
  if(!drag || !drag.alignRefs) return {x,y};
  const n=nodes[drag.id];
  if(!n) return {x,y};
  const w=nW(n), h=nH(n), th=8;

  const xCandidates=[
    {v:snapAxisToRefs(x, drag.alignRefs.xs, th), out:v=>v},
    {v:snapAxisToRefs(x+w/2, drag.alignRefs.xs, th), out:v=>v-w/2},
    {v:snapAxisToRefs(x+w, drag.alignRefs.xs, th), out:v=>v-w}
  ];
  let bestX=x, bestDX=Infinity;
  xCandidates.forEach(c=>{
    const nx=c.out(c.v);
    const d=Math.abs(nx-x);
    if(d<bestDX){ bestDX=d; bestX=nx; }
  });

  const yCandidates=[
    {v:snapAxisToRefs(y, drag.alignRefs.ys, th), out:v=>v},
    {v:snapAxisToRefs(y+h/2, drag.alignRefs.ys, th), out:v=>v-h/2},
    {v:snapAxisToRefs(y+h, drag.alignRefs.ys, th), out:v=>v-h}
  ];
  let bestY=y, bestDY=Infinity;
  yCandidates.forEach(c=>{
    const ny=c.out(c.v);
    const d=Math.abs(ny-y);
    if(d<bestDY){ bestDY=d; bestY=ny; }
  });

  return {x:bestX, y:bestY};
}
function queueEdgeRedraw(edgeIds){
  if(!edgeIds){
    edgeRedrawAll=true;
  }else{
    edgeIds.forEach(eid=>edgeRedrawSet.add(eid));
  }
  if(edgeRedrawRAF) return;
  edgeRedrawRAF=requestAnimationFrame(()=>{
    edgeRedrawRAF=0;
    if(edgeRedrawAll){
      edgeRedrawAll=false;
      edgeRedrawSet.clear();
      redrawEdges();
      return;
    }
    const ids=[...edgeRedrawSet];
    edgeRedrawSet.clear();
    ids.forEach(renderEdge);
  });
}
function flushEdgeRedraw(){
  if(edgeRedrawRAF){
    cancelAnimationFrame(edgeRedrawRAF);
    edgeRedrawRAF=0;
  }
  if(edgeRedrawAll){
    edgeRedrawAll=false;
    edgeRedrawSet.clear();
    redrawEdges();
    return;
  }
  const ids=[...edgeRedrawSet];
  edgeRedrawSet.clear();
  ids.forEach(renderEdge);
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// COLOUR RESOLVER
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
let _cachedComputedStyle = null;
function resolveVars(str){
  if(!_cachedComputedStyle) _cachedComputedStyle = getComputedStyle(document.documentElement);
  const cs=_cachedComputedStyle;
  return str.replace(/var\(([^)]+)\)/g,(_,k)=>{
    const v=cs.getPropertyValue(k.trim()).trim();
    return v||'#888';
  });
}
function invalidateVarCache(){ _cachedComputedStyle = null; }

function escapeHtml(s){
  const d=document.createElement('span');
  d.textContent=String(s);
  return d.innerHTML;
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// RENDER NODE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function getAnchors(n) {
  const W = nW(n), H = nH(n), t = n.type;
  if (S[t]?.noAnchors) return [];
  // order: top, right, bottom, left ??consistent with arrow directions
  return [
    { id: 't', cx: W / 2, cy: 0 },
    { id: 'r', cx: W,     cy: H / 2 },
    { id: 'b', cx: W / 2, cy: H },
    { id: 'l', cx: 0,     cy: H / 2 }
  ];
}

function getCDNodeProps(n) {
  const isEnum = n.type === 'cdenum';
  let attrs = [], meths = [];
  if (typeof n.properties?.cd_attributes === 'string' || typeof n.properties?.cd_methods === 'string') {
    attrs = (n.properties.cd_attributes || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (!isEnum) meths = (n.properties.cd_methods || '').split('\n').map(l => l.trim()).filter(Boolean);
  } else {
    Object.entries(n.properties || {}).forEach(([k, v]) => {
      const t = v ? `${k}: ${v}` : k;
      if (k.includes('(')) meths.push(t); else attrs.push(t);
    });
  }
  return { attrs, meths };
}

function drawCDNode(n, s) {
  const isEnum = n.type === 'cdenum', isInterface = n.type === 'cdinterface';
  const { attrs, meths } = getCDNodeProps(n);
  const headerH = isInterface ? 34 : 26, lh = 15, pad = 8;
  const autoAh = Math.max(24, attrs.length * lh + pad), autoMh = isEnum ? 0 : Math.max(24, meths.length * lh + pad);
  if (!n._cdManualH) n.sh = headerH + autoAh + autoMh;
  const H = nH(n), W = nW(n);
  let ah = autoAh, mh = autoMh;
  if (n._cdManualH) {
    const total = H - headerH;
    ah = isEnum ? total : Math.round(total * 0.5);
    mh = isEnum ? 0 : total - ah;
  }
  let h = `<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke-width="1.2" stroke="var(${s.b})"/>`;
  if (!isEnum) h += `<line x1="0" y1="${headerH + ah}" x2="${W}" y2="${headerH + ah}" stroke-width="1.2" stroke="var(${s.b})"/>`;
  attrs.forEach((a, i) => h += `<text x="6" y="${headerH + pad + 2 + i * lh}" font-size="11" fill="var(--tx)" dominant-baseline="auto">${escapeHtml(a)}</text>`);
  if (!isEnum) meths.forEach((m, i) => h += `<text x="6" y="${headerH + ah + pad + 2 + i * lh}" font-size="11.5" fill="var(--tx2)" dominant-baseline="auto" font-style="italic">${escapeHtml(m)}</text>`);
  return h;
}

function renderNode(id) {
  const n = nodes[id], s = S[n.type]; if (!s) return;
  if (n.type.startsWith('cd')) n.propsHTML = drawCDNode(n, s);

  const W = nW(n), H = nH(n);
  document.getElementById('ng-' + id)?.remove();
  const g = mkSvg('g', { id: 'ng-' + id, class: 'ng', transform: `translate(${n.x},${n.y})` });
  const sg = mk('g'); sg.classList.add('nsh'); sg.style.color = `var(${s.t})`;
  sg.innerHTML = `<g fill="${n.color || `var(${s.c})`}" stroke="var(${s.b})" stroke-width="1.7">${s.draw(W, H)}</g>`;
  if (n.propsHTML) { const p = sg.querySelector('.cd-props'); if (p) p.innerHTML = n.propsHTML; }
  g.appendChild(sg);

  if (s.scLifeline) {
    const ll = mkSvg('line', { class: 'sc-lifeline', x1: W / 2, y1: H, x2: W / 2, y2: H + 200 });
    g.appendChild(ll);
  }
  if (n.type !== 'scfrag' && !n.type.startsWith('cd')) {
    const tx = mkSvg('text', { class: 'ntype', x: W / 2, y: 14 });
    tx.style.fill = `var(${s.t})`; tx.textContent = `[ ${s.label} ]`;
    g.appendChild(tx);
  }
  const isCD = n.type.startsWith('cd');
  if (n.label) {
    const tx = mkSvg('text', { class: 'ntx' });
    if (isCD) {
      tx.setAttribute('x', W / 2); tx.setAttribute('y', n.type === 'cdclass' ? 14 : 19);
      tx.style.fontWeight = 'bold';
    } else {
      tx.setAttribute('x', W / 2); tx.setAttribute('y', H * (s.tyRatio || 0.5) + (n.type === 'scfrag' ? 0 : 4));
    }
    tx.style.fill = n.txtColor || (isCD ? `var(${s.t})` : 'var(--tx)');
    tx.textContent = n.label; g.appendChild(tx);
    if (n.type === 'scfrag') { tx.setAttribute('x', 14); tx.setAttribute('y', 7); tx.style.fontSize = '8px'; tx.style.fill = '#ffffff'; }
  }
  const sub = mkSvg('text', { class: 'nid', x: W / 2, y: H * (s.tyRatio || 0.5) + (n.label && n.type !== 'scfrag' ? 18 : 12) });
  sub.style.fill = `var(${s.t})`; sub.textContent = id; g.appendChild(sub);

  getAnchors(n).forEach(a => g.append(mkSvg('circle', { class: 'an', cx: a.cx, cy: a.cy, r: 5, 'data-anchor': a.id, 'data-nid': id, style: `stroke:var(--b-${n.type}, var(--edge-hl));fill:var(--bg)` })));
  const HS = 7, O = 3;
  [{ id: 'nw', x: -O, y: -O, c: 'nwse-resize' }, { id: 'ne', x: W + O, y: -O, c: 'nesw-resize' }, { id: 'se', x: W + O, y: H + O, c: 'nwse-resize' }, { id: 'sw', x: -O, y: H + O, c: 'nesw-resize' }].forEach(p => g.append(mkSvg('rect', { class: 'rh', x: p.x - HS / 2, y: p.y - HS / 2, width: HS, height: HS, 'data-rh': p.id, 'data-nid': id, style: `cursor:${p.c}` })));

  NL.appendChild(g); bindNode(g, id);
  if (selSet.has(id)) g.classList.add('msel');
}

function bindNode(g,id){
  g.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('an')||e.target.classList.contains('rh')) return;

    // ?�?� ?�결 모드 �? ?�드 본체 ?�릭 ??가??가까운 ?�커�??�결 ?�료 ?�?�
    if(connecting){
      if(id !== connecting.fromId){
        const p=spt(e.clientX,e.clientY);
        const anchors=getAnchors(nodes[id]);
        let bestA='l', bestDist=Infinity;
        anchors.forEach(a=>{
          const d=Math.hypot(p.x-(nodes[id].x+a.cx), p.y-(nodes[id].y+a.cy));
          if(d<bestDist){ bestDist=d; bestA=a.id; }
        });
        e.stopPropagation();
        finishConnect(id, bestA);
      }
      return;
    }
    if(reconnecting){
      if(id !== reconnecting.fixedId){
        const p=spt(e.clientX,e.clientY);
        const anchors=getAnchors(nodes[id]);
        let bestA='l', bestDist=Infinity;
        anchors.forEach(a=>{
          const d=Math.hypot(p.x-(nodes[id].x+a.cx), p.y-(nodes[id].y+a.cy));
          if(d<bestDist){ bestDist=d; bestA=a.id; }
        });
        e.stopPropagation();
        finishReconnect(id, bestA);
      } else {
        cancelReconnect();
      }
      return;
    }

    if(connecting) return;
    e.stopPropagation();
    if(e.shiftKey){
      if(selSet.has(id)){selSet.delete(id);g.classList.remove('msel');}
      else{selSet.add(id);g.classList.add('msel');}
      selId=null; updateInspector(); return;
    }
    if(!selSet.has(id)) selSet.clear();
    selItem(id);
    const p=spt(e.clientX,e.clientY);
    const movingIds = selSet.size>1 ? [...selSet] : [id];
    drag={type:'node',id,ox:p.x-nodes[id].x,oy:p.y-nodes[id].y,
      leadStartX:nodes[id].x, leadStartY:nodes[id].y,
      movingIds,
      alignRefs: collectAlignRefs(movingIds),
      edgeIds: collectEdgeIdsForNodes(movingIds),
      multiOrig: selSet.size>1 ? [...selSet].map(sid=>({id:sid,x:nodes[sid].x,y:nodes[sid].y})) : null
    };
  });
  g.addEventListener('click',e=>{
    if(connecting || reconnecting) e.stopPropagation();
  });
  g.addEventListener('dblclick',e=>{
    e.stopPropagation();
    // ?�블?�릭 ??브라?��? 기본 prompt ?�??커스?� 모달???�용
    renameTarget = id;
    const inp = document.getElementById('rename-input');
    inp.value = nodes[id].label || '';
    document.getElementById('m-rename').style.display = 'flex';
    // ?�커??�??�택?� ?�간??지?????�행 (?�더 ?�료 보장)
    setTimeout(() => {
      inp.focus(); inp.select();
    }, 20);
  });
  
  // ?�?� ?�커: ?�래�?방식 + ?�릭 2�?방식 ?�시 지???�?�
  g.querySelectorAll('.an').forEach(c=>{
    c.addEventListener('mouseenter',()=>{ c.setAttribute('r','8'); c.style.fill=c.style.stroke; });
    c.addEventListener('mouseleave',()=>{ if(!drag||drag.type!=='connect'){ c.setAttribute('r','5'); c.style.fill='var(--bg)'; } });

    c.addEventListener('click', e=>{ e.stopPropagation(); });
    c.addEventListener('mousedown',e=>{
      e.stopPropagation(); e.preventDefault();

      // ?�?� ?�결 진행 �????�착???�커 ?�릭(?�릭 2번째 방식) or ?�래�??�료 ?�?�
      if(connecting){
        if(id !== connecting.fromId){
          finishConnect(id, c.dataset.anchor);
        }
        return;
      }
      if(reconnecting){
        if(id !== reconnecting.fixedId){
          finishReconnect(id, c.dataset.anchor);
        } else {
          cancelReconnect();
        }
        return;
      }

      // ?�?� ?��? 같�? 출발???�커???�이 ?�으�??�어?�서 ?�연�??�?�
      let existEdge = null;
      for(const k in edges){
        const e = edges[k];
        if(e && e.from===id && e.fromA===c.dataset.anchor){ existEdge = k; break; }
      }
      if(existEdge){
        delete edges[existEdge];
        removeEdgeDOM(existEdge);
        updateStatus(); saveState('???�어?�기');
      }

      // ?�?� ?�결 ?�작 (?�래�??�릭 공통) ?�?�
      startConnect(id, c.dataset.anchor, c);
    });
  });
  
  g.querySelectorAll('.rh').forEach(r=>{
    r.addEventListener('mousedown',e=>{
      e.stopPropagation(); e.preventDefault();
      selItem(id);
      const p=spt(e.clientX,e.clientY);
      const n=nodes[id];
      drag={type:'resize',id,rhId:r.dataset.rh,startX:p.x,startY:p.y,
            origX:n.x,origY:n.y,origW:nW(n),origH:nH(n),
            edgeIds: collectEdgeIdsForNodes([id])};
    });
  });
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// NODE Z-INDEX (LAYERING)
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function nodeToFront(id) {
  const g = document.getElementById('ng-'+id);
  if(g) NL.appendChild(g); // Move to end of DOM (renders on top)
  // JS 객체 ?????�서 조정???�해 ?�삽??
  const n = nodes[id]; delete nodes[id]; nodes[id] = n;
  saveState('?�이??�??�으�?);
}
function nodeToBack(id) {
  const g = document.getElementById('ng-'+id);
  if(g) NL.insertBefore(g, NL.firstChild); // Move to start of DOM (renders at bottom)
  // JS 객체 ?????�서 조정???�해 ?�구??
  const newNodes = { [id]: nodes[id] };
  for(let k in nodes) { if(k !== id) newNodes[k] = nodes[k]; }
  nodes = newNodes;
  saveState('?�이??�??�로');
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// LINE STYLES & ROUTING
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function toggleLineStyle(){
  const btn = document.getElementById('lstyle-btn');
  if(globalLineStyle === 'curve') {
    globalLineStyle = 'step';
    btn.textContent = '??';
    btn.setAttribute('data-tip', '???��??? 꺾�???);
    btn.setAttribute('data-tip-sub', '?�애물을 ?�동?�로 ?�하??직각 경로');
  } else if(globalLineStyle === 'step') {
    globalLineStyle = 'straight';
    btn.textContent = '?��';
    btn.setAttribute('data-tip', '???��??? 직선');
    btn.setAttribute('data-tip-sub', '출발?�과 ?�착?�을 직선?�로 ?�결');
  } else {
    globalLineStyle = 'curve';
    btn.textContent = '??;
    btn.setAttribute('data-tip', '???��??? 곡선');
    btn.setAttribute('data-tip-sub', '베�???곡선?�로 부?�럽�??�결');
  }
  redrawEdges();
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// CONNECT HELPERS  (startConnect / finishConnect)
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function clearConnectVisuals(){
  tl.style.display='none';
  tl.setAttribute('d','');
  cvs.classList.remove('cx','connecting');
  document.querySelectorAll('.ng.connect-target').forEach(el=>el.classList.remove('connect-target'));
  document.querySelectorAll('.an.active').forEach(a=>{ a.setAttribute('r','5'); a.classList.remove('active'); });
}
function nearestAnchorAtPoint(p, excludeNodeId, maxDist){
  let best=null, bestDist=Infinity;
  for(const nid in nodes){
    if(nid===excludeNodeId) continue;
    const n=nodes[nid];
    if(!n) continue;
    getAnchors(n).forEach(a=>{
      const ax=n.x+a.cx, ay=n.y+a.cy;
      const d=Math.hypot(p.x-ax,p.y-ay);
      if(d<bestDist){
        bestDist=d;
        best={toId:nid,toA:a.id};
      }
    });
  });
  return (best && bestDist<=maxDist) ? best : null;
}
function findDropAnchorAt(clientX, clientY, excludeNodeId){
  const p=spt(clientX,clientY);
  let target = document.elementFromPoint(clientX, clientY);
  if(!target) return null;
  const an = target.closest?.('.an');
  if(an){
    const toId = an.dataset.nid;
    const toA = an.dataset.anchor;
    if(toId && toA && toId !== excludeNodeId) return {toId, toA};
  }
  const ng = target.closest?.('.ng');
  if(ng){
    const toId = ng.id.replace('ng-','');
    if(!toId || toId===excludeNodeId || !nodes[toId]) return null;
    const anchors = getAnchors(nodes[toId]);
    let bestA='l', bestDist=Infinity;
    anchors.forEach(a=>{
      const ax = nodes[toId].x + a.cx;
      const ay = nodes[toId].y + a.cy;
      const d = Math.hypot(p.x-ax, p.y-ay);
      if(d<bestDist){ bestDist=d; bestA=a.id; }
    });
    return {toId, toA:bestA};
  }
  const maxPickDist = 24 / Math.max(vs, 0.1); // approximately 24px on screen
  return nearestAnchorAtPoint(p, excludeNodeId, maxPickDist);
}
function startConnect(fromId, fromA, anchorEl){
  if(reconnecting) cancelReconnect();
  connecting = { fromId, fromA };
  drag = { type:'connect' };
  tl.style.display='';
  cvs.classList.add('cx','connecting');
  const from = anchorW(fromId, fromA);
  tl.setAttribute('d', `M${from.x},${from.y} L${from.x},${from.y}`);
  if(anchorEl){ anchorEl.setAttribute('r','8'); anchorEl.classList.add('active'); }
}

function finishConnect(toId, toA){
  if(!connecting) return;
  createEdge(connecting.fromId, toId, connecting.fromA, toA);
  saveState('???�결 ?�료');
  cancelConnect();
}

function cancelConnect(){
  connecting = null;
  clearConnectVisuals();
  drag = null;
}

function startReconnect(eid, end){
  if(connecting) cancelConnect();
  const e = edges[eid];
  if(!e) return;
  reconnecting = {
    eid,
    end, // 'from' | 'to'
    fixedId: end==='to' ? e.from : e.to,
    fixedA:  end==='to' ? e.fromA : e.toA
  };
  drag = {type:'reconnect'};
  const fp = anchorW(reconnecting.fixedId, reconnecting.fixedA);
  tl.style.display='';
  cvs.classList.add('cx','connecting');
  tl.setAttribute('d', `M${fp.x},${fp.y} L${fp.x},${fp.y}`);
}
function cancelReconnect(){
  reconnecting = null;
  clearConnectVisuals();
  drag = null;
}
function finishReconnect(toId, toA){
  if(!reconnecting) return;
  const e = edges[reconnecting.eid];
  if(!e){ cancelReconnect(); return; }
  if(reconnecting.end==='to'){
    if(e.from===toId){ cancelReconnect(); return; }
    e.to = toId;
    e.toA = toA;
  }else{
    if(e.to===toId){ cancelReconnect(); return; }
    e.from = toId;
    e.fromA = toA;
  }
  // ?�연�???기존 ?�동 경로/?�들?� 초기?�하??경로 꼬임??방�?
  delete e.manualPts;
  e.cp1dx=0; e.cp1dy=0; e.cp2dx=0; e.cp2dy=0;
  renderEdge(reconnecting.eid);
  selItem('edge:'+reconnecting.eid);
  saveState('???�연�?);
  cancelReconnect();
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// ROUTING  ?? obstacle-aware orthogonal + bezier
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

// ?�분 vs AABB 교차 (Cohen-Sutherland)
function segRectIntersect(ax,ay,bx,by,rx0,ry0,rx1,ry1){
  function code(x,y){return((x<rx0)?1:0)|((x>rx1)?2:0)|((y<ry0)?4:0)|((y>ry1)?8:0);}
  let c0=code(ax,ay),c1=code(bx,by);
  for(let i=0;i<8;i++){
    if(!(c0|c1)) return true;
    if(c0&c1) return false;
    const c=c0||c1; let x,y;
    if(c&8){x=ax+(bx-ax)*(ry1-ay)/(by-ay);y=ry1;}
    else if(c&4){x=ax+(bx-ax)*(ry0-ay)/(by-ay);y=ry0;}
    else if(c&2){x=rx1;y=ay+(by-ay)*(rx1-ax)/(bx-ax);}
    else{x=rx0;y=ay+(by-ay)*(rx0-ax)/(bx-ax);}
    if(c===c0){ax=x;ay=y;c0=code(ax,ay);}else{bx=x;by=y;c1=code(bx,by);}
  }
  return false;
}

// ?�리?�인 충돌 체크
function polyHits(pts,skipIds,pad){
  pad=pad||6;
  for(let i=0;i<pts.length-1;i++){
    const [ax,ay]=pts[i],[bx,by]=pts[i+1];
    for(const nid in nodes){
      if(skipIds&&skipIds.includes(nid)) continue;
      const n=nodes[nid];
      if(segRectIntersect(ax,ay,bx,by,n.x-pad,n.y-pad,n.x+nW(n)+pad,n.y+nH(n)+pad)) return true;
    }
  }
  return false;
}

// 베�???충돌 체크 (?�플�?
function bezierHitsObstacle(fx,fy,cx1,cy1,cx2,cy2,tx,ty,skipIds,samples){
  samples=samples||22;
  let px=fx,py=fy;
  for(let i=1;i<=samples;i++){
    const t=i/samples,m=1-t;
    const nx=m*m*m*fx+3*m*m*t*cx1+3*m*t*t*cx2+t*t*t*tx;
    const ny=m*m*m*fy+3*m*m*t*cy1+3*m*t*t*cy2+t*t*t*ty;
    for(const nid in nodes){
      if(skipIds&&skipIds.includes(nid)) continue;
      const nd=nodes[nid];
      if(segRectIntersect(px,py,nx,ny,nd.x-6,nd.y-6,nd.x+nW(nd)+6,nd.y+nH(nd)+6)) return true;
    }
    px=nx;py=ny;
  }
  return false;
}

// ?�커 방향�?출구 벡터
function exitVec(anchor,dist){
  if(anchor==='t') return{dx:0,dy:-dist};
  if(anchor==='b') return{dx:0,dy:dist};
  if(anchor==='l') return{dx:-dist,dy:0};
  return{dx:dist,dy:0};
}
function nodeBB(n){return{x0:n.x,y0:n.y,x1:n.x+nW(n),y1:n.y+nH(n)};}
function nodesOverlapX(nA,nB,margin){
  margin=margin||10;
  return(nA.x-margin)<(nB.x+nW(nB)+margin)&&(nB.x-margin)<(nA.x+nW(nA)+margin);
}
// ?�커 방향 ???�위벡터
function anchorDir(a){
  if(a==='t') return[0,-1];
  if(a==='b') return[0,1];
  if(a==='l') return[-1,0];
  return[1,0];
}

// ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// 직각(Orthogonal) ?�회 ?�우??
// 출발(sx,sy,sDirX,sDirY) ???�착(ex,ey,eDirX,eDirY)
// ?�애물을 ?�하??waypoints 배열 반환
// ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
function orthoRoute(sx,sy,sDirX,sDirY,ex,ey,eDirX,eDirY,skipIds){
  const PAD=20;
  const HARD_PAD=6;   // hard collision: ?�형 관??금�?
  const SOFT_PAD=22;  // soft collision: ?�형�?충분??간격 ?�호
  const GUIDE_GAP=30;
  const startNode=(skipIds&&skipIds.length>0)?nodes[skipIds[0]]:null;
  const endNode=(skipIds&&skipIds.length>1)?nodes[skipIds[1]]:null;

  // ?�애�?bbox ?�집
  const obsHard=[], obsSoft=[];
  for(const nid in nodes){
    if(skipIds&&skipIds.includes(nid)) continue;
    const n=nodes[nid];
    obsHard.push({x0:n.x-HARD_PAD,y0:n.y-HARD_PAD,x1:n.x+nW(n)+HARD_PAD,y1:n.y+nH(n)+HARD_PAD});
    obsSoft.push({x0:n.x-SOFT_PAD,y0:n.y-SOFT_PAD,x1:n.x+nW(n)+SOFT_PAD,y1:n.y+nH(n)+SOFT_PAD});
  }
  function segHitCount(ax,ay,bx,by,obs){
    let c=0;
    for(const o of obs) if(segRectIntersect(ax,ay,bx,by,o.x0,o.y0,o.x1,o.y1)) c++;
    return c;
  }
  function routeScore(pts){
    let hardHits=0, softHits=0, len=0, turns=0, shortSegs=0, endpointPen=0;
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      const segLen=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);
      hardHits+=segHitCount(a[0],a[1],b[0],b[1],obsHard);
      softHits+=segHitCount(a[0],a[1],b[0],b[1],obsSoft);
      len+=segLen;
      if(segLen<22) shortSegs++;
      // ?�작/?�착 ?�드??�?마�?�??�그먼트�??�외 ?�용, �???관?��? 강한 ?�널??
      if(startNode && i>0 && segRectIntersect(a[0],a[1],b[0],b[1],startNode.x-2,startNode.y-2,startNode.x+nW(startNode)+2,startNode.y+nH(startNode)+2)) endpointPen++;
      if(endNode && i<pts.length-2 && segRectIntersect(a[0],a[1],b[0],b[1],endNode.x-2,endNode.y-2,endNode.x+nW(endNode)+2,endNode.y+nH(endNode)+2)) endpointPen++;
    }
    for(let i=1;i<pts.length-1;i++){
      const a=pts[i-1], b=pts[i], c=pts[i+1];
      const h1=Math.abs(a[1]-b[1])<0.5, h2=Math.abs(b[1]-c[1])<0.5;
      const v1=Math.abs(a[0]-b[0])<0.5, v2=Math.abs(b[0]-c[0])<0.5;
      if((h1&&v2)||(v1&&h2)) turns++;
    }
    let dirPenalty=0;
    if(pts.length>=2){
      const a0=pts[0], a1=pts[1];
      const dx0=a1[0]-a0[0], dy0=a1[1]-a0[1];
      if(sDirX!==0){
        if(Math.abs(dy0)>0.5 || Math.sign(dx0)!==Math.sign(sDirX)) dirPenalty+=2;
      }else{
        if(Math.abs(dx0)>0.5 || Math.sign(dy0)!==Math.sign(sDirY)) dirPenalty+=2;
      }
      const z0=pts[pts.length-2], z1=pts[pts.length-1];
      const dxe=z1[0]-z0[0], dye=z1[1]-z0[1];
      if(eDirX!==0){
        // ?�착?�에?�는 ?�커 방향??반�?쪽에??진입?�야 ?�연?�럽??
        if(Math.abs(dye)>0.5 || Math.sign(dxe)!==-Math.sign(eDirX)) dirPenalty+=2;
      }else{
        if(Math.abs(dxe)>0.5 || Math.sign(dye)!==-Math.sign(eDirY)) dirPenalty+=2;
      }
    }
    return {hardHits,endpointPen,softHits,len,turns,shortSegs,dirPenalty,segs:Math.max(0,pts.length-1)};
  }
  function betterScore(a,b){
    if(!b) return true;
    if(a.hardHits!==b.hardHits) return a.hardHits<b.hardHits;
    if(a.endpointPen!==b.endpointPen) return a.endpointPen<b.endpointPen;
    if(a.dirPenalty!==b.dirPenalty) return a.dirPenalty<b.dirPenalty;
    if(a.turns!==b.turns) return a.turns<b.turns;
    if(a.shortSegs!==b.shortSegs) return a.shortSegs<b.shortSegs;
    if(a.softHits!==b.softHits) return a.softHits<b.softHits;
    if(a.len!==b.len) return a.len<b.len;
    return a.segs<b.segs;
  }
  function cleanRoute(pts){
    return removeCollinearPts(compactPts(pts||[]));
  }

  // 출발·?�착 ?�방 ?�출??
  const s2x=sx+sDirX*PAD, s2y=sy+sDirY*PAD;
  const e2x=ex+eDirX*PAD, e2y=ey+eDirY*PAD;

  // ?�체 bounding box
  let bx0=sx,by0=sy,bx1=ex,by1=ey;
  for(const o of obsSoft){bx0=Math.min(bx0,o.x0);by0=Math.min(by0,o.y0);bx1=Math.max(bx1,o.x1);by1=Math.max(by1,o.y1);}
  bx0-=GUIDE_GAP; by0-=GUIDE_GAP; bx1+=GUIDE_GAP; by1+=GUIDE_GAP;

  // ?�평/?�직 방향 ?��?
  const sH=(sDirY===0), eH=(eDirY===0);

  // ?�순 L??/ Z???�도
  function tryCandidates(){
    const routes=[];
    const xGuides=[(s2x+e2x)/2, Math.max(sx,ex,bx1)+GUIDE_GAP*0.6, Math.min(sx,ex,bx0)-GUIDE_GAP*0.6];
    const yGuides=[(s2y+e2y)/2, Math.min(sy,ey,by0)-GUIDE_GAP*0.6, Math.max(sy,ey,by1)+GUIDE_GAP*0.6];
    // 충돌 ???�애물의 경계 바깥 ?�인??가?�드�?추�?
    obsSoft.forEach(o=>{
      xGuides.push(o.x0-GUIDE_GAP*0.35, o.x1+GUIDE_GAP*0.35);
      yGuides.push(o.y0-GUIDE_GAP*0.35, o.y1+GUIDE_GAP*0.35);
    });
    const ux=[...new Set(xGuides.map(v=>Math.round(v)))];
    const uy=[...new Set(yGuides.map(v=>Math.round(v)))];

    // ?�순 직선/?�일 굴곡 ?�선 ?�보
    if(near(sy,ey,0.6) || near(sx,ex,0.6)) routes.push([[sx,sy],[ex,ey]]);
    routes.push([[sx,sy],[ex,sy],[ex,ey]]);
    routes.push([[sx,sy],[sx,ey],[ex,ey]]);

    // 출발/?�착 ?�커 방향??존중?�는 기본 ?�보
    routes.push([[sx,sy],[s2x,s2y],[e2x,s2y],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[s2x,e2y],[e2x,e2y],[ex,ey]]);

    // ???�회(????�??? ?�보 - 밀�??�태?�서 ?�형 관???�피
    routes.push([[sx,sy],[s2x,s2y],[s2x,by0],[e2x,by0],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[s2x,by1],[e2x,by1],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[bx0,s2y],[bx0,e2y],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[bx1,s2y],[bx1,e2y],[e2x,e2y],[ex,ey]]);

    if(sH&&eH){
      // ?�평?�수?? ???�는 ?�래 ?�회
      uy.forEach(my=>{
        routes.push([[sx,sy],[s2x,s2y],[s2x,my],[e2x,my],[e2x,e2y],[ex,ey]]);
      });
    } else if(!sH&&!eH){
      // ?�직?�수�? �??�는 ???�회
      ux.forEach(mx=>{
        routes.push([[sx,sy],[s2x,s2y],[mx,s2y],[mx,e2y],[e2x,e2y],[ex,ey]]);
      });
    } else if(sH&&!eH){
      // ?�평?�수�? L??
      routes.push([[sx,sy],[e2x,sy],[e2x,ey]]);
      routes.push([[sx,sy],[s2x,sy],[s2x,e2y],[e2x,e2y],[ex,ey]]);
      uy.forEach(my=>{
        routes.push([[sx,sy],[s2x,sy],[s2x,my],[e2x,my],[e2x,e2y],[ex,ey]]);
      });
      ux.forEach(mx=>{
        routes.push([[sx,sy],[mx,sy],[mx,e2y],[e2x,e2y],[ex,ey]]);
      });
    } else {
      // ?�직?�수?? L??
      routes.push([[sx,sy],[sx,e2y],[ex,e2y],[ex,ey]]);
      routes.push([[sx,sy],[s2x,sy],[s2x,e2y],[ex,e2y],[ex,ey]]);
      ux.forEach(mx=>{
        routes.push([[sx,sy],[mx,sy],[mx,e2y],[ex,e2y],[ex,ey]]);
      });
      uy.forEach(my=>{
        routes.push([[sx,sy],[sx,my],[ex,my],[ex,ey]]);
      });
    }
    const out=[];
    const seen=new Set();
    routes.forEach(r=>{
      const c=cleanRoute(r);
      if(c.length<2) return;
      const key=c.map(p=>`${Math.round(p[0])},${Math.round(p[1])}`).join('|');
      if(seen.has(key)) return;
      seen.add(key);
      out.push(c);
    });
    return out;
  }

  const routes=tryCandidates();
  // "?�드 충돌(관?? ??방향 ?�치 ??꺾임 ????짧�? ?�세그먼????거리" 기�? 최선 경로 ?�택
  let best=null, bestS=null;
  routes.forEach(r=>{
    const s=routeScore(r);
    if(!best || betterScore(s,bestS)){ best=r; bestS=s; }
  });
  return best||[[sx,sy],[ex,ey]];
}

// pts 배열 ??SVG path string
function ptsToPath(pts){
  if(!pts||!pts.length) return '';
  let d=`M${pts[0][0]},${pts[0][1]}`;
  for(let i=1;i<pts.length;i++) d+=` L${pts[i][0]},${pts[i][1]}`;
  return d;
}

function clonePts(pts){
  return (pts||[]).map(p=>[p[0],p[1]]);
}
function near(a,b,eps=0.6){
  return Math.abs(a-b)<=eps;
}
function compactPts(pts,eps=0.6){
  const out=[];
  (pts||[]).forEach(p=>{
    if(!out.length || !near(out[out.length-1][0],p[0],eps) || !near(out[out.length-1][1],p[1],eps)){
      out.push([p[0],p[1]]);
    }
  });
  return out;
}
function removeCollinearPts(pts,eps=0.6){
  if(!pts||pts.length<=2) return pts||[];
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){
    const a=out[out.length-1], b=pts[i], c=pts[i+1];
    const abH=near(a[1],b[1],eps), abV=near(a[0],b[0],eps);
    const bcH=near(b[1],c[1],eps), bcV=near(b[0],c[0],eps);
    if((abH&&bcH)||(abV&&bcV)) continue;
    out.push(b);
  }
  out.push(pts[pts.length-1]);
  return out;
}
function buildFallbackStepPts(e, from, to){
  const fromH=e ? (e.fromA==='r'||e.fromA==='l') : (Math.abs(to.x-from.x)>=Math.abs(to.y-from.y));
  if(fromH){
    const mx=(from.x+to.x)/2;
    return [[from.x,from.y],[mx,from.y],[mx,to.y],[to.x,to.y]];
  }
  const my=(from.y+to.y)/2;
  return [[from.x,from.y],[from.x,my],[to.x,my],[to.x,to.y]];
}
function enforceStepBendLimit(pts, from, to, edge){
  const maxPts = MAX_STEP_BENDS + 2;
  let out = compactPts(pts||[]);
  if(out.length <= maxPts) return out;
  if(edge){
    const [sdx,sdy]=anchorDir(edge.fromA);
    const [edx,edy]=anchorDir(edge.toA);
    const routed = orthoRoute(from.x,from.y,sdx,sdy,to.x,to.y,edx,edy,[edge.from,edge.to]);
    if(routed && routed.length) out = compactPts(routed);
  }
  if(out.length > maxPts){
    out = compactPts(buildFallbackStepPts(edge, from, to));
  }
  return removeCollinearPts(out);
}
// 꺾�????�동 경로�?직각 기반?�로 ?�동 보정:
// 1) ?�작/???�커 고정 2) 거의 직교??구간 ?�냅 3) ?��?구간 L?�로 분해 4) 중복/?�직?????�리
function normalizeStepManualPts(rawPts, from, to, preferAxis, edge){
  let pts=clonePts(rawPts);
  if(!pts.length) pts=[[from.x,from.y],[to.x,to.y]];
  pts[0]=[from.x,from.y];
  pts[pts.length-1]=[to.x,to.y];
  pts=compactPts(pts);
  const ortho=[pts[0]];
  for(let i=1;i<pts.length;i++){
    const prev=ortho[ortho.length-1];
    let cur=[pts[i][0],pts[i][1]];
    if(Math.abs(cur[0]-prev[0])<=8) cur[0]=prev[0];
    if(Math.abs(cur[1]-prev[1])<=8) cur[1]=prev[1];
    if(!near(cur[0],prev[0],0.6) && !near(cur[1],prev[1],0.6)){
      let via;
      if(preferAxis==='h') via=[cur[0],prev[1]];
      else if(preferAxis==='v') via=[prev[0],cur[1]];
      else{
        const prev2=ortho.length>1?ortho[ortho.length-2]:null;
        if(prev2){
          const prevH=near(prev2[1],prev[1],0.6);
          via=prevH?[prev[0],cur[1]]:[cur[0],prev[1]];
        }else{
          via=Math.abs(cur[0]-prev[0])>=Math.abs(cur[1]-prev[1])?[cur[0],prev[1]]:[prev[0],cur[1]];
        }
      }
      if(!near(via[0],prev[0],0.6)||!near(via[1],prev[1],0.6)) ortho.push(via);
    }
    if(!near(cur[0],ortho[ortho.length-1][0],0.6)||!near(cur[1],ortho[ortho.length-1][1],0.6)) ortho.push(cur);
  }
  pts=removeCollinearPts(compactPts(ortho));
  if(pts.length<2) pts=[[from.x,from.y],[to.x,to.y]];
  pts=enforceStepBendLimit(pts, from, to, edge);
  pts[0]=[from.x,from.y];
  pts[pts.length-1]=[to.x,to.y];
  return pts;
}
function autoCorrectStepEdgesForNodes(nodeIds){
  const eids=collectEdgeIdsForNodes(nodeIds||[]);
  eids.forEach(eid=>{
    const e=edges[eid];
    if(!e) return;
    const ls=e.lineStyle||globalLineStyle;
    if(ls!=='step') return;
    if(e.manualPts&&e.manualPts.length>=2){
      const from=anchorW(e.from,e.fromA);
      const to=anchorW(e.to,e.toA);
      const mp=normalizeStepManualPts(e.manualPts,from,to,undefined,e);
      // ?�동 경로가 ?�른 ?�형??관?�하�??�동 ?�우?�으�?복�?
      if(polyHits(mp,[e.from,e.to],4)) delete e.manualPts;
      else e.manualPts=mp;
    }
  });
  return eids;
}

function getCP(e,from,to){
  const ls=e.lineStyle||globalLineStyle;
  const hasCPOverride=!!(e.cp1dx||e.cp1dy||e.cp2dx||e.cp2dy);
  const skipIds=[e.from,e.to];
  const fromNode=nodes[e.from];
  const toNode=nodes[e.to];

  // ?�?�?� STEP: 직각 ?�회 ?�우???�?�?�
  if(ls==='step'){
    // ?�선?�위 1: ?�용?��? ?�그먼트 ?�래그로 직접 조절??경로
    if(e.manualPts && e.manualPts.length >= 2){
      const mp = normalizeStepManualPts(e.manualPts, from, to, undefined, e);
      if(polyHits(mp, skipIds, 4)){
        delete e.manualPts;
      }else{
        e.manualPts = mp;
        const p1 = mp[1] || [from.x, from.y];
        const p2 = mp[mp.length-2] || [to.x, to.y];
        return{cp1:{x:p1[0],y:p1[1]},
               cp2:{x:p2[0],y:p2[1]},
               pts:mp};
      }
    }
    // ?�선?�위 2: orthoRoute ?�동 ?�우??
    const[sdx,sdy]=anchorDir(e.fromA);
    const[edx,edy]=anchorDir(e.toA);
    const pts=orthoRoute(from.x,from.y,sdx,sdy,to.x,to.y,edx,edy,skipIds);
    return{cp1:{x:pts[1]?.[0]??from.x,y:pts[1]?.[1]??from.y},
           cp2:{x:pts[pts.length-2]?.[0]??to.x,y:pts[pts.length-2]?.[1]??to.y},
           pts};
  }

  // ?�?�?� STRAIGHT ?�?�?�
  if(ls==='straight'){
    return{cp1:{x:(from.x+to.x)/2,y:(from.y+to.y)/2},
           cp2:{x:(from.x+to.x)/2,y:(from.y+to.y)/2},pts:null};
  }

  // ?�?�?� CURVE: ?�커 방향 + ?�애�??�회 베�????�?�?�
  const dx=Math.abs(to.x-from.x),dy=Math.abs(to.y-from.y);
  const fromBB=fromNode?nodeBB(fromNode):null;
  const toBB=toNode?nodeBB(toNode):null;
  function minExit(anchor,bb){
    if(!bb) return 40;
    if(anchor==='t'||anchor==='b') return(bb.y1-bb.y0)/2+30;
    return(bb.x1-bb.x0)/2+30;
  }
  const base1=Math.min(Math.max(minExit(e.fromA,fromBB),Math.max(dx,dy)*0.4),220);
  const base2=Math.min(Math.max(minExit(e.toA,toBB),Math.max(dx,dy)*0.4),220);
  let cx1=from.x,cy1=from.y,cx2=to.x,cy2=to.y;
  if(e.fromA==='t') cy1-=base1; else if(e.fromA==='b') cy1+=base1;
  else if(e.fromA==='l') cx1-=base1; else cx1+=base1;
  if(e.toA==='t') cy2-=base2; else if(e.toA==='b') cy2+=base2;
  else if(e.toA==='r') cx2+=base2; else cx2-=base2;
  if(hasCPOverride){
    return{cp1:{x:cx1+(e.cp1dx||0),y:cy1+(e.cp1dy||0)},
           cp2:{x:cx2+(e.cp2dx||0),y:cy2+(e.cp2dy||0)},pts:null};
  }
  let hits=bezierHitsObstacle(from.x,from.y,cx1,cy1,cx2,cy2,to.x,to.y,skipIds,22);
  if(hits){
    const verticalCase=fromNode&&toNode&&nodesOverlapX(fromNode,toNode)&&
      (e.fromA==='b'||e.fromA==='t')&&(e.toA==='t'||e.toA==='b');
    if(verticalCase){
      const allLeft=Math.min(fromNode.x,toNode.x);
      const allRight=Math.max(fromNode.x+nW(fromNode),toNode.x+nW(toNode));
      const sideGap=Math.max(dx*0.5+80,100);
      cx1=allRight+sideGap;cy1=from.y;cx2=allRight+sideGap;cy2=to.y;
      hits=bezierHitsObstacle(from.x,from.y,cx1,cy1,cx2,cy2,to.x,to.y,skipIds,22);
      if(hits){cx1=allLeft-sideGap;cy1=from.y;cx2=allLeft-sideGap;cy2=to.y;}
    } else {
      const EX=Math.max(base1,base2,Math.max(dx,dy)*0.8+80);
      cx1=from.x;cy1=from.y;cx2=to.x;cy2=to.y;
      if(e.fromA==='t') cy1-=EX; else if(e.fromA==='b') cy1+=EX;
      else if(e.fromA==='l') cx1-=EX; else cx1+=EX;
      if(e.toA==='t') cy2-=EX; else if(e.toA==='b') cy2+=EX;
      else if(e.toA==='r') cx2+=EX; else cx2-=EX;
    }
  }
  return{cp1:{x:cx1+(e.cp1dx||0),y:cy1+(e.cp1dy||0)},
         cp2:{x:cx2+(e.cp2dx||0),y:cy2+(e.cp2dy||0)},pts:null};
}




// ?�?� 커스?� ?�상 마커 ?�적 ?�성 ?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�?�
// SVG <marker>??stroke�??�속?��? ?�으므�??�상별로 defs??마커�??�성?�야 ??
// id = "marker-ec-{eid}" ?�태�?관�? ?��? 존재?�면 ?�상�?갱신.
function ensureMarker(eid, color){
  const svgDefs = msvg.querySelector('defs');
  const mid = 'marker-ec-' + eid;
  let marker = document.getElementById(mid);
  if(!marker){
    marker = document.createElementNS(NS, 'marker');
    marker.id = mid;
    marker.setAttribute('markerWidth','8');
    marker.setAttribute('markerHeight','6');
    marker.setAttribute('refX','7');
    marker.setAttribute('refY','3');
    marker.setAttribute('orient','auto');
    const poly = document.createElementNS(NS,'polygon');
    poly.setAttribute('points','0 0,8 3,0 6');
    marker.appendChild(poly);
    svgDefs.appendChild(marker);
  }
  marker.querySelector('polygon').setAttribute('fill', color);
  return mid;
}
// 커스?� 마커 ?�거 (?��? ??�� ??defs ?�리)
function removeMarker(eid){
  document.getElementById('marker-ec-'+eid)?.remove();
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// RENDER EDGE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  const {cp1,cp2,pts}=result;
  const g=mk('g'); g.id='eg-'+id; g.classList.add('eg');

  // step 모드: pts가 ?�으�???�� ?�그먼트 ?�들 방식 ?�용 (manualPts / orthoRoute 모두)
  const hasAutoRoute = ls==='step' && pts && pts.length > 0;

  let pathD;
  if(ls === 'straight') {
    pathD = `M${from.x},${from.y} L${to.x},${to.y}`;
  } else if(hasAutoRoute) {
    // 직각 ?�회 ?�리?�인 (?�동 ?�는 ?�동 ?�그먼트 조절 pts 모두)
    pathD = ptsToPath(pts);
  } else if(ls === 'step') {
    pathD = `M${from.x},${from.y} L${cp1.x},${cp1.y} L${cp2.x},${cp2.y} L${to.x},${to.y}`;
  } else {
    pathD = `M${from.x},${from.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;
  }

  const hit=mk('path'); hit.classList.add('ehit'); hit.setAttribute('d',pathD); g.appendChild(hit);
  const ep=mk('path'); ep.classList.add('ep'); ep.id='ep-'+id; ep.setAttribute('d',pathD);
  // UML 관�?마커 ?�용 (class diagram)
  const rel = e.relation || '';
  if(rel === 'inherit'){
    ep.style.markerEnd = 'url(#uml-inherit)';
    ep.style.markerStart = '';
  } else if(rel === 'implement'){
    ep.style.markerEnd = 'url(#uml-inherit)';
    ep.style.strokeDasharray = '6 4';
    ep.style.markerStart = '';
  } else if(rel === 'aggregate'){
    ep.style.markerStart = 'url(#uml-aggregate)';
    ep.style.markerEnd = '';
  } else if(rel === 'compose'){
    ep.style.markerStart = 'url(#uml-compose)';
    ep.style.markerEnd = '';
  } else if(rel === 'depend'){
    ep.style.strokeDasharray = '6 4';
  }
  // 커스?� ?�상: ???�상 + ?�살??마커�??�일 ?�으�??�기??
  if(e.color){
    ep.classList.add('ec');           // CSS sel override 방�?
    ep.style.stroke = e.color;
    if(!rel){
      const mid = ensureMarker(id, e.color);
      ep.style.markerEnd = `url(#${mid})`;
    }
  }
  g.appendChild(ep);

  // CP ?�들: 곡선/꺾�???모두 ?�일?�게 ?�시 (꺾�??��? �?마�?�??��? ?�인???�용)
  if(ls !== 'straight') {
    let hp1x=cp1.x,hp1y=cp1.y,hp2x=cp2.x,hp2y=cp2.y;
    if(ls==='step' && hasAutoRoute){
      const p1=pts[1]||[from.x,from.y];
      const p2=pts[pts.length-2]||[to.x,to.y];
      hp1x=p1[0]; hp1y=p1[1];
      hp2x=p2[0]; hp2y=p2[1];
    }
    const l1=mk('line'); l1.classList.add('cpl');
    l1.setAttribute('x1',from.x);l1.setAttribute('y1',from.y);l1.setAttribute('x2',hp1x);l1.setAttribute('y2',hp1y);g.appendChild(l1);
    const l2=mk('line'); l2.classList.add('cpl');
    l2.setAttribute('x1',to.x);l2.setAttribute('y1',to.y);l2.setAttribute('x2',hp2x);l2.setAttribute('y2',hp2y);g.appendChild(l2);

    const h1=mk('circle'); h1.classList.add('cph'); h1.id='cph1-'+id;
    h1.setAttribute('cx',hp1x);h1.setAttribute('cy',hp1y);h1.setAttribute('r',6);
    h1.dataset.cpIdx='1';h1.dataset.eid=id; g.appendChild(h1);
    const h2=mk('circle'); h2.classList.add('cph'); h2.id='cph2-'+id;
    h2.setAttribute('cx',hp2x);h2.setAttribute('cy',hp2y);h2.setAttribute('r',6);
    h2.dataset.cpIdx='2';h2.dataset.eid=id; g.appendChild(h2);

    [h1,h2].forEach(h=>{
      h.addEventListener('mousedown',ev=>{
        ev.stopPropagation();ev.preventDefault();
        selItem('edge:'+id);
        const wp=spt(ev.clientX,ev.clientY);
        const edgeNow=edges[id]||{};
        drag={
          type:'cp',
          eid:id,
          cpIdx:parseInt(h.dataset.cpIdx),
          startX:wp.x,
          startY:wp.y,
          orig:{
            cp1dx:edgeNow.cp1dx||0,cp1dy:edgeNow.cp1dy||0,
            cp2dx:edgeNow.cp2dx||0,cp2dy:edgeNow.cp2dy||0
          },
          origPts: edgeNow.manualPts ? clonePts(edgeNow.manualPts) : (ls==='step' ? clonePts(pts) : null)
        };
      });
    });
  }

  // 꺾�???step) pts ?�우?? �??�그먼트 중간???�래�??�들 배치
  if(hasAutoRoute && pts && pts.length >= 2){
    for(let i = 0; i < pts.length - 1; i++){
      const [ax,ay] = pts[i], [bx,by] = pts[i+1];
      const isH = Math.abs(ay - by) < 0.5;
      const isV = Math.abs(ax - bx) < 0.5;
      if(!isH && !isV) continue;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const segLen = isH ? Math.abs(bx - ax) : Math.abs(by - ay);
      // ?�들 ?�기: ?�그먼트 길이 기반?��?�??�작?�져??최소 8px 보장
      const hw = isH ? Math.max(8, Math.min(segLen * 0.45, 26)) : 5;
      const hh = isH ? 5 : Math.max(8, Math.min(segLen * 0.45, 26));
      const sh = mk('rect');
      sh.classList.add('sgh', isH ? 'sgh-h' : 'sgh-v');
      sh.setAttribute('x', mx - hw); sh.setAttribute('y', my - hh);
      sh.setAttribute('width', hw * 2); sh.setAttribute('height', hh * 2);
      sh.setAttribute('rx', 3);
      sh.dataset.eid = id;
      sh.dataset.segIdx = String(i);
      g.appendChild(sh);
      sh.addEventListener('mousedown', ev => {
        ev.stopPropagation(); ev.preventDefault();
        selItem('edge:'+id);
        const wp = spt(ev.clientX, ev.clientY);
        drag = {
          type: 'seg',
          eid: id,
          segIdx: i,
          isH,
          origPts: JSON.parse(JSON.stringify(pts)),
          startW: isH ? wp.y : wp.x,
        };
      });
    }
  }

  // ?�점 ?�연�??�들: ?�살???�착?? ?�래그로 ?�른 ?�커???�연�?
  function addReconnectHandle(cx,cy,end,vr,hr){
    const hit=mk('circle'); hit.classList.add('eah-hit');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', hr);
    hit.dataset.eid=id; hit.dataset.end=end;
    g.appendChild(hit);

    const vis=mk('circle'); vis.classList.add('eah');
    vis.setAttribute('cx', cx); vis.setAttribute('cy', cy); vis.setAttribute('r', vr);
    vis.dataset.eid=id; vis.dataset.end=end;
    g.appendChild(vis);

    [hit,vis].forEach(h=>{
      h.addEventListener('mousedown',ev=>{
        ev.stopPropagation(); ev.preventDefault();
        selItem('edge:'+id);
        startReconnect(id, end);
      });
    });
  }
  addReconnectHandle(from.x, from.y, 'from', 5.8, 13);
  addReconnectHandle(to.x, to.y, 'to', 6.4, 14);

  // Draw a label for this edge on the separate label layer. Remove any existing label for
  // this edge, compute the midpoint based on the line style, and then build a small
  // card containing the edge name and optional label. Colour code common "Yes"/"No"
  // keywords to aid quick understanding.
  document.getElementById('lbl-'+id)?.remove();
  if(e.label || e.name){
    let bx, by;
    if(ls === 'straight') {
      bx = (from.x + to.x) / 2;
      by = (from.y + to.y) / 2;
    } else if(hasAutoRoute) {
      const mid = Math.floor(pts.length / 2);
      bx = (pts[mid-1][0] + pts[mid][0]) / 2;
      by = (pts[mid-1][1] + pts[mid][1]) / 2;
    } else if(ls === 'step') {
      bx = (cp1.x + cp2.x) / 2;
      by = (cp1.y + cp2.y) / 2;
    } else {
      const t = 0.5;
      bx = bpt(from.x, cp1.x, cp2.x, to.x, t);
      by = bpt(from.y, cp1.y, cp2.y, to.y, t);
    }

    const lines = [];
    // Determine a text colour: if the user specified a custom text colour for the edge, use that for all lines
    // Otherwise, colour-code common "Yes"/"No" labels and use theme defaults
    const customTxt = e.txtColor || null;
    if(e.name) lines.push({ txt: e.name, col: customTxt || 'var(--tx)', sz: 10, fw: '600' });
    if(e.label) {
      const raw = e.label.trim();
      let col;
      if(customTxt){
        col = customTxt;
      } else {
        col = 'var(--tx2)';
        const low = raw.toLowerCase();
        if(/yes|???�공/.test(low)) col = '#10b981';
        else if(/no|?�니|???�패/.test(low)) col = '#ef4444';
      }
      lines.push({ txt: e.label, col, sz: 9.5, fw: '400' });
    }
    const lh = 14;
    const maxW = Math.max(28, ...lines.map(l => l.txt.length * 6.2 + 14));
    const th = lines.length * lh + 5;
    const lg = mk('g');
    lg.id = 'lbl-' + id;
    lg.setAttribute('pointer-events', 'none');
    const bg = mk('rect');
    bg.classList.add('elb');
    bg.setAttribute('x', bx - maxW / 2);
    bg.setAttribute('y', by - th / 2);
    bg.setAttribute('width', maxW);
    bg.setAttribute('height', th);
    bg.setAttribute('rx', 4);
    lg.appendChild(bg);
    lines.forEach((l, i) => {
      const lt = mk('text');
      lt.classList.add('elt');
      lt.setAttribute('x', bx);
      lt.setAttribute('y', by - (lines.length - 1) * lh / 2 + i * lh + 1);
      lt.style.fill = l.col;
      lt.style.fontSize = l.sz + 'px';
      lt.style.fontWeight = l.fw;
      lt.textContent = l.txt.length > 25 ? l.txt.slice(0, 24) + '?? : l.txt;
      lg.appendChild(lt);
    });
    LBL.appendChild(lg);
  }

  g.addEventListener('click',ev=>{ev.stopPropagation();selItem('edge:'+id);});
  EL.appendChild(g);
}


// ?�?� ?��? DOM ?�전 ?�거: ??그룹(eg-) + ?�벨 그룹(lbl-) ?�시 ??��
function removeEdgeDOM(eid){
  document.getElementById('eg-'+eid)?.remove();
  document.getElementById('lbl-'+eid)?.remove();
  // 커스?� ?�상 마커가 ?�으�?defs?�서 ?�거 (메모�??�수 방�?)
  removeMarker(eid);
}
function bpt(p0,p1,p2,p3,t){const m=1-t;return m*m*m*p0+3*m*m*t*p1+3*m*t*t*p2+t*t*t*p3;}
function redrawEdges(){for(const eid in edges) renderEdge(eid);}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// CREATE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function createNode(type,x,y,id,label,props,sw,sh){
  if(!S[type]) return null;
  const nid=id||'n'+(++nc);
  nodes[nid]={id:nid,type,label:label!=null?label:S[type].label||type,x,y,properties:props||{}};
  if(sw) nodes[nid].sw=sw;
  if(sh) nodes[nid].sh=sh;
  renderNode(nid); updateStatus(); return nid;
}
function createEdge(from,to,fromA,toA,id,label,name,cp1dx,cp1dy,cp2dx,cp2dy){
  if(from===to) return null;
  const eid=id||'e'+(++ec);
  edges[eid]={id:eid,from,to,fromA:fromA||'r',toA:toA||'l',label:label||'',name:name||'',
              cp1dx:cp1dx||0,cp1dy:cp1dy||0,cp2dx:cp2dx||0,cp2dy:cp2dy||0};
  renderEdge(eid); updateStatus(); return eid;
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// AUTO LAYOUT (dir: 'v' or 'h')
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function chooseAutoAnchorsForEdge(e, dir){
  const fromN=nodes[e.from], toN=nodes[e.to];
  if(!fromN || !toN) return;
  const fx=fromN.x+nW(fromN)/2, fy=fromN.y+nH(fromN)/2;
  const tx=toN.x+nW(toN)/2, ty=toN.y+nH(toN)/2;
  const dx=tx-fx, dy=ty-fy;

  if(dir==='h'){
    if(Math.abs(dy) > Math.abs(dx)*1.15){
      e.fromA = dy>=0 ? 'b' : 't';
      e.toA   = dy>=0 ? 't' : 'b';
    }else{
      e.fromA = dx>=0 ? 'r' : 'l';
      e.toA   = dx>=0 ? 'l' : 'r';
    }
  }else{
    if(Math.abs(dx) > Math.abs(dy)*1.15){
      e.fromA = dx>=0 ? 'r' : 'l';
      e.toA   = dx>=0 ? 'l' : 'r';
    }else{
      e.fromA = dy>=0 ? 'b' : 't';
      e.toA   = dy>=0 ? 't' : 'b';
    }
  }
}
function autoLayout(dir = 'v') {
  const nids = Object.keys(nodes); if (!nids.length) return;
  const out = {}, inc = {};
  nids.forEach(id => { out[id] = []; inc[id] = []; });
  Object.values(edges).forEach(e => { out[e.from]?.push(e.to); inc[e.to]?.push(e.from); });
  const layer = {};
  const seeds = nids.filter(id => !inc[id].length);
  const q = seeds.length ? [...seeds] : [nids[0]];
  q.forEach(id => layer[id] = 0);
  
  for (let h = 0; h < q.length; h++) {
    const cur = q[h];
    out[cur].forEach(nx => { if (layer[nx] == null) { layer[nx] = (layer[cur] || 0) + 1; q.push(nx); } });
  }
  nids.forEach(id => { if (layer[id] == null) layer[id] = 0; });
  
  const byL = {};
  nids.forEach(id => { const l = layer[id]; if (!byL[l]) byL[l] = []; byL[l].push(id); });
  const maxL = Math.max(...Object.values(layer));

  for (let l = 0; l <= maxL; l++) {
    const layerNodes = byL[l] || [];
    layerNodes.sort((a,b)=>{
      const srcA = inc[a] || [];
      const srcB = inc[b] || [];
      const axis = dir==='v' ? 'x' : 'y';
      const aVal = srcA.length
        ? srcA.reduce((s,id)=>s+(nodes[id][axis] + (dir==='v' ? nW(nodes[id])/2 : nH(nodes[id])/2)),0)/srcA.length
        : (nodes[a][axis] + (dir==='v' ? nW(nodes[a])/2 : nH(nodes[a])/2));
      const bVal = srcB.length
        ? srcB.reduce((s,id)=>s+(nodes[id][axis] + (dir==='v' ? nW(nodes[id])/2 : nH(nodes[id])/2)),0)/srcB.length
        : (nodes[b][axis] + (dir==='v' ? nW(nodes[b])/2 : nH(nodes[b])/2));
      return aVal-bVal;
    });
    const totalItems = layerNodes.length;
    layerNodes.forEach((id, i) => {
      if (dir === 'v') {
        const totalW = totalItems * 200;
        const startX = 300 + (maxL * 50) - totalW / 2;
        nodes[id].x = Math.round(startX + i * 200);
        nodes[id].y = Math.round(80 + l * 130);
      } else {
        const totalH = totalItems * 100;
        const startY = 200 + (maxL * 50) - totalH / 2;
        nodes[id].x = Math.round(80 + l * 220);
        nodes[id].y = Math.round(startY + i * 100);
      }
      document.getElementById('ng-' + id)?.setAttribute('transform', `translate(${nodes[id].x},${nodes[id].y})`);
    });
  }
  
  // ?�이?�웃 ????꼬임??줄이�??�해 ?�커 ?�선??+ ?�동 경로 초기??
  Object.values(edges).forEach(e => {
    e.cp1dx = 0; e.cp1dy = 0; e.cp2dx = 0; e.cp2dy = 0;
    delete e.manualPts;
    chooseAutoAnchorsForEdge(e, dir);
  });
  
  redrawEdges(); fitAll();
  saveState(dir === 'v' ? '?�로 방향 ?�동 ?�렬' : '가�?방향 ?�동 ?�렬');
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// SELECTION
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function selItem(id){
  document.querySelectorAll('.ng.sel').forEach(el=>el.classList.remove('sel'));
  document.querySelectorAll('.eg.sel,.ep.hl').forEach(el=>el.classList.remove('sel','hl'));
  selId=id;
  if(id&&!id.startsWith('edge:')){
    document.getElementById('ng-'+id)?.classList.add('sel');
    const n=nodes[id]; document.getElementById('sts').textContent=`[${n.type}] ${n.label}`;
  } else if(id&&id.startsWith('edge:')){
    const eid=id.slice(5);
    document.getElementById('eg-'+eid)?.classList.add('sel');
    document.getElementById('ep-'+eid)?.classList.add('hl');
    const e=edges[eid]; document.getElementById('sts').textContent=e?`?�결: ${e.from}??{e.to}`:'??;
  } else {
    document.getElementById('sts').textContent='??;
  }
  updateInspector();
}
function clearSel(){
  selSet.clear();
  document.querySelectorAll('.ng.msel').forEach(el=>el.classList.remove('msel'));
  selItem(null);
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// VIEWPORT
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// 그리???�냅 ?�퍼: gridSnap=true????20px 격자�?반올�?
function snapG(v, sz=20){ return gridSnap ? Math.round(v/sz)*sz : v; }

function toggleGrid(){
  gridSnap=!gridSnap;
  const btn=document.getElementById('grid-btn');
  if(btn){
    btn.style.color      = gridSnap ? 'var(--ac)'  : '';
    btn.style.borderColor= gridSnap ? 'var(--ac)'  : '';
    btn.style.background = gridSnap ? 'var(--acd)' : '';
    btn.setAttribute('data-tip-sub', gridSnap ? '그리???�냅 켜짐 (20px)' : '?�드�?20px 격자??맞춰 ?�동');
  }
  // 그리??배경 강조???��?
  cvs.style.backgroundImage = gridSnap
    ? `linear-gradient(var(--bgdot-major) 1.5px, transparent 1.5px),
       linear-gradient(90deg, var(--bgdot-major) 1.5px, transparent 1.5px),
       linear-gradient(var(--bgdot) 1px, transparent 1px),
       linear-gradient(90deg, var(--bgdot) 1px, transparent 1px)`
    : `linear-gradient(var(--bgdot-major) 1px, transparent 1px),
       linear-gradient(90deg, var(--bgdot-major) 1px, transparent 1px),
       linear-gradient(var(--bgdot) 1px, transparent 1px),
       linear-gradient(90deg, var(--bgdot) 1px, transparent 1px)`;
}

function applyVP(){
  VP.setAttribute('transform',`translate(${vx},${vy}) scale(${vs})`);
  document.getElementById('zv').textContent=Math.round(vs*100)+'%';
  
  // ?�면 ?�동(Pan) �?�?Zoom)??맞춰 배경 격자(Grid) ?�치 ?�기??
  const s20 = 20 * vs, s100 = 100 * vs;
  cvs.style.backgroundSize = `${s100}px ${s100}px, ${s100}px ${s100}px, ${s20}px ${s20}px, ${s20}px ${s20}px`;
  cvs.style.backgroundPosition = `${vx-1}px ${vy-1}px, ${vx-1}px ${vy-1}px, ${vx-1}px ${vy-1}px, ${vx-1}px ${vy-1}px`;
}

// Smooth panning animation used for keyboard and programmatic viewport moves. This function
// changes the global vx/vy over a handful of frames for a smoother feel instead of an
// instantaneous jump. Positive dx shifts the view to the right (content to the left),
// positive dy shifts the view downward.
function smoothPan(dx, dy) {
  const steps = 6;
  const startX = vx;
  const startY = vy;
  let i = 0;
  function step() {
    i++;
    vx = startX + dx * (i / steps);
    vy = startY + dy * (i / steps);
    applyVP();
    if(i < steps) requestAnimationFrame(step);
  }
  step();
}
function spt(cx,cy){const r=msvg.getBoundingClientRect();return{x:(cx-r.left-vx)/vs,y:(cy-r.top-vy)/vs};}
function zBy(d){vs=Math.min(3,Math.max(.1,vs+d));applyVP();}
function resetV(){vx=80;vy=60;vs=1;applyVP();}
function fitAll(){
  if(!nc){resetV();return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const id in nodes){const n=nodes[id];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+nW(n));y1=Math.max(y1,n.y+nH(n));}
  const r=msvg.getBoundingClientRect();
  const pw=r.width>0?r.width-40:800, ph=r.height>0?r.height-40:600;
  const fw=x1-x0+80,fh=y1-y0+80;
  vs=Math.min(3,Math.max(.1,Math.min(pw/fw,ph/fh)));
  vx=(pw-fw*vs)/2-x0*vs+40; vy=(ph-fh*vs)/2-y0*vs+20; applyVP();
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// MOUSE & EVENTS
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
let sbStart=null;

// 좌클�??�래�?Pan)�?부?�럽�??�기 ?�해 cvs ?�소???�벤??부�?
cvs.addEventListener('mousedown',e=>{
  // 중클�?1) / ?�클�?2) ???�닝
  if((e.button === 1 || e.button === 2) && (e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL')){
    clearSel();
    drag = { type:'pan', sx: e.clientX - vx, sy: e.clientY - vy };
    cvs.classList.add('cg');
    e.preventDefault();
    return;
  }

  // UI 버튼�??�릭??무시
  if(e.target.closest('button') || e.target.closest('input')) return;
  // 캔버??바탕 좌클�?
  if(e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL'){
    // ?�결 모드 �?�?�??�릭 ??취소
    if(connecting){ cancelConnect(); return; }
    if(reconnecting){ cancelReconnect(); return; }
    // 좌클�??�래�?????�� 박스 ?�택 (Shift 불필??
    if(e.button === 0){
      const cvsR = cvs.getBoundingClientRect();
      const sx = e.clientX - cvsR.left;
      const sy = e.clientY - cvsR.top;
      sbStart={x:sx, y:sy};
      drag={type:'selbox', sx, sy, cx:e.clientX, cy:e.clientY, moved:false};
      selboxDiv.style.left   = sx+'px';
      selboxDiv.style.top    = sy+'px';
      selboxDiv.style.width  = '0px';
      selboxDiv.style.height = '0px';
    }
  }
});

// Click-to-connect 취소 로직 (�?공간 ?�릭 or ESC)
cvs.addEventListener('click', e => {
  if (connecting && (e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL')) {
    cancelConnect();
  }
  if (reconnecting && (e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL')) {
    cancelReconnect();
  }
});

window.addEventListener('mousemove',e=>{
  if(!drag && !connecting && !reconnecting){
    const p=spt(e.clientX,e.clientY);
    document.getElementById('stxy').textContent=`x:${Math.round(p.x)} y:${Math.round(p.y)}`;
    return;
  }
  
  if(drag && drag.type !== 'selbox') drag.moved = true; // ?�래�??�직임 감�?

  // 마우??커서 ?�치까�? ?�시간으�??�을 그리�?(?�결 ?�성 / ?�연�?공통)
  if(connecting || reconnecting) {
    const p = spt(e.clientX, e.clientY);
    let fixedId, fixedA, lineStyle;
    if(connecting){
      fixedId = connecting.fromId;
      fixedA = connecting.fromA;
      lineStyle = globalLineStyle;
    }else{
      const re = edges[reconnecting.eid];
      if(!re){ cancelReconnect(); return; }
      fixedId = reconnecting.fixedId;
      fixedA = reconnecting.fixedA;
      lineStyle = re.lineStyle || globalLineStyle;
    }
    const from = anchorW(fixedId, fixedA);

    // ?��??�드 ?�이?�이??+ 가??가까운 ?�커 ?�냅 미리보기
    document.querySelectorAll('.ng.connect-target').forEach(el=>el.classList.remove('connect-target'));
    let snapPt = p; // ?�냅 ?�으�?커서 ?�치 그�?�?
    const drop = findDropAnchorAt(e.clientX, e.clientY, fixedId);
    if(drop && nodes[drop.toId]){
      document.getElementById('ng-'+drop.toId)?.classList.add('connect-target');
      snapPt = anchorW(drop.toId, drop.toA);
    }

    let newD = '';
    const tp = snapPt;
    if (lineStyle === 'straight') {
      newD = `M${from.x},${from.y} L${tp.x},${tp.y}`;
    } else if (lineStyle === 'step') {
      if(drop && nodes[drop.toId]){
        const [sdx,sdy]=anchorDir(fixedA);
        const [edx,edy]=anchorDir(drop.toA);
        const pts=orthoRoute(from.x,from.y,sdx,sdy,tp.x,tp.y,edx,edy,[fixedId,drop.toId]);
        newD = ptsToPath(pts);
      } else {
        const isFromH = (fixedA === 'r' || fixedA === 'l');
        if (isFromH) {
          newD = `M${from.x},${from.y} L${tp.x},${from.y} L${tp.x},${tp.y}`;
        } else {
          newD = `M${from.x},${from.y} L${from.x},${tp.y} L${tp.x},${tp.y}`;
        }
      }
    } else {
      // 곡선 미리보기: 출발 ?�커 방향 반영
      const dx=Math.abs(tp.x-from.x), dy=Math.abs(tp.y-from.y);
      const base=Math.min(Math.max(Math.max(dx,dy)*0.5,50),180);
      let cx1=from.x, cy1=from.y;
      if(fixedA==='t') cy1-=base; else if(fixedA==='b') cy1+=base;
      else if(fixedA==='l') cx1-=base; else cx1+=base;
      newD = `M${from.x},${from.y} C${cx1},${cy1} ${tp.x},${tp.y} ${tp.x},${tp.y}`;
    }
    tl.setAttribute('d', newD);
  }

  if(!drag) return;

  if(drag.type==='pan'){vx=e.clientX-drag.sx;vy=e.clientY-drag.sy;applyVP();}
  else if(drag.type==='node'){
    const p=spt(e.clientX,e.clientY);
    let leadX=p.x-drag.ox, leadY=p.y-drag.oy;
    if(gridSnap){ leadX=snapG(leadX); leadY=snapG(leadY); }
    if(!e.altKey){
      const snapPos=applyNodeAlignSnap(leadX, leadY, drag);
      leadX=snapPos.x; leadY=snapPos.y;
    }

    if(drag.multiOrig&&selSet.size>1){
      const dx=leadX-(drag.leadStartX??nodes[drag.id].x);
      const dy=leadY-(drag.leadStartY??nodes[drag.id].y);
      drag.multiOrig.forEach(o=>{
        // ?�중 ?�동?� ?��? 배치�??��??�기 ?�해 리드 ?�드 기�? ?��?�??�일 ?�용
        nodes[o.id].x=o.x+dx; nodes[o.id].y=o.y+dy;
        document.getElementById('ng-'+o.id)?.setAttribute('transform',`translate(${nodes[o.id].x},${nodes[o.id].y})`);
      });
    } else {
      nodes[drag.id].x=leadX; nodes[drag.id].y=leadY;
      document.getElementById('ng-'+drag.id)?.setAttribute('transform',`translate(${nodes[drag.id].x},${nodes[drag.id].y})`);
    }
    if(drag.edgeIds && drag.edgeIds.length) queueEdgeRedraw(drag.edgeIds);
  }
  else if(drag.type==='resize'){
    const p=spt(e.clientX,e.clientY);
    const n=nodes[drag.id], rh=drag.rhId;
    const dx=p.x-drag.startX,dy=p.y-drag.startY;
    let newX=drag.origX,newY=drag.origY,newW=drag.origW,newH=drag.origH;
    if(rh.includes('e')) newW=Math.max(40,drag.origW+dx);
    if(rh.includes('s')) newH=Math.max(16,drag.origH+dy);
    if(rh.includes('w')){newW=Math.max(40,drag.origW-dx);newX=drag.origX+drag.origW-newW;}
    if(rh.includes('n')){newH=Math.max(16,drag.origH-dy);newY=drag.origY+drag.origH-newH;}
    if(gridSnap){
      newX=snapG(newX); newY=snapG(newY);
      newW=Math.max(40,snapG(newW)); newH=Math.max(16,snapG(newH));
    }
    n.x=newX;n.y=newY;n.sw=newW;n.sh=newH;
    renderNode(drag.id);
    document.getElementById('ng-'+drag.id)?.classList.add('sel');
    if(drag.edgeIds && drag.edgeIds.length) queueEdgeRedraw(drag.edgeIds);
  }
  else if(drag.type==='seg'){
    // 꺾�????�그먼트 ?�래�? ?�당 ?�그먼트�??�평/?�직?�로 밀�?
    const pRaw = spt(e.clientX, e.clientY);
    const p = {x:snapG(pRaw.x), y:snapG(pRaw.y)};
    const e2 = edges[drag.eid]; if(!e2) return;
    const delta = (drag.isH ? p.y : p.x) - drag.startW;
    const op = drag.origPts;
    const si = drag.segIdx;
    const newPts = op.map(pt => [...pt]);
    if(drag.isH){
      // ?�평 ?�그먼트 ??Y�??�동
      // ?�그먼트 ???�점 Y ?�동
      newPts[si][1]   = op[si][1]   + delta;
      newPts[si+1][1] = op[si+1][1] + delta;
      // ??�?��??si-1): ?�직?�이므�?X???��?, Y�?맞춤
      if(si > 0)           newPts[si-1][1] = newPts[si][1];
      // ??�?��??si+2): ?�직?�이므�?X???��?, Y�?맞춤
      if(si+2 < op.length) newPts[si+2][1] = newPts[si+1][1];
    } else {
      // ?�직 ?�그먼트 ??X�??�동
      newPts[si][0]   = op[si][0]   + delta;
      newPts[si+1][0] = op[si+1][0] + delta;
      // ??�?��??si-1): ?�평?�이므�?Y???��?, X�?맞춤
      if(si > 0)           newPts[si-1][0] = newPts[si][0];
      // ??�?��??si+2): ?�평?�이므�?Y???��?, X�?맞춤
      if(si+2 < op.length) newPts[si+2][0] = newPts[si+1][0];
    }
    // 첫점/?�점?� ??�� ?�커 좌표�?고정
    const from2 = anchorW(e2.from, e2.fromA);
    const to2   = anchorW(e2.to,   e2.toA);
    newPts[0] = [from2.x, from2.y];
    newPts[newPts.length-1] = [to2.x, to2.y];
    // ?�그먼트 ?�동 ??직각 ?�동 보정 + 불필??꺾임 ?�리
    e2.manualPts = normalizeStepManualPts(newPts, from2, to2, drag.isH ? 'h' : 'v', e2);
    renderEdge(drag.eid);
    document.getElementById('eg-'+drag.eid)?.classList.add('sel');
    document.getElementById('ep-'+drag.eid)?.classList.add('hl');
  }
  else if(drag.type==='cp'){
    const pRaw = spt(e.clientX, e.clientY);
    const p = {x:snapG(pRaw.x), y:snapG(pRaw.y)};
    const e2 = edges[drag.eid]; if(!e2) return;
    const from = anchorW(e2.from, e2.fromA), to = anchorW(e2.to, e2.toA);
    const ls = e2.lineStyle || globalLineStyle;

    if (ls === 'step') {
        let basePts = (drag.origPts && drag.origPts.length>=2)
          ? clonePts(drag.origPts)
          : (e2.manualPts && e2.manualPts.length>=2)
            ? clonePts(e2.manualPts)
            : clonePts(getCP(e2,from,to).pts||[]);
        if(basePts.length<4) basePts=buildFallbackStepPts(e2,from,to);
        const idx=(drag.cpIdx===1)?1:basePts.length-2;
        if(idx>0&&idx<basePts.length-1){
          basePts[idx]=[p.x,p.y];
          e2.manualPts = normalizeStepManualPts(basePts, from, to, undefined, e2);
          renderEdge(drag.eid);
          document.getElementById('eg-'+drag.eid)?.classList.add('sel');
          document.getElementById('ep-'+drag.eid)?.classList.add('hl');
        }
    } else {
        // 곡선??꺾�??�과 ?�일?�게 "?�래�??�작??+ ?��?" 방식?�로 ?�동??반영
        const ddx = p.x - (drag.startX ?? p.x);
        const ddy = p.y - (drag.startY ?? p.y);
        if(drag.cpIdx===1){
          e2.cp1dx=(drag.orig?.cp1dx||0)+ddx;
          e2.cp1dy=(drag.orig?.cp1dy||0)+ddy;
        }else{
          e2.cp2dx=(drag.orig?.cp2dx||0)+ddx;
          e2.cp2dy=(drag.orig?.cp2dy||0)+ddy;
        }

        const {cp1,cp2}=getCP(e2,from,to);
        const newD = `M${from.x},${from.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;
        document.getElementById('ep-'+drag.eid)?.setAttribute('d',newD);
        document.querySelector('#eg-'+drag.eid+' .ehit')?.setAttribute('d',newD);
        document.getElementById('cph1-'+drag.eid)?.setAttribute('cx',cp1.x);
        document.getElementById('cph1-'+drag.eid)?.setAttribute('cy',cp1.y);
        document.getElementById('cph2-'+drag.eid)?.setAttribute('cx',cp2.x);
        document.getElementById('cph2-'+drag.eid)?.setAttribute('cy',cp2.y);
        const cpls=document.querySelectorAll('#eg-'+drag.eid+' .cpl');
        if(cpls[0]){cpls[0].setAttribute('x2',cp1.x);cpls[0].setAttribute('y2',cp1.y);}
        if(cpls[1]){cpls[1].setAttribute('x2',cp2.x);cpls[1].setAttribute('y2',cp2.y);}
    }
  }
  else if(drag.type==='selbox'){
    const cvsR = cvs.getBoundingClientRect();
    const cx = e.clientX - cvsR.left;
    const cy = e.clientY - cvsR.top;
    const w = Math.abs(cx - drag.sx);
    const h = Math.abs(cy - drag.sy);
    // 6px ?�상 ?�직�????�만 박스 ?�시
    if(!drag.moved && (w > 6 || h > 6)){
      drag.moved = true;
      selboxDiv.style.display = 'block';
    }
    if(drag.moved){
      const x = Math.min(cx, drag.sx);
      const y = Math.min(cy, drag.sy);
      selboxDiv.style.left   = x + 'px';
      selboxDiv.style.top    = y + 'px';
      selboxDiv.style.width  = w + 'px';
      selboxDiv.style.height = h + 'px';
      // ?�재 ?�래�?중인 ?�면 좌표 ?�??(mouseup?�서 ?�용)
      drag.cx = cx; drag.cy = cy;
    }
  }
});

window.addEventListener('mouseup',e=>{
  // ?�?� ?�연�?drag ?�료 ?�?�
  if(drag && drag.type==='reconnect' && reconnecting){
    if(!drag.moved){
      drag = null; // ?�릭 방식: reconnecting ?�태???��?
      return;
    }
    const hit = findDropAnchorAt(e.clientX, e.clientY, reconnecting.fixedId);
    if(hit) finishReconnect(hit.toId, hit.toA);
    else cancelReconnect();
    return;
  }

  // ?�?� ?�결 drag ?�료 ?�?�
  if(drag && drag.type==='connect' && connecting){
    // ?�릭 방식(?�직임 ?�음): mouseup??무시?�고 connecting ?�태 ?��?
    // ?�음 ?�커/?�드 ?�릭(mousedown)?�서 finishConnect가 ?�출??
    if(!drag.moved){
      drag = null; // drag???�제?�되 connecting?� ?��?
      return;
    }

    // ?�래�?방식: ?��? ?�치?�서 가??가까운 ?�커�??�결 ?�료 ?�도
    const hit = findDropAnchorAt(e.clientX, e.clientY, connecting.fromId);
    if(hit) finishConnect(hit.toId, hit.toA);
    else cancelConnect(); // �?곳에 ?�음 ??취소
    return;
  }

  if(!drag) return;
  const dt=drag.type;
  if(dt==='pan') cvs.classList.remove('cg');
  else if(dt==='resize') {
    flushEdgeRedraw();
    // Mark CD nodes as manually resized so auto-height doesn't override
    if(drag.moved && nodes[drag.id]?.type?.startsWith('cd')){
      nodes[drag.id]._cdManualH = true;
      renderNode(drag.id);
    }
    const eids = autoCorrectStepEdgesForNodes([drag.id]);
    eids.forEach(renderEdge);
    selItem(drag.id);
    if(drag.moved) saveState('?�형 ?�기 조절');
  }
  else if(dt==='node'){
    flushEdgeRedraw();
    const movedIds = drag.movingIds && drag.movingIds.length ? drag.movingIds : [drag.id];
    const eids = autoCorrectStepEdgesForNodes(movedIds);
    eids.forEach(renderEdge);
    if(drag.moved) saveState('?�형 ?�동');
  }
  else if(dt==='cp' && drag.moved) saveState('??굴곡(?�들) 조절');
  else if(dt==='seg' && drag.moved){
    // ?�그먼트 ?�래�??�료: renderEdge�??�들 ?�구??+ ?�태 ?�??
    renderEdge(drag.eid);
    document.getElementById('eg-'+drag.eid)?.classList.add('sel');
    saveState('꺾�???경로 조절');
  }
  else if(dt==='selbox'){
    selboxDiv.style.display='none';
    if(!drag.moved){
      // ?�래�??�이 ?�릭�????�택 ?�제
      clearSel();
    } else {
      // ?�면 좌표 박스 ???�드 좌표 박스�?변??
      const x1s = drag.sx, y1s = drag.sy;
      const x2s = drag.cx ?? drag.sx, y2s = drag.cy ?? drag.sy;
      const cvsR = cvs.getBoundingClientRect();
      // ?�면??left/top??msvg 기�??�로 변??
      const toWorld = (sx, sy) => ({
        x: (sx - vx) / vs,
        y: (sy - vy) / vs
      });
      const p1 = toWorld(Math.min(x1s,x2s), Math.min(y1s,y2s));
      const p2 = toWorld(Math.max(x1s,x2s), Math.max(y1s,y2s));
      const bx=p1.x, by=p1.y, bw=p2.x-p1.x, bh=p2.y-p1.y;
      if(bw>4 && bh>4){
        selSet.clear();
        document.querySelectorAll('.ng.msel').forEach(el=>el.classList.remove('msel'));
        Object.values(nodes).forEach(n=>{
          const cx=n.x+nW(n)/2, cy=n.y+nH(n)/2;
          if(cx>=bx && cx<=bx+bw && cy>=by && cy<=by+bh){
            selSet.add(n.id);
            document.getElementById('ng-'+n.id)?.classList.add('msel');
          }
        });
        if(selSet.size===1){const id=[...selSet][0];selItem(id);}
        else if(selSet.size>1){document.getElementById('sts').textContent=`${selSet.size}�??�택`;updateInspector();}
      }
    }
  }
  drag=null;
});

// Track which arrow keys are currently pressed for continuous/diagonal panning
const arrowKeys = {};
let panTimer = 0;
let panVelX = 0, panVelY = 0, panLastTS = 0;

function startPanInterval(){
  if(panTimer) return;
  const tick = (ts)=>{
    const dt = panLastTS ? Math.min(40, ts - panLastTS) : 16;
    panLastTS = ts;

    const a=document.activeElement;
    const isInput = a && (a.tagName==='INPUT' || a.tagName==='TEXTAREA' || a.isContentEditable);
    let targetX=0, targetY=0;
    if(!isInput){
      if(arrowKeys['ArrowLeft']) targetX += 1;
      if(arrowKeys['ArrowRight']) targetX -= 1;
      if(arrowKeys['ArrowUp']) targetY += 1;
      if(arrowKeys['ArrowDown']) targetY -= 1;
    }

    const maxSpeed = 1.55;   // px/ms
    const blend = 0.23;      // easing factor
    panVelX += (targetX*maxSpeed - panVelX) * blend;
    panVelY += (targetY*maxSpeed - panVelY) * blend;

    if(Math.abs(panVelX) < 0.02) panVelX = 0;
    if(Math.abs(panVelY) < 0.02) panVelY = 0;

    if(panVelX || panVelY){
      vx += panVelX * dt;
      vy += panVelY * dt;
      applyVP();
    }

    const hasKey = arrowKeys['ArrowLeft'] || arrowKeys['ArrowRight'] || arrowKeys['ArrowUp'] || arrowKeys['ArrowDown'];
    if(hasKey || panVelX || panVelY){
      panTimer = requestAnimationFrame(tick);
    }else{
      panTimer = 0;
      panLastTS = 0;
    }
  };
  panTimer = requestAnimationFrame(tick);
}
function stopPanInterval(){
  if(panTimer){ cancelAnimationFrame(panTimer); panTimer=0; }
  panVelX=0; panVelY=0; panLastTS=0;
}

window.addEventListener('keydown',e=>{
  const a=document.activeElement;
  const isInput = a && (a.tagName==='INPUT' || a.tagName==='TEXTAREA' || a.isContentEditable);

  // Arrow keys: add to pressed set and start continuous panning
  if(!isInput && (e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown')){
    e.preventDefault();
    arrowKeys[e.key] = true;
    startPanInterval();
    return;
  }

  if(e.key==='Escape'){
    if(connecting) cancelConnect();
    if(reconnecting) cancelReconnect();
    clearSel();
  }
  
  // ?�행 취소 / ?�시 ?�행 ?�축??
  if((e.ctrlKey || e.metaKey) && !isInput) {
    const k=e.key.toLowerCase();
    if(k === 'c'){
      e.preventDefault();
      copySelection();
      return;
    } else if(k === 'v'){
      e.preventDefault();
      pasteSelection();
      return;
    } else if(k === 'z') {
      e.preventDefault();
      if(e.shiftKey) redo();
      else undo();
      return;
    } else if(k === 'y') {
      e.preventDefault();
      redo();
      return;
    }
  }

  if((e.key==='Delete'||e.key==='Backspace')&&(selId||selSet.size>0)){
    if(isInput) return;
    if(selSet.size>0){
      const toDelete=[...selSet];
      clearSel();
      toDelete.forEach(id=>{
        document.getElementById('ng-'+id)?.remove(); delete nodes[id];
        for(const eid in edges){ if(edges[eid]?.from===id||edges[eid]?.to===id){removeEdgeDOM(eid);delete edges[eid];}}
      });
      updateStatus(); 
      saveState('?�중 ??�� ??��');
      return;
    }
    deleteSel();
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='a'){
    e.preventDefault();
    selSet.clear();
    document.querySelectorAll('.ng.msel').forEach(el=>el.classList.remove('msel'));
    for(const id in nodes){ selSet.add(id); document.getElementById('ng-'+id)?.classList.add('msel'); }
    document.getElementById('sts').textContent=`${selSet.size}�??�택`;
    updateInspector();
  }
});

// Listen for keyup to remove arrow keys from the pressed set and stop the pan interval
window.addEventListener('keyup', e => {
  if(e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown'){
    delete arrowKeys[e.key];
    // 관??감속?� rAF 루프가 ?�연?�럽�?처리
  }
});
window.addEventListener('blur', ()=>{
  delete arrowKeys['ArrowLeft'];
  delete arrowKeys['ArrowRight'];
  delete arrowKeys['ArrowUp'];
  delete arrowKeys['ArrowDown'];
  stopPanInterval();
});

cvs.addEventListener('wheel',e=>{
  e.preventDefault();
  const d=e.deltaY<0?.08:-.08;
  const r=msvg.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const ns=Math.min(3,Math.max(.1,vs+d));
  vx=mx-(mx-vx)*(ns/vs);vy=my-(my-vy)*(ns/vs);vs=ns;applyVP();
},{passive:false});

// Disable default context menu on the canvas so right-click panning works smoothly
cvs.addEventListener('contextmenu', e => {
  e.preventDefault();
});

cvs.addEventListener('dragover',e=>e.preventDefault());
cvs.addEventListener('drop',e=>{
  e.preventDefault();
  const type=e.dataTransfer.getData('nodeType');
  const label=e.dataTransfer.getData('nodeLabel');
  if(!type) return;
  const p=spt(e.clientX,e.clientY);
  const s=S[type]||{w:140,h:44};
  createNode(type,snapG(p.x-s.w/2),snapG(p.y-s.h/2),null,label||null);
  saveState('?�형 ?�성 (?�래�?');
});



// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// DELETE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function deleteSel(){
  if(!selId) return;
  if(selId.startsWith('edge:')){
    const eid=selId.slice(5);
    removeEdgeDOM(eid); delete edges[eid];
  } else {
    document.getElementById('ng-'+selId)?.remove(); delete nodes[selId];
    for(const eid in edges){
      const e = edges[eid];
      if(e?.from===selId||e?.to===selId){
        removeEdgeDOM(eid); delete edges[eid];
      }
    }
  }
  selId=null; updateInspector(); updateStatus();
  saveState('?�일 ??�� ??��');
}

function jClone(v){
  return JSON.parse(JSON.stringify(v));
}
function getSelectedNodeIds(){
  if(selSet.size>0) return [...selSet];
  if(selId && !selId.startsWith('edge:')) return [selId];
  return [];
}
function copySelection(){
  let nodeIds=getSelectedNodeIds();
  let edgeIds=[];
  if(nodeIds.length){
    const set=new Set(nodeIds);
    edgeIds=[];
    for(const eid in edges){
      const e=edges[eid];
      if(e&&set.has(e.from)&&set.has(e.to)) edgeIds.push(eid);
    }
  }else if(selId&&selId.startsWith('edge:')){
    const e=edges[selId.slice(5)];
    if(e){
      nodeIds=[e.from,e.to];
      const set=new Set(nodeIds);
      edgeIds=[];
      for(const eid in edges){
        const x=edges[eid];
        if(x&&set.has(x.from)&&set.has(x.to)) edgeIds.push(eid);
      }
    }
  }
  if(!nodeIds.length){showAlert('복사????��??먼�? ?�택?�세??');return;}
  const copiedNodes=nodeIds.map(id=>jClone(nodes[id])).filter(Boolean);
  const copiedEdges=edgeIds.map(id=>jClone(edges[id])).filter(Boolean);
  clipBundle={nodes:copiedNodes,edges:copiedEdges};
  pasteSeq=0;
}
function pasteSelection(){
  if(!clipBundle||!clipBundle.nodes||!clipBundle.nodes.length){
    showAlert('붙여?�기??복사 ?�이?��? ?�습?�다. (Ctrl+C 먼�?)');
    return;
  }
  pasteSeq++;
  const dx=40*pasteSeq, dy=40*pasteSeq;
  const idMap={};
  clearSel();

  clipBundle.nodes.forEach(src=>{
    const nid='n'+(++nc);
    idMap[src.id]=nid;
    createNode(
      src.type,
      snapG((src.x||0)+dx),
      snapG((src.y||0)+dy),
      nid,
      src.label,
      jClone(src.properties||{}),
      src.sw, src.sh
    );
    if(src.color) nodes[nid].color=src.color;
    if(src.txtColor) nodes[nid].txtColor=src.txtColor;
    renderNode(nid);
    selSet.add(nid);
    document.getElementById('ng-'+nid)?.classList.add('msel');
  });

  clipBundle.edges.forEach(src=>{
    const from=idMap[src.from], to=idMap[src.to];
    if(!from||!to) return;
    const eid='e'+(++ec);
    createEdge(from,to,src.fromA,src.toA,eid,src.label,src.name,src.cp1dx,src.cp1dy,src.cp2dx,src.cp2dy);
    const e=edges[eid];
    if(src.lineStyle) e.lineStyle=src.lineStyle;
    if(src.color) e.color=src.color;
    if(src.txtColor) e.txtColor=src.txtColor;
    if(src.relation) e.relation=src.relation;
    if(src.manualPts&&src.manualPts.length>=2){
      const shifted=src.manualPts.map(pt=>[pt[0]+dx,pt[1]+dy]);
      const fromW=anchorW(from,e.fromA), toW=anchorW(to,e.toA);
      e.manualPts=normalizeStepManualPts(shifted,fromW,toW,undefined,e);
    }
    renderEdge(eid);
  });

  if(selSet.size===1){
    selItem([...selSet][0]);
  }else{
    selId=null;
    document.getElementById('sts').textContent=`${selSet.size}�??�택`;
    updateInspector();
  }
  updateStatus();
  saveState('복사 붙여?�기');
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// INSPECTOR
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function getEdgeInspectorHTML(eid, edge) {
  return `
    <div class="fg"><div class="fl">Edge ID</div><input class="fi" value="${escAttr(eid)}" readonly></div>
    <div class="fg"><div class="fl">?�결</div><input class="fi" value="${escAttr(edge.from)} ??${escAttr(edge.to)}" readonly></div>
    <div class="fg"><div class="fl">?�시 ?�름</div><input class="fi" data-prop="name" id="en" value="${escAttr(edge.name||'')}"></div>
    <div class="fg"><div class="fl">조건/?�벤??/div><input class="fi" data-prop="label" id="el" value="${escAttr(edge.label||'')}"></div>
    <div class="fsep"></div>
    <div class="fg">
      <div class="fl">???��???(Edge Style)</div>
      <select class="fi" data-prop="lineStyle" id="els" style="cursor:pointer">
        <option value="">기본 (?�단 ?�역?�정)</option>
        <option value="curve" ${edge.lineStyle==='curve'?'selected':''}>??곡선 (Curve)</option>
        <option value="step" ${edge.lineStyle==='step'?'selected':''}>?? 꺾�???(Step)</option>
        <option value="straight" ${edge.lineStyle==='straight'?'selected':''}>?�� 직선 (Straight)</option>
      </select>
    </div>
    <div class="fg">
      <div class="fl">UML 관�??�형</div>
      <select class="fi" data-prop="relation" id="erel" style="cursor:pointer">
        <option value="" ${!edge.relation?'selected':''}>?�??기본 ?�살??/option>
        <option value="inherit" ${edge.relation==='inherit'?'selected':''}>?�???�속 (Inheritance)</option>
        <option value="implement" ${edge.relation==='implement'?'selected':''}>- -??구현 (Realization)</option>
        <option value="aggregate" ${edge.relation==='aggregate'?'selected':''}>?��? 집합 (Aggregation)</option>
        <option value="compose" ${edge.relation==='compose'?'selected':''}>?��? ?�성 (Composition)</option>
        <option value="depend" ${edge.relation==='depend'?'selected':''}>- -> ?�존 (Dependency)</option>
        <option value="assoc" ${edge.relation==='assoc'?'selected':''}>?� ?��? (Association)</option>
      </select>
    </div>
    <div class="fg">
      <div class="fl">???�상</div>
      <div style="display:flex;gap:4px;align-items:center">
        <input class="fi" id="ec-color" type="color" value="${safeHexColor(edge.color,'#00d4ff')}" style="width:36px;padding:1px 2px;cursor:pointer">
        <button class="hbtn" id="ec-reset" title="???�상 초기??>??/button>
      </div>
    </div>
    <div class="fg">
      <div class="fl">글???�상</div>
      <div style="display:flex;gap:4px;align-items:center">
        <input class="fi" id="etc-color" type="color" value="${safeHexColor(edge.txtColor,'#dde6f5')}" style="width:36px;padding:1px 2px;cursor:pointer">
        <button class="hbtn" id="etc-reset" title="글???�상 초기??>??/button>
      </div>
    </div>
    <button class="hbtn" id="edge-reset-curve">??경로 리셋</button>
    <button class="hbtn" id="edge-delete">?��</button>`;
}

function getCDNodeInspectorHTML(n, isEnum) {
  let attrVal='', methVal='';
  if(typeof n.properties?.cd_attributes === 'string' || typeof n.properties?.cd_methods === 'string'){
    attrVal = n.properties.cd_attributes || '';
    methVal = n.properties.cd_methods || '';
  } else {
    Object.entries(n.properties||{}).forEach(([k,v])=>{
      const t = v ? `${k}: ${v}` : k;
      if(k.includes('(')) methVal += (methVal ? '\n' : '') + t;
      else attrVal += (attrVal ? '\n' : '') + t;
    });
  }
  const methSection = isEnum ? '' : `
    <div class="fg" style="margin-top:4px;">
      <div class="fl">메서??(Methods)</div>
      <textarea id="cd-meth" class="fi" style="height:80px;resize:vertical;font-size:10.5px;line-height:1.6">${escAttr(methVal)}</textarea>
    </div>`;
  return `
    <div class="fg"><div class="fl">Node ID</div><input class="fi" value="${escAttr(n.id)}" readonly></div>
    <div class="fg"><div class="fl">?�래???�름</div><input class="fi" data-prop="label" value="${escAttr(n.label||'')}"></div>
    <div class="fsep"></div>
    <div class="fg">
      <div class="fl">?�성 (Attributes)</div>
      <textarea id="cd-attr" class="fi" style="height:90px;resize:vertical;font-size:10.5px;line-height:1.6">${escAttr(attrVal)}</textarea>
    </div>
    ${methSection}
    <div class="fsep"></div>
    <div class="phd"><div class="ptt">?�기 �?배치</div></div>
    <div class="frow">
      <div class="fhalf"><div class="fl">?�비</div><input class="fi" data-prop="sw" type="number" value="${Math.round(nW(n))}"></div>
      <div class="fhalf"><div class="fl">?�이 (?�동)</div><input class="fi" data-prop="sh" type="number" value="${Math.round(nH(n))}"></div>
    </div>
    <button class="smb" id="cd-auto-h">???�이 ?�동 조절</button>
    <div class="frow" style="margin-top:4px;">
      <button class="hbtn" id="node-front" style="flex:1">?��</button>
      <button class="hbtn" id="node-back" style="flex:1">?��</button>
    </div>
    <div class="fsep"></div>
    <button class="hbtn" id="node-delete">?��</button>`;
}

function getGenericNodeInspectorHTML(n) {
  const ph = Object.entries(n.properties).map(([k,v]) => `
    <div class="pr"><input class="pk" value="${escAttr(k)}"><input class="pv" value="${escAttr(v)}"><button class="dx" data-del-key="${escAttr(k)}">??/button></div>`).join('');
  return `
    <div class="fg"><div class="fl">Node ID</div><input class="fi" value="${escAttr(n.id)}" readonly></div>
    <div class="fg"><div class="fl">?�이�?/div><input class="fi" data-prop="label" value="${escAttr(n.label||'')}"></div>
    <div class="fsep"></div>
    <div class="phd"><div class="ptt">?�기 �?배치</div></div>
    <div class="frow">
      <div class="fhalf"><div class="fl">?�비</div><input class="fi" data-prop="sw" type="number" value="${Math.round(nW(n))}"></div>
      <div class="fhalf"><div class="fl">?�이</div><input class="fi" data-prop="sh" type="number" value="${Math.round(nH(n))}"></div>
    </div>
    <div class="fg">
      <div class="fl">?�상</div>
      <input class="fi" data-prop="color" type="color" value="${safeHexColor(n.color,'#000000')}">
    </div>
    <div class="fg">
      <div class="fl">글???�상</div>
      <input class="fi" data-prop="txtColor" type="color" value="${safeHexColor(n.txtColor,'#000000')}">
    </div>
    <div class="frow" style="margin-top:4px;">
      <button class="hbtn" id="node-front" style="flex:1">?��</button>
      <button class="hbtn" id="node-back" style="flex:1">?��</button>
    </div>
    <div class="fsep"></div>
    <div class="phd"><div class="ptt">?�성</div><button class="ab" id="node-add-prop">�?/button></div>
    <div id="plist">${ph}</div>
    <div class="fsep"></div>
    <button class="hbtn" id="node-delete">?��</button>`;
}

function updateInspector(){
  const body=document.getElementById('ibd');
  const badge=document.getElementById('ibg');
  
  if(selSet.size > 1 && !selId){
    badge.textContent=selSet.size+'�?; badge.style.color='#ffaa33';
    body.innerHTML=`<div style="padding:8px 0;font-size:11px;color:var(--tx2)">${selSet.size}�??�드 ?�택??br><br>?�동: ?�래�?br>??��: Del ??br>?�제: Esc ??/div>`;
    return;
  }
  if(!selId){
    badge.textContent=''; badge.style.color='';
    body.innerHTML=`<div class="ie"><div class="ieg">??/div><div class="iet">?�드 ?�는<br>?�결?�을 ?�택?�세??/div></div>`;
    return;
  }

  // Clear existing listeners by replacing the content (though we will use delegation now)
  body.innerHTML = ''; 

  if(selId.startsWith('edge:')){
    const eid=selId.slice(5); const edge=edges[eid]; if(!edge) return;
    badge.textContent='EDGE'; badge.style.color='var(--ac)';
    body.innerHTML = getEdgeInspectorHTML(eid, edge);
    setupInspectorListeners(eid, 'edge');
  } else {
    const nid = selId; const n = nodes[nid]; if(!n) return;
    const s = S[n.type];
    badge.textContent = s?.label || n.type; 
    badge.style.color = `var(${s?.t || '--tx2'})`;
    
    if(n.type.startsWith('cd')){
      body.innerHTML = getCDNodeInspectorHTML(n, n.type === 'cdenum');
    } else {
      body.innerHTML = getGenericNodeInspectorHTML(n);
    }
    setupInspectorListeners(nid, 'node');
  }

  if(typeof refreshTooltips === 'function') refreshTooltips();
}

function setupInspectorListeners(id, type) {
  const body = document.getElementById('ibd');
  const target = type === 'edge' ? edges[id] : nodes[id];
  if(!target) return;

  // Handler for Generic Inputs (data-prop)
  const onInput = (e) => {
    const prop = e.target.dataset.prop;
    if(!prop) return;
    let val = e.target.value;
    if(e.target.type === 'number') val = parseInt(val) || 0;
    
    target[prop] = val;
    if(prop === 'sh' && type === 'node' && target.type.startsWith('cd')) target._cdManualH = true;

    if(type === 'edge') renderEdge(id); else renderNode(id);
    if(prop === 'sw' || prop === 'sh' || prop === 'label' || prop === 'color') redrawEdges();
    
    const el = document.getElementById((type === 'edge' ? 'eg-' : 'ng-') + id);
    if(el) el.classList.add('sel');
  };

  const onChange = (e) => {
    const prop = e.target.dataset.prop;
    if(prop) saveState(prop + ' 변�?);
  };

  // Attach to body for delegation
  body.querySelectorAll('.fi').forEach(el => {
    el.addEventListener('input', onInput);
    el.addEventListener('change', onChange);
  });

  // Specialized listeners
  if(type === 'edge') {
    document.getElementById('ec-reset')?.addEventListener('click', () => {
      delete target.color; renderEdge(id); saveState('???�상 초기??); updateInspector();
    });
    document.getElementById('etc-reset')?.addEventListener('click', () => {
      delete target.txtColor; renderEdge(id); saveState('글???�상 초기??); updateInspector();
    });
    document.getElementById('ec-color')?.addEventListener('input', e => {
      target.color = e.target.value; renderEdge(id);
    });
    document.getElementById('etc-color')?.addEventListener('input', e => {
      target.txtColor = e.target.value; renderEdge(id);
    });
    document.getElementById('edge-reset-curve')?.addEventListener('click', () => resetEdgeCurve(id));
    document.getElementById('edge-delete')?.addEventListener('click', () => deleteSel());
  } else {
    // CD Node Textareas
    const applyCD = () => {
      const a = document.getElementById('cd-attr')?.value || '';
      const m = document.getElementById('cd-meth')?.value || '';
      target.properties = { cd_attributes: a, cd_methods: m };
      renderNode(id); redrawEdges();
    };
    document.getElementById('cd-attr')?.addEventListener('input', applyCD);
    document.getElementById('cd-meth')?.addEventListener('input', applyCD);
    document.getElementById('cd-attr')?.addEventListener('change', () => saveState('CD ?�성 변�?));
    document.getElementById('cd-meth')?.addEventListener('change', () => saveState('CD 메서??변�?));
    document.getElementById('cd-auto-h')?.addEventListener('click', () => {
      delete target._cdManualH; delete target.sh;
      renderNode(id); redrawEdges(); selItem(id); saveState('?�이 ?�동 조절');
    });

    // Generic Node Buttons
    document.getElementById('node-front')?.addEventListener('click', () => nodeToFront(id));
    document.getElementById('node-back')?.addEventListener('click', () => nodeToBack(id));
    document.getElementById('node-delete')?.addEventListener('click', () => deleteSel());
    document.getElementById('node-add-prop')?.addEventListener('click', () => aProp(id));

    // Property list helpers
    body.querySelectorAll('.dx[data-del-key]').forEach(btn => {
      btn.addEventListener('click', () => dProp(id, btn.dataset.delKey));
    });
    body.querySelectorAll('.pk, .pv').forEach(inp => {
      inp.addEventListener('change', () => saveState('?�성 변�?));
      inp.addEventListener('blur', () => {
        rebuildP(id);
        if(target.type.startsWith('cd')) { renderNode(id); redrawEdges(); selItem(id); }
      });
    });
  }
}
function rebuildP(nid){
const rows=document.querySelectorAll('#plist .pr');const p={};
rows.forEach(r=>{const k=r.querySelector('.pk').value.trim(),v=r.querySelector('.pv').value.trim();if(k)p[k]=v;});
nodes[nid].properties=p;
}
function aProp(nid){if(!nodes[nid])return;nodes[nid].properties['prop_'+Object.keys(nodes[nid].properties).length]='';if(nodes[nid].type.startsWith('cd')){renderNode(nid);redrawEdges();}updateInspector();saveState();}
function dProp(nid,k){delete nodes[nid].properties[k];if(nodes[nid].type.startsWith('cd')){renderNode(nid);redrawEdges();}updateInspector();saveState();}
function resetEdgeCurve(eid){
if(!edges[eid])return;
edges[eid].cp1dx=0;edges[eid].cp1dy=0;edges[eid].cp2dx=0;edges[eid].cp2dy=0;
delete edges[eid].manualPts;
renderEdge(eid);
document.getElementById('eg-'+eid)?.classList.add('sel');
document.getElementById('ep-'+eid)?.classList.add('hl');
saveState();
}

// ?�드 ?�이�??�정 ?�정 ?�수. ?�블?�릭 ??renameTarget??id가 ?�?�되�?
// ?�용?��? ?�력???�료?�고 '?�인' 버튼???�르�????�수가 ?�출?�어 ?�이블을 ?�데?�트?�니??
function confirmRename(){
  const inp = document.getElementById('rename-input');
  if(renameTarget && nodes[renameTarget]){
    const newLabel = inp.value;
    nodes[renameTarget].label = newLabel;
    renderNode(renameTarget);
    // ?�택 ?�태 ?��?
    updateInspector();
    saveState('?�이�??�정');
  }
  renameTarget = null;
  cm('m-rename');
}

// ?�?� ?�이�??�정 ?�풋?�서 Enter/ESC 처리�??�록 ?�?�
// ??리스?�는 ??번만 추�??�어??충분??
document.getElementById('rename-input')?.addEventListener('keydown', function(e) {
  if(e.key === 'Enter') {
    e.preventDefault();
    confirmRename();
  } else if(e.key === 'Escape') {
    e.preventDefault();
    renameTarget = null;
    cm('m-rename');
  }
});

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// STATUS / MODE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function updateStatus(){
  if(el.stn) el.stn.textContent='노드: '+nc;
  if(el.ste) el.ste.textContent='연결: '+ec;
}
function setMode(m){
  mode=m;
  ['fc','fsm','bt','sc','cd'].forEach(k=>{
    document.getElementById('tab-'+k)?.classList.toggle('on',k===m);
  });
  renderPalette();
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// THEME
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function toggleTheme(){
  lightMode=!lightMode;
  document.body.classList.toggle('light',lightMode);
  invalidateVarCache();
  document.getElementById('thbtn').textContent=lightMode?'?��?:'?��';
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// EXPORT / IMPORT
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function getData(){
  return{
    project:el.pname.value||'Untitled', mode, lineStyle: globalLineStyle,
    nodes:Object.values(nodes).map(n=>({
      id:n.id,
      type:n.type,
      label:n.label,
      x:Math.round(n.x),
      y:Math.round(n.y),
      sw:n.sw,
      sh:n.sh,
      // Persist custom colours for nodes
      color:n.color || '',
      txtColor:n.txtColor || '',
      properties:n.properties
    })),
    edges:Object.values(edges).map(e=>({
      id:e.id,
      from:e.from,
      to:e.to,
      from_anchor:e.fromA,
      to_anchor:e.toA,
      name:e.name || '',
      label:e.label || '',
      lineStyle:e.lineStyle || '',
      // Persist custom colours for edges and their labels
      color:e.color || '',
      txtColor:e.txtColor || '',
      cp1dx:e.cp1dx || 0,
      cp1dy:e.cp1dy || 0,
      cp2dx:e.cp2dx || 0,
      cp2dy:e.cp2dy || 0,
      manualPts:e.manualPts || null,
      relation:e.relation || ''
    }))
  };
}
function exportJSON(){document.getElementById('m-exp-ta').value=JSON.stringify(getData(),null,2);document.getElementById('m-exp').style.display='flex';}
function copyExp(){
  const ta=document.getElementById('m-exp-ta');
  const txt=ta?.value||'';
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(txt).catch(()=>{
      ta.focus(); ta.select();
      let ok=false;
      try{ ok=document.execCommand('copy'); }catch(_){}
      if(!ok) showAlert('복사 ?�패: Ctrl+C�??�동 복사??주세??');
    });
    return;
  }
  ta.focus(); ta.select();
  let ok=false;
  try{ ok=document.execCommand('copy'); }catch(_){}
  if(!ok) showAlert('복사 ?�패: Ctrl+C�??�동 복사??주세??');
}
function dlJSON(){const d=getData(),b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=d.project+'.json';a.click();}

// File import logic
document.getElementById('imp-file').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('m-imp-ta').value = ev.target.result;
  };
  reader.readAsText(file);
});

function openImport(){
  document.getElementById('m-imp-ta').value='';
  document.getElementById('imp-file').value=''; // input 초기??
  document.getElementById('m-imp').style.display='flex';
}

function doImp(){
  try{
    const d=JSON.parse(document.getElementById('m-imp-ta').value.trim());
    clearCanvas(true);
    if(d.project) el.pname.value=d.project;
    if(d.mode) setMode(d.mode);
    if(d.lineStyle){ globalLineStyle=d.lineStyle; 
      const btn=document.getElementById('lstyle-btn');
      if(globalLineStyle==='step') btn.textContent='?? ?? 꺾�???; else if(globalLineStyle==='straight') btn.textContent='?�� ?? 직선'; else btn.textContent='???? 곡선';
    }
    (d.nodes||[]).forEach(n=>{
      nc=Math.max(nc,parseInt(n.id.replace(/\D/g,''))||0);
      // Create the node and then apply custom colours if provided
      createNode(n.type,n.x,n.y,n.id,n.label,n.properties||{},n.sw,n.sh);
      if(n.color) nodes[n.id].color = n.color;
      if(n.txtColor) nodes[n.id].txtColor = n.txtColor;
      // Re-render to apply colours on initial import
      renderNode(n.id);
    });
    setTimeout(()=>{
      (d.edges||[]).forEach(e=>{
        ec=Math.max(ec,parseInt(e.id.replace(/\D/g,''))||0);
        const eid=createEdge(e.from,e.to,e.from_anchor,e.to_anchor,e.id,e.label,e.name,e.cp1dx,e.cp1dy,e.cp2dx,e.cp2dy);
        if(eid){
          // Apply stored line style and colours if present
          if(e.lineStyle) edges[eid].lineStyle = e.lineStyle;
          if(e.color) edges[eid].color = e.color;
          if(e.txtColor) edges[eid].txtColor = e.txtColor;
          if(e.relation) edges[eid].relation = e.relation;
          if(e.manualPts) edges[eid].manualPts = e.manualPts;
          renderEdge(eid);
        }
      });
      cm('m-imp');
    },60);
  }catch(err){showAlert('JSON ?�싱 ?�류: '+err.message);}
}

// 초기?�시 ?�모 복원 방�? �??�전 비우�?추�? ?�용
function clearCanvas(silent){
  if(!silent) {
    document.getElementById('m-confirm').style.display='flex';
    return;
  }
  executeClear();
}

function executeClear() {
if(demoTimer) clearTimeout(demoTimer);
nodes={};edges={};nc=0;ec=0;selId=null;selSet.clear();connecting=null;reconnecting=null;
clearConnectVisuals();
NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';
const newName = 'Untitled_Flow';
el.pname.value = newName;
// ?�재 ?�트 ?�름??초기??
const sh = sheets.find(s=>s.id===activeSheetId);
if(sh){ sh.name = newName; renderSheetBar(); }
updateInspector();updateStatus();
cm('m-confirm');
saveState('캔버??초기??);
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// CAPTURE  ??data: URL 방식?�로 tainted canvas ?�전 ?�결
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function captureFlow(){
  if(!nc){showAlert('캔버?�에 ?�드가 ?�습?�다.');return;}

  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const id in nodes){
    const n=nodes[id];
    x0=Math.min(x0,n.x); y0=Math.min(y0,n.y);
    x1=Math.max(x1,n.x+nW(n)); y1=Math.max(y1,n.y+nH(n));
  }
  const pad=70, CW=Math.ceil(x1-x0+pad*2), CH=Math.ceil(y1-y0+pad*2), ox=x0-pad, oy=y0-pad;

  // ?�?� ?�택 ?�태 ?�시 ?�거 ?�?�
  const prevSel=selId;
  document.querySelectorAll('.ng.sel,.ng.msel,.eg.sel,.ep.hl').forEach(el=>{
    el.classList.remove('sel','msel','hl');
  });

  // ?�?� SVG ?�드/?��? 그룹??CSS var ?�석??채로 직렬???�?�
  const cs = getComputedStyle(document.documentElement);
  function rv(val){ // resolve CSS vars
    if(!val) return val;
    return val.replace(/var\(([^)]+)\)/g,(_,k)=>cs.getPropertyValue(k.trim()).trim()||'#888');
  }

  function cloneForExport(el){
    if(el.nodeType===3) return document.createTextNode(el.textContent);
    if(el.nodeType!==1) return null;
    // 캡처?�서 ?�외???�소
    const cls=el.className?.baseVal||el.className||'';
    if(/\ban\b|\brh\b|\bnid\b|\behit\b|\bcph\b|\bcpl\b|\bconnect-target\b/.test(cls)) return null;
    if(el.id==='tl') return null;

    const tag=el.tagName.toLowerCase();
    const c=document.createElementNS('http://www.w3.org/2000/svg', el.tagName);

    // ?�성 복사 + var() ?�석
    for(const a of el.attributes){
      if(a.name==='style') continue; // style?� ?�래??처리
      c.setAttribute(a.name, rv(a.value));
    }

    // ?�라???��????�석
    const inlineSt=el.getAttribute('style');
    if(inlineSt) c.setAttribute('style', rv(inlineSt));

    // ?�형 ?�소: 계산??fill/stroke�?직접 주입
    const shapeSet=new Set(['rect','polygon','path','circle','ellipse','line','polyline']);
    if(shapeSet.has(tag)){
      const computed=getComputedStyle(el);
      // fill
      if(!c.hasAttribute('fill')||c.getAttribute('fill').includes('var(')){
        const f=rv(el.getAttribute('fill')||'')||computed.fill;
        if(f&&f!=='') c.setAttribute('fill',f);
      }
      // stroke
      if(!c.hasAttribute('stroke')||c.getAttribute('stroke').includes('var(')){
        const s=rv(el.getAttribute('stroke')||'')||computed.stroke;
        if(s&&s!=='') c.setAttribute('stroke',s);
      }
      // stroke-width 보존
      if(!c.hasAttribute('stroke-width')&&el.getAttribute('stroke-width'))
        c.setAttribute('stroke-width',el.getAttribute('stroke-width'));
    }

    // text ?�소: fill ?�상 주입
    if(tag==='text'){
      const computed=getComputedStyle(el);
      if(!c.getAttribute('fill')||c.getAttribute('fill').includes('var(')){
        const f=rv(el.getAttribute('fill')||'')||computed.color||computed.fill;
        if(f) c.setAttribute('fill',f);
      }
      // ?��? ?�트 ?�거 ???�전???�트�?교체
      let fs=c.getAttribute('style')||'';
      fs=fs.replace(/font-family:[^;]+;?/g,'');
      c.setAttribute('style',fs);
      c.setAttribute('font-family','Arial,sans-serif');
    }

    // ?�식 ?��?
    for(const ch of el.childNodes){
      const cc=cloneForExport(ch);
      if(cc) c.appendChild(cc);
    }
    return c;
  }

  const ELc=cloneForExport(document.getElementById('EL'));
  const LBLc=cloneForExport(document.getElementById('LBL'));
  const NLc=cloneForExport(document.getElementById('NL'));

  // ?�택 ?�태 복원
  if(prevSel&&!prevSel.startsWith('edge:')) document.getElementById('ng-'+prevSel)?.classList.add('sel');

  const bg=lightMode?'#f4f6fa':'#080b10';
  const edgeCol=lightMode?'rgba(0,0,0,0.82)':'rgba(255,255,255,0.88)';
  const customMarkers = Object.values(edges)
    .filter(e=>e.color)
    .map(e=>`<marker id="marker-ec-${e.id}" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="${e.color}"/></marker>`)
    .join('');

  const sx=new XMLSerializer();
  const elStr = ELc ? sx.serializeToString(ELc) : '';
  const lblStr = LBLc ? sx.serializeToString(LBLc) : '';
  const nlStr = NLc ? sx.serializeToString(NLc) : '';

  capSVG=[
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">`,
    `<style>`,
    `.ntx,.ntype{font-family:Arial,sans-serif;font-size:11px;font-weight:500;dominant-baseline:middle;text-anchor:middle;}`,
    `.ntype{font-size:8.5px;font-weight:700;letter-spacing:1px;}`,
    `.ep{fill:none;stroke:${edgeCol};stroke-width:1.8;marker-end:url(#ad);}`,
    `.elt{font-family:Arial,monospace;dominant-baseline:middle;text-anchor:middle;}`,
    `.elb{fill:${bg};stroke:${edgeCol};stroke-width:1;}`,
    `.sc-lifeline{stroke:${edgeCol};stroke-width:1.2;stroke-dasharray:6 4;}`,
    `</style>`,
    `<defs><marker id="ad" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">`,
    `<polygon points="0 0,8 3,0 6" fill="${edgeCol}"/></marker>${customMarkers}</defs>`,
    `<rect width="${CW}" height="${CH}" fill="${bg}"/>`,
    `<g transform="translate(${-ox},${-oy})">`,
    elStr, lblStr, nlStr,
    `</g></svg>`
  ].join('\n');

  // data: URL 방식 ??crossOrigin 문제 ?�음
  const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(capSVG);
  const scale=2;
  const capCv=document.getElementById('cap-cv');
  capCv.width=CW*scale; capCv.height=CH*scale;
  const ctx=capCv.getContext('2d');
  ctx.fillStyle=bg; ctx.fillRect(0,0,CW*scale,CH*scale);

  const img=new Image();
  img.onload=()=>{
    ctx.drawImage(img,0,0,CW*scale,CH*scale);
    document.getElementById('cap-png-btn').disabled=false;
  };
  img.onerror=(err)=>{
    console.warn('Capture render error',err);
    ctx.fillStyle='#ff4444'; ctx.font='13px sans-serif';
    ctx.fillText('?�더�??�패 ??SVG�??�?�해주세??',20,40);
    document.getElementById('cap-png-btn').disabled=false;
  };
  document.getElementById('cap-png-btn').disabled=true;
  img.src=encoded;
  document.getElementById('m-cap').style.display='flex';
}

function downloadBlob(filename, blob){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    a.remove();
    URL.revokeObjectURL(url);
  },0);
}

function dlCap(fmt){
  const proj=el.pname.value||'flow';
  if(fmt==='svg'){
    if(!capSVG||capSVG.indexOf('<svg')===-1){
      captureFlow();
      if(!capSVG||capSVG.indexOf('<svg')===-1){
        showAlert('SVG ?�성???�패?�습?�다.');
        return;
      }
    }
    const svgText = capSVG.startsWith('<?xml')
      ? capSVG
      : `<?xml version="1.0" encoding="UTF-8"?>\n${capSVG}`;
    const b=new Blob([svgText],{type:'image/svg+xml;charset=utf-8'});
    downloadBlob(proj+'.svg', b);
    return;
  }
  const capCv=document.getElementById('cap-cv');
  capCv.toBlob(bl=>{
    if(!bl){showAlert('PNG ?�성???�패?�습?�다.');return;}
    downloadBlob(proj+'.png', bl);
  },'image/png');
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// VALIDATE
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function validateFlow(){
  const issues=[];
  document.querySelectorAll('.ng.bad').forEach(el=>el.classList.remove('bad'));
  const startT={fc:['terminal'],fsm:['initial'],bt:['btroot'],sc:['sclife']}[mode]||['terminal'];
  const endT=Object.keys(S).filter(k=>S[k].end);
  if(!Object.values(nodes).some(n=>startT.includes(n.type)))
    issues.push({i:'??,t:'?�작 ?�드 ?�음 ('+startT.join('/')+' ?�???�요)'});
  for(const id in nodes){
    const n=nodes[id];
    const out=Object.values(edges).filter(e=>e.from===id);
    const inc=Object.values(edges).filter(e=>e.to===id);
    if(!out.length&&!inc.length){issues.push({i:'?��',t:`"${n.label}" (${id}): 고립`});document.getElementById('ng-'+id)?.classList.add('bad');}
    if(!out.length&&!endT.includes(n.type)) issues.push({i:'?��',t:`"${n.label}" (${id}): 출구 ?�음`});
    if(!inc.length&&!startT.includes(n.type)) issues.push({i:'?��',t:`"${n.label}" (${id}): 진입 ?�음`});
  });
  document.getElementById('m-val-b').innerHTML=issues.length
    ?issues.map(i=>`<div class="vi"><div>${i.i}</div><div class="vt">${i.t}</div></div>`).join('')
    :'<div class="vok">??검�??�과</div>';
  document.getElementById('m-val').style.display='flex';
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// DEMO
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
function syncLineStyleButton(){
  const btn=document.getElementById('lstyle-btn');
  if(!btn) return;
  if(globalLineStyle === 'step'){
    btn.textContent = '??';
    btn.setAttribute('data-tip', '???��??? 꺾�???);
    btn.setAttribute('data-tip-sub', '?�애물을 ?�동?�로 ?�하??직각 경로');
  }else if(globalLineStyle === 'straight'){
    btn.textContent = '?��';
    btn.setAttribute('data-tip', '???��??? 직선');
    btn.setAttribute('data-tip-sub', '출발?�과 ?�착?�을 직선?�로 ?�결');
  }else{
    btn.textContent = '??;
    btn.setAttribute('data-tip', '???��??? 곡선');
    btn.setAttribute('data-tip-sub', '베�???곡선?�로 부?�럽�??�결');
  }
}
function setEdgeStyle(eid, style){
  const e=edges[eid];
  if(!e) return;
  e.lineStyle=style;
  renderEdge(eid);
}
function buildDemoGraph(modeKey){
  if(modeKey==='fsm'){
    const n1=createNode('initial',   70,210,null,'');
    const n2=createNode('state',    230,190,null,'Idle');
    const n3=createNode('state',    460,190,null,'Move');
    const n4=createNode('fsmchoice',700,175,null,'??발견?');
    const n5=createNode('state',    930, 90,null,'Attack');
    const n6=createNode('accepting',930,300,null,'Evade');

    createEdge(n1,n2,'r','l',null,'','');
    createEdge(n2,n3,'r','l',null,'?�력','');
    createEdge(n3,n4,'r','l',null,'?�색','');
    createEdge(n4,n5,'t','l',null,'Yes','');
    createEdge(n4,n2,'b','t',null,'No','');
    createEdge(n5,n3,'b','r',null,'?��??�실','');
    createEdge(n3,n6,'b','l',null,'?�피','');
    return 'FSM_Demo';
  }
  if(modeKey==='bt'){
    const n1=createNode('btroot',  120,120,null,'Root');
    const n2=createNode('btseq',   330,120,null,'?�색 ?�퀀??);
    const n3=createNode('btcond',  560, 30,null,'Enemy?');
    const n4=createNode('btsel',   560,190,null,'?�동 ?�택');
    const n5=createNode('btleaf',  800,130,null,'Attack');
    const n6=createNode('btleaf',  800,250,null,'Fallback');
    const n7=createNode('btleaf',  330,320,null,'Patrol');

    createEdge(n1,n2,'r','l',null,'','');
    createEdge(n2,n3,'r','l',null,'조건','');
    createEdge(n2,n4,'b','l',null,'?�행','');
    createEdge(n4,n5,'r','l',null,'?�공','');
    createEdge(n4,n6,'b','l',null,'?�패','');
    createEdge(n1,n7,'b','t',null,'기본','');
    return 'BehaviorTree_Demo';
  }
  if(modeKey==='sc'){
    const n1=createNode('sclife',  70, 90,null,':Player');
    const n2=createNode('sclife', 380, 90,null,':NPC');
    const n3=createNode('sclife', 700, 90,null,':Server');
    createNode('scnote', 360, 20,null,'Quest Start');
    createNode('scfrag', 240,220,null,'loop');

    const e1=createEdge(n1,n2,'r','l',null,'?�용???�력','?�???�작');
    const e2=createEdge(n2,n3,'r','l',null,'QuestReq','검�??�청');
    const e3=createEdge(n3,n2,'l','r',null,'QuestData','?�이???�답');
    const e4=createEdge(n2,n1,'l','r',null,'UI Update','?�면 갱신');
    const e5=createEdge(n1,n3,'r','l',null,'Complete','?�료 보고');
    [e1,e2,e3,e4,e5].forEach(eid=>setEdgeStyle(eid,'straight'));
    return 'SequenceChart_Demo';
  }
  if(modeKey==='cd'){
    try{
    const n3=createNode('cdclass', 300, 50, null, 'Person', {
      cd_attributes: '+ id: int\n+ name: string\n+ email: string',
      cd_methods: '+ toString(): string\n+ equals(o): bool'
    });
    const n1=createNode('cdclass', 80, 280, null, 'User', {
      cd_attributes: '+ habits: list\n+ habitNum: int\n+ coach: Coach',
      cd_methods: '+ newUser(s): int\n+ displayHabits(): list'
    });
    const n2=createNode('cdclass', 530, 280, null, 'Coach', {
      cd_attributes: '+ users: list\n+ rating: float',
      cd_methods: '+ newCoach(s): int\n+ addUser(id): bool\n+ deleteUser(id): bool'
    });
    const n4=createNode('cdinterface', 830, 50, null, 'Serializable', {
      cd_attributes: '',
      cd_methods: '+ serialize(): string\n+ deserialize(s): void'
    });
    const n5=createNode('cdenum', 830, 280, null, 'UserRole', {
      cd_attributes: 'ADMIN\nMODERATOR\nUSER\nGUEST',
      cd_methods: ''
    });

    if(n1&&n2&&n3&&n4&&n5){
      // Inheritance: User ??Person, Coach ??Person
      const e1=createEdge(n1,n3,'t','b',null,'',''); // User inherits Person
      const e2=createEdge(n2,n3,'t','b',null,'',''); // Coach inherits Person
      const e3=createEdge(n1,n4,'r','b',null,'',''); // User implements Serializable
      const e4=createEdge(n1,n2,'r','l',null,'coach',''); // User aggregates Coach
      if(e1){ edges[e1].relation='inherit'; setEdgeStyle(e1,'straight'); renderEdge(e1); }
      if(e2){ edges[e2].relation='inherit'; setEdgeStyle(e2,'straight'); renderEdge(e2); }
      if(e3){ edges[e3].relation='implement'; setEdgeStyle(e3,'straight'); renderEdge(e3); }
      if(e4){ edges[e4].relation='aggregate'; setEdgeStyle(e4,'straight'); renderEdge(e4); }
    }
    [n1,n2,n3,n4,n5].filter(Boolean).forEach(id=>renderNode(id));
    }catch(err){console.error('CD demo error:', err);}
    return 'ClassDiagram_Demo';
  }
  // default: flowchart
  const n1=createNode('terminal',  60,200,null,'Game Start');
  const n2=createNode('screen',   270,120,null,'메인 로비',   {ui_id:'UI_LOBBY_001'});
  const n3=createNode('decision', 500,110,null,'?�벨 ??10',  {required_level:'10'});
  const n4=createNode('popup',    740, 50,null,'?�벨 부�?,   {message:'Level 10 required'});
  const n5=createNode('screen',   740,165,null,'?�점 메인',   {ui_id:'UI_SHOP_MAIN'});
  const n6=createNode('popup',    970,165,null,'구매 ?�인',   {item_id:'SWORD_001'});
  const n7=createNode('system',   970,300,null,'결제 처리',   {action:'PROCESS_PAYMENT'});
  const n8=createNode('output',   740,300,null,'보상 지�?,   {reward:'SWORD_001'});

  createEdge(n1,n2,'r','l',null,'','');
  createEdge(n2,n3,'r','l',null,'','?�점 버튼');
  createEdge(n3,n4,'t','l',null,'No','');
  createEdge(n3,n5,'r','l',null,'Yes','');
  createEdge(n5,n6,'r','l',null,'','?�이???�택');
  createEdge(n6,n7,'b','t',null,'','구매 ?�인');
  createEdge(n7,n8,'l','r',null,'?�공','');
  createEdge(n4,n2,'b','b',null,'','?�기');
  return 'Shop_UI_Flow';
}
function spawnModeDemo(targetMode){
  const m=targetMode||mode;
  const defaults={
    fc:'Shop_UI_Flow', fsm:'FSM_Demo',
    bt:'BehaviorTree_Demo', sc:'SequenceChart_Demo',
    cd:'ClassDiagram_Demo'
  };
  const projectName=defaults[m]||'Demo';
  const lineStyle=(m==='sc'||m==='cd')?'straight':'step';
  const snap={
    project: projectName, mode:m, lineStyle,
    vx:80, vy:60, vs:1, nc:0, ec:0,
    history:[], historyIdx:-1, nodes:{}, edges:{}
  };
  addSheet(projectName, snap, {focusName:false});
  sheetEditingId=null;
  setMode(m);
  globalLineStyle=lineStyle;
  syncLineStyleButton();
  const builtName=buildDemoGraph(m);
  const finalName=builtName||projectName;
  el.pname.value=finalName;
  onPnameInput(finalName);
  renderSheetBar();
  fitAll();
  saveState('?�시 ?�성: '+m.toUpperCase());
}
function loadDemo(){
  // Attach UI event listeners that were previously inline
  if(el.helpBtn && el.helpModal){
    el.helpBtn.addEventListener('click',()=>{ el.helpModal.style.display='flex'; });
  }
  if(el.helpClose && el.helpModal){
    el.helpClose.addEventListener('click',()=>{ el.helpModal.style.display='none'; });
  }

  // global delegation for closing modals using data-cm attribute
  document.body.addEventListener('click', e => {
    const t = e.target;
    const cmid = t.dataset.cm;
    if(cmid) cm(cmid);
  });
  setMode('fc');
  globalLineStyle='step';
  syncLineStyleButton();
  const name=buildDemoGraph('fc');
  el.pname.value=name;
  onPnameInput(name);
  fitAll();
  saveState('초기 ?�모 로드');
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// SHEET SYSTEM
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

let _sheetIdCnt = 0;
function newSheetId(){ return 'sh' + (++_sheetIdCnt); }

// ?�재 캔버???�태�??�냅?�으�??�집
function snapshotCurrent(){
  return {
    project: el.pname.value || 'Untitled',
    mode, lineStyle: globalLineStyle,
    vx, vy, vs, gridSnap,
    nc, ec,
    history: JSON.parse(JSON.stringify(history)),
    historyIdx,
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

// ?�냅?�을 ?�재 캔버?�에 복원
function restoreSnapshot(snap){
  if(demoTimer){ clearTimeout(demoTimer); demoTimer=null; }
  // ?�태 초기??
  nodes={}; edges={}; selId=null; selSet.clear(); connecting=null; reconnecting=null;
  clearConnectVisuals();
  NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';

  // 복원
  nc = snap.nc||0; ec = snap.ec||0;
  globalLineStyle = snap.lineStyle||'step';
  const lsBtn = document.getElementById('lstyle-btn');
  if(lsBtn){
    if(globalLineStyle==='step'){
      lsBtn.textContent='??';
      lsBtn.setAttribute('data-tip','???��??? 꺾�???);
      lsBtn.setAttribute('data-tip-sub','?�애물을 ?�동?�로 ?�하??직각 경로');
    } else if(globalLineStyle==='straight'){
      lsBtn.textContent='?��';
      lsBtn.setAttribute('data-tip','???��??? 직선');
      lsBtn.setAttribute('data-tip-sub','출발?�과 ?�착?�을 직선?�로 ?�결');
    } else {
      lsBtn.textContent='??;
      lsBtn.setAttribute('data-tip','???��??? 곡선');
      lsBtn.setAttribute('data-tip-sub','베�???곡선?�로 부?�럽�??�결');
    }
  }
  el.pname.value = snap.project||'Untitled';
  if(snap.mode) setMode(snap.mode);
  vx = snap.vx||80; vy = snap.vy||60; vs = snap.vs||1;
  if(snap.gridSnap !== undefined && snap.gridSnap !== gridSnap){
    gridSnap = false; // toggleGrid가 반전?��?�?목표 ?�태 ???�계�??�팅
    if(snap.gridSnap) toggleGrid();
  }
  applyVP();

  // ?�드/?��? ?�생??(renderNode/renderEdge 직접 ?�출)
  Object.values(snap.nodes||{}).forEach(n=>{
    nodes[n.id]=Object.assign({},n);
    renderNode(n.id);
  });
  Object.values(snap.edges||{}).forEach(e=>{
    edges[e.id]=Object.assign({},e);
    renderEdge(e.id);
  });

  history = snap.history ? JSON.parse(JSON.stringify(snap.history)) : [];
  historyIdx = snap.historyIdx !== undefined ? snap.historyIdx : -1;

  updateInspector(); updateStatus();
}

function beginSheetRename(id){
  if(id!==activeSheetId) return;
  sheetEditingId=id;
  renderSheetBar();
  setTimeout(()=>{
    const inp=document.querySelector(`.stab[data-sid="${id}"] .stab-name`);
    if(inp){ inp.focus(); inp.select(); }
  },20);
}

// ?�트 ???�더�?
function renderSheetBar(){
  const bar = document.getElementById('sheet-bar');
  // 기존 ??�� ?�거 (+ 버튼 ?��?)
  bar.querySelectorAll('.stab').forEach(el=>el.remove());
  const addBtn = document.getElementById('sheet-add');

  sheets.forEach(sh=>{
    const tab = document.createElement('div');
    tab.className = 'stab' + (sh.id===activeSheetId?' on':'');
    if(sh.id===sheetEditingId) tab.classList.add('editing');
    tab.dataset.sid = sh.id;

    const nameEl = document.createElement('input');
    nameEl.className = 'stab-name';
    nameEl.type = 'text';
    nameEl.value = sh.name;
    nameEl.title = sh.name;
    const isEditing = (sh.id===sheetEditingId);
    nameEl.readOnly = !isEditing;
    if(!isEditing) nameEl.setAttribute('tabindex','-1');

    // ?�트 ?�름 ?�집 ?�료
    nameEl.addEventListener('blur', ()=>{
      if(sheetEditingId!==sh.id) return;
      const v = nameEl.value.trim() || sh.name;
      nameEl.value = v;
      sh.name = v;
      // ?�성 ?�트?�면 ?�단 pname???�기??
      if(sh.id === activeSheetId)
        el.pname.value = v;
      sheetEditingId = null;
      renderSheetBar();
    });
    nameEl.addEventListener('keydown', e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        nameEl.blur();
      }
      if(e.key==='Escape'){
        e.preventDefault();
        nameEl.value=sh.name;
        sheetEditingId=null;
        renderSheetBar();
      }
      e.stopPropagation();
    });
    nameEl.addEventListener('mousedown', e=>{
      if(sheetEditingId!==sh.id) e.preventDefault();
      e.stopPropagation();
    });

    const closeBtn = document.createElement('span');
    closeBtn.className = 'stab-close';
    closeBtn.textContent = '×';
    closeBtn.title = '?�트 ??��';
    closeBtn.addEventListener('click', ev=>{
      ev.stopPropagation();
      removeSheet(sh.id);
    });

    tab.appendChild(nameEl);
    if(sheets.length > 1) tab.appendChild(closeBtn);

    tab.addEventListener('mousedown', e=>{
      if(e.target === closeBtn) return;
      if(sh.id===sheetEditingId) return;
      switchSheet(sh.id);
    });
    tab.addEventListener('dblclick', e=>{
      if(e.target===closeBtn) return;
      if(sh.id!==activeSheetId) switchSheet(sh.id);
      beginSheetRename(sh.id);
      e.stopPropagation();
    });

    bar.insertBefore(tab, addBtn);
  });

  // ?�팁 ?�로 바인??(?�트 ?�름, ??�� 버튼)
  if(typeof refreshTooltips === 'function') refreshTooltips();
}

// ?�트 ?�환
function switchSheet(id){
  if(id === activeSheetId) return;
  sheetEditingId = null;
  // ?�재 ?�트 ?�??
  const cur = sheets.find(s=>s.id===activeSheetId);
  if(cur) cur.data = snapshotCurrent();
  // ???�트�??�동
  activeSheetId = id;
  const next = sheets.find(s=>s.id===id);
  if(next) restoreSnapshot(next.data);
  renderSheetBar();
  // After switching sheets, clear selection and update inspector/status
  clearSel();
  updateInspector();
  updateStatus();
}

// ???�트 추�?
function addSheet(name, snapData, options){
  const opts=options||{};
  const focusNameEdit = opts.focusName !== false;
  const id = newSheetId();
  const sheetNum = sheets.length + 1;
  const shName = name || '?�트' + sheetNum;
  const emptySnap = snapData || {
    project: shName, mode:'fc', lineStyle:'step',
    vx:80, vy:60, vs:1, nc:0, ec:0,
    history:[], historyIdx:-1, nodes:{}, edges:{}
  };
  emptySnap.project = shName;
  sheets.push({ id, name: shName, data: emptySnap });

  // ?�재 ?�트 ?�???????�트�??�환
  const cur = sheets.find(s=>s.id===activeSheetId);
  if(cur) cur.data = snapshotCurrent();
  activeSheetId = id;
  restoreSnapshot(emptySnap);
  sheetEditingId = id;
  renderSheetBar();
  // ???�트�??�환 ???�택 �??�성??초기??
  clearSel();
  updateInspector();
  updateStatus();
  // ?�트 ?�성 ???�팁 ?�바?�딩
  if(typeof refreshTooltips === 'function') refreshTooltips();
  // ?????�름 ?�집 ?�커??
  if(focusNameEdit){
    setTimeout(()=>{
      const tab = document.querySelector(`.stab[data-sid="${id}"] .stab-name`);
      if(tab){ tab.focus(); tab.select(); }
    }, 50);
  }else{
    sheetEditingId = null;
    renderSheetBar();
  }
  return id;
}

// ?�트 ??��
function removeSheet(id){
  if(sheets.length <= 1){ showAlert('마�?�??�트????��?????�습?�다.'); return; }
  const idx = sheets.findIndex(s=>s.id===id);
  sheets.splice(idx, 1);
  if(sheetEditingId===id) sheetEditingId=null;
  if(activeSheetId === id){
    const newIdx = Math.min(idx, sheets.length-1);
    activeSheetId = sheets[newIdx].id;
    restoreSnapshot(sheets[newIdx].data);
  }
  renderSheetBar();
}

// ?�단 pname 변�??????�재 ?�트 ?�름???�기??
function onPnameInput(val){
  const sh = sheets.find(s=>s.id===activeSheetId);
  if(sh){
    sh.name = val || sh.name;
    renderSheetBar();
  }
}

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// TOOLTIP ENGINE  (data-tip / data-tip-sub / data-tip-key)
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
(function initTooltip(){
  const tt   = document.getElementById('tooltip');
  const ttT  = document.getElementById('tip-title');
  const ttS  = document.getElementById('tip-sub');
  const ttK  = document.getElementById('tip-kbd');
  let showTimer = null, hideTimer = null;

  function show(el){
    const title = el.dataset.tip;
    if(!title) return;
    clearTimeout(hideTimer);

    ttT.textContent = title;

    const sub = el.dataset.tipSub || '';
    ttS.textContent = sub;
    ttS.style.display = sub ? '' : 'none';

    const key = el.dataset.tipKey || '';
    if(key){
      ttK.innerHTML = key.split(' ').map((k,i)=>
        i===0 ? `<span class="tip-key">${k}</span>`
              : `<span class="tip-sep"></span><span class="tip-key">${k}</span>`
      ).join('');
      ttK.style.display = '';
    } else {
      ttK.innerHTML = '';
      ttK.style.display = 'none';
    }

    tt.style.display = 'block';
    // position
    const r = el.getBoundingClientRect();
    const tw = tt.offsetWidth, th2 = tt.offsetHeight;
    let left = r.left + r.width/2 - tw/2;
    let top  = r.top - th2 - 10;
    let below = false;
    if(top < 8){ top = r.bottom + 10; below = true; }
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    tt.style.left = left + 'px';
    tt.style.top  = top  + 'px';
    tt.classList.toggle('tip-below', below);
    // fade in
    requestAnimationFrame(()=>{ tt.classList.add('visible'); });
  }

  function hide(){
    tt.classList.remove('visible');
    hideTimer = setTimeout(()=>{ tt.style.display='none'; }, 160);
  }

  document.addEventListener('mouseover', e=>{
    const el = e.target.closest('[data-tip]');
    if(!el){ clearTimeout(showTimer); return; }
    showTimer = setTimeout(()=> show(el), 220);
  });
  document.addEventListener('mouseout', e=>{
    const el = e.target.closest('[data-tip]');
    if(!el) return;
    clearTimeout(showTimer);
    hide();
  });
  // ?�릭 ??즉시 ?��?
  document.addEventListener('mousedown', ()=>{ clearTimeout(showTimer); hide(); });
})();

// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
// INIT
// ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
(function initSheets(){
  const firstId = newSheetId();
  sheets.push({ id: firstId, name: 'Shop_UI_Flow', data: null });
  activeSheetId = firstId;
  // pname ?�력 ???�트 ?�름 ?�기??
  el.pname.addEventListener('input', e=>{
    onPnameInput(e.target.value.trim());
  });
  applyVP();
  loadDemo(); // ?�모�?�??�트??로드
  renderSheetBar();
  // 초기 ?�더 ???�팁 바인??
  if(typeof refreshTooltips === 'function') refreshTooltips();
  fitAll();
})();
