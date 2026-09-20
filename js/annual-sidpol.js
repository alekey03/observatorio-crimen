/* SIDPOL adapter: published daily aggregates and territorial fields used by existing filters. */
window.AnnualSidpol=(()=>{
  let revision=0,metadataPromise;
  const yearCache=new Map();
  async function load(year,monthly){
    const key=(monthly?'modalidades_mensuales/':'diario_por_anio/')+year;
    if(!yearCache.has(key))yearCache.set(key,fetch('data/api/'+key+'.json').then(r=>{
      if(r.status===404)return null;
      if(!r.ok)throw new Error('Falta el detalle diario de '+year+'. No se presentan cifras incompletas.');
      return r.json();
    }).then(rows=>rows?rows.map(normalizarFilaDatos):null).catch(e=>{yearCache.delete(key);throw e;}));
    return yearCache.get(key);
  }
  const results=new Map();
  function query(state){
    const key=JSON.stringify(state);
    if(!results.has(key)){
      if(results.size>=30)results.delete(results.keys().next().value);
      results.set(key,queryRows(state).catch(error=>{results.delete(key);throw error;}));
    }
    return results.get(key);
  }
  async function queryRows(state){
    const end=new Date(state.to+'T12:00:00Z');
    const monthly=state.from.endsWith('-01')&&end.getUTCDate()===new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
    const rows=await load(state.from.slice(0,4),monthly),result={total:0,months:{},crimes:{}};
    if(!rows)return null;
    const add=(obj,key,n)=>obj[key]=(obj[key]||0)+n;
    let processed=0;
    for(const row of rows){
      if(++processed%4000===0)await new Promise(resolve=>setTimeout(resolve,0));
      const day=String(row.ANIO)+'-'+String(row.MES).padStart(2,'0')+'-'+String(monthly?1:row.DIA).padStart(2,'0');
      if(day<state.from||day>state.to)continue;
      if(state.department&&normalizar(row.DPTO_HECHO)!==normalizar(state.department)||
        state.province&&normalizar(row.PROV_HECHO)!==normalizar(state.province)||
        state.district&&normalizar(row.DIST_HECHO)!==normalizar(state.district)||
        !modalidadCoincideDelito(row.MODALIDAD,state.crime))continue;
      const n=obtenerCasos(row);
      result.total+=n;add(result.months,day.slice(0,7),n);
      const group=delitosPrioritarios.find(g=>modalidadCoincideDelito(row.MODALIDAD,g.etiqueta));
      add(result.crimes,state.crime||group?.etiqueta||(normalizar(row.MODALIDAD).includes('HOMICIDIO')?'Homicidio':'Otros delitos'),n);
    }
    return result;
  }
  async function render(compact){
    if(window.ObservatorioFuente?.active)return;
    const token=++revision,root=document.getElementById(compact?'annualHomeSidpol':'annualSidpol');
    if(!root)return;
    try{
      metadataPromise ||= fetch('data/api/resumen.json').then(r=>{if(!r.ok)throw new Error('No se pudo consultar el corte de SIDPOL.');return r.json();}).catch(e=>{metadataPromise=null;throw e;});
      const [row]=await metadataPromise;
      if(token!==revision)return;
      const metadata={min_date:String(row.fecha_minima).slice(0,10),max_date:String(row.fecha_maxima).slice(0,10)};
      const state={from:filtros.fechaDesde.value,to:filtros.fechaHasta.value,department:filtros.departamento.value,province:filtros.provincia.value,district:filtros.distrito.value,crime:filtros.delito.value};
      if(!state.from&&!state.to){
        const cutoff=new Date(metadata.max_date+'T12:00:00Z');
        const lastDay=new Date(Date.UTC(cutoff.getUTCFullYear(),cutoff.getUTCMonth()+1,0)).getUTCDate();
        state.to=cutoff.getUTCDate()===lastDay?metadata.max_date:new Date(Date.UTC(cutoff.getUTCFullYear(),cutoff.getUTCMonth(),0)).toISOString().slice(0,10);
        state.from=state.to.slice(0,4)+'-01-01';
      }
      await Annual.mount(root,{label:'SIDPOL',metadata,state,query,open:()=>activarVista('comparador-delitos'),totalLabel:'Total de casos publicados',sumNote:'Acumulado de los conteos mensuales publicados.',footer:'Territorio del hecho. Comparación histórica por meses completos; los rangos diarios sin detalle histórico se indican como no disponibles.'},compact);
    }catch(e){if(token===revision)root.innerHTML='<p class="ac-notice" role="alert">'+Portal.esc(e.message)+'</p>';}
  }
  return {render};
})();
