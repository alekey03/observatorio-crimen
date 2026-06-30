const vistaPeru = {
    centro: [-9.19, -75.0152],
    zoom: 5
};

const mapa = L.map("mapa", {
    zoomControl: true,
    minZoom: 5
}).setView(vistaPeru.centro, vistaPeru.zoom);

const limitesPeru = L.latLngBounds(
    [-19.5, -82.5],
    [0.5, -67.5]
);

mapa.setMaxBounds(limitesPeru);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; CARTO"
}).addTo(mapa);

let datosSIDPOL = [];
let datosSIDPOLMensual = [];
let anioSIDPOLMensual = "";
let errorSIDPOLMensual = false;
let datosTerritorio = [];
let geoDepartamentos = null;
let geoProvincias = null;
let geoDistritos = null;
let capaActual = null;
let vistaActual = "inicio";
let datosMapaCalor = [];
let datosMapaCalorNacional = [];
const cacheMapaCalorDepartamentos = new Map();
let departamentoMapaCalorActivo = "";
let mapaCalor = null;
let capaMapaCalor = null;
let capaLimitesMapaCalor = null;
let mapaCalorCargado = false;
let mapaAlertas = null;
let capaMapaAlertas = null;
let marcadoresMapaAlertas = null;
let datosPersonasTemporal = [];
let datosIncidenciaHoraria = [];
let analiticaTemporalCargada = false;

const filtros = {
    anio: document.getElementById("filtroAnio"),
    mes: document.getElementById("filtroMes"),
    departamento: document.getElementById("filtroDepartamento"),
    provincia: document.getElementById("filtroProvincia"),
    distrito: document.getElementById("filtroDistrito"),
    delito: document.getElementById("filtroDelito")
};

const indicadores = {
    total: document.getElementById("totalDenuncias"),
    extorsiones: document.getElementById("totalExtorsiones"),
    homicidios: document.getElementById("totalHomicidios"),
    robos: document.getElementById("totalRobos")
};

const resumenEjecutivo = {
    concentracion: document.getElementById("concentracionPrincipal"),
    territorio: document.getElementById("territorioConcentrado"),
    criticas: document.getElementById("jurisdiccionesCriticas"),
    matriz: document.getElementById("matrizRiesgo"),
    actividad: document.getElementById("actividadOperativa")
};

const estadoDatos = document.getElementById("estadoDatos");
const statusDot = document.querySelector(".status-dot");
const tituloResumen = document.getElementById("tituloResumen");
const textoResumen = document.getElementById("textoResumen");
const graficoTendencia = document.getElementById("graficoTendencia");
const graficoModalidades = document.getElementById("graficoModalidades");
const rankingTerritorial = document.getElementById("rankingTerritorial");
const alertasEstrategicas = document.getElementById("alertasEstrategicas");
const zonasCriticas = document.getElementById("zonasCriticas");
const tablaResumen = document.getElementById("tablaResumen");
const tendenciaEtiqueta = document.getElementById("tendenciaEtiqueta");
const tablaEtiqueta = document.getElementById("tablaEtiqueta");
const heatEstado = document.getElementById("heatEstado");
const heatTotal = document.getElementById("heatTotal");
const heatPuntos = document.getElementById("heatPuntos");
const heatMax = document.getElementById("heatMax");
const alertaEstado = document.getElementById("alertaEstado");
const alertasAlta = document.getElementById("alertasAlta");
const alertasMedia = document.getElementById("alertasMedia");
const alertasBaja = document.getElementById("alertasBaja");
const alertaTerritorio = document.getElementById("alertaTerritorio");
const alertaTotal = document.getElementById("alertaTotal");
const graficoTemporalComparado = document.getElementById("graficoTemporalComparado");
const modalidadesTemporales = document.getElementById("modalidadesTemporales");
const incidenciaHoraria = document.getElementById("incidenciaHoraria");
const situacionPersona = document.getElementById("situacionPersona");
const distribucionSexo = document.getElementById("distribucionSexo");
const matrizTemporal = document.getElementById("matrizTemporal");
const tablaTemporal = document.getElementById("tablaTemporal");
const timelineTemporal = document.getElementById("timelineTemporal");
const menuItems = document.querySelectorAll(".menu li[data-view]");
const viewSections = document.querySelectorAll(".view-section");

const colores = ["#fee08b", "#fdae61", "#fc8d59", "#d7301f", "#8b0000"];
const formatoNumero = new Intl.NumberFormat("es-PE");
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const coloresComparativo = ["#f1c84b", "#3d8bfd", "#25c19f", "#e65f5c"];

function normalizar(valor){
    return String(valor || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function numero(valor){
    return Number(String(valor || "0").replace(",", ".")) || 0;
}

function formatear(valor){
    return formatoNumero.format(Math.round(valor || 0));
}

function obtenerCasos(fila){
    return numero(fila.CASOS);
}

function normalizarFilaDatos(fila){
    return {
        ...fila,
        ANIO: String(fila.ANIO || "").trim(),
        MES: String(fila.MES || "").trim(),
        DPTO_HECHO: String(fila.DPTO_HECHO || "").trim(),
        PROV_HECHO: String(fila.PROV_HECHO || "").trim(),
        DIST_HECHO: String(fila.DIST_HECHO || "").trim(),
        MODALIDAD: String(fila.MODALIDAD || "").trim(),
        CASOS: numero(fila.CASOS)
    };
}

function fuenteDatosPrincipal(){
    return filtros.delito.value ? fuenteModalidadesActual() : datosTerritorio;
}

function fuenteModalidadesActual(){
    if(!filtros.mes.value) return datosSIDPOL;
    return anioSIDPOLMensual === filtros.anio.value ? datosSIDPOLMensual : [];
}

function obtenerDatosFiltrados(ignorar = "", fuente = null){
    const origen = fuente || fuenteDatosPrincipal();
    const ignorados = new Set(Array.isArray(ignorar) ? ignorar : [ignorar]);
    const anio = filtros.anio.value;
    const mes = filtros.mes.value;
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);
    const distrito = normalizar(filtros.distrito.value);
    const delito = normalizar(filtros.delito.value);

    return origen.filter((fila) => {
        if(!ignorados.has("anio") && anio && fila.ANIO !== anio) return false;
        if(!ignorados.has("mes") && mes && String(fila.MES || "") !== mes) return false;
        if(!ignorados.has("departamento") && departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(!ignorados.has("provincia") && provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(!ignorados.has("distrito") && distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        if(!ignorados.has("delito") && delito && normalizar(fila.MODALIDAD) !== delito) return false;
        return true;
    });
}

function opcionesUnicas(datos, campo){
    return [...new Set(
        datos
            .map((fila) => String(fila[campo] || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));
}

function llenarSelect(select, opciones, etiqueta, valorActual = ""){
    select.innerHTML = "";
    select.appendChild(new Option(etiqueta, ""));

    opciones.forEach((opcion) => {
        select.appendChild(new Option(opcion, opcion));
    });

    if(valorActual && opciones.some((opcion) => normalizar(opcion) === normalizar(valorActual))){
        const opcionReal = opciones.find((opcion) => normalizar(opcion) === normalizar(valorActual));
        select.value = opcionReal;
    }
}

function actualizarOpciones(){
    const anioActual = filtros.anio.value;
    const departamentoActual = filtros.departamento.value;
    const provinciaActual = filtros.provincia.value;
    const distritoActual = filtros.distrito.value;
    const delitoActual = filtros.delito.value;
    const mensualListo = !filtros.mes.value || (
        filtros.anio.value && anioSIDPOLMensual === filtros.anio.value
    );
    const datosParaDelitos = mensualListo
        ? obtenerDatosFiltrados("delito", fuenteModalidadesActual())
        : [];

    llenarSelect(
        filtros.anio,
        opcionesUnicas(obtenerDatosFiltrados(["anio", "delito"], datosTerritorio), "ANIO"),
        "Todos los años",
        anioActual
    );
    llenarSelect(filtros.departamento, opcionesUnicas(obtenerDatosFiltrados("departamento"), "DPTO_HECHO"), "Todos los departamentos", departamentoActual);

    if(filtros.departamento.value){
        llenarSelect(filtros.provincia, opcionesUnicas(obtenerDatosFiltrados("provincia"), "PROV_HECHO"), "Todas las provincias", provinciaActual);
    }else{
        llenarSelect(filtros.provincia, [], "Seleccione un departamento");
    }

    if(filtros.provincia.value){
        llenarSelect(filtros.distrito, opcionesUnicas(obtenerDatosFiltrados("distrito"), "DIST_HECHO"), "Todos los distritos", distritoActual);
    }else{
        llenarSelect(filtros.distrito, [], "Seleccione una provincia");
    }

    llenarSelect(
        filtros.delito,
        opcionesUnicas(datosParaDelitos, "MODALIDAD"),
        filtros.mes.value && !filtros.anio.value
            ? "Seleccione un año para modalidad"
            : errorSIDPOLMensual
                ? "Ejecute el actualizador de datos"
                : "Todos los delitos",
        delitoActual
    );

    filtros.provincia.disabled = !filtros.departamento.value;
    filtros.distrito.disabled = !filtros.provincia.value;
    filtros.delito.disabled = Boolean(filtros.mes.value) && !mensualListo;
}

function resumirPor(campo){
    return obtenerDatosFiltrados().reduce((resumen, fila) => {
        const llave = normalizar(fila[campo]);
        if(!llave) return resumen;
        resumen[llave] = (resumen[llave] || 0) + obtenerCasos(fila);
        return resumen;
    }, {});
}

function colorPorCasos(casos, valores){
    const positivos = valores.filter((valor) => valor > 0).sort((a, b) => a - b);
    if(!casos || positivos.length === 0) return "#e5edf4";

    const q1 = positivos[Math.floor(positivos.length * 0.20)] || positivos[0];
    const q2 = positivos[Math.floor(positivos.length * 0.40)] || q1;
    const q3 = positivos[Math.floor(positivos.length * 0.60)] || q2;
    const q4 = positivos[Math.floor(positivos.length * 0.80)] || q3;

    if(casos >= q4) return colores[4];
    if(casos >= q3) return colores[3];
    if(casos >= q2) return colores[2];
    if(casos >= q1) return colores[1];
    return colores[0];
}

function limpiarMapa(){
    if(capaActual){
        mapa.removeLayer(capaActual);
        capaActual = null;
    }
}

function estiloBase(casos, valores, colorLinea){
    return {
        color: colorLinea,
        weight: 1.8,
        fillColor: colorPorCasos(casos, valores),
        fillOpacity: casos > 0 ? 0.72 : 0.22
    };
}

function aplicarInteraccion(layer, estiloNormal){
    layer.on({
        mouseover: (event) => {
            event.target.setStyle({
                weight: 3.5,
                fillOpacity: 0.9
            });
            event.target.bringToFront();
        },
        mouseout: (event) => {
            event.target.setStyle(estiloNormal);
        }
    });
}

function enfocarBounds(bounds){
    if(bounds && bounds.isValid && bounds.isValid()){
        mapa.flyToBounds(bounds, {
            padding: [26, 26],
            maxZoom: 10
        });
    }
}

function renderDepartamentos(){
    limpiarMapa();
    const resumen = resumirPor("DPTO_HECHO");
    const valores = Object.values(resumen);

    capaActual = L.geoJSON(geoDepartamentos, {
        style: (feature) => {
            const casos = resumen[normalizar(feature.properties.NOMBDEP)] || 0;
            return estiloBase(casos, valores, "#d6a93a");
        },
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBDEP;
            const casos = resumen[normalizar(nombre)] || 0;
            const estiloNormal = estiloBase(casos, valores, "#d6a93a");

            layer.bindTooltip(`${nombre}<br>${formatear(casos)} casos`);
            aplicarInteraccion(layer, estiloNormal);

            layer.on("click", () => {
                filtros.departamento.value = buscarValorSelect(filtros.departamento, nombre);
                filtros.provincia.value = "";
                filtros.distrito.value = "";
                actualizarDashboard(false);
                renderProvincias(nombre, layer.getBounds());
            });
        }
    }).addTo(mapa);

    tituloResumen.textContent = "Resumen nacional";
    actualizarTextoResumen();
}

function renderProvincias(departamento, bounds){
    limpiarMapa();
    const departamentoNormalizado = normalizar(departamento);
    const resumen = resumirPor("PROV_HECHO");
    const valores = Object.values(resumen);
    const provincias = {
        type: "FeatureCollection",
        features: geoProvincias.features.filter((feature) => normalizar(feature.properties.FIRST_NOMB) === departamentoNormalizado)
    };

    capaActual = L.geoJSON(provincias, {
        style: (feature) => {
            const casos = resumen[normalizar(feature.properties.NOMBPROV)] || 0;
            return estiloBase(casos, valores, "#25c19f");
        },
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBPROV;
            const casos = resumen[normalizar(nombre)] || 0;
            const estiloNormal = estiloBase(casos, valores, "#25c19f");

            layer.bindTooltip(`${nombre}<br>${formatear(casos)} casos`);
            aplicarInteraccion(layer, estiloNormal);

            layer.on("click", () => {
                filtros.provincia.value = buscarValorSelect(filtros.provincia, nombre);
                filtros.distrito.value = "";
                actualizarDashboard(false);
                renderDistritos(departamento, nombre, layer.getBounds());
            });
        }
    }).addTo(mapa);

    if(bounds){
        enfocarBounds(bounds);
    }else if(capaActual.getLayers().length > 0){
        enfocarBounds(capaActual.getBounds());
    }

    tituloResumen.textContent = departamento;
    actualizarTextoResumen();
}

function renderDistritos(departamento, provincia, bounds){
    limpiarMapa();
    const departamentoNormalizado = normalizar(departamento);
    const provinciaNormalizada = normalizar(provincia);
    const resumen = resumirPor("DIST_HECHO");
    const valores = Object.values(resumen);
    const distritos = {
        type: "FeatureCollection",
        features: geoDistritos.features.filter((feature) => {
            return normalizar(feature.properties.NOMBDEP) === departamentoNormalizado &&
                normalizar(feature.properties.NOMBPROV) === provinciaNormalizada;
        })
    };
    let distritoSeleccionadoBounds = null;

    capaActual = L.geoJSON(distritos, {
        style: (feature) => {
            const casos = resumen[normalizar(feature.properties.NOMBDIST)] || 0;
            return estiloBase(casos, valores, "#e65f5c");
        },
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBDIST;
            const casos = resumen[normalizar(nombre)] || 0;
            const estiloNormal = estiloBase(casos, valores, "#e65f5c");

            layer.bindTooltip(`${nombre}<br>${formatear(casos)} casos`);
            aplicarInteraccion(layer, estiloNormal);

            if(filtros.distrito.value && normalizar(nombre) === normalizar(filtros.distrito.value)){
                distritoSeleccionadoBounds = layer.getBounds();
            }

            layer.on("click", () => {
                filtros.distrito.value = buscarValorSelect(filtros.distrito, nombre);
                actualizarDashboard(false);
                enfocarBounds(layer.getBounds());
            });
        }
    }).addTo(mapa);

    if(distritoSeleccionadoBounds){
        enfocarBounds(distritoSeleccionadoBounds);
    }else if(bounds){
        enfocarBounds(bounds);
    }else if(capaActual.getLayers().length > 0){
        enfocarBounds(capaActual.getBounds());
    }

    tituloResumen.textContent = provincia;
    actualizarTextoResumen();
}

function renderMapaDesdeFiltros(){
    if(filtros.departamento.value && filtros.provincia.value){
        renderDistritos(filtros.departamento.value, filtros.provincia.value);
        return;
    }

    if(filtros.departamento.value){
        renderProvincias(filtros.departamento.value);
        return;
    }

    renderDepartamentos();
}

function buscarValorSelect(select, valor){
    const buscado = normalizar(valor);
    const opciones = Array.from(select.options);
    const encontrada = opciones.find((opcion) => normalizar(opcion.value) === buscado || normalizar(opcion.textContent) === buscado);
    return encontrada ? encontrada.value : valor;
}

function actualizarIndicadores(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("delito", fuenteModalidadesActual());
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const extorsiones = totalPorCoincidencia(datosModalidades, "EXTORSION");
    const homicidios = totalPorCoincidencia(datosModalidades, "HOMICIDIO");
    const robos = totalPorCoincidencia(datosModalidades, "ROBO");

    indicadores.total.textContent = formatear(total);
    indicadores.extorsiones.textContent = formatear(extorsiones);
    indicadores.homicidios.textContent = formatear(homicidios);
    indicadores.robos.textContent = formatear(robos);
}

function renderResumenEjecutivo(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("delito", fuenteModalidadesActual());
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const campo = campoRankingTerritorial();
    const territorios = topAgrupado(datos, (fila) => fila[campo], 1000);
    const maximo = territorios[0]?.casos || 0;
    const filas = territorios.slice(0, 6).map((fila) => {
        const relacion = maximo ? fila.casos / maximo : 0;
        const participacion = total ? (fila.casos / total) * 100 : 0;
        const prioridad = relacion >= 0.65 ? "Alta" : relacion >= 0.35 ? "Media" : "Regular";
        const clase = prioridad === "Alta" ? "high" : prioridad === "Media" ? "medium" : "regular";
        return { ...fila, participacion, prioridad, clase };
    });
    const criticas = territorios.filter((fila) => maximo && fila.casos / maximo >= 0.65).length;
    const principal = territorios[0];
    const concentracion = principal && total ? (principal.casos / total) * 100 : 0;
    const modalidad = topAgrupado(datosModalidades, (fila) => fila.MODALIDAD, 1)[0];

    resumenEjecutivo.concentracion.textContent = `${concentracion.toFixed(1)}%`;
    resumenEjecutivo.territorio.textContent = principal ? principal.nombre : "Sin territorio";
    resumenEjecutivo.criticas.textContent = formatear(criticas);

    resumenEjecutivo.matriz.innerHTML = filas.length ? filas.map((fila) => `
        <tr>
            <td><strong>${fila.nombre}</strong></td>
            <td>${formatear(fila.casos)}</td>
            <td>${fila.participacion.toFixed(1)}%</td>
            <td><span class="risk-level ${fila.clase}">${fila.prioridad}</span></td>
        </tr>
    `).join("") : `<tr><td colspan="4">Sin datos para los filtros seleccionados</td></tr>`;

    const alcance = territorios.length;
    const periodo = filtros.mes.value
        ? `${meses[Number(filtros.mes.value) - 1]} ${filtros.anio.value || ""}`.trim()
        : filtros.anio.value || "periodo completo";
    const briefing = [
        {
            icono: "fa-location-crosshairs",
            titulo: principal ? `${principal.nombre} encabeza la carga territorial` : "Sin concentracion territorial",
            texto: principal ? `${formatear(principal.casos)} denuncias en ${periodo}.` : "Ajuste los filtros para obtener una lectura operativa."
        },
        {
            icono: "fa-chart-pie",
            titulo: modalidad ? "Modalidad predominante" : "Cobertura de modalidades",
            texto: modalidad ? `${modalidad.nombre}: ${formatear(modalidad.casos)} denuncias.` : "No hay modalidad disponible para la seleccion actual."
        },
        {
            icono: "fa-shield",
            titulo: `${formatear(criticas)} jurisdicciones en prioridad alta`,
            texto: `${formatear(alcance)} ${etiquetaRankingTerritorial()} evaluados con los filtros activos.`
        }
    ];

    resumenEjecutivo.actividad.innerHTML = briefing.map((item, index) => `
        <div class="briefing-item">
            <span class="briefing-index">0${index + 1}</span>
            <i class="fas ${item.icono}"></i>
            <div>
                <strong>${item.titulo}</strong>
                <p>${item.texto}</p>
            </div>
        </div>
    `).join("");
}

function totalPorCoincidencia(datos, termino){
    return datos.reduce((suma, fila) => {
        return normalizar(fila.MODALIDAD).includes(termino) ? suma + obtenerCasos(fila) : suma;
    }, 0);
}

function agrupar(datos, obtenerLlave){
    return datos.reduce((resumen, fila) => {
        const llave = obtenerLlave(fila);
        if(!llave) return resumen;
        resumen[llave] = (resumen[llave] || 0) + obtenerCasos(fila);
        return resumen;
    }, {});
}

function topAgrupado(datos, obtenerLlave, limite = 8){
    return Object.entries(agrupar(datos, obtenerLlave))
        .map(([nombre, casos]) => ({ nombre, casos }))
        .sort((a, b) => b.casos - a.casos)
        .slice(0, limite);
}

function campoRankingTerritorial(){
    if(filtros.provincia.value) return "DIST_HECHO";
    if(filtros.departamento.value) return "PROV_HECHO";
    return "DPTO_HECHO";
}

function etiquetaRankingTerritorial(){
    if(filtros.provincia.value) return "distritos";
    if(filtros.departamento.value) return "provincias";
    return "departamentos";
}

function renderEstadoVacio(contenedor, texto){
    contenedor.innerHTML = `<div class="empty-state">${texto}</div>`;
}

function renderBarras(contenedor, filas, clase, textoVacio){
    if(!filas.length){
        renderEstadoVacio(contenedor, textoVacio);
        return;
    }

    const maximo = Math.max(...filas.map((fila) => fila.casos), 1);
    contenedor.innerHTML = filas.map((fila) => {
        const ancho = Math.max((fila.casos / maximo) * 100, 3);
        return `
            <div class="${clase}-row">
                <div class="${clase}-meta">
                    <span title="${fila.nombre}">${fila.nombre}</span>
                    <strong>${formatear(fila.casos)}</strong>
                </div>
                <div class="${clase}-track">
                    <div class="${clase}-fill" style="width: ${ancho}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderTendencia(){
    const datosComparables = obtenerDatosFiltrados("anio");
    const aniosDisponibles = [...new Set(datosComparables.map((fila) => fila.ANIO).filter(Boolean))]
        .sort((a, b) => Number(a) - Number(b));
    const anioSeleccionado = filtros.anio.value;
    const aniosComparados = anioSeleccionado
        ? aniosDisponibles.filter((anio) => Number(anio) <= Number(anioSeleccionado)).slice(-4)
        : aniosDisponibles.slice(-4);

    if(!aniosComparados.length){
        tendenciaEtiqueta.textContent = "Sin datos";
        renderEstadoVacio(graficoTendencia, "Sin años disponibles para comparar");
        return;
    }

    const series = aniosComparados.map((anio, serieIndex) => {
        const mensual = Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            etiqueta: meses[index],
            casos: 0,
            disponible: false
        }));

        datosComparables.forEach((fila) => {
            const mes = Number(fila.MES);
            if(fila.ANIO === anio && mes >= 1 && mes <= 12){
                mensual[mes - 1].casos += obtenerCasos(fila);
                mensual[mes - 1].disponible = true;
            }
        });

        const ultimoMes = mensual.reduce(
            (ultimo, fila) => fila.disponible ? fila.mes : ultimo,
            0
        );
        const mensualVisible = ultimoMes ? mensual.slice(0, ultimoMes) : [];

        return {
            anio,
            color: coloresComparativo[serieIndex % coloresComparativo.length],
            mensual: mensualVisible,
            ultimoMes,
            total: mensualVisible.reduce((suma, fila) => suma + fila.casos, 0)
        };
    });

    const maximo = Math.max(...series.flatMap((serie) => serie.mensual.map((fila) => fila.casos)), 0);
    const anioBase = aniosComparados[aniosComparados.length - 1];
    const serieBase = series.find((serie) => serie.anio === anioBase);
    const serieAnterior = series[series.length - 2];
    const totalAnteriorComparable = serieBase && serieAnterior
        ? serieAnterior.mensual
            .filter((fila) => fila.mes <= serieBase.ultimoMes)
            .reduce((suma, fila) => suma + fila.casos, 0)
        : 0;
    const variacion = serieBase && serieAnterior && totalAnteriorComparable > 0
        ? ((serieBase.total - totalAnteriorComparable) / totalAnteriorComparable) * 100
        : null;

    tendenciaEtiqueta.textContent = variacion === null
        ? `${aniosComparados.length} años`
        : `${anioBase}: ${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}% vs ${serieAnterior.anio} a ${meses[serieBase.ultimoMes - 1]}`;

    if(maximo === 0){
        renderEstadoVacio(graficoTendencia, "Sin datos para el comparativo");
        return;
    }

    const width = 860;
    const height = 320;
    const padding = { top: 28, right: 26, bottom: 54, left: 62 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const yMid = padding.top + innerHeight / 2;

    const seriesSvg = series.map((serie, serieIndex) => {
        const points = serie.mensual.map((fila, index) => {
            const x = padding.left + (innerWidth / 11) * index;
            const y = padding.top + innerHeight - ((fila.casos / maximo) * innerHeight);
            return { ...fila, x, y };
        });
        const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
        const dash = serieIndex === series.length - 1 ? "" : "stroke-dasharray=\"7 7\"";
        const opacity = serieIndex === series.length - 1 ? 1 : 0.72;

        return `
            <path d="${path}" fill="none" stroke="${serie.color}" stroke-width="${serieIndex === series.length - 1 ? 4 : 2.8}" ${dash} opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"></path>
            ${points.map((point) => `
                <circle cx="${point.x}" cy="${point.y}" r="${serieIndex === series.length - 1 ? 5 : 3.5}" fill="${serie.color}" opacity="${opacity}">
                    <title>${serie.anio} - ${point.etiqueta}: ${formatear(point.casos)} casos</title>
                </circle>
            `).join("")}
        `;
    }).join("");

    graficoTendencia.innerHTML = `
        <div class="chart-legend">
            ${series.map((serie, index) => `
                <span class="${index === series.length - 1 ? "active" : ""}">
                    <i style="background:${serie.color}"></i>
                    ${serie.anio}: ${formatear(serie.total)}
                </span>
            `).join("")}
        </div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Comparativo mensual por año">
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + innerHeight}" stroke="#33404d"></line>
            <line x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight}" stroke="#33404d"></line>
            <line x1="${padding.left}" y1="${yMid}" x2="${padding.left + innerWidth}" y2="${yMid}" stroke="#33404d" stroke-dasharray="5 7" opacity="0.7"></line>
            ${seriesSvg}
            ${meses.map((mes, index) => index % 2 === 0 ? `
                <text class="chart-axis" x="${padding.left + (innerWidth / 11) * index}" y="${height - 20}" text-anchor="middle" fill="#aab6c4">${mes}</text>
            ` : "").join("")}
            <text class="chart-axis" x="12" y="${padding.top + 4}" fill="#aab6c4">${formatear(maximo)}</text>
            <text class="chart-axis" x="20" y="${padding.top + innerHeight}" fill="#aab6c4">0</text>
        </svg>
    `;
}

function renderAlertas(datos, datosModalidades){
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const topModalidad = topAgrupado(datosModalidades, (fila) => fila.MODALIDAD, 1)[0];
    const topTerritorio = topAgrupado(datos, (fila) => fila[campoRankingTerritorial()], 1)[0];
    const topDistrito = topAgrupado(datos, (fila) => fila.DIST_HECHO, 1)[0];
    const filas = [];

    if(topTerritorio){
        const porcentaje = total ? ((topTerritorio.casos / total) * 100).toFixed(1) : 0;
        filas.push({
            nivel: Number(porcentaje) >= 20 ? "high" : "medium",
            icono: "fa-location-dot",
            titulo: "Concentración territorial",
            texto: `${topTerritorio.nombre} concentra ${porcentaje}% de los casos filtrados.`
        });
    }

    if(topModalidad){
        filas.push({
            nivel: "medium",
            icono: "fa-triangle-exclamation",
            titulo: "Modalidad predominante",
            texto: `${topModalidad.nombre} lidera con ${formatear(topModalidad.casos)} casos.`
        });
    }

    if(topDistrito && !filtros.distrito.value){
        filas.push({
            nivel: "normal",
            icono: "fa-crosshairs",
            titulo: "Punto de atención",
            texto: `${topDistrito.nombre} aparece como distrito con mayor carga operativa.`
        });
    }

    if(!filas.length){
        renderEstadoVacio(alertasEstrategicas, "Sin alertas para los filtros seleccionados");
        return;
    }

    alertasEstrategicas.innerHTML = filas.map((alerta) => `
        <div class="alert-item ${alerta.nivel}">
            <i class="fas ${alerta.icono}"></i>
            <div>
                <h3>${alerta.titulo}</h3>
                <p>${alerta.texto}</p>
            </div>
        </div>
    `).join("");
}

function renderTabla(){
    const datosTabla = obtenerDatosFiltrados("", fuenteModalidadesActual());
    const filas = topAgrupado(datosTabla, (fila) => {
        const territorio = [fila.DPTO_HECHO, fila.PROV_HECHO, fila.DIST_HECHO].filter(Boolean).join(" / ");
        return `${territorio}||${fila.MODALIDAD}||${fila.ANIO}`;
    }, 10).map((fila) => {
        const [territorio, modalidad, anio] = fila.nombre.split("||");
        return { territorio, modalidad, anio, casos: fila.casos };
    });

    tablaEtiqueta.textContent = `${filas.length} filas`;

    if(!filas.length){
        tablaResumen.innerHTML = `<tr><td colspan="4">Sin datos para los filtros seleccionados</td></tr>`;
        return;
    }

    tablaResumen.innerHTML = filas.map((fila) => `
        <tr>
            <td>${fila.territorio}</td>
            <td>${fila.modalidad}</td>
            <td>${fila.anio}</td>
            <td>${formatear(fila.casos)}</td>
        </tr>
    `).join("");
}

function actualizarAnalitica(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("delito", fuenteModalidadesActual());
    const modalidades = topAgrupado(datosModalidades, (fila) => fila.MODALIDAD, 8);
    const ranking = topAgrupado(datos, (fila) => fila[campoRankingTerritorial()], 8);
    const hotspots = topAgrupado(datos, (fila) => {
        return [fila.DPTO_HECHO, fila.PROV_HECHO, fila.DIST_HECHO].filter(Boolean).join(" / ");
    }, 6);

    renderTendencia(datos);
    renderBarras(graficoModalidades, modalidades, "bar", "Sin modalidades para mostrar");
    renderBarras(rankingTerritorial, ranking, "rank", `Sin ${etiquetaRankingTerritorial()} para mostrar`);
    renderBarras(zonasCriticas, hotspots, "hotspot", "Sin zonas críticas para mostrar");
    renderAlertas(datos, datosModalidades);
    renderTabla();
    renderResumenEjecutivo();
    if(analiticaTemporalCargada) renderAnaliticaTemporal();
}

function filtrarPeriodoTemporal(datos){
    const anio = filtros.anio.value;
    const mes = filtros.mes.value;
    return datos.filter((fila) => {
        if(anio && String(fila.ANIO || "") !== anio) return false;
        if(mes && String(fila.MES || "") !== mes) return false;
        return true;
    });
}

function agruparValor(datos, campo, campoValor){
    return Object.entries(datos.reduce((resumen, fila) => {
        const nombre = String(fila[campo] || "NO INDICA").trim() || "NO INDICA";
        resumen[nombre] = (resumen[nombre] || 0) + numero(fila[campoValor]);
        return resumen;
    }, {})).map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor);
}

function renderDonutTemporal(contenedor, filas, coloresDonut){
    const principales = filas.slice(0, 4);
    const total = principales.reduce((suma, fila) => suma + fila.valor, 0);
    if(!total){
        renderEstadoVacio(contenedor, "Sin datos para el periodo seleccionado");
        return;
    }

    let acumulado = 0;
    const segmentos = principales.map((fila, index) => {
        const porcentaje = (fila.valor / total) * 100;
        const segmento = `<circle cx="60" cy="60" r="45" pathLength="100" fill="none" stroke="${coloresDonut[index]}" stroke-width="16" stroke-dasharray="${porcentaje} ${100 - porcentaje}" stroke-dashoffset="${-acumulado}" transform="rotate(-90 60 60)"></circle>`;
        acumulado += porcentaje;
        return segmento;
    }).join("");

    contenedor.innerHTML = `
        <div class="donut-chart">
            <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="45" fill="none" stroke="#26333d" stroke-width="16"></circle>
                ${segmentos}
            </svg>
            <div><strong>${formatear(total)}</strong><span>personas</span></div>
        </div>
        <div class="donut-legend">
            ${principales.map((fila, index) => `
                <div><i style="background:${coloresDonut[index]}"></i><span title="${fila.nombre}">${fila.nombre}</span><strong>${((fila.valor / total) * 100).toFixed(1)}%</strong></div>
            `).join("")}
        </div>
    `;
}

function renderIncidenciaHoraria(){
    const datos = filtrarPeriodoTemporal(datosIncidenciaHoraria);
    const valores = Array.from({ length: 7 }, () => Array(24).fill(0));
    datos.forEach((fila) => {
        const dia = numero(fila.DIA_SEMANA);
        const hora = numero(fila.HORA);
        if(dia >= 0 && dia < 7 && hora >= 0 && hora < 24) valores[dia][hora] += obtenerCasos(fila);
    });
    const maximo = Math.max(...valores.flat(), 1);
    const dias = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    incidenciaHoraria.innerHTML = `
        <div class="hourly-grid">
            <span></span>${Array.from({length: 24}, (_, hora) => `<span class="hour-label">${hora % 2 === 0 ? String(hora).padStart(2, "0") : ""}</span>`).join("")}
            ${valores.map((horas, dia) => `
                <strong>${dias[dia]}</strong>
                ${horas.map((valor, hora) => {
                    const nivel = valor ? Math.max(1, Math.ceil((valor / maximo) * 5)) : 0;
                    return `<span class="hour-cell level-${nivel}" title="${dias[dia]} ${String(hora).padStart(2, "0")}:00 - ${formatear(valor)} denuncias"></span>`;
                }).join("")}
            `).join("")}
        </div>
        <div class="hourly-scale"><span>Baja incidencia</span><i></i><i></i><i></i><i></i><i></i><span>Alta incidencia</span></div>
    `;
}

function obtenerFilasDistritosTemporal(){
    const datos = obtenerDatosFiltrados();
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    return topAgrupado(datos, (fila) => fila.DIST_HECHO, 5).map((fila, index) => ({
        ...fila,
        participacion: total ? (fila.casos / total) * 100 : 0,
        prioridad: index < 2 ? "Alta" : index < 4 ? "Media" : "Regular"
    }));
}

function renderMatrizTemporal(territorios, total){
    const celdas = Array(9).fill(0);
    const maximo = territorios[0]?.casos || 1;
    territorios.forEach((fila) => {
        const relacion = fila.casos / maximo;
        const participacion = total ? fila.casos / total : 0;
        const probabilidad = relacion >= 0.67 ? 2 : relacion >= 0.34 ? 1 : 0;
        const impacto = participacion >= 0.2 ? 2 : participacion >= 0.08 ? 1 : 0;
        celdas[(2 - impacto) * 3 + probabilidad] += 1;
    });
    matrizTemporal.innerHTML = `
        <div class="matrix-y"><span>Alto</span><span>Medio</span><span>Bajo</span></div>
        <div class="matrix-cells">${celdas.map((valor, index) => `<div class="matrix-cell risk-${index}">${valor}</div>`).join("")}</div>
        <div class="matrix-x"><span>Baja</span><span>Media</span><span>Alta</span></div>
        <small>Probabilidad territorial</small>
    `;
}

function renderAnaliticaTemporal(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("delito", fuenteModalidadesActual());
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const territorios = topAgrupado(datos, (fila) => fila[campoRankingTerritorial()], 30);
    const personas = filtrarPeriodoTemporal(datosPersonasTemporal);

    graficoTemporalComparado.innerHTML = graficoTendencia.innerHTML;
    renderBarras(modalidadesTemporales, topAgrupado(datosModalidades, (fila) => fila.MODALIDAD, 6), "bar", "Sin modalidades para mostrar");
    renderIncidenciaHoraria();
    renderDonutTemporal(situacionPersona, agruparValor(personas, "SIT_PERSONA", "PERSONAS"), ["#4b91e8", "#43b581", "#f2c94c", "#8b98a3"]);
    renderDonutTemporal(distribucionSexo, agruparValor(personas, "SEXO", "PERSONAS"), ["#4b91e8", "#e45b5b", "#8b98a3", "#f2c94c"]);
    renderMatrizTemporal(territorios, total);

    const filas = obtenerFilasDistritosTemporal();
    tablaTemporal.innerHTML = filas.length ? filas.map((fila) => `
        <tr><td><strong>${fila.nombre}</strong></td><td>${formatear(fila.casos)}</td><td>${fila.participacion.toFixed(1)}%</td><td><span class="risk-level ${fila.prioridad === "Alta" ? "high" : fila.prioridad === "Media" ? "medium" : "regular"}">${fila.prioridad}</span></td></tr>
    `).join("") : `<tr><td colspan="4">Sin distritos para los filtros seleccionados</td></tr>`;

    timelineTemporal.innerHTML = filas.slice(0, 4).map((fila, index) => `
        <div class="timeline-row ${index < 2 ? "high" : index === 2 ? "medium" : "regular"}">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <strong>${fila.prioridad}</strong>
            <p>${fila.nombre} registra ${formatear(fila.casos)} denuncias y ${fila.participacion.toFixed(1)}% de participacion.</p>
        </div>
    `).join("") || `<div class="empty-state">Sin alertas para el periodo seleccionado</div>`;
}

function cargarAnaliticaTemporal(){
    if(analiticaTemporalCargada){
        renderAnaliticaTemporal();
        return;
    }
    Promise.all([
        cargarJson("data/api/personas.json"),
        cargarJson("data/api/incidencia_horaria.json")
    ]).then(([personas, horarios]) => {
        datosPersonasTemporal = personas;
        datosIncidenciaHoraria = horarios.map(normalizarFilaDatos);
        analiticaTemporalCargada = true;
        renderAnaliticaTemporal();
    }).catch((error) => {
        renderEstadoVacio(incidenciaHoraria, "No se pudieron cargar los patrones temporales");
        console.error(error);
    });
}

function actualizarTextoResumen(){
    const datos = obtenerDatosFiltrados();
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const territorio = [
        filtros.departamento.value,
        filtros.provincia.value,
        filtros.distrito.value
    ].filter(Boolean).join(" / ") || "Perú";
    const delito = filtros.delito.value || "todos los delitos";
    const anio = filtros.anio.value || "todos los años";
    const mes = filtros.mes.value ? meses[Number(filtros.mes.value) - 1] : "todos los meses";

    textoResumen.textContent = `${territorio}: ${formatear(total)} casos para ${delito}, ${mes}, ${anio}.`;
}

function actualizarDashboard(debeRenderMapa = true){
    actualizarOpciones();
    actualizarIndicadores();
    actualizarTextoResumen();
    actualizarAnalitica();

    if(debeRenderMapa){
        renderMapaDesdeFiltros();
    }
}

function cargarCsv(ruta){
    return new Promise((resolve, reject) => {
        Papa.parse(ruta, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (resultado) => resolve(resultado.data),
            error: reject
        });
    });
}

function cargarMetadata(){
    return fetch(`data/api/metadata.json?v=${Date.now()}`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .catch(() => null);
}

function cargarJson(ruta){
    return fetch(ruta, { cache: "no-store" }).then((response) => {
        if(!response.ok) throw new Error(`No se pudo cargar ${ruta}`);
        return response.json();
    });
}

function nombreArchivoMapaCalor(departamento){
    return normalizar(departamento).replace(/[^A-Z0-9 _-]/g, "_") || "SIN_DEPARTAMENTO";
}

function cargarDatosMapaCalorTerritorio(){
    const departamento = filtros.departamento.value;
    const clave = normalizar(departamento);
    const anio = filtros.anio.value;
    const claveFuente = `${clave}|${anio || "TODOS"}`;

    if(!clave){
        datosMapaCalor = datosMapaCalorNacional;
        departamentoMapaCalorActivo = "";
        return Promise.resolve(datosMapaCalor);
    }

    if(departamentoMapaCalorActivo === claveFuente && datosMapaCalor.length){
        return Promise.resolve(datosMapaCalor);
    }

    if(cacheMapaCalorDepartamentos.has(claveFuente)){
        datosMapaCalor = cacheMapaCalorDepartamentos.get(claveFuente);
        departamentoMapaCalorActivo = claveFuente;
        return Promise.resolve(datosMapaCalor);
    }

    heatEstado.textContent = `Cargando todas las coordenadas de ${departamento}...`;
    const archivo = encodeURIComponent(nombreArchivoMapaCalor(departamento));
    const ruta = anio
        ? `data/api/mapa_calor_departamento_anio/${archivo}/${encodeURIComponent(anio)}.json`
        : `data/api/mapa_calor_departamento/${archivo}.json`;
    return cargarJson(ruta)
        .then((datos) => {
            const normalizados = datos.map(normalizarFilaDatos);
            cacheMapaCalorDepartamentos.set(claveFuente, normalizados);
            datosMapaCalor = normalizados;
            departamentoMapaCalorActivo = claveFuente;
            return datosMapaCalor;
        })
        .catch((error) => {
            console.warn(`No se encontro el archivo completo para ${departamento}; se usara el resumen nacional.`, error);
            datosMapaCalor = datosMapaCalorNacional;
            departamentoMapaCalorActivo = "";
            return datosMapaCalor;
        });
}

function cargarModalidadesMensuales(anio){
    if(!anio) return Promise.resolve([]);
    if(anioSIDPOLMensual === anio && datosSIDPOLMensual.length){
        return Promise.resolve(datosSIDPOLMensual);
    }

    errorSIDPOLMensual = false;
    filtros.delito.disabled = true;
    filtros.delito.innerHTML = "";
    filtros.delito.appendChild(new Option("Cargando modalidades...", ""));

    return cargarJson(`data/api/modalidades_mensuales/${anio}.json`)
        .then((datos) => {
            datosSIDPOLMensual = datos.map(normalizarFilaDatos);
            anioSIDPOLMensual = anio;
            return datosSIDPOLMensual;
        })
        .catch((error) => {
            datosSIDPOLMensual = [];
            anioSIDPOLMensual = "";
            errorSIDPOLMensual = true;
            console.error(error);
            return [];
        });
}

function cargarDatosDashboard(){
    return Promise.all([
        cargarJson("data/api/territorio.json"),
        cargarJson("data/api/mapa_delito.json")
    ]).then(([territorio, modalidades]) => {
        if(!Array.isArray(territorio) || !territorio.length || !Array.isArray(modalidades) || !modalidades.length){
            throw new Error("JSON vacio");
        }

        return {
            territorio: territorio.map(normalizarFilaDatos).filter((fila) => fila.ANIO && fila.DPTO_HECHO),
            modalidades: modalidades.map(normalizarFilaDatos).filter((fila) => fila.ANIO && fila.DPTO_HECHO && fila.MODALIDAD),
            fuente: "json"
        };
    }).catch(() => {
        return cargarCsv("data/delitos_maestro.csv").then((datos) => {
            const modalidades = datos.map(normalizarFilaDatos).filter((fila) => fila.ANIO && fila.DPTO_HECHO && fila.MODALIDAD);
            return {
                territorio: modalidades,
                modalidades,
                fuente: "csv"
            };
        });
    });
}

function inicializarMapaCalor(){
    if(mapaCalor) return;

    mapaCalor = L.map("mapaCalor", {
        zoomControl: true,
        minZoom: 5
    }).setView(vistaPeru.centro, vistaPeru.zoom);

    mapaCalor.setMaxBounds(limitesPeru);

    mapaCalor.createPane("calorPane");
    mapaCalor.getPane("calorPane").style.zIndex = 400;
    mapaCalor.createPane("limitesCalorPane");
    mapaCalor.getPane("limitesCalorPane").style.zIndex = 450;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO"
    }).addTo(mapaCalor);
}

function limpiarLimitesMapaCalor(){
    if(capaLimitesMapaCalor){
        mapaCalor.removeLayer(capaLimitesMapaCalor);
        capaLimitesMapaCalor = null;
    }
}

function enfocarBoundsMapaCalor(bounds, maxZoom = 11){
    if(bounds && bounds.isValid && bounds.isValid()){
        mapaCalor.flyToBounds(bounds, {
            padding: [26, 26],
            maxZoom
        });
    }
}

function resumirMapaCalorPor(campo){
    return obtenerDatosMapaCalorFiltrados().reduce((resumen, fila) => {
        const llave = normalizar(fila[campo]);
        if(llave) resumen[llave] = (resumen[llave] || 0) + obtenerCasos(fila);
        return resumen;
    }, {});
}

function estiloLimiteMapaCalor(color, seleccionado = false){
    return {
        pane: "limitesCalorPane",
        color,
        weight: seleccionado ? 3 : 1.6,
        opacity: 0.95,
        fillColor: color,
        fillOpacity: seleccionado ? 0.09 : 0.025
    };
}

function aplicarInteraccionMapaCalor(layer, estiloNormal){
    layer.on({
        mouseover: (event) => {
            event.target.setStyle({ weight: 3.2, fillOpacity: 0.12 });
            event.target.bringToFront();
        },
        mouseout: (event) => event.target.setStyle(estiloNormal)
    });
}

function renderLimitesDepartamentosCalor(){
    limpiarLimitesMapaCalor();
    const resumen = resumirMapaCalorPor("DPTO_HECHO");

    capaLimitesMapaCalor = L.geoJSON(geoDepartamentos, {
        style: () => estiloLimiteMapaCalor("#f1c84b"),
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBDEP;
            const estiloNormal = estiloLimiteMapaCalor("#f1c84b");
            layer.bindTooltip(`${nombre}<br>${formatear(resumen[normalizar(nombre)] || 0)} denuncias`);
            aplicarInteraccionMapaCalor(layer, estiloNormal);
            layer.on("click", async () => {
                filtros.departamento.value = buscarValorSelect(filtros.departamento, nombre);
                filtros.provincia.value = "";
                filtros.distrito.value = "";
                actualizarOpciones();
                await cargarDatosMapaCalorTerritorio();
                renderMapaCalor();
                renderLimitesProvinciasCalor(nombre, layer.getBounds());
            });
        }
    }).addTo(mapaCalor);
}

function renderLimitesProvinciasCalor(departamento, bounds){
    limpiarLimitesMapaCalor();
    const departamentoNormalizado = normalizar(departamento);
    const resumen = resumirMapaCalorPor("PROV_HECHO");
    const provincias = {
        type: "FeatureCollection",
        features: geoProvincias.features.filter((feature) =>
            normalizar(feature.properties.FIRST_NOMB) === departamentoNormalizado
        )
    };

    capaLimitesMapaCalor = L.geoJSON(provincias, {
        style: () => estiloLimiteMapaCalor("#25c19f"),
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBPROV;
            const estiloNormal = estiloLimiteMapaCalor("#25c19f");
            layer.bindTooltip(`${nombre}<br>${formatear(resumen[normalizar(nombre)] || 0)} denuncias`);
            aplicarInteraccionMapaCalor(layer, estiloNormal);
            layer.on("click", () => {
                filtros.provincia.value = buscarValorSelect(filtros.provincia, nombre);
                filtros.distrito.value = "";
                actualizarOpciones();
                renderMapaCalor();
                renderLimitesDistritosCalor(departamento, nombre, layer.getBounds());
            });
        }
    }).addTo(mapaCalor);

    enfocarBoundsMapaCalor(bounds || capaLimitesMapaCalor.getBounds(), 9);
}

function renderLimitesDistritosCalor(departamento, provincia, bounds){
    limpiarLimitesMapaCalor();
    const departamentoNormalizado = normalizar(departamento);
    const provinciaNormalizada = normalizar(provincia);
    const resumen = resumirMapaCalorPor("DIST_HECHO");
    const distritoSeleccionado = normalizar(filtros.distrito.value);
    const distritos = {
        type: "FeatureCollection",
        features: geoDistritos.features.filter((feature) =>
            normalizar(feature.properties.NOMBDEP) === departamentoNormalizado &&
            normalizar(feature.properties.NOMBPROV) === provinciaNormalizada
        )
    };
    let boundsSeleccionado = null;

    capaLimitesMapaCalor = L.geoJSON(distritos, {
        style: (feature) => estiloLimiteMapaCalor(
            "#e65f5c",
            distritoSeleccionado === normalizar(feature.properties.NOMBDIST)
        ),
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.NOMBDIST;
            const seleccionado = distritoSeleccionado === normalizar(nombre);
            const estiloNormal = estiloLimiteMapaCalor("#e65f5c", seleccionado);
            layer.bindTooltip(`${nombre}<br>${formatear(resumen[normalizar(nombre)] || 0)} denuncias`);
            aplicarInteraccionMapaCalor(layer, estiloNormal);

            if(seleccionado) boundsSeleccionado = layer.getBounds();

            layer.on("click", () => {
                filtros.distrito.value = buscarValorSelect(filtros.distrito, nombre);
                renderMapaCalor();
                renderLimitesDistritosCalor(departamento, provincia, layer.getBounds());
            });
        }
    }).addTo(mapaCalor);

    enfocarBoundsMapaCalor(boundsSeleccionado || bounds || capaLimitesMapaCalor.getBounds(), 13);
}

function renderLimitesMapaCalorDesdeFiltros(){
    if(!mapaCalor || !mapaCalorCargado || !geoDepartamentos || !geoProvincias || !geoDistritos) return;

    if(filtros.departamento.value && filtros.provincia.value){
        renderLimitesDistritosCalor(filtros.departamento.value, filtros.provincia.value);
    }else if(filtros.departamento.value){
        renderLimitesProvinciasCalor(filtros.departamento.value);
    }else{
        renderLimitesDepartamentosCalor();
    }
}

function obtenerDatosMapaCalorFiltrados(){
    const anio = filtros.anio.value;
    const mes = filtros.mes.value;
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);
    const distrito = normalizar(filtros.distrito.value);
    const delito = normalizar(filtros.delito.value);

    return datosMapaCalor.filter((fila) => {
        if(anio && fila.ANIO !== anio) return false;
        if(mes && fila.MES !== mes) return false;
        if(departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        if(delito && normalizar(fila.MODALIDAD) !== delito) return false;
        const latitud = numero(fila.xx);
        const longitud = numero(fila.yy);
        return latitud >= -18.5 && latitud <= 0 &&
            longitud >= -81.5 && longitud <= -68.5 &&
            obtenerCasos(fila) > 0;
    });
}

function renderMapaCalor(){
    if(!mapaCalorCargado || !mapaCalor) return;

    const datos = obtenerDatosMapaCalorFiltrados();
    const totalDenuncias = obtenerDatosFiltrados().reduce(
        (suma, fila) => suma + obtenerCasos(fila),
        0
    );
    const maximo = Math.max(...datos.map((fila) => obtenerCasos(fila)), 0);
    const limiteVisual = 120000;
    const datosVisibles = datos.length > limiteVisual
        ? [...datos].sort((a, b) => obtenerCasos(b) - obtenerCasos(a)).slice(0, limiteVisual)
        : datos;

    if(capaMapaCalor){
        mapaCalor.removeLayer(capaMapaCalor);
        capaMapaCalor = null;
    }

    if(!datosVisibles.length || !window.L.heatLayer){
        heatEstado.textContent = !window.L.heatLayer
            ? "No se pudo cargar el plugin del mapa de calor."
            : "Sin puntos georreferenciados para los filtros seleccionados.";
        heatTotal.textContent = "0";
        heatPuntos.textContent = "0";
        heatMax.textContent = "0";
        return;
    }

    const escalaMaxima = Math.log1p(Math.max(maximo, 1));
    const puntos = datosVisibles.map((fila) => [
        numero(fila.xx),
        numero(fila.yy),
        Math.log1p(obtenerCasos(fila)) / escalaMaxima
    ]);

    const radio = datosVisibles.length < 100 ? 30 : datosVisibles.length < 1000 ? 24 : 18;
    const desenfoque = datosVisibles.length < 100 ? 22 : datosVisibles.length < 1000 ? 18 : 14;

    capaMapaCalor = L.heatLayer(puntos, {
        pane: "calorPane",
        radius: radio,
        blur: desenfoque,
        minOpacity: 0.3,
        maxZoom: 12,
        max: 1,
        gradient: {
            0.20: "#3d8bfd",
            0.45: "#25c19f",
            0.70: "#f1c84b",
            0.88: "#f59e4c",
            1.00: "#e65f5c"
        }
    }).addTo(mapaCalor);

    heatTotal.textContent = formatear(totalDenuncias);
    heatPuntos.textContent = formatear(datos.length);
    heatMax.textContent = formatear(maximo);
    heatEstado.textContent = datos.length > limiteVisual
        ? `Mostrando ${formatear(limiteVisual)} zonas de mayor concentracion.`
        : "Mapa de calor actualizado con los filtros activos.";

    setTimeout(() => mapaCalor.invalidateSize(), 80);
}

function cargarMapaCalor(){
    inicializarMapaCalor();

    if(mapaCalorCargado){
        renderMapaCalor();
        return;
    }

    heatEstado.textContent = "Cargando mapa de calor...";
    cargarJson("data/api/mapa_calor.json")
        .then((datos) => {
            datosMapaCalorNacional = datos.map(normalizarFilaDatos);
            datosMapaCalor = datosMapaCalorNacional;
            mapaCalorCargado = true;
            return cargarDatosMapaCalorTerritorio();
        })
        .then(() => {
            renderMapaCalor();
            renderLimitesMapaCalorDesdeFiltros();
        })
        .catch((error) => {
            heatEstado.textContent = location.protocol === "file:"
                ? "Abre el dashboard con scripts/abrir_dashboard.bat"
                : "No se pudo cargar data/api/mapa_calor.json";
            console.error(error);
        });
}

function inicializarMapaAlertas(){
    if(mapaAlertas) return;

    mapaAlertas = L.map("mapaAlertas", {
        zoomControl: true,
        minZoom: 5
    }).setView(vistaPeru.centro, vistaPeru.zoom);

    mapaAlertas.setMaxBounds(limitesPeru);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO"
    }).addTo(mapaAlertas);
}

function limpiarMapaAlertas(){
    if(capaMapaAlertas){
        mapaAlertas.removeLayer(capaMapaAlertas);
        capaMapaAlertas = null;
    }
    if(marcadoresMapaAlertas){
        mapaAlertas.removeLayer(marcadoresMapaAlertas);
        marcadoresMapaAlertas = null;
    }
}

function configuracionMapaAlertas(){
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);

    if(departamento && provincia){
        return {
            nivel: "distrito",
            campo: "DIST_HECHO",
            propiedad: "NOMBDIST",
            geojson: {
                type: "FeatureCollection",
                features: geoDistritos.features.filter((feature) =>
                    normalizar(feature.properties.NOMBDEP) === departamento &&
                    normalizar(feature.properties.NOMBPROV) === provincia
                )
            }
        };
    }

    if(departamento){
        return {
            nivel: "provincia",
            campo: "PROV_HECHO",
            propiedad: "NOMBPROV",
            geojson: {
                type: "FeatureCollection",
                features: geoProvincias.features.filter((feature) =>
                    normalizar(feature.properties.FIRST_NOMB) === departamento
                )
            }
        };
    }

    return {
        nivel: "departamento",
        campo: "DPTO_HECHO",
        propiedad: "NOMBDEP",
        geojson: geoDepartamentos
    };
}

function resumirAlertasPor(campo){
    return obtenerDatosFiltrados().reduce((resumen, fila) => {
        const llave = normalizar(fila[campo]);
        if(llave) resumen[llave] = (resumen[llave] || 0) + obtenerCasos(fila);
        return resumen;
    }, {});
}

function crearEscalaAlertas(resumen){
    const valores = Object.values(resumen).filter((valor) => valor > 0).sort((a, b) => a - b);
    if(!valores.length) return { media: Infinity, alta: Infinity };

    return {
        media: valores[Math.floor((valores.length - 1) * 0.35)],
        alta: valores[Math.floor((valores.length - 1) * 0.72)]
    };
}

function nivelAlerta(casos, escala){
    if(!casos) return "none";
    if(casos >= escala.alta) return "high";
    if(casos >= escala.media) return "medium";
    return "low";
}

function colorNivelAlerta(nivel){
    if(nivel === "high") return "#e65f5c";
    if(nivel === "medium") return "#f59e4c";
    if(nivel === "low") return "#f1c84b";
    return "#566574";
}

function seleccionarJurisdiccionAlerta(nivel, nombre, bounds){
    if(nivel === "departamento"){
        filtros.departamento.value = buscarValorSelect(filtros.departamento, nombre);
        filtros.provincia.value = "";
        filtros.distrito.value = "";
    }else if(nivel === "provincia"){
        filtros.provincia.value = buscarValorSelect(filtros.provincia, nombre);
        filtros.distrito.value = "";
    }else{
        filtros.distrito.value = buscarValorSelect(filtros.distrito, nombre);
    }

    actualizarDashboard(false);
    renderMapaAlertas(bounds);
}

function renderMapaAlertas(boundsEnfoque = null){
    if(!mapaAlertas || !geoDepartamentos || !geoProvincias || !geoDistritos) return;

    limpiarMapaAlertas();
    const configuracion = configuracionMapaAlertas();
    const resumen = resumirAlertasPor(configuracion.campo);
    const escala = crearEscalaAlertas(resumen);
    const filas = [];
    const capasPorNombre = {};
    const seleccionado = normalizar(
        configuracion.nivel === "distrito" ? filtros.distrito.value : ""
    );

    capaMapaAlertas = L.geoJSON(configuracion.geojson, {
        style: (feature) => {
            const nombre = normalizar(feature.properties[configuracion.propiedad]);
            const casos = resumen[nombre] || 0;
            const nivel = nivelAlerta(casos, escala);
            const activo = seleccionado && seleccionado === nombre;
            return {
                color: activo ? "#ffffff" : colorNivelAlerta(nivel),
                weight: activo ? 3 : 1.5,
                opacity: 0.95,
                fillColor: colorNivelAlerta(nivel),
                fillOpacity: casos ? (nivel === "high" ? 0.52 : 0.34) : 0.04
            };
        },
        onEachFeature: (feature, layer) => {
            const nombreOriginal = feature.properties[configuracion.propiedad];
            const nombre = normalizar(nombreOriginal);
            const casos = resumen[nombre] || 0;
            const nivel = nivelAlerta(casos, escala);
            capasPorNombre[nombre] = layer;

            if(casos) filas.push({ nombre: nombreOriginal, llave: nombre, casos, nivel });

            layer.bindTooltip(`${nombreOriginal}<br>${formatear(casos)} denuncias`);
            layer.on({
                mouseover: (event) => {
                    event.target.setStyle({ weight: 3, fillOpacity: casos ? 0.68 : 0.08 });
                    event.target.bringToFront();
                },
                mouseout: () => capaMapaAlertas.resetStyle(layer),
                click: () => seleccionarJurisdiccionAlerta(
                    configuracion.nivel,
                    nombreOriginal,
                    layer.getBounds()
                )
            });
        }
    }).addTo(mapaAlertas);

    filas.sort((a, b) => b.casos - a.casos);
    marcadoresMapaAlertas = L.layerGroup();
    filas.slice(0, 10).forEach((fila, indice) => {
        const layer = capasPorNombre[fila.llave];
        if(!layer) return;

        const icono = L.divIcon({
            className: "alert-marker-wrapper",
            html: `<span class="alert-marker ${fila.nivel}">${indice + 1}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
        const marcador = L.marker(layer.getBounds().getCenter(), { icon: icono });
        marcador.bindTooltip(`${fila.nombre}<br>${formatear(fila.casos)} denuncias`);
        marcador.on("click", () => seleccionarJurisdiccionAlerta(
            configuracion.nivel,
            fila.nombre,
            layer.getBounds()
        ));
        marcadoresMapaAlertas.addLayer(marcador);
    });
    marcadoresMapaAlertas.addTo(mapaAlertas);

    const conteos = filas.reduce((total, fila) => {
        total[fila.nivel] += 1;
        return total;
    }, { high: 0, medium: 0, low: 0 });
    const principal = filas[0];

    alertasAlta.textContent = formatear(conteos.high);
    alertasMedia.textContent = formatear(conteos.medium);
    alertasBaja.textContent = formatear(conteos.low);
    alertaEstado.textContent = filas.length
        ? `${formatear(filas.length)} jurisdicciones evaluadas con los filtros activos.`
        : "Sin jurisdicciones con denuncias para los filtros seleccionados.";
    alertaTerritorio.textContent = principal ? principal.nombre : "Sin datos";
    alertaTotal.textContent = principal ? `${formatear(principal.casos)} denuncias` : "0 denuncias";

    const distritoSeleccionado = configuracion.nivel === "distrito"
        ? capasPorNombre[normalizar(filtros.distrito.value)]
        : null;
    const bounds = boundsEnfoque || (distritoSeleccionado ? distritoSeleccionado.getBounds() : null);
    if(bounds){
        mapaAlertas.flyToBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    }else if(capaMapaAlertas.getLayers().length){
        mapaAlertas.fitBounds(capaMapaAlertas.getBounds(), { padding: [22, 22] });
    }

    setTimeout(() => mapaAlertas.invalidateSize(), 80);
}

function cargarMapaAlertas(){
    inicializarMapaAlertas();
    renderMapaAlertas();
}

function activarVista(vista){
    vistaActual = vista;
    menuItems.forEach((item) => item.classList.toggle("active", item.dataset.view === vista));

    const mostrarMapaDelito = ["inicio", "dashboard", "mapa-delito"].includes(vista);
    const mostrarAnalytics = ["inicio", "dashboard", "estadisticas", "reportes"].includes(vista);
    const mostrarDetalle = ["inicio", "dashboard", "estadisticas", "reportes"].includes(vista);
    const mostrarEjecutivo = ["inicio", "dashboard"].includes(vista);

    viewSections.forEach((section) => {
        const nombre = section.dataset.section;
        const visible =
            (nombre === "mapa-delito" && mostrarMapaDelito) ||
            (nombre === "mapa-calor" && vista === "mapa-calor") ||
            (nombre === "mapa-alertas" && vista === "alertas") ||
            (nombre === "analisis-temporal" && vista === "analisis-temporal") ||
            (nombre === "executive" && mostrarEjecutivo) ||
            (nombre === "analytics" && mostrarAnalytics) ||
            (nombre === "detalle" && mostrarDetalle);

        section.classList.toggle("is-hidden", !visible);
    });

    if(vista === "mapa-calor"){
        cargarMapaCalor();
    }else if(vista === "alertas"){
        cargarMapaAlertas();
    }else if(vista === "analisis-temporal"){
        cargarAnaliticaTemporal();
    }else{
        setTimeout(() => mapa.invalidateSize(), 80);
    }
}

function pintarEstadoDatos(totalRegistros, metadata){
    if(metadata && metadata.estado === "ok" && metadata.ultima_actualizacion){
        estadoDatos.textContent = `${formatear(totalRegistros)} registros cargados | Actualizado: ${metadata.ultima_actualizacion}`;
        return;
    }

    if(metadata && metadata.estado === "error"){
        estadoDatos.textContent = `${formatear(totalRegistros)} registros cargados | Ultima extraccion con error`;
        return;
    }

    estadoDatos.textContent = `${formatear(totalRegistros)} registros cargados`;
}

function reiniciarVista(){
    filtros.anio.value = "";
    filtros.mes.value = "";
    filtros.departamento.value = "";
    filtros.provincia.value = "";
    filtros.distrito.value = "";
    filtros.delito.value = "";
    actualizarDashboard(true);
    mapa.setView(vistaPeru.centro, vistaPeru.zoom);
}

Object.values(filtros).forEach((select) => {
    select.addEventListener("change", async () => {
        if((select === filtros.mes || select === filtros.anio) && filtros.mes.value && filtros.anio.value){
            await cargarModalidadesMensuales(filtros.anio.value);
        }
        if(select === filtros.departamento){
            filtros.provincia.value = "";
            filtros.distrito.value = "";
        }

        if(select === filtros.provincia){
            filtros.distrito.value = "";
        }

        actualizarDashboard(true);
        if(vistaActual === "mapa-calor"){
            await cargarDatosMapaCalorTerritorio();
            renderMapaCalor();
            renderLimitesMapaCalorDesdeFiltros();
        }else if(vistaActual === "alertas"){
            renderMapaAlertas();
        }else if(vistaActual === "analisis-temporal" && analiticaTemporalCargada){
            renderAnaliticaTemporal();
        }
    });
});

document.getElementById("btnPeru").addEventListener("click", reiniciarVista);
document.getElementById("btnLimpiarFiltros").addEventListener("click", reiniciarVista);
document.getElementById("btnHeatPeru").addEventListener("click", () => {
    if(mapaCalor){
        filtros.departamento.value = "";
        filtros.provincia.value = "";
        filtros.distrito.value = "";
        datosMapaCalor = datosMapaCalorNacional;
        departamentoMapaCalorActivo = "";
        actualizarOpciones();
        renderMapaCalor();
        renderLimitesDepartamentosCalor();
        mapaCalor.setView(vistaPeru.centro, vistaPeru.zoom);
    }
});
document.getElementById("btnAlertasPeru").addEventListener("click", () => {
    if(!mapaAlertas) return;
    filtros.departamento.value = "";
    filtros.provincia.value = "";
    filtros.distrito.value = "";
    actualizarDashboard(false);
    renderMapaAlertas();
    mapaAlertas.setView(vistaPeru.centro, vistaPeru.zoom);
});

document.getElementById("btnExportarTemporal").addEventListener("click", () => window.print());
document.getElementById("btnExportarExcelTemporal").addEventListener("click", () => {
    const encabezado = "Distrito;Denuncias;Participacion;Prioridad";
    const filas = obtenerFilasDistritosTemporal().map((fila) =>
        `${fila.nombre};${Math.round(fila.casos)};${fila.participacion.toFixed(1)}%;${fila.prioridad}`
    );
    const blob = new Blob(["\ufeff" + [encabezado, ...filas].join("\n")], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "analisis_temporal.csv";
    enlace.click();
    URL.revokeObjectURL(enlace.href);
});

menuItems.forEach((item) => {
    item.addEventListener("click", () => activarVista(item.dataset.view));
});

Promise.all([
    fetch("mapas/peru_departamental_simple.geojson").then((response) => response.json()),
    fetch("mapas/peru_provincial_simple.geojson").then((response) => response.json()),
    fetch("mapas/peru_distrital_simple.geojson").then((response) => response.json()),
    cargarDatosDashboard(),
    cargarMetadata()
]).then(([departamentos, provincias, distritos, datos, metadata]) => {
    geoDepartamentos = departamentos;
    geoProvincias = provincias;
    geoDistritos = distritos;
    datosTerritorio = datos.territorio;
    datosSIDPOL = datos.modalidades;

    statusDot.classList.add("ready");
    pintarEstadoDatos(datosTerritorio.length, metadata);
    actualizarDashboard(true);
    activarVista("inicio");
}).catch((error) => {
    estadoDatos.textContent = "No se pudieron cargar los datos";
    console.error(error);
});
