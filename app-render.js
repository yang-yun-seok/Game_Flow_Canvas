// ══════════════════════════════════════════════════
// SHAPE CATALOGUE
// ══════════════════════════════════════════════════
const S={
  // Flowchart
  terminal:  {w:160,h:56,c:'--c-terminal', b:'--b-terminal',t:'--t-terminal',label:'터미널',   end:true, draw:dTerminal},
  process:   {w:160,h:56,c:'--c-process',  b:'--b-process', t:'--t-process', label:'프로세스',end:false,draw:dProcess},
  decision:  {w:160,h:76,c:'--c-decision', b:'--b-decision',t:'--t-decision',label:'조건',    end:false,draw:dDecision},
  io:        {w:170,h:56,c:'--c-io',       b:'--b-io',      t:'--t-io',      label:'I/O',     end:false,draw:dIO},
  output:    {w:160,h:64,c:'--c-output',   b:'--b-output',  t:'--t-output',  label:'출력',    end:true, draw:dOutput, tyRatio:0.42},
  subroutine:{w:168,h:56,c:'--c-subroutine',b:'--b-subroutine',t:'--t-subroutine',label:'서브루틴',end:false,draw:dSubroutine},
  prepare:   {w:160,h:56,c:'--c-prepare',  b:'--b-prepare', t:'--t-prepare', label:'준비',    end:false,draw:dPrepare},
  manual:    {w:168,h:56,c:'--c-manual',   b:'--b-manual',  t:'--t-manual',  label:'수동입력',end:false,draw:dManual, tyRatio:0.55},
  manualop:  {w:168,h:56,c:'--c-manualop', b:'--b-manualop',t:'--t-manualop',label:'수동조작',end:false,draw:dManualOp},
  delay:     {w:156,h:56,c:'--c-delay',    b:'--b-delay',   t:'--t-delay',   label:'지연',    end:false,draw:dDelay},
  display:   {w:164,h:56,c:'--c-display',  b:'--b-display', t:'--t-display', label:'디스플레이',end:true,draw:dDisplay},
  connector: {w:50, h:50,c:'--c-connector',b:'--b-connector',t:'--t-connector',label:'A',     end:false,draw:dConnector},
  merge:     {w:86, h:70,c:'--c-merge',    b:'--b-merge',   t:'--t-merge',   label:'병합',    end:false,draw:dMerge},
  // Game UI
  screen:    {w:170,h:64,c:'--c-screen',   b:'--b-screen',  t:'--t-screen',  label:'화면',    end:false,draw:dScreen},
  popup:     {w:160,h:56,c:'--c-popup',    b:'--b-popup',   t:'--t-popup',   label:'팝업',    end:false,draw:dPopup},
  uibutton:  {w:140,h:44,c:'--c-uibutton', b:'--b-uibutton',t:'--t-uibutton',label:'버튼',    end:false,draw:dUIButton},
  uidialog:  {w:160,h:60,c:'--c-uidialog', b:'--b-uidialog',t:'--t-uidialog',label:'대화창',  end:false,draw:dUIDialog, tyRatio:0.42},
  uiimage:   {w:140,h:60,c:'--c-uiimage',  b:'--b-uiimage', t:'--t-uiimage', label:'이미지',  end:false,draw:dUIImage},
  uilist:    {w:140,h:80,c:'--c-uilist',   b:'--b-uilist',  t:'--t-uilist',  label:'리스트',  end:false,draw:dUIList},
  system:    {w:160,h:64,c:'--c-system',   b:'--b-system',  t:'--t-system',  label:'시스템',  end:false,draw:dSystem},
  db:        {w:140,h:68,c:'--c-db',       b:'--b-db',      t:'--t-db',      label:'DB',      end:true, draw:dDB},
  document:  {w:160,h:64,c:'--c-document', b:'--b-document',t:'--t-document',label:'문서',    end:true, draw:dDocument, tyRatio:0.42},
  // FSM
  state:     {w:150,h:56,c:'--c-state',    b:'--b-state',   t:'--t-state',   label:'상태',      end:false,draw:dState},
  initial:   {w:50, h:50,c:'--c-initial',  b:'--b-initial', t:'--t-initial', label:'초기',      end:false,draw:dInitial},
  accepting: {w:150,h:56,c:'--c-accepting',b:'--b-accepting',t:'--t-accepting',label:'수락',    end:true, draw:dAccepting},
  fsmchoice: {w:76, h:76,c:'--c-fsmchoice',b:'--b-fsmchoice',t:'--t-fsmchoice',label:'선택',   end:false,draw:dDecision},
  fsmfork:   {w:160,h:16,c:'--b-fsmfork',  b:'--b-fsmfork', t:'--t-fsmfork', label:'분기',     end:false,draw:dBar},
  fsmjoin:   {w:160,h:16,c:'--b-fsmjoin',  b:'--b-fsmjoin', t:'--t-fsmjoin', label:'합류',     end:false,draw:dBar},
  fsmhist:   {w:50, h:50,c:'--c-fsmhist',  b:'--b-fsmhist', t:'--t-fsmhist', label:'H',        end:false,draw:dHistCirc},
  fsmentrypt:{w:50, h:50,c:'--c-fsmentrypt',b:'--b-fsmentrypt',t:'--t-fsmentrypt',label:'진입', end:false,draw:dSmCirc},
  fsmfinal:  {w:50, h:50,c:'--c-fsmfinal', b:'--b-fsmfinal',t:'--t-fsmfinal',label:'',         end:true, draw:dFsmFinal},
  fsmdeephist:{w:50,h:50,c:'--c-fsmdeephist',b:'--b-fsmdeephist',t:'--t-fsmdeephist',label:'H*',end:false,draw:dFsmDeepHist},
  fsmguard:  {w:170,h:40,c:'--c-fsmguard', b:'--b-fsmguard',t:'--t-fsmguard',label:'[가드]',   end:false,draw:dFsmGuard},
  fsmerr:    {w:150,h:56,c:'--c-fsmerr',   b:'--b-fsmerr',  t:'--t-fsmerr',  label:'오류 상태', end:false,draw:dFsmErr},
  fsmsub:    {w:180,h:80,c:'--c-fsmsub',   b:'--b-fsmsub',  t:'--t-fsmsub',  label:'서브 머신', end:false,draw:dFsmSub},
  fsmterm:   {w:50, h:50,c:'--c-fsmterm',  b:'--b-fsmterm', t:'--t-fsmterm', label:'',          end:true, draw:dFsmTerm},
  fsmaction: {w:160,h:72,c:'--c-fsmaction',b:'--b-fsmaction',t:'--t-fsmaction',label:'상태',   end:false,draw:dFsmAction},
  // Behavior Tree
  btroot:    {w:120,h:56,c:'--c-btroot',   b:'--b-btroot',  t:'--t-btroot',  label:'루트',     end:false,draw:dTerminal},
  btseq:     {w:140,h:56,c:'--c-btseq',    b:'--b-btseq',   t:'--t-btseq',   label:'→ 시퀀스', end:false,draw:dProcess},
  btsel:     {w:140,h:56,c:'--c-btsel',    b:'--b-btsel',   t:'--t-btsel',   label:'? 셀렉터',  end:false,draw:dProcess},
  btpar:     {w:140,h:56,c:'--c-btpar',    b:'--b-btpar',   t:'--t-btpar',   label:'⇉ 병렬',   end:false,draw:dProcess},
  btdec:     {w:150,h:56,c:'--c-btdec',    b:'--b-btdec',   t:'--t-btdec',   label:'데코레이터', end:false,draw:dPrepare},
  btleaf:    {w:150,h:56,c:'--c-btleaf',   b:'--b-btleaf',  t:'--t-btleaf',  label:'액션',     end:true, draw:dRoundRect},
  btcond:    {w:76, h:76,c:'--c-btcond',   b:'--b-btcond',  t:'--t-btcond',  label:'조건',     end:false,draw:dDecision},
  btsub:     {w:150,h:56,c:'--c-btsub',    b:'--b-btsub',   t:'--t-btsub',   label:'서브트리',  end:false,draw:dSubroutine},
  btinv:     {w:140,h:56,c:'--c-btinv',    b:'--b-btinv',   t:'--t-btinv',   label:'! 반전',   end:false,draw:dBtInv},
  btrepeat:  {w:150,h:56,c:'--c-btrepeat', b:'--b-btrepeat',t:'--t-btrepeat',label:'반복 N',   end:false,draw:dBtRepeat},
  btretry:   {w:150,h:56,c:'--c-btretry',  b:'--b-btretry', t:'--t-btretry', label:'재시도 N',  end:false,draw:dBtRetry},
  btfail:    {w:140,h:56,c:'--c-btfail',   b:'--b-btfail',  t:'--t-btfail',  label:'강제 실패', end:false,draw:dBtFail},
  btsuc:     {w:140,h:56,c:'--c-btsuc',    b:'--b-btsuc',   t:'--t-btsuc',   label:'강제 성공', end:false,draw:dBtSuc},
  btwait:    {w:140,h:56,c:'--c-btwait',   b:'--b-btwait',  t:'--t-btwait',  label:'대기',     end:false,draw:dBtWait},
  btrsel:    {w:150,h:56,c:'--c-btrsel',   b:'--b-btrsel',  t:'--t-btrsel',  label:'랜덤 선택', end:false,draw:dBtRsel},
  // Sequence Chart
  sclife:    {w:170,h:56,c:'--c-sclife',   b:'--b-sclife',  t:'--t-sclife',  label:':행위자',  end:false,draw:dScLifeHead,scLifeline:true},
  scact:     {w:20, h:100,c:'--c-scact',   b:'--b-scact',   t:'--t-scact',   label:'',         end:false,draw:dProcess},
  scmsg:     {w:200,h:30,c:'--c-scmsg',    b:'--b-scmsg',   t:'--t-scmsg',   label:'msg()',    end:false,draw:dScMsg,noAnchors:true},
  scref:     {w:200,h:30,c:'--c-scref',    b:'--b-scref',   t:'--t-scref',   label:'ref()',    end:false,draw:dScMsgDash,noAnchors:true},
  scnote:    {w:160,h:64,c:'--c-scnote',   b:'--b-scnote',  t:'--t-scnote',  label:'메모',     end:false,draw:dScNote},
  scfrag:    {w:220,h:140,c:'--c-scfrag',  b:'--b-scfrag',  t:'--t-scfrag',  label:'loop',     end:false,draw:dScFrag},
  scgate:    {w:24, h:24, c:'--c-scgate',  b:'--b-scgate',  t:'--t-scgate',  label:'',         end:false,draw:dConnector},
  screply:   {w:200,h:30,c:'--c-screply',  b:'--b-screply', t:'--t-screply', label:'return',   end:false,draw:dScReply,noAnchors:true},
  sccreate:  {w:200,h:30,c:'--c-sccreate', b:'--b-sccreate',t:'--t-sccreate',label:'create()', end:false,draw:dScCreate,noAnchors:true},
  scdestroy: {w:40, h:40,c:'--c-scdestroy',b:'--b-scdestroy',t:'--t-scdestroy',label:'',      end:false,draw:dScDestroy},
  scalt:     {w:240,h:160,c:'--c-scalt',   b:'--b-scalt',   t:'--t-scalt',   label:'alt',     end:false,draw:dScAlt},
  scopt:     {w:220,h:120,c:'--c-scopt',   b:'--b-scopt',   t:'--t-scopt',   label:'opt',     end:false,draw:dScOpt},
  scpar:     {w:240,h:180,c:'--c-scpar',   b:'--b-scpar',   t:'--t-scpar',   label:'par',     end:false,draw:dScPar},
  scloop:    {w:220,h:140,c:'--c-scloop',  b:'--b-scloop',  t:'--t-scloop',  label:'loop',    end:false,draw:dScLoop},
  scobj:     {w:160,h:56,c:'--c-scobj',    b:'--b-scobj',   t:'--t-scobj',   label:':객체',   end:false,draw:dScObj},
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

// ── FSM new draw functions ──
function dFsmFinal(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/><circle cx="${r}" cy="${r}" r="${r*.5}" fill="var(--b-fsmfinal)"/>`;}
function dFsmDeepHist(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/><text x="${r}" y="${r+1}" font-size="${r*.7}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="var(--t-fsmdeephist)">H*</text>`;}
function dFsmGuard(w,h){const s=h*.35;return `<polygon points="${s},0 ${w-s},0 ${w},${h/2} ${w-s},${h} ${s},${h} 0,${h/2}"/><line x1="${s+6}" y1="${h*.5}" x2="${w-s-6}" y2="${h*.5}" stroke="var(--t-fsmguard)" stroke-width="1" opacity="0.4"/>`;}
function dFsmErr(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h/2}" ry="${h/2}"/><line x1="${w*.35}" y1="${h*.28}" x2="${w*.65}" y2="${h*.72}" stroke="var(--t-fsmerr)" stroke-width="2" opacity="0.6"/><line x1="${w*.65}" y1="${h*.28}" x2="${w*.35}" y2="${h*.72}" stroke="var(--t-fsmerr)" stroke-width="2" opacity="0.6"/>`;}
function dFsmSub(w,h){const m=14;return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><rect x="${m}" y="${m}" width="${w-m*2}" height="${h-m*2}" rx="2" fill="none" stroke="var(--b-fsmsub)" stroke-width="1" opacity="0.5"/><circle cx="${w*.2}" cy="${h*.5}" r="4" fill="none" stroke="var(--b-fsmsub)" stroke-width="1.4" opacity="0.7"/><line x1="${w*.2+4}" y1="${h*.5}" x2="${w*.35}" y2="${h*.5}" stroke="var(--b-fsmsub)" stroke-width="1.4" opacity="0.7"/>`;}
function dFsmTerm(w,h){const r=Math.min(w,h)/2;return `<circle cx="${r}" cy="${r}" r="${r-1}"/><circle cx="${r}" cy="${r}" r="${r*.65}" fill="var(--b-fsmterm)"/><circle cx="${r}" cy="${r}" r="${r*.38}" fill="var(--c-fsmterm)"/>`;}
function dFsmAction(w,h){const divY=h*.55;return `<rect x="0" y="0" width="${w}" height="${h}" rx="${h*.14}"/><line x1="0" y1="${divY}" x2="${w}" y2="${divY}" stroke="var(--b-fsmaction)" stroke-width="1.2" opacity="0.5"/><text x="${w/2}" y="${divY+8}" font-size="8" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="var(--t-fsmaction)" opacity="0.6">entry / action</text>`;}

// ── BT new draw functions ──
function dBtInv(w,h){const c=h*.35;return `<polygon points="${c},0 ${w-c},0 ${w},${h/2} ${w-c},${h} ${c},${h} 0,${h/2}"/><text x="${w/2}" y="${h/2+1}" font-size="${h*.35}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" fill="var(--t-btinv)">!</text>`;}
function dBtRepeat(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><path d="M${w*.3},${h*.35} A${w*.18},${h*.25} 0 1,1 ${w*.7},${h*.35}" fill="none" stroke="var(--t-btrepeat)" stroke-width="1.8" opacity="0.6"/><polygon points="${w*.66},${h*.22} ${w*.76},${h*.32} ${w*.72},${h*.42}" fill="var(--t-btrepeat)" opacity="0.6"/>`;}
function dBtRetry(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><path d="M${w*.3},${h*.65} A${w*.18},${h*.25} 0 1,0 ${w*.7},${h*.65}" fill="none" stroke="var(--t-btretry)" stroke-width="1.8" opacity="0.6"/><polygon points="${w*.28},${h*.52} ${w*.22},${h*.65} ${w*.34},${h*.68}" fill="var(--t-btretry)" opacity="0.6"/>`;}
function dBtFail(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><line x1="${w*.3}" y1="${h*.3}" x2="${w*.7}" y2="${h*.7}" stroke="var(--t-btfail)" stroke-width="2.2" opacity="0.65"/><line x1="${w*.7}" y1="${h*.3}" x2="${w*.3}" y2="${h*.7}" stroke="var(--t-btfail)" stroke-width="2.2" opacity="0.65"/>`;}
function dBtSuc(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><polyline points="${w*.25},${h*.52} ${w*.44},${h*.7} ${w*.75},${h*.32}" fill="none" stroke="var(--t-btsuc)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>`;}
function dBtWait(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)*.28}" fill="none" stroke="var(--t-btwait)" stroke-width="1.5" opacity="0.5"/><line x1="${w/2}" y1="${h/2}" x2="${w/2}" y2="${h*.25}" stroke="var(--t-btwait)" stroke-width="1.8" opacity="0.65" stroke-linecap="round"/><line x1="${w/2}" y1="${h/2}" x2="${w*.6}" y2="${h*.48}" stroke="var(--t-btwait)" stroke-width="1.8" opacity="0.65" stroke-linecap="round"/>`;}
function dBtRsel(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" rx="4"/><circle cx="${w*.3}" cy="${h*.4}" r="4" fill="var(--t-btrsel)" opacity="0.5"/><circle cx="${w*.5}" cy="${h*.6}" r="4" fill="var(--t-btrsel)" opacity="0.5"/><circle cx="${w*.7}" cy="${h*.4}" r="4" fill="var(--t-btrsel)" opacity="0.5"/><path d="M${w*.3},${h*.4} Q${w*.5},${h*.2} ${w*.7},${h*.4}" fill="none" stroke="var(--t-btrsel)" stroke-width="1.2" opacity="0.4"/>`;}

// ── SC new draw functions ──
function dScReply(w,h){return `<line x1="${w}" y1="${h/2}" x2="${8}" y2="${h/2}" stroke-width="1.8" stroke-dasharray="5 3"/><polygon points="${16},${h/2-5} ${0},${h/2} ${16},${h/2+5}"/>`;}
function dScCreate(w,h){return `<line x1="0" y1="${h/2}" x2="${w-8}" y2="${h/2}" stroke-width="1.8" stroke-dasharray="6 3"/><polygon points="${w-16},${h/2-5} ${w},${h/2} ${w-16},${h/2+5}"/><circle cx="${w*.5}" cy="${h/2}" r="4" fill="var(--b-sccreate)" opacity="0.7"/>`;}
function dScDestroy(w,h){return `<line x1="2" y1="2" x2="${w-2}" y2="${h-2}" stroke-width="2.5" stroke-linecap="round"/><line x1="${w-2}" y1="2" x2="2" y2="${h-2}" stroke-width="2.5" stroke-linecap="round"/>`;}
function dScAlt(w,h){const dh=h*.42;return `<rect x="0" y="0" width="${w}" height="${h}" fill-opacity="0.3"/><rect x="0" y="0" width="24" height="14" opacity=".8"/><line x1="0" y1="${dh}" x2="${w}" y2="${dh}" stroke="var(--b-scalt)" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>`;}
function dScOpt(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" fill-opacity="0.3"/><rect x="0" y="0" width="24" height="14" opacity=".8"/>`;}
function dScPar(w,h){const t=h/3, t2=h*2/3;return `<rect x="0" y="0" width="${w}" height="${h}" fill-opacity="0.3"/><rect x="0" y="0" width="24" height="14" opacity=".8"/><line x1="0" y1="${t}" x2="${w}" y2="${t}" stroke="var(--b-scpar)" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/><line x1="0" y1="${t2}" x2="${w}" y2="${t2}" stroke="var(--b-scpar)" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>`;}
function dScLoop(w,h){return `<rect x="0" y="0" width="${w}" height="${h}" fill-opacity="0.35"/><rect x="0" y="0" width="28" height="14" opacity=".8"/><path d="M${w*.4},${h*.6} A${w*.12},${h*.2} 0 1,1 ${w*.6},${h*.6}" fill="none" stroke="var(--t-scloop)" stroke-width="1.5" opacity="0.5"/><polygon points="${w*.56},${h*.46} ${w*.64},${h*.58} ${w*.61},${h*.68}" fill="var(--t-scloop)" opacity="0.5"/>`;}
function dScObj(w,h){return `<rect x="0" y="0" width="${w}" height="${h}"/><line x1="0" y1="${h*.35}" x2="${w}" y2="${h*.35}" stroke="var(--b-scobj)" stroke-width="1.2" opacity="0.4"/>`;}

// Anchors
function getAnchors(n){
  const w=nW(n),h=nH(n),t=n.type;
  if(S[t]?.noAnchors) return [];
  // 모든 기본 노드에 대해 상하좌우 4방향 앵커 지원
  return [{id:'t',cx:w/2,cy:0},{id:'r',cx:w,cy:h/2},{id:'b',cx:w/2,cy:h},{id:'l',cx:0,cy:h/2}];
}
function anchorW(nid,aid){
  const n=nodes[nid]; if(!n) return {x:0,y:0};
  const list=getAnchors(n);
  const a=list.find(x=>x.id===aid)||list[1]||{cx:nW(n)/2,cy:nH(n)/2};
  return {x:n.x+a.cx,y:n.y+a.cy};
}

function collectEdgeIdsForNodes(nodeIds){
  const set=new Set(nodeIds||[]);
  const out=[];
  // edges 전체 순회 대신 Object.values 한 번만 (기존과 동일하나 조기 종료 추가)
  for(const eid of Object.keys(edges)){
    const e=edges[eid];
    if(!e) continue;
    if(set.has(e.from)||set.has(e.to)) out.push(eid);
  }
  return out;
}
function collectAlignRefs(excludeIds){
  const ex=new Set(excludeIds||[]);
  const xs=[], ys=[];
  Object.keys(nodes).forEach(id=>{
    if(ex.has(id)) return;
    const n=nodes[id];
    const w=nW(n), h=nH(n);
    xs.push(n.x, n.x+w/2, n.x+w);
    ys.push(n.y, n.y+h/2, n.y+h);
  });
  xs.sort((a,b)=>a-b);
  ys.sort((a,b)=>a-b);
  return {xs, ys};
}

// 이진탐색으로 정렬된 refs 배열에서 value에 가장 가까운 값 반환
// O(log N) — 기존 O(N) 선형 탐색 대체
function snapAxisToRefs(value, refs, threshold){
  if(!refs.length) return value;
  // 이진탐색으로 삽입 위치 찾기
  let lo=0, hi=refs.length-1;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    if(refs[mid]<value) lo=mid+1; else hi=mid;
  }
  // lo 주변(lo-1, lo, lo+1) 후보 중 가장 가까운 값
  let best=value, bestAbs=Infinity;
  for(let i=Math.max(0,lo-1); i<=Math.min(refs.length-1,lo+1); i++){
    const d=Math.abs(refs[i]-value);
    if(d<bestAbs){ bestAbs=d; best=refs[i]; }
  }
  return bestAbs<=threshold ? best : value;
}
function applyNodeAlignSnap(x, y, drag){
  if(!drag || !drag.alignRefs) return {x,y};
  const n=nodes[drag.id];
  if(!n) return {x,y};
  const w=nW(n), h=nH(n), th=8;

  // X축: 좌측/중앙/우측 스냅 후보 중 가장 이동량이 적은 것 선택
  let bestX=x, bestDX=Infinity;
  const xs=drag.alignRefs.xs;
  const snapL=snapAxisToRefs(x,     xs,th); const dL=Math.abs(snapL-x);
  const snapM=snapAxisToRefs(x+w/2, xs,th); const dM=Math.abs(snapM-w/2-x);
  const snapR=snapAxisToRefs(x+w,   xs,th); const dR=Math.abs(snapR-w-x);
  if(dL<bestDX){ bestDX=dL; bestX=snapL; }
  if(dM<bestDX){ bestDX=dM; bestX=snapM-w/2; }
  if(dR<bestDX){              bestX=snapR-w; }

  // Y축: 상/중/하 스냅 후보 중 가장 이동량이 적은 것 선택
  let bestY=y, bestDY=Infinity;
  const ys=drag.alignRefs.ys;
  const snapT=snapAxisToRefs(y,     ys,th); const dT=Math.abs(snapT-y);
  const snapC=snapAxisToRefs(y+h/2, ys,th); const dC=Math.abs(snapC-h/2-y);
  const snapB=snapAxisToRefs(y+h,   ys,th); const dB=Math.abs(snapB-h-y);
  if(dT<bestDY){ bestDY=dT; bestY=snapT; }
  if(dC<bestDY){ bestDY=dC; bestY=snapC-h/2; }
  if(dB<bestDY){              bestY=snapB-h; }

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

// ══════════════════════════════════════════════════
// COLOUR RESOLVER
// ══════════════════════════════════════════════════
function resolveVars(str){
  const cs=getComputedStyle(document.documentElement);
  return str.replace(/var\(([^)]+)\)/g,(_,k)=>{
    const v=cs.getPropertyValue(k.trim()).trim();
    return v||'#888';
  });
}

// ══════════════════════════════════════════════════
// RENDER NODE
// ══════════════════════════════════════════════════
function renderNode(id){
  const n=nodes[id]; const s=S[n.type]; if(!s) return;
  const W=nW(n), H=nH(n);
  document.getElementById('ng-'+id)?.remove();
  const g=mk('g'); g.id='ng-'+id; g.classList.add('ng');
  g.setAttribute('transform',`translate(${n.x},${n.y})`);

  const sg=mk('g'); sg.classList.add('nsh'); sg.style.color=`var(${s.t})`;
  // Use custom node fill colour if provided, otherwise fall back to the theme colour for this node type
  const fillCol = n.color ? n.color : `var(${s.c})`;
  sg.innerHTML=`<g fill="${fillCol}" stroke="var(${s.b})" stroke-width="1.7">${s.draw(W,H)}</g>`;
  g.appendChild(sg);

  if(s.scLifeline){
    const ll=mk('line'); ll.classList.add('sc-lifeline');
    ll.setAttribute('x1',W/2); ll.setAttribute('y1',H);
    ll.setAttribute('x2',W/2); ll.setAttribute('y2',H+200);
    g.appendChild(ll);
  }

  // 노드 상단 내부에 노드 분류(타입) 뱃지 텍스트 표시
  if(n.type !== 'scfrag') {
    const typetx = mk('text');
    typetx.classList.add('ntype');
    typetx.setAttribute('x', W/2); 
    typetx.setAttribute('y', 14); // 노드 상단 내부
    typetx.style.fill = `var(${s.t})`; // 노드 고유 강조색과 동일하게 매칭
    typetx.style.opacity = '0.75';
    typetx.style.letterSpacing = '1px';
    typetx.style.fontSize = '8.5px';
    typetx.textContent = `[ ${s.label} ]`; // 괄호로 감싸 뱃지 형태 강조
    g.appendChild(typetx);
  }

  const hasLabel = !!n.label && n.type !== 'scfrag';
  // 타입 뱃지가 들어왔으므로 메인 라벨은 살짝 아래로(4px), ID는 더 아래로(18px) 밀어내서 균형 조정
  const yOffsetMain = hasLabel ? 4 : 0;
  const yOffsetSub = hasLabel ? 18 : 12;

  if(n.label){
    const tx=mk('text'); tx.classList.add('ntx');
    tx.setAttribute('x',W/2); 
    tx.setAttribute('y',H*(s.tyRatio||0.5) + (n.type==='scfrag'?0:yOffsetMain));
    // 텍스트 가시성을 높이기 위해 노드 지정 색상 또는 전역 변수(--tx) 사용
    tx.style.fill = n.txtColor ? n.txtColor : 'var(--tx)';
    tx.textContent=n.label;
    g.appendChild(tx);
    if(n.type==='scfrag'){
      tx.setAttribute('x',14); tx.setAttribute('y',7);
      tx.style.fontSize='8px'; tx.style.fill='#ffffff';
    }
  }

  const sub=mk('text'); sub.classList.add('nid');
  sub.setAttribute('x',W/2); 
  sub.setAttribute('y',H*(s.tyRatio||0.5) + yOffsetSub);
  sub.style.fill=`var(${s.t})`; sub.textContent=id;
  g.appendChild(sub);

  getAnchors(n).forEach(a=>{
    const c=mk('circle'); c.classList.add('an');
    c.setAttribute('cx',a.cx); c.setAttribute('cy',a.cy); c.setAttribute('r',5);
    c.dataset.anchor=a.id; c.dataset.nid=id;
    // 노드 타입별 border 색상을 앵커 stroke/fill에 연동 (CSS 변수 없으면 edge-hl 폴백)
    c.style.stroke = `var(--b-${n.type}, var(--edge-hl))`;
    c.style.fill   = 'var(--bg)';
    g.appendChild(c);
  });

  const HS=7;
  const O=3; // 핸들을 바깥으로 살짝 밀어내는 오프셋
  // 4개의 모서리(대각선) 핸들만 남기고 밖으로 살짝 빼서 앵커와 간섭 방지
  [{id:'nw',cx:-O,cy:-O,cur:'nwse-resize'},
   {id:'ne',cx:W+O,cy:-O,cur:'nesw-resize'},
   {id:'se',cx:W+O,cy:H+O,cur:'nwse-resize'},
   {id:'sw',cx:-O,cy:H+O,cur:'nesw-resize'}
  ].forEach(rp=>{
    const r=mk('rect'); r.classList.add('rh');
    r.setAttribute('x',rp.cx-HS/2); r.setAttribute('y',rp.cy-HS/2);
    r.setAttribute('width',HS); r.setAttribute('height',HS);
    r.style.cursor=rp.cur; r.dataset.rh=rp.id; r.dataset.nid=id;
    g.appendChild(r);
  });

  NL.appendChild(g);
  // 이벤트는 NL 레이어 위임으로 처리 (bindNode 제거)
  if(selSet.has(id)) g.classList.add('msel');
}

// ── 이벤트 위임: NL(노드 레이어) 하나에 리스너를 달아 모든 노드 이벤트 처리 ──
// 노드 300개 × 23개 리스너 → 리스너 6개로 고정. 노드 추가/삭제 시 리스너 조작 불필요.
function _getNid(el){ return el?.closest('.ng')?.id?.slice(3)||null; }

// 앵커 hover: mouseover/mouseout 위임 (mouseenter/leave는 위임 불가)
NL.addEventListener('mouseover',e=>{
  const c=e.target; if(!c.classList.contains('an')) return;
  c.setAttribute('r','8'); c.style.fill=c.style.stroke;
});
NL.addEventListener('mouseout',e=>{
  const c=e.target; if(!c.classList.contains('an')) return;
  if(!drag||drag.type!=='connect'){ c.setAttribute('r','5'); c.style.fill='var(--bg)'; }
});

NL.addEventListener('click',e=>{
  if(connecting||reconnecting) e.stopPropagation();
});

NL.addEventListener('dblclick',e=>{
  const id=_getNid(e.target); if(!id) return;
  if(e.target.classList.contains('an')||e.target.classList.contains('rh')) return;
  e.stopPropagation();
  renameTarget=id;
  const inp=document.getElementById('rename-input');
  inp.value=nodes[id]?.label||'';
  document.getElementById('m-rename').style.display='flex';
  setTimeout(()=>{ inp.focus(); inp.select(); },20);
});

NL.addEventListener('mousedown',e=>{
  const id=_getNid(e.target); if(!id||!nodes[id]) return;

  // ── 앵커 mousedown ──
  if(e.target.classList.contains('an')){
    e.stopPropagation(); e.preventDefault();
    const anchor=e.target.dataset.anchor;
    if(connecting){
      if(id!==connecting.fromId) finishConnect(id,anchor);
      return;
    }
    if(reconnecting){
      if(id!==reconnecting.fixedId) finishReconnect(id,anchor);
      else cancelReconnect();
      return;
    }
    // 같은 출발 앵커에 기존 선이 있으면 떼어내기
    const existEdge=Object.keys(edges).find(k=>edges[k].from===id&&edges[k].fromA===anchor);
    if(existEdge){ delete edges[existEdge]; removeEdgeDOM(existEdge); updateStatus(); saveState('선 떼어내기'); }
    startConnect(id,anchor,e.target);
    return;
  }

  // ── 리사이즈 핸들 mousedown ──
  if(e.target.classList.contains('rh')){
    e.stopPropagation(); e.preventDefault();
    selItem(id);
    const p=spt(e.clientX,e.clientY);
    const n=nodes[id];
    drag={type:'resize',id,rhId:e.target.dataset.rh,startX:p.x,startY:p.y,
          origX:n.x,origY:n.y,origW:nW(n),origH:nH(n),
          edgeIds:collectEdgeIdsForNodes([id])};
    return;
  }

  // ── 노드 본체 mousedown ──
  if(connecting){
    if(id!==connecting.fromId){
      const p=spt(e.clientX,e.clientY);
      const anchors=getAnchors(nodes[id]);
      let bestA='l',bestDist=Infinity;
      anchors.forEach(a=>{ const d=Math.hypot(p.x-(nodes[id].x+a.cx),p.y-(nodes[id].y+a.cy)); if(d<bestDist){bestDist=d;bestA=a.id;} });
      e.stopPropagation(); finishConnect(id,bestA);
    }
    return;
  }
  if(reconnecting){
    if(id!==reconnecting.fixedId){
      const p=spt(e.clientX,e.clientY);
      const anchors=getAnchors(nodes[id]);
      let bestA='l',bestDist=Infinity;
      anchors.forEach(a=>{ const d=Math.hypot(p.x-(nodes[id].x+a.cx),p.y-(nodes[id].y+a.cy)); if(d<bestDist){bestDist=d;bestA=a.id;} });
      e.stopPropagation(); finishReconnect(id,bestA);
    } else { cancelReconnect(); }
    return;
  }
  e.stopPropagation();
  if(e.shiftKey){
    const g=document.getElementById('ng-'+id);
    if(selSet.has(id)){selSet.delete(id);g?.classList.remove('msel');}
    else{selSet.add(id);g?.classList.add('msel');}
    selId=null; updateInspector(); return;
  }
  if(!selSet.has(id)) selSet.clear();
  selItem(id);
  const p=spt(e.clientX,e.clientY);
  const movingIds=selSet.size>1?[...selSet]:[id];
  drag={type:'node',id,ox:p.x-nodes[id].x,oy:p.y-nodes[id].y,
    leadStartX:nodes[id].x,leadStartY:nodes[id].y,
    movingIds,
    alignRefs:collectAlignRefs(movingIds),
    edgeIds:collectEdgeIdsForNodes(movingIds),
    multiOrig:selSet.size>1?[...selSet].map(sid=>({id:sid,x:nodes[sid].x,y:nodes[sid].y})):null
  };
});

// ── EL 레이어 이벤트 위임: 엣지 클릭·CP핸들·세그핸들·재연결핸들 ──
// 엣지당 직접 리스너 ~4개 → EL 레이어 리스너 2개로 고정
EL.addEventListener('click',ev=>{
  const g=ev.target.closest('.eg'); if(!g) return;
  ev.stopPropagation();
  selItem('edge:'+g.id.slice(3));
});

EL.addEventListener('mousedown',ev=>{
  const t=ev.target;

  // CP 핸들 (베지어 제어점)
  if(t.classList.contains('cph')){
    ev.stopPropagation(); ev.preventDefault();
    const id=t.dataset.eid; if(!id) return;
    selItem('edge:'+id);
    const wp=spt(ev.clientX,ev.clientY);
    const edgeNow=edges[id]||{};
    // pts: 현재 렌더된 엣지의 pts를 getCP로 재계산하지 않고 manualPts 또는 null
    const ls=edgeNow.lineStyle||globalLineStyle;
    const from=anchorW(edgeNow.from,edgeNow.fromA);
    const to=anchorW(edgeNow.to,edgeNow.toA);
    const {pts}=getCP(edgeNow,from,to);
    drag={type:'cp',eid:id,cpIdx:parseInt(t.dataset.cpIdx),
          startX:wp.x,startY:wp.y,
          orig:{cp1dx:edgeNow.cp1dx||0,cp1dy:edgeNow.cp1dy||0,
                cp2dx:edgeNow.cp2dx||0,cp2dy:edgeNow.cp2dy||0},
          origPts:edgeNow.manualPts?clonePts(edgeNow.manualPts):(ls==='step'&&pts?clonePts(pts):null)};
    return;
  }

  // 세그먼트 핸들 (꺾은선 경로 조절)
  if(t.classList.contains('sgh')){
    ev.stopPropagation(); ev.preventDefault();
    const id=t.dataset.eid; if(!id) return;
    selItem('edge:'+id);
    const wp=spt(ev.clientX,ev.clientY);
    const segIdx=parseInt(t.dataset.segIdx);
    const isH=t.dataset.isH==='1';
    const edgeNow=edges[id]||{};
    const from=anchorW(edgeNow.from,edgeNow.fromA);
    const to=anchorW(edgeNow.to,edgeNow.toA);
    const {pts}=getCP(edgeNow,from,to);
    drag={type:'seg',eid:id,segIdx,isH,
          origPts:pts?JSON.parse(JSON.stringify(pts)):[],
          startW:isH?wp.y:wp.x};
    return;
  }

  // 재연결 핸들 (끝점 드래그)
  if(t.classList.contains('eah-hit')||t.classList.contains('eah')){
    ev.stopPropagation(); ev.preventDefault();
    const id=t.dataset.eid; if(!id) return;
    selItem('edge:'+id);
    startReconnect(id, t.dataset.end);
    return;
  }
});
function nodeToFront(id) {
  const g = document.getElementById('ng-'+id);
  if(g) NL.appendChild(g); // Move to end of DOM (renders on top)
  // JS 객체 내 키 순서 조정을 위해 재삽입
  const n = nodes[id]; delete nodes[id]; nodes[id] = n;
  saveState('레이어 맨 앞으로');
}
function nodeToBack(id) {
  const g = document.getElementById('ng-'+id);
  if(g) NL.insertBefore(g, NL.firstChild); // Move to start of DOM (renders at bottom)
  // JS 객체 내 키 순서 조정을 위해 재구성
  const newNodes = { [id]: nodes[id] };
  for(let k in nodes) { if(k !== id) newNodes[k] = nodes[k]; }
  nodes = newNodes;
  saveState('레이어 맨 뒤로');
}

// ══════════════════════════════════════════════════
// LINE STYLES & ROUTING
// ══════════════════════════════════════════════════
function toggleLineStyle(){
  const btn = document.getElementById('lstyle-btn');
  if(globalLineStyle === 'curve') {
    globalLineStyle = 'step';
    btn.textContent = '🔀';
    btn.setAttribute('data-tip', '선 스타일: 꺾은선');
    btn.setAttribute('data-tip-sub', '장애물을 자동으로 피하는 직각 경로');
  } else if(globalLineStyle === 'step') {
    globalLineStyle = 'straight';
    btn.textContent = '📏';
    btn.setAttribute('data-tip', '선 스타일: 직선');
    btn.setAttribute('data-tip-sub', '출발점과 도착점을 직선으로 연결');
  } else {
    globalLineStyle = 'curve';
    btn.textContent = '➰';
    btn.setAttribute('data-tip', '선 스타일: 곡선');
    btn.setAttribute('data-tip-sub', '베지어 곡선으로 부드럽게 연결');
  }
  redrawEdges();
}

// ══════════════════════════════════════════════════
// CONNECT HELPERS  (startConnect / finishConnect)
// ══════════════════════════════════════════════════
function clearConnectVisuals(){
  tl.style.display='none';
  tl.setAttribute('d','');
  cvs.classList.remove('cx','connecting');
  document.querySelectorAll('.ng.connect-target').forEach(el=>el.classList.remove('connect-target'));
  document.querySelectorAll('.an.active').forEach(a=>{ a.setAttribute('r','5'); a.classList.remove('active'); });
}
function nearestAnchorAtPoint(p, excludeNodeId, maxDist){
  let best=null, bestDist=Infinity;
  Object.keys(nodes).forEach(nid=>{
    if(nid===excludeNodeId) return;
    const n=nodes[nid];
    if(!n) return;
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
  saveState('선 연결 완료');
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
  // 재연결 후 기존 수동 경로/핸들은 초기화하여 경로 꼬임을 방지
  delete e.manualPts;
  e.cp1dx=0; e.cp1dy=0; e.cp2dx=0; e.cp2dy=0;
  renderEdge(reconnecting.eid);
  selItem('edge:'+reconnecting.eid);
  saveState('선 재연결');
  cancelReconnect();
}

// ══════════════════════════════════════════════════
// ROUTING  —  obstacle-aware orthogonal + bezier
// ══════════════════════════════════════════════════

// 선분 vs AABB 교차 (Cohen-Sutherland)
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

// 폴리라인 충돌 체크
function polyHits(pts,skipIds,pad){
  pad=pad||6;
  const cache=getBboxCache().hard;
  for(let i=0;i<pts.length-1;i++){
    const [ax,ay]=pts[i],[bx,by]=pts[i+1];
    for(const b of cache){
      if(skipIds&&skipIds.includes(b.nid)) continue;
      // pad 차이 보정: 캐시는 BBOX_HARD_PAD=6, polyHits pad 파라미터 반영
      const dp=pad-BBOX_HARD_PAD;
      if(segRectIntersect(ax,ay,bx,by,b.x0-dp,b.y0-dp,b.x1+dp,b.y1+dp)) return true;
    }
  }
  return false;
}

// 베지어 충돌 체크 (샘플링)
function bezierHitsObstacle(fx,fy,cx1,cy1,cx2,cy2,tx,ty,skipIds,samples){
  samples=samples||22;
  const cache=getBboxCache().hard;
  let px=fx,py=fy;
  for(let i=1;i<=samples;i++){
    const t=i/samples,m=1-t;
    const nx=m*m*m*fx+3*m*m*t*cx1+3*m*t*t*cx2+t*t*t*tx;
    const ny=m*m*m*fy+3*m*m*t*cy1+3*m*t*t*cy2+t*t*t*ty;
    for(const b of cache){
      if(skipIds&&skipIds.includes(b.nid)) continue;
      if(segRectIntersect(px,py,nx,ny,b.x0,b.y0,b.x1,b.y1)) return true;
    }
    px=nx;py=ny;
  }
  return false;
}

// 앵커 방향별 출구 벡터
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
// 앵커 방향 → 단위벡터
function anchorDir(a){
  if(a==='t') return[0,-1];
  if(a==='b') return[0,1];
  if(a==='l') return[-1,0];
  return[1,0];
}

// ─────────────────────────────────────────────────────
// 직각(Orthogonal) 우회 라우터
// 출발(sx,sy,sDirX,sDirY) → 도착(ex,ey,eDirX,eDirY)
// 장애물을 피하는 waypoints 배열 반환
// ─────────────────────────────────────────────────────
function orthoRoute(sx,sy,sDirX,sDirY,ex,ey,eDirX,eDirY,skipIds){
  const PAD=20;
  const GUIDE_GAP=30;
  // HARD_PAD / SOFT_PAD는 전역 BBOX_HARD_PAD / BBOX_SOFT_PAD와 동일값 — 전역 상수 직접 사용
  const HARD_PAD=BBOX_HARD_PAD;
  const SOFT_PAD=BBOX_SOFT_PAD;
  const startNode=(skipIds&&skipIds.length>0)?nodes[skipIds[0]]:null;
  const endNode=(skipIds&&skipIds.length>1)?nodes[skipIds[1]]:null;

  // bbox 캐시에서 장애물 배열 획득 (skipIds 제외)
  const {hard: _hard, soft: _soft} = getBboxCache();
  // 엣지 경계 박스 계산 + 여유 마진으로 원거리 노드 사전 제외 (AABB 컬링)
  const ROUTE_MARGIN = BBOX_SOFT_PAD + GUIDE_GAP + 10;
  const rMinX=Math.min(sx,ex)-ROUTE_MARGIN, rMaxX=Math.max(sx,ex)+ROUTE_MARGIN;
  const rMinY=Math.min(sy,ey)-ROUTE_MARGIN, rMaxY=Math.max(sy,ey)+ROUTE_MARGIN;
  function inRouteAABB(b){ return b.x1>=rMinX&&b.x0<=rMaxX&&b.y1>=rMinY&&b.y0<=rMaxY; }
  const obsHard = (skipIds&&skipIds.length
    ? _hard.filter(b=>!skipIds.includes(b.nid))
    : _hard).filter(inRouteAABB);
  const obsSoft = (skipIds&&skipIds.length
    ? _soft.filter(b=>!skipIds.includes(b.nid))
    : _soft).filter(inRouteAABB);
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
      // 시작/도착 노드는 첫/마지막 세그먼트만 예외 허용, 그 외 관통은 강한 페널티
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
        // 도착점에서는 앵커 방향의 반대쪽에서 진입해야 자연스럽다
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

  // 출발·도착 전방 돌출점
  const s2x=sx+sDirX*PAD, s2y=sy+sDirY*PAD;
  const e2x=ex+eDirX*PAD, e2y=ey+eDirY*PAD;

  // 전체 bounding box
  let bx0=sx,by0=sy,bx1=ex,by1=ey;
  for(const o of obsSoft){bx0=Math.min(bx0,o.x0);by0=Math.min(by0,o.y0);bx1=Math.max(bx1,o.x1);by1=Math.max(by1,o.y1);}
  bx0-=GUIDE_GAP; by0-=GUIDE_GAP; bx1+=GUIDE_GAP; by1+=GUIDE_GAP;

  // 수평/수직 방향 여부
  const sH=(sDirY===0), eH=(eDirY===0);

  // 단순 L자 / Z자 시도
  function tryCandidates(){
    const routes=[];
    const xGuides=[(s2x+e2x)/2, Math.max(sx,ex,bx1)+GUIDE_GAP*0.6, Math.min(sx,ex,bx0)-GUIDE_GAP*0.6];
    const yGuides=[(s2y+e2y)/2, Math.min(sy,ey,by0)-GUIDE_GAP*0.6, Math.max(sy,ey,by1)+GUIDE_GAP*0.6];
    // 충돌 난 장애물의 경계 바깥 라인을 가이드로 추가
    obsSoft.forEach(o=>{
      xGuides.push(o.x0-GUIDE_GAP*0.35, o.x1+GUIDE_GAP*0.35);
      yGuides.push(o.y0-GUIDE_GAP*0.35, o.y1+GUIDE_GAP*0.35);
    });
    const ux=[...new Set(xGuides.map(v=>Math.round(v)))];
    const uy=[...new Set(yGuides.map(v=>Math.round(v)))];

    // 단순 직선/단일 굴곡 우선 후보
    if(near(sy,ey,0.6) || near(sx,ex,0.6)) routes.push([[sx,sy],[ex,ey]]);
    routes.push([[sx,sy],[ex,sy],[ex,ey]]);
    routes.push([[sx,sy],[sx,ey],[ex,ey]]);

    // 출발/도착 앵커 방향을 존중하는 기본 후보
    routes.push([[sx,sy],[s2x,s2y],[e2x,s2y],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[s2x,e2y],[e2x,e2y],[ex,ey]]);

    // 큰 우회(상/하/좌/우) 후보 - 밀집 상태에서 도형 관통 회피
    routes.push([[sx,sy],[s2x,s2y],[s2x,by0],[e2x,by0],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[s2x,by1],[e2x,by1],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[bx0,s2y],[bx0,e2y],[e2x,e2y],[ex,ey]]);
    routes.push([[sx,sy],[s2x,s2y],[bx1,s2y],[bx1,e2y],[e2x,e2y],[ex,ey]]);

    if(sH&&eH){
      // 수평→수평: 위 또는 아래 우회
      uy.forEach(my=>{
        routes.push([[sx,sy],[s2x,s2y],[s2x,my],[e2x,my],[e2x,e2y],[ex,ey]]);
      });
    } else if(!sH&&!eH){
      // 수직→수직: 좌 또는 우 우회
      ux.forEach(mx=>{
        routes.push([[sx,sy],[s2x,s2y],[mx,s2y],[mx,e2y],[e2x,e2y],[ex,ey]]);
      });
    } else if(sH&&!eH){
      // 수평→수직: L자
      routes.push([[sx,sy],[e2x,sy],[e2x,ey]]);
      routes.push([[sx,sy],[s2x,sy],[s2x,e2y],[e2x,e2y],[ex,ey]]);
      uy.forEach(my=>{
        routes.push([[sx,sy],[s2x,sy],[s2x,my],[e2x,my],[e2x,e2y],[ex,ey]]);
      });
      ux.forEach(mx=>{
        routes.push([[sx,sy],[mx,sy],[mx,e2y],[e2x,e2y],[ex,ey]]);
      });
    } else {
      // 수직→수평: L자
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
  // "하드 충돌(관통) → 방향 일치 → 꺾임 수 → 짧은 잔세그먼트 → 거리" 기준 최선 경로 선택
  let best=null, bestS=null;
  routes.forEach(r=>{
    const s=routeScore(r);
    if(!best || betterScore(s,bestS)){ best=r; bestS=s; }
  });
  return best||[[sx,sy],[ex,ey]];
}

// pts 배열 → SVG path string
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
// 꺾은선 수동 경로를 직각 기반으로 자동 보정:
// 1) 시작/끝 앵커 고정 2) 거의 직교인 구간 스냅 3) 대각 구간 L자로 분해 4) 중복/일직선 점 정리
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
      // 수동 경로가 다른 도형을 관통하면 자동 라우팅으로 복귀
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

  // ─── STEP: 직각 우회 라우터 ───
  if(ls==='step'){
    // 우선순위 1: 사용자가 세그먼트 드래그로 직접 조절한 경로
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
    // 우선순위 2: orthoRoute 자동 라우팅
    const[sdx,sdy]=anchorDir(e.fromA);
    const[edx,edy]=anchorDir(e.toA);
    const pts=orthoRoute(from.x,from.y,sdx,sdy,to.x,to.y,edx,edy,skipIds);
    return{cp1:{x:pts[1]?.[0]??from.x,y:pts[1]?.[1]??from.y},
           cp2:{x:pts[pts.length-2]?.[0]??to.x,y:pts[pts.length-2]?.[1]??to.y},
           pts};
  }

  // ─── STRAIGHT ───
  if(ls==='straight'){
    return{cp1:{x:(from.x+to.x)/2,y:(from.y+to.y)/2},
           cp2:{x:(from.x+to.x)/2,y:(from.y+to.y)/2},pts:null};
  }

  // ─── CURVE: 앵커 방향 + 장애물 우회 베지어 ───
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




// ── 커스텀 색상 마커 동적 생성 ──────────────────────────────
// SVG <marker>는 stroke를 상속하지 않으므로 색상별로 defs에 마커를 생성해야 함.
// id = "marker-ec-{eid}" 형태로 관리. 이미 존재하면 색상만 갱신.
// SVG defs 캐시 — ensureMarker가 renderEdge마다 querySelector하는 비용 제거
let _svgDefs = null;
function getSvgDefs(){ return _svgDefs || (_svgDefs = msvg.querySelector('defs')); }

function ensureMarker(eid, color){
  const svgDefs = getSvgDefs();
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
// 커스텀 마커 제거 (엣지 삭제 시 defs 정리)
function removeMarker(eid){
  document.getElementById('marker-ec-'+eid)?.remove();
}

// ══════════════════════════════════════════════════
// RENDER EDGE
// ══════════════════════════════════════════════════
function renderEdge(id){
  const e=edges[id]; if(!e) return;
  removeEdgeDOM(id);
  const ls = e.lineStyle || globalLineStyle;
  const from=anchorW(e.from,e.fromA);
  const to=anchorW(e.to,e.toA);
  const result=getCP(e,from,to);
  const {cp1,cp2,pts}=result;
  const g=mk('g'); g.id='eg-'+id; g.classList.add('eg');

  // step 모드: pts가 있으면 항상 세그먼트 핸들 방식 사용 (manualPts / orthoRoute 모두)
  const hasAutoRoute = ls==='step' && pts && pts.length > 0;

  let pathD;
  if(ls === 'straight') {
    pathD = `M${from.x},${from.y} L${to.x},${to.y}`;
  } else if(hasAutoRoute) {
    // 직각 우회 폴리라인 (자동 또는 수동 세그먼트 조절 pts 모두)
    pathD = ptsToPath(pts);
  } else if(ls === 'step') {
    pathD = `M${from.x},${from.y} L${cp1.x},${cp1.y} L${cp2.x},${cp2.y} L${to.x},${to.y}`;
  } else {
    pathD = `M${from.x},${from.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;
  }

  const hit=mk('path'); hit.classList.add('ehit'); hit.setAttribute('d',pathD); g.appendChild(hit);
  const ep=mk('path'); ep.classList.add('ep'); ep.id='ep-'+id; ep.setAttribute('d',pathD);
  // 커스텀 색상: 선 색상 + 화살표 마커를 동일 색으로 동기화
  if(e.color){
    ep.classList.add('ec');           // CSS sel override 방지
    ep.style.stroke = e.color;
    const mid = ensureMarker(id, e.color);
    ep.style.markerEnd = `url(#${mid})`;
  }
  g.appendChild(ep);

  // CP 핸들: 곡선/꺾은선 모두 동일하게 표시 (꺾은선은 첫/마지막 내부 포인트 사용)
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
      // mousedown은 EL 레이어 위임으로 처리 (data-cpIdx, data-eid 이미 설정됨)
    });
  }

  // 꺾은선(step) pts 라우팅: 각 세그먼트 중간에 드래그 핸들 배치
  if(hasAutoRoute && pts && pts.length >= 2){
    for(let i = 0; i < pts.length - 1; i++){
      const [ax,ay] = pts[i], [bx,by] = pts[i+1];
      const isH = Math.abs(ay - by) < 0.5;
      const isV = Math.abs(ax - bx) < 0.5;
      if(!isH && !isV) continue;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const segLen = isH ? Math.abs(bx - ax) : Math.abs(by - ay);
      const hw = isH ? Math.max(8, Math.min(segLen * 0.45, 26)) : 5;
      const hh = isH ? 5 : Math.max(8, Math.min(segLen * 0.45, 26));
      const sh = mk('rect');
      sh.classList.add('sgh', isH ? 'sgh-h' : 'sgh-v');
      sh.setAttribute('x', mx - hw); sh.setAttribute('y', my - hh);
      sh.setAttribute('width', hw * 2); sh.setAttribute('height', hh * 2);
      sh.setAttribute('rx', 3);
      sh.dataset.eid = id;
      sh.dataset.segIdx = String(i);
      sh.dataset.isH = isH ? '1' : '0';
      // mousedown은 EL 레이어 위임으로 처리
      g.appendChild(sh);
    }
  }

  // 끝점 재연결 핸들
  function addReconnectHandle(cx,cy,end,vr,hr){
    const hit=mk('circle'); hit.classList.add('eah-hit');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', hr);
    hit.dataset.eid=id; hit.dataset.end=end;
    g.appendChild(hit);
    const vis=mk('circle'); vis.classList.add('eah');
    vis.setAttribute('cx', cx); vis.setAttribute('cy', cy); vis.setAttribute('r', vr);
    vis.dataset.eid=id; vis.dataset.end=end;
    g.appendChild(vis);
    // mousedown은 EL 레이어 위임으로 처리
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
      if(pts.length >= 2 && pts[mid-1] && pts[mid]){
        bx = (pts[mid-1][0] + pts[mid][0]) / 2;
        by = (pts[mid-1][1] + pts[mid][1]) / 2;
      } else {
        bx = (from.x + to.x) / 2;
        by = (from.y + to.y) / 2;
      }
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
        if(/yes|예|성공/.test(low)) col = '#10b981';
        else if(/no|아니|없|실패/.test(low)) col = '#ef4444';
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
      lt.textContent = l.txt.length > 25 ? l.txt.slice(0, 24) + '…' : l.txt;
      lg.appendChild(lt);
    });
    LBL.appendChild(lg);
  }

  // click은 EL 레이어 위임으로 처리
  EL.appendChild(g);
}


// ── 엣지 DOM 완전 제거: 선 그룹(eg-) + 라벨 그룹(lbl-) 동시 삭제
function removeEdgeDOM(eid){
  document.getElementById('eg-'+eid)?.remove();
  document.getElementById('lbl-'+eid)?.remove();
  // 커스텀 색상 마커가 있으면 defs에서 제거 (메모리 누수 방지)
  removeMarker(eid);
}
function bpt(p0,p1,p2,p3,t){const m=1-t;return m*m*m*p0+3*m*m*t*p1+3*m*t*t*p2+t*t*t*p3;}
function redrawEdges(){Object.keys(edges).forEach(renderEdge);}


