window.ProduccionPortal = (() => {
  let pending, data, root;
  const {esc,fmt} = Portal;
  const displayDate = iso => iso.split('-').reverse().join('/');
  const valueText = (n,definition) => n===null?'Sin reporte':`${definition.tipo==='moneda'?'S/ ':''}${Number(n).toLocaleString('es-PE',{maximumFractionDigits:Math.max(definition.decimales, n%1?2:0)})}`;
  function columns(a,b,first,last,baseYear,targetYear) {
    const max=Math.max(1,...Object.values(a),...Object.values(b))*1.18,W=850,H=300,L=65,B=45,T=24;
    const n=last-first+1,step=(W-L-20)/n,width=Math.min(22,step*.3),y=v=>H-B-v/max*(H-B-T);
    let svg=Array.from({length:5},(_,i)=>{const v=max*i/4;return `<line x1="${L}" x2="830" y1="${y(v)}" y2="${y(v)}" class="portal-grid"/><text x="55" y="${y(v)+4}" text-anchor="end">${fmt(Math.round(v))}</text>`;}).join('');
    for(let month=first;month<=last;month++){const x=L+(month-first+.5)*step,aa=a[month]||0,bb=b[month]||0;svg+=`<rect x="${x-width-2}" y="${y(aa)}" width="${width}" height="${H-B-y(aa)}" fill="#63a8db"><title>${baseYear}: ${fmt(aa)}</title></rect><rect x="${x+2}" y="${y(bb)}" width="${width}" height="${H-B-y(bb)}" fill="#edc859"><title>${targetYear}: ${fmt(bb)}</title></rect><text x="${x}" y="285" text-anchor="middle">${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'][month-1]}</text>`;}
    return `<div class="portal-note"><span style="color:#63a8db">● ${baseYear}</span> &nbsp; <span style="color:#edc859">● ${targetYear}</span></div><svg class="portal-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Producción mensual comparada">${svg}</svg>`;
  }
  function paint() {
    const from=root.querySelector('#prodFrom').value,to=root.querySelector('#prodTo').value,department=root.querySelector('#prodUnit').value,variable=root.querySelector('#prodVariable').value;
    const output=root.querySelector('#productionResults');
    root.querySelectorAll('#prodCsv,#prodPdf').forEach(button=>button.disabled=true);
    if(!from||!to||from>to||from.slice(0,4)!==to.slice(0,4)){output.innerHTML='<p role="alert">Selecciona un intervalo válido dentro del mismo año para compararlo con el anterior.</p>';return;}
    if(to>data.fecha_corte){output.innerHTML='<p role="alert">Hasta no puede superar el corte disponible.</p>';return;}
    const year=+from.slice(0,4),base=year-1,safe=(part)=>part==='02-29'&&new Date(Date.UTC(base,2,0)).getUTCDate()===28?'02-28':part;
    const previousFrom=`${base}-${safe(from.slice(5))}`,previousTo=`${base}-${safe(to.slice(5))}`;
    const totals=[{},{}],monthly=[{},{}],coverage=[false,false],ranking={};
    const [dates,units,variables]=data.dimensiones, vi=variables.indexOf(variable),ui=units.indexOf(department);
    for(const [di,unit,v,n] of data.detalle){const date=dates[di],target=date>=from&&date<=to,prior=date>=previousFrom&&date<=previousTo;if(!target&&!prior)continue;
      if(target&&v===vi)ranking[units[unit]]=(ranking[units[unit]]||0)+n;
      if(department&&unit!==ui)continue;
      const index=target?1:0;coverage[index]=true;totals[index][variables[v]]=(totals[index][variables[v]]||0)+n;
      if(v===vi){const month=+date.slice(5,7);monthly[index][month]=(monthly[index][month]||0)+n;}
    }
    const definition=data.definiciones.find(d=>d.variable===variable),a=coverage[0]?(totals[0][variable]||0):null,b=coverage[1]?(totals[1][variable]||0):null;
    const pct=a&&b!==null?(b-a)/a*100:null;
    const rank=Object.entries(ranking).sort((a,b)=>b[1]-a[1]).slice(0,10),max=Math.max(1,...rank.map(x=>x[1]));
    const rows=data.definiciones.map(d=>{const aa=coverage[0]?(totals[0][d.variable]||0):null,bb=coverage[1]?(totals[1][d.variable]||0):null;return {...d,a:aa,b:bb,pct:aa&&bb!==null?(bb-aa)/aa*100:null};});
    output.innerHTML=`<div class="production-numbers"><div><small>Periodo actual · ${year}</small><strong>${valueText(b,definition)}</strong></div><div><small>Mismo periodo · ${base}</small><strong>${valueText(a,definition)}</strong></div><div><small>Variación relativa</small><strong class="${pct>=0?'portal-positive':'portal-negative'}">${pct===null?'No comparable':(pct>0?'+':'')+pct.toFixed(1)+'%'}</strong></div></div>${!coverage.every(Boolean)?'<p class="portal-warning">No hay reporte para uno de los años con esta selección. Ausencia de información no equivale a producción cero.</p>':''}<div class="portal-two"><section><h2>${esc(definition.indicador)} por mes</h2>${coverage.every(Boolean)?columns(monthly[0],monthly[1],+from.slice(5,7),+to.slice(5,7),base,year):'<p class="portal-note">Comparación mensual no disponible.</p>'}<p class="portal-note">${from} al ${to}, comparado con los mismos días del año anterior. Los meses de los extremos pueden ser parciales.</p></section><section><h2>${esc(definition.indicador)} por dependencia</h2>${rank.map(([name,n])=>`<div class="portal-bar"><span>${esc(name)}</span><i style="width:${n/max*100}%"></i><b>${valueText(n,definition)}</b></div>`).join('')}<p class="portal-note">Diez mayores valores del periodo actual entre todas las dependencias. Este ranking no se limita al filtro de dependencia.</p></section></div><div class="portal-section-head"><h2>Detalle por indicador</h2><span>${esc(department||'Todas las dependencias')}</span></div><div class="portal-table-wrap"><table><thead><tr><th>Indicador</th><th>Unidad</th><th>${base}</th><th>${year}</th><th>Variación</th></tr></thead><tbody>${rows.map(d=>`<tr><th>${esc(d.indicador)}</th><td>${d.tipo==='moneda'?'Soles':d.decimales===3?'kg':'Cantidad'}</td><td>${valueText(d.a,d)}</td><td>${valueText(d.b,d)}</td><td class="${d.pct>=0?'portal-positive':'portal-negative'}">${d.pct===null?'—':(d.pct>0?'+':'')+d.pct.toFixed(1)+'%'}</td></tr>`).join('')}</tbody></table></div><p class="portal-note">Fuente: DGIS · Producción policial (Tableau). Corte ${data.fecha_corte}. Incluye direcciones, regiones y frentes. Se suman los valores originales; no se mezclan cantidades, kilos ni soles.</p><p class="portal-warning">Cobertura: ${esc((data.auditoria.dependencias_sin_2026||[]).join(', '))||'Sin ausencias identificadas'} sin registros de 2026. Se conservan ${data.auditoria.conteos_fraccionarios} valores fraccionarios en indicadores de cantidad tal como vienen en la fuente.</p>`;
    output.insertAdjacentHTML('afterbegin',Portal.selectionTotal(`Total · ${definition.indicador}`,valueText(b,definition),`${from} al ${to} · ${department||'Todas las dependencias'} · Producción DGIS`));
    root.querySelectorAll('#prodCsv,#prodPdf').forEach(button=>button.disabled=false);
    Portal.formatDates(output);
    root.querySelector('#prodPdf').onclick=()=>Portal.report({title:'Producción policial',source:data.fuente,cut:data.fecha_corte,content:output,filters:[['Desde',from],['Hasta',to],['Dependencia',department||'Todas las dependencias'],['Indicador',definition.indicador],['Comparado con',String(base)],['Cobertura',Portal.coverage(data.fecha_corte)]]});
    root.querySelector('#prodCsv').onclick=()=>{const body=[['Indicador','Unidad',String(base),String(year),'Variacion porcentual'],...rows.map(d=>[d.indicador,d.tipo==='moneda'?'Soles':d.decimales===3?'kg':'Cantidad',d.a??'',d.b??'',d.pct??''])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`produccion_${from}_${to}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }
  async function show() {
    const section=document.querySelector('[data-section="produccion-policial"]');
    root=document.getElementById('productionPortal');if(!root){root=document.createElement('div');root.id='productionPortal';section.append(root);}
    if(root.dataset.ready)return;
    root.innerHTML='<p role="status">Cargando producción por dependencia…</p>';
    try {
      pending ||= fetch('data/api/produccion_policial.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('No se pudo cargar la producción.');return r.json();}).catch(e=>{pending=null;throw e;});data=await pending;
      if(!data.detalle?.length||!data.dimensiones)throw Error('Falta preparar el CSV detallado de producción. Ejecuta Actualizar web pública.');
      root.innerHTML=`<header class="dgis-heading"><span>PRODUCCIÓN POLICIAL · DGIS</span><h1>Resultados de la actividad policial</h1><p>Corte ${data.fecha_corte} · ${data.dimensiones[1].length} dependencias · ${data.definiciones.length} indicadores</p></header><form class="production-controls"><label>Desde<input type="date" id="prodFrom" min="${data.dimensiones[0][0]}" max="${data.fecha_corte}" value="${data.fecha_corte.slice(0,4)}-01-01"></label><label>Hasta<input type="date" id="prodTo" min="${data.dimensiones[0][0]}" max="${data.fecha_corte}" value="${data.fecha_corte}"></label><label>Dependencia<select id="prodUnit"><option value="">Todas las dependencias</option>${data.dimensiones[1].map(u=>`<option>${esc(u)}</option>`).join('')}</select></label><label>Indicador<select id="prodVariable">${data.definiciones.map(d=>`<option value="${esc(d.variable)}">${esc(d.indicador)}</option>`).join('')}</select></label><div><button type="button" id="prodPdf" title="Imprimir o guardar PDF"><i class="fas fa-file-pdf"></i> PDF</button> <button type="button" id="prodCsv" title="Descargar tabla CSV"><i class="fas fa-download"></i> CSV</button></div></form><div id="productionResults" aria-live="polite"></div>`;
      root.querySelector('.dgis-heading p').innerHTML=`<span class="production-updated">Actualizado al <time datetime="${esc(data.fecha_corte)}">${displayDate(data.fecha_corte)}</time></span> · ${data.dimensiones[1].length} dependencias · ${data.definiciones.length} indicadores`;
      root.querySelector('.production-updated').title='Última fecha registrada en el CSV de producción; independiente del periodo seleccionado.';
      root.querySelector('.dgis-heading p').insertAdjacentHTML('beforeend',` · <span class="source-coverage">${Portal.coverage(data.fecha_corte)}</span>`);
      root.querySelector('form').onsubmit=e=>e.preventDefault();root.querySelector('form').onchange=paint;root.querySelector('#prodPdf').onclick=()=>window.print();root.dataset.ready='true';paint();
    }catch(e){root.innerHTML=`<p role="alert">${esc(e.message)}</p>`;}
  }
  return {show};
})();
