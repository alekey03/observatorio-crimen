window.ProduccionPortal = (() => {
  let pending, data, root;
  let selected=[];
  const presets=source=>[{variable:'@operativos',indicador:'Operativos general',categoria:'Operativos',members:source.definiciones.filter(d=>d.categoria==='Operativos').map(d=>d.variable)},{variable:'@detenidos',indicador:'Detenidos general (nacionales + extranjeros)',categoria:'Detenidos',members:source.definiciones.filter(d=>d.categoria==='Detenidos'&&!d.variable.includes('Menores')).map(d=>d.variable)}];
  function selection(source, variable, members=[]) {
    const preset=presets(source).find(p=>p.variable===variable);
    const names=[...new Set(preset?preset.members:variable==='@custom'?members:[variable])];
    const defs=names.map(n=>source.definiciones.find(d=>d.variable===n));
    if(!defs.length||defs.some(d=>!d))throw Error('Selecciona al menos un indicador.');
    if(new Set(defs.map(d=>d.categoria+'|'+d.unidad+'|'+d.tipo)).size!==1)throw Error('Selecciona indicadores de la misma categoría y unidad.');
    return {...defs[0],variable,indicador:preset?preset.indicador:defs.length>1?'Suma de '+defs.length+' indicadores':defs[0].indicador,members:names,decimales:Math.max(...defs.map(d=>d.decimales))};
  }
  const sumReported=(totals,names)=>{const values=names.map(n=>totals[n]).filter(n=>n!==undefined);return values.length?values.reduce((a,b)=>a+b,0):null;};
  const {esc,fmt} = Portal;
  const valueText=(n,d)=>n===null||n===undefined?'Sin valor reportado':`${d.tipo==='moneda'?'S/ ':''}${Number(n).toLocaleString('es-PE',{maximumFractionDigits:Math.max(d.decimales,Number.isInteger(n)?0:5)})}`;
  const percent=(a,b)=>a!==null&&a!==0&&b!==null?(b-a)/a*100:null;
  const pctText=p=>p===null?'No comparable':`${p>0?'+':''}${p.toFixed(1)}%`;
  function calculate(source,{from,to,unit='',type='',variable='',category='',members=[]}) {
    const year=+from.slice(0,4),base=year-1;
    const safe=s=>s==='02-29'&&new Date(Date.UTC(base,2,0)).getUTCDate()===28?'02-28':s;
    const first=`${base}-${safe(from.slice(5))}`,last=`${base}-${safe(to.slice(5))}`;
    const [dates,units,variables]=source.dimensiones;
    const chosen=variable?selection(source,variable,members).members:[],vis=new Set(chosen.map(v=>variables.indexOf(v))),allowed=units.map(u=>(!unit||u===unit)&&(!type||source.tipos_dependencia[u]===type));
    const periods=dates.map(d=>d>=from&&d<=to?1:d>=first&&d<=last?0:-1);
    const totals=[{},{}],monthly=[{},{}],ranking={};
    for(const [di,ui,v,n] of source.detalle){
      const i=periods[di];if(i<0||!allowed[ui])continue;
      const name=variables[v];totals[i][name]=(totals[i][name]??0)+n;
      if(vis.has(v)){const month=+dates[di].slice(5,7);monthly[i][month]=(monthly[i][month]??0)+n;
        if(i===1)ranking[units[ui]]=(ranking[units[ui]]??0)+n;}
    }
    const rows=source.definiciones.filter(d=>!category||d.categoria===category).map(d=>{
      const a=totals[0][d.variable]??null,b=totals[1][d.variable]??null;
      return {...d,a,b,pct:percent(a,b)};
    });
    return {year,base,totals,monthly,ranking,rows};
  }
  function columns(a,b,first,last,base,year,d) {
    const max=Math.max(1,...Object.values(a),...Object.values(b))*1.15,W=850,H=300,L=85,B=45,T=24;
    const step=(W-L-20)/(last-first+1),width=Math.min(22,step*.3),y=v=>H-B-v/max*(H-B-T);
    let svg=Array.from({length:5},(_,i)=>{const v=max*i/4;return `<line x1="${L}" x2="830" y1="${y(v)}" y2="${y(v)}" class="portal-grid"/><text x="75" y="${y(v)+4}" text-anchor="end">${Intl.NumberFormat('es-PE',{notation:'compact',maximumFractionDigits:1}).format(v)}</text>`;}).join('');
    for(let m=first;m<=last;m++){
      const x=L+(m-first+.5)*step;
      for(const [series,offset,color,label] of [[a,-width-2,'#6196dc',base],[b,2,'#ba913b',year]]){
        const n=series[m];if(n!==undefined)svg+=`<rect x="${x+offset}" y="${y(n)}" width="${width}" height="${H-B-y(n)}" fill="${color}"><title>${label}: ${esc(valueText(n,d))}</title></rect>`;
      }
      svg+=`<text x="${x}" y="285" text-anchor="middle">${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'][m-1]}</text>`;
    }
    return `<p class="portal-note">● Azul: ${base} · ● Dorado: ${year} · ${esc(d.unidad)}</p><svg class="portal-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.indicador)}: comparación mensual">${svg}</svg>`;
  }
  function paint(){
    const get=id=>root.querySelector('#'+id).value;
    const from=get('prodFrom'),to=get('prodTo'),unit=get('prodUnit'),type=get('prodType'),variable=get('prodVariable'),category=get('prodCategory');
    const output=root.querySelector('#productionResults');
    root.querySelectorAll('#prodCsv,#prodPdf').forEach(b=>b.disabled=true);
    if(!from||!to||from>to||from.slice(0,4)!==to.slice(0,4)||from<data.dimensiones[0][0]||to>data.fecha_corte){output.innerHTML='<p role="alert">Elige fechas disponibles dentro del mismo año y hasta el corte del archivo.</p>';return;}
    let d;try{d=selection(data,variable,selected);}catch(e){output.innerHTML=`<p role="alert">${esc(e.message)}</p>`;return;}
    const result=calculate(data,{from,to,unit,type,variable,category,members:selected}),{year,base,totals,monthly,ranking,rows}=result;
    const a=sumReported(totals[0],d.members),b=sumReported(totals[1],d.members),pct=percent(a,b);
    const exportRows=d.members.length>1?[{...d,a,b,pct},...rows.filter(r=>d.members.includes(r.variable))]:rows;
    const rank=Object.entries(ranking).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...rank.map(x=>x[1]));
    const scope=unit||type||'Todas las dependencias';
    const ops=data.definiciones.filter(d=>d.categoria==='Operativos');
    const opvals=ops.map(d=>totals[1][d.variable]??null),optotal=opvals.every(n=>n!==null)?opvals.reduce((s,n)=>s+n,0):null;
    const withResult=ops.findIndex(d=>d.variable.includes('con Resultado'));
    const share=optotal?opvals[withResult]/optotal*100:null;
    output.innerHTML=`<div class="prod-focus"><div><span class="prod-eyebrow">${esc(d.categoria)} · ${esc(scope)}</span><h2>${esc(d.indicador)}</h2><p>${Portal.longDate(from)} — ${Portal.longDate(to)} · ${esc(d.unidad)}</p></div><span class="prod-chip">${year} / ${base}</span></div>
      ${d.members.length>1?`<p class="portal-note"><b>Incluye:</b> ${d.members.map(esc).join(' + ')}. Suma de valores reportados; los vacíos no se imputan como cero.${d.categoria==='Detenidos'?' Los menores pueden estar incluidos en nacionales/extranjeros: una selección que los combine no representa personas únicas.':d.categoria==='Operativos'?'':' Los indicadores pueden solaparse; esta suma no es un conteo de casos únicos.'}</p>`:''}
      <div class="prod-metrics"><article><small>Acumulado ${year}</small><strong>${valueText(b,d)}</strong><span>${esc(d.unidad)} reportados</span></article><article><small>Mismos días de ${base}</small><strong>${valueText(a,d)}</strong><span>Comparación equivalente</span></article><article><small>Variación relativa</small><strong>${pctText(pct)}</strong><span>${a!==null&&b!==null?valueText(b-a,d)+' de diferencia':'Sin base comparable'}</span></article></div>
      <div class="portal-two prod-panels"><section><h2>Ritmo mensual</h2>${columns(monthly[0],monthly[1],+from.slice(5,7),+to.slice(5,7),base,year,d)}<p class="portal-note">Mismos días en ambos años. Los meses de los extremos pueden ser parciales. Un mes sin valor no se representa como cero.</p></section><section><h2>Quién reporta este resultado</h2><p class="portal-note">${rank.length} dependencias con valor · ${esc(scope)}</p><div class="prod-ranking">${rank.length?rank.map(([name,n],i)=>`<div class="prod-rank-row"><span>${String(i+1).padStart(2,'0')}</span><div><b>${esc(name)}</b><i style="width:${n/max*100}%"></i></div><strong>${valueText(n,d)}</strong></div>`).join(''):'<p>Sin valores reportados para esta selección.</p>'}</div></section></div>
      <section class="prod-operations"><div><span class="prod-eyebrow">ACTIVIDAD OPERATIVA · ${esc(scope)}</span><h2>Del despliegue al resultado</h2><p>Operativos con y sin resultado, según la clasificación del archivo.</p></div><div class="prod-op-values">${ops.map((d,i)=>`<article><small>${esc(d.indicador.replace(/ \(.*$/,''))}</small><strong>${valueText(opvals[i],d)}</strong></article>`).join('')}<article><small>Total de ambos tipos</small><strong>${optotal===null?'No disponible':fmt(optotal)}</strong></article></div>${share!==null?`<div class="prod-share" aria-label="${share.toFixed(1)}% con resultado"><i style="width:${share}%"></i></div><p>${share.toFixed(1)}% de los operativos reportados fueron clasificados con resultado. Este porcentaje no mide por sí solo eficacia policial.</p>`:''}</section>
      <div class="portal-section-head"><h2>Resultados por indicador</h2><span>${rows.length} indicadores · ${esc(category||'Todas las categorías')}</span></div>
      <div class="prod-cards">${rows.map(r=>`<button type="button" class="prod-indicator ${d.members.includes(r.variable)?'is-selected':''}" data-variable="${esc(r.variable)}"><small>${esc(r.categoria)}</small><span>${esc(r.indicador)}</span><strong>${valueText(r.b,r)}</strong><small>${esc(r.unidad)} · ${pctText(r.pct)} frente a ${base}</small></button>`).join('')}</div>
      <details class="prod-detail"><summary>Ver tabla comparativa completa de esta selección</summary><div class="portal-table-wrap"><table><thead><tr><th>Indicador</th><th>Unidad</th><th>${base}</th><th>${year}</th><th>Variación</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${esc(r.indicador)}</th><td>${esc(r.unidad)}</td><td>${valueText(r.a,r)}</td><td>${valueText(r.b,r)}</td><td>${pctText(r.pct)}</td></tr>`).join('')}</tbody></table></div></details>
      <details class="prod-detail"><summary>Cómo leer estos datos</summary><p>Fuente: ${esc(data.fuente)}. Se suman exclusivamente valores reportados y se conservan sus decimales. Las celdas vacías no se convierten en cero; los acumulados pueden ser parciales. No se suman indicadores con distintas unidades.</p><p>La ubicación corresponde a la dependencia policial, no al departamento, provincia o distrito del hecho. ${esc((data.auditoria.dependencias_sin_2026||[]).join(', '))} no tiene filas de 2026.</p><p>Se conservan los valores originales, incluidos valores atípicos que requieren validación con la fuente. El CSV no incluye tarjetas SIM.</p></details>`;
    output.querySelectorAll('[data-variable]').forEach(el=>el.onclick=()=>{root.querySelector('#prodVariable').value=el.dataset.variable;syncChecks();paint();root.querySelector('.prod-focus').scrollIntoView({behavior:'smooth',block:'start'});});
    root.querySelectorAll('#prodCsv,#prodPdf').forEach(b=>b.disabled=false);
    root.querySelector('#prodPdf').onclick=()=>Portal.report({title:'Producción policial',source:data.fuente,cut:data.fecha_corte,content:output,filters:[['Desde',from],['Hasta',to],['Dependencia',scope],['Categoría',category||'Todas'],['Indicador',d.indicador],['Componentes',d.members.join(' + ')]]});
    root.querySelector('#prodCsv').onclick=()=>{const body=[['Indicador','Unidad',base,year,'Variacion porcentual'],...exportRows.map(r=>[r.indicador,r.unidad,r.a??'',r.b??'',r.pct??''])].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+body],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`produccion_${from}_${to}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }
  function updateOptions(){
    const category=root.querySelector('#prodCategory').value,type=root.querySelector('#prodType').value;
    const variable=root.querySelector('#prodVariable'),old=variable.value;
    variable.innerHTML=presets(data).filter(p=>!category||p.categoria===category).map(p=>`<option value="${p.variable}">${esc(p.indicador)}</option>`).join('')+'<option value="@custom">Seleccionar varios…</option>'+data.definiciones.filter(d=>!category||d.categoria===category).map(d=>`<option value="${esc(d.variable)}">${esc(d.indicador)}</option>`).join('');
    if([...variable.options].some(o=>o.value===old))variable.value=old;
    const unit=root.querySelector('#prodUnit'),before=unit.value;
    unit.innerHTML='<option value="">Todas las dependencias</option>'+data.dimensiones[1].filter(u=>!type||data.tipos_dependencia[u]===type).map(u=>`<option>${esc(u)}</option>`).join('');
    if([...unit.options].some(o=>o.value===before))unit.value=before;
    selected=selected.filter(n=>data.definiciones.some(d=>d.variable===n&&(!category||d.categoria===category)));
    root.querySelector('#prodChoices').innerHTML=data.definiciones.filter(d=>!category||d.categoria===category).map(d=>`<label><input type="checkbox" value="${esc(d.variable)}" ${selected.includes(d.variable)?'checked':''}>${esc(d.indicador)} <small>(${esc(d.unidad)})</small></label>`).join('');
    syncChecks();
    root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
  }
  function syncChecks(){
    const value=root.querySelector('#prodVariable').value;
    root.querySelector('#prodMultiple').hidden=value!=='@custom';
    if(value!=='@custom')selected=selection(data,value).members;
    root.querySelectorAll('#prodChoices input').forEach(el=>el.checked=selected.includes(el.value));
  }
  async function show(){
    const section=document.querySelector('[data-section="produccion-policial"]');
    root=document.getElementById('productionPortal');if(!root){root=document.createElement('div');root.id='productionPortal';section.append(root);}
    if(root.dataset.ready)return;
    root.innerHTML='<p role="status">Preparando los resultados de producción…</p>';
    try{
      pending ||= fetch('data/api/produccion_policial.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('No se pudo cargar producción.');return r.json();}).catch(e=>{pending=null;throw e;});data=await pending;
      if(data.schema!==2)throw Error('Falta actualizar la nueva fuente de producción.');
      const categories=[...new Set(data.definiciones.map(d=>d.categoria))];
      root.innerHTML=`<header class="dgis-heading prod-heading"><span>PRODUCCIÓN POLICIAL · DGIS</span><h1>La actividad policial, en detalle</h1><p class="production-updated">Actualizado al ${Portal.longDate(data.fecha_corte)}</p><div class="prod-badges"><span>${data.definiciones.length} indicadores</span><span>${categories.length} categorías</span><span>${data.auditoria.dependencias_por_anio[data.fecha_corte.slice(0,4)]} dependencias en ${data.fecha_corte.slice(0,4)}</span></div></header>
        <div class="prod-categories" aria-label="Explorar categorías"><button type="button" data-category="">Todos los resultados</button>${categories.map(c=>`<button type="button" data-category="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <form class="production-controls"><label>Desde<input type="date" id="prodFrom" min="${data.dimensiones[0][0]}" max="${data.fecha_corte}" value="${data.fecha_corte.slice(0,4)}-01-01"></label><label>Hasta<input type="date" id="prodTo" min="${data.dimensiones[0][0]}" max="${data.fecha_corte}" value="${data.fecha_corte}"></label><label>Tipo de unidad<select id="prodType"><option value="">Todos los tipos</option>${[...new Set(Object.values(data.tipos_dependencia))].sort().map(t=>`<option>${esc(t)}</option>`).join('')}</select></label><label>Dependencia policial<select id="prodUnit"></select></label><label>Categoría<select id="prodCategory"><option value="">Todas las categorías</option>${categories.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><label>Indicador del gráfico<select id="prodVariable"></select></label><fieldset id="prodMultiple" hidden><legend>Marca los indicadores que deseas sumar</legend><p class="portal-note">Elige una categoría para acortar la lista. Solo se suman indicadores de la misma categoría y unidad.</p><div id="prodChoices"></div></fieldset><div class="prod-exports"><button type="button" id="prodPdf">Guardar PDF</button><button type="button" id="prodCsv">Exportar tabla</button></div></form><p class="portal-note">Direcciones y regiones policiales; no departamentos geográficos. Cambia de categoría o toca una tarjeta para explorar su evolución.</p><div id="productionResults" aria-live="polite"></div>`;
      updateOptions();root.querySelector('#prodVariable').value='@operativos';syncChecks();
      root.querySelector('form').onsubmit=e=>e.preventDefault();
      root.querySelector('form').onchange=e=>{if(e.target.closest('#prodChoices'))selected=[...root.querySelectorAll('#prodChoices input:checked')].map(el=>el.value);else if(['prodCategory','prodType'].includes(e.target.id))updateOptions();else if(e.target.id==='prodVariable')syncChecks();paint();};
      root.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{root.querySelector('#prodCategory').value=b.dataset.category;updateOptions();paint();});
      Portal.sourceUpdated('produccion-policial',data.fecha_corte);root.dataset.ready='true';paint();
    }catch(e){root.innerHTML=`<p role="alert">${esc(e.message)}</p>`;}
  }
  return {show,calculate,selection,sumReported};
})();
