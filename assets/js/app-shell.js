// ══════════════════════════════════════════════════
// DEMO
// ══════════════════════════════════════════════════
const QUICKSTART_META = {
  fc:{kicker:'Flowchart',title:'기본 흐름부터 바로 그리기',desc:'화면 이동, 조건 분기, 팝업 흐름처럼 게임 UX 플로우를 빠르게 잡는 모드입니다.',starter:'기본 뼈대 만들기',tip:'추천 시작점: Start → Screen → Decision'},
  fsm:{kicker:'State Machine',title:'상태 전이 구조부터 잡기',desc:'캐릭터 상태, AI 전이, UI 상태 전환처럼 상태 중심 설계에 적합합니다.',starter:'상태 뼈대 만들기',tip:'추천 시작점: Initial → Idle → Choice'},
  bt:{kicker:'Behavior Tree',title:'AI 행동 트리부터 시작하기',desc:'Selector, Sequence, Condition, Action 순으로 묶어가며 AI 의사결정 흐름을 설계합니다.',starter:'AI 뼈대 만들기',tip:'추천 시작점: Root → Sequence → Condition/Action'},
  sc:{kicker:'Sequence Chart',title:'객체 간 상호작용부터 정리하기',desc:'플레이어, NPC, 서버 사이 메시지 교환을 시간 순서대로 정리할 때 적합합니다.',starter:'메시지 뼈대 만들기',tip:'추천 시작점: Actor 2개 → Message 1개'},
};
function getViewportCenterWorld(){
  const r=cvs.getBoundingClientRect();
  return spt(r.left+r.width*0.5, r.top+r.height*0.5);
}
function createQuickStartSingleNode(){
  const center=getViewportCenterWorld();
  const presets={fc:['screen','Main Screen'],fsm:['state','Idle'],bt:['btroot','Root'],sc:['sclife',':Actor']};
  const [type,label]=(presets[mode]||presets.fc);
  createNode(type,center.x-75,center.y-28,null,label);
  saveState('퀵스타트: 시작 노드 추가');
  updateStatus();
}
function createQuickStartStarter(){
  const center=getViewportCenterWorld();
  if(mode==='fsm'){
    const a=createNode('initial',center.x-220,center.y-20,null,'');
    const b=createNode('state',center.x-40,center.y-30,null,'Idle');
    const d=createNode('fsmchoice',center.x+210,center.y-45,null,'전이 조건');
    createEdge(a,b,'r','l',null,'','');
    createEdge(b,d,'r','l',null,'입력','');
    saveState('퀵스타트: FSM 뼈대');
  }else if(mode==='bt'){
    const a=createNode('btroot',center.x-220,center.y-22,null,'Root');
    const b=createNode('btseq',center.x-20,center.y-22,null,'Sequence');
    const c1=createNode('btcond',center.x+220,center.y-110,null,'Condition');
    const c2=createNode('btleaf',center.x+220,center.y+55,null,'Action');
    createEdge(a,b,'r','l',null,'','');
    createEdge(b,c1,'r','l',null,'check','');
    createEdge(b,c2,'b','l',null,'run','');
    saveState('퀵스타트: BT 뼈대');
  }else if(mode==='sc'){
    const a=createNode('sclife',center.x-220,center.y-120,null,':Player');
    const b=createNode('sclife',center.x+40,center.y-120,null,':System');
    const e=createEdge(a,b,'r','l',null,'요청','message()');
    setEdgeStyle(e,'straight');
    saveState('퀵스타트: 시퀀스 뼈대');
  }else{
    const a=createNode('terminal',center.x-240,center.y-28,null,'Start');
    const b=createNode('screen',center.x-20,center.y-38,null,'Main Screen');
    const d=createNode('decision',center.x+240,center.y-44,null,'조건 확인');
    createEdge(a,b,'r','l',null,'','');
    createEdge(b,d,'r','l',null,'다음','');
    saveState('퀵스타트: 플로우 뼈대');
  }
  fitAll();
  updateStatus();
}
function renderQuickStart(){
  const el=document.getElementById('quickstart');
  if(!el) return;
  if(Object.keys(nodes).length){
    el.style.display='none';
    return;
  }
  const meta=QUICKSTART_META[mode]||QUICKSTART_META.fc;
  el.innerHTML=`
    <div class="qs-kicker">Quick Start · ${meta.kicker}</div>
    <div class="qs-title">${meta.title}</div>
    <div class="qs-desc">${meta.desc}</div>
    <div class="qs-steps">
      <div class="qs-step"><div class="qs-step-no">1</div><div>왼쪽 팔레트에서 필요한 노드를 드래그해서 캔버스에 놓습니다.</div></div>
      <div class="qs-step"><div class="qs-step-no">2</div><div>노드의 앵커를 클릭해서 선을 연결하고, Inspector에서 텍스트와 속성을 채웁니다.</div></div>
      <div class="qs-step"><div class="qs-step-no">3</div><div>완성 후 검증, 코드 리뷰, 로직 트레이스로 구조를 확인합니다.</div></div>
    </div>
    <div class="qs-actions">
      <button class="qs-btn qs-btn-primary" onclick="createQuickStartStarter()">${meta.starter}</button>
      <button class="qs-btn qs-btn-secondary" onclick="createQuickStartSingleNode()">노드 하나로 시작</button>
      <button class="qs-btn qs-btn-secondary" onclick="spawnModeDemo()">예시 불러오기</button>
      <button class="qs-btn qs-btn-secondary" onclick="document.getElementById('m-help').style.display='flex'">도움말 열기</button>
    </div>
    <div class="qs-tip">${meta.tip}</div>
  `;
  el.style.display='block';
}
function syncLineStyleButton(){
  const btn=document.getElementById('lstyle-btn');
  if(!btn) return;
  if(globalLineStyle === 'step'){
    btn.textContent = '🔀';
    btn.setAttribute('data-tip', '선 스타일: 꺾은선');
    btn.setAttribute('data-tip-sub', '장애물을 자동으로 피하는 직각 경로');
  }else if(globalLineStyle === 'straight'){
    btn.textContent = '📏';
    btn.setAttribute('data-tip', '선 스타일: 직선');
    btn.setAttribute('data-tip-sub', '출발점과 도착점을 직선으로 연결');
  }else{
    btn.textContent = '➰';
    btn.setAttribute('data-tip', '선 스타일: 곡선');
    btn.setAttribute('data-tip-sub', '베지어 곡선으로 부드럽게 연결');
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
    const n4=createNode('fsmchoice',700,175,null,'적 발견?');
    const n5=createNode('state',    930, 90,null,'Attack');
    const n6=createNode('accepting',930,300,null,'Evade');

    createEdge(n1,n2,'r','l',null,'','');
    createEdge(n2,n3,'r','l',null,'입력','');
    createEdge(n3,n4,'r','l',null,'탐색','');
    createEdge(n4,n5,'t','l',null,'Yes','');
    createEdge(n4,n2,'b','t',null,'No','');
    createEdge(n5,n3,'b','r',null,'타겟 상실','');
    createEdge(n3,n6,'b','l',null,'회피','');
    return 'FSM_Demo';
  }
  if(modeKey==='bt'){
    const n1=createNode('btroot',  120,120,null,'Root');
    const n2=createNode('btseq',   330,120,null,'탐색 시퀀스');
    const n3=createNode('btcond',  560, 30,null,'Enemy?');
    const n4=createNode('btsel',   560,190,null,'행동 선택');
    const n5=createNode('btleaf',  800,130,null,'Attack');
    const n6=createNode('btleaf',  800,250,null,'Fallback');
    const n7=createNode('btleaf',  330,320,null,'Patrol');

    createEdge(n1,n2,'r','l',null,'','');
    createEdge(n2,n3,'r','l',null,'조건','');
    createEdge(n2,n4,'b','l',null,'실행','');
    createEdge(n4,n5,'r','l',null,'성공','');
    createEdge(n4,n6,'b','l',null,'실패','');
    createEdge(n1,n7,'b','t',null,'기본','');
    return 'BehaviorTree_Demo';
  }
  if(modeKey==='sc'){
    const n1=createNode('sclife',  70, 90,null,':Player');
    const n2=createNode('sclife', 380, 90,null,':NPC');
    const n3=createNode('sclife', 700, 90,null,':Server');
    createNode('scnote', 360, 20,null,'Quest Start');
    createNode('scfrag', 240,220,null,'loop');

    const e1=createEdge(n1,n2,'r','l',null,'사용자 입력','대화 시작');
    const e2=createEdge(n2,n3,'r','l',null,'QuestReq','검증 요청');
    const e3=createEdge(n3,n2,'l','r',null,'QuestData','데이터 응답');
    const e4=createEdge(n2,n1,'l','r',null,'UI Update','화면 갱신');
    const e5=createEdge(n1,n3,'r','l',null,'Complete','완료 보고');
    [e1,e2,e3,e4,e5].forEach(eid=>setEdgeStyle(eid,'straight'));
    return 'SequenceChart_Demo';
  }
  // default: flowchart
  const n1=createNode('terminal',  60,200,null,'Game Start');
  const n2=createNode('screen',   270,120,null,'메인 로비',   {ui_id:'UI_LOBBY_001'});
  const n3=createNode('decision', 500,110,null,'레벨 ≥ 10',  {required_level:'10'});
  const n4=createNode('popup',    740, 50,null,'레벨 부족',   {message:'Level 10 required'});
  const n5=createNode('screen',   740,165,null,'상점 메인',   {ui_id:'UI_SHOP_MAIN'});
  const n6=createNode('popup',    970,165,null,'구매 확인',   {item_id:'SWORD_001'});
  const n7=createNode('system',   970,300,null,'결제 처리',   {action:'PROCESS_PAYMENT'});
  const n8=createNode('output',   740,300,null,'보상 지급',   {reward:'SWORD_001'});

  createEdge(n1,n2,'r','l',null,'','');
  createEdge(n2,n3,'r','l',null,'','상점 버튼');
  createEdge(n3,n4,'t','l',null,'No','');
  createEdge(n3,n5,'r','l',null,'Yes','');
  createEdge(n5,n6,'r','l',null,'','아이템 선택');
  createEdge(n6,n7,'b','t',null,'','구매 확인');
  createEdge(n7,n8,'l','r',null,'성공','');
  createEdge(n4,n2,'b','b',null,'','닫기');
  return 'Shop_UI_Flow';
}
function spawnModeDemo(targetMode){
  const m=targetMode||mode;
  const defaults={
    fc:'Shop_UI_Flow', fsm:'FSM_Demo',
    bt:'BehaviorTree_Demo', sc:'SequenceChart_Demo'
  };
  const projectName=defaults[m]||'Demo';
  const lineStyle=(m==='sc')?'straight':'step';
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
  document.getElementById('pname').value=finalName;
  onPnameInput(finalName);
  renderSheetBar();
  fitAll();
  saveState('예시 생성: '+m.toUpperCase());
  renderQuickStart();
}
function loadDemo(){
  setMode('fc');
  globalLineStyle='step';
  syncLineStyleButton();
  const name=buildDemoGraph('fc');
  document.getElementById('pname').value=name;
  onPnameInput(name);
  fitAll();
  saveState('초기 데모 로드');
  renderQuickStart();
}

// ══════════════════════════════════════════════════
// SHEET SYSTEM
// ══════════════════════════════════════════════════

let _sheetIdCnt = 0;
function newSheetId(){ return 'sh' + (++_sheetIdCnt); }

// 현재 캔버스 상태를 스냅샷으로 수집
function snapshotCurrent(){
  return {
    project: document.getElementById('pname').value || 'Untitled',
    mode, lineStyle: globalLineStyle,
    vx, vy, vs, gridSnap,
    nc, ec,
    history: JSON.parse(JSON.stringify(history)),
    historyIdx,
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

// 스냅샷을 현재 캔버스에 복원
function restoreSnapshot(snap){
  if(demoTimer){ clearTimeout(demoTimer); demoTimer=null; }
  nodes={}; edges={}; selId=null; selSet.clear(); connecting=null; reconnecting=null;
  clearConnectVisuals();
  invalidateBboxCache();
  NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';

  // 복원
  nc = snap.nc||0; ec = snap.ec||0;
  globalLineStyle = snap.lineStyle||'step';
  const lsBtn = document.getElementById('lstyle-btn');
  if(lsBtn){
    if(globalLineStyle==='step'){
      lsBtn.textContent='🔀';
      lsBtn.setAttribute('data-tip','선 스타일: 꺾은선');
      lsBtn.setAttribute('data-tip-sub','장애물을 자동으로 피하는 직각 경로');
    } else if(globalLineStyle==='straight'){
      lsBtn.textContent='📏';
      lsBtn.setAttribute('data-tip','선 스타일: 직선');
      lsBtn.setAttribute('data-tip-sub','출발점과 도착점을 직선으로 연결');
    } else {
      lsBtn.textContent='➰';
      lsBtn.setAttribute('data-tip','선 스타일: 곡선');
      lsBtn.setAttribute('data-tip-sub','베지어 곡선으로 부드럽게 연결');
    }
  }
  document.getElementById('pname').value = snap.project||'Untitled';
  if(snap.mode) setMode(snap.mode);
  vx = snap.vx||80; vy = snap.vy||60; vs = snap.vs||1;
  if(snap.gridSnap !== undefined && snap.gridSnap !== gridSnap){
    gridSnap = false; // toggleGrid가 반전하므로 목표 상태 전 단계로 세팅
    if(snap.gridSnap) toggleGrid();
  }
  applyVP();

  // 노드/엣지 재생성 (깊은 복사로 레퍼런스 공유 방지)
  Object.values(snap.nodes||{}).forEach(n=>{
    nodes[n.id]=JSON.parse(JSON.stringify(n));
    renderNode(n.id);
  });
  Object.values(snap.edges||{}).forEach(e=>{
    edges[e.id]=JSON.parse(JSON.stringify(e));
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

// 시트 탭 렌더링
function renderSheetBar(){
  const bar = document.getElementById('sheet-bar');
  // 기존 탭만 제거 (+ 버튼 유지)
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

    // 시트 이름 편집 완료
    nameEl.addEventListener('blur', ()=>{
      if(sheetEditingId!==sh.id) return;
      const v = nameEl.value.trim() || sh.name;
      nameEl.value = v;
      sh.name = v;
      // 활성 시트라면 상단 pname도 동기화
      if(sh.id === activeSheetId)
        document.getElementById('pname').value = v;
      sheetEditingId = null;
      renderSheetBar();
      scheduleWorkspaceAutosave();
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
    closeBtn.title = '시트 삭제';
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

  // 툴팁 새로 바인딩 (시트 이름, 삭제 버튼)
  if(typeof refreshTooltips === 'function') refreshTooltips();
}

// 시트 전환
function switchSheet(id){
  if(id === activeSheetId) return;
  sheetEditingId = null;
  // 현재 시트 저장
  const cur = sheets.find(s=>s.id===activeSheetId);
  if(cur) cur.data = snapshotCurrent();
  // 새 시트로 이동
  activeSheetId = id;
  const next = sheets.find(s=>s.id===id);
  if(next) restoreSnapshot(next.data);
  renderSheetBar();
  // After switching sheets, clear selection and update inspector/status
  clearSel();
  updateInspector();
  updateStatus();
  scheduleWorkspaceAutosave();
}

// 새 시트 추가
function addSheet(name, snapData, options){
  const opts=options||{};
  const focusNameEdit = opts.focusName !== false;
  const id = newSheetId();
  const sheetNum = sheets.length + 1;
  const shName = name || '시트' + sheetNum;
  const emptySnap = snapData || {
    project: shName, mode:'fc', lineStyle:'step',
    vx:80, vy:60, vs:1, nc:0, ec:0,
    history:[], historyIdx:-1, nodes:{}, edges:{}
  };
  emptySnap.project = shName;
  sheets.push({ id, name: shName, data: emptySnap });

  // 현재 시트 저장 후 새 시트로 전환
  const cur = sheets.find(s=>s.id===activeSheetId);
  if(cur) cur.data = snapshotCurrent();
  activeSheetId = id;
  restoreSnapshot(emptySnap);
  sheetEditingId = id;
  renderSheetBar();
  // 새 시트로 전환 시 선택 및 속성을 초기화
  clearSel();
  updateInspector();
  updateStatus();
  // 시트 생성 후 툴팁 재바인딩
  if(typeof refreshTooltips === 'function') refreshTooltips();
  // 새 탭 이름 편집 포커스
  if(focusNameEdit){
    setTimeout(()=>{
      const tab = document.querySelector(`.stab[data-sid="${id}"] .stab-name`);
      if(tab){ tab.focus(); tab.select(); }
    }, 50);
  }else{
    sheetEditingId = null;
    renderSheetBar();
  }
  scheduleWorkspaceAutosave();
  return id;
}

// 시트 삭제
function removeSheet(id){
  if(sheets.length <= 1){ showAlert('마지막 시트는 삭제할 수 없습니다.'); return; }
  const idx = sheets.findIndex(s=>s.id===id);
  sheets.splice(idx, 1);
  if(sheetEditingId===id) sheetEditingId=null;
  if(activeSheetId === id){
    const newIdx = Math.min(idx, sheets.length-1);
    activeSheetId = sheets[newIdx].id;
    restoreSnapshot(sheets[newIdx].data);
  }
  renderSheetBar();
  scheduleWorkspaceAutosave();
}

// 상단 pname 변경 시 → 현재 시트 이름도 동기화
function onPnameInput(val){
  const sh = sheets.find(s=>s.id===activeSheetId);
  if(sh){
    sh.name = val || sh.name;
    renderSheetBar();
    scheduleWorkspaceAutosave();
  }
}

// ══════════════════════════════════════════════════
// TOOLTIP ENGINE  (data-tip / data-tip-sub / data-tip-key)
// ══════════════════════════════════════════════════
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
  // 클릭 시 즉시 숨김
  document.addEventListener('mousedown', ()=>{ clearTimeout(showTimer); hide(); });
})();

// ══════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════
(function initSheets(){
  // pname 입력 → 시트 이름 동기화
  document.getElementById('pname').addEventListener('input', e=>{
    onPnameInput(e.target.value.trim());
  });
  applyVP();
  if(!restoreWorkspaceAutosave()){
    const firstId = newSheetId();
    sheets.push({ id: firstId, name: 'Shop_UI_Flow', data: null });
    activeSheetId = firstId;
    loadDemo(); // 저장된 작업이 없을 때만 데모 로드
    renderSheetBar();
    flushWorkspaceAutosave();
  }
  // 초기 렌더 후 툴팁 바인딩
  if(typeof refreshTooltips === 'function') refreshTooltips();
  fitAll();
})();


