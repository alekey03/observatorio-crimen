/* Progressive mobile layout: existing filters, charts and navigation keep their handlers. */
(() => {
 const media=matchMedia('(max-width:760px)');
 const main=document.querySelector('.main-content');
 if(!main)return;
 const labels=['Inicio','Mapa','Anual','Temporal','Proyección','Producción'];
 document.querySelectorAll('.menu li[data-view]').forEach((item,i)=>{
  item.setAttribute('aria-label',item.textContent.trim());
  const label=document.createElement('span');label.className='mobile-nav-label';label.textContent=labels[i];label.setAttribute('aria-hidden','true');item.append(label);
  item.addEventListener('click',()=>{if(media.matches)requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));});
 });
 let serial=0,scheduled=false;
 const filterSelectors='.filters-shell,.dgis-filters,.oa-controls,.compare-controls,#productionPortal .production-controls';
 function refresh(){
  scheduled=false;
  main.querySelectorAll(filterSelectors).forEach(host=>{
   if(!host.classList.contains('mobile-filter-host')){
    host.classList.add('mobile-filter-host','mobile-filters-closed');
    if(!host.id)host.id='mobile-filters-'+(++serial);
    const button=document.createElement('button');button.type='button';button.className='mobile-filter-toggle';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',host.id);
    button.innerHTML='<i class="fas fa-sliders" aria-hidden="true"></i><span>Filtros</span><span class="mobile-filter-count"></span><i class="fas fa-chevron-down mobile-filter-chevron" aria-hidden="true"></i>';
    button.addEventListener('click',()=>{const closed=host.classList.toggle('mobile-filters-closed');button.setAttribute('aria-expanded',String(!closed));});
    host.prepend(button);
   }
   const count=[...host.querySelectorAll('input,select')].filter(n=>!n.disabled&&!n.matches('[aria-hidden="true"],.filter-hidden-state,[type="hidden"]')&&n.value).length;
   const badge=host.querySelector('.mobile-filter-count');const text=count?count+' activos':'Todos';if(badge.textContent!==text)badge.textContent=text;
  });
  if(!media.matches){
   main.querySelectorAll('.mobile-scroll').forEach(w=>{w.querySelector('.mobile-chart-value')?.remove();w.replaceWith(...w.childNodes);});
   return;
  }
  main.querySelectorAll('svg,table,.portal-month-bars').forEach(node=>{
   if(node.closest('.leaflet-container,.mobile-scroll')||node.matches('svg:not([viewBox])'))return;
   let width=0;
   if(node.tagName.toLowerCase()==='svg'){
    const box=node.viewBox.baseVal;
    if(box.width<400||box.width/box.height<1.5)return;
    width=Math.min(1000,Math.max(540,box.width*.9));
   }
   const wrapper=document.createElement('div');wrapper.className='mobile-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');
   wrapper.setAttribute('aria-label',node.getAttribute('aria-label')||(node.tagName==='TABLE'?'Tabla de datos':'Gráfico'));
   if(width)wrapper.style.setProperty('--mobile-chart-width',width+'px');
   node.before(wrapper);wrapper.append(node);
   if(width&&!node.dataset.mobileTouch){
    node.dataset.mobileTouch='true';
    node.addEventListener('click',event=>{
     if(!media.matches)return;
     const wrapper=node.closest('.mobile-scroll');if(!wrapper)return;
     const text=event.target.closest('circle,rect,path,polygon')?.querySelector('title')?.textContent;
     if(!text)return;
     let detail=wrapper.querySelector('.mobile-chart-value');
     if(!detail){detail=document.createElement('div');detail.className='mobile-chart-value';detail.setAttribute('role','status');wrapper.append(detail);}
     detail.textContent=text;
    });
   }
  });
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
 new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
 main.addEventListener('change',schedule);
 media.addEventListener('change',schedule);
 refresh();
})();
