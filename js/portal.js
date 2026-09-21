/* Shared presentation helpers; no source totals are recomputed from overlapping categories. */
window.Portal = (() => {
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString('es-PE',{maximumFractionDigits:2});
  const titles = {inicio:['Pulso del delito','Una lectura ejecutiva del periodo seleccionado'], 'mapa-delito':['Distribución territorial','Participación e intensidad'], 'mapa-calor':['Distribución territorial','Intensidad geográfica'], 'comparador-delitos':['Comparativo anual','Cierre anual y periodos equivalentes'], 'analisis-temporal':['Cómo cambia el delito en el tiempo','Patrones y variaciones observadas'], 'analisis-predictivo':['Escenarios de corto plazo','Estimaciones sujetas a incertidumbre'], 'produccion-policial':['Resultados de la actividad policial','Producción por fecha y dependencia']};


  const journeys = [
    ['mapa-delito','01','fa-map-location-dot','Dónde se concentra','Explora departamentos, provincias y distritos.'],
    ['comparador-delitos','02','fa-scale-balanced','Cómo vamos frente a 2025','Contrasta el mismo periodo y el año completo.'],
    ['analisis-temporal','03','fa-clock','Cuándo se registra','Lee la evolución y los patrones del calendario.'],
    ['analisis-predictivo','04','fa-chart-line','Qué se puede anticipar','Consulta escenarios y márgenes de incertidumbre.'],
    ['produccion-policial','05','fa-chart-column','Qué actividad se reporta','Revisa los indicadores de producción policial.']
  ];
  function executive({total,territories={},crimes={},source,range,place,crime,territoryLabel='Territorios'}) {
    const ordered=obj=>Object.entries(obj).filter(([,n])=>Number.isFinite(n)&&n>0).sort((a,b)=>b[1]-a[1]);
    const ts=ordered(territories),cs=ordered(crimes),top=ts[0],lead=cs[0];
    const pct=n=>total>0?(n/total*100).toFixed(1)+'%':'—';
    const ranking=(rows,kind)=>rows.slice(0,5).map(([name,n],i)=>`<li><span class="ex-rank">${String(i+1).padStart(2,'0')}</span><div><span>${esc(name)}</span><div class="ex-track"><i style="width:${n/rows[0][1]*100}%"></i></div></div><strong>${fmt(n)}<small>${kind==='territory'?pct(n):'registros'}</small></strong></li>`).join('')||'<li class="ex-empty">Sin registros para esta selección.</li>';
    return `<section class="ex-home" aria-label="Resumen ejecutivo del periodo"><header class="ex-heading"><div><span class="ex-kicker">LECTURA EJECUTIVA</span><h2>El periodo, en una mirada</h2><p>${esc(range)} · ${esc(place)} · ${esc(source)}</p></div><span class="ex-source"><i class="fas fa-filter" aria-hidden="true"></i> ${esc(crime||'Todos los delitos')}</span></header>
    <div class="ex-lead-grid"><article class="ex-focus"><span class="ex-kicker">MAYOR VOLUMEN TERRITORIAL</span><h3>${esc(top?.[0]||'Sin registros')}</h3><div class="ex-focus-number">${top?pct(top[1]):'—'}<span>del total seleccionado</span></div><p>${top?fmt(top[1])+' denuncias en este territorio.':'Prueba otro periodo o territorio.'}</p><button type="button" data-ex-view="mapa-delito">Explorar el mapa <span aria-hidden="true">↗</span></button></article>
    <div class="ex-signals"><article><span class="ex-kicker">${crime?'DELITO SELECCIONADO':'CATEGORÍA CON MÁS REGISTROS'}</span><h3>${esc(crime||lead?.[0]||'Sin registros')}</h3><p>${crime?fmt(total):lead?fmt(lead[1]):'0'} denuncias en el periodo.</p><small>Volumen registrado; no es una tasa de riesgo.</small></article><article><span class="ex-kicker">ALCANCE DE LA SELECCIÓN</span><strong>${fmt(ts.length)}</strong><p>${esc(territoryLabel.toLowerCase())} con registros</p><small>Según la agrupación territorial publicada.</small></article></div></div>
    <div class="ex-rankings"><section><header><span class="ex-kicker">DISTRIBUCIÓN</span><h3>${crime?'Modalidad seleccionada':'Las categorías con mayor volumen'}</h3></header><ol>${ranking(cs,'crime')}</ol></section><section><header><span class="ex-kicker">TERRITORIO DEL HECHO</span><h3>${esc(territoryLabel)} con más denuncias</h3></header><ol>${ranking(ts,'territory')}</ol></section></div>
    <p class="ex-footnote">Lectura descriptiva de la selección actual. Los conteos por categoría o territorio pueden solaparse; no se suman para recalcular el total. La concentración no representa una tasa por habitante.</p>
    <header class="ex-heading ex-next"><div><span class="ex-kicker">PROFUNDIZA LA LECTURA</span><h3>Una pregunta, una vista</h3></div></header><nav class="ex-journeys" aria-label="Explorar el observatorio">${journeys.map(([view,num,icon,title,copy])=>`<button type="button" data-ex-view="${view}"><span class="ex-route"><i class="fas ${icon}" aria-hidden="true"></i><small>${num}</small></span><strong>${esc(title)}</strong><span>${esc(copy)}</span><b aria-hidden="true">↗</b></button>`).join('')}</nav></section>`;
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-ex-view]');if(button)activarVista(button.dataset.exView);});

  const sourceCutoffs = new Map();
  function longDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return '';
    const date = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) return '';
    return new Intl.DateTimeFormat('es-PE', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
  }
  function refreshSourceDate() {
    const element = document.getElementById('fuenteDetalle');
    if (!element) return;
    const source = document.body.dataset.portalView === 'produccion-policial'
      ? 'produccion-policial' : document.getElementById('selectorFuente')?.value;
    const labels = {'dgis-diaria':'DGIS diaria','dgis-mensual':'DGIS mensual','produccion-policial':'Producción DGIS'};
    if (!labels[source]) {
      element.textContent = 'Fecha de registro | Fuente independiente';
      element.removeAttribute('title');
      return;
    }
    const cutoff = longDate(sourceCutoffs.get(source));
    element.textContent = cutoff ? 'Actualizado al ' + cutoff + ' · ' + labels[source] : labels[source] + ' · Fecha de datos pendiente';
    element.title = 'Última fecha registrada en la fuente; no cambia al seleccionar otro periodo ni corresponde a la hora de publicación.';
  }
  function sourceUpdated(source, cutoff) {
    if (longDate(cutoff)) sourceCutoffs.set(source, cutoff);
    else sourceCutoffs.delete(source);
    refreshSourceDate();
  }
  function activate(view) {
    document.body.dataset.portalView=view;
    const [title, subtitle]=titles[view] || titles.inicio;
    const hero=document.querySelector('.hero h1');
    if(hero) hero.textContent=title;
    const sub=document.querySelector('.hero .subtitle');
    if(sub) sub.textContent=subtitle;
    refreshSourceDate();
    if(view==='mapa-delito' || view==='mapa-calor') {
      const head=document.querySelector('[data-section="mapa-delito"] .panel-header') || document.querySelector('[data-section="mapa-delito"] .section-header');
      if(head && !document.getElementById('portalMapModes')) {
        const controls=document.createElement('div');controls.id='portalMapModes';controls.className='portal-modes';
        controls.innerHTML='<button type="button" data-map-mode="mapa-delito">Participación</button><button type="button" data-map-mode="mapa-calor">Intensidad</button>';
        controls.onclick=e=>{const target=e.target.closest('[data-map-mode]');if(target) activarVista(target.dataset.mapMode);};head.append(controls);
      }
      const heat=document.querySelector('[data-section="mapa-calor"]');
      if(heat && !heat.querySelector('.portal-back')) {const b=document.createElement('button');b.className='portal-back';b.textContent='← Volver a participación';b.onclick=()=>activarVista('mapa-delito');heat.prepend(b);}
    }
    document.querySelectorAll('.menu li').forEach(item=>{item.tabIndex=0;item.setAttribute('role','button');item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click();}};});
  }
  function line(entries,{color='#44c9b5',label='Serie observada',future=0,bands=[]}={}) {
    if(!entries.length)return '<p class="portal-note">Sin datos en el periodo.</p>';
    const W=900,H=320,L=68,R=20,T=28,B=48;
    const max=Math.max(1,...entries.map(x=>x[1]),...bands.map(x=>x[1]))*1.12;
    const x=i=>L+i*(W-L-R)/Math.max(1,entries.length-1),y=n=>H-B-n/max*(H-T-B);
    let svg=Array.from({length:5},(_,i)=>{const n=max*i/4;return `<line x1="${L}" x2="${W-R}" y1="${y(n)}" y2="${y(n)}" class="portal-grid"/><text x="${L-10}" y="${y(n)+4}" text-anchor="end">${fmt(Math.round(n))}</text>`;}).join('');
    const cut=entries.length-future;
    if(bands.length){const points=bands.map((v,i)=>`${x(cut+i)},${y(v[1])}`).concat(bands.map((v,i)=>`${x(cut+i)},${y(v[0])}`).reverse());svg+=`<polygon points="${points.join(' ')}" fill="#f1ca58" opacity=".16"/>`;}
    svg+=`<polyline points="${entries.slice(0,future?cut:undefined).map((v,i)=>`${x(i)},${y(v[1])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
    if(future)svg+=`<line x1="${x(cut-1)}" x2="${x(cut-1)}" y1="${T}" y2="${H-B}" stroke="#8b979b" stroke-dasharray="4 5"/><polyline points="${entries.slice(cut-1).map((v,i)=>`${x(cut-1+i)},${y(v[1])}`).join(' ')}" fill="none" stroke="#f1ca58" stroke-width="3" stroke-dasharray="6 5"/>`;
    entries.forEach(([date,n],i)=>{svg+=`<circle cx="${x(i)}" cy="${y(n)}" r="3" fill="${i>=cut&&future?'#f1ca58':color}"><title>${esc(date)}: ${fmt(n)}</title></circle>`;if(i%Math.ceil(entries.length/9)===0||i===entries.length-1)svg+=`<text x="${x(i)}" y="${H-14}" text-anchor="middle">${esc(date)}</text>`;});
    return `<svg class="portal-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${svg}</svg>`;
  }
  function temporal(result, months, state, metadata) {
    const days=Object.entries(result.days).sort(([a],[b])=>a.localeCompare(b));
    const week=Array(7).fill(0), observations=Array(7).fill(0), byMonth=Array(12).fill(0), monthN=Array(12).fill(0);
    const first=state.from || metadata.min_date, last=state.to || metadata.max_date;
    for(let d=new Date(first+'T12:00:00Z');d.toISOString().slice(0,10)<=last;d.setUTCDate(d.getUTCDate()+1)){
      const key=d.toISOString().slice(0,10), index=(d.getUTCDay()+6)%7;
      week[index]+=result.days[key]||0;observations[index]++;
    }
    Object.entries(months).forEach(([m,n])=>{const end=new Date(Date.UTC(+m.slice(0,4),+m.slice(5),0)).toISOString().slice(0,10);if(m+'-01'>=first&&end<=last&&end<=metadata.max_date){const i=+m.slice(5)-1;byMonth[i]+=n;monthN[i]++;}});
    const averages=week.map((n,i)=>observations[i]?n/observations[i]:0),max=Math.max(...averages,1);
    const monthly=byMonth.map((n,i)=>monthN[i]?n/monthN[i]:null),mmax=Math.max(1,...monthly.filter(n=>n!==null));
    return `<div class="portal-section-head"><h2>Evolución del registro</h2><div class="portal-modes" id="portalPeriod"><button data-period="months" aria-pressed="true">Mes</button><button data-period="days">Día</button></div></div><div id="portalTimeChart">${line(Object.entries(months))}</div><p class="portal-note">Fecha de registro, no fecha del hecho. El último mes puede ser parcial; no se compara como un mes cerrado.</p><div class="portal-two"><section><h2>Patrón semanal de registro</h2>${averages.map((n,i)=>`<div class="portal-bar"><span>${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i]}</span><i style="width:${n/max*100}%"></i><b>${fmt(n)}</b></div>`).join('')}<p class="portal-note">Promedio por día disponible del calendario. La suma diaria puede contar una denuncia con varias fechas más de una vez.</p></section><section><h2>Promedio por mes del año</h2><div class="portal-month-bars">${monthly.map((n,i)=>`<div><b>${n===null?'—':fmt(Math.round(n))}</b><i style="height:${n===null?0:n/mmax*130}px"></i><span>${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'][i]}</span></div>`).join('')}</div><p class="portal-note">Solo meses completos del intervalo. —: sin un mes completo disponible. Descripción histórica, no prueba de estacionalidad.</p></section></div>`;
  }
  function bindTemporal(result,months) {
    document.querySelectorAll('#portalPeriod button').forEach(button=>button.onclick=()=>{document.getElementById('portalTimeChart').innerHTML=line(Object.entries(button.dataset.period==='days'?result.days:months).sort(([a],[b])=>a.localeCompare(b)));document.querySelectorAll('#portalPeriod button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
  }
  async function forecast(source,crime,state) {
    if(state.department||state.province||state.district)return '<section class="portal-empty"><h2>Proyecciones nacionales</h2><p>Esta evaluación DGIS está disponible a nivel nacional. Quita el filtro territorial. No se sustituyen las cifras por otra fuente.</p></section>';
    const response=await fetch(`data/api/observatorio/${source}.json`);
    if(!response.ok)return '<p class="portal-note">La evaluación de esta fuente todavía no está disponible. Consulta Análisis temporal.</p>';
    const data=await response.json(), normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const key=Object.keys(data.series).find(k=>normalize(k)===normalize(crime||'TODOS')), item=data.series[key];
    if(!item || item.evaluation.status!=='ok')return `<section class="portal-empty"><h2>Historia insuficiente para proyectar</h2><p>${esc(item?.evaluation.reason||'No hay una serie evaluada para este delito.')}</p><p>Se requieren al menos 48 meses completos para separar entrenamiento, selección y prueba. No se utiliza SIDPOL en lugar de DGIS.</p></section>`;
    const f=item.evaluation, history=data.months.slice(-18).map((m,i)=>[m,item.values[item.values.length-18+i]]),future=f.forecast.slice(0,3).map((n,i)=>{const d=new Date(data.months.at(-1)+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+i+1);return [d.toISOString().slice(0,7),n];});
    return `<div class="portal-section-head"><h2>Histórico y escenario a tres meses</h2><span class="portal-tag">Estimaciones, no hechos confirmados</span></div>${line(history.concat(future),{future:3,bands:f.intervals['80'].slice(0,3)})}<p class="portal-note">Fuente ${esc(data.source)} · Meses completos hasta ${esc(data.months.at(-1))}. El periodo de entrenamiento usa todo el historial disponible, no el intervalo del filtro. Rango empírico nominal del 80%; no garantiza cobertura.</p><div class="portal-two"><section><h2>Validación del modelo</h2><p>${esc(f.model)} · MAE de prueba: <strong>${fmt(f.mae)} denuncias</strong>.</p><table><thead><tr><th>Modelo</th><th>MAE de selección</th></tr></thead><tbody>${f.models.map(m=>`<tr><th>${esc(m.name)}</th><td>${fmt(m.mae)}</td></tr>`).join('')}</tbody></table><p class="portal-note">Prueba final de 12 meses separada de la selección. Menor error es mejor. Cambios de cobertura pueden invalidar la proyección.</p></section><section><h2>Escenarios de seguimiento</h2><table><thead><tr><th>Mes</th><th>Inferior</th><th>Central</th><th>Superior</th></tr></thead><tbody>${future.map(([m,n],i)=>`<tr><th>${m}</th><td>${fmt(f.intervals['80'][i][0])}</td><td>${fmt(n)}</td><td>${fmt(f.intervals['80'][i][1])}</td></tr>`).join('')}</tbody></table><p class="portal-note">Volumen agregado de registros. No identifica personas ni determina actuaciones policiales individuales.</p></section></div>`;
  }
  function selectionTotal(label,value,context) {
    return `<section class="selection-total" aria-label="Total de la selección"><div><span>${esc(label)}</span><p>${esc(dates(context))}</p></div><strong>${value==null?'No disponible':esc(typeof value==='number'?fmt(value):value)}</strong></section>`;
  }
  const dates=value=>String(value).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,'$3/$2/$1').replace(/\b(\d{4})-(\d{2})\b/g,'$2/$1');
  function formatDates(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())if(!walker.currentNode.parentElement.closest('script,style,input,select,textarea'))nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.textContent=dates(node.textContent);});
  }
  function coverage(cut){
    const [year,month,day]=cut.split('-').map(Number),last=new Date(Date.UTC(year,month,0)).getUTCDate();
    return day<last?'Último mes parcial':'Mes completo disponible';
  }
  function report({title,source,cut,content,filters=[]}){
    const win=window.open('','_blank');
    if(!win){alert('Permite ventanas emergentes para abrir el informe PDF.');return;}
    const clone=content.cloneNode(true);
    clone.querySelectorAll('button,form,.oa-controls,.oa-header,.dgis-heading,.dgis-compare-heading,.portal-modes,[hidden]').forEach(el=>el.remove());
    clone.querySelectorAll('details').forEach(el=>el.open=true);
    clone.querySelectorAll('rect[fill="url(#yearChartBg)"]').forEach(el=>el.setAttribute('fill','#fff'));
    formatDates(clone);
    const sheet=new URL('css/report.css?v=20260918-finish-6',location.href).href;
    const generated=new Date().toLocaleString('es-PE');
    win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="${esc(sheet)}"><link rel="stylesheet" href="${esc(new URL('css/annual.css?v=20260920-annual-2',location.href).href)}"></head><body><button class="print-action">Imprimir / Guardar PDF</button><header><small>OBSERVATORIO DEL CRIMEN · COMOPPOL PNP</small><h1>${esc(title)}</h1><p>Fuente: ${esc(source)} · Datos al ${esc(dates(cut))}</p><dl>${filters.map(([name,value])=>`<div><dt>${esc(name)}</dt><dd>${esc(dates(value))}</dd></div>`).join('')}</dl></header><main>${clone.innerHTML}</main><footer>Fuente: ${esc(source)} · Corte: ${esc(dates(cut))} · Informe generado: ${esc(generated)}. Los periodos parciales y los datos no disponibles se identifican en el contenido.</footer></body></html>`);
    win.document.close();win.document.querySelector('.print-action').onclick=()=>win.print();
    win.addEventListener('load',()=>{win.document.fonts.ready.then(()=>{win.__reportReady=true;win.print();});},{once:true});
    return win;
  }
  const mapHovers=new WeakMap();
  function attachMapHover(map,layer,name,count,percentage) {
    let tooltip=mapHovers.get(map);
    if(!tooltip){
      tooltip=L.tooltip({direction:'top',offset:[0,-14],opacity:1,interactive:false,className:'map-hover-detail'});
      mapHovers.set(map,tooltip);
      map.on('zoomstart movestart',()=>tooltip.remove());
    }
    const show=event=>{
      tooltip.setContent(`<strong>${esc(name)}</strong><span>${fmt(count)} denuncias</span><small>${esc(percentage)} del total seleccionado</small>`).setLatLng(event.latlng || layer.getBounds().getCenter());
      if(!map.hasLayer(tooltip))tooltip.addTo(map);
    };
    layer.on({mouseover:show,mousemove:show,mouseout:()=>tooltip.remove(),click:()=>tooltip.remove(),remove:()=>tooltip.remove()});
  }
  return {executive,activate,sourceUpdated,longDate,refreshSourceDate,esc,fmt,line,temporal,bindTemporal,forecast,attachMapHover,selectionTotal,dates,formatDates,coverage,report};
})();
