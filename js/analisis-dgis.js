/* Aggregated DGIS profiles. No complaint or person records are loaded here. */
window.DgisAnalysis = (() => {
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const number = value => Number(value).toLocaleString('es-PE');
    const percent = (n,total) => !total?'—':n>0 && 100*n/total<0.1?'<0.1%':(100*n/total).toLocaleString('es-PE',{maximumFractionDigits:1})+'%';
    const unknown = value => /sin informaci[oó]n|no especifica|en investigaci[oó]n|sin dato/i.test(value);
    const descriptions = [
        ['Medio empleado','¿Con qué se cometió?','Clasificación del objeto empleado consignada en la fuente. PAF corresponde a arma de fuego.'],
        ['Móvil del hecho','¿Qué motivo se consigna?','Son categorías reportadas, no causas comprobadas. “En investigación” aquí es un móvil sin determinar; no es el estado procesal del caso.'],
        ['Tipo de delito','Clasificación general','Clasificación original de DGIS; no equivale necesariamente al delito prioritario seleccionado.'],
        ['Subtipo','Detalle del delito','Conserva todas las categorías de la fuente, sin agrupar las pequeñas en “otros”.'],
        ['Modalidad','¿Cómo se describe?','Solo se presenta lo que contiene esta columna; una columna vacía no significa ausencia de modalidades.'],
        ['Horario del hecho','¿En qué franja ocurre?','Franja derivada de la hora del hecho. Las 00:00 pueden representar una hora predeterminada en el origen; interpretar con cautela.'],
        ['Día del hecho','¿Qué días se concentran?','Cantidad de denuncias según el día de la semana del hecho. No es un promedio por lunes o martes ni el día de registro.'],
        ['Demora de registro','¿Cuánto tiempo transcurre?','Días calendario entre fecha del hecho y fecha de registro. Las fechas invertidas se muestran como incidencia, sin corregirlas artificialmente.'],
        ['Región policial','Organización policial','Campo REGPOL3 de DGIS. No representa necesariamente un departamento geográfico.']
    ];
    let cached;
    async function load(){
        if(!cached) cached=fetch('data/api/dgis_analisis.json').then(r=>{if(!r.ok)throw new Error('El análisis DGIS todavía no está disponible. Actualiza las fuentes con el BAT.');return r.json();}).catch(e=>{cached=null;throw e;});
        return cached;
    }
    async function mount(root, initial, forecast, current=()=>true){
        root.innerHTML='<p role="status">Preparando la lectura del delito…</p>';
        const data=await load();
        if(!root.isConnected || !current())return;
        const years=data.periods.filter(p=>p.length===4);
        let period=years.at(-1), department=data.departments.includes(initial.department)?initial.department:'*', crime=data.crimes.includes(initial.crime)?initial.crime:'*', tab='medios', sequence=0;
        const index=new Map(data.buckets.map(b=>[JSON.stringify(b.slice(0,3)),b]));
        const options=(values,all)=> (all?`<option value="*">${all}</option>`:'')+values.map(v=>`<option value="${escape(v)}">${escape(v)}</option>`).join('');
        root.innerHTML=`<div class="da-workspace"><div class="da-intro"><span class="da-eyebrow">DGIS DIARIA · ANÁLISIS DESCRIPTIVO</span><h2>Características de las denuncias registradas</h2><p>Explora medios, móviles y circunstancias registradas. Cada selección cuenta denuncias distintas, no víctimas.</p></div><form class="da-filters"><label>Periodo de registro<select id="daPeriod">${options(data.periods.slice().reverse())}</select></label><label>Departamento de la fuente<select id="daDepartment">${options(data.departments,'Nacional')}</select></label><label>Delito prioritario<select id="daCrime">${options(data.crimes,'Todos los delitos')}</select></label></form><p class="da-scope" id="daScope"></p><div id="daHighlights" class="da-highlights"></div><nav class="da-tabs" aria-label="Dimensiones del análisis"><button type="button" data-tab="medios">Medios y móviles</button><button type="button" data-tab="tiempo">Tiempo del hecho</button><button type="button" data-tab="detalle">Clasificación y calidad</button></nav><div id="daContent"></div><details class="da-method"><summary>Criterios de interpretación</summary><p>El periodo selecciona la fecha de registro. Horarios y días se calculan con la fecha del hecho de esas denuncias. Se ofrecen periodos anuales y mensuales, a nivel nacional o por departamento de la fuente; esta vista tiene sus propios filtros.</p><p>Una denuncia con varios valores puede participar en varias barras: las categorías no siempre suman el total y sus porcentajes pueden superar 100% al sumarse. No sumar periodos, delitos o departamentos para obtener un total único.</p><p>Los datos describen lo registrado; no demuestran causalidad ni miden el riesgo de una persona. El diario no proporciona un estado procesal del caso ni un perfil de edad o sexo. Se publican distribuciones separadas, sin identificadores, direcciones ni fichas individuales.</p></details><details class="da-method" id="daForecast"><summary>Proyecciones de denuncias · proyecciones disponibles</summary><div id="daForecastBody"></div></details><p class="dgis-note">Fuente: DGIS diaria · Corte ${escape(data.max_date)}. La actualización habitual del BAT también regenera este análisis.</p></div>`;
        const q=s=>root.querySelector(s);
        for(const option of q('#daPeriod').options) option.textContent=option.value.length===4?`${option.value} · acumulado del año`:new Date(`${option.value}-01T12:00:00Z`).toLocaleDateString('es-PE',{month:'long',year:'numeric',timeZone:'UTC'});
        const pdf=document.createElement('button');pdf.className='portal-report-button';pdf.textContent='Guardar PDF';
        pdf.onclick=()=>Portal.report({title:'Análisis del delito',source:'DGIS diaria',cut:data.max_date,content:root,filters:[['Periodo de registro',period],['Departamento',department==='*'?'Nacional':department],['Delito',crime==='*'?'Todos los delitos':crime],['Vista',tab]]});
        q('.da-tabs').after(pdf);
        q('#daPeriod').value=period;q('#daDepartment').value=department;q('#daCrime').value=crime;
        function panel(i,b){
            const [title,question,note]=descriptions[i], rows=(b?.[4][i]||[]).slice().sort((a,b)=>b[1]-a[1]);
            if(i===5)rows.sort((a,b)=>a[0].localeCompare(b[0]));
            if(i===6){const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo','Sin información'];rows.sort((a,b)=>days.indexOf(a[0])-days.indexOf(b[0]));}
            const total=b?.[3]||0, max=Math.max(1,...rows.map(r=>r[1]));
            if(i===5 && rows.length===1 && rows[0][0]==='00–05 h') return `<section class="da-panel"><span class="da-eyebrow">Calidad de la hora</span><h3>Horario por verificar</h3><div class="da-notice">Todas las denuncias de esta selección caen en 00–05 h. Puede existir una hora predeterminada en el origen. No se presenta como una concentración delictiva real.</div><p>Antes de analizar horarios, verifica que la exportación conserve la hora real del hecho.</p></section>`;
            const onlyEmpty=rows.length && rows.every(r=>unknown(r[0]));
            return `<section class="da-panel"><span class="da-eyebrow">${question}</span><h3>${title}</h3><p>${note}</p>${onlyEmpty?'<div class="da-notice">Esta selección no tiene información determinada en este campo.</div>':''}<div class="da-bars">${rows.map(([name,n])=>`<div class="da-row ${unknown(name)?'da-unknown':''}"><div><span>${escape(name)}</span><strong>${number(n)} <small>${percent(n,total)}</small></strong></div><div class="da-track"><i style="width:${n/max*100}%"></i></div></div>`).join('')||'<p>No hay registros para esta selección.</p>'}</div><small>Denuncias distintas · % sobre ${number(total)} denuncias de la selección.</small></section>`;
        }
        function render(){
            sequence++;
            const b=index.get(JSON.stringify([period,department,crime])), total=b?.[3]||0;
            const leading=i=>(b?.[4][i]||[]).filter(([name])=>!unknown(name)).sort((a,b)=>b[1]-a[1])[0];
            const weapon=leading(0), motive=leading(1);
            const partial=data.max_date.startsWith(period) && (period.length===4 ? data.max_date.slice(5)!=='12-31' : Number(data.max_date.slice(8))!==new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate());
            q('#daScope').textContent=`${period} · ${department==='*'?'Nacional':department} · ${crime==='*'?'Todos los delitos':crime} · ${partial?'Periodo parcial hasta '+data.max_date:'Periodo incluido en la fuente'}`;
            q('#daHighlights').innerHTML=`<article><span>Denuncias distintas</span><strong>${number(total)}</strong><small>No es un conteo de víctimas</small></article><article><span>Medio determinado más frecuente</span><strong>${escape(weapon?.[0]||'Sin información')}</strong><small>${weapon?`${number(weapon[1])} denuncias · ${percent(weapon[1],total)} del total`:'No se infiere a partir del delito'}</small></article><article><span>Móvil determinado más frecuente</span><strong>${escape(motive?.[0]||'Sin información')}</strong><small>${motive?`${number(motive[1])} denuncias · ${percent(motive[1],total)} del total`:'No se atribuye una causa sin datos'}</small></article>`;
            root.querySelectorAll('[data-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.tab===tab)));
            const fields=tab==='medios'?[0,1]:tab==='tiempo'?[5,6,7]:[2,3,4,8];
            const findings=fields.map(i=>{
                const top=leading(i), unavailable=(b?.[4][i]||[]).filter(([name])=>unknown(name)).sort((a,b)=>b[1]-a[1])[0];
                if(!total)return '';
                if(i===5 && b[4][i].length===1 && top?.[0]==='00–05 h')return '<li><strong>Horario:</strong> distribución uniforme en 00–05 h; se requiere validar la hora de origen. No se infiere una franja de mayor ocurrencia.</li>';
                if(i===7 && b[4][i].length===1 && top?.[0]==='Mismo día')return '<li><strong>Fechas:</strong> hecho y registro coinciden en todas las denuncias seleccionadas. Verifica si son fechas independientes en el origen antes de evaluar oportunidad de registro.</li>';
                return `<li><strong>${descriptions[i][0]}:</strong> ${top?`“${escape(top[0])}” es la categoría determinada más frecuente: ${number(top[1])} denuncias (${percent(top[1],total)} del total).`:'No hay valores determinados para elaborar un perfil.'}${unavailable?` ${number(unavailable[1])} denuncias incluyen “${escape(unavailable[0])}”; esa falta de precisión limita la interpretación.`:''}</li>`;
            }).filter(Boolean);
            q('#daContent').innerHTML=(findings.length?`<section class="da-reading"><h3>Resultados descriptivos de la selección</h3><ul>${findings.join('')}</ul><p>Describe las denuncias registradas; no permite concluir por sí solo por qué ocurre el delito.</p></section>`:'')+`<div class="da-grid">${fields.map(i=>panel(i,b)).join('')}</div>`+(tab==='detalle'?`<section class="da-panel"><h3>Campos sin información determinada</h3><p>Denuncias que incluyen algún valor sin determinar. Una denuncia puede tener a la vez un valor informado y otro vacío.</p><div class="da-quality">${descriptions.map(([name],i)=>{const entries=(b?.[4][i]||[]).filter(([v])=>unknown(v));return `<div><strong>${name}</strong><span>${entries.length?entries.map(([v,n])=>`${escape(v)}: ${number(n)}`).join(' · '):total?'Sin categorías vacías detectadas':'Sin registros'}</span></div>`;}).join('')}</div></section>`:'');
            q('#daForecast').open=false;q('#daForecastBody').replaceChildren();
        }
        q('form').onsubmit=e=>e.preventDefault();
        q('form').onchange=()=>{period=q('#daPeriod').value;department=q('#daDepartment').value;crime=q('#daCrime').value;render();};
        q('.da-tabs').onclick=e=>{const button=e.target.closest('[data-tab]');if(button){tab=button.dataset.tab;render();}};
        q('#daForecast').ontoggle=async()=>{
            if(!q('#daForecast').open)return;
            const mine=sequence;
            q('#daForecastBody').textContent='Consultando disponibilidad de modelos…';
            const from=period.length===4?period+'-01-01':period+'-01';
            const end=period.length===4?period+'-12-31':period+'-'+new Date(Number(period.slice(0,4)),Number(period.slice(5)),0).getDate();
            try{const html=await forecast({from,to:end<data.max_date?end:data.max_date,department:department==='*'?'':department,province:'',district:'',crime:crime==='*'?'':crime});if(mine===sequence&&current()&&q('#daForecastBody'))q('#daForecastBody').innerHTML=html;}
            catch(error){if(mine===sequence&&current()&&q('#daForecastBody'))q('#daForecastBody').textContent=error.message;}
        };
        render();
    }
    return {mount};
})();
