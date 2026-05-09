// ══════════════════════════════════════════════════
// STATE & HELPERS
// ══════════════════════════════════════════════════
const NS='http://www.w3.org/2000/svg';
let nodes={},edges={},selId=null,selSet=new Set(),nc=0,ec=0,mode='fc';
let vx=80,vy=60,vs=1,lightMode=false;
let gridSnap=false;   // 그리드 스냅 on/off
let drag=null;
let connecting=null; // Click-to-connect state
let reconnecting=null; // Edge endpoint reconnect drag state
let capSVG='';
let globalLineStyle = 'step'; // 기본 선 스타일 꺾은선으로 유지
let demoTimer = null; // 초기화 시 데모 복원 방지
const MAX_STEP_BENDS = 4; // 꺾은선 내부 꺾임 최대 개수
// Throttled edge redraw queue (for smoother multi-node dragging)
let edgeRedrawRAF = 0;
let edgeRedrawAll = false;
const edgeRedrawSet = new Set();

// ── bbox 캐시 ──
// orthoRoute/polyHits 등에서 매번 전체 노드를 순회해 bbox 배열을 생성하는 O(N) 비용을
// 캐시로 줄임. 노드 추가/이동/삭제/크기변경 시 invalidate.
let _bboxCacheDirty = true;
let _bboxCacheHard  = []; // {nid, x0,y0,x1,y1} — HARD_PAD=6 적용
let _bboxCacheSoft  = []; // {nid, x0,y0,x1,y1} — SOFT_PAD=22 적용
const BBOX_HARD_PAD = 6;
const BBOX_SOFT_PAD = 22;

function invalidateBboxCache(){ _bboxCacheDirty=true; }

function getBboxCache(){
  if(!_bboxCacheDirty) return {hard:_bboxCacheHard, soft:_bboxCacheSoft};
  _bboxCacheHard=[];
  _bboxCacheSoft=[];
  for(const nid of Object.keys(nodes)){
    const n=nodes[nid];
    const x0=n.x, y0=n.y, x1=n.x+nW(n), y1=n.y+nH(n);
    _bboxCacheHard.push({nid, x0:x0-BBOX_HARD_PAD, y0:y0-BBOX_HARD_PAD, x1:x1+BBOX_HARD_PAD, y1:y1+BBOX_HARD_PAD});
    _bboxCacheSoft.push({nid, x0:x0-BBOX_SOFT_PAD, y0:y0-BBOX_SOFT_PAD, x1:x1+BBOX_SOFT_PAD, y1:y1+BBOX_SOFT_PAD});
  }
  _bboxCacheDirty=false;
  return {hard:_bboxCacheHard, soft:_bboxCacheSoft};
}

// ── History (Undo/Redo) Variables ──
let history = [], historyIdx = -1;

// ── Sheet System ──
let sheets = [];       // [{id, name, data}] — 각 시트의 저장된 상태
let activeSheetId = null;
let sheetEditingId = null;
// 노드 레이블 수정 시 사용할 대상 id
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

function cm(id){document.getElementById(id).style.display='none';}
function bgc(e,id){if(e.target===e.currentTarget)cm(id);}
function mk(tag){return document.createElementNS(NS,tag);}
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

// ── History Functions ──
function saveState(lbl="상태 변경") {
  // If we made changes while in the past, discard the future redo history
  if(historyIdx < history.length - 1) history = history.slice(0, historyIdx + 1);
  const state = JSON.stringify({nodes, edges, nc, ec});
  // Prevent duplicate consecutive states
  if(history.length > 0 && history[historyIdx].data === state) return;
  const time = new Date().toLocaleTimeString('ko-KR', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
  history.push({data: state, label: lbl, time});
  // shift()로 앞을 제거하든 안 하든, 항상 historyIdx를 끝으로 맞춤
  if(history.length > 50) history.shift();
  historyIdx = history.length - 1;
}

function restoreState(stateStr) {
  if(!stateStr) return;
  const state = JSON.parse(stateStr);
  nodes = JSON.parse(JSON.stringify(state.nodes));
  edges = JSON.parse(JSON.stringify(state.edges));
  nc = state.nc; ec = state.ec;
  connecting = null; reconnecting = null;
  clearConnectVisuals();
  invalidateBboxCache();
  NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';
  Object.keys(nodes).forEach(id => renderNode(id));
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
    list.innerHTML = '<div style="padding:20px; color:var(--tx2); text-align:center;">저장된 작업 내역이 없습니다.</div>';
  } else {
    // Show newest first (reverse index order visually)
    list.innerHTML = history.map((h, i) => `
      <div class="hi-item ${i === historyIdx ? 'on' : ''}" onclick="jumpHistory(${i})">
        <span style="color:var(--tx2); width:35px; font-family:'JetBrains Mono',monospace;">#${i+1}</span>
        <span style="flex:1; color:var(--tx); font-weight:500;">${h.label}</span>
        <span style="color:var(--txd); font-family:'JetBrains Mono',monospace; font-size:10px;">${h.time}</span>
        ${i === historyIdx ? '<span style="color:var(--ac); font-weight:bold; margin-left:8px; width:40px; text-align:right;">(현재)</span>' : '<span style="width:48px;"></span>'}
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


