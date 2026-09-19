/* Shared presentation helpers; no source totals are recomputed from overlapping categories. */
window.Portal = (() => {
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString('es-PE',{maximumFractionDigits:2});
  const titles = {inicio:['Panorama del delito','Resumen ejecutivo'], 'mapa-delito':['Distribución territorial','Participación e intensidad'], 'mapa-calor':['Distribución territorial','Intensidad geográfica'], 'comparador-delitos':['Comparar delitos entre años','Mismo periodo, misma fuente'], 'analisis-temporal':['Cómo cambia el delito en el tiempo','Patrones y variaciones observadas'], 'analisis-predictivo':['Escenarios de corto plazo','Estimaciones sujetas a incertidumbre'], 'produccion-policial':['Resultados de la actividad policial','Producción por fecha y dependencia']};
  function activate(view) {
    document.body.dataset.portalView=view;
    const [title, subtitle]=titles[view] || titles.inicio;
    const hero=document.querySelector('.hero h1');
    if(hero) hero.textContent=title;
    const sub=document.querySelector('.hero .subtitle');
    if(sub) sub.textContent=subtitle;
    if(view==='produccion-policial') document.getElementById('fuenteDetalle').textContent='Producción DGIS · Tableau · Fuente independiente de denuncias';
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
  return {activate,esc,fmt,line,temporal,bindTemporal,forecast,attachMapHover};
})();
