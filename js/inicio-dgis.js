window.DgisOverview = (() => {
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const fmt=n=>Number(n).toLocaleString('es-PE');
    const normal=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const priority=[
        ['Homicidio','Homicidios','fa-person','Denuncias de homicidio','#546d88'],
        ['Extorsión','Extorsión','fa-phone','Denuncias de extorsión','#477980'],
        ['Secuestro','Secuestro','fa-lock','Denuncias de secuestro','#6b5c80'],
        ['Robo','Robo','fa-user-shield','Denuncias de robo','#8c7075'],
        ['Hurto','Hurto','fa-hand','Denuncias de hurto','#907f70'],
        ['Asalto y robo de Vehículos','Robo de vehículos','fa-car','Asalto y robo de vehículos','#8c7845']
    ];
    function render({total,territories={},crimes={},range,place,crime,territoryLabel}){
        const entries=Object.entries(crimes),find=name=>entries.find(([key])=>normal(key)===normal(name));
        function card([key,title,icon,description,color],side){
            const found=find(key),selected=crime && normal(crime)===normal(key),outside=crime&&!selected;
            return `<button type="button" class="odc-crime-card ${side} ${selected?'is-selected':''}" style="--crime-color:${color}" data-overview-crime="${esc(key)}" aria-pressed="${Boolean(selected)}"><span class="odc-crime-icon"><i class="fas ${icon}" aria-hidden="true"></i></span><span class="odc-crime-copy"><strong>${esc(title)}</strong><span>${outside?'Fuera del filtro actual':esc(description)}</span></span><b>${outside?'—':fmt(found?.[1]||0)}</b><span class="odc-crime-action">${selected?'Ver todos los delitos':'Seleccionar delito'} ↗</span></button>`;
        }
        const others=find('Otros'),outsideOther=crime && normal(crime)!=='OTROS';
        const top=Object.entries(territories).sort((a,b)=>b[1]-a[1])[0];
        return `<section class="odc-overview" aria-label="Panorama de delitos prioritarios"><header class="odc-overview-heading"><div><span>DGIS DIARIA · PANORAMA DEL DELITO</span><h2>Denuncias por delitos prioritarios</h2><p>${esc(range)} · ${esc(place)}</p></div><span class="odc-overview-filter">${esc(crime||'Todos los delitos')}</span></header><div class="odc-crime-stage"><div class="odc-crime-column">${priority.slice(0,3).map(p=>card(p,'is-left')).join('')}</div><div class="odc-crime-center"><span class="odc-center-eyebrow">${crime?'DELITO SELECCIONADO':'DENUNCIAS REGISTRADAS'}</span><div class="odc-peru-orbit"><img class="odc-peru-map" src="img/peru-resumen.svg" alt="Mapa referencial del Perú con límites departamentales"><img class="odc-peru-seal" src="img/logo_pnp.png" alt="Policía Nacional del Perú"></div><strong class="odc-center-total">${fmt(total)}</strong><span class="odc-center-label">${esc(crime||'DENUNCIAS DISTINTAS')}</span><small>${esc(place)} · periodo seleccionado</small><button type="button" data-ex-view="mapa-delito">Explorar el mapa <span aria-hidden="true">↗</span></button></div><div class="odc-crime-column">${priority.slice(3).map(p=>card(p,'is-right')).join('')}</div></div><footer class="odc-overview-footer"><button type="button" data-overview-crime="Otros" class="odc-other"><span>OTROS DELITOS</span><strong>${outsideOther?'—':fmt(others?.[1]||0)}</strong><small>${outsideOther?'Fuera del filtro actual':'Categoría original de DGIS'} ↗</small></button><div><span>TERRITORIO CON MÁS DENUNCIAS</span><strong>${esc(top?.[0]||'Sin registros')}</strong><small>${top?`${fmt(top[1])} denuncias · ${total?(100*top[1]/total).toFixed(1):'0'}% del total`:'No hay denuncias para los filtros seleccionados'}</small></div><button type="button" data-ex-view="analisis-predictivo" class="odc-deepen"><span>CARACTERÍSTICAS DEL DELITO</span><strong>Medios, móviles y circunstancias ↗</strong><small>Explorar el análisis</small></button></footer><p class="odc-overview-note">Selecciona una tarjeta para filtrar; tócala de nuevo para ver todos los delitos. Los conteos son denuncias, no víctimas. Una denuncia puede incluir varios delitos: las tarjetas no se suman para obtener el total. El mapa central es referencial; el aro es decorativo.</p></section>`;
    }
    return {render};
})();
