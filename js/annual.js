/* Annual comparison: exact source counts, explicit calendar coverage, no cross-source substitution. */
(function(global){
'use strict';
const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v===null||v===undefined?'—':Number(v).toLocaleString('es-PE');
const date=v=>v.split('-').reverse().join('/');
const signed=v=>(v>0?'+':'')+fmt(v);
function sameDate(year,part){
  const [m,d]=part.split('-').map(Number);
  return year+'-'+String(m).padStart(2,'0')+'-'+String(Math.min(d,new Date(Date.UTC(+year,m,0)).getUTCDate())).padStart(2,'0');
}
function periods(metadata,options){
  const {target,base}=options;
  if(+base>=+target)throw new Error('El año de referencia debe ser anterior al año analizado.');
  const from=options.from||target+'-01-01';
  const requested=options.to||target+'-12-31';
  const to=requested<metadata.max_date?requested:metadata.max_date;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||! /^\d{4}-\d{2}-\d{2}$/.test(requested) ||
    from.slice(0,4)!==String(target)||requested.slice(0,4)!==String(target)||from>to)
    throw new Error('Elige un rango válido dentro del año analizado y del corte disponible.');
  const covered=(start,end)=>({from:start,to:end,available:start>=metadata.min_date&&end<=metadata.max_date});
  return {current:covered(from,to),same:covered(sameDate(base,from.slice(5)),sameDate(base,to.slice(5))),full:covered(base+'-01-01',base+'-12-31'),clipped:to!==requested};
}
function difference(current,reference){
  if(current==null||reference==null)return {delta:null,percent:null};
  return {delta:current-reference,percent:reference===0?null:(current-reference)/reference*100};
}
function pct(n){return n==null?'Sin base porcentual':(n>0?'+':'')+n.toLocaleString('es-PE',{maximumFractionDigits:1})+'%';}
function series(result,year,period){
  return months.map((_,i)=>{
    const key=year+'-'+String(i+1).padStart(2,'0');
    return !result||key<period.from.slice(0,7)||key>period.to.slice(0,7)?null:(result.months[key]||0);
  });
}
function monthlyChart(a,b,target,base,cumulative=false){
  const W=900,H=300,L=66,R=22,T=26,B=42;
  const accumulate=values=>{let n=0;return values.map(v=>v===null?null:(n+=v));};
  if(cumulative){a=accumulate(a);b=accumulate(b);}
  const max=Math.max(1,...a.filter(v=>v!==null),...b.filter(v=>v!==null))*1.13;
  const x=i=>L+(i+.5)*(W-L-R)/12,y=n=>H-B-n/max*(H-T-B);
  let svg=Array.from({length:5},(_,i)=>{const n=max*i/4;return '<line class="ac-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(n)+'" y2="'+y(n)+'"/><text x="'+(L-9)+'" y="'+(y(n)+4)+'" text-anchor="end">'+fmt(Math.round(n))+'</text>';}).join('');
  [b,a].forEach((values,k)=>{
    const cl=k?'ac-current':'ac-base',label=k?target:base;
    if(cumulative){
      const points=values.map((n,i)=>n===null?null:x(i)+','+y(n)).filter(Boolean);
      svg+='<polyline class="'+cl+'" points="'+points.join(' ')+'" fill="none" stroke-width="3"/>';
    }
    values.forEach((n,i)=>{
      if(n===null)return;
      const title=esc(label+' · '+months[i]+': '+fmt(n));
      svg+=cumulative?'<circle class="'+cl+'" cx="'+x(i)+'" cy="'+y(n)+'" r="4" tabindex="0"><title>'+title+'</title></circle>':
        '<rect class="'+cl+'" x="'+(x(i)+(k?2:-20))+'" y="'+y(n)+'" width="18" height="'+(H-B-y(n))+'" rx="3" tabindex="0"><title>'+title+'</title></rect>';
    });
  });
  svg+=months.map((m,i)=>'<text x="'+x(i)+'" y="'+(H-12)+'" text-anchor="middle">'+m+'</text>').join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(cumulative?'Acumulado de conteos mensuales':'Denuncias por mes')+' de '+target+' y '+base+'">'+svg+'</svg>';
}
function miniBars(items){
  const max=Math.max(1,...items.map(i=>i.value||0));
  return '<div class="ac-total-bars">'+items.map(i=>'<div><span>'+esc(i.label)+'</span><div class="ac-track"><i class="'+i.color+'" style="width:'+(i.value==null?0:i.value/max*100)+'%"></i></div><strong>'+fmt(i.value)+'</strong></div>').join('')+'</div>';
}
const instances=new WeakMap();
async function mount(root,config,compact=false){
  if(!root)return;
  const previous=instances.get(root);
  const signature=JSON.stringify([config.state.from,config.state.to,config.metadata.max_date]);
  const maxYear=config.metadata.max_date.slice(0,4),firstYear=config.metadata.min_date.slice(0,4);
  const chosen=config.state.to?.slice(0,4)||maxYear;
  const target=chosen>=firstYear&&chosen<=maxYear?chosen:maxYear;
  const options=previous?.signature===signature?previous.options:{
    target,base:String(+target-1),from:config.state.from?.slice(0,4)===target?config.state.from:target+'-01-01',
    to:config.state.to?.slice(0,4)===target?config.state.to:(target===maxYear?config.metadata.max_date:target+'-12-31'),mode:'same'};
  const instance={options,signature,token:0};instances.set(root,instance);
  root.classList.add('annual-comparison');
  const years=Array.from({length:+maxYear-+firstYear+1},(_,i)=>String(+maxYear-i));
  // Include the previous year even if absent: it is explicitly shown as unavailable.
  if(!years.includes(options.base))years.push(options.base);
  const opts=value=>[...new Set([...years,value])].map(y=>'<option '+(y===value?'selected':'')+'>'+y+'</option>').join('');
  root.innerHTML='<header class="ac-heading"><div><p class="ac-eyebrow">COMPARACIÓN ANUAL</p><h2>'+(compact?'Comparación con el año anterior':'Comparación anual de denuncias')+'</h2><p>Comparación del periodo seleccionado con el mismo rango de fechas y el año completo de referencia.</p></div>'+
    (compact?'<button type="button" data-action="open" class="ac-button">Explorar comparativo <span aria-hidden="true">↗</span></button>':'<button type="button" data-action="print" class="ac-button">Guardar PDF</button>')+'</header>'+
    (!compact?'<div class="ac-controls"><label>Año analizado<select data-control="target">'+opts(options.target)+'</select></label><label>Año de referencia<select data-control="base">'+opts(options.base)+'</select></label><label>Desde<input type="date" data-control="from" value="'+options.from+'"></label><label>Hasta<input type="date" data-control="to" value="'+options.to+'"></label></div>':'')+
    '<div class="ac-context"><span>'+esc(config.label)+'</span><span>'+esc(config.state.crime||'Todos los delitos')+'</span><span>'+esc([config.state.department==='@LIMA'?'LIMA':config.state.department,config.state.province,config.state.district].filter(Boolean).join(' / ')||'Nacional')+'</span></div>'+
    '<div class="ac-content" aria-live="polite"></div>';
  const content=root.querySelector('.ac-content');
  let reportData;
  const cache=new Map();
  const get=async period=>{
    if(!period.available)return null;
    const filters={...config.state,from:period.from,to:period.to},key=JSON.stringify(filters);
    if(!cache.has(key))cache.set(key,Promise.resolve().then(()=>config.query(filters)).catch(e=>{cache.delete(key);throw e;}));
    return cache.get(key);
  };
  function table(data,p){
    const names=config.state.crime?[config.state.crime]:[...new Set([data.current,data.same,data.full].flatMap(d=>Object.keys(d?.crimes||{})))].sort((a,b)=>(data.current?.crimes[b]||0)-(data.current?.crimes[a]||0)||a.localeCompare(b,'es'));
    const val=(d,name)=>d?(d.crimes[name]||0):null;
    const cells=(label,c,s,f,isTotal=false)=>{
      const d=difference(c,s);
      return '<tr'+(isTotal?' class="ac-total"':'')+'><th scope="row">'+esc(label)+'</th><td>'+fmt(f)+'</td><td>'+fmt(s)+'</td><td class="ac-emphasis">'+fmt(c)+'</td><td>'+ (d.delta==null?'—':signed(d.delta))+'</td><td><span class="ac-change '+(d.delta<0?'ac-down':d.delta>0?'ac-up':'')+'">'+(d.percent==null?'—':pct(d.percent))+'</span></td></tr>';
    };
    return '<div class="ac-table-wrap" tabindex="0" role="region" aria-label="Tabla comparativa por delito"><table><caption>Comparación por delito · Variación calculada únicamente entre los mismos rangos de fechas</caption><thead><tr><th scope="col">Delito</th><th scope="col">'+options.base+'<small>Año completo</small></th><th scope="col">'+options.base+'<small>Mismo rango</small></th><th scope="col">'+options.target+'<small>Rango analizado</small></th><th scope="col">Diferencia<small>Mismo rango</small></th><th scope="col">Variación<small>Mismo rango</small></th></tr></thead><tbody>'+
      names.map(n=>cells(n,val(data.current,n),val(data.same,n),val(data.full,n))).join('')+
      cells(config.totalLabel||'Total de denuncias',data.current?.total??null,data.same?.total??null,data.full?.total??null,true)+'</tbody></table></div>';
  }
  function paint(data,p){
    reportData={data,p};
    const c=data.current?.total??null,s=data.same?.total??null,f=data.full?.total??null;
    const delta=difference(c,s),reference=options.mode==='same'?data.same:data.full,period=options.mode==='same'?p.same:p.full;
    const range=period=>date(period.from)+' — '+date(period.to);
    const card=(label,value,description,cl)=>'<article class="ac-kpi '+cl+'"><span>'+label+'</span><strong>'+fmt(value)+'</strong><small>'+description+'</small></article>';
    const signal=delta.delta==null?'No hay cobertura suficiente para comparar ambos rangos.':
      delta.delta===0?'El volumen se mantiene respecto al mismo rango de '+options.base+'.':
      fmt(Math.abs(delta.delta))+' denuncias '+(delta.delta>0?'más':'menos')+' que en el mismo rango de '+options.base+'.';
    const a=series(data.current,options.target,p.current),b=series(reference,options.base,period);
    content.innerHTML='<div class="ac-kpis">'+card(options.target+' · Periodo analizado',c,range(p.current),'ac-kpi-current')+
      card(options.base+' · Mismo rango',s,data.same?range(p.same):'Sin cobertura completa de este rango','')+
      card(options.base+' · Año completo',f,data.full?'1 enero — 31 diciembre':'Año completo no disponible en esta fuente','')+'</div>'+
      '<div class="ac-insight"><strong class="ac-change '+(delta.delta<0?'ac-down':delta.delta>0?'ac-up':'')+'">'+(delta.percent==null?'—':pct(delta.percent))+'</strong><div><b>'+signal+'</b><p>Comparación de periodos equivalentes · '+range(p.current)+' frente a '+range(p.same)+'.</p></div></div>'+
      (!compact?'<div class="ac-chart-header"><div><p class="ac-eyebrow">PERIODO DE REFERENCIA</p><h3>Referencia para la comparación</h3></div><div class="ac-switch" role="group" aria-label="Referencia de los gráficos"><button type="button" data-mode="same" aria-pressed="'+(options.mode==='same')+'">Mismo rango de fechas</button><button type="button" data-mode="full" aria-pressed="'+(options.mode==='full')+'">Año '+options.base+' completo</button></div></div>':'')+
      (options.mode==='full'&&!compact?'<p class="ac-notice">El año completo es una referencia de volumen. Tiene una duración distinta al periodo analizado; el porcentaje superior sigue comparando solo fechas equivalentes.</p>':'')+
      (!data.current?'<p class="ac-notice">La fuente no cubre todo el periodo analizado. No se presenta un total parcial como completo.</p>':'')+
      (!reference&&!compact?'<p class="ac-notice">La referencia elegida no está disponible completa en esta fuente. No se sustituye por cero ni por datos de otra fuente.</p>':'')+
      '<div class="ac-panels"><section class="ac-panel"><h3>'+(compact?'Totales por periodo comparado':'Evolución mensual')+'</h3>'+
      (compact?miniBars([{label:options.target+' · Rango actual',value:c,color:'ac-current'},{label:options.base+' · Mismo rango',value:s,color:'ac-base'},{label:options.base+' · Año completo',value:f,color:'ac-full'}]):
       '<div class="ac-legend"><span><i class="ac-current"></i>'+options.target+' · Rango actual</span><span><i class="ac-base"></i>'+options.base+' · '+(options.mode==='same'?'Mismo rango':'Año completo')+'</span></div>'+monthlyChart(a,b,options.target,options.base))+
      '<p class="ac-note">'+(compact?'El año completo se muestra como contexto, no como periodo equivalente.':'Los meses fuera de los rangos no se dibujan como cero. Los meses de inicio y fin pueden ser parciales.')+'</p></section>'+
      (!compact?'<section class="ac-panel"><h3>Acumulado de conteos mensuales</h3><p class="ac-note">Cómo se construye el volumen a lo largo del año.</p>'+monthlyChart(a,b,options.target,options.base,true)+'<p class="ac-note">'+esc(config.sumNote||'El acumulado suma los meses. Una denuncia con varias fechas puede participar en más de un mes; el total único se muestra en las tarjetas.')+'</p></section>':'')+'</div>'+
      '<section class="ac-detail"><div class="ac-chart-header"><div><p class="ac-eyebrow">DETALLE POR DELITO</p><h3>Comparación de denuncias por delito</h3></div><span class="ac-note">— = no disponible / sin base porcentual</span></div>'+table(data,p)+'</section>'+
      (!compact?'<details class="ac-month-detail"><summary>Ver cifras mensuales de los gráficos</summary><div class="ac-table-wrap"><table><thead><tr><th>Mes</th><th>'+options.base+'</th><th>'+options.target+'</th></tr></thead><tbody>'+months.map((m,i)=>'<tr><th scope="row">'+m+'</th><td>'+fmt(b[i])+'</td><td>'+fmt(a[i])+'</td></tr>').join('')+'</tbody></table></div></details>':'')+
      '<footer class="ac-footer">Fuente: '+esc(config.label)+' · Fecha de registro · Datos al '+date(config.metadata.max_date)+'. '+esc(config.footer||'Conteo distinto de denuncias. Los delitos pueden solaparse: no se suman para obtener el total.')+(p.clipped?' El fin solicitado se ajustó al corte disponible.':'')+'</footer>';
    content.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{options.mode=button.dataset.mode;paint(data,p);});
  }
  async function update(){
    const token=++instance.token;content.setAttribute('aria-busy','true');
    content.innerHTML='<p class="ac-loading" role="status">Preparando los tres periodos de comparación…</p>';
    try{
      const p=periods(config.metadata,options);
      const [current,same,full]=await Promise.all([get(p.current),get(p.same),get(p.full)]);
      if(instances.get(root)!==instance||token!==instance.token)return;
      paint({current,same,full},p);
    }catch(error){if(instances.get(root)===instance&&token===instance.token)content.innerHTML='<p class="ac-notice" role="alert">'+esc(error.message)+'</p>';}
    finally{if(token===instance.token)content.removeAttribute('aria-busy');}
  }
  root.querySelectorAll('[data-control]').forEach(input=>input.onchange=()=>{
    options[input.dataset.control]=input.value;
    if(input.dataset.control==='target'){
      options.base=String(+options.target-1);
      root.querySelector('[data-control="base"]').innerHTML=opts(options.base);
      options.from=options.target+'-01-01';options.to=options.target===maxYear?config.metadata.max_date:options.target+'-12-31';
      root.querySelector('[data-control="from"]').value=options.from;root.querySelector('[data-control="to"]').value=options.to;
    }
    update();
  });
  root.querySelector('[data-action="open"]')?.addEventListener('click',()=>config.open());
  root.querySelector('[data-action="print"]')?.addEventListener('click',()=>{
    if(!reportData)return;
    const report=root.cloneNode(true);report.querySelectorAll('.ac-controls,.ac-switch').forEach(el=>el.remove());
    Portal.report({title:'Comparativo anual · '+(config.state.crime||'Todos los delitos'),source:config.label,cut:config.metadata.max_date,content:report,filters:[['Periodo analizado',date(reportData.p.current.from)+' al '+date(reportData.p.current.to)],['Referencia',options.base+' · '+(options.mode==='same'?'Mismo rango':'Año completo')],['Territorio',[config.state.department,config.state.province,config.state.district].filter(Boolean).join(' / ')||'Nacional']]});
  });
  await update();
}
const api={periods,difference,sameDate,series,mount};
if(typeof module!=='undefined')module.exports=api;
global.Annual=api;
})(typeof window==='undefined'?globalThis:window);
