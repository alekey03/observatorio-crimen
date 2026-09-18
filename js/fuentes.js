(() => {
    const active = new URLSearchParams(location.search).get('fuente') === 'dgis-diaria';
    const source = document.getElementById('selectorFuente');
    const publicVersion=Boolean(document.querySelector('meta[name="odc-public"][content="true"]'));
    const localPreview=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
    if(!localPreview && !publicVersion){
        const option=source.querySelector('[value="dgis-diaria"]');
        option.disabled=true;
        option.textContent='DGIS diaria (en validacion local)';
    }
    source.value = active ? 'dgis-diaria' : 'sidpol';
    source.addEventListener('change', () => {
        const url = new URL(location.href);
        if (source.value === 'sidpol') url.searchParams.delete('fuente');
        else url.searchParams.set('fuente', source.value);
        location.assign(url.href);
    });
    let worker, metadata, geography, crimes, serial=0, revision=0, view='inicio', map, layer, mapResize, mapFitTimer;
    const requests = new Map();
    const root = document.getElementById('dgisWorkspace');
    const fmt = n => Number(n).toLocaleString('es-PE');
    const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const colors = ['#39c8b8','#61a5fa','#f4cf48','#f08c83','#c59cf5','#f5a344','#8aa9b7'];
    const request = data => new Promise((resolve,reject) => {
        const id = ++serial; requests.set(id,{resolve,reject}); worker.postMessage({...data,id});
    });
    function isolate() {
        document.querySelectorAll('[data-section], .sidpol-context').forEach(node => node.classList.add('is-hidden'));
        document.body.classList.remove('dashboard-view','observatory-view');
        root.hidden=false;
    }
    function setOptions(id, values, empty, selected='') {
        const input=document.getElementById(id);
        input.innerHTML=`<option value="">${empty}</option>` + [...new Set(values)].sort((a,b)=>a.localeCompare(b,'es')).map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
        input.value=values.includes(selected) ? selected : '';
    }
    function territoryOptions() {
        const department=document.getElementById('dgisDepartment').value;
        const province=document.getElementById('dgisProvince').value;
        const district=document.getElementById('dgisDistrict').value;
        setOptions('dgisProvince',department ? geography.filter(row=>row[0]===department).map(row=>row[1]) : [],'Todas las provincias',province);
        const selectedProvince=document.getElementById('dgisProvince').value;
        setOptions('dgisDistrict',selectedProvince ? geography.filter(row=>row[0]===department && row[1]===selectedProvince).map(row=>row[2]) : [],'Todos los distritos',district);
        document.getElementById('dgisProvince').disabled=!department;
        document.getElementById('dgisDistrict').disabled=!selectedProvince;
    }
    function filters() {
        return Object.fromEntries([['from','From'],['to','To'],['department','Department'],['province','Province'],['district','District'],['crime','Crime']].map(([key,id])=>[key,document.getElementById(`dgis${id}`).value]));
    }
    function chart(values, color='#39c8b8', daily=false) {
        const entries=Object.entries(values).sort(([a],[b])=>a.localeCompare(b));
        if(!entries.length) return '<p class="dgis-empty">No hay registros para esta seleccion.</p>';
        const max=Math.max(...entries.map(([,n])=>n),1), cap=Math.ceil(max/100)*100 || 1;
        const x=i=>70+i*800/Math.max(entries.length-1,1), y=n=>265-n/cap*220;
        const stride=Math.max(1,Math.ceil(entries.length/10));
        return `<svg viewBox="0 0 910 320" role="img" aria-label="Denuncias por ${daily?'dia':'mes'}"><g>${[0,1,2,3,4].map(i=>`<line x1="70" x2="870" y1="${y(cap*i/4)}" y2="${y(cap*i/4)}" stroke="#30414a"/><text x="58" y="${y(cap*i/4)+4}" text-anchor="end">${fmt(Math.round(cap*i/4))}</text>`).join('')}</g><polyline points="${entries.map(([,n],i)=>`${x(i)},${y(n)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>${entries.map(([key,n],i)=>`<circle cx="${x(i)}" cy="${y(n)}" r="${daily?2:4}" fill="${color}"><title>${esc(key)}: ${fmt(n)}</title></circle>${i%stride===0?`<text x="${x(i)}" y="295" text-anchor="middle">${esc(key)}</text>`:''}`).join('')}</svg>`;
    }
    function bars(values) {
        const entries=Object.entries(values).sort((a,b)=>b[1]-a[1]).slice(0,10);
        const max=Math.max(1,...entries.map(([,n])=>n));
        return entries.map(([name,n],i)=>`<div class="dgis-bar"><div><span>${esc(name)}</span><strong>${fmt(n)}</strong></div><div class="dgis-track"><i style="width:${n/max*100}%;background:${colors[i%colors.length]}"></i></div></div>`).join('') || '<p class="dgis-empty">Sin registros</p>';
    }
    function fillMonths(result, from, to) {
        const first=from>metadata.min_date ? from : metadata.min_date;
        const last=to && to<metadata.max_date ? to : metadata.max_date;
        if(first>last) return result;
        const values={};
        for(let date=new Date(`${first.slice(0,7)}-01T12:00:00Z`);date.toISOString().slice(0,7)<=last.slice(0,7);date.setUTCMonth(date.getUTCMonth()+1)) values[date.toISOString().slice(0,7)]=0;
        return {...values,...result};
    }
    async function render() {
        if(!metadata) return;
        const mine=++revision, state=filters(), output=document.getElementById('dgisResults');
        if(state.from && state.to && state.from>state.to) { output.innerHTML='<p role="alert">Desde no puede ser posterior a Hasta.</p>'; return; }
        output.setAttribute('aria-busy','true');
        try {
            const {result}=await request({type:'query',filters:state});
            if(mine!==revision) return;
            const totalLabel=state.crime || 'Denuncias unicas';
            const cards=state.crime ? [[totalLabel,result.total],['Territorios con denuncias',Object.keys(result.territories).length],['Meses con denuncias',Object.keys(result.months).length],['Dias con denuncias',Object.keys(result.days).length]] : [[totalLabel,result.total], ...['Extorsion','Secuestro','Robo','Hurto','Asalto y robo de Vehiculos'].map(name=>[name,Object.entries(result.crimes).find(([key])=>normalize(key)===normalize(name))?.[1] || 0]) ];
            const months=fillMonths(result.months,state.from,state.to);
            const territory=state.province ? 'Distritos' : state.department ? 'Provincias' : 'Departamentos';
            const intro=`<div class="dgis-kpis">${cards.map(([name,n],i)=>`<article style="--accent:${colors[i%colors.length]}"><span>${esc(name)}</span><strong>${fmt(n)}</strong></article>`).join('')}</div>`;
            const note=`<p class="dgis-note">Fuente: DGIS diaria · Fecha de registro · Corte ${metadata.max_date}. ${state.to && state.to<metadata.max_date ? '' : 'Ultimo mes parcial.'} Conteo distinto de denuncias. Los subtotales pueden solaparse si una denuncia tiene varios delitos, fechas o territorios. ${metadata.public?'Version publica: distritos de grupos pequenos agrupados como OTROS DISTRITOS.':''}</p>`;
            if(view==='comparador-delitos') { await comparator(state,mine); return; }
            if(view==='mapa-delito') {
                output.innerHTML=intro+`<div class="dgis-grid dgis-map-grid"><section><h2>Participacion de denuncias por departamento</h2><div id="dgisMap"></div><div class="dgis-map-legend" aria-label="Participacion de denuncias"><span><i style="background:#344953"></i>0%</span><span><i style="background:#9cc9b0"></i>Menos de 1%</span><span><i style="background:#c6d68b"></i>1 a menos de 5%</span><span><i style="background:#f0d676"></i>5 a menos de 10%</span><span><i style="background:#ef997f"></i>10% o mas</span></div><p class="dgis-note" id="dgisMapBase"></p></section><section><h2>${territory}</h2>${bars(result.territories)}</section></div>`+note;
                await renderMap(state,mine);
            } else if(view==='analisis-temporal') {
                output.innerHTML=intro+`<section class="dgis-band"><h2>Evolucion mensual</h2>${chart(months)}</section><section class="dgis-band"><h2>Registros diarios</h2>${chart(result.days,'#61a5fa',true)}</section>`+note;
            } else if(view==='inicio') {
                output.innerHTML=intro+`<div class="dgis-grid"><section><h2>${territory} con mas denuncias</h2>${bars(result.territories)}</section><section><h2>Delitos registrados</h2>${bars(result.crimes)}</section></div>`+note;
            } else {
                output.innerHTML=intro+`<section class="dgis-band"><h2>Evolucion mensual de denuncias</h2>${chart(months)}</section><div class="dgis-grid"><section><h2>Distribucion por delito</h2>${bars(result.crimes)}</section><section><h2>Concentracion territorial</h2>${bars(result.territories)}</section></div>`+note;
            }
        } catch(error) { if(mine===revision) output.innerHTML=`<p role="alert">${esc(error.message)}</p>`; }
        finally { if(mine===revision) output.removeAttribute('aria-busy'); }
    }
    async function renderMap(state,mine) {
        const response=await fetch('mapas/peru_departamental_simple.geojson');
        if(!response.ok) throw new Error('No se pudo cargar la cartografia.');
        const geo=await response.json();
        const {result}=await request({type:'query',filters:{...state,mapDepartments:true}});
        if(mine!==revision || view!=='mapa-delito') return;
        mapResize?.disconnect();
        clearTimeout(mapFitTimer);
        if(map) map.remove();
        map=L.map('dgisMap',{zoomSnap:.1,scrollWheelZoom:false}).setView([-9.2,-75.1],5);
        const values=new Map(Object.entries(result.territories).map(([key,value])=>[normalize(key),value]));
        const percent=n=>result.total ? n/result.total*100 : null;
        const text=n=>!result.total ? 'Sin datos' : n>0 && percent(n)<.1 ? '<0.1%' : `${percent(n).toFixed(1)}%`;
        const color=n=>!n ? '#344953' : percent(n)<1 ? '#9cc9b0' : percent(n)<5 ? '#c6d68b' : percent(n)<10 ? '#f0d676' : '#ef997f';
        layer=L.geoJSON(geo,{style:feature=>{const n=values.get(normalize(feature.properties.NOMBDEP)) || 0;return {color:'#d9e6df',weight:1,fillColor:color(n),fillOpacity:1};},onEachFeature:(feature,polygon)=>{
            const name=feature.properties.NOMBDEP, n=values.get(normalize(name)) || 0;
            const callao=normalize(name)==='CALLAO';
            polygon.bindTooltip(`<span title="${esc(name)}: ${fmt(n)} denuncias">${callao ? '<small>CALLAO</small>' : ''}${esc(text(n))}</span>`,{permanent:true,direction:'center',className:`dgis-map-percent${callao?' dgis-map-callao':''}${!n?' dgis-map-zero':''}`,offset:callao?[-50,8]:[0,0],opacity:1});
            polygon.bindPopup(`<strong>${esc(name)}</strong><br>${fmt(n)} denuncias<br><strong>${esc(text(n))}</strong> de ${fmt(result.total)} denuncias seleccionadas`);
            polygon.on({mouseover:()=>polygon.setStyle({weight:2,color:'#ffffff'}),mouseout:()=>layer.resetStyle(polygon)});
        }}).addTo(map);
        layer.eachLayer(polygon=>{
            const name=normalize(polygon.feature.properties.NOMBDEP);
            if(name==='PUNO') polygon.getTooltip().setLatLng([-15.15,-69.9]);
            if(name==='TUMBES') polygon.getTooltip().setLatLng([-3.83,-80.57]);
        });
        map.fitBounds(layer.getBounds(),{padding:[44,32]});
        const currentMap=map, currentLayer=layer;
        mapResize=new ResizeObserver(()=>{
            clearTimeout(mapFitTimer);
            mapFitTimer=setTimeout(()=>{
                if(map!==currentMap || !currentMap.getContainer().isConnected || view!=='mapa-delito') return;
                currentMap.invalidateSize();
                currentMap.fitBounds(currentLayer.getBounds(),{padding:[32,28],animate:false});
            },260);
        });
        mapResize.observe(map.getContainer());
        document.getElementById('dgisMapBase').textContent=`Base: ${fmt(result.total)} denuncias unicas con los filtros activos. Lima agrupa Lima Metropolitana y Region Lima. Los porcentajes no representan tasas de criminalidad; una denuncia con varios territorios puede participar en mas de uno.`;
    }
    async function comparator(state,mine) {
        const years=document.querySelectorAll('#dgisCompare select');
        const base=years[0].value, target=years[1].value;
        // Both years use the same available month/day interval.
        const start=state.from?.slice(5) || '01-01';
        let end=state.to?.slice(5) || '12-31';
        if([base,target].includes(metadata.max_date.slice(0,4)) && end>metadata.max_date.slice(5)) end=metadata.max_date.slice(5);
        const safeDate=(year,part)=>part==='02-29' && new Date(Date.UTC(Number(year),2,0)).getUTCDate()===28 ? `${year}-02-28` : `${year}-${part}`;
        if(start>end) throw new Error('El inicio del periodo queda despues del corte disponible.');
        const [a,b]=await Promise.all([base,target].map(year=>request({type:'query',filters:{...state,from:safeDate(year,start),to:safeDate(year,end)}})));
        if(mine!==revision) return;
        const delta=b.result.total-a.result.total, pct=a.result.total ? delta/a.result.total*100 : null;
        const sign=n=>n>0?'+' : '', style=n=>n<0?'#39c8b8':n>0?'#f4777f':'#d4e1e9';
        const max=Math.max(a.result.total,b.result.total,1);
        const first=Number(start.slice(0,2)), last=Number(end.slice(0,2));
        document.getElementById('dgisResults').innerHTML=`<div class="dgis-compare-heading"><h2>${esc(state.crime || 'Todas las denuncias')} · ${base} / ${target}</h2><button id="dgisPrint" title="Imprimir o guardar PDF"><i class="fas fa-print"></i> PDF</button></div><p>Periodo comparable: ${start.split('-').reverse().join('/')} al ${end.split('-').reverse().join('/')}, en ambos anos.</p><div class="dgis-grid"><section><table><thead><tr><th>Mes</th><th>${base}</th><th>${target}</th><th>Variacion</th></tr></thead><tbody>${Array.from({length:last-first+1},(_,i)=>first+i).map(month=>{const mm=String(month).padStart(2,'0'),n=a.result.months[`${base}-${mm}`]||0,m=b.result.months[`${target}-${mm}`]||0;return `<tr><th>${mm}</th><td>${fmt(n)}</td><td>${fmt(m)}</td><td style="color:${style(m-n)}">${sign(m-n)}${fmt(m-n)}</td></tr>`;}).join('')}<tr class="dgis-total"><th>Total unico</th><td>${fmt(a.result.total)}</td><td>${fmt(b.result.total)}</td><td style="color:${style(delta)}">${sign(delta)}${fmt(delta)}</td></tr></tbody></table></section><section><h2>Denuncias por ano</h2><svg viewBox="0 0 550 340" role="img" aria-label="Comparacion de denuncias"><line x1="40" x2="510" y1="280" y2="280" stroke="#46606c"/>${[a.result.total,b.result.total].map((n,i)=>`<rect x="${100+i*230}" y="${280-n/max*200}" width="110" height="${n/max*200}" fill="${colors[i]}" rx="3"/><text x="${155+i*230}" y="${268-n/max*200}" text-anchor="middle">${fmt(n)}</text><text x="${155+i*230}" y="308" text-anchor="middle">${i?target:base}</text>`).join('')}</svg><p class="dgis-delta" style="color:${style(delta)}">${sign(delta)}${fmt(delta)} <small>(${pct===null?'Sin base porcentual':`${sign(pct)}${pct.toFixed(1)}%`})</small></p></section></div><p class="dgis-note">Fuente: DGIS diaria · Fecha de registro · Corte ${metadata.max_date}. Conteo distinto; el total puede diferir de la suma mensual por denuncias con varias fechas.</p>`;
        document.getElementById('dgisPrint').onclick=()=>window.print();
    }
    function setView(name) {
        ++revision;
        view=name;
        if(name==='produccion-policial') {root.hidden=true;document.getElementById('fuenteDetalle').textContent='Produccion: DIVCOP - COMOPPOL PNP (fuente independiente)';return false;}
        isolate();
        document.querySelectorAll('[data-view]').forEach(node=>node.classList.toggle('active',node.dataset.view===name));
        if(!metadata) return true;
        document.getElementById('fuenteDetalle').textContent=`Fecha de registro | Corte: ${metadata.max_date} | ${metadata.public?'Version publica':'Vista local'}`;
        const supported=['inicio','dashboard','mapa-delito','analisis-temporal','comparador-delitos'].includes(name);
        document.getElementById('dgisFilters').hidden=!supported;
        document.getElementById('dgisCompare').hidden=name!=='comparador-delitos';
        document.getElementById('dgisTitle').textContent=({inicio:'Panorama ejecutivo del delito',dashboard:'Dashboard de denuncias', 'mapa-delito':'Distribucion territorial','analisis-temporal':'Evolucion de denuncias','comparador-delitos':'Comparador de denuncias'})[name] || 'Informacion no disponible';
        if(supported) render();
        else document.getElementById('dgisResults').innerHTML='<p class="dgis-empty">Esta vista aun no esta integrada con DGIS diaria. No se sustituyen sus datos por los de SIDPOL.</p>';
        return true;
    }
    async function start() {
        document.body.classList.add('dgis-active');
        isolate();
        root.innerHTML='<p class="dgis-empty" role="status">Cargando y validando DGIS diaria...</p>';
        worker=new Worker('js/dgis-worker.js');
        worker.onmessage=({data})=>{const pending=requests.get(data.id);if(!pending)return;requests.delete(data.id);data.error?pending.reject(new Error(data.error)):pending.resolve(data);};
        worker.onerror=()=>{requests.forEach(pending=>pending.reject(new Error('No se pudo procesar DGIS diaria.')));requests.clear();};
        try {
            const loaded=await request({type:'load',url:new URL(publicVersion?'data/api/dgis_diaria.json':'fuente diaria dgis/procesado/snapshot.json',location.href).href});
            ({metadata,geography,crimes}=loaded);
            root.innerHTML=`<header class="dgis-heading"><span>DGIS DIARIA · INFORMACION DEPURADA</span><h1 id="dgisTitle">Panorama ejecutivo del delito</h1><p>Fecha de registro · Corte ${metadata.max_date} · ${fmt(metadata.unique_complaints)} denuncias unicas en la fuente</p></header><form id="dgisFilters" class="dgis-filters"><label>DESDE<input id="dgisFrom" type="date" min="${metadata.min_date}" max="${metadata.max_date}" value="${metadata.max_date.slice(0,4)}-01-01"></label><label>HASTA<input id="dgisTo" type="date" min="${metadata.min_date}" max="${metadata.max_date}" value="${metadata.max_date}"></label><label>DEPARTAMENTO<select id="dgisDepartment"></select></label><label>PROVINCIA<select id="dgisProvince"></select></label><label>DISTRITO<select id="dgisDistrict"></select></label><label>DELITO<select id="dgisCrime"></select></label><button type="reset" title="Limpiar filtros"><i class="fas fa-filter-circle-xmark"></i></button></form><div id="dgisCompare" class="dgis-compare-controls" hidden><label>Ano base<select id="dgisBase"></select></label><label>Ano comparado<select id="dgisTarget"></select></label></div><div id="dgisResults" aria-live="polite"></div>`;
            setOptions('dgisDepartment',geography.map(row=>row[0]),'Todos los departamentos');territoryOptions();
            const priority=['EXTORSION','SECUESTRO','ROBO','HURTO','ASALTO Y ROBO DE VEHICULOS'];
            const options=list=>list.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
            const prioritized=priority.map(name=>crimes.find(crime=>normalize(crime)===name)).filter(Boolean);
            document.getElementById('dgisCrime').innerHTML='<option value="">Todos los delitos</option><optgroup label="Delitos prioritarios">'+options(prioritized)+'</optgroup><optgroup label="Otros delitos">'+options(crimes.filter(name=>!prioritized.includes(name)))+'</optgroup>';
            const years=Array.from({length:Number(metadata.max_date.slice(0,4))-Number(metadata.min_date.slice(0,4))+1},(_,i)=>String(Number(metadata.min_date.slice(0,4))+i));
            ['dgisBase','dgisTarget'].forEach((id,i)=>{document.getElementById(id).innerHTML=options(years);document.getElementById(id).value=years[Math.max(0,years.length-2+i)];document.getElementById(id).onchange=render;});
            document.getElementById('dgisFilters').onsubmit=event=>event.preventDefault();
            document.getElementById('dgisFilters').onchange=()=>{territoryOptions();render();};
            document.getElementById('dgisFilters').onreset=()=>setTimeout(()=>{territoryOptions();render();},0);
            setView(view);
        } catch(error) {root.innerHTML=`<div class="dgis-heading"><h1>DGIS diaria no disponible</h1><p>${esc(error.message)}</p><p>No se cargaron cifras de otra fuente.</p></div>`;}
    }
    window.ObservatorioFuente={active,start,setView};
})();
