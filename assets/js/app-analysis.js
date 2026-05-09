// ══════════════════════════════════════════════════
// VALIDATE  (무한루프 검증 포함)
// ══════════════════════════════════════════════════

/* DFS 기반 사이클(무한루프) 탐지 — FIX: 사이클 정규화로 중복 보고 제거 */
function detectCycles(){
  const visited=new Set(), recStack=new Set();
  const rawCycles=[];

  // 인접 맵 1회 빌드 — DFS 중 매 노드마다 edges 전체 순회하는 O(N×M) 방지
  const outMap={};
  Object.values(edges).forEach(e=>{
    if(!outMap[e.from]) outMap[e.from]=[];
    outMap[e.from].push(e);
  });

  function dfs(nid, path){
    visited.add(nid);
    recStack.add(nid);
    const outs=outMap[nid]||[];
    for(const edge of outs){
      const next=edge.to;
      if(!nodes[next]||!nodes[nid]) continue;
      if(!visited.has(next)){
        dfs(next, [...path, nid]);
      } else if(recStack.has(next)){
        const idx=path.indexOf(next);
        const loop=idx>=0 ? [...path.slice(idx), nid] : [...path, nid];
        rawCycles.push({path:[...loop, next], via: edge.label||edge.name||''});
      }
    }
    recStack.delete(nid);
  }
  Object.keys(nodes).forEach(id=>{ if(!visited.has(id)) dfs(id,[]); });

  const seen=new Set();
  return rawCycles.filter(c=>{
    const core=c.path.slice(0,-1);
    const minIdx=core.indexOf(core.reduce((a,b)=>a<b?a:b));
    const key=[...core.slice(minIdx),...core.slice(0,minIdx)].join(',');
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// ══════════════════════════════════════════════════
// FULL KEY MAPPING SYSTEM  v2
// ══════════════════════════════════════════════════

/* ── 카테고리 정의 ── */
const SC_CATEGORIES = ['편집', '보기', '레이아웃', '파일', '도구'];

/* ── 기본 바인딩 정의 (action → {key, ctrl, shift, alt, label, category}) ──
   handler 함수는 ACTION_HANDLERS 맵에서 별도 관리 (직렬화 가능한 순수 데이터 분리) */
const defaultKeyBindings = {
  // 편집
  undo:        {key:'z',      ctrl:true,  shift:false,alt:false, label:'실행 취소',           category:'편집'},
  redo:        {key:'y',      ctrl:true,  shift:false,alt:false, label:'다시 실행',            category:'편집'},
  redoAlt:     {key:'z',      ctrl:true,  shift:true, alt:false, label:'다시 실행 (Shift+Z)', category:'편집'},
  copy:        {key:'c',      ctrl:true,  shift:false,alt:false, label:'복사',                category:'편집'},
  paste:       {key:'v',      ctrl:true,  shift:false,alt:false, label:'붙여넣기',            category:'편집'},
  selectAll:   {key:'a',      ctrl:true,  shift:false,alt:false, label:'전체 선택',           category:'편집'},
  del:         {key:'Delete', ctrl:false, shift:false,alt:false, label:'삭제',                category:'편집'},
  escape:      {key:'Escape', ctrl:false, shift:false,alt:false, label:'선택 취소 / 연결 취소', category:'편집'},
  rename:      {key:'F2',     ctrl:false, shift:false,alt:false, label:'레이블 수정',          category:'편집'},
  // 보기
  fitAll:      {key:'f',      ctrl:false, shift:false,alt:false, label:'전체 보기 (Fit)',     category:'보기'},
  zoomIn:      {key:'=',      ctrl:false, shift:false,alt:false, label:'확대',                category:'보기'},
  zoomOut:     {key:'-',      ctrl:false, shift:false,alt:false, label:'축소',                category:'보기'},
  resetView:   {key:'Home',   ctrl:false, shift:false,alt:false, label:'뷰 초기화',            category:'보기'},
  toggleTheme: {key:'t',      ctrl:false, shift:false,alt:true,  label:'테마 전환 (다크/라이트)', category:'보기'},
  toggleGrid:  {key:'g',      ctrl:false, shift:false,alt:false, label:'그리드 스냅 토글',    category:'보기'},
  // 레이아웃
  autoLayoutH: {key:'h',      ctrl:false, shift:false,alt:true,  label:'가로 자동 정렬',      category:'레이아웃'},
  autoLayoutV: {key:'v',      ctrl:false, shift:false,alt:true,  label:'세로 자동 정렬',      category:'레이아웃'},
  toggleLine:  {key:'l',      ctrl:false, shift:false,alt:false, label:'선 스타일 전환',      category:'레이아웃'},
  nodeFront:   {key:']',      ctrl:false, shift:false,alt:false, label:'노드 맨 앞으로',      category:'레이아웃'},
  nodeBack:    {key:'[',      ctrl:false, shift:false,alt:false, label:'노드 맨 뒤로',        category:'레이아웃'},
  // 파일
  exportJSON:  {key:'s',      ctrl:true,  shift:false,alt:false, label:'내보내기 (JSON)',     category:'파일'},
  capture:     {key:'p',      ctrl:true,  shift:false,alt:false, label:'캡처 (PNG/SVG)',      category:'파일'},
  openImport:  {key:'o',      ctrl:true,  shift:false,alt:false, label:'가져오기',            category:'파일'},
  // 도구
  openHistory: {key:'h',      ctrl:true,  shift:false,alt:false, label:'작업 내역',            category:'도구'},
  validate:    {key:'F8',     ctrl:false, shift:false,alt:false, label:'플로우 검증',          category:'도구'},
  codeReview:  {key:'F9',     ctrl:false, shift:false,alt:false, label:'코드 리뷰',            category:'도구'},
  logicTrace:  {key:'F10',    ctrl:false, shift:false,alt:false, label:'로직 트레이스',        category:'도구'},
  shortcuts:   {key:'F11',    ctrl:false, shift:false,alt:false, label:'단축키 설정 열기',    category:'도구'},
};

/* ── 프리셋 정의 ── */
const SC_PRESETS = {
  default: JSON.parse(JSON.stringify(defaultKeyBindings)),
  figma: {
    ...JSON.parse(JSON.stringify(defaultKeyBindings)),
    undo:       {key:'z',    ctrl:true,  shift:false,alt:false, label:'실행 취소',    category:'편집'},
    redo:       {key:'z',    ctrl:true,  shift:true, alt:false, label:'다시 실행',   category:'편집'},
    redoAlt:    {key:'y',    ctrl:true,  shift:false,alt:false, label:'다시 실행 (Y)', category:'편집'},
    fitAll:     {key:'1',    ctrl:false, shift:false,alt:false, label:'전체 보기',    category:'보기'},
    zoomIn:     {key:'+',    ctrl:false, shift:false,alt:false, label:'확대',         category:'보기'},
    zoomOut:    {key:'-',    ctrl:false, shift:false,alt:false, label:'축소',         category:'보기'},
    toggleGrid: {key:'\'',   ctrl:false, shift:false,alt:false, label:'그리드 토글', category:'보기'},
    rename:     {key:'r',    ctrl:false, shift:false,alt:false, label:'레이블 수정', category:'편집'},
  },
  vim: {
    ...JSON.parse(JSON.stringify(defaultKeyBindings)),
    undo:       {key:'u',    ctrl:false, shift:false,alt:false, label:'실행 취소',    category:'편집'},
    redo:       {key:'r',    ctrl:true,  shift:false,alt:false, label:'다시 실행',   category:'편집'},
    fitAll:     {key:'zf',   ctrl:false, shift:false,alt:false, label:'전체 보기',    category:'보기'},
    zoomIn:     {key:'+',    ctrl:false, shift:false,alt:false, label:'확대',         category:'보기'},
    zoomOut:    {key:'-',    ctrl:false, shift:false,alt:false, label:'축소',         category:'보기'},
    del:        {key:'x',    ctrl:false, shift:false,alt:false, label:'삭제',         category:'편집'},
    selectAll:  {key:'a',    ctrl:false, shift:false,alt:false, label:'전체 선택',   category:'편집'},
  },
};

/* ── 액션 핸들러 맵 (데이터와 로직 분리) ── */
function getActionHandlers(){
  return {
    undo:        ()=>undo(),
    redo:        ()=>redo(),
    redoAlt:     ()=>redo(),
    copy:        ()=>copySelection(),
    paste:       ()=>pasteSelection(),
    selectAll:   ()=>doSelectAll(),
    del:         ()=>doDelete(),
    escape:      ()=>{ if(connecting)cancelConnect(); if(reconnecting)cancelReconnect(); clearSel(); },
    rename:      ()=>{ if(selId&&!selId.startsWith('edge:')&&nodes[selId]) beginRenameNode(selId); },
    fitAll:      ()=>fitAll(),
    zoomIn:      ()=>zBy(0.1),
    zoomOut:     ()=>zBy(-0.1),
    resetView:   ()=>resetV(),
    toggleTheme: ()=>toggleTheme(),
    toggleGrid:  ()=>toggleGrid(),
    autoLayoutH: ()=>autoLayout('h'),
    autoLayoutV: ()=>autoLayout('v'),
    toggleLine:  ()=>toggleLineStyle(),
    nodeFront:   ()=>{ if(selId&&!selId.startsWith('edge:')) nodeToFront(selId); },
    nodeBack:    ()=>{ if(selId&&!selId.startsWith('edge:')) nodeToBack(selId); },
    exportJSON:  ()=>exportJSON(),
    capture:     ()=>captureFlow(),
    openImport:  ()=>openImport(),
    openHistory: ()=>openHistory(),
    validate:    ()=>validateFlow(),
    codeReview:  ()=>openCodeReview(),
    logicTrace:  ()=>openLogicTrace(),
    shortcuts:   ()=>openShortcutSettings(),
  };
}

/* ── 헬퍼: 두 항목이 같은 키 조합인지 비교 ── */
function sameBinding(a, b){
  return a.key.toLowerCase()===b.key.toLowerCase()
      && !!a.ctrl===!!b.ctrl
      && !!a.shift===!!b.shift
      && !!a.alt===!!b.alt;
}

/* ── 충돌 계산 ── */
function getConflicts(bindings){
  const conflicts=new Set();
  const entries=Object.entries(bindings);
  entries.forEach(([a,ka],i)=>{
    entries.forEach(([b,kb],j)=>{
      if(i>=j) return;
      if(sameBinding(ka,kb)){ conflicts.add(a); conflicts.add(b); }
    });
  });
  return conflicts;
}

/* ── 현재 바인딩 (mutable) ── */
let keyBindings = JSON.parse(JSON.stringify(defaultKeyBindings));
let currentPreset = 'default';

/* ── localStorage 로드 (deep merge로 label/category 보존) ── */
try{
  const saved=localStorage.getItem('gfc_keybindings_v2');
  if(saved){
    const parsed=JSON.parse(saved);
    // FIX: deep merge — 저장된 key/ctrl/shift/alt만 덮어쓰고, label/category는 default에서 유지
    Object.keys(defaultKeyBindings).forEach(action=>{
      if(parsed[action]){
        keyBindings[action]={
          ...defaultKeyBindings[action],
          key:   parsed[action].key   ?? defaultKeyBindings[action].key,
          ctrl:  parsed[action].ctrl  ?? defaultKeyBindings[action].ctrl,
          shift: parsed[action].shift ?? defaultKeyBindings[action].shift,
          alt:   parsed[action].alt   ?? defaultKeyBindings[action].alt,
        };
      }
    });
    currentPreset = parsed._preset || 'custom';
  }
}catch(_){}

let capturingAction=null;

function openShortcutSettings(){
  renderShortcutModal();
  document.getElementById('m-shortcuts').style.display='flex';
}

function renderShortcutModal(){
  const body=document.getElementById('m-sc-body');
  const searchVal=(document.getElementById('sc-search')?.value||'').toLowerCase();
  const conflicts=getConflicts(keyBindings);

  // 충돌 표시
  const conflictCount=conflicts.size;
  const cc=document.getElementById('sc-conflict-count');
  if(cc){
    if(conflictCount){cc.textContent=`⚠ 충돌 ${conflictCount/2|0}건`;cc.style.display='';}
    else{cc.style.display='none';}
  }

  // 프리셋 버튼 활성화 표시
  ['default','figma','vim'].forEach(p=>{
    document.getElementById('sc-p-'+p)?.classList.toggle('active', currentPreset===p);
  });
  document.getElementById('sc-p-custom')?.style.setProperty('display', currentPreset==='custom'?'':'none');
  if(currentPreset==='custom') document.getElementById('sc-p-custom')?.classList.add('active');

  let html='';
  SC_CATEGORIES.forEach(cat=>{
    const actions=Object.entries(keyBindings).filter(([a,kb])=>{
      if(kb.category!==cat) return false;
      if(!searchVal) return true;
      return kb.label.toLowerCase().includes(searchVal) || formatKeyStr(kb).toLowerCase().includes(searchVal);
    });
    if(!actions.length) return;
    html+=`<div class="sc-cat-hdr">${cat}</div>`;
    actions.forEach(([action,kb])=>{
      const keyStr=formatKeyStr(kb);
      const isConflict=conflicts.has(action);
      html+=`<div class="sc-row${isConflict?' sc-conflict':''}">
        <span class="sc-label">${kb.label}</span>
        ${isConflict?`<span class="sc-conflict-badge">⚠ 충돌</span>`:''}
        <span class="sc-key${isConflict?' sc-conflict-key':''}" id="sc-btn-${action}" onclick="startCapture('${action}')">${keyStr}</span>
        <button class="sc-reset" onclick="resetOneShortcut('${action}')" title="기본값으로 복원">↺</button>
      </div>`;
    });
  });

  body.innerHTML=html+'<div style="font-size:10px;color:var(--txd);margin-top:8px;padding:0 4px;">키 배지를 클릭하면 새 단축키를 입력합니다. <b>Esc</b>로 취소.</div>';
}

function formatKeyStr(kb){
  const parts=[];
  if(kb.ctrl)  parts.push('Ctrl');
  if(kb.alt)   parts.push('Alt');
  if(kb.shift) parts.push('Shift');
  let k=kb.key;
  const aliases={'Delete':'Del','Escape':'Esc',' ':'Space','ArrowLeft':'←','ArrowRight':'→','ArrowUp':'↑','ArrowDown':'↓'};
  k=aliases[k]||(k.length===1?k.toUpperCase():k);
  parts.push(k);
  return parts.join(' + ');
}

function startCapture(action){
  // 기존 캡처 취소
  if(capturingAction){
    const prev=document.getElementById('sc-btn-'+capturingAction);
    if(prev){ prev.classList.remove('capturing'); prev.textContent=formatKeyStr(keyBindings[capturingAction]); }
  }
  capturingAction=action;
  const btn=document.getElementById('sc-btn-'+action);
  if(btn){ btn.classList.add('capturing'); btn.textContent='눌러주세요...'; }
}

/* 캡처 전용 keydown (capture phase, 최우선 처리) */
document.addEventListener('keydown',function(e){
  if(!capturingAction) return;
  e.preventDefault(); e.stopPropagation();
  const action=capturingAction; capturingAction=null;
  const btn=document.getElementById('sc-btn-'+action);

  // Esc → 취소
  if(e.key==='Escape'){
    if(btn){ btn.classList.remove('capturing'); btn.textContent=formatKeyStr(keyBindings[action]); }
    return;
  }
  // 수정키 단독 → 무시
  if(['Control','Shift','Alt','Meta'].includes(e.key)){
    if(btn){ btn.classList.remove('capturing'); btn.textContent=formatKeyStr(keyBindings[action]); }
    return;
  }

  keyBindings[action]={
    ...keyBindings[action],
    key:  e.key,
    ctrl: e.ctrlKey||e.metaKey,
    shift:e.shiftKey,
    alt:  e.altKey,
  };
  currentPreset='custom';
  if(btn){ btn.classList.remove('capturing'); btn.textContent=formatKeyStr(keyBindings[action]); }
  renderShortcutModal();
},true);

function applyPreset(name){
  if(!SC_PRESETS[name]) return;
  keyBindings=JSON.parse(JSON.stringify(SC_PRESETS[name]));
  currentPreset=name;
  renderShortcutModal();
}

function resetOneShortcut(action){
  if(defaultKeyBindings[action]){
    keyBindings[action]={...defaultKeyBindings[action]};
    currentPreset='custom';
    renderShortcutModal();
  }
}

function resetAllShortcuts(){
  keyBindings=JSON.parse(JSON.stringify(defaultKeyBindings));
  currentPreset='default';
  try{ localStorage.removeItem('gfc_keybindings_v2'); }catch(_){}
  renderShortcutModal();
}

function saveShortcuts(){
  try{
    const toSave={};
    Object.entries(keyBindings).forEach(([a,kb])=>{ toSave[a]={key:kb.key,ctrl:kb.ctrl,shift:kb.shift,alt:kb.alt}; });
    toSave._preset=currentPreset;
    localStorage.setItem('gfc_keybindings_v2',JSON.stringify(toSave));
  }catch(_){}
  cm('m-shortcuts');
}

function exportBindings(){
  const out={_version:2,_preset:currentPreset};
  Object.entries(keyBindings).forEach(([a,kb])=>{ out[a]={key:kb.key,ctrl:kb.ctrl,shift:kb.shift,alt:kb.alt,label:kb.label,category:kb.category}; });
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='keybindings.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function importBindings(){
  document.getElementById('sc-import-file').click();
}

function onImportBindingsFile(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const parsed=JSON.parse(ev.target.result);
      Object.keys(defaultKeyBindings).forEach(action=>{
        if(parsed[action]){
          keyBindings[action]={
            ...defaultKeyBindings[action],
            key:   parsed[action].key   ?? defaultKeyBindings[action].key,
            ctrl:  parsed[action].ctrl  ?? defaultKeyBindings[action].ctrl,
            shift: parsed[action].shift ?? defaultKeyBindings[action].shift,
            alt:   parsed[action].alt   ?? defaultKeyBindings[action].alt,
          };
        }
      });
      currentPreset=parsed._preset||'custom';
      renderShortcutModal();
    }catch(err){ showAlert('가져오기 실패: '+err.message); }
  };
  reader.readAsText(file);
  e.target.value='';
}

/* ── FIX: matchKey — alt 플래그 검사 추가 ── */
function matchKey(e, binding){
  if(!binding) return false;
  return e.key.toLowerCase()===binding.key.toLowerCase()
    && !!(e.ctrlKey||e.metaKey)===!!binding.ctrl
    && !!e.shiftKey===!!binding.shift
    && !!e.altKey===!!binding.alt;   // alt 누락 버그 수정
}

/* ── 편집 액션 헬퍼 (keydown에서 직접 호출 가능하도록 분리) ── */
function doSelectAll(){
  selSet.clear();
  document.querySelectorAll('.ng.msel').forEach(el=>el.classList.remove('msel'));
  Object.keys(nodes).forEach(id=>{selSet.add(id);document.getElementById('ng-'+id)?.classList.add('msel');});
  document.getElementById('sts').textContent=`${selSet.size}개 선택`;
  updateInspector();
}
function doDelete(){
  if(selSet.size>0){
    const toDelete=[...selSet];
    clearSel();
    toDelete.forEach(id=>{
      document.getElementById('ng-'+id)?.remove(); delete nodes[id];
      Object.keys(edges).forEach(eid=>{if(edges[eid]?.from===id||edges[eid]?.to===id){removeEdgeDOM(eid);delete edges[eid];}});
    });
    invalidateBboxCache();
    updateStatus();
    saveState('다중 항목 삭제');
  } else if(selId){
    deleteSel();
  }
}
function beginRenameNode(id){
  const n=nodes[id]; if(!n) return;
  const inp=document.getElementById('rename-input'); if(!inp) return;
  renameTarget=id;
  inp.value=n.label||'';
  document.getElementById('m-rename').style.display='flex';
  setTimeout(()=>{inp.focus();inp.select();},50);
}

function validateFlow(){
  const issues=[];
  const pushIssue=(issue)=>issues.push(issue);
  document.querySelectorAll('.ng.bad').forEach(el=>el.classList.remove('bad'));
  const startT={fc:['terminal'],fsm:['initial'],bt:['btroot'],sc:['sclife']}[mode]||['terminal'];
  const endT=Object.keys(S).filter(k=>S[k].end);

  // 시작 노드 존재 여부
  if(!Object.values(nodes).some(n=>startT.includes(n.type)))
    pushIssue({i:'⚠',t:'시작 노드 없음 ('+startT.join('/')+' 타입 필요)',sev:'warn'});

  // 인접 맵 선빌드: 노드마다 edges 전체 순회하는 O(N×M) 방지
  const outMap={}, incMap={};
  Object.keys(nodes).forEach(id=>{ outMap[id]=[]; incMap[id]=[]; });
  Object.values(edges).forEach(e=>{
    if(outMap[e.from]) outMap[e.from].push(e);
    if(incMap[e.to])   incMap[e.to].push(e);
  });

  // 개별 노드 검사
  Object.keys(nodes).forEach(id=>{
    const n=nodes[id];
    const out=outMap[id]||[];
    const inc=incMap[id]||[];
    if(!out.length&&!inc.length){
      pushIssue({i:'🔴',t:`"${n.label||id}" (${id}): 고립된 노드`,sev:'error',nodeId:id});
      document.getElementById('ng-'+id)?.classList.add('bad');
      return;
    }
    if(!out.length&&!endT.includes(n.type))
      pushIssue({i:'🟡',t:`"${n.label||id}" (${id}): 출구 없음 (막힌 경로)`,sev:'warn',nodeId:id});
    if(!inc.length&&!startT.includes(n.type))
      pushIssue({i:'🟡',t:`"${n.label||id}" (${id}): 진입 없음`,sev:'warn',nodeId:id});
  });

  // ── 무한루프(사이클) 탐지 ──
  const cycles=detectCycles();
  const cycleNodeIds=new Set();
  if(cycles.length){
    cycles.forEach((c,ci)=>{
      const names=c.path.map(id=>{
        const n=nodes[id]; return n ? `"${n.label||id}"` : id;
      });
      // 사이클에 포함된 노드를 bad로 표시
      c.path.forEach(id=>{ cycleNodeIds.add(id); document.getElementById('ng-'+id)?.classList.add('bad'); });
      pushIssue({
        i:'🔁',
        t:`무한루프 감지 #${ci+1}: ${names.join(' → ')}`,
        sev:'loop',
        nodeId:c.path[0]
      });
    });
  }

  // 결과 렌더링 — DOM API로 XSS 방지
  const counts={error:0,warn:0,loop:0};
  issues.forEach(i=>{ if(i.sev) counts[i.sev]=(counts[i.sev]||0)+1; });

  const container=document.getElementById('m-val-b');
  container.innerHTML='';

  if(!issues.length){
    container.innerHTML='<div class="vok">✓ 검증 통과 (사이클 없음)</div>';
  } else {
    // 요약 헤더 (숫자만 있으므로 innerHTML 안전)
    const sumDiv=document.createElement('div');
    sumDiv.style.cssText='display:flex;gap:8px;margin-bottom:8px;font-size:11px;';
    if(counts.error){ const s=document.createElement('span'); s.style.color='#ff5555'; s.textContent=`🔴 오류 ${counts.error}`; sumDiv.appendChild(s); }
    if(counts.loop){  const s=document.createElement('span'); s.style.color='#ff9944'; s.textContent=`🔁 무한루프 ${counts.loop}`; sumDiv.appendChild(s); }
    if(counts.warn){  const s=document.createElement('span'); s.style.color='#ffcc44'; s.textContent=`🟡 경고 ${counts.warn}`; sumDiv.appendChild(s); }
    container.appendChild(sumDiv);

    const groups=[
      {key:'error', label:'오류', icon:'🔴'},
      {key:'loop', label:'무한루프', icon:'🔁'},
      {key:'warn', label:'경고', icon:'🟡'}
    ];
    groups.forEach(group=>{
      const items=issues.filter(issue=>issue.sev===group.key);
      if(!items.length) return;
      const block=document.createElement('section');
      block.className='val-group';
      const hdr=document.createElement('div');
      hdr.className='val-group-hdr';
      hdr.textContent=`${group.icon} ${group.label} ${items.length}`;
      block.appendChild(hdr);

      items.forEach(i=>{
        const col=i.sev==='error'?'rgba(255,50,50,.07)':i.sev==='loop'?'rgba(255,100,0,.1)':'rgba(255,200,0,.06)';
        const bc=i.sev==='error'?'rgba(255,50,50,.25)':i.sev==='loop'?'rgba(255,130,0,.3)':'rgba(255,200,0,.2)';
        const row=document.createElement('div');
        row.className='vi'; row.style.background=col; row.style.borderColor=bc;
        if(i.nodeId && nodes[i.nodeId]){
          row.classList.add('vi-clickable');
          row.title='클릭하면 해당 노드로 이동합니다';
          row.addEventListener('click', ()=>{
            cm('m-val');
            focusNodeInView(i.nodeId);
          });
        }
        const icon=document.createElement('div'); icon.textContent=i.i;
        const txt=document.createElement('div'); txt.className='vt'; txt.textContent=i.t;
        row.appendChild(icon); row.appendChild(txt);
        block.appendChild(row);
      });
      container.appendChild(block);
    });
  }
  document.getElementById('m-val').style.display='flex';
}

// ══════════════════════════════════════════════════
// CODE REVIEW — pseudocode generator
// ══════════════════════════════════════════════════
function openCodeReview(){
  const body=document.getElementById('m-cr-body');
  body.innerHTML='';
  const nodeList=Object.values(nodes);
  if(!nodeList.length){body.innerHTML='<div style="color:var(--txd);padding:20px;text-align:center;">캔버스가 비어 있습니다.</div>';document.getElementById('m-codereview').style.display='flex';return;}

  const startT={fc:['terminal'],fsm:['initial'],bt:['btroot'],sc:['sclife']}[mode]||['terminal'];
  const starts=nodeList.filter(n=>startT.includes(n.type));

  // Build adjacency
  const adj={};
  Object.keys(nodes).forEach(id=>{adj[id]=[];});
  Object.values(edges).forEach(e=>{if(adj[e.from]&&nodes[e.to]) adj[e.from].push({to:e.to,label:e.label||'',name:e.name||''});});

  // DFS to produce lines
  const lines=[];
  const visited=new Set();
  // FIX: cycleSet 선언 후 미사용 변수 제거 — detectCycles() 결과는 하단 요약에서만 사용

  // HTML 이스케이프 헬퍼 (innerHTML 삽입 전 반드시 사용)
  function esc(v){ return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function nodeTitle(id){
    const n=nodes[id]; if(!n) return esc(id);
    const s=S[n.type]; const typeLabel=s?.label||n.type;
    return `<span class="cr-node">${esc(n.label||id)}</span> <span class="cr-type">[${esc(typeLabel)}]</span> <span style="color:var(--txd);font-size:9px;">#${esc(id)}</span>`;
  }

  function traverse(id,depth,viaLabel){
    const indent='  '.repeat(depth);
    const via=viaLabel?`<span class="cr-edge">[${esc(viaLabel)}] </span>`:'';
    const n=nodes[id]; if(!n) return;

    if(visited.has(id)){
      lines.push(`${indent}${via}↺ 반복 → ${nodeTitle(id)} <span class="cr-cycle" style="font-size:9px;"> ← 여기서 루프</span>`);
      return;
    }
    visited.add(id);

    const s=S[n.type];
    const isEnd=s?.end;
    const outs=adj[id]||[];

    lines.push(`${indent}${via}${nodeTitle(id)}${isEnd?` <span class="cr-end">⏹ END</span>`:''}`);

    const props=Object.entries(n.properties||{});
    if(props.length){
      props.forEach(([k,v])=>{
        lines.push(`${indent}  <span style="color:var(--tx2);font-size:9.5px;">↳ ${esc(k)}: ${esc(v)}</span>`);
      });
    }

    if(!outs.length&&!isEnd){
      lines.push(`${indent}  <span class="cr-warn">⚠ 출구 없음 (막힌 경로)</span>`);
    }

    if(outs.length===1){
      traverse(outs[0].to, depth, outs[0].label||outs[0].name||'');
    } else if(outs.length>1){
      outs.forEach(out=>{
        const lbl=out.label||out.name||'→';
        lines.push(`${indent}  <span class="cr-edge">▸ 분기: "${esc(lbl)}"</span>`);
        traverse(out.to, depth+2, '');
      });
    }
  }

  if(starts.length){
    starts.forEach(s=>traverse(s.id,0,''));
  } else {
    const hasinc=new Set(Object.values(edges).map(e=>e.to));
    const roots=nodeList.filter(n=>!hasinc.has(n.id));
    if(roots.length) roots.forEach(r=>traverse(r.id,0,''));
    else nodeList.slice(0,1).forEach(r=>traverse(r.id,0,''));
  }

  const unvisited=nodeList.filter(n=>!visited.has(n.id));
  if(unvisited.length){
    lines.push('');
    lines.push(`<span class="cr-warn">⚠ 연결되지 않은 노드 (${unvisited.length}개):</span>`);
    unvisited.forEach(n=>{
      lines.push(`  ${nodeTitle(n.id)} <span style="color:var(--txd);">← 고립됨</span>`);
    });
  }

  const cycles=detectCycles();
  if(cycles.length){
    lines.push('');
    lines.push(`<span class="cr-cycle">🔁 감지된 무한루프 ${cycles.length}개:</span>`);
    cycles.forEach((c,i)=>{
      const names=c.path.map(id=>nodes[id]?.label||id).join(' → ');
      lines.push(`  #${i+1}: ${names}`);
    });
  }

  const html=lines.map(l=>`<div class="cr-block" style="padding:4px 8px;margin-bottom:2px;">${l}</div>`).join('');
  body.innerHTML=html||'<div style="color:var(--txd);">변환할 내용 없음</div>';
  document.getElementById('m-codereview').style.display='flex';
}

function copyCRText(){
  const body=document.getElementById('m-cr-body');
  const text=(body.innerText||body.textContent||'').replace(/\u200B/g,'');
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(text).catch(()=>{});
  } else {
    const ta=document.createElement('textarea');
    ta.value=text; document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy');}catch(_){}
    ta.remove();
  }
}

// ══════════════════════════════════════════════════
// LOGIC TRACE — step-by-step simulation
// ══════════════════════════════════════════════════
let ltState=null; // {curId, visitCount{}, steps[], vars{}}

function openLogicTrace(){
  const sel=document.getElementById('lt-start');
  sel.innerHTML='';
  const startT={fc:['terminal'],fsm:['initial'],bt:['btroot'],sc:['sclife']}[mode]||['terminal'];
  const allNodes=Object.values(nodes);
  const sorted=[...allNodes.filter(n=>startT.includes(n.type)), ...allNodes.filter(n=>!startT.includes(n.type))];
  if(!sorted.length){
    document.getElementById('lt-steps').innerHTML='<div style="color:var(--txd);padding:20px;text-align:center;">캔버스가 비어 있습니다.</div>';
    document.getElementById('m-logtrace').style.display='flex';
    return;
  }
  sorted.forEach(n=>{
    const opt=document.createElement('option');
    opt.value=n.id;
    const s=S[n.type];
    opt.textContent=`${n.label||n.id} [${s?.label||n.type}]`;
    sel.appendChild(opt);
  });
  ltBuildVars();
  // FIX: onchange 대입으로 중복 리스너 방지 (openLogicTrace 재호출 시 누적 등록 버그 수정)
  sel.onchange = ltBuildVars;
  resetLogicTrace();
  document.getElementById('m-logtrace').style.display='flex';
}

function ltBuildVars(){
  const varsDiv=document.getElementById('lt-vars');
  // 기존 입력값 보존 (노드 변경 시 사용자가 입력한 값이 사라지지 않도록)
  const prevVals={};
  varsDiv.querySelectorAll('.lt-var-val').forEach(inp=>{ prevVals[inp.dataset.vkey]=inp.value; });

  const fromProps={};
  const fromEdges={};

  // 1. 노드 properties에서 수집
  Object.values(nodes).forEach(n=>{
    Object.entries(n.properties||{}).forEach(([k,v])=>{
      if(!(k in fromProps)) fromProps[k]=v;
    });
  });

  // 2. 노드 레이블 조건식에서 변수명 감지 (예: "required_level >= 10", "레벨 ≥ 10")
  // ※ 비교식 패턴만 — ≥/≤ 기호도 정규화 후 처리
  const condVarRe=/^([A-Za-z가-힣_][A-Za-z0-9가-힣_]*)\s*(===?|!==?|>=?|<=?)/;
  Object.values(nodes).forEach(n=>{
    const lbl=(n.label||'').trim().replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/≠/g,'!=');
    if(!lbl) return;
    const cm=lbl.match(condVarRe);
    if(cm){ const vname=cm[1]; if(!(vname in fromProps)&&!(vname in fromEdges)) fromEdges[vname]=''; }
  });

  // 3. 엣지 레이블 조건식에서 변수명 자동 감지
  // ※ 비교식 패턴(varName OP value)만 감지 — 단독 단어는 제외
  //   단독 단어("닫기", "완료" 등)는 UI 전이 레이블일 뿐 변수가 아님
  Object.values(edges).forEach(e=>{
    const lbl=(e.label||e.name||'').trim();
    if(!lbl) return;
    const cm=lbl.match(condVarRe);
    if(cm){
      const vname=cm[1];
      if(!(vname in fromProps)&&!(vname in fromEdges)) fromEdges[vname]='';
    }
  });

  // 노드 속성과 엣지 조건 변수 통합 (노드 속성이 기본값 우선)
  const allProps={...fromProps, ...fromEdges};
  const entries=Object.entries(allProps);

  if(!entries.length){
    varsDiv.innerHTML='<div style="color:var(--txd);font-size:10px;">엣지 조건식에 변수가 없습니다.<br>엣지 레이블을 <code>변수명 &gt; 값</code> 형식으로 입력하거나<br>노드 속성을 추가하세요.</div>';
    return;
  }

  // 빈 값 변수는 시각적으로 구분 (⚠ 표시) → 사용자가 채워야 함을 인지
  // XSS 방지: 변수 키 이름은 DOM API로 삽입
  varsDiv.innerHTML='';
  entries.forEach(([k,v])=>{
    const isEmpty=(v===''||v==null);
    const isFromEdge=!(k in fromProps);
    const row=document.createElement('div');
    row.className='lt-var-row';
    row.title=isFromEdge?'엣지 조건에서 감지된 변수':'노드 속성 변수';

    const keySpan=document.createElement('span');
    keySpan.className='lt-var-key';
    keySpan.style.color=isEmpty?'#ffaa44':'var(--tx2)';
    if(isEmpty){ const w=document.createTextNode('⚠ '); keySpan.appendChild(w); }
    const kSpan=document.createElement('span');
    kSpan.style.userSelect='all';
    kSpan.textContent=k;
    keySpan.appendChild(kSpan);

    const inp=document.createElement('input');
    inp.className='lt-var-val';
    inp.dataset.vkey=k;
    // 기존 입력값 우선 사용, 없으면 노드 속성 기본값, 없으면 빈 문자열
    const restoredVal = k in prevVals ? prevVals[k] : (v||'');
    inp.value=restoredVal;
    const isNowEmpty=(restoredVal==='');
    if(isNowEmpty) inp.placeholder='값 입력 필요';
    // ⚠ 표시도 실제 현재 값 기준으로 갱신
    if(isNowEmpty && !isEmpty){ keySpan.style.color='#ffaa44'; const w=document.createTextNode('⚠ '); keySpan.insertBefore(w,kSpan); }

    row.appendChild(keySpan);
    row.appendChild(inp);
    varsDiv.appendChild(row);
  });
}

function resetLogicTrace(){
  ltState=null;
  const steps=document.getElementById('lt-steps');
  if(steps) steps.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--txd);padding:30px 0;"><div style="font-size:28px;opacity:.3;">▷</div><div style="font-size:12px;">왼쪽에서 설정 후 시뮬레이션을 시작하세요</div><div style="font-size:10px;opacity:.7;">노드를 하나씩 따라가며 조건을 자동으로 평가합니다</div></div>`;
  const dot=document.getElementById('lt-status-dot');
  const txt=document.getElementById('lt-status-text');
  if(txt){ txt.textContent='대기 중 — 시뮬레이션을 시작하면 여기에 결과가 표시됩니다'; txt.style.color='var(--tx2)'; }
  if(dot) dot.style.background='var(--bdrb)';
  const cnt=document.getElementById('lt-step-count');
  if(cnt) cnt.textContent='';
  document.querySelectorAll('.ng').forEach(el=>el.classList.remove('lt-active-node'));
}

function startLogicTrace(){
  const startId=document.getElementById('lt-start').value;
  if(!startId||!nodes[startId]){resetLogicTrace();return;}
  const vars={};
  document.querySelectorAll('.lt-var-val').forEach(inp=>{ vars[inp.dataset.vkey]=inp.value; });

  // 빈 값 변수가 있으면 스텝 영역에 안내 표시 (시작은 허용, 단 조건 평가가 null이 됨을 알림)
  const emptyVars=Object.entries(vars).filter(([,v])=>v.trim()==='').map(([k])=>k);
  const stepsDiv=document.getElementById('lt-steps');
  stepsDiv.innerHTML='';
  if(emptyVars.length){
    const warn=document.createElement('div');
    warn.style.cssText='font-size:10px;padding:5px 10px;margin-bottom:4px;border-radius:3px;background:rgba(255,170,0,.1);border:1px solid rgba(255,170,0,.3);color:#ffcc44;';
    warn.textContent=`⚠ 미입력 변수: ${emptyVars.join(', ')} — 이 변수가 포함된 조건은 평가 불가로 처리됩니다.`;
    stepsDiv.appendChild(warn);
  }

  // 엣지 outMap 캐시: ltAdvance가 매 스텝마다 edges 전체 순회하는 O(M) 비용 방지
  // 시뮬레이션 시작 시 1회만 빌드, ltState에 저장해 각 노드에서 O(1) 조회
  const outMap={};
  Object.values(edges).forEach(e=>{
    if(!outMap[e.from]) outMap[e.from]=[];
    outMap[e.from].push(e);
  });

  ltState={curId:startId, visitCount:{}, steps:[], vars, done:false, outMap};
  ltAdvance(startId,null,null);
}

/* ── 노드 레이블 조건식 평가기
   "레벨 ≥ 10", "required_level >= 5" 같이 노드 레이블 자체가 조건식인 경우를 평가.
   - 변수명을 vars에서 찾아 비교
   - 평가 가능하면 true/false, 불가능하면 null
   - "Yes"/"No" 같은 단순 라우팅 레이블은 null 반환 (조건식 아님)
*/
function ltEvalNodeLabel(label, vars){
  if(!label||!vars||!Object.keys(vars).length) return null;
  // ≥ ≤ ≠ ＞ ＜ 유니코드 기호를 ASCII 연산자로 정규화 (1회만)
  const s=label.trim()
    .replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/≠/g,'!=')
    .replace(/＞/g,'>').replace(/＜/g,'<');
  // ltEvalCond에 위임 — 비교식·단독변수·리터럴 모두 처리
  return ltEvalCond(s, vars);
}

/* ── 조건식 평가기
   엣지 레이블을 변수값에 대해 평가합니다.
   지원 형식:
     varName > 5         숫자 비교
     varName >= 5
     varName < 5
     varName <= 5
     varName == value    동등 비교 (숫자/문자)
     varName != value
     varName === value   엄격 동등
     varName             변수 자체 (truthy/falsy)
     Yes / No 등 리터럴은 변수가 없을 때만 true/false로 평가
   반환: true | false | null (평가 불가)
*/
function ltEvalCond(expr, vars){
  if(!expr) return null;
  const s=expr.trim();

  // 비교식: varName OP value  (최우선 — "level > 1" 등)
  const m=s.match(/^([A-Za-z가-힣_][A-Za-z0-9가-힣_]*)\s*(===?|!==?|>=?|<=?)\s*(.+)$/);
  if(m){
    const [,vname,op,rhs]=m;
    if(!(vname in vars)) return null;
    const lv=vars[vname].trim();
    // 변수 값이 비어있으면 어떤 비교도 불가 → null (false가 아님!)
    // false를 반환하면 else-path 로직이 오작동해 엉뚱한 경로를 자동 선택함
    if(lv === '') return null;
    const rv=rhs.trim().replace(/^['"]|['"]$/g,''); // 따옴표 제거
    // 숫자면 숫자로, 아니면 문자열로 비교
    const ln=parseFloat(lv), rn=parseFloat(rv);
    const numMode=!isNaN(ln)&&!isNaN(rn);
    switch(op){
      case '===': return lv===rv;
      case '!==': return lv!==rv;
      case '==':  return numMode?(ln===rn):(lv.toLowerCase()===rv.toLowerCase());
      case '!=':  return numMode?(ln!==rn):(lv.toLowerCase()!==rv.toLowerCase());
      // 숫자 비교: 양쪽 모두 숫자여야 함 — numMode=false면 null (비교 불가)
      case '>':   return numMode ? ln>rn  : null;
      case '>=':  return numMode ? ln>=rn : null;
      case '<':   return numMode ? ln<rn  : null;
      case '<=':  return numMode ? ln<=rn : null;
    }
  }

  // 변수명 단독 → truthy 체크 (변수가 실제로 vars에 있을 때만)
  if(/^[A-Za-z가-힣_][A-Za-z0-9가-힣_]*$/.test(s)){
    if(s in vars){
      const v=vars[s].trim();
      return v!==''&&v!=='0'&&v!=='false'&&v!=='no'&&v!=='거짓';
    }
    // 변수가 없으면 리터럴로 해석
    if(/^(yes|true|참|성공|ok)$/i.test(s)) return true;
    if(/^(no|false|거짓|실패|fail)$/i.test(s)) return false;
    return null; // 변수가 vars에 없음 → 평가 불가
  }

  // 복합 식이나 기타 → 평가 불가
  return null;
}

/* ── 엣지 조건 자동 매칭
   vars를 기반으로 outs 중 조건이 참인 첫 번째 엣지를 반환.
   반환값:
     {edge, matched:true}  → 조건 명확히 참
     {edge, matched:false, reason:'else'} → 나머지가 전부 false이고 평가불가 엣지 1개만 남은 경우 (else 경로)
     null → 사용자가 직접 선택해야 함
*/
function ltMatchEdge(outs, vars){
  // 1차: 조건이 명확히 true인 엣지 전체 수집
  const trueEdges=[];
  for(const e of outs){
    const lbl=(e.label||e.name||'').trim();
    const r=ltEvalCond(lbl, vars);
    if(r===true) trueEdges.push({edge:e, lbl});
  }
  if(trueEdges.length===1){
    return {edge:trueEdges[0].edge, matched:true, reason:`"${trueEdges[0].lbl}" → 참`};
  }
  if(trueEdges.length>1){
    // 여러 조건이 동시에 참 → 첫 번째 선택 + 경고 메시지
    const labels=trueEdges.map(t=>`"${t.lbl}"`).join(', ');
    return {edge:trueEdges[0].edge, matched:true, reason:`⚠ 복수 조건 참 (${labels}) — 첫 번째 선택`};
  }

  // 2차: 모든 평가 가능 엣지가 false이고, 레이블 없는 엣지가 1개뿐 → else/default 경로
  const evaledFalse=outs.filter(e=>{
    const lbl=(e.label||e.name||'').trim();
    return lbl && ltEvalCond(lbl, vars)===false;
  });
  const noLabel=outs.filter(e=>!(e.label||e.name||'').trim());
  if(evaledFalse.length>0 && noLabel.length===1 && evaledFalse.length+noLabel.length===outs.length){
    return {edge:noLabel[0], matched:false, reason:`기본(else) 경로 — 나머지 조건이 모두 거짓`};
  }

  return null; // 사용자가 직접 선택
}

function ltAdvance(nodeId, viaEdgeLabel, viaEdgeName){
  if(!ltState||ltState.done) return;
  const n=nodes[nodeId]; if(!n){ltFinish('error','도달 불가 노드');return;}

  ltState.visitCount[nodeId]=(ltState.visitCount[nodeId]||0)+1;
  const s=S[n.type];
  const step={id:nodeId, label:n.label||nodeId, type:s?.label||n.type, via:viaEdgeLabel||viaEdgeName||null, stepNum:ltState.steps.length+1};
  ltState.steps.push(step);
  ltRenderSteps();

  // 캔버스 노드 하이라이트
  document.querySelectorAll('.ng.lt-active-node').forEach(el=>el.classList.remove('lt-active-node'));
  document.getElementById('ng-'+nodeId)?.classList.add('lt-active-node');

  // 무한루프 감지: 동일 노드를 LT_LOOP_LIMIT 초과 방문 시 종료
  const LT_LOOP_LIMIT = 5;
  if(ltState.visitCount[nodeId] > LT_LOOP_LIMIT){
    // 루프 경로 추출: 마지막으로 이 노드가 등장한 지점부터의 스텝
    const allStepIds=ltState.steps.map(s=>s.id);
    const prevIdx=allStepIds.slice(0,-1).lastIndexOf(nodeId);
    const loopPath=prevIdx>=0
      ? ltState.steps.slice(prevIdx).map(s=>s.label||s.id).join(' → ')
      : n.label||nodeId;
    ltFinish('cycle',`🔁 무한루프 감지: ${loopPath}`);
    return;
  }
  if(ltState.visitCount[nodeId] > 1){
    ltAppendStatus(`⚠ "${n.label||nodeId}" 노드 ${ltState.visitCount[nodeId]}번째 방문 — 루프 감지 중`,'#ffaa44');
  }

  // 종료 노드 판정: 시작 노드(첫 번째 스텝)는 end 여부 무시
  // → terminal/fsmfinal 등을 시작 노드로 선택해도 즉시 종료되지 않고 실제 연결을 따라감
  const isFirstStep = ltState.steps.length === 1;
  if(s?.end && !isFirstStep){
    ltFinish('success','✅ 종료 노드 도달: "'+(n.label||n.id)+'"');
    return;
  }

  // outMap 캐시 사용 (시뮬레이션 시작 시 빌드됨)
  // 시뮬레이션 도중 edges가 변경됐을 경우를 대비해 캐시에 없으면 live edges로 fallback
  const outs=ltState.outMap[nodeId] ?? Object.values(edges).filter(e=>e.from===nodeId);
  if(!outs.length){ltFinish('warn','⚠ 출구 없음 — 경로가 막혔습니다.');return;}

  const auto=document.getElementById('lt-auto')?.checked;

  if(outs.length===1){
    // 단일 엣지: 무조건 진행 (auto 모드도 최소 16ms — 0ms면 UI 업데이트 없이 연속 실행)
    setTimeout(()=>ltAdvance(outs[0].to, outs[0].label, outs[0].name), auto?180:16);
    return;
  }

  // ── 패턴 1: 노드 레이블이 조건식, 엣지가 Yes/No 라우팅 힌트인 경우
  const nodeLabelResult = ltEvalNodeLabel(n.label||'', ltState.vars);
  if(nodeLabelResult !== null){
    const posLabels=/^(yes|true|참|성공|ok)$/i;
    const negLabels=/^(no|false|거짓|실패|fail)$/i;
    // posEdges: 명시적 Yes/True 레이블만 (빈 레이블 제외 — 일반 전이와 혼동 방지)
    const posEdges=outs.filter(e=>{ const l=(e.label||e.name||'').trim(); return posLabels.test(l); });
    const negEdges=outs.filter(e=>{ const l=(e.label||e.name||'').trim(); return negLabels.test(l); });
    // else 경로: 레이블 없는 엣지 (Yes/No 패턴에서 default 방향)
    const elseEdges=outs.filter(e=>!(e.label||e.name||'').trim());
    // 긍정/부정 엣지가 모두 있어야 이 패턴 적용 (하나라도 없으면 패턴 2로 넘김)
    if(posEdges.length>=1 && negEdges.length>=1){
      let target, resultLabel;
      if(nodeLabelResult){
        target=posEdges[0];
        resultLabel='참 (Yes)';
      } else {
        // 거짓: negEdges 우선, 없으면 elseEdges 사용
        target=negEdges[0]||(elseEdges.length?elseEdges[0]:null);
        resultLabel=negEdges[0]?'거짓 (No)':'거짓 → 기본 경로';
      }
      if(target){
        ltAppendCondResult(target, `노드 조건 "${n.label}" → ${resultLabel}`, true);
        setTimeout(()=>ltAdvance(target.to, target.label, target.name), auto?180:280);
        return;
      }
    }
  }

  // ── 패턴 2: 엣지 레이블이 조건식인 경우 (기존 로직)
  const matched=ltMatchEdge(outs, ltState.vars);
  if(matched){
    ltAppendCondResult(matched.edge, matched.reason, matched.matched);
    setTimeout(()=>ltAdvance(matched.edge.to, matched.edge.label, matched.edge.name), auto?180:280);
    return;
  }

  // 조건 평가 실패 시 처리
  if(auto){
    ltAppendStatus('⚠ 조건 평가 불가: 자동 모드에서 첫 번째 경로를 선택합니다.','#ffaa44');
    setTimeout(()=>ltAdvance(outs[0].to, outs[0].label, outs[0].name), 180);
  } else {
    ltRenderChoices(nodeId, outs);
  }
}

/* 조건 자동 매칭 결과를 스텝 아래 배지로 표시 */
function ltAppendCondResult(edge, reason, isExact){
  const steps=document.getElementById('lt-steps');
  const last=steps.lastElementChild;
  if(!last) return;
  const badge=document.createElement('div');
  badge.className=`lt-cond-badge ${isExact?'lt-cond-true':'lt-cond-else'}`;
  badge.textContent=`${isExact?'✓ 조건 참':'→ 기본 경로'}: ${reason}`;
  last.appendChild(badge);
}

function ltChoose(toId, label, name){
  const steps=document.getElementById('lt-steps');
  steps.querySelectorAll('.lt-choices').forEach(el=>el.remove());
  // setTimeout으로 감싸 ltAdvance 호출 패턴 통일 (클릭 이벤트 스택과 분리)
  setTimeout(()=>ltAdvance(toId, label, name), 0);
}

function ltRenderChoices(fromId, outs){
  if(!ltState||ltState.done) return;  // done 이후 호출 방어
  const steps=document.getElementById('lt-steps');
  const last=steps.lastElementChild;
  if(!last) return;
  const div=document.createElement('div');
  div.className='lt-choices';

  outs.forEach(e=>{
    // 표시용 레이블 (fallback 포함)
    const dispLbl=e.label||e.name||`→ ${nodes[e.to]?.label||e.to}`;
    // 평가용 레이블 (실제 조건식만 — fallback 제외)
    const evalLbl=(e.label||e.name||'').trim();
    const evalResult=evalLbl ? ltEvalCond(evalLbl, ltState?.vars||{}) : null;

    const btn=document.createElement('button');
    btn.className='lt-choice';
    if(evalResult===true)  btn.style.borderColor='#44ee88';
    if(evalResult===false) btn.style.opacity='0.5';

    // XSS 방지: textContent로 레이블 삽입 후 힌트 span은 별도 생성
    btn.textContent=dispLbl;
    if(evalResult===true||evalResult===false){
      const hint=document.createElement('span');
      hint.style.cssText=`font-size:9px;margin-left:4px;color:${evalResult?'#44ee88':'#ff7766'}`;
      hint.textContent=evalResult?'✓참':'✗거짓';
      btn.appendChild(hint);
    }
    btn.onclick=()=>ltChoose(e.to, e.label, e.name);
    div.appendChild(btn);
  });
  last.appendChild(div);
  ltAppendStatus('분기점에 도달했습니다 — 아래에서 이동할 경로를 선택하세요','#55aaff');
}

function ltRenderSteps(){
  const cont=document.getElementById('lt-steps');
  if(!ltState||!ltState.steps.length) return;
  ltUpdateStepCount();

  const steps=ltState.steps;
  const last=steps.length-1;

  // 이전 마지막 스텝을 done으로 전환 (active → done)
  if(last>0){
    const prev=document.getElementById('lt-s-'+(last-1));
    if(prev){ prev.classList.remove('active'); prev.classList.add('done'); }
  }

  // 새 스텝만 생성 (이미 존재하면 skip)
  if(!document.getElementById('lt-s-'+last)){
    const step=steps[last];
    const el=document.createElement('div');
    el.id='lt-s-'+last;
    el.className='lt-step active';

    const numDiv=document.createElement('div'); numDiv.className='lt-num'; numDiv.textContent=step.stepNum;
    const bodyDiv=document.createElement('div'); bodyDiv.className='lt-body';
    const row1=document.createElement('div');
    const lblSp=document.createElement('span'); lblSp.className='lt-label'; lblSp.textContent=step.label;
    const typSp=document.createElement('span'); typSp.className='lt-type'; typSp.textContent=` [${step.type}]`;
    const nidSp=document.createElement('span'); nidSp.className='lt-nid'; nidSp.textContent=` #${step.id}`;
    row1.appendChild(lblSp); row1.appendChild(typSp); row1.appendChild(nidSp);
    bodyDiv.appendChild(row1);
    if(step.via){
      const viaDiv=document.createElement('div'); viaDiv.className='lt-via';
      viaDiv.textContent=`↳ ${step.via}`;
      bodyDiv.appendChild(viaDiv);
    }
    el.appendChild(numDiv); el.appendChild(bodyDiv);
    cont.appendChild(el);
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}

function ltFinish(type, msg){
  if(ltState) ltState.done=true;
  const col=type==='success'?'#44ee88':type==='cycle'?'#ff5555':type==='error'?'#ff5555':'#ffaa44';
  const bg=type==='success'?'rgba(0,212,80,.08)':type==='cycle'?'rgba(255,50,50,.1)':type==='error'?'rgba(255,50,50,.1)':'rgba(255,170,0,.08)';
  const border=type==='success'?'rgba(0,212,80,.25)':type==='cycle'?'rgba(255,50,50,.35)':type==='error'?'rgba(255,50,50,.35)':'rgba(255,170,0,.25)';

  // 스텝 목록 안에 결과 카드 삽입 (상태바보다 눈에 잘 띔)
  const steps=document.getElementById('lt-steps');
  const card=document.createElement('div');
  card.style.cssText=`padding:8px 12px;border-radius:4px;border:1px solid ${border};background:${bg};color:${col};font-size:11px;font-weight:600;margin-top:4px;`;
  card.textContent=msg;
  steps.appendChild(card);
  card.scrollIntoView({behavior:'smooth',block:'nearest'});

  ltAppendStatus(msg, col);
}

function ltAppendStatus(msg, color){
  const dot=document.getElementById('lt-status-dot');
  const txt=document.getElementById('lt-status-text');
  if(txt) txt.textContent=msg;
  if(txt) txt.style.color=color||'var(--tx2)';
  if(dot) dot.style.background=color||'var(--txd)';
}

function ltUpdateStepCount(){
  const el=document.getElementById('lt-step-count');
  if(!el||!ltState) return;
  el.textContent=ltState.steps.length ? `${ltState.steps.length}단계` : '';
}


