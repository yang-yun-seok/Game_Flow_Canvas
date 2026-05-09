// ══════════════════════════════════════════════════
// DEMO
// ══════════════════════════════════════════════════
const QUICKSTART_META = {
  fc:{
    kicker:'FLOW SYSTEM',
    title:'Map Player Flow Fast',
    desc:'화면 이동, 조건 분기, 팝업 흐름처럼 플레이어 여정을 빠르게 구조화합니다.',
    starter:'기본 플로우 시작',
    tip:'추천 시작점: Start → Screen → Decision',
    block:'lime',
    note:'기획 흐름이 길어질수록 먼저 큰 분기만 잡고 세부 노드를 채우는 편이 안정적입니다.'
  },
  fsm:{
    kicker:'STATE LOGIC',
    title:'Design Clear Transitions',
    desc:'캐릭터 상태, UI 상태, AI 전이를 상태 단위로 분해해서 전환 규칙을 정리합니다.',
    starter:'상태 뼈대 만들기',
    tip:'추천 시작점: Initial → Idle → Choice',
    block:'lilac',
    note:'상태명은 짧게, 전이 조건은 엣지 라벨로 분리하면 읽기가 좋아집니다.'
  },
  bt:{
    kicker:'AI BEHAVIOR',
    title:'Compose Decision Trees',
    desc:'Selector, Sequence, Condition, Action 순서로 AI 판단 구조를 계층적으로 설계합니다.',
    starter:'AI 트리 시작',
    tip:'추천 시작점: Root → Sequence → Condition / Action',
    block:'coral',
    note:'액션보다 상위 분기 규칙을 먼저 정리하면 검증과 트레이스가 쉬워집니다.'
  },
  sc:{
    kicker:'MESSAGE FLOW',
    title:'Trace Object Messages',
    desc:'플레이어, NPC, 서버 간 메시지와 응답을 시간 순서대로 시각화합니다.',
    starter:'시퀀스 골격 만들기',
    tip:'추천 시작점: Actor 2개 + Message 1개',
    block:'navy',
    note:'메시지 라벨은 요청과 응답을 분리해서 적으면 흐름 해석이 빨라집니다.'
  },
};
const PALETTE_GUIDE_META = {
  fc:{
    title:'처음이면 이 셋부터',
    desc:'Start, Screen, Decision만으로도 대부분의 UX 플로우를 시작할 수 있습니다.',
    picks:[['terminal','Start'],['screen','Screen'],['decision','Decision']]
  },
  fsm:{
    title:'상태 전이는 이 순서',
    desc:'Initial, State, Choice로 최소 상태 머신 골격을 먼저 잡습니다.',
    picks:[['initial','Initial'],['state','State'],['fsmchoice','Choice']]
  },
  bt:{
    title:'AI 트리는 이 조합',
    desc:'Root, Sequence, Action을 먼저 놓고 조건은 그다음에 붙이는 편이 쉽습니다.',
    picks:[['btroot','Root'],['btseq','Sequence'],['btleaf','Action']]
  },
  sc:{
    title:'메시지 흐름 시작점',
    desc:'Actor 둘과 Message 하나로 상호작용 시간축을 빠르게 세울 수 있습니다.',
    picks:[['sclife',':Actor'],['sclife',':System'],['scmsg','message()']]
  }
};
const HELP_SEEN_KEY = 'gfc_help_seen_v1';
const paletteCollapseState = {};
function shouldOpenPaletteSection(modeKey, index, title){
  if(index===0) return true;
  const normalized=String(title||'').toLowerCase();
  if(modeKey==='fc' && /게임 ui|모듈/.test(normalized)) return true;
  if(modeKey==='fsm' && /기본 상태/.test(normalized)) return true;
  if(modeKey==='bt' && /리프 노드/.test(normalized)) return true;
  if(modeKey==='sc' && /메시지/.test(normalized)) return true;
  return false;
}
function enhancePalettePanel(panelId, modeKey){
  const panel=document.getElementById(panelId);
  if(!panel || panel.dataset.enhanced==='1') return;
  const items=[...panel.children];
  panel.innerHTML='';
  let currentTitle='';
  let currentNodes=[];
  let sectionIndex=0;

  function flushSection(){
    if(!currentTitle || !currentNodes.length) return;
    const secKey=`${modeKey}:${currentTitle}`;
    if(!(secKey in paletteCollapseState)){
      paletteCollapseState[secKey]=shouldOpenPaletteSection(modeKey, sectionIndex, currentTitle);
    }
    const section=document.createElement('section');
    section.className='pal-section';
    section.dataset.sectionKey=secKey;
    section.classList.toggle('collapsed', !paletteCollapseState[secKey]);

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='pal-section-toggle';
    toggle.innerHTML=`<span class="pal-section-title">${currentTitle}</span><span class="pal-section-arrow">${paletteCollapseState[secKey] ? '−' : '+'}</span>`;
    toggle.addEventListener('click', ()=>{
      paletteCollapseState[secKey]=!paletteCollapseState[secKey];
      section.classList.toggle('collapsed', !paletteCollapseState[secKey]);
      toggle.querySelector('.pal-section-arrow').textContent=paletteCollapseState[secKey] ? '−' : '+';
    });

    const body=document.createElement('div');
    body.className='pal-section-body';
    currentNodes.forEach(node=>body.appendChild(node));

    section.appendChild(toggle);
    section.appendChild(body);
    panel.appendChild(section);
    currentTitle='';
    currentNodes=[];
    sectionIndex+=1;
  }

  items.forEach(node=>{
    if(node.classList.contains('ps')){
      flushSection();
      currentTitle=node.textContent.trim();
      return;
    }
    if(node.classList.contains('psep')) return;
    currentNodes.push(node);
  });
  flushSection();
  panel.dataset.enhanced='1';
}
function setupPaletteSections(){
  enhancePalettePanel('pfc','fc');
  enhancePalettePanel('pfsm','fsm');
  enhancePalettePanel('pbt','bt');
  enhancePalettePanel('psc','sc');
}
function maybeShowWelcomeHelp(){
  try{
    if(localStorage.getItem(HELP_SEEN_KEY)) return;
    localStorage.setItem(HELP_SEEN_KEY, '1');
  }catch(_){}
  setTimeout(()=>{
    const modal=document.getElementById('m-help');
    if(modal) modal.style.display='flex';
  }, 320);
}
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
function addSuggestedNode(type,label){
  const center=getViewportCenterWorld();
  const count=Object.keys(nodes).length;
  const x=center.x-70+((count%3)-1)*150;
  const y=center.y-26+Math.floor(count/3)*96;
  createNode(type,x,y,null,label);
  selItem('n'+nc);
  saveState('추천 노드 추가');
  updateStatus();
}
function renderPaletteGuide(){
  const el=document.getElementById('pal-guide');
  if(!el) return;
  const meta=PALETTE_GUIDE_META[mode]||PALETTE_GUIDE_META.fc;
  el.innerHTML=`
    <div class="pal-guide-card">
      <div class="pal-guide-kicker">QUICK PICKS</div>
      <div class="pal-guide-title">${meta.title}</div>
      <div class="pal-guide-desc">${meta.desc}</div>
      <div class="pal-guide-actions">
        ${meta.picks.map(([type,label])=>`<button class="pal-guide-chip" onclick="addSuggestedNode('${type}','${label.replace(/'/g,"\\'")}')">${label}</button>`).join('')}
      </div>
    </div>
  `;
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
  el.setAttribute('data-block', meta.block || 'lime');
  const titleVariant=(meta.title||'').length > 20 ? 'long' : 'default';
  el.innerHTML=`
    <div class="qs-shell">
      <div class="qs-brand-row">
        <div class="qs-brand">Game Flow Canvas</div>
        <div class="qs-kicker">${meta.kicker}</div>
      </div>
      <div class="qs-panel">
        <div class="qs-copy">
          <div class="qs-title qs-title-${titleVariant}">${meta.title}</div>
          <div class="qs-desc">${meta.desc}</div>
          <div class="qs-note">${meta.note}</div>
        </div>
        <div class="qs-steps">
          <div class="qs-step"><div class="qs-step-no">01</div><div><strong>노드 배치</strong><span>왼쪽 팔레트에서 필요한 블록을 끌어다 놓고 큰 구조부터 잡습니다.</span></div></div>
          <div class="qs-step"><div class="qs-step-no">02</div><div><strong>연결과 라벨</strong><span>앵커로 선을 잇고 Inspector에서 이름, 조건, 메모를 채웁니다.</span></div></div>
          <div class="qs-step"><div class="qs-step-no">03</div><div><strong>검증과 추적</strong><span>검증, 코드 리뷰, 로직 트레이스로 막힌 분기와 흐름 누락을 확인합니다.</span></div></div>
        </div>
      </div>
      <div class="qs-actions">
        <button class="qs-btn qs-btn-primary" onclick="createQuickStartStarter()">${meta.starter}</button>
        <button class="qs-btn qs-btn-secondary" onclick="spawnModeDemo()">예시 불러오기</button>
        <button class="qs-btn qs-btn-secondary" onclick="document.getElementById('m-help').style.display='flex'">가이드 열기</button>
      </div>
      <div class="qs-tip">${meta.tip}</div>
    </div>
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
  setupPaletteSections();
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
  maybeShowWelcomeHelp();
})();


