/* Dashboard-only presentation. Shared filters and the other views keep their contracts. */
const overviewCache = new Map();
let overviewRevision = 0;
const overviewNames = ["Extorsión", "Secuestro", "Robo", "Hurto", "Asalto y robo de vehículo"];
const overviewColors = ["#39c8b8", "#61a5fa", "#f4cf48", "#f08c83", "#c59cf5"];

async function overviewLoad(path){
    if(!overviewCache.has(path)){
        const pending = cargarJson(path).then(rows => {
            if(!Array.isArray(rows) || !rows.length) throw new Error("Fuente sin registros");
            return rows.map(normalizarFilaDatos);
        }).catch(error => { overviewCache.delete(path); throw error; });
        overviewCache.set(path, pending);
    }
    return overviewCache.get(path);
}

function overviewFilter(rows, state){
    return rows.filter(row => {
        if(state.desde && fechaNumeroFila(row) < fechaNumero(state.desde)) return false;
        if(state.hasta && fechaNumeroFila(row) > fechaNumero(state.hasta)) return false;
        return (!state.departamento || normalizar(row.DPTO_HECHO) === normalizar(state.departamento)) &&
            (!state.provincia || normalizar(row.PROV_HECHO) === normalizar(state.provincia)) &&
            (!state.distrito || normalizar(row.DIST_HECHO) === normalizar(state.distrito)) &&
            modalidadCoincideDelito(row.MODALIDAD, state.delito);
    });
}

function overviewGroups(rows, selected){
    const groups = delitosPrioritarios.map((group, index) => ({
        key: group.etiqueta, name: overviewNames[index], color: overviewColors[index], count: 0, months: new Map()
    }));
    if(selected && !grupoDelitoPrioritario(selected)) groups.push({key: selected, name: selected, color: "#39c8b8", count: 0, months: new Map()});
    rows.forEach(row => {
        const group = groups.find(item => modalidadCoincideDelito(row.MODALIDAD, item.key));
        if(!group) return;
        const count = obtenerCasos(row);
        group.count += count;
        if(Number(row.MES)){
            const key = `${row.ANIO}-${String(row.MES).padStart(2,"0")}`;
            group.months.set(key, (group.months.get(key) || 0) + count);
        }
    });
    return selected ? groups.filter(group => normalizar(group.key) === normalizar(selected)) : groups;
}

function overviewChart(groups, months, partialMonths = []){
    if(!months.length) return '<p class="ov-empty">No hay detalle mensual disponible para este periodo.</p>';
    const w=940, h=330, left=64, right=22, top=24, bottom=44;
    const maximum=Math.max(1, ...groups.flatMap(g => months.map(m => g.months.get(m) || 0)));
    const step=Math.pow(10, Math.floor(Math.log10(maximum)));
    const cap=Math.ceil(maximum / step) * step;
    const x=i => left + i * (w-left-right) / Math.max(months.length-1,1);
    const y=n => h-bottom - n/cap*(h-top-bottom);
    const grid=Array.from({length:5},(_,i) => {
        const value=cap*i/4;
        return `<line x1="${left}" x2="${w-right}" y1="${y(value)}" y2="${y(value)}" stroke="#283c46"/><text x="${left-12}" y="${y(value)+4}" text-anchor="end">${formatear(Math.round(value))}</text>`;
    }).join("");
    return `<div class="ov-legend">${groups.map(g => `<span><i style="background:${g.color}"></i>${escaparHtml(g.name)}</span>`).join("")}</div>
        <div class="ov-chart-scroll"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Denuncias mensuales por delito; valores disponibles al situarse sobre cada punto">
        ${partialMonths.map(month=>{const i=months.indexOf(month);return i<0 ? "" : `<rect x="${Math.max(left,x(i)-32)}" y="${top}" width="${Math.min(64,w-right-Math.max(left,x(i)-32))}" height="${h-top-bottom}" fill="#f4cf48" opacity=".07"/>`;}).join("")}
        ${grid}${months.map((month,i) => `<text x="${x(i)}" y="${h-14}" text-anchor="middle">${meses[Number(month.slice(5))-1]} ${month.slice(2,4)}${partialMonths.includes(month) ? "*" : ""}</text>`).join("")}
        ${groups.map(g => `<polyline points="${months.map((m,i) => `${x(i)},${y(g.months.get(m)||0)}`).join(" ")}" fill="none" stroke="${g.color}" stroke-width="3" stroke-linejoin="round"/>
        ${months.map((m,i) => `<circle tabindex="0" cx="${x(i)}" cy="${y(g.months.get(m)||0)}" r="4" fill="${g.color}" stroke="#10191f" stroke-width="1.5"><title>${escaparHtml(g.name)} · ${m}: ${formatear(g.months.get(m)||0)}</title></circle>`).join("")}`).join("")}
        </svg></div>`;
}

async function renderDashboardOverview(){
    const root=document.getElementById("dashboardOverview");
    if(!root) return;
    const revision=++overviewRevision;
    const state={desde:filtros.fechaDesde.value,hasta:filtros.fechaHasta.value,departamento:filtros.departamento.value,provincia:filtros.provincia.value,distrito:filtros.distrito.value,delito:filtros.delito.value};
    const esc=escaparHtml;
    const dated=Boolean(state.desde || state.hasta);
    root.setAttribute("aria-busy","true");
    root.innerHTML='<p class="ov-empty">Cargando el panorama del periodo…</p>';
    try{
        if(state.desde && state.hasta && state.desde > state.hasta) throw new Error("La fecha Desde debe ser anterior o igual a Hasta.");
        const years=[...new Set(datosSIDPOL.map(r => Number(r.ANIO)).filter(Boolean))].sort((a,b)=>a-b);
        const latest=years[years.length-1];
        let source=datosSIDPOL, chartSource, chartError=false;
        if(dated){
            const first=state.desde ? Number(state.desde.slice(0,4)) : years[0];
            const last=state.hasta ? Number(state.hasta.slice(0,4)) : latest;
            const requested=Array.from({length:Math.max(0,last-first+1)},(_,i)=>first+i);
            if(!requested.length || requested.length>100) throw new Error("Seleccione un rango de fechas válido.");
            try { source=(await Promise.all(requested.map(year=>overviewLoad(`data/api/diario_por_anio/${year}.json`)))).flat(); }
            catch { throw new Error("No está disponible el detalle diario de todo este rango. No se muestran totales parciales. Seleccione un periodo con datos publicados o actualice la fuente."); }
            chartSource=source;
        }else{
            try { chartSource=await overviewLoad(`data/api/modalidades_mensuales/${latest}.json`); }
            catch { chartSource=[]; chartError=true; }
        }
        if(revision!==overviewRevision) return;
        const rows=overviewFilter(source,state), monthly=overviewFilter(chartSource,state);
        const groups=overviewGroups(rows,state.delito), chartGroups=overviewGroups(monthly,state.delito);
        const allMonths=[...new Set(monthly.filter(r=>Number(r.MES)).map(r=>`${r.ANIO}-${String(r.MES).padStart(2,"0")}`))].sort();
        // Preserve gaps between observed months so the chart never joins non-adjacent months silently.
        const months=[];
        if(allMonths.length){
            const start=new Date(`${allMonths[0]}-01T12:00:00Z`), end=allMonths[allMonths.length-1];
            for(let date=start; date.toISOString().slice(0,7)<=end; date.setUTCMonth(date.getUTCMonth()+1)) months.push(date.toISOString().slice(0,7));
        }
        const visibleMonths=months.slice(-12);
        const priorityRows=rows.filter(r=>groups.some(g=>modalidadCoincideDelito(r.MODALIDAD,g.key)));
        const total=groups.reduce((sum,g)=>sum+g.count,0);
        const field=state.provincia ? "DIST_HECHO" : state.departamento ? "PROV_HECHO" : "DPTO_HECHO";
        const territories=topAgrupado(priorityRows,r=>r[field] || "SIN UBICACIÓN",7);
        const maxCount=Math.max(1,...groups.map(g=>g.count));
        const range=dated ? `${state.desde || "Inicio disponible"} — ${state.hasta || "Último dato disponible"}` : "Todos los años disponibles";
        const chartRange=visibleMonths.length ? `${visibleMonths[0]} / ${visibleMonths[visibleMonths.length-1]}` : "Sin serie";
        const summary=await overviewLoad('data/api/resumen.json').catch(()=>[]);
        if(revision!==overviewRevision) return;
        const sourceCut=String(summary[0]?.fecha_maxima || "").slice(0,10);
        const dailyCut=chartSource.reduce((max,r)=>Math.max(max,fechaNumeroFila(r)),0);
        const lastDate=dailyCut ? String(dailyCut).replace(/^(\d{4})(\d{2})(\d{2})$/,"$1-$2-$3") : sourceCut;
        const cut=lastDate ? lastDate.split('-').reverse().join('/') : "No informada";
        const partialMonths=[];
        const endCut=state.hasta && (!lastDate || state.hasta<lastDate) ? state.hasta : lastDate;
        if(state.desde && Number(state.desde.slice(8))>1) partialMonths.push(state.desde.slice(0,7));
        if(endCut){
            const [year,month,day]=endCut.split('-').map(Number);
            if(day < new Date(Date.UTC(year,month,0)).getUTCDate()) partialMonths.push(endCut.slice(0,7));
        }
        root.innerHTML=`<div class="ov-context"><span><i class="fas fa-chart-line" aria-hidden="true"></i> ${state.delito ? esc(state.delito) : "Delitos prioritarios"}</span><span>${esc(range)} · ${esc(state.distrito || state.provincia || state.departamento || "Nacional")}</span></div>
        <div class="ov-kpis">${groups.map(g=>`<article><span>${esc(g.name)}</span><strong style="color:${g.color}">${formatear(g.count)}</strong><small>Denuncias en el periodo</small></article>`).join("")}</div>
        <div class="ov-main"><section class="ov-evolution"><header><div><p class="ov-eyebrow">EVOLUCIÓN</p><h2>Evolución de ${state.delito ? "la modalidad seleccionada" : "delitos prioritarios"}</h2></div><span class="ov-period">${esc(chartRange)}</span></header>
        ${chartError ? '<p class="ov-empty">No se pudo cargar la serie mensual. Vuelva a abrir el Dashboard para reintentar.</p>' : overviewChart(chartGroups,visibleMonths,partialMonths)}
        <p class="ov-note">${dated ? "El gráfico respeta Desde/Hasta." : `Serie del último año publicado (${latest}). Los totales superiores incluyen todos los años.`} ${partialMonths.some(m=>visibleMonths.includes(m)) ? "* Mes parcial: no comparar directamente con un mes completo." : ""} ${months.length>12 ? "Se muestran los últimos 12 meses." : ""}</p></section>
        <aside class="ov-reading"><h2>Lectura del periodo</h2>
        <div><i class="fas fa-calendar-days" aria-hidden="true"></i><section><h3>Periodo seleccionado</h3><p>${esc(range)}</p><small>Último dato de la serie: ${esc(cut)}.</small></section></div>
        <div><i class="fas fa-layer-group" aria-hidden="true"></i><section><h3>${formatear(total)} denuncias</h3><p>${state.delito ? "Modalidad seleccionada" : "Suma de los cinco grupos prioritarios"}</p><small>Incluye las modalidades agravadas del grupo.</small></section></div>
        <div><i class="fas fa-location-dot" aria-hidden="true"></i><section><h3>${territories.length ? esc(territories[0].nombre) : "Sin registros"}</h3><p>${territories.length ? `${(territories[0].casos/Math.max(total,1)*100).toFixed(1)}% de la selección` : "No hay registros para estos filtros."}</p><small>Concentración territorial del periodo.</small></section></div></aside></div>
        <div class="ov-bottom"><section><header><div><p class="ov-eyebrow">COMPOSICIÓN</p><h2>Distribución por delito</h2></div></header>
        <div class="ov-bars">${[...groups].sort((a,b)=>b.count-a.count).map(g=>`<div><span>${esc(g.name)}</span><div class="ov-track"><i style="width:${g.count/maxCount*100}%;background:${g.color}"></i></div><strong>${formatear(g.count)}</strong></div>`).join("")}</div></section>
        <section><header><div><p class="ov-eyebrow">TERRITORIO</p><h2>Concentración territorial</h2></div><span class="ov-period">Top ${territories.length}</span></header><div class="ov-table-scroll"><table><thead><tr><th>#</th><th>${state.provincia ? "Distrito" : state.departamento ? "Provincia" : "Departamento"}</th><th>Casos</th><th>Participación</th></tr></thead><tbody>${territories.map((r,i)=>`<tr><td>${String(i+1).padStart(2,"0")}</td><th scope="row">${esc(r.nombre)}</th><td>${formatear(r.casos)}</td><td><div class="ov-share"><i style="width:${r.casos/Math.max(total,1)*100}%"></i><span>${(r.casos/Math.max(total,1)*100).toFixed(1)}%</span></div></td></tr>`).join("") || '<tr><td colspan="4">Sin registros en esta selección.</td></tr>'}</tbody></table></div></section></div>
        <footer>Fuente: SIDPOL <span>Fecha de registro · Información agregada · ${esc(range)}</span></footer>`;
    }catch(error){
        if(revision===overviewRevision) root.innerHTML=`<div class="ov-empty" role="status"><i class="fas fa-circle-info" aria-hidden="true"></i><h2>Información no disponible</h2><p>${esc(error.message)}</p></div>`;
    }finally{
        if(revision===overviewRevision) root.setAttribute("aria-busy","false");
    }
}
