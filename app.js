(function(){
'use strict';
// Keep bookmarked sections working after the PalmX overview moved off the homepage.
if (document.querySelector('.selected-project')) {
  const projectAnchors = ['#responsibilities', '#hmi-surface', '#app-surface'];
  function followProjectAnchor() {
    if (projectAnchors.includes(location.hash)) {
      location.replace('palmx.html' + location.hash);
    }
  }
  followProjectAnchor();
  window.addEventListener('hashchange', followProjectAnchor);
}
const data=window.PORTFOLIO;
if(!data)return;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=p=>'case-'+encodeURIComponent(p.id)+'.html';
const archive=document.querySelector('#archive-projects');
function renderArchive(filter){
 if(!archive)return;
 const items=data.archive.filter(p=>filter==='all'||p.categoryGroup===filter);
 archive.innerHTML=items.map(p=>'<article class="archive-card"><a href="'+link(p)+'"><div class="archive-image"><img src="'+window.portfolioMedia.preview(p.image)+'" alt="'+escapeHtml(p.shortTitle)+'作品封面" loading="lazy"></div><div class="archive-meta"><span>'+escapeHtml(p.category)+'</span><span>'+escapeHtml(p.status)+'</span></div><h3>'+escapeHtml(p.shortTitle)+'</h3><p>'+escapeHtml(p.summary)+'</p><span class="archive-link">查看项目 <span aria-hidden="true">↗</span></span></a></article>').join('');
 document.querySelector('#filter-status').textContent='显示 '+items.length+' 个作品';
}
if(!archive?.hasAttribute('data-prerendered')) renderArchive('all');
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderArchive(button.dataset.filter);}));
const toggle=document.querySelector('.menu-toggle');
if(toggle){const menu=document.querySelector('#mobile-nav');toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));toggle.setAttribute('aria-label',expanded?'打开导航':'关闭导航');menu.hidden=expanded;});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','打开导航');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});}
document.querySelectorAll('[data-copy-email]').forEach(button=>button.addEventListener('click',async()=>{const feedback=document.querySelector('#copy-feedback');try{if(!navigator.clipboard)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(button.dataset.copyEmail);feedback.textContent='邮箱已复制';button.textContent='已复制';setTimeout(()=>{button.textContent='复制邮箱';feedback.textContent='';},3000);}catch{feedback.textContent='请长按或选中上方邮箱复制，也可以点击邮箱发送邮件。';}}));
if(document.querySelector('.palmx-overview, .software-showcase'))initViewer([
 {src:'assets/palmx-pc-current.webp',label:'PC · 当前软件 Web 体验版'},
 {src:'assets/palmx-hmi-current.webp',label:'HMI · 当前机载屏交互原型，浏览器模拟'},
 {src:'assets/palmx-app-current.webp',label:'App · 当前源码的 Web 预览'},
 {src:'assets/palmx-design-system.webp',label:'设计系统 · PalmX Studio UI Kit 组件总览'},
 {src:'assets/palmx-icon-library.webp',label:'Icon 库 · PalmX 软件 UI 柔和线性图标'}
].concat(window.PALMX_RESEARCH_GALLERY||[], [
 {src:'assets/palmx-alarm-inventory.webp',label:'CNC 全量报警异常清单 · 触发场景、原因与处置方式'},
 {src:'assets/ai-blender-mcp.webp',label:'AI × MCP 建模 · Blender 模型与连接面板'},
 {src:'assets/ai-codex-usage-full.webp',label:'Codex 完整使用记录 · 累计 100.9 亿 Token、连续使用 32 天与活动热力图'},
 {src:'assets/ai-claude-design.webp',label:'Claude Design · 设计系统与多版方案对比'},
 {src:'assets/palmx-logo-design.webp',label:'Palm X Logo 设计 · 手掌意象与几何构造'},
 {src:'assets/palmx-prototype-test.svg',label:'样机交互测试现场 · 样机已做保密处理'}
]));
const caseContainer=document.querySelector('#case-content');
if(caseContainer){
 const all=data.projects.concat(data.archive);
 const id=caseContainer.dataset.project||new URLSearchParams(location.search).get('project');
 if(id==='palmx-fixture'){const destination=new URL('palmx.html',location.href);const language=new URLSearchParams(location.search).get('lang');if(language)destination.searchParams.set('lang',language);location.replace(destination);return;}
 const p=all.find(project=>project.id===id);
 if(!p){caseContainer.innerHTML='<section class="wrap not-found"><p class="eyebrow">作品集</p><h1>这个项目暂时找不到。</h1><p>可以回到作品列表，继续查看其他案例。</p><a class="button dark" href="index.html#work">返回所有作品</a></section>';document.title='未找到项目 — lidaiyu';return;}
 document.title=p.shortTitle+' — lidaiyu 产品作品集';
 const next=all[(all.indexOf(p)+1)%all.length];
 const gallery=p.gallery||[];
 if(caseContainer.dataset.project!==p.id) caseContainer.innerHTML=window.renderPortfolioCase(p,next,window.portfolioMedia.preview);
 initViewer(gallery);
}
function initViewer(gallery){
 const dialog=document.querySelector('#image-viewer');if(!dialog)return;
 const image=document.querySelector('#viewer-image'), caption=document.querySelector('#viewer-caption'),count=document.querySelector('#viewer-count'),prev=document.querySelector('#viewer-prev'),next=document.querySelector('#viewer-next'),zoom=document.querySelector('#viewer-zoom'),body=dialog.querySelector('.viewer-body');let current=0,opener=null;
 function update(){const item=gallery[current];window.portfolioMedia.showFull(image,item.src);image.alt=item.label;caption.textContent=item.label;count.textContent=(current+1)+' / '+gallery.length;prev.disabled=current===0;next.disabled=current===gallery.length-1;body.classList.remove('zoomed');zoom.setAttribute('aria-pressed','false');zoom.textContent='放大原图';body.scrollTop=0;body.scrollLeft=0;}
 document.querySelectorAll('[data-image-index]').forEach(button=>button.addEventListener('click',()=>{current=Number(button.dataset.imageIndex);opener=button;update();dialog.showModal();document.body.style.overflow='hidden';dialog.querySelector('.viewer-close').focus();}));
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.style.overflow='';if(opener)opener.focus();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 prev.addEventListener('click',()=>{if(current>0){current--;update();}});next.addEventListener('click',()=>{if(current<gallery.length-1){current++;update();}});
 zoom.addEventListener('click',()=>{const expanded=body.classList.toggle('zoomed');zoom.setAttribute('aria-pressed',String(expanded));zoom.textContent=expanded?'适应窗口':'放大原图';});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&current>0){e.preventDefault();current--;update();}if(e.key==='ArrowRight'&&current<gallery.length-1){e.preventDefault();current++;update();}});
}
})();
