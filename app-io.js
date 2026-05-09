// ══════════════════════════════════════════════════
// EXPORT / IMPORT
// ══════════════════════════════════════════════════
function getData(){
  return{
    project:document.getElementById('pname').value||'Untitled', mode, lineStyle: globalLineStyle,
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
      manualPts:e.manualPts || null
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
      if(!ok) showAlert('복사 실패: Ctrl+C로 수동 복사해 주세요.');
    });
    return;
  }
  ta.focus(); ta.select();
  let ok=false;
  try{ ok=document.execCommand('copy'); }catch(_){}
  if(!ok) showAlert('복사 실패: Ctrl+C로 수동 복사해 주세요.');
}
function dlJSON(){
  const d=getData();
  const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=url; a.download=d.project+'.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

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
  document.getElementById('imp-file').value=''; // input 초기화
  document.getElementById('m-imp').style.display='flex';
}

function doImp(){
  try{
    const d=JSON.parse(document.getElementById('m-imp-ta').value.trim());
    clearCanvas(true);
    if(d.project) document.getElementById('pname').value=d.project;
    if(d.mode) setMode(d.mode);
    if(d.lineStyle){ globalLineStyle=d.lineStyle; 
      const btn=document.getElementById('lstyle-btn');
      if(globalLineStyle==='step') btn.textContent='🔀 선: 꺾은선'; else if(globalLineStyle==='straight') btn.textContent='📏 선: 직선'; else btn.textContent='➰ 선: 곡선';
    }
    // nc/ec 최댓값을 먼저 스캔해 ID 충돌 방지
    (d.nodes||[]).forEach(n=>{ nc=Math.max(nc,parseInt(n.id.replace(/\D/g,''))||0); });
    (d.edges||[]).forEach(e=>{ ec=Math.max(ec,parseInt(e.id.replace(/\D/g,''))||0); });

    (d.nodes||[]).forEach(n=>{
      createNode(n.type,n.x,n.y,n.id,n.label,n.properties||{},n.sw,n.sh);
      if(n.color) nodes[n.id].color = n.color;
      if(n.txtColor) nodes[n.id].txtColor = n.txtColor;
      renderNode(n.id);
    });
    // 노드 렌더 완료 후 다음 페인트 2회 뒤에 엣지 복원
    // (setTimeout(60) 대신 rAF 2회: 느린 환경에서도 레이아웃이 확정된 뒤 실행 보장)
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      (d.edges||[]).forEach(e=>{
        const eid=createEdge(e.from,e.to,e.from_anchor,e.to_anchor,e.id,e.label,e.name,e.cp1dx,e.cp1dy,e.cp2dx,e.cp2dy);
        if(eid){
          if(e.lineStyle) edges[eid].lineStyle = e.lineStyle;
          if(e.color) edges[eid].color = e.color;
          if(e.txtColor) edges[eid].txtColor = e.txtColor;
          if(e.manualPts) edges[eid].manualPts = e.manualPts;
          renderEdge(eid);
        }
      });
      saveState('가져오기 완료');
      scheduleWorkspaceAutosave();
      cm('m-imp');
    }));
  }catch(err){showAlert('JSON 파싱 오류: '+err.message);}
}

// 초기화시 데모 복원 방지 및 완전 비우기 추가 적용
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
invalidateBboxCache();
NL.innerHTML=''; EL.innerHTML=''; LBL.innerHTML='';
const newName = 'Untitled_Flow';
document.getElementById('pname').value = newName;
const sh = sheets.find(s=>s.id===activeSheetId);
if(sh){ sh.name = newName; renderSheetBar(); }
updateInspector();updateStatus();
cm('m-confirm');
saveState('캔버스 초기화');
}

// ══════════════════════════════════════════════════
// CAPTURE  — data: URL 방식으로 tainted canvas 완전 해결
// ══════════════════════════════════════════════════
function captureFlow(){
  const ids=Object.keys(nodes);
  if(!ids.length){showAlert('캔버스에 노드가 없습니다.');return;}

  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  ids.forEach(id=>{
    const n=nodes[id];
    x0=Math.min(x0,n.x); y0=Math.min(y0,n.y);
    x1=Math.max(x1,n.x+nW(n)); y1=Math.max(y1,n.y+nH(n));
  });
  const pad=70, CW=Math.ceil(x1-x0+pad*2), CH=Math.ceil(y1-y0+pad*2), ox=x0-pad, oy=y0-pad;

  // ── 선택 상태 임시 제거 ──
  const prevSel=selId;
  document.querySelectorAll('.ng.sel,.ng.msel,.eg.sel,.ep.hl').forEach(el=>{
    el.classList.remove('sel','msel','hl');
  });

  // ── SVG 노드/엣지 그룹을 CSS var 해석한 채로 직렬화 ──
  const cs = getComputedStyle(document.documentElement);
  function rv(val){ // resolve CSS vars
    if(!val) return val;
    return val.replace(/var\(([^)]+)\)/g,(_,k)=>cs.getPropertyValue(k.trim()).trim()||'#888');
  }

  function cloneForExport(el){
    if(el.nodeType===3) return document.createTextNode(el.textContent);
    if(el.nodeType!==1) return null;
    // 캡처에서 제외할 요소
    const cls=el.className?.baseVal||el.className||'';
    if(/\ban\b|\brh\b|\bnid\b|\behit\b|\bcph\b|\bcpl\b|\bconnect-target\b/.test(cls)) return null;
    if(el.id==='tl') return null;

    const tag=el.tagName.toLowerCase();
    const c=document.createElementNS('http://www.w3.org/2000/svg', el.tagName);

    // 속성 복사 + var() 해석
    for(const a of el.attributes){
      if(a.name==='style') continue; // style은 아래서 처리
      c.setAttribute(a.name, rv(a.value));
    }

    // 인라인 스타일 해석
    const inlineSt=el.getAttribute('style');
    if(inlineSt) c.setAttribute('style', rv(inlineSt));

    // 도형 요소: 계산된 fill/stroke를 직접 주입
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

    // text 요소: fill 색상 주입
    if(tag==='text'){
      const computed=getComputedStyle(el);
      if(!c.getAttribute('fill')||c.getAttribute('fill').includes('var(')){
        const f=rv(el.getAttribute('fill')||'')||computed.color||computed.fill;
        if(f) c.setAttribute('fill',f);
      }
      // 외부 폰트 제거 → 안전한 폰트로 교체
      let fs=c.getAttribute('style')||'';
      fs=fs.replace(/font-family:[^;]+;?/g,'');
      c.setAttribute('style',fs);
      c.setAttribute('font-family','Arial,sans-serif');
    }

    // 자식 재귀
    for(const ch of el.childNodes){
      const cc=cloneForExport(ch);
      if(cc) c.appendChild(cc);
    }
    return c;
  }

  const ELc=cloneForExport(document.getElementById('EL'));
  const LBLc=cloneForExport(document.getElementById('LBL'));
  const NLc=cloneForExport(document.getElementById('NL'));

  // 선택 상태 복원
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

  // data: URL 방식 → crossOrigin 문제 없음
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
    ctx.fillText('렌더링 실패 — SVG로 저장해주세요.',20,40);
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
  const proj=document.getElementById('pname').value||'flow';
  if(fmt==='svg'){
    if(!capSVG||capSVG.indexOf('<svg')===-1){
      captureFlow();
      if(!capSVG||capSVG.indexOf('<svg')===-1){
        showAlert('SVG 생성에 실패했습니다.');
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
    if(!bl){showAlert('PNG 생성에 실패했습니다.');return;}
    downloadBlob(proj+'.png', bl);
  },'image/png');
}


