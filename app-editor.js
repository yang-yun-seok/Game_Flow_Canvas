// ══════════════════════════════════════════════════
// CREATE
// ══════════════════════════════════════════════════
function createNode(type,x,y,id,label,props,sw,sh){
  if(!S[type]) return null;
  const nid=id||'n'+(++nc);
  nodes[nid]={id:nid,type,label:label!=null?label:S[type].label||type,x,y,properties:props||{}};
  if(sw) nodes[nid].sw=sw;
  if(sh) nodes[nid].sh=sh;
  invalidateBboxCache();
  renderNode(nid); updateStatus(); return nid;
}
function createEdge(from,to,fromA,toA,id,label,name,cp1dx,cp1dy,cp2dx,cp2dy){
  if(from===to) return null;
  const eid=id||'e'+(++ec);
  edges[eid]={id:eid,from,to,fromA:fromA||'r',toA:toA||'l',label:label||'',name:name||'',
              cp1dx:cp1dx||0,cp1dy:cp1dy||0,cp2dx:cp2dx||0,cp2dy:cp2dy||0};
  renderEdge(eid); updateStatus(); return eid;
}

// ══════════════════════════════════════════════════
// AUTO LAYOUT (dir: 'v' or 'h')
// ══════════════════════════════════════════════════
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
  
  // 레이아웃 후 선 꼬임을 줄이기 위해 앵커 재선택 + 수동 경로 초기화
  Object.values(edges).forEach(e => {
    e.cp1dx = 0; e.cp1dy = 0; e.cp2dx = 0; e.cp2dy = 0;
    delete e.manualPts;
    chooseAutoAnchorsForEdge(e, dir);
  });
  
  redrawEdges(); fitAll();
  invalidateBboxCache();
  saveState(dir === 'v' ? '세로 방향 자동 정렬' : '가로 방향 자동 정렬');
}

// ══════════════════════════════════════════════════
// SELECTION
// ══════════════════════════════════════════════════
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
    const e=edges[eid]; document.getElementById('sts').textContent=e?`연결: ${e.from}→${e.to}`:'—';
  } else {
    document.getElementById('sts').textContent='—';
  }
  updateInspector();
}
function clearSel(){
  selSet.clear();
  document.querySelectorAll('.ng.msel').forEach(el=>el.classList.remove('msel'));
  selItem(null);
}

// ══════════════════════════════════════════════════
// VIEWPORT
// ══════════════════════════════════════════════════
// 그리드 스냅 헬퍼: gridSnap=true일 때 20px 격자로 반올림
function snapG(v, sz=20){ return gridSnap ? Math.round(v/sz)*sz : v; }

function toggleGrid(){
  gridSnap=!gridSnap;
  const btn=document.getElementById('grid-btn');
  if(btn){
    btn.style.color      = gridSnap ? 'var(--ac)'  : '';
    btn.style.borderColor= gridSnap ? 'var(--ac)'  : '';
    btn.style.background = gridSnap ? 'var(--acd)' : '';
    btn.setAttribute('data-tip-sub', gridSnap ? '그리드 스냅 켜짐 (20px)' : '노드를 20px 격자에 맞춰 이동');
  }
  // 그리드 배경 강조도 토글
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
  
  // 화면 이동(Pan) 및 줌(Zoom)에 맞춰 배경 격자(Grid) 위치 동기화
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
  const ids=Object.keys(nodes); if(!ids.length){resetV();return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  ids.forEach(id=>{const n=nodes[id];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+nW(n));y1=Math.max(y1,n.y+nH(n));});
  const r=msvg.getBoundingClientRect();
  const pw=r.width>0?r.width-40:800, ph=r.height>0?r.height-40:600;
  const fw=x1-x0+80,fh=y1-y0+80;
  vs=Math.min(3,Math.max(.1,Math.min(pw/fw,ph/fh)));
  vx=(pw-fw*vs)/2-x0*vs+40; vy=(ph-fh*vs)/2-y0*vs+20; applyVP();
}

// ══════════════════════════════════════════════════
// MOUSE & EVENTS
// ══════════════════════════════════════════════════
let sbStart=null;

// 좌클릭 드래그(Pan)를 부드럽게 하기 위해 cvs 요소에 이벤트 부착
cvs.addEventListener('mousedown',e=>{
  // 중클릭(1) / 우클릭(2) → 패닝
  if((e.button === 1 || e.button === 2) && (e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL')){
    clearSel();
    drag = { type:'pan', sx: e.clientX - vx, sy: e.clientY - vy };
    cvs.classList.add('cg');
    e.preventDefault();
    return;
  }

  // UI 버튼류 클릭시 무시
  if(e.target.closest('button') || e.target.closest('input')) return;
  // 캔버스 바탕 좌클릭
  if(e.target === msvg || e.target === VP || e.target.id === 'EL' || e.target.id === 'NL'){
    // 연결 모드 중 빈 곳 클릭 → 취소
    if(connecting){ cancelConnect(); return; }
    if(reconnecting){ cancelReconnect(); return; }
    // 좌클릭 드래그 → 항상 박스 선택 (Shift 불필요)
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

// Click-to-connect 취소 로직 (빈 공간 클릭 or ESC)
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
  
  if(drag && drag.type !== 'selbox') drag.moved = true; // 드래그 움직임 감지

  // 마우스 커서 위치까지 실시간으로 선을 그리기 (연결 생성 / 재연결 공통)
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

    // 타깃 노드 하이라이트 + 가장 가까운 앵커 스냅 미리보기
    document.querySelectorAll('.ng.connect-target').forEach(el=>el.classList.remove('connect-target'));
    let snapPt = p; // 스냅 없으면 커서 위치 그대로
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
      // 곡선 미리보기: 출발 앵커 방향 반영
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
        nodes[o.id].x=o.x+dx; nodes[o.id].y=o.y+dy;
        document.getElementById('ng-'+o.id)?.setAttribute('transform',`translate(${nodes[o.id].x},${nodes[o.id].y})`);
      });
    } else {
      nodes[drag.id].x=leadX; nodes[drag.id].y=leadY;
      document.getElementById('ng-'+drag.id)?.setAttribute('transform',`translate(${nodes[drag.id].x},${nodes[drag.id].y})`);
    }
    invalidateBboxCache();
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
    invalidateBboxCache();
    renderNode(drag.id);
    document.getElementById('ng-'+drag.id)?.classList.add('sel');
    if(drag.edgeIds && drag.edgeIds.length) queueEdgeRedraw(drag.edgeIds);
  }
  else if(drag.type==='seg'){
    // 꺾은선 세그먼트 드래그: 해당 세그먼트를 수평/수직으로 밀기
    const pRaw = spt(e.clientX, e.clientY);
    const p = {x:snapG(pRaw.x), y:snapG(pRaw.y)};
    const e2 = edges[drag.eid]; if(!e2) return;
    const delta = (drag.isH ? p.y : p.x) - drag.startW;
    const op = drag.origPts;
    const si = drag.segIdx;
    const newPts = op.map(pt => [...pt]);
    if(drag.isH){
      // 수평 세그먼트 → Y축 이동
      // 세그먼트 양 끝점 Y 이동
      newPts[si][1]   = op[si][1]   + delta;
      newPts[si+1][1] = op[si+1][1] + delta;
      // 앞 꼭짓점(si-1): 수직선이므로 X는 유지, Y만 맞춤
      if(si > 0)           newPts[si-1][1] = newPts[si][1];
      // 뒤 꼭짓점(si+2): 수직선이므로 X는 유지, Y만 맞춤
      if(si+2 < op.length) newPts[si+2][1] = newPts[si+1][1];
    } else {
      // 수직 세그먼트 → X축 이동
      newPts[si][0]   = op[si][0]   + delta;
      newPts[si+1][0] = op[si+1][0] + delta;
      // 앞 꼭짓점(si-1): 수평선이므로 Y는 유지, X만 맞춤
      if(si > 0)           newPts[si-1][0] = newPts[si][0];
      // 뒤 꼭짓점(si+2): 수평선이므로 Y는 유지, X만 맞춤
      if(si+2 < op.length) newPts[si+2][0] = newPts[si+1][0];
    }
    // 첫점/끝점은 항상 앵커 좌표로 고정
    const from2 = anchorW(e2.from, e2.fromA);
    const to2   = anchorW(e2.to,   e2.toA);
    newPts[0] = [from2.x, from2.y];
    newPts[newPts.length-1] = [to2.x, to2.y];
    // 세그먼트 이동 후 직각 자동 보정 + 불필요 꺾임 정리
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
        // 곡선도 꺾은선과 동일하게 "드래그 시작점 + 델타" 방식으로 이동량 반영
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
    // 6px 이상 움직였을 때만 박스 표시
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
      // 현재 드래그 중인 화면 좌표 저장 (mouseup에서 사용)
      drag.cx = cx; drag.cy = cy;
    }
  }
});

window.addEventListener('mouseup',e=>{
  // ── 재연결 drag 완료 ──
  if(drag && drag.type==='reconnect' && reconnecting){
    if(!drag.moved){
      drag = null; // 클릭 방식: reconnecting 상태는 유지
      return;
    }
    const hit = findDropAnchorAt(e.clientX, e.clientY, reconnecting.fixedId);
    if(hit) finishReconnect(hit.toId, hit.toA);
    else cancelReconnect();
    return;
  }

  // ── 연결 drag 완료 ──
  if(drag && drag.type==='connect' && connecting){
    // 클릭 방식(움직임 없음): mouseup을 무시하고 connecting 상태 유지
    // 다음 앵커/노드 클릭(mousedown)에서 finishConnect가 호출됨
    if(!drag.moved){
      drag = null; // drag는 해제하되 connecting은 유지
      return;
    }

    // 드래그 방식: 놓은 위치에서 가장 가까운 앵커로 연결 완료 시도
    const hit = findDropAnchorAt(e.clientX, e.clientY, connecting.fromId);
    if(hit) finishConnect(hit.toId, hit.toA);
    else cancelConnect(); // 빈 곳에 놓음 → 취소
    return;
  }

  if(!drag) return;
  const dt=drag.type;
  if(dt==='pan') cvs.classList.remove('cg');
  else if(dt==='resize') {
    flushEdgeRedraw();
    const eids = autoCorrectStepEdgesForNodes([drag.id]);
    eids.forEach(renderEdge);
    selItem(drag.id);
    if(drag.moved) saveState('도형 크기 조절');
  }
  else if(dt==='node'){
    flushEdgeRedraw();
    const movedIds = drag.movingIds && drag.movingIds.length ? drag.movingIds : [drag.id];
    const eids = autoCorrectStepEdgesForNodes(movedIds);
    eids.forEach(renderEdge);
    if(drag.moved) saveState('도형 이동');
  }
  else if(dt==='cp' && drag.moved) saveState('선 굴곡(핸들) 조절');
  else if(dt==='seg' && drag.moved){
    // 세그먼트 드래그 완료: renderEdge로 핸들 재구성 + 상태 저장
    renderEdge(drag.eid);
    document.getElementById('eg-'+drag.eid)?.classList.add('sel');
    saveState('꺾은선 경로 조절');
  }
  else if(dt==='selbox'){
    selboxDiv.style.display='none';
    if(!drag.moved){
      // 드래그 없이 클릭만 → 선택 해제
      clearSel();
    } else {
      // 화면 좌표 박스 → 월드 좌표 박스로 변환
      const x1s = drag.sx, y1s = drag.sy;
      const x2s = drag.cx ?? drag.sx, y2s = drag.cy ?? drag.sy;
      const cvsR = cvs.getBoundingClientRect();
      // 화면상 left/top을 msvg 기준으로 변환
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
        else if(selSet.size>1){document.getElementById('sts').textContent=`${selSet.size}개 선택`;updateInspector();}
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

  // 캡처 모드 중에는 캡처 전용 리스너가 처리 (capture phase)
  if(capturingAction) return;

  // 화살표 키: 캔버스 패닝
  if(!isInput && (e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown')){
    e.preventDefault();
    arrowKeys[e.key] = true;
    startPanInterval();
    return;
  }

  // ── FIX: 통합 단축키 디스패치
  // 하드코딩된 Ctrl+Z/Y/C/V 블록 제거 → matchKey 시스템만 사용
  // 이전 버전: 둘 다 있어서 키를 재매핑해도 구 단축키가 여전히 동작하는 버그 존재
  if(!isInput){
    const handlers=getActionHandlers();
    // 입력 제외 액션 순서대로 확인 (specificity 높은 것부터: ctrl+shift > ctrl > shift > none)
    const sorted=Object.entries(keyBindings).sort((a,b)=>{
      const wa=(a[1].ctrl?4:0)+(a[1].shift?2:0)+(a[1].alt?1:0);
      const wb=(b[1].ctrl?4:0)+(b[1].shift?2:0)+(b[1].alt?1:0);
      return wb-wa;
    });
    for(const [action, binding] of sorted){
      if(matchKey(e, binding) && handlers[action]){
        e.preventDefault();
        handlers[action]();
        return;
      }
    }
  }

  // 입력창에서도 동작해야 하는 최소한의 키 (Escape)
  if(e.key==='Escape'){
    if(connecting) cancelConnect();
    if(reconnecting) cancelReconnect();
    clearSel();
  }

  // Delete/Backspace는 입력창이 아닐 때만 처리 (이미 위 루프에서 처리되지만 Backspace 폴백)
  if((e.key==='Backspace')&&(selId||selSet.size>0)){
    if(isInput) return;
    doDelete();
  }
});

// Listen for keyup to remove arrow keys from the pressed set and stop the pan interval
window.addEventListener('keyup', e => {
  if(e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown'){
    delete arrowKeys[e.key];
    // 관성 감속은 rAF 루프가 자연스럽게 처리
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
  saveState('도형 생성 (드래그)');
});

document.querySelectorAll('.pi').forEach(el=>{
  el.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('nodeType',el.dataset.type);
    e.dataTransfer.setData('nodeLabel',el.dataset.label||'');
  });
  // 클릭으로 중앙에 생성 기능 추가 보완 (현재 화면 정중앙 보정)
  el.addEventListener('click', e => {
    const type = el.dataset.type;
    const label = el.dataset.label;
    const s = S[type] || {w:140, h:44};
    const r = cvs.getBoundingClientRect();
    const cx = (r.width / 2 - vx) / vs;
    const cy = (r.height / 2 - vy) / vs;
    createNode(type, cx - s.w/2, cy - s.h/2, null, label);
    saveState('도형 생성 (클릭)');
  });
});

// ══════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════
function deleteSel(){
  if(!selId) return;
  if(selId.startsWith('edge:')){
    const eid=selId.slice(5);
    removeEdgeDOM(eid); delete edges[eid];
  } else {
    document.getElementById('ng-'+selId)?.remove(); delete nodes[selId];
    invalidateBboxCache();
    Object.keys(edges).forEach(eid=>{
      if(edges[eid]?.from===selId||edges[eid]?.to===selId){
        removeEdgeDOM(eid); delete edges[eid];
      }
    });
  }
  selId=null; updateInspector(); updateStatus();
  saveState('단일 항목 삭제');
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
    edgeIds=Object.keys(edges).filter(eid=>{
      const e=edges[eid];
      return e&&set.has(e.from)&&set.has(e.to);
    });
  }else if(selId&&selId.startsWith('edge:')){
    const e=edges[selId.slice(5)];
    if(e){
      nodeIds=[e.from,e.to];
      const set=new Set(nodeIds);
      edgeIds=Object.keys(edges).filter(eid=>{
        const x=edges[eid];
        return x&&set.has(x.from)&&set.has(x.to);
      });
    }
  }
  if(!nodeIds.length){showAlert('복사할 항목을 먼저 선택하세요.');return;}
  const copiedNodes=nodeIds.map(id=>jClone(nodes[id])).filter(Boolean);
  const copiedEdges=edgeIds.map(id=>jClone(edges[id])).filter(Boolean);
  clipBundle={nodes:copiedNodes,edges:copiedEdges};
  pasteSeq=0;
}
function pasteSelection(){
  if(!clipBundle||!clipBundle.nodes||!clipBundle.nodes.length){
    showAlert('붙여넣기할 복사 데이터가 없습니다. (Ctrl+C 먼저)');
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
    document.getElementById('sts').textContent=`${selSet.size}개 선택`;
    updateInspector();
  }
  updateStatus();
  invalidateBboxCache();
  saveState('복사 붙여넣기');
}

// ══════════════════════════════════════════════════
// INSPECTOR
// ══════════════════════════════════════════════════
function updateInspector(){
  const body=document.getElementById('ibd');
  const badge=document.getElementById('ibg');
  if(selSet.size>1&&!selId){
    badge.textContent=selSet.size+'개'; badge.style.color='#ffaa33';
    body.innerHTML=`<div style="padding:8px 0;font-size:11px;color:var(--tx2)">${selSet.size}개 노드 선택됨<br><br>이동: 드래그<br>삭제: Del 키<br>해제: Esc 키</div>`;
    return;
  }
  if(!selId){
    badge.textContent=''; badge.style.color='';
    body.innerHTML=`<div class="ie"><div class="ieg">◈</div><div class="iet">노드 또는<br>연결선을 선택하세요</div></div>`;
    return;
  }
  if(selId.startsWith('edge:')){
    const eid=selId.slice(5); const edge=edges[eid]; if(!edge) return;
    badge.textContent='EDGE'; badge.style.color='var(--ac)';
    body.innerHTML=`
      <div class="fg"><div class="fl">Edge ID</div><input class="fi" value="${escAttr(eid)}" readonly></div>
      <div class="fg"><div class="fl">연결</div><input class="fi" value="${escAttr(edge.from)} → ${escAttr(edge.to)}" readonly></div>
      <div class="fg"><div class="fl">표시 이름</div><input class="fi" id="en" value="${escAttr(edge.name||'')}"></div>
      <div class="fg"><div class="fl">조건/이벤트</div><input class="fi" id="el" value="${escAttr(edge.label||'')}"></div>
      <div class="fsep"></div>
      <div class="fg">
        <div class="fl">선 스타일 (Edge Style)</div>
        <select class="fi" id="els" style="cursor:pointer">
          <option value="">기본 (상단 전역설정)</option>
          <option value="curve" ${edge.lineStyle==='curve'?'selected':''}>➰ 곡선 (Curve)</option>
          <option value="step" ${edge.lineStyle==='step'?'selected':''}>🔀 꺾은선 (Step)</option>
          <option value="straight" ${edge.lineStyle==='straight'?'selected':''}>📏 직선 (Straight)</option>
        </select>
      </div>
      <!-- Custom colour pickers for edge -->
      <div class="fg">
        <div class="fl">선 색상 (화살표 포함)</div>
        <div style="display:flex;gap:4px;align-items:center">
          <input class="fi" id="ec-color" type="color" value="${safeHexColor(edge.color,'#00d4ff')}" style="width:36px;padding:1px 2px;cursor:pointer">
          <button class="hbtn" id="ec-reset" style="font-size:9px;padding:0 5px;min-width:28px" title="선 색상 초기화 (기본값)">↺</button>
        </div>
      </div>
      <div class="fg">
        <div class="fl">글자 색상</div>
        <div style="display:flex;gap:4px;align-items:center">
          <input class="fi" id="etc-color" type="color" value="${safeHexColor(edge.txtColor,'#dde6f5')}" style="width:36px;padding:1px 2px;cursor:pointer">
          <button class="hbtn" id="etc-reset" style="font-size:9px;padding:0 5px;min-width:28px" title="글자 색상 초기화">↺</button>
        </div>
      </div>
      <button class="hbtn" id="edge-reset-curve" title="선 굴곡 리셋">↺ 경로 리셋</button>
      <button class="hbtn" id="edge-delete" title="연결선 삭제">🗑</button>`;
  
  let _edgeRenderRAF=0;
  const _scheduleEdgeRender=()=>{
    if(_edgeRenderRAF) return;
    _edgeRenderRAF=requestAnimationFrame(()=>{
      _edgeRenderRAF=0;
      renderEdge(eid);
      document.getElementById('eg-'+eid)?.classList.add('sel');
    });
  };

  document.getElementById('en').addEventListener('change',ev=>{saveState('선 텍스트 변경');});
  document.getElementById('en').addEventListener('input',ev=>{edge.name=ev.target.value;_scheduleEdgeRender();});
  
  document.getElementById('el').addEventListener('change',ev=>{saveState('조건/이벤트 텍스트 변경');});
  document.getElementById('el').addEventListener('input',ev=>{edge.label=ev.target.value;_scheduleEdgeRender();});
  
  document.getElementById('els').addEventListener('change',ev=>{edge.lineStyle=ev.target.value;renderEdge(eid);document.getElementById('eg-'+eid)?.classList.add('sel');saveState('개별 선 스타일 변경');});

  // 선 색상 피커 + 초기화
  const ecColorI = document.getElementById('ec-color');
  if(ecColorI){
    ecColorI.addEventListener('input', ev => {
      edge.color = ev.target.value;
      _scheduleEdgeRender();
    });
    ecColorI.addEventListener('change', () => saveState('선 색상 변경'));
  }
  document.getElementById('ec-reset')?.addEventListener('click', () => {
    delete edge.color;
    renderEdge(eid);
    document.getElementById('eg-'+eid)?.classList.add('sel');
    if(ecColorI) ecColorI.value = '#00d4ff';
    saveState('선 색상 초기화');
  });

  // 글자 색상 피커 + 초기화
  const etcColorI = document.getElementById('etc-color');
  if(etcColorI){
    etcColorI.addEventListener('input', ev => {
      edge.txtColor = ev.target.value;
      renderEdge(eid);
      document.getElementById('eg-'+eid)?.classList.add('sel');
    });
    etcColorI.addEventListener('change', () => saveState('글자 색상 변경'));
  }
  document.getElementById('etc-reset')?.addEventListener('click', () => {
    delete edge.txtColor;
    renderEdge(eid);
    document.getElementById('eg-'+eid)?.classList.add('sel');
    if(etcColorI) etcColorI.value = '#dde6f5';
    saveState('글자 색상 초기화');
  });
  document.getElementById('edge-reset-curve')?.addEventListener('click',()=>resetEdgeCurve(eid));
  document.getElementById('edge-delete')?.addEventListener('click',()=>deleteSel());
  return;
}
const n=nodes[selId]; if(!n) return;
  const s=S[n.type];
  badge.textContent=s?.label||n.type; badge.style.color=`var(${s?.t||'--tx2'})`;
  const ph=Object.entries(n.properties).map(([k,v])=>`
    <div class="pr"><input class="pk" value="${escAttr(k)}" placeholder="키"><input class="pv" value="${escAttr(v)}" placeholder="값"><button class="dx" data-del-key="${escAttr(k)}">✕</button></div>`).join('');
  body.innerHTML=`
    <div class="fg"><div class="fl">Node ID</div><input class="fi" value="${escAttr(n.id)}" readonly></div>
    <div class="fg"><div class="fl">레이블</div><input class="fi" id="nl" value="${escAttr(n.label||'')}"></div>
    <div class="fsep"></div>
    <div class="phd"><div class="ptt">크기 및 배치</div></div>
    <div class="frow">
      <div class="fhalf"><div class="fl">너비</div><input class="fi" id="nw" type="number" value="${Math.round(nW(n))}" min="16" max="600" step="4"></div>
      <div class="fhalf"><div class="fl">높이</div><input class="fi" id="nh" type="number" value="${Math.round(nH(n))}" min="12" max="400" step="4"></div>
    </div>
    <!-- Colour pickers for node fill and text -->
    <div class="fg">
      <div class="fl">색상</div>
      <input class="fi" id="nc" type="color" value="${safeHexColor(n.color,'#000000')}">
    </div>
    <div class="fg">
      <div class="fl">글자 색상</div>
      <input class="fi" id="ntc" type="color" value="${safeHexColor(n.txtColor,'#000000')}">
    </div>
    <div class="frow" style="margin-top:4px;">
      <button class="hbtn" id="node-front" style="flex:1" title="맨 앞으로">🔼</button>
      <button class="hbtn" id="node-back" style="flex:1" title="맨 뒤로">🔽</button>
    </div>
  <div class="fsep"></div>
  <div class="phd"><div class="ptt">속성</div><button class="ab" id="node-add-prop">＋</button></div>
  <div id="plist">${ph}</div>
  <div class="fsep"></div>
  <button class="hbtn" id="node-delete" title="노드 삭제">🗑</button>`;
  
  document.getElementById('nl').addEventListener('change',ev=>{saveState('레이블 텍스트 변경');});
  document.getElementById('nl').addEventListener('input',ev=>{
    n.label=ev.target.value;
    // 레이블만 직접 업데이트 — 전체 renderNode 불필요
    const tx=document.querySelector('#ng-'+selId+' .ntx');
    if(tx) tx.textContent=ev.target.value;
  });

  let _nodeRenderRAF=0;
  const _scheduleNodeRender=()=>{
    if(_nodeRenderRAF) return;
    _nodeRenderRAF=requestAnimationFrame(()=>{ _nodeRenderRAF=0; renderNode(selId); selItem(selId); });
  };

  const nwI=document.getElementById('nw'), nhI=document.getElementById('nh');
  const applySize=()=>{
    n.sw=Math.max(16,parseInt(nwI.value)||nW(n));
    n.sh=Math.max(12,parseInt(nhI.value)||nH(n));
    invalidateBboxCache();
    renderNode(selId); redrawEdges(); selItem(selId);
  };
  nwI.addEventListener('change',()=>{applySize(); saveState('너비 변경');});
  nhI.addEventListener('change',()=>{applySize(); saveState('높이 변경');});

  const ncI=document.getElementById('nc');
  if(ncI){
    ncI.addEventListener('input', ev => {
      n.color = ev.target.value;
      _scheduleNodeRender();
    });
    ncI.addEventListener('change', ()=>saveState('노드 색상 변경'));
  }
  const ntcI=document.getElementById('ntc');
  if(ntcI){
    ntcI.addEventListener('input', ev => {
      n.txtColor = ev.target.value;
      _scheduleNodeRender();
    });
    ntcI.addEventListener('change', ()=>saveState('노드 텍스트 색상 변경'));
  }
  document.getElementById('node-front')?.addEventListener('click',()=>nodeToFront(selId));
  document.getElementById('node-back')?.addEventListener('click',()=>nodeToBack(selId));
  document.getElementById('node-add-prop')?.addEventListener('click',()=>aProp(selId));
  document.getElementById('node-delete')?.addEventListener('click',()=>deleteSel());
  body.querySelectorAll('#plist .dx[data-del-key]').forEach(btn=>{
    btn.addEventListener('click',()=>dProp(selId,btn.dataset.delKey||''));
  });
  body.querySelectorAll('.pk,.pv').forEach(inp=>inp.addEventListener('change',()=>saveState('속성(Key/Value) 변경')));
  body.querySelectorAll('.pk,.pv').forEach(inp=>inp.addEventListener('blur',()=>rebuildP(selId)));
  if(typeof refreshTooltips === 'function') refreshTooltips();
}
function rebuildP(nid){
const rows=document.querySelectorAll('#plist .pr');const p={};
rows.forEach(r=>{const k=r.querySelector('.pk').value.trim(),v=r.querySelector('.pv').value.trim();if(k)p[k]=v;});
nodes[nid].properties=p;
}
function aProp(nid){if(!nodes[nid])return;nodes[nid].properties['prop_'+Object.keys(nodes[nid].properties).length]='';updateInspector();saveState();}
function dProp(nid,k){delete nodes[nid].properties[k];updateInspector();saveState();}
function resetEdgeCurve(eid){
if(!edges[eid])return;
edges[eid].cp1dx=0;edges[eid].cp1dy=0;edges[eid].cp2dx=0;edges[eid].cp2dy=0;
delete edges[eid].manualPts;
renderEdge(eid);
document.getElementById('eg-'+eid)?.classList.add('sel');
document.getElementById('ep-'+eid)?.classList.add('hl');
saveState();
}

// 노드 레이블 수정 확정 함수. 더블클릭 시 renameTarget에 id가 저장되며
// 사용자가 입력을 완료하고 '확인' 버튼을 누르면 이 함수가 호출되어 레이블을 업데이트합니다.
function confirmRename(){
  const inp = document.getElementById('rename-input');
  if(renameTarget && nodes[renameTarget]){
    const newLabel = inp.value;
    nodes[renameTarget].label = newLabel;
    renderNode(renameTarget);
    // 선택 상태 유지
    updateInspector();
    saveState('레이블 수정');
  }
  renameTarget = null;
  cm('m-rename');
}

// ── 레이블 수정 인풋에서 Enter/ESC 처리를 등록 ──
// 이 리스너는 한 번만 추가되어도 충분함
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

// ══════════════════════════════════════════════════
// STATUS / MODE
// ══════════════════════════════════════════════════
function updateStatus(){
  document.getElementById('stn').textContent='노드: '+Object.keys(nodes).length;
  document.getElementById('ste').textContent='연결: '+Object.keys(edges).length;
}
function setMode(m){
  mode=m;
  ['fc','fsm','bt','sc'].forEach(k=>{
    document.getElementById('tab-'+k).classList.toggle('on',k===m);
    document.getElementById('p'+k).style.display=k===m?'':'none';
  });
}

// ══════════════════════════════════════════════════
// THEME
// ══════════════════════════════════════════════════
function toggleTheme(){
  lightMode=!lightMode;
  document.body.classList.toggle('light',lightMode);
  document.getElementById('thbtn').textContent=lightMode?'☀️':'🌙';
}


