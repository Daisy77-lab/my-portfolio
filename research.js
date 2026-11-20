/* Research evidence is appended to the existing PalmX image viewer. */
window.PALMX_RESEARCH_GALLERY = [
  ['makera-field.webp','Makera 竞品体验 · 机旁观察记录'],
  ['makera-clamping.webp','Makera · 加工后取件'],
  ['makera-stock.webp','Makera · 四轴毛坯与尾座装夹'],
  ['makera-cutting.webp','Makera · 观察切削过程'],
  ['makera-chips.webp','Makera · 加工舱内的积屑与清理需求'],
  ['industrial-console.webp','工业 CNC · 现场控制台操作'],
  ['industrial-indicator.webp','工业 CNC · 打表与装夹准备'],
  ['industrial-alignment.webp','工业 CNC · 工件找正记录'],
  ['industrial-tools.webp','工业 CNC · 工具与实操现场'],
  ['industrial-part.webp','工业 CNC · 金属试件与加工现场'],
  ['workshop-exterior.webp','CrashSpace · 工坊外观'],
  ['workshop-cnc.webp','CrashSpace · ShopBot Desktop 与机旁工作区'],
  ['workshop-laser.webp','CrashSpace · 激光加工设备'],
  ['workshop-bench.webp','CrashSpace · 木工操作台'],
  ['workshop-tools.webp','CrashSpace · 工具与材料收纳'],
  ['workshop-electronics.webp','CrashSpace · 电子工作台'],
  ['workshop-printing.webp','CrashSpace · 3D 打印工作区'],
  ['workshop-safety.webp','CrashSpace · 工坊入口与安全提示'],
  ['hmi-flow-figjam.webp','PalmX HMI · 用户行为、系统反馈与异常恢复 · FigJam 原稿'],
  ['factory-diary.webp','三天工厂实操日记 · 情绪曲线 · 2026.04'],
  ['pain-map.webp','操作痛点与恐惧热力图 · 研究分析稿 v1.1 · 2026.06'],
  ['user-personas.webp','三类用户画像与旅程组合 · 方案草稿 v0.2 · 2026.07'],
  ['xhorse-carving.webp','Xhorse · 木雕加工 · 设备使用记录'],
  ['requirements-pool.webp','动态需求池节选 · 需求、优先级、终端与页面映射'],
  ['hmi2-figjam-overview.webp','HMI 架构与任务流程 · FigJam 画布概览']
].map(([file,label])=>({src:'assets/research/'+file,label}));

(() => {
  const album=document.querySelector('[data-workshop-album]');
  if(!album)return;
  const scenes=[
    ['走进 CrashSpace','洛杉矶创客工坊现场走访记录。'],
    ['CNC 与机旁工作区','ShopBot Desktop、电脑与吸尘管路，共同构成一次加工的操作环境。'],
    ['激光加工区','记录激光设备、周边工作空间，以及与其他工艺的空间关系。'],
    ['木工操作台','加工前后的手工处理，也需要工具、台面与操作空间。'],
    ['工具与材料收纳','观察材料和工具如何被找到、取用与归位。'],
    ['电子工作台','同一间创客工坊内，电子制作与机械加工各有工作区域。'],
    ['3D 打印工作区','记录工坊中的另一类数字制造设备及其使用环境。'],
    ['入口与安全提示','进入加工空间前，使用者先接触到工坊规则与安全提示。'],
  ];
  const shot=album.querySelector('[data-workshop-shot]');
  const front=album.querySelector('[data-workshop-flip]');
  const middle=album.querySelector('[data-workshop-middle]');
  const back=album.querySelector('[data-workshop-back]');
  const enlarge=album.querySelector('[data-workshop-enlarge]');
  const title=album.querySelector('[data-workshop-title]');
  const description=album.querySelector('[data-workshop-description]');
  const count=album.querySelector('[data-workshop-count]');
  const previous=album.querySelector('[data-workshop-prev]');
  const next=album.querySelector('[data-workshop-next]');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let current=0;
  let turning=false;
  function show(index){
    current=(index+scenes.length)%scenes.length;
    const item=window.PALMX_RESEARCH_GALLERY[10+current];
    shot.src=item.src;
    shot.alt=item.label;
    middle.src=window.PALMX_RESEARCH_GALLERY[10+(current+1)%scenes.length].src;
    back.src=window.PALMX_RESEARCH_GALLERY[10+(current+2)%scenes.length].src;
    enlarge.dataset.imageIndex=String(15+current);
    enlarge.setAttribute('aria-label','放大查看：'+item.label);
    title.textContent=scenes[current][0];
    description.textContent=scenes[current][1];
    count.textContent=String(current+1).padStart(2,'0')+' / 08';
  }
  async function turn(index,direction=1){
    if(turning || (index+scenes.length)%scenes.length===current)return;
    if(reducedMotion.matches){show(index);return;}
    turning=true;
    album.setAttribute('aria-busy','true');
    const animation=front.animate([
      {transform:'translateX(0) rotateY(0) rotate(0)',opacity:1},
      {transform:`translateX(${direction*42}px) rotateY(${direction*-18}deg) rotate(${direction*8}deg)`,opacity:0}
    ],{duration:240,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    try { await animation.finished; } catch { /* Finish at the requested photo after an interrupted turn. */ }
    show(index);
    animation.cancel();
    album.removeAttribute('aria-busy');
    turning=false;
  }
  front.addEventListener('click',()=>turn(current+1));
  previous.addEventListener('click',()=>turn(current-1,-1));
  next.addEventListener('click',()=>turn(current+1));
  album.addEventListener('keydown',event=>{
    if(event.altKey || event.ctrlKey || event.metaKey)return;
    if(event.key==='ArrowRight')turn(current+1);
    else if(event.key==='ArrowLeft')turn(current-1,-1);
    else if(event.key==='Home')turn(0,-1);
    else if(event.key==='End')turn(scenes.length-1);
    else return;
    event.preventDefault();
  });
})();
