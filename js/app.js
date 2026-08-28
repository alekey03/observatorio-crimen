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

L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri"
}).addTo(mapa);

let datosSIDPOL = [];
let datosSIDPOLMensual = [];
let anioSIDPOLMensual = "";
let errorSIDPOLMensual = false;
let datosSIDPOLDiario = [];
let datosSIDPOLDiarioCargados = false;
let cargaDatosSIDPOLDiarioPromise = null;
let claveCargaDatosSIDPOLDiario = "";
let anioSIDPOLDiario = "";
const cacheDatosSIDPOLDiario = new Map();
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
let mapaPolicial = null;
let capaRegionesPoliciales = null;
let capaJurisdiccionesPoliciales = null;
let marcadoresComisariasPoliciales = null;
let geoRegionesPoliciales = null;
let geoJurisdiccionesPoliciales = null;
let geoComisariasPoliciales = null;
let datosPolicialesResumen = [];
let datosPolicialesModalidades = [];
let modalidadesPolicialesCargadas = false;
let cargaModalidadesPolicialesPromise = null;
let datosPolicialesMensuales = [];
let anioPolicialMensual = "";
let datosJurisdiccionResumen = [];
let datosJurisdiccionModalidades = [];
let modalidadesJurisdiccionCargadas = false;
let cargaModalidadesJurisdiccionPromise = null;
let datosJurisdiccionMensuales = [];
let anioJurisdiccionMensual = "";
let jurisdiccionCargada = false;
let cargaJurisdiccionPromise = null;
let modoPolicial = "registro";
let policialCargado = false;
let cargaPolicialPromise = null;
let datosPersonasTemporal = [];
let datosIncidenciaHoraria = [];
let analiticaTemporalCargada = false;
let datosProduccionPolicial = null;
let produccionPolicialCargada = false;
let comparadorBianualListo = false;
let ultimaComparacionBianual = null;
const cacheComparadorMensual = new Map();
let renderComparadorId = 0;

const filtros = {
    anio: document.getElementById("filtroAnio"),
    mes: document.getElementById("filtroMes"),
    dia: document.getElementById("filtroDia"),
    fechaDesde: document.getElementById("filtroFechaDesde"),
    fechaHasta: document.getElementById("filtroFechaHasta"),
    departamento: document.getElementById("filtroDepartamento"),
    provincia: document.getElementById("filtroProvincia"),
    distrito: document.getElementById("filtroDistrito"),
    delito: document.getElementById("filtroDelito")
};

const filtrosDashboard = {
    anio: document.getElementById("dashboardFiltroAnio"),
    mes: document.getElementById("dashboardFiltroMes"),
    dia: document.getElementById("dashboardFiltroDia"),
    fechaDesde: document.getElementById("dashboardFiltroFechaDesde"),
    fechaHasta: document.getElementById("dashboardFiltroFechaHasta"),
    departamento: document.getElementById("dashboardFiltroDepartamento"),
    provincia: document.getElementById("dashboardFiltroProvincia"),
    distrito: document.getElementById("dashboardFiltroDistrito"),
    delito: document.getElementById("dashboardFiltroDelito")
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
const filtroRegionPolicial = document.getElementById("filtroRegionPolicial");
const filtroComisariaPolicial = document.getElementById("filtroComisariaPolicial");
const policialNivel = document.getElementById("policialNivel");
const policialTitulo = document.getElementById("policialTitulo");
const policialEstado = document.getElementById("policialEstado");
const policialTotal = document.getElementById("policialTotal");
const policialComisarias = document.getElementById("policialComisarias");
const policialSinMapa = document.getElementById("policialSinMapa");
const policialPeriodo = document.getElementById("policialPeriodo");
const rankingComisarias = document.getElementById("rankingComisarias");
const policialEyebrow = document.getElementById("policialEyebrow");
const policialHeading = document.getElementById("policialHeading");
const policialTotalLabel = document.getElementById("policialTotalLabel");
const policialComisariasLabel = document.getElementById("policialComisariasLabel");
const policialSinMapaLabel = document.getElementById("policialSinMapaLabel");
const policialRankingLabel = document.getElementById("policialRankingLabel");
const graficoTemporalComparado = document.getElementById("graficoTemporalComparado");
const modalidadesTemporales = document.getElementById("modalidadesTemporales");
const incidenciaHoraria = document.getElementById("incidenciaHoraria");
const situacionPersona = document.getElementById("situacionPersona");
const distribucionSexo = document.getElementById("distribucionSexo");
const matrizTemporal = document.getElementById("matrizTemporal");
const tablaTemporal = document.getElementById("tablaTemporal");
const timelineTemporal = document.getElementById("timelineTemporal");
const comparadorAnioBase = document.getElementById("comparadorAnioBase");
const comparadorAnioComparado = document.getElementById("comparadorAnioComparado");
const comparadorMesInicio = document.getElementById("comparadorMesInicio");
const comparadorMesFin = document.getElementById("comparadorMesFin");
const comparadorDelito = document.getElementById("comparadorDelito");
const comparadorResumen = document.getElementById("comparadorResumen");
const comparadorGrafico = document.getElementById("comparadorGrafico");
const comparadorTablaHead = document.getElementById("comparadorTablaHead");
const comparadorTablaBody = document.getElementById("comparadorTablaBody");
const btnDescargarComparadorPdf = document.getElementById("btnDescargarComparadorPdf");
const btnDescargarComparadorCsv = document.getElementById("btnDescargarComparadorCsv");
const btnDescargarComparadorPng = document.getElementById("btnDescargarComparadorPng");
const filtroHorizontePredictivo = document.getElementById("filtroHorizontePredictivo");
const filtroEscenarioPredictivo = document.getElementById("filtroEscenarioPredictivo");
const graficoPredictivo = document.getElementById("graficoPredictivo");
const predictivoPeriodo = document.getElementById("predictivoPeriodo");
const predictivoRiesgo = document.getElementById("predictivoRiesgo");
const predictivoRiesgoTexto = document.getElementById("predictivoRiesgoTexto");
const predictivoVariacion = document.getElementById("predictivoVariacion");
const predictivoMesCritico = document.getElementById("predictivoMesCritico");
const predictivoConfianza = document.getElementById("predictivoConfianza");
const predictivoMatrizHoraria = document.getElementById("predictivoMatrizHoraria");
const predictivoRanking = document.getElementById("predictivoRanking");
const predictivoLectura = document.getElementById("predictivoLectura");
const produccionPeriodo = document.getElementById("produccionPeriodo");
const produccionReporte = document.getElementById("produccionReporte");
const produccionReporteTop = document.getElementById("produccionReporteTop");
const prodOperativos = document.getElementById("prodOperativos");
const prodOperativosVar = document.getElementById("prodOperativosVar");
const prodDinero = document.getElementById("prodDinero");
const prodDineroVar = document.getElementById("prodDineroVar");
const prodBandas = document.getElementById("prodBandas");
const prodBandasVar = document.getElementById("prodBandasVar");
const prodRequisitoriados = document.getElementById("prodRequisitoriados");
const prodRequisitoriadosVar = document.getElementById("prodRequisitoriadosVar");
const produccionBarras = document.getElementById("produccionBarras");
const produccionLectura = document.getElementById("produccionLectura");
const produccionAvances = document.getElementById("produccionAvances");
const produccionBrechas = document.getElementById("produccionBrechas");
const produccionTabla = document.getElementById("produccionTabla");
const produccionMosaico = document.getElementById("produccionMosaico");
const prodDashboardTexto = document.getElementById("prodDashboardTexto");
const prodDashboardPulso = document.getElementById("prodDashboardPulso");
const prodDashboardBarras = document.getElementById("prodDashboardBarras");
const prodDashboardBalance = document.getElementById("prodDashboardBalance");
const prodDashboardBrief = document.getElementById("prodDashboardBrief");
const prodChartColumns = document.getElementById("prodChartColumns");
const prodChartCategory = document.getElementById("prodChartCategory");
const prodChartLine = document.getElementById("prodChartLine");
const prodChartPct = document.getElementById("prodChartPct");
const prodChartDonut = document.getElementById("prodChartDonut");
const prodChartBrief = document.getElementById("prodChartBrief");
const prodTotalIndicadores = document.getElementById("prodTotalIndicadores");
const prodIndicadoresMejoran = document.getElementById("prodIndicadoresMejoran");
const prodIndicadoresDisminuyen = document.getElementById("prodIndicadoresDisminuyen");
const prodPctMejoran = document.getElementById("prodPctMejoran");
const prodSemaforo = document.getElementById("prodSemaforo");
const prodSemaforoDetalle = document.getElementById("prodSemaforoDetalle");
const dashboardEstrategico = {
    contexto: document.getElementById("dashboardFiltroContexto"),
    total: document.getElementById("dashboardTotal"),
    totalDetalle: document.getElementById("dashboardTotalDetalle"),
    extorsion: document.getElementById("dashboardExtorsion"),
    homicidio: document.getElementById("dashboardHomicidio"),
    robos: document.getElementById("dashboardRobos"),
    variacion: document.getElementById("dashboardVariacion"),
    concentracion: document.getElementById("dashboardConcentracion"),
    concentracionTexto: document.getElementById("dashboardConcentracionTexto"),
    periodoPulso: document.getElementById("dashboardPeriodoPulso"),
    pulso: document.getElementById("dashboardPulso"),
    lectura: document.getElementById("dashboardLectura"),
    modalidades: document.getElementById("dashboardTopModalidades"),
    matriz: document.getElementById("dashboardMatriz"),
    sparks: document.getElementById("dashboardSparks"),
    territorios: document.getElementById("dashboardTerritorios")
};
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const menuItems = document.querySelectorAll(".menu li[data-view]");
const viewSections = document.querySelectorAll(".view-section");
const sidpolContextSections = document.querySelectorAll(".sidpol-context");
const sidpolSummaryCards = document.querySelectorAll(".sidpol-summary-cards");

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

const delitosPrioritarios = [
    {
        etiqueta: "EXTORSION",
        modalidades: ["EXTORSION", "EXTORSION AGRAVADA"]
    },
    {
        etiqueta: "SECUESTRO",
        modalidades: ["SECUESTRO", "SECUESTRO AGRAVADO"]
    },
    {
        etiqueta: "ROBO",
        modalidades: ["ROBO", "ROBO AGRAVADO"]
    },
    {
        etiqueta: "HURTO",
        modalidades: ["HURTO", "HURTO AGRAVADO"]
    },
    {
        etiqueta: "ASALTO Y ROBO DE VEHICULOS",
        modalidades: ["ASALTO Y ROBO DE VEHICULOS"]
    }
];

function grupoDelitoPrioritario(valor){
    const valorNormalizado = normalizar(valor);
    return delitosPrioritarios.find((grupo) => normalizar(grupo.etiqueta) === valorNormalizado);
}

function modalidadEnGrupoPrioritario(modalidad){
    const modalidadNormalizada = normalizar(modalidad);
    return delitosPrioritarios.some((grupo) =>
        grupo.modalidades.some((item) => normalizar(item) === modalidadNormalizada)
    );
}

function modalidadCoincideDelito(modalidad, delitoSeleccionado){
    if(!delitoSeleccionado) return true;
    const grupo = grupoDelitoPrioritario(delitoSeleccionado);
    const modalidadNormalizada = normalizar(modalidad);
    if(grupo){
        return grupo.modalidades.some((item) => normalizar(item) === modalidadNormalizada);
    }
    return modalidadNormalizada === normalizar(delitoSeleccionado);
}

function valorDelitoActualizado(valorActual){
    const grupo = delitosPrioritarios.find((item) =>
        normalizar(item.etiqueta) === normalizar(valorActual) ||
        item.modalidades.some((modalidad) => normalizar(modalidad) === normalizar(valorActual))
    );
    return grupo ? grupo.etiqueta : valorActual;
}

function ajustarElementosTrasSidebar(){
    setTimeout(() => {
        mapa.invalidateSize();
        if(mapaCalor) mapaCalor.invalidateSize();
        if(mapaAlertas) mapaAlertas.invalidateSize();
        if(mapaPolicial) mapaPolicial.invalidateSize();
        if(vistaActual === "analisis-predictivo") renderAnalisisPredictivo();
        if(vistaActual === "analisis-temporal") cargarAnaliticaTemporal();
        if(vistaActual === "produccion-policial") renderProduccionPolicial();
    }, 240);
}

function aplicarEstadoSidebar(colapsado){
    document.body.classList.toggle("sidebar-collapsed", colapsado);
    if(btnToggleSidebar){
        btnToggleSidebar.setAttribute("aria-pressed", String(colapsado));
        btnToggleSidebar.setAttribute("title", colapsado ? "Mostrar menu lateral" : "Ocultar menu lateral");
        btnToggleSidebar.setAttribute("aria-label", colapsado ? "Mostrar menu lateral" : "Ocultar menu lateral");
    }
    localStorage.setItem("sidebarColapsado", colapsado ? "1" : "0");
    ajustarElementosTrasSidebar();
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
        DIA: String(fila.DIA || "").trim(),
        DPTO_HECHO: String(fila.DPTO_HECHO || "").trim(),
        PROV_HECHO: String(fila.PROV_HECHO || "").trim(),
        DIST_HECHO: String(fila.DIST_HECHO || "").trim(),
        MODALIDAD: String(fila.MODALIDAD || "").trim(),
        CASOS: numero(fila.CASOS)
    };
}

function fechasActivas(){
    return Boolean(filtros.fechaDesde?.value || filtros.fechaHasta?.value);
}

function fuenteDatosPrincipal(){
    if(fechasActivas() || filtros.dia.value) return datosSIDPOLDiario;
    return filtros.delito.value ? fuenteModalidadesFiltrable() : datosTerritorio;
}

function fuenteModalidadesActual(){
    if(!filtros.mes.value) return datosSIDPOL;
    return anioSIDPOLMensual === filtros.anio.value ? datosSIDPOLMensual : [];
}

function fuenteModalidadesFiltrable(){
    return fechasActivas() || filtros.dia.value ? datosSIDPOLDiario : fuenteModalidadesActual();
}

function fechaNumero(valor){
    const partes = String(valor || "").split("-").map(Number);
    if(partes.length !== 3 || partes.some((parte) => !parte)) return 0;
    return partes[0] * 10000 + partes[1] * 100 + partes[2];
}

function fechaNumeroFila(fila){
    const anio = Number(fila.ANIO) || 0;
    const mes = Number(fila.MES) || 0;
    const dia = Number(fila.DIA) || 0;
    if(!anio || !mes || !dia) return 0;
    return anio * 10000 + mes * 100 + dia;
}

function obtenerDatosFiltrados(ignorar = "", fuente = null){
    const origen = fuente || fuenteDatosPrincipal();
    const ignorados = new Set(Array.isArray(ignorar) ? ignorar : [ignorar]);
    const anio = filtros.anio.value;
    const mes = filtros.mes.value;
    const diaHasta = Number(filtros.dia.value) || 0;
    const fechaDesde = fechaNumero(filtros.fechaDesde?.value);
    const fechaHasta = fechaNumero(filtros.fechaHasta?.value);
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);
    const distrito = normalizar(filtros.distrito.value);
    const delito = filtros.delito.value;

    return origen.filter((fila) => {
        if(!ignorados.has("anio") && anio && fila.ANIO !== anio) return false;
        if(!ignorados.has("mes") && mes && String(fila.MES || "") !== mes) return false;
        if(!ignorados.has("fecha") && (fechaDesde || fechaHasta)){
            const fechaFila = fechaNumeroFila(fila);
            if(!fechaFila) return false;
            if(fechaDesde && fechaFila < fechaDesde) return false;
            if(fechaHasta && fechaFila > fechaHasta) return false;
        }
        if(!ignorados.has("dia") && diaHasta){
            const diaFila = Number(fila.DIA) || 0;
            if(!diaFila) return false;
            if(diaFila > diaHasta) return false;
        }
        if(!ignorados.has("departamento") && departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(!ignorados.has("provincia") && provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(!ignorados.has("distrito") && distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        if(!ignorados.has("delito") && delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
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

function llenarSelectMeses(select, opciones, valorActual = ""){
    if(!select) return;
    const mesesDisponibles = opciones
        .map((opcion) => Number(opcion))
        .filter((opcion) => opcion >= 1 && opcion <= 12)
        .sort((a, b) => a - b);

    select.innerHTML = "";
    select.appendChild(new Option("Todos los meses", ""));
    mesesDisponibles.forEach((mes) => {
        select.appendChild(new Option(meses[mes - 1], String(mes)));
    });

    if(valorActual && mesesDisponibles.includes(Number(valorActual))){
        select.value = String(Number(valorActual));
    }
}

function llenarSelectDelitos(select, opciones, etiqueta, valorActual = ""){
    const valorNormalizado = normalizar(valorDelitoActualizado(valorActual));
    const opcionesOtros = opciones.filter((opcion) => !modalidadEnGrupoPrioritario(opcion));

    select.innerHTML = "";
    select.appendChild(new Option(etiqueta, ""));

    const grupoPrioritarios = document.createElement("optgroup");
    grupoPrioritarios.label = "Delitos prioritarios";
    delitosPrioritarios.forEach((grupo) => {
        grupoPrioritarios.appendChild(new Option(grupo.etiqueta, grupo.etiqueta));
    });
    select.appendChild(grupoPrioritarios);

    if(opcionesOtros.length){
        const grupoOtros = document.createElement("optgroup");
        grupoOtros.label = "Otros delitos";
        opcionesOtros.forEach((opcion) => {
            grupoOtros.appendChild(new Option(opcion, opcion));
        });
        select.appendChild(grupoOtros);
    }

    const opcionSeleccionada = [...select.options].find((opcion) => normalizar(opcion.value) === valorNormalizado);
    if(opcionSeleccionada) select.value = opcionSeleccionada.value;
}

function llenarSelectDias(select, valorActual = ""){
    if(!select) return;
    select.innerHTML = "";
    select.appendChild(new Option("Todos los días", ""));
    Array.from({ length: 31 }, (_, index) => String(index + 1)).forEach((dia) => {
        select.appendChild(new Option(dia, dia));
    });
    if(valorActual && Number(valorActual) >= 1 && Number(valorActual) <= 31){
        select.value = String(Number(valorActual));
    }
}

function sincronizarFiltrosDashboard(){
    Object.entries(filtrosDashboard).forEach(([clave, selectDashboard]) => {
        const selectPrincipal = filtros[clave];
        if(!selectDashboard || !selectPrincipal) return;
        if(selectDashboard.tagName === "SELECT"){
            selectDashboard.innerHTML = selectPrincipal.innerHTML;
        }
        selectDashboard.value = selectPrincipal.value;
        selectDashboard.disabled = selectPrincipal.disabled;
    });
}

function actualizarOpciones(){
    const anioActual = filtros.anio.value;
    const mesActual = filtros.mes.value;
    const diaActual = filtros.dia.value;
    const departamentoActual = filtros.departamento.value;
    const provinciaActual = filtros.provincia.value;
    const distritoActual = filtros.distrito.value;
    const delitoActual = filtros.delito.value;
    const fuenteDiariaActiva = fechasActivas() || Boolean(filtros.dia.value);
    const fuenteDiariaLista = !fuenteDiariaActiva || datosSIDPOLDiarioCargados;
    const mensualListo = fuenteDiariaActiva || !filtros.mes.value || (
        filtros.anio.value && anioSIDPOLMensual === filtros.anio.value
    );
    const fuenteParaDelitos = fuenteDiariaActiva ? datosSIDPOLDiario : fuenteModalidadesFiltrable();
    const datosParaDelitos = mensualListo && fuenteDiariaLista
        ? obtenerDatosFiltrados("delito", fuenteParaDelitos)
        : [];
    const fuenteOpcionesTemporales = fuenteDiariaActiva && datosSIDPOLDiarioCargados
        ? datosSIDPOLDiario
        : datosTerritorio;

    llenarSelect(
        filtros.anio,
        opcionesUnicas(obtenerDatosFiltrados(["anio", "mes", "dia", "fecha", "delito"], fuenteOpcionesTemporales), "ANIO"),
        "Todos los años",
        anioActual
    );
    llenarSelectMeses(
        filtros.mes,
        opcionesUnicas(obtenerDatosFiltrados(["mes", "dia", "fecha", "delito"], fuenteOpcionesTemporales), "MES"),
        mesActual
    );
    llenarSelectDias(filtros.dia, diaActual);
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

    llenarSelectDelitos(
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
    filtros.delito.disabled = (Boolean(filtros.mes.value) && !mensualListo) || !fuenteDiariaLista;
    sincronizarFiltrosDashboard();
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
    const datosModalidades = obtenerDatosFiltrados("", fuenteModalidadesFiltrable());
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
    const datosModalidades = obtenerDatosFiltrados("", fuenteModalidadesFiltrable());
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
    const periodo = [
        filtros.fechaDesde?.value ? `desde ${filtros.fechaDesde.value}` : "",
        filtros.fechaHasta?.value ? `hasta ${filtros.fechaHasta.value}` : ""
    ].filter(Boolean).join(" ") || "periodo completo";
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
    const datosTabla = obtenerDatosFiltrados("", fuenteModalidadesFiltrable());
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

function contextoDashboard(){
    const periodo = [
        filtros.fechaDesde?.value ? `Desde ${filtros.fechaDesde.value}` : "",
        filtros.fechaHasta?.value ? `Hasta ${filtros.fechaHasta.value}` : ""
    ].filter(Boolean).join(" | ") || "Periodo completo";
    const partes = [
        periodo,
        filtros.departamento.value || "Nacional",
        filtros.provincia.value,
        filtros.distrito.value,
        filtros.delito.value || "Todos los delitos"
    ].filter(Boolean);
    return partes.join(" | ");
}

function serieMensualDashboard(datos){
    const agrupado = new Map();
    datos.forEach((fila) => {
        const anio = Number(fila.ANIO);
        const mes = Number(fila.MES);
        if(!anio || !mes) return;
        const clave = `${anio}-${String(mes).padStart(2, "0")}`;
        agrupado.set(clave, (agrupado.get(clave) || 0) + obtenerCasos(fila));
    });

    return [...agrupado.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([clave, casos]) => {
            const [anio, mesTexto] = clave.split("-");
            const mes = Number(mesTexto);
            return {
                clave,
                anio,
                mes,
                etiqueta: `${meses[mes - 1]} ${String(anio).slice(-2)}`,
                casos
            };
        });
}

function tieneSerieMensualDashboard(datos){
    return datos.some((fila) => Number(fila.ANIO) && Number(fila.MES) && obtenerCasos(fila));
}

function datosSerieDashboard(){
    const candidatas = [
        datosSIDPOLMensual.length && (!filtros.anio.value || anioSIDPOLMensual === filtros.anio.value) ? datosSIDPOLMensual : [],
        datosSIDPOL,
        datosTerritorio
    ];

    for(const fuente of candidatas){
        if(!fuente.length) continue;
        const serie = obtenerDatosFiltrados("mes", fuente);
        if(tieneSerieMensualDashboard(serie)) return serie;
    }

    return [];
}

function renderPulsoDashboard(serie){
    if(!dashboardEstrategico.pulso) return;
    const visible = serie.slice(-10);
    if(!visible.length){
        renderEstadoVacio(dashboardEstrategico.pulso, "Sin serie mensual para los filtros seleccionados");
        return;
    }

    const maximo = Math.max(...visible.map((fila) => fila.casos), 1);
    const width = 900;
    const height = 285;
    const padding = { top: 38, right: 30, bottom: 50, left: 62 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const promedio = visible.reduce((suma, fila) => suma + fila.casos, 0) / visible.length;
    const yPromedio = padding.top + innerHeight - ((promedio / maximo) * innerHeight);
    const puntos = visible.map((fila, index) => {
        const divisor = Math.max(visible.length - 1, 1);
        return {
            ...fila,
            x: padding.left + (innerWidth / divisor) * index,
            y: padding.top + innerHeight - ((fila.casos / maximo) * innerHeight)
        };
    });
    const path = puntos.map((punto, index) => `${index ? "L" : "M"} ${punto.x} ${punto.y}`).join(" ");
    const area = `${path} L ${puntos[puntos.length - 1].x} ${padding.top + innerHeight} L ${puntos[0].x} ${padding.top + innerHeight} Z`;

    dashboardEstrategico.periodoPulso.textContent = `${visible[0].etiqueta} - ${visible[visible.length - 1].etiqueta}`;
    dashboardEstrategico.pulso.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Pulso mensual del delito">
            <defs>
                <linearGradient id="dashboardPulseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#25c19f" stop-opacity=".34"></stop>
                    <stop offset="100%" stop-color="#25c19f" stop-opacity="0"></stop>
                </linearGradient>
            </defs>
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + innerHeight}" stroke="#3f5368" opacity=".9"></line>
            <line x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight}" stroke="#3f5368" opacity=".9"></line>
            <line x1="${padding.left}" y1="${yPromedio}" x2="${padding.left + innerWidth}" y2="${yPromedio}" stroke="#f1c84b" stroke-dasharray="6 7" opacity=".75"></line>
            <path d="${area}" fill="url(#dashboardPulseGradient)"></path>
            <path d="${path}" fill="none" stroke="#25c19f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"></path>
            ${puntos.map((punto, index) => `
                <g>
                    <circle cx="${punto.x}" cy="${punto.y}" r="${index === puntos.length - 1 ? 7 : 5}" fill="${index === puntos.length - 1 ? "#f1c84b" : "#25c19f"}" stroke="#071018" stroke-width="2"></circle>
                    <text x="${punto.x}" y="${punto.y - 12}" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="800">${formatear(punto.casos)}</text>
                    <text x="${punto.x}" y="${height - 16}" text-anchor="middle" fill="#dff4ff" font-size="13" font-weight="800">${punto.etiqueta}</text>
                </g>
            `).join("")}
            <text x="12" y="${padding.top + 5}" fill="#dff4ff" font-size="13" font-weight="800">${formatear(maximo)}</text>
            <text x="18" y="${padding.top + innerHeight}" fill="#dff4ff" font-size="13" font-weight="800">0</text>
        </svg>
    `;
}

function renderMatrizDashboard(datos, modalidades, territorios){
    if(!dashboardEstrategico.matriz) return;
    const topModalidades = modalidades.slice(0, 5);
    const topTerritorios = territorios.slice(0, 5);
    if(!topModalidades.length || !topTerritorios.length){
        renderEstadoVacio(dashboardEstrategico.matriz, "Sin datos para construir la matriz");
        return;
    }

    const maximo = Math.max(...topModalidades.flatMap((modalidad) => {
        return topTerritorios.map((territorio) => datos.reduce((suma, fila) => {
            const mismoDelito = fila.MODALIDAD === modalidad.nombre;
            const mismoTerritorio = fila[campoRankingTerritorial()] === territorio.nombre;
            return mismoDelito && mismoTerritorio ? suma + obtenerCasos(fila) : suma;
        }, 0));
    }), 1);

    dashboardEstrategico.matriz.innerHTML = `
        <div class="matrix-head"></div>
        ${topTerritorios.map((territorio) => `<div class="matrix-head">${territorio.nombre}</div>`).join("")}
        ${topModalidades.map((modalidad) => `
            <div class="matrix-label">${modalidad.nombre}</div>
            ${topTerritorios.map((territorio) => {
                const valor = datos.reduce((suma, fila) => {
                    const mismoDelito = fila.MODALIDAD === modalidad.nombre;
                    const mismoTerritorio = fila[campoRankingTerritorial()] === territorio.nombre;
                    return mismoDelito && mismoTerritorio ? suma + obtenerCasos(fila) : suma;
                }, 0);
                const relacion = valor / maximo;
                const clase = relacion >= .66 ? "critical" : relacion >= .33 ? "high" : valor ? "medium" : "low";
                return `<div class="matrix-cell ${clase}"><strong>${formatear(valor)}</strong></div>`;
            }).join("")}
        `).join("")}
    `;
}

function renderSparksDashboard(datosModalidades, modalidades){
    if(!dashboardEstrategico.sparks) return;
    const filas = modalidades.slice(0, 6);
    if(!filas.length){
        renderEstadoVacio(dashboardEstrategico.sparks, "Sin modalidades para mostrar");
        return;
    }

    dashboardEstrategico.sparks.innerHTML = filas.map((fila) => {
        const serie = serieMensualDashboard(datosModalidades.filter((item) => item.MODALIDAD === fila.nombre)).slice(-6);
        const primero = serie[0]?.casos || 0;
        const ultimo = serie[serie.length - 1]?.casos || 0;
        const variacion = primero ? ((ultimo - primero) / primero) * 100 : 0;
        const maximo = Math.max(...serie.map((item) => item.casos), 1);
        const puntos = serie.map((item, index) => {
            const x = 8 + (84 / Math.max(serie.length - 1, 1)) * index;
            const y = 34 - (item.casos / maximo) * 28;
            return `${x},${y}`;
        }).join(" ");
        return `
            <div class="spark-row">
                <div>
                    <strong>${fila.nombre}</strong>
                    <span>${formatear(fila.casos)} denuncias</span>
                </div>
                <svg viewBox="0 0 100 40" aria-hidden="true">
                    <polyline points="${puntos}" fill="none" stroke="${variacion >= 0 ? "#e65f5c" : "#25c19f"}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
                </svg>
                <b class="${variacion >= 0 ? "up" : "down"}">${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%</b>
            </div>
        `;
    }).join("");
}

function renderTerritoriosDashboard(territorios, total){
    if(!dashboardEstrategico.territorios) return;
    if(!territorios.length){
        renderEstadoVacio(dashboardEstrategico.territorios, "Sin territorios para mostrar");
        return;
    }

    dashboardEstrategico.territorios.innerHTML = `
        ${territorios.slice(0, 7).map((fila, index) => {
            const porcentaje = total ? (fila.casos / total) * 100 : 0;
            return `
                <div class="territory-line">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                    <strong>${fila.nombre}</strong>
                    <b>${formatear(fila.casos)}</b>
                    <small>${porcentaje.toFixed(1)}%</small>
                </div>
            `;
        }).join("")}
    `;
}

function renderLecturaDashboard(total, modalidades, territorios, variacion){
    if(!dashboardEstrategico.lectura) return;
    const principal = territorios[0];
    const modalidad = modalidades[0];
    const lectura = [
        {
            icono: variacion >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down",
            clase: variacion >= 0 ? "danger" : "success",
            titulo: variacion >= 0 ? "Incidencia con presion al alza" : "Incidencia con tendencia contenida",
            texto: `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}% frente al mes comparable anterior.`
        },
        {
            icono: "fa-location-crosshairs",
            clase: "warning",
            titulo: principal ? `${principal.nombre} concentra la carga` : "Sin concentracion territorial",
            texto: principal ? `${formatear(principal.casos)} denuncias dentro de ${formatear(total)} casos filtrados.` : "No hay territorio dominante con los filtros actuales."
        },
        {
            icono: "fa-triangle-exclamation",
            clase: "info",
            titulo: modalidad ? "Modalidad prioritaria" : "Sin modalidad prioritaria",
            texto: modalidad ? `${modalidad.nombre} lidera con ${formatear(modalidad.casos)} denuncias.` : "Seleccione un periodo con informacion disponible."
        }
    ];

    dashboardEstrategico.lectura.innerHTML = lectura.map((item) => `
        <div class="dashboard-reading-item ${item.clase}">
            <i class="fas ${item.icono}"></i>
            <div>
                <strong>${item.titulo}</strong>
                <p>${item.texto}</p>
            </div>
        </div>
    `).join("");
}

function renderDashboardEstrategico(){
    if(!dashboardEstrategico.total) return;
    const datos = obtenerDatosFiltrados();
    const fuenteModalidades = fuenteModalidadesFiltrable();
    const datosModalidades = obtenerDatosFiltrados("", fuenteModalidades.length ? fuenteModalidades : datosSIDPOL);
    const datosSerie = datosSerieDashboard();
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const extorsion = totalPorCoincidencia(datosModalidades, "EXTORSION");
    const homicidio = totalPorCoincidencia(datosModalidades, "HOMICIDIO");
    const robos = totalPorCoincidencia(datosModalidades, "ROBO");
    const territorios = topAgrupado(datos, (fila) => fila[campoRankingTerritorial()], 10);
    const modalidades = topAgrupado(datosModalidades, (fila) => fila.MODALIDAD, 10);
    const principal = territorios[0];
    const concentracion = principal && total ? (principal.casos / total) * 100 : 0;
    const serie = serieMensualDashboard(datosSerie);
    const ultimo = serie[serie.length - 1]?.casos || 0;
    const anterior = serie[serie.length - 2]?.casos || 0;
    const variacion = anterior ? ((ultimo - anterior) / anterior) * 100 : 0;

    dashboardEstrategico.contexto.textContent = contextoDashboard();
    dashboardEstrategico.total.textContent = formatear(total);
    dashboardEstrategico.totalDetalle.textContent = `${formatear(territorios.length)} ${etiquetaRankingTerritorial()} evaluados`;
    dashboardEstrategico.extorsion.textContent = formatear(extorsion);
    dashboardEstrategico.homicidio.textContent = formatear(homicidio);
    dashboardEstrategico.robos.textContent = formatear(robos);
    dashboardEstrategico.variacion.textContent = `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`;
    dashboardEstrategico.concentracion.textContent = `${concentracion.toFixed(1)}%`;
    dashboardEstrategico.concentracionTexto.textContent = principal ? principal.nombre : "Sin territorio";

    renderPulsoDashboard(serie);
    renderBarras(dashboardEstrategico.modalidades, modalidades.slice(0, 7), "bar", "Sin modalidades para mostrar");
    renderMatrizDashboard(datosModalidades, modalidades, territorios);
    renderSparksDashboard(datosModalidades, modalidades);
    renderTerritoriosDashboard(territorios, total);
    renderLecturaDashboard(total, modalidades, territorios, variacion);
}

function actualizarAnalitica(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("", fuenteModalidadesFiltrable());
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
    renderDashboardEstrategico();
    if(analiticaTemporalCargada) renderAnaliticaTemporal();
    if(vistaActual === "analisis-predictivo") renderAnalisisPredictivo();
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

function llenarSelectComparador(select, opciones, valorPreferido){
    if(!select) return;
    select.innerHTML = "";
    const valores = opciones.map((opcion) => typeof opcion === "object" ? String(opcion.value) : String(opcion));
    opciones.forEach((opcion) => {
        if(typeof opcion === "object"){
            select.appendChild(new Option(opcion.label, opcion.value));
        }else{
            select.appendChild(new Option(opcion, opcion));
        }
    });
    if(valorPreferido && valores.includes(String(valorPreferido))){
        select.value = valorPreferido;
    }else if(opciones.length){
        select.value = valores[0];
    }
}

function inicializarComparadorBianual(){
    if(comparadorBianualListo || !comparadorAnioBase || !datosSIDPOL.length) return;
    const anios = opcionesUnicas(datosSIDPOL, "ANIO").sort((a, b) => Number(b) - Number(a));
    const delitos = opcionesUnicas(datosSIDPOL, "MODALIDAD");
    const anioMasReciente = anios[0] || "";
    const anioPrevio = anios[1] || anioMasReciente;
    const delitoExtorsion = delitos.find((delito) => normalizar(delito) === "EXTORSION") || delitos.find((delito) => normalizar(delito).includes("EXTORSION")) || delitos[0] || "";
    const ultimoMes = ultimoMesComparador(anioMasReciente, delitoExtorsion);

    llenarSelectComparador(comparadorAnioBase, anios, anioPrevio);
    llenarSelectComparador(comparadorAnioComparado, anios, anioMasReciente);
    llenarSelectComparador(comparadorMesInicio, meses.map((mes, index) => ({ label: mes, value: String(index + 1) })), "1");
    llenarSelectComparador(comparadorMesFin, meses.map((mes, index) => ({ label: mes, value: String(index + 1) })), String(ultimoMes || 12));
    llenarSelectDelitos(comparadorDelito, delitos, "Todos los delitos", delitoExtorsion);
    comparadorBianualListo = true;
}

function ultimoMesComparador(anio, delito){
    return datosSIDPOL.reduce((maximo, fila) => {
        if(String(fila.ANIO || "") !== String(anio || "")) return maximo;
        if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return maximo;
        const mes = Number(fila.MES);
        return mes >= 1 && mes <= 12 ? Math.max(maximo, mes) : maximo;
    }, 0);
}

function periodoComparadorBianual(){
    let inicio = Number(comparadorMesInicio?.value || 1);
    let fin = Number(comparadorMesFin?.value || 12);
    if(inicio > fin) [inicio, fin] = [fin, inicio];
    return { inicio, fin, texto: `${meses[inicio - 1]} - ${meses[fin - 1]}` };
}

function cargarFuenteMensualComparador(anio){
    const clave = String(anio || "");
    if(!clave) return Promise.resolve([]);
    if(cacheComparadorMensual.has(clave)){
        const datosCacheados = cacheComparadorMensual.get(clave);
        if(datosCacheados.length) return Promise.resolve(datosCacheados);
    }
    if(anioSIDPOLMensual === clave && datosSIDPOLMensual.length){
        const copiaActual = datosSIDPOLMensual.slice();
        cacheComparadorMensual.set(clave, copiaActual);
        return Promise.resolve(copiaActual);
    }
    return cargarJson(`data/api/modalidades_mensuales/${encodeURIComponent(clave)}.json?v=${Date.now()}`)
        .then((datos) => {
            const normalizados = Array.isArray(datos) ? datos.map(normalizarFilaDatos) : [];
            cacheComparadorMensual.set(clave, normalizados);
            return normalizados;
        })
        .catch((error) => {
            console.warn(`No se pudo cargar detalle mensual para ${clave}`, error);
            return [];
        });
}

function filtrosComparadorTerritorial(){
    return {
        departamento: normalizar(filtros.departamento.value),
        provincia: normalizar(filtros.provincia.value),
        distrito: normalizar(filtros.distrito.value)
    };
}

function filaCoincideComparador(fila, anio, delito, territorio){
    if(String(fila.ANIO || "") !== String(anio || "")) return false;
    if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
    if(territorio.departamento && normalizar(fila.DPTO_HECHO) !== territorio.departamento) return false;
    if(territorio.provincia && normalizar(fila.PROV_HECHO) !== territorio.provincia) return false;
    if(territorio.distrito && normalizar(fila.DIST_HECHO) !== territorio.distrito) return false;
    return true;
}

function ultimoMesFuenteComparador(anio, delito, fuente = datosSIDPOL){
    const territorio = filtrosComparadorTerritorial();
    return fuente.reduce((maximo, fila) => {
        if(!filaCoincideComparador(fila, anio, delito, territorio)) return maximo;
        const mes = Number(fila.MES);
        if(!(mes >= 1 && mes <= 12) || obtenerCasos(fila) <= 0) return maximo;
        return Math.max(maximo, mes);
    }, 0);
}

function datosComparadorPorAnio(anio, delito, fuente = datosSIDPOL, periodo = periodoComparadorBianual()){
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);
    const distrito = normalizar(filtros.distrito.value);
    const filas = fuente.filter((fila) => {
        const mes = Number(fila.MES);
        if(String(fila.ANIO || "") !== String(anio || "")) return false;
        if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
        if(mes && (mes < periodo.inicio || mes > periodo.fin)) return false;
        if(departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        return true;
    });
    const mesesResumen = Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, casos: 0 }));
    let filasConMes = 0;
    filas.forEach((fila) => {
        const mes = Number(fila.MES);
        if(mes >= 1 && mes <= 12){
            mesesResumen[mes - 1].casos += obtenerCasos(fila);
            filasConMes += 1;
        }
    });
    return {
        anio: String(anio || ""),
        total: filas.reduce((suma, fila) => suma + obtenerCasos(fila), 0),
        meses: mesesResumen,
        filas,
        tieneDetalleMensual: filasConMes > 0
    };
}

function contextoComparadorBianual(){
    const territorio = [filtros.departamento.value, filtros.provincia.value, filtros.distrito.value].filter(Boolean).join(" / ");
    return territorio || "Nacional";
}

async function renderComparadorBianual(){
    if(!comparadorGrafico || !comparadorResumen) return;
    inicializarComparadorBianual();
    if(!comparadorBianualListo){
        renderEstadoVacio(comparadorGrafico, "Sin datos para comparar anos");
        return;
    }

    const renderId = ++renderComparadorId;
    renderEstadoVacio(comparadorGrafico, "Cargando detalle mensual del comparador...");
    const [fuenteBaseMensual, fuenteComparadaMensual] = await Promise.all([
        cargarFuenteMensualComparador(comparadorAnioBase.value),
        cargarFuenteMensualComparador(comparadorAnioComparado.value)
    ]);
    if(renderId !== renderComparadorId) return;

    const fuenteBase = fuenteBaseMensual.length ? fuenteBaseMensual : datosSIDPOL;
    const fuenteComparada = fuenteComparadaMensual.length ? fuenteComparadaMensual : datosSIDPOL;
    const periodoSeleccionado = periodoComparadorBianual();
    const ultimoBase = ultimoMesFuenteComparador(comparadorAnioBase.value, comparadorDelito.value, fuenteBase);
    const ultimoComparado = ultimoMesFuenteComparador(comparadorAnioComparado.value, comparadorDelito.value, fuenteComparada);
    const finDisponible = Math.min(
        periodoSeleccionado.fin,
        ultimoBase || periodoSeleccionado.fin,
        ultimoComparado || periodoSeleccionado.fin
    );
    const periodo = {
        inicio: periodoSeleccionado.inicio,
        fin: Math.max(periodoSeleccionado.inicio, finDisponible),
        texto: `${meses[periodoSeleccionado.inicio - 1]} - ${meses[Math.max(periodoSeleccionado.inicio, finDisponible) - 1]}`
    };
    const periodoAjustado = periodo.fin !== periodoSeleccionado.fin;

    const base = datosComparadorPorAnio(
        comparadorAnioBase.value,
        comparadorDelito.value,
        fuenteBase,
        periodo
    );
    const comparado = datosComparadorPorAnio(
        comparadorAnioComparado.value,
        comparadorDelito.value,
        fuenteComparada,
        periodo
    );
    const diferencia = comparado.total - base.total;
    const variacion = base.total ? (diferencia / base.total) * 100 : 0;
    const direccion = diferencia >= 0 ? "incremento" : "reduccion";
    const maxTotal = Math.max(base.total, comparado.total, 1);
    const baseMeses = base.meses.slice(periodo.inicio - 1, periodo.fin);
    const comparadoMeses = comparado.meses.slice(periodo.inicio - 1, periodo.fin);
    const width = 820;
    const height = 430;
    const barX = 245;
    const barMax = 395;
    const barHeight = 54;
    const baseBarWidth = Math.max(10, (base.total / maxTotal) * barMax);
    const comparadoBarWidth = Math.max(10, (comparado.total / maxTotal) * barMax);
    const baseY = 170;
    const comparadoY = 265;
    const tieneDetalleMensual = base.tieneDetalleMensual && comparado.tieneDetalleMensual;
    const colorDiferencia = diferencia >= 0 ? "#ff5c5c" : "#22e58a";
    const textoDiferencia = `${diferencia >= 0 ? "+" : ""}${formatear(diferencia)}`;
    const textoVariacion = `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`;

    ultimaComparacionBianual = { base, comparado, delito: comparadorDelito.value, diferencia, variacion, periodo };

    if(comparadorTablaHead && comparadorTablaBody){
        comparadorTablaHead.innerHTML = `
            <tr>
                <th>MES</th>
                <th>${base.anio}</th>
                <th>${comparado.anio}</th>
                <th>VARIACION</th>
                <th>%</th>
            </tr>
        `;
        const filasMes = tieneDetalleMensual ? baseMeses.map((fila, index) => {
            const mesIndex = periodo.inicio - 1 + index;
            const valorComparado = comparado.meses[mesIndex].casos;
            const difMes = valorComparado - fila.casos;
            const pctMes = fila.casos ? (difMes / fila.casos) * 100 : 0;
            return `
                <tr>
                    <td>${meses[mesIndex].toUpperCase()}</td>
                    <td>${formatear(fila.casos)}</td>
                    <td>${formatear(valorComparado)}</td>
                    <td class="${difMes >= 0 ? "up" : "down"}">${difMes >= 0 ? "+" : ""}${formatear(difMes)}</td>
                    <td class="${difMes >= 0 ? "up" : "down"}">${pctMes >= 0 ? "+" : ""}${pctMes.toFixed(0)}%</td>
                </tr>
            `;
        }).join("") : `
            <tr>
                <td class="monthly-note" colspan="5">Sin detalle mensual completo para uno de los años. Se muestra el total del periodo seleccionado para evitar meses en cero que no corresponden.</td>
            </tr>
        `;
        comparadorTablaBody.innerHTML = `
            ${filasMes}
            <tr class="total-row">
                <td>TOTAL</td>
                <td>${formatear(base.total)}</td>
                <td>${formatear(comparado.total)}</td>
                <td class="${diferencia >= 0 ? "up" : "down"}">${diferencia >= 0 ? "+" : ""}${formatear(diferencia)}</td>
                <td class="${diferencia >= 0 ? "up" : "down"}">${variacion >= 0 ? "+" : ""}${variacion.toFixed(0)}%</td>
            </tr>
        `;
    }

    comparadorResumen.innerHTML = `
        <div class="year-compare-card">
            <span>${base.anio}</span>
            <strong>${formatear(base.total)}</strong>
            <small>${comparadorDelito.value} | ${periodo.texto}${periodoAjustado ? " | cierre disponible" : ""}</small>
        </div>
        <div class="year-compare-card featured ${diferencia >= 0 ? "up" : "down"}">
            <span>Diferencia</span>
            <strong>${diferencia >= 0 ? "+" : ""}${formatear(diferencia)}</strong>
            <small>${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}% vs ${base.anio}</small>
        </div>
        <div class="year-compare-card">
            <span>${comparado.anio}</span>
            <strong>${formatear(comparado.total)}</strong>
            <small>${contextoComparadorBianual()} | ${periodo.texto}${periodoAjustado ? " | cierre disponible" : ""}</small>
        </div>
    `;

    comparadorGrafico.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Comparativo anual de ${comparadorDelito.value}">
            <defs>
                <linearGradient id="yearChartBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#08131c"></stop>
                    <stop offset="100%" stop-color="#102235"></stop>
                </linearGradient>
                <linearGradient id="yearBarBase" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#1d4ed8"></stop>
                    <stop offset="100%" stop-color="#60a5fa"></stop>
                </linearGradient>
                <linearGradient id="yearBarCompared" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#f59e0b"></stop>
                    <stop offset="100%" stop-color="#f8d45c"></stop>
                </linearGradient>
            </defs>
            <style>
                .year-title{fill:#ffffff;font:900 28px Arial,sans-serif;letter-spacing:.02em}
                .year-subtitle{fill:#bdd0e2;font:800 12px Arial,sans-serif}
                .year-label{fill:#f8fbff;font:900 18px Arial,sans-serif}
                .year-small{fill:#b8c9da;font:800 12px Arial,sans-serif}
                .year-value{fill:#ffffff;font:900 24px Arial,sans-serif}
                .year-diff{fill:${colorDiferencia};font:900 34px Arial,sans-serif}
                .year-pct{fill:${colorDiferencia};font:900 17px Arial,sans-serif}
            </style>
            <rect width="${width}" height="${height}" rx="16" fill="url(#yearChartBg)"></rect>
            <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="none" stroke="rgba(241,200,75,.42)"></rect>

            <text x="34" y="44" class="year-subtitle">COMPARATIVO DELICTIVO</text>
            <text x="34" y="78" class="year-title">${comparadorDelito.value}</text>
            <text x="34" y="102" class="year-subtitle">${periodo.texto} | ${contextoComparadorBianual()}${periodoAjustado ? " | comparacion ajustada al cierre disponible" : ""}</text>

            <rect x="590" y="34" width="190" height="92" rx="12" fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.14)"></rect>
            <text x="685" y="62" text-anchor="middle" class="year-small">DIFERENCIA</text>
            <text x="685" y="96" text-anchor="middle" class="year-diff">${textoDiferencia}</text>
            <text x="685" y="118" text-anchor="middle" class="year-pct">${textoVariacion} vs ${base.anio}</text>

            <text x="54" y="${baseY + 34}" class="year-label">${base.anio}</text>
            <text x="54" y="${baseY + 58}" class="year-small">${formatear(base.total)} denuncias</text>
            <rect x="${barX}" y="${baseY}" width="${barMax}" height="${barHeight}" rx="10" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.12)"></rect>
            <rect x="${barX}" y="${baseY}" width="${baseBarWidth}" height="${barHeight}" rx="10" fill="url(#yearBarBase)"></rect>
            <text x="${barX + baseBarWidth - 12}" y="${baseY + 35}" text-anchor="end" class="year-value">${formatear(base.total)}</text>

            <text x="54" y="${comparadoY + 34}" class="year-label">${comparado.anio}</text>
            <text x="54" y="${comparadoY + 58}" class="year-small">${formatear(comparado.total)} denuncias</text>
            <rect x="${barX}" y="${comparadoY}" width="${barMax}" height="${barHeight}" rx="10" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.12)"></rect>
            <rect x="${barX}" y="${comparadoY}" width="${comparadoBarWidth}" height="${barHeight}" rx="10" fill="url(#yearBarCompared)"></rect>
            <text x="${barX + comparadoBarWidth - 12}" y="${comparadoY + 35}" text-anchor="end" class="year-value">${formatear(comparado.total)}</text>

            <line x1="${barX}" y1="354" x2="${barX + barMax}" y2="354" stroke="rgba(255,255,255,.18)" stroke-width="1"></line>
            <text x="${barX}" y="386" class="year-subtitle">${direccion.toUpperCase()} ${textoVariacion}</text>
            <text x="${barX + barMax}" y="386" text-anchor="end" class="year-subtitle">Fuente: SIDPOL agregado</text>
        </svg>
    `;
}

function renderAnaliticaTemporal(){
    const datos = obtenerDatosFiltrados();
    const datosModalidades = obtenerDatosFiltrados("", fuenteModalidadesFiltrable());
    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const territorios = topAgrupado(datos, (fila) => fila[campoRankingTerritorial()], 30);
    const personas = filtrarPeriodoTemporal(datosPersonasTemporal);

    renderComparadorBianual();
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

async function descargarComparadorCsv(){
    if(!ultimaComparacionBianual) await renderComparadorBianual();
    if(!ultimaComparacionBianual) return;
    const { base, comparado, delito, diferencia, variacion, periodo } = ultimaComparacionBianual;
    const lineas = [
        "Campo;Valor",
        `Delito;${delito}`,
        `Ambito;${contextoComparadorBianual()}`,
        `Periodo;${periodo.texto}`,
        `Ano base;${base.anio}`,
        `Total ano base;${Math.round(base.total)}`,
        `Ano comparado;${comparado.anio}`,
        `Total ano comparado;${Math.round(comparado.total)}`,
        `Diferencia;${Math.round(diferencia)}`,
        `Variacion %;${variacion.toFixed(1)}`
    ];
    lineas.push("", "Mes;"+base.anio+";"+comparado.anio+";Diferencia");
    base.meses.slice(periodo.inicio - 1, periodo.fin).forEach((fila, index) => {
        const mesIndex = periodo.inicio - 1 + index;
        const valorComparado = comparado.meses[mesIndex].casos;
        lineas.push(`${meses[mesIndex]};${Math.round(fila.casos)};${Math.round(valorComparado)};${Math.round(valorComparado - fila.casos)}`);
    });
    const blob = new Blob(["\ufeff" + lineas.join("\n")], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `comparativo_${normalizar(delito).replace(/\s+/g, "_").toLowerCase()}_${base.anio}_${comparado.anio}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

async function descargarComparadorPdf(){
    if(!ultimaComparacionBianual) await renderComparadorBianual();
    if(!ultimaComparacionBianual || !comparadorGrafico) return;
    const svg = comparadorGrafico.querySelector("svg");
    if(!svg) return;
    const { base, comparado, delito, diferencia, variacion, periodo } = ultimaComparacionBianual;
    const fecha = new Date().toLocaleString("es-PE");
    const svgTexto = new XMLSerializer().serializeToString(svg);
    const tablaHtml = document.querySelector(".compare-table-card")?.innerHTML || "";
    const ventana = window.open("", "_blank");
    if(!ventana) return;
    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Comparativo ${delito}</title>
            <style>
                @page{size:A4;margin:18mm}
                body{font-family:Arial,sans-serif;color:#10202f;background:#fff}
                .sheet{display:grid;gap:18px}
                .header{display:flex;justify-content:space-between;gap:18px;border-bottom:3px solid #f1c84b;padding-bottom:14px}
                .header h1{margin:0;font-size:24px;color:#07131d;text-transform:uppercase}
                .header p{margin:4px 0 0;color:#4b6072;font-weight:700}
                .meta{text-align:right;font-size:12px;color:#4b6072}
                .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
                .card{border:1px solid #d8e0e8;border-left:5px solid #3d8bfd;border-radius:8px;padding:12px}
                .card.diff{border-left-color:${diferencia >= 0 ? "#d53f3f" : "#24a96f"}}
                .card span{display:block;color:#526679;font-size:12px;font-weight:800;text-transform:uppercase}
                .card strong{display:block;margin:5px 0;color:#07131d;font-size:28px}
                .card small{color:#526679;font-weight:700}
                .compare-table-card{background:#edf4fb;border:1px solid #9eb4c8;border-radius:8px;padding:10px}
                table{width:100%;border-collapse:collapse;font-size:12px;color:#102031}
                th{background:#17324a;color:#fff}
                th,td{border:1px solid #b6c6d6;padding:6px 8px;text-align:center}
                td{background:#fbfdff}
                td:first-child{background:#dceaf6;font-weight:800}
                .total-row td{background:#f1c84b;color:#06121c;font-weight:900}
                .up{color:#b42318;font-weight:900}
                .down{color:#047857;font-weight:900}
                .total-row .up{color:#b42318}
                .total-row .down{color:#047857}
                .monthly-note{background:#eef5fb;color:#334b63;font-weight:800}
                .chart svg{width:100%;height:auto}
                .note{padding:10px 12px;background:#eef4f8;border-left:4px solid #f1c84b;color:#263949;font-size:12px}
            </style>
        </head>
        <body>
            <main class="sheet">
                <section class="header">
                    <div>
                        <h1>Comparativo anual de ${delito}</h1>
                        <p>Observatorio del Crimen | ${contextoComparadorBianual()} | ${periodo.texto}</p>
                    </div>
                    <div class="meta">
                        <strong>Reporte generado</strong><br>${fecha}
                    </div>
                </section>
                <section class="cards">
                    <div class="card"><span>${base.anio}</span><strong>${formatear(base.total)}</strong><small>denuncias</small></div>
                    <div class="card diff"><span>Diferencia</span><strong>${diferencia >= 0 ? "+" : ""}${formatear(diferencia)}</strong><small>${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}% vs ${base.anio}</small></div>
                    <div class="card"><span>${comparado.anio}</span><strong>${formatear(comparado.total)}</strong><small>denuncias</small></div>
                </section>
                <section>${tablaHtml}</section>
                <section class="chart">${svgTexto}</section>
                <p class="note">Fuente: datos agregados del dashboard ODC. El comparativo respeta el delito, anos, periodo mensual y ambito territorial seleccionados.</p>
            </main>
            <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
        </body>
        </html>
    `);
    ventana.document.close();
}

async function descargarComparadorPng(){
    if(!comparadorGrafico) return;
    if(!comparadorGrafico.querySelector("svg")) await renderComparadorBianual();
    const svg = comparadorGrafico.querySelector("svg");
    if(!svg) return;
    const serializer = new XMLSerializer();
    const svgTexto = serializer.serializeToString(svg);
    const blob = new Blob([svgTexto], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const imagen = new Image();
    imagen.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svg.viewBox.baseVal.width || 980;
        canvas.height = svg.viewBox.baseVal.height || 350;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#0b1218";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imagen, 0, 0);
        URL.revokeObjectURL(url);
        const enlace = document.createElement("a");
        enlace.href = canvas.toDataURL("image/png");
        enlace.download = `comparativo_${comparadorAnioBase.value}_${comparadorAnioComparado.value}.png`;
        enlace.click();
    };
    imagen.src = url;
}

function fuentePredictivaActual(){
    if(filtros.delito.value){
        if(filtros.anio.value && anioSIDPOLMensual === filtros.anio.value && datosSIDPOLMensual.length){
            return datosSIDPOLMensual;
        }
        return [];
    }
    return datosTerritorio;
}

function datosPredictivosFiltrados(){
    const anio = filtros.anio.value;
    const mesBase = Number(filtros.mes.value || 0);
    const departamento = normalizar(filtros.departamento.value);
    const provincia = normalizar(filtros.provincia.value);
    const distrito = normalizar(filtros.distrito.value);
    const delito = filtros.delito.value;

    return fuentePredictivaActual().filter((fila) => {
        const mes = Number(fila.MES);
        if(!mes || mes < 1 || mes > 12) return false;
        if(anio && String(fila.ANIO || "") !== anio) return false;
        if(anio && mesBase && mes > mesBase) return false;
        if(departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
        return true;
    });
}

function construirSerieMensualPredictiva(datos){
    const acumulado = new Map();
    datos.forEach((fila) => {
        const anio = Number(fila.ANIO);
        const mes = Number(fila.MES);
        if(!anio || !mes) return;
        const clave = `${anio}-${String(mes).padStart(2, "0")}`;
        acumulado.set(clave, (acumulado.get(clave) || 0) + obtenerCasos(fila));
    });
    return [...acumulado.entries()]
        .map(([clave, casos]) => {
            const [anio, mes] = clave.split("-").map(Number);
            return { anio, mes, clave, casos, tipo: "historico" };
        })
        .sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));
}

function sumarMes(anio, mes, incremento){
    const fecha = new Date(anio, mes - 1 + incremento, 1);
    return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };
}

function promedio(valores){
    return valores.length ? valores.reduce((suma, valor) => suma + valor, 0) / valores.length : 0;
}

function construirProyeccion(serie, horizonte, escenario){
    const valores = serie.map((fila) => fila.casos);
    const ultimos = valores.slice(-3);
    const previos = valores.slice(-6, -3);
    const promedioReciente = promedio(ultimos);
    const promedioPrevio = promedio(previos.length ? previos : valores.slice(0, -3));
    const tendenciaMensual = (promedioReciente - promedioPrevio) / Math.max(ultimos.length, 1);
    const promedioGlobal = promedio(valores) || 1;
    const factorEscenario = { conservador: .72, probable: 1, riesgo: 1.28 }[escenario] || 1;
    const variabilidad = Math.sqrt(promedio(valores.map((valor) => Math.pow(valor - promedioGlobal, 2)))) / promedioGlobal;
    const ultimo = serie[serie.length - 1];

    return Array.from({ length: horizonte }, (_, index) => {
        const fecha = sumarMes(ultimo.anio, ultimo.mes, index + 1);
        const historicoMismoMes = serie.filter((fila) => fila.mes === fecha.mes).map((fila) => fila.casos);
        const estacionalidad = Math.min(1.25, Math.max(.75, promedio(historicoMismoMes) / promedioGlobal || 1));
        const base = Math.max(0, promedioReciente + tendenciaMensual * (index + 1) * factorEscenario);
        const casos = Math.max(0, Math.round(base * estacionalidad));
        const margen = Math.max(casos * (.12 + Math.min(variabilidad, .45) * .35), promedioGlobal * .05);
        return {
            anio: fecha.anio,
            mes: fecha.mes,
            clave: `${fecha.anio}-${String(fecha.mes).padStart(2, "0")}`,
            casos,
            inferior: Math.max(0, Math.round(casos - margen)),
            superior: Math.round(casos + margen),
            tipo: "proyeccion"
        };
    });
}

function renderGraficoPredictivo(serie, proyeccion){
    const historicoVisible = serie.slice(-12);
    const puntos = [...historicoVisible, ...proyeccion];
    const maximo = Math.max(...puntos.map((fila) => fila.superior || fila.casos), 1);
    const width = 940;
    const height = 382;
    const padding = { top: 62, right: 34, bottom: 78, left: 78 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const escalaX = (index) => padding.left + (innerWidth / Math.max(puntos.length - 1, 1)) * index;
    const escalaY = (valor) => padding.top + innerHeight - ((valor / maximo) * innerHeight);

    const puntosSvg = puntos.map((fila, index) => ({ ...fila, x: escalaX(index), y: escalaY(fila.casos) }));
    const historicoSvg = puntosSvg.filter((fila) => fila.tipo === "historico");
    const proyeccionSvg = puntosSvg.filter((fila) => fila.tipo === "proyeccion");
    const inicioProyeccion = historicoSvg[historicoSvg.length - 1];
    const lineaHistorica = historicoSvg.map((punto, index) => `${index ? "L" : "M"} ${punto.x} ${punto.y}`).join(" ");
    const lineaProyeccion = [inicioProyeccion, ...proyeccionSvg].filter(Boolean)
        .map((punto, index) => `${index ? "L" : "M"} ${punto.x} ${punto.y}`).join(" ");
    const bandaSuperior = proyeccionSvg.map((punto) => `${punto.x},${escalaY(punto.superior)}`).join(" ");
    const bandaInferior = [...proyeccionSvg].reverse().map((punto) => `${punto.x},${escalaY(punto.inferior)}`).join(" ");
    const critico = proyeccionSvg.reduce((mayor, fila) => fila.casos > (mayor?.casos || -1) ? fila : mayor, null);

    graficoPredictivo.innerHTML = `
        <div class="chart-legend">
            <span class="active"><i style="background:#43b581"></i>Historico</span>
            <span><i style="background:#f1c84b"></i>Proyeccion</span>
            <span><i style="background:#4b91e8"></i>Banda de confianza</span>
            <span><i style="background:#e65f5c"></i>Mes critico probable</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Proyeccion predictiva mensual">
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + innerHeight}" stroke="#33404d"></line>
            <line x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight}" stroke="#33404d"></line>
            <line x1="${padding.left}" y1="${padding.top + innerHeight / 2}" x2="${padding.left + innerWidth}" y2="${padding.top + innerHeight / 2}" stroke="#33404d" stroke-dasharray="5 7" opacity=".7"></line>
            ${inicioProyeccion ? `<line class="forecast-split" x1="${inicioProyeccion.x}" y1="${padding.top - 4}" x2="${inicioProyeccion.x}" y2="${padding.top + innerHeight}"></line>` : ""}
            ${proyeccionSvg.length ? `<polygon class="forecast-band" points="${bandaSuperior} ${bandaInferior}"></polygon>` : ""}
            <path d="${lineaHistorica}" fill="none" stroke="#43b581" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            <path class="forecast-line" d="${lineaProyeccion}" fill="none" stroke="#f1c84b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            ${puntosSvg.map((punto) => `
                <circle cx="${punto.x}" cy="${punto.y}" r="${punto === critico ? 6 : 4.5}" class="${punto === critico ? "forecast-point-critical" : ""}" fill="${punto.tipo === "historico" ? "#43b581" : "#f1c84b"}">
                    <title>${meses[punto.mes - 1]} ${punto.anio}: ${formatear(punto.casos)} denuncias</title>
                </circle>
            `).join("")}
            ${puntosSvg.map((punto) => `
                <text x="${punto.x}" y="${Math.max(24, punto.y - 14)}" text-anchor="middle"
                    fill="#ffffff" stroke="#050a0f" stroke-width="4" paint-order="stroke"
                    font-size="13" font-weight="900">${formatear(punto.casos)}</text>
            `).join("")}
            ${puntosSvg.map((punto, index) => index % 2 === 0 || punto.tipo === "proyeccion" ? `
                <text x="${punto.x}" y="${height - 34}" text-anchor="middle"
                    fill="#ffffff" stroke="#050a0f" stroke-width="3" paint-order="stroke"
                    font-size="13" font-weight="800">${meses[punto.mes - 1]} ${String(punto.anio).slice(-2)}</text>
            ` : "").join("")}
            <text x="12" y="${padding.top + 4}" fill="#ffffff" stroke="#050a0f" stroke-width="3" paint-order="stroke" font-size="13" font-weight="800">${formatear(maximo)}</text>
            <text x="24" y="${padding.top + innerHeight}" fill="#ffffff" stroke="#050a0f" stroke-width="3" paint-order="stroke" font-size="13" font-weight="800">0</text>
        </svg>
    `;
}

function renderMatrizPredictiva(){
    if(!datosIncidenciaHoraria.length){
        renderEstadoVacio(predictivoMatrizHoraria, "Sin patrones horarios disponibles");
        return;
    }
    const datos = filtrarPeriodoTemporal(datosIncidenciaHoraria);
    const valores = Array.from({ length: 7 }, () => Array(6).fill(0));
    datos.forEach((fila) => {
        const dia = numero(fila.DIA_SEMANA);
        const hora = numero(fila.HORA);
        if(dia >= 0 && dia < 7 && hora >= 0 && hora < 24) valores[dia][Math.floor(hora / 4)] += obtenerCasos(fila);
    });
    const maximo = Math.max(...valores.flat(), 1);
    const dias = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    const tramos = ["00-04", "04-08", "08-12", "12-16", "16-20", "20-24"];
    predictivoMatrizHoraria.innerHTML = `
        <div class="hourly-grid predictive-hourly-grid">
            <span></span>${tramos.map((tramo) => `<span class="hour-label">${tramo}</span>`).join("")}
            ${valores.map((horas, dia) => `
                <strong>${dias[dia]}</strong>
                ${horas.map((valor, index) => {
                    const nivel = valor ? Math.max(1, Math.ceil((valor / maximo) * 5)) : 0;
                    return `<span class="hour-cell level-${nivel}" title="${dias[dia]} ${tramos[index]}: ${formatear(valor)} denuncias"></span>`;
                }).join("")}
            `).join("")}
        </div>
        <div class="hourly-scale"><span>Baja</span><i></i><i></i><i></i><i></i><i></i><span>Alta</span></div>
    `;
}

function renderRankingPredictivo(){
    const datos = datosPredictivosFiltrados();
    const campo = campoRankingTerritorial();
    const series = new Map();
    datos.forEach((fila) => {
        const nombre = fila[campo] || "SIN TERRITORIO";
        const claveMes = `${fila.ANIO}-${String(fila.MES).padStart(2, "0")}`;
        if(!series.has(nombre)) series.set(nombre, new Map());
        const mesesTerritorio = series.get(nombre);
        mesesTerritorio.set(claveMes, (mesesTerritorio.get(claveMes) || 0) + obtenerCasos(fila));
    });

    const filas = [...series.entries()].map(([nombre, mesesTerritorio]) => {
        const valores = [...mesesTerritorio.entries()].sort().map(([, valor]) => valor);
        const reciente = promedio(valores.slice(-3));
        const previo = promedio(valores.slice(-6, -3));
        const variacion = previo > 0 ? ((reciente - previo) / previo) * 100 : reciente > 0 ? 100 : 0;
        return { nombre, casos: reciente, variacion };
    }).filter((fila) => fila.casos > 0).sort((a, b) => b.variacion - a.variacion).slice(0, 6);

    if(!filas.length){
        renderEstadoVacio(predictivoRanking, "Sin jurisdicciones para proyectar");
        return;
    }

    predictivoRanking.innerHTML = filas.map((fila, index) => {
        const nivel = fila.variacion >= 20 ? "Alta" : fila.variacion >= 8 ? "Media" : "Baja";
        return `
            <div class="rank-row">
                <div class="rank-meta">
                    <span>${index + 1}. ${fila.nombre}</span>
                    <strong>${fila.variacion >= 0 ? "+" : ""}${fila.variacion.toFixed(1)}%</strong>
                </div>
                <div class="rank-track"><div class="rank-fill" style="width:${Math.min(Math.abs(fila.variacion), 100)}%"></div></div>
                <small>Nivel de riesgo: ${nivel}</small>
            </div>
        `;
    }).join("");
}

function renderLecturaPredictiva(serie, proyeccion, variacion, riesgo){
    const topMes = proyeccion.reduce((mayor, fila) => fila.casos > (mayor?.casos || -1) ? fila : mayor, null);
    const territorio = [filtros.departamento.value, filtros.provincia.value, filtros.distrito.value].filter(Boolean).join(" / ") || "Peru";
    const delito = filtros.delito.value || "todos los delitos";
    const direccion = variacion >= 8 ? "al alza" : variacion <= -8 ? "a la baja" : "estable";
    predictivoLectura.innerHTML = `
        <div class="briefing-item">
            <span>01</span>
            <div><strong>Tendencia ${direccion}</strong><p>Para ${delito} en ${territorio}, el escenario muestra una variacion estimada de ${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%.</p></div>
        </div>
        <div class="briefing-item">
            <span>02</span>
            <div><strong>Mes de atencion</strong><p>${topMes ? `${meses[topMes.mes - 1]} ${topMes.anio}` : "Sin mes critico"} concentra el mayor valor proyectado dentro del horizonte seleccionado.</p></div>
        </div>
        <div class="briefing-item">
            <span>03</span>
            <div><strong>Recomendacion operativa</strong><p>${riesgo === "ALTO" ? "Priorizar vigilancia preventiva y seguimiento semanal." : riesgo === "MEDIO" ? "Mantener monitoreo focalizado y revisar variaciones por distrito." : "Continuar monitoreo regular con alertas tempranas."}</p></div>
        </div>
    `;
}

function renderAnalisisPredictivo(){
    const horizonte = Number(filtroHorizontePredictivo?.value || 6);
    const escenario = filtroEscenarioPredictivo?.value || "probable";
    const datos = datosPredictivosFiltrados();
    const serie = construirSerieMensualPredictiva(datos);

    predictivoPeriodo.textContent = `Horizonte ${horizonte} meses`;
    if(filtros.delito.value && !filtros.anio.value){
        renderEstadoVacio(graficoPredictivo, "Seleccione un año para proyectar una modalidad especifica");
        ["predictivoRiesgo", "predictivoVariacion", "predictivoMesCritico", "predictivoConfianza"].forEach((id) => {
            const elemento = document.getElementById(id);
            if(elemento) elemento.textContent = id === "predictivoRiesgo" ? "Sin datos" : "0%";
        });
        renderEstadoVacio(predictivoRanking, "Seleccione un año para analizar crecimiento por modalidad");
        renderMatrizPredictiva();
        predictivoLectura.innerHTML = `<div class="empty-state">Para delitos especificos, primero seleccione un año. Asi se usa el detalle mensual real.</div>`;
        return;
    }

    if(serie.length < 4){
        renderEstadoVacio(graficoPredictivo, "Se necesitan al menos 4 meses historicos para proyectar");
        predictivoRiesgo.textContent = "Sin datos";
        predictivoRiesgoTexto.textContent = "No hay suficiente historial mensual para estimar.";
        predictivoVariacion.textContent = "0%";
        predictivoMesCritico.textContent = "Sin datos";
        predictivoConfianza.textContent = "0%";
        renderEstadoVacio(predictivoRanking, "Sin historial suficiente");
        renderMatrizPredictiva();
        predictivoLectura.innerHTML = `<div class="empty-state">No hay suficiente informacion mensual para una lectura predictiva.</div>`;
        return;
    }

    const proyeccion = construirProyeccion(serie, horizonte, escenario);
    const promedioReciente = promedio(serie.slice(-3).map((fila) => fila.casos));
    const promedioProyectado = promedio(proyeccion.map((fila) => fila.casos));
    const variacion = promedioReciente > 0 ? ((promedioProyectado - promedioReciente) / promedioReciente) * 100 : 0;
    const confianza = Math.min(88, Math.max(52, 48 + serie.length * 3 - Math.abs(variacion) * .35));
    const riesgo = variacion >= 18 ? "ALTO" : variacion >= 6 ? "MEDIO" : "BAJO";
    const topMes = proyeccion.reduce((mayor, fila) => fila.casos > (mayor?.casos || -1) ? fila : mayor, null);

    renderGraficoPredictivo(serie, proyeccion);
    predictivoRiesgo.textContent = riesgo;
    predictivoRiesgoTexto.textContent = riesgo === "ALTO" ? "Incremento probable en el horizonte." : riesgo === "MEDIO" ? "Seguimiento preventivo recomendado." : "Comportamiento proyectado controlado.";
    predictivoVariacion.textContent = `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`;
    predictivoMesCritico.textContent = topMes ? `${meses[topMes.mes - 1]} ${topMes.anio}` : "Sin datos";
    predictivoConfianza.textContent = `${confianza.toFixed(0)}%`;
    renderMatrizPredictiva();
    renderRankingPredictivo();
    renderLecturaPredictiva(serie, proyeccion, variacion, riesgo);
}

async function cargarAnalisisPredictivo(){
    if(filtros.delito.value && filtros.anio.value){
        await cargarModalidadesMensuales(filtros.anio.value);
    }
    if(!datosIncidenciaHoraria.length){
        try{
            const horarios = await cargarJson("data/api/incidencia_horaria.json");
            datosIncidenciaHoraria = horarios.map(normalizarFilaDatos);
        }catch(error){
            console.warn("No se pudieron cargar patrones horarios predictivos", error);
        }
    }
    renderAnalisisPredictivo();
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
    const periodo = [
        filtros.fechaDesde?.value ? `desde ${filtros.fechaDesde.value}` : "",
        filtros.fechaHasta?.value ? `hasta ${filtros.fechaHasta.value}` : ""
    ].filter(Boolean).join(" ") || "periodo completo";

    textoResumen.textContent = `${territorio}: ${formatear(total)} casos para ${delito}, ${periodo}.`;
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

function aniosDesdeRangoFechas(){
    const desde = filtros.fechaDesde?.value || "";
    const hasta = filtros.fechaHasta?.value || "";
    const anios = new Set();
    [desde, hasta].forEach((fecha) => {
        const anio = fecha.slice(0, 4);
        if(anio) anios.add(anio);
    });
    if(filtros.anio.value) anios.add(filtros.anio.value);
    if(!anios.size){
        const ultimo = opcionesUnicas(datosTerritorio, "ANIO").pop();
        if(ultimo) anios.add(ultimo);
    }
    return [...anios].sort();
}

function cargarDatosDiarios(){
    const anios = aniosDesdeRangoFechas();
    const cacheKey = anios.join(",");
    if(!cacheKey){
        datosSIDPOLDiario = [];
        datosSIDPOLDiarioCargados = true;
        anioSIDPOLDiario = "";
        claveCargaDatosSIDPOLDiario = "";
        return Promise.resolve(datosSIDPOLDiario);
    }

    if(datosSIDPOLDiarioCargados && anioSIDPOLDiario === cacheKey) return Promise.resolve(datosSIDPOLDiario);
    if(cacheDatosSIDPOLDiario.has(cacheKey)){
        datosSIDPOLDiario = cacheDatosSIDPOLDiario.get(cacheKey);
        datosSIDPOLDiarioCargados = true;
        anioSIDPOLDiario = cacheKey;
        return Promise.resolve(datosSIDPOLDiario);
    }
    if(cargaDatosSIDPOLDiarioPromise && claveCargaDatosSIDPOLDiario === cacheKey) return cargaDatosSIDPOLDiarioPromise;

    claveCargaDatosSIDPOLDiario = cacheKey;
    cargaDatosSIDPOLDiarioPromise = Promise.all(
        anios.map((anio) =>
            cargarJson(`data/api/diario_por_anio/${encodeURIComponent(anio)}.json`).catch(() => [])
        )
    )
        .then((respuestas) => {
            datosSIDPOLDiario = respuestas.flat()
                .map(normalizarFilaDatos)
                .filter((fila) => fila.ANIO && fila.MES && fila.DIA && fila.DPTO_HECHO && fila.MODALIDAD);
            datosSIDPOLDiarioCargados = true;
            anioSIDPOLDiario = cacheKey;
            cacheDatosSIDPOLDiario.set(cacheKey, datosSIDPOLDiario);
            return datosSIDPOLDiario;
        })
        .catch((error) => {
            datosSIDPOLDiario = [];
            datosSIDPOLDiarioCargados = false;
            anioSIDPOLDiario = "";
            claveCargaDatosSIDPOLDiario = "";
            console.error(error);
            return [];
        })
        .finally(() => {
            cargaDatosSIDPOLDiarioPromise = null;
            claveCargaDatosSIDPOLDiario = "";
        });

    return cargaDatosSIDPOLDiarioPromise;
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

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
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
    const delito = filtros.delito.value;

    return datosMapaCalor.filter((fila) => {
        if(anio && fila.ANIO !== anio) return false;
        if(mes && fila.MES !== mes) return false;
        if(departamento && normalizar(fila.DPTO_HECHO) !== departamento) return false;
        if(provincia && normalizar(fila.PROV_HECHO) !== provincia) return false;
        if(distrito && normalizar(fila.DIST_HECHO) !== distrito) return false;
        if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
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
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
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

function escaparHtml(valor){
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizarRegionPolicial(valor){
    return normalizar(valor).replace(/^REGPOL\s*-?\s*/, "").trim();
}

function normalizarComisariaPolicial(valor){
    let texto = normalizar(valor)
        .replace(/["“”']\s*([A-E])\s*["“”']?\s*$/, " $1")
        .replace(/^COMISARIA\s+DE\s+FAMILIA\s+/, "")
        .replace(/^COMISARIA\s+PNP\s+/, "")
        .replace(/^COMISARIA\s+/, "")
        .replace(/^CPNP\s+/, "")
        .replace(/[^A-Z0-9]+/g, " ")
        .replace(/\s+[A-E]\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();

    const equivalencias = {
        "CUZCO": "CUSCO",
        "EL RIMAC": "RIMAC",
        "DE PRO": "PRO",
        "VEINTISEIS 26 DE OCTUBRE": "26 DE OCTUBRE"
    };
    return equivalencias[texto] || texto;
}

function normalizarCodigoPolicial(valor){
    const codigo = String(valor ?? "").trim().replace(/\.0$/, "").replace(/^0+/, "");
    return codigo || "";
}

function claveFilaPolicial(fila){
    const region = normalizarRegionPolicial(fila?.REGION);
    const codigo = normalizarCodigoPolicial(fila?.ID_COMISARIA ?? fila?.COD_CPNP);
    if(region && codigo) return `${region}|${codigo}`;
    const comisaria = normalizarComisariaPolicial(fila?.COMISARIA);
    return region && comisaria ? `${region}|${comisaria}` : comisaria;
}

function claveFeaturePolicial(feature){
    const propiedades = feature?.properties || {};
    const region = normalizarRegionPolicial(propiedades.regionpol);
    const codigo = normalizarCodigoPolicial(propiedades.cod_cpnp);
    if(region && codigo) return `${region}|${codigo}`;
    const comisaria = normalizarComisariaPolicial(propiedades.comisaria);
    return region && comisaria ? `${region}|${comisaria}` : comisaria;
}

function normalizarFilaPolicial(fila){
    return {
        ...fila,
        ANIO: String(fila.ANIO || "").trim(),
        MES: String(fila.MES || "").trim(),
        ID_COMISARIA: String(fila.ID_COMISARIA ?? fila.COD_CPNP ?? "").trim(),
        COD_CPNP: String(fila.COD_CPNP ?? fila.ID_COMISARIA ?? "").trim(),
        REGION: String(fila.REGION || "").trim(),
        COMISARIA: String(fila.COMISARIA || "").trim(),
        MODALIDAD: String(fila.MODALIDAD || "").trim(),
        CASOS: numero(fila.CASOS)
    };
}

function inicializarMapaPolicial(){
    if(mapaPolicial) return;
    mapaPolicial = L.map("mapaPolicial", {
        zoomControl: true,
        minZoom: 5
    }).setView(vistaPeru.centro, vistaPeru.zoom);
    mapaPolicial.setMaxBounds(limitesPeru);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri"
    }).addTo(mapaPolicial);
}

function limpiarCapasPoliciales(){
    [capaRegionesPoliciales, capaJurisdiccionesPoliciales, marcadoresComisariasPoliciales]
        .filter(Boolean)
        .forEach((layer) => mapaPolicial.removeLayer(layer));
    capaRegionesPoliciales = null;
    capaJurisdiccionesPoliciales = null;
    marcadoresComisariasPoliciales = null;
}

function cargarModalidadesPolicialesMensuales(anio){
    if(!anio) return Promise.resolve([]);
    if(anioPolicialMensual === anio && datosPolicialesMensuales.length){
        return Promise.resolve(datosPolicialesMensuales);
    }
    return cargarJson(`data/api/policial/modalidades_mensuales/${encodeURIComponent(anio)}.json`)
        .then((datos) => {
            datosPolicialesMensuales = datos.map(normalizarFilaPolicial);
            anioPolicialMensual = anio;
            return datosPolicialesMensuales;
        })
        .catch((error) => {
            console.error(error);
            datosPolicialesMensuales = [];
            anioPolicialMensual = "";
            return [];
        });
}

function cargarModalidadesPolicialesGenerales(){
    if(modalidadesPolicialesCargadas) return Promise.resolve(datosPolicialesModalidades);
    if(cargaModalidadesPolicialesPromise) return cargaModalidadesPolicialesPromise;

    policialEstado.textContent = "Cargando modalidades por comisaria...";
    cargaModalidadesPolicialesPromise = cargarJson("data/api/policial/modalidades.json")
        .then((datos) => {
            datosPolicialesModalidades = datos.map(normalizarFilaPolicial);
            modalidadesPolicialesCargadas = true;
            return datosPolicialesModalidades;
        })
        .finally(() => {
            cargaModalidadesPolicialesPromise = null;
        });
    return cargaModalidadesPolicialesPromise;
}

function cargarDatosJurisdiccion(){
    if(jurisdiccionCargada) return Promise.resolve(datosJurisdiccionResumen);
    if(cargaJurisdiccionPromise) return cargaJurisdiccionPromise;
    policialEstado.textContent = "Cargando hechos por jurisdiccion policial...";
    cargaJurisdiccionPromise = cargarJson("data/api/jurisdiccion/resumen.json")
        .then((datos) => {
            datosJurisdiccionResumen = datos.map(normalizarFilaPolicial);
            jurisdiccionCargada = true;
            return datosJurisdiccionResumen;
        })
        .finally(() => {
            cargaJurisdiccionPromise = null;
        });
    return cargaJurisdiccionPromise;
}

function cargarModalidadesJurisdiccionGenerales(){
    if(modalidadesJurisdiccionCargadas) return Promise.resolve(datosJurisdiccionModalidades);
    if(cargaModalidadesJurisdiccionPromise) return cargaModalidadesJurisdiccionPromise;
    policialEstado.textContent = "Cargando modalidades por jurisdiccion...";
    cargaModalidadesJurisdiccionPromise = cargarJson("data/api/jurisdiccion/modalidades.json")
        .then((datos) => {
            datosJurisdiccionModalidades = datos.map(normalizarFilaPolicial);
            modalidadesJurisdiccionCargadas = true;
            return datosJurisdiccionModalidades;
        })
        .finally(() => {
            cargaModalidadesJurisdiccionPromise = null;
        });
    return cargaModalidadesJurisdiccionPromise;
}

function cargarModalidadesJurisdiccionMensuales(anio){
    if(!anio) return Promise.resolve([]);
    if(anioJurisdiccionMensual === anio && datosJurisdiccionMensuales.length){
        return Promise.resolve(datosJurisdiccionMensuales);
    }
    return cargarJson(`data/api/jurisdiccion/modalidades_mensuales/${encodeURIComponent(anio)}.json`)
        .then((datos) => {
            datosJurisdiccionMensuales = datos.map(normalizarFilaPolicial);
            anioJurisdiccionMensual = anio;
            return datosJurisdiccionMensuales;
        })
        .catch((error) => {
            console.error(error);
            datosJurisdiccionMensuales = [];
            anioJurisdiccionMensual = "";
            return [];
        });
}

function configurarModoPolicial(){
    const esHecho = modoPolicial === "hecho";
    policialEyebrow.textContent = esHecho ? "Georreferenciacion operativa" : "Registro territorial policial";
    policialHeading.textContent = esHecho ? "Hechos ocurridos por jurisdiccion" : "Denuncias registradas por comisaria";
    policialTotalLabel.textContent = esHecho ? "hechos georreferenciados" : "denuncias registradas";
    policialComisariasLabel.textContent = esHecho ? "jurisdicciones con hechos" : "comisarias con registros";
    policialSinMapaLabel.textContent = esHecho ? "hechos sin jurisdiccion" : "denuncias sin cartografia";
    policialRankingLabel.textContent = esHecho ? "Mayor incidencia por jurisdiccion" : "Mayor carga por comisaria";
}

function cargarModalidadesModoPolicial(){
    if(!filtros.delito.value) return Promise.resolve();
    if(modoPolicial === "hecho"){
        return filtros.anio.value
            ? cargarModalidadesJurisdiccionMensuales(filtros.anio.value)
            : cargarModalidadesJurisdiccionGenerales();
    }
    return filtros.anio.value
        ? cargarModalidadesPolicialesMensuales(filtros.anio.value)
        : cargarModalidadesPolicialesGenerales();
}

function cargarDatosPoliciales(){
    if(policialCargado) return Promise.resolve();
    if(cargaPolicialPromise) return cargaPolicialPromise;

    policialEstado.textContent = "Cargando cartografia y denuncias por comisaria...";
    cargaPolicialPromise = Promise.all([
        cargarJson("mapas/policial/regiones_policiales.geojson"),
        cargarJson("mapas/policial/jurisdicciones_comisarias.geojson"),
        cargarJson("mapas/policial/comisarias.geojson"),
        cargarJson("data/api/policial/resumen.json")
    ]).then(([regiones, jurisdicciones, comisarias, resumen]) => {
        geoRegionesPoliciales = regiones;
        geoJurisdiccionesPoliciales = jurisdicciones;
        geoComisariasPoliciales = comisarias;
        datosPolicialesResumen = resumen.map(normalizarFilaPolicial);
        policialCargado = true;
        llenarRegionesPoliciales();
    }).finally(() => {
        cargaPolicialPromise = null;
    });
    return cargaPolicialPromise;
}

function llenarRegionesPoliciales(){
    const actual = filtroRegionPolicial.value;
    const regiones = [...new Set(
        geoRegionesPoliciales.features
            .map((feature) => feature.properties.regionpol)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));
    filtroRegionPolicial.innerHTML = "";
    filtroRegionPolicial.appendChild(new Option("Todas las organizaciones", ""));
    regiones.forEach((region) => filtroRegionPolicial.appendChild(new Option(region, region)));
    filtroRegionPolicial.value = regiones.includes(actual) ? actual : "";
    llenarComisariasPoliciales();
}

function llenarComisariasPoliciales(){
    const region = normalizarRegionPolicial(filtroRegionPolicial.value);
    const actual = filtroComisariaPolicial.value;
    const comisarias = region && geoJurisdiccionesPoliciales
        ? [...new Set(
            geoJurisdiccionesPoliciales.features
                .filter((feature) => normalizarRegionPolicial(feature.properties.regionpol) === region)
                .map((feature) => feature.properties.comisaria)
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "es"))
        : [];
    filtroComisariaPolicial.innerHTML = "";
    filtroComisariaPolicial.appendChild(new Option("Todas las comisarias", ""));
    comisarias.forEach((comisaria) => filtroComisariaPolicial.appendChild(new Option(comisaria, comisaria)));
    filtroComisariaPolicial.disabled = !region;
    filtroComisariaPolicial.value = comisarias.includes(actual) ? actual : "";
}

function fuentePolicialActual(){
    if(modoPolicial === "hecho"){
        if(!filtros.delito.value) return datosJurisdiccionResumen;
        if(filtros.anio.value) return datosJurisdiccionMensuales;
        return datosJurisdiccionModalidades;
    }
    if(!filtros.delito.value) return datosPolicialesResumen;
    if(filtros.anio.value) return datosPolicialesMensuales;
    return datosPolicialesModalidades;
}

function obtenerDatosPolicialesFiltrados(){
    const anio = filtros.anio.value;
    const mes = filtros.mes.value;
    const delito = filtros.delito.value;
    const region = normalizarRegionPolicial(filtroRegionPolicial.value);
    const comisaria = normalizarComisariaPolicial(filtroComisariaPolicial.value);

    if(delito && mes && !anio) return [];
    return fuentePolicialActual().filter((fila) => {
        if(anio && fila.ANIO !== anio) return false;
        if(mes && String(fila.MES || "") !== mes) return false;
        if(delito && !modalidadCoincideDelito(fila.MODALIDAD, delito)) return false;
        if(region && normalizarRegionPolicial(fila.REGION) !== region) return false;
        if(comisaria && normalizarComisariaPolicial(fila.COMISARIA) !== comisaria) return false;
        return true;
    });
}

function resumirDatosPoliciales(datos, obtenerClave){
    return datos.reduce((resumen, fila) => {
        const clave = obtenerClave(fila);
        if(clave) resumen[clave] = (resumen[clave] || 0) + obtenerCasos(fila);
        return resumen;
    }, {});
}

function colorCargaPolicial(casos, maximo){
    if(!casos || !maximo) return "#344453";
    const proporcion = casos / maximo;
    if(proporcion >= .72) return "#e65f5c";
    if(proporcion >= .45) return "#f59e4c";
    if(proporcion >= .2) return "#f1c84b";
    return "#25c19f";
}

function seleccionarRegionPolicial(nombre, bounds = null){
    filtroRegionPolicial.value = buscarValorSelect(filtroRegionPolicial, nombre);
    filtroComisariaPolicial.value = "";
    llenarComisariasPoliciales();
    renderMapaPolicial(bounds);
}

function seleccionarComisariaPolicial(nombre, bounds = null){
    filtroComisariaPolicial.value = buscarValorSelect(filtroComisariaPolicial, nombre);
    renderMapaPolicial(bounds);
}

function periodoPolicialActivo(){
    const partes = [];
    if(filtros.mes.value) partes.push(meses[Number(filtros.mes.value) - 1]);
    partes.push(filtros.anio.value || "Todos los años");
    if(filtros.delito.value) partes.push(filtros.delito.value);
    return partes.join(" · ");
}

function renderPanelPolicial(datos, capasPorComisaria){
    const resumenComisarias = resumirDatosPoliciales(
        datos,
        (fila) => claveFilaPolicial(fila)
    );
    const fuentePorComisaria = new Map();
    datos.forEach((fila) => {
        const clave = claveFilaPolicial(fila);
        if(clave && !fuentePorComisaria.has(clave)) fuentePorComisaria.set(clave, fila);
    });
    const catalogo = new Map();
    geoJurisdiccionesPoliciales.features.forEach((feature) => {
        const propiedades = feature.properties;
        const clave = claveFeaturePolicial(feature);
        catalogo.set(clave, propiedades.comisaria);
    });

    const filas = Object.entries(resumenComisarias).map(([claveComisaria, casos]) => {
        const filaFuente = fuentePorComisaria.get(claveComisaria);
        return {
            clave: claveComisaria,
            nombre: catalogo.get(claveComisaria) || filaFuente?.COMISARIA || claveComisaria,
            casos,
            mapeada: catalogo.has(claveComisaria)
        };
    }).sort((a, b) => b.casos - a.casos);

    const total = datos.reduce((suma, fila) => suma + obtenerCasos(fila), 0);
    const agrupadosPrivacidad = modoPolicial === "hecho"
        ? datos
            .filter((fila) => normalizarComisariaPolicial(fila.COMISARIA) === "OTRAS JURISDICCIONES")
            .reduce((suma, fila) => suma + obtenerCasos(fila), 0)
        : 0;
    const sinMapa = modoPolicial === "hecho"
        ? datos
            .filter((fila) => normalizarRegionPolicial(fila.REGION) === "SIN JURISDICCION")
            .reduce((suma, fila) => suma + obtenerCasos(fila), 0)
        : filas.filter((fila) => !fila.mapeada).reduce((suma, fila) => suma + fila.casos, 0);
    const seleccion = normalizarComisariaPolicial(filtroComisariaPolicial.value);
    policialTotal.textContent = formatear(total);
    policialComisarias.textContent = formatear(
        modoPolicial === "hecho" ? filas.filter((fila) => fila.mapeada).length : filas.length
    );
    policialSinMapa.textContent = formatear(agrupadosPrivacidad || sinMapa);
    if(modoPolicial === "hecho"){
        policialComisariasLabel.textContent = agrupadosPrivacidad
            ? "jurisdicciones visibles"
            : "jurisdicciones con hechos";
        policialSinMapaLabel.textContent = agrupadosPrivacidad
            ? "hechos agrupados por privacidad"
            : "hechos sin jurisdiccion";
    }
    policialPeriodo.textContent = periodoPolicialActivo();

    rankingComisarias.innerHTML = filas.slice(0, 12).map((fila, indice) => `
        <button class="police-ranking-row ${fila.clave === seleccion ? "active" : ""}" type="button"
            data-comisaria="${escaparHtml(fila.nombre)}" data-clave="${escaparHtml(fila.clave)}" ${fila.mapeada ? "" : "disabled"}
            title="${fila.mapeada ? "Ubicar comisaria" : "Sin jurisdiccion cartografica equivalente"}">
            <b>${indice + 1}</b>
            <span>${escaparHtml(fila.nombre)}</span>
            <strong>${formatear(fila.casos)}</strong>
        </button>
    `).join("") || '<div class="empty-state">Sin comisarias para los filtros seleccionados</div>';

    rankingComisarias.querySelectorAll("button:not(:disabled)").forEach((button) => {
        button.addEventListener("click", () => {
            const nombre = button.dataset.comisaria;
            const layer = capasPorComisaria[button.dataset.clave] || capasPorComisaria[normalizarComisariaPolicial(nombre)];
            seleccionarComisariaPolicial(nombre, layer ? layer.getBounds() : null);
        });
    });
}

function renderMapaPolicial(boundsEnfoque = null){
    if(!mapaPolicial || !policialCargado) return;
    limpiarCapasPoliciales();
    const datos = obtenerDatosPolicialesFiltrados();
    const region = normalizarRegionPolicial(filtroRegionPolicial.value);
    const comisariaSeleccionada = normalizarComisariaPolicial(filtroComisariaPolicial.value);
    const capasPorComisaria = {};

    if(!region){
        const resumenRegiones = resumirDatosPoliciales(datos, (fila) => normalizarRegionPolicial(fila.REGION));
        const regionesCartografiadas = new Set(
            geoRegionesPoliciales.features.map((feature) => normalizarRegionPolicial(feature.properties.regionpol))
        );
        const regionesEvaluadas = Object.entries(resumenRegiones)
            .filter(([nombre, casos]) => casos > 0 && regionesCartografiadas.has(nombre)).length;
        const maximo = Math.max(...Object.values(resumenRegiones), 0);
        capaRegionesPoliciales = L.geoJSON(geoRegionesPoliciales, {
            style: (feature) => {
                const casos = resumenRegiones[normalizarRegionPolicial(feature.properties.regionpol)] || 0;
                const color = colorCargaPolicial(casos, maximo);
                return { color, weight: 1.5, fillColor: color, fillOpacity: casos ? .4 : .04 };
            },
            onEachFeature: (feature, layer) => {
                const nombre = feature.properties.regionpol;
                const casos = resumenRegiones[normalizarRegionPolicial(nombre)] || 0;
                layer.bindTooltip(`<strong>${escaparHtml(nombre)}</strong><br>${formatear(casos)} ${modoPolicial === "hecho" ? "hechos" : "denuncias"}`);
                layer.on({
                    mouseover: (event) => event.target.setStyle({ weight: 3, fillOpacity: casos ? .62 : .08 }),
                    mouseout: () => capaRegionesPoliciales.resetStyle(layer),
                    click: () => seleccionarRegionPolicial(nombre, layer.getBounds())
                });
            }
        }).addTo(mapaPolicial);
        policialNivel.textContent = "Cobertura nacional";
        policialTitulo.textContent = "Regiones y Frente Policial VRAEM";
        policialEstado.textContent = `${formatear(regionesEvaluadas)} organizaciones territoriales evaluadas con los filtros activos.`;
        renderPanelPolicial(datos, capasPorComisaria);
        mapaPolicial.fitBounds(capaRegionesPoliciales.getBounds(), { padding: [20, 20] });
        setTimeout(() => mapaPolicial.invalidateSize(), 80);
        return;
    }

    const features = geoJurisdiccionesPoliciales.features.filter((feature) =>
        normalizarRegionPolicial(feature.properties.regionpol) === region
    );
    const clavesCartografiadasRegion = new Set(
        features.map((feature) => claveFeaturePolicial(feature))
    );
    const resumenComisarias = resumirDatosPoliciales(datos, (fila) => claveFilaPolicial(fila));
    const claveAgrupadaRegion = modoPolicial === "hecho" ? "OTRAS JURISDICCIONES" : "OTRAS COMISARIAS";
    const casosSinPoligonoRegion = Object.entries(resumenComisarias)
        .filter(([clave]) => clave && clave !== "SIN JURISDICCION" && !clavesCartografiadasRegion.has(clave))
        .reduce((suma, [, casos]) => suma + casos, 0);
    const casosAgrupadosRegion = modoPolicial === "hecho"
        ? (resumenComisarias["OTRAS JURISDICCIONES"] || 0)
        : casosSinPoligonoRegion;
    const maximo = Math.max(...Object.values(resumenComisarias), 0);

    if(casosAgrupadosRegion){
        const regionSeleccionada = geoRegionesPoliciales.features.filter((feature) =>
            normalizarRegionPolicial(feature.properties.regionpol) === region
        );
        capaRegionesPoliciales = L.geoJSON(
            { type: "FeatureCollection", features: regionSeleccionada },
            {
                interactive: true,
                style: {
                    color: "#f1c84b",
                    weight: 2,
                    fillColor: "#f1c84b",
                    fillOpacity: .24
                },
                onEachFeature: (feature, layer) => {
                    layer.bindTooltip(
                        `<strong>${escaparHtml(feature.properties.regionpol)}</strong><br>` +
                        `${formatear(casosAgrupadosRegion)} ${modoPolicial === "hecho" ? "hechos" : "denuncias"} sin poligono propio`
                    );
                }
            }
        ).addTo(mapaPolicial);
    }

    capaJurisdiccionesPoliciales = L.geoJSON({ type: "FeatureCollection", features }, {
        style: (feature) => {
            const clave = claveFeaturePolicial(feature);
            const casos = resumenComisarias[clave] || 0;
            const color = colorCargaPolicial(casos, maximo);
            const activa = comisariaSeleccionada && clave === comisariaSeleccionada;
            return {
                color: activa ? "#ffffff" : color,
                weight: activa ? 3 : 1.3,
                fillColor: color,
                fillOpacity: casos ? (activa ? .68 : .4) : .025
            };
        },
        onEachFeature: (feature, layer) => {
            const nombre = feature.properties.comisaria;
            const clave = claveFeaturePolicial(feature);
            const casos = resumenComisarias[clave] || 0;
            capasPorComisaria[clave] = layer;
            capasPorComisaria[normalizarComisariaPolicial(nombre)] = layer;
            layer.bindTooltip(`<strong>${escaparHtml(nombre)}</strong><br>${formatear(casos)} ${modoPolicial === "hecho" ? "hechos" : "denuncias"}`);
            layer.on({
                mouseover: (event) => event.target.setStyle({ weight: 3, fillOpacity: casos ? .66 : .08 }),
                mouseout: () => capaJurisdiccionesPoliciales.resetStyle(layer),
                click: () => seleccionarComisariaPolicial(nombre, layer.getBounds())
            });
        }
    }).addTo(mapaPolicial);

    const puntos = geoComisariasPoliciales.features.filter((feature) =>
        normalizarRegionPolicial(feature.properties.regionpol) === region &&
        (resumenComisarias[claveFeaturePolicial(feature)] || 0) > 0
    );
    marcadoresComisariasPoliciales = L.layerGroup();
    puntos.forEach((feature) => {
        const nombre = feature.properties.comisaria;
        const clave = claveFeaturePolicial(feature);
        const casos = resumenComisarias[clave] || 0;
        const icon = L.divIcon({
            className: "",
            html: '<span class="police-station-marker"><i class="fas fa-building-shield"></i></span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        const marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], { icon });
        marker.bindTooltip(`<strong>${escaparHtml(nombre)}</strong><br>${formatear(casos)} ${modoPolicial === "hecho" ? "hechos" : "denuncias"}`);
        marker.on("click", () => {
            const layer = capasPorComisaria[clave] || capasPorComisaria[normalizarComisariaPolicial(nombre)];
            seleccionarComisariaPolicial(nombre, layer ? layer.getBounds() : null);
        });
        marcadoresComisariasPoliciales.addLayer(marker);
    });
    marcadoresComisariasPoliciales.addTo(mapaPolicial);

    policialNivel.textContent = filtroRegionPolicial.value === "FRENTE POLICIAL VRAEM"
        ? "Frente policial"
        : "Region policial";
    policialTitulo.textContent = filtroRegionPolicial.value;
    const claveAgrupada = modoPolicial === "hecho" ? "OTRAS JURISDICCIONES" : "OTRAS COMISARIAS";
    const nombreUnidad = modoPolicial === "hecho" ? "jurisdicciones" : "comisarias";
    const nombreRegistro = modoPolicial === "hecho" ? "hechos" : "denuncias";
    const unidadesVisibles = Object.keys(resumenComisarias)
        .filter((clave) => clave !== claveAgrupada && clave !== "SIN JURISDICCION" && clavesCartografiadasRegion.has(clave)).length;
    const casosAgrupados = casosAgrupadosRegion || (resumenComisarias[claveAgrupada] || 0);
    policialEstado.textContent = casosAgrupados
        ? `${formatear(unidadesVisibles)} ${nombreUnidad} visibles. ${formatear(casosAgrupados)} ${nombreRegistro} sin poligono propio.`
        : `${formatear(unidadesVisibles)} ${nombreUnidad} evaluadas con los filtros activos.`;
    renderPanelPolicial(datos, capasPorComisaria);

    const activa = capasPorComisaria[comisariaSeleccionada];
    const bounds = boundsEnfoque || (activa ? activa.getBounds() : capaJurisdiccionesPoliciales.getBounds());
    mapaPolicial.flyToBounds(bounds, { padding: [24, 24], maxZoom: activa ? 13 : 10 });
    setTimeout(() => mapaPolicial.invalidateSize(), 80);
}

async function cargarMapaPolicial(){
    inicializarMapaPolicial();
    try{
        await cargarDatosPoliciales();
        if(modoPolicial === "hecho") await cargarDatosJurisdiccion();
        await cargarModalidadesModoPolicial();
        renderMapaPolicial();
    }catch(error){
        policialEstado.textContent = "No se pudo cargar la informacion policial.";
        console.error(error);
    }
}

function buscarIndicadorProduccion(nombre){
    if(!datosProduccionPolicial || !Array.isArray(datosProduccionPolicial.indicadores)) return null;
    const clave = normalizar(nombre);
    return datosProduccionPolicial.indicadores.find((fila) => normalizar(fila.indicador) === clave);
}

function pintarKpiProduccion(indicador, valor, variacion){
    if(!valor || !variacion) return;
    if(!indicador){
        valor.textContent = "0";
        variacion.textContent = "Sin informacion";
        variacion.className = "";
        return;
    }
    valor.textContent = indicador.valor_2026_txt || formatear(indicador.valor_2026);
    variacion.textContent = `${indicador.variacion_txt || formatear(indicador.variacion)} vs 2025`;
    variacion.className = indicador.variacion >= 0 ? "positive" : "negative";
}

function obtenerIndicadoresProduccion(nombres){
    return nombres.map((nombre) => buscarIndicadorProduccion(nombre)).filter(Boolean);
}

function iconoIndicadorProduccion(indicador){
    const clave = normalizar(indicador);
    if(clave.includes("OPERATIVOS")) return "fa-clipboard-check";
    if(clave.includes("ORGANIZACIONES")) return "fa-sitemap";
    if(clave.includes("BANDAS")) return "fa-people-robbery";
    if(clave.includes("DETENIDOS")) return "fa-handcuffs";
    if(clave.includes("MIGRACIONES")) return "fa-passport";
    if(clave.includes("REQUISITORIADOS")) return "fa-user-shield";
    if(clave.includes("ARMAS")) return "fa-gun";
    if(clave.includes("VEHICULOS")) return "fa-car-rear";
    if(clave.includes("PBC") || clave.includes("CC ") || clave.includes("MARIHUANA")) return "fa-prescription-bottle-medical";
    if(clave.includes("CONTRABANDO")) return "fa-box-open";
    if(clave.includes("PAPELETAS")) return "fa-receipt";
    if(clave.includes("DINERO")) return "fa-sack-dollar";
    if(clave.includes("EXPLOSIVO")) return "fa-bomb";
    if(clave.includes("CELULARES")) return "fa-mobile-screen";
    if(clave.includes("SIM")) return "fa-sim-card";
    return "fa-chart-simple";
}

function renderBarrasProduccion(){
    if(!produccionBarras) return;
    const indicadores = datosProduccionPolicial?.indicadores || [];
    if(!indicadores.length){
        renderEstadoVacio(produccionBarras, "Sin indicadores de produccion policial");
        return;
    }
    const principales = indicadores.slice(0, 10);
    const maximo = Math.max(...principales.map((fila) => Math.max(Number(fila.valor_2025) || 0, Number(fila.valor_2026) || 0)), 1);
    produccionBarras.innerHTML = principales.map((fila) => {
        const ancho2025 = Math.max((Number(fila.valor_2025) / maximo) * 100, 2);
        const ancho2026 = Math.max((Number(fila.valor_2026) / maximo) * 100, 2);
        const variacion = Number(fila.variacion) || 0;
        const clase = variacion >= 0 ? "up" : "down";
        const icono = iconoIndicadorProduccion(fila.indicador);
        return `
            <div class="production-bar-row ${clase}">
                <div class="production-indicator-icon"><i class="fas ${icono}"></i></div>
                <div class="production-bar-title">
                    <strong>${escaparHtml(fila.indicador)}</strong>
                    <span>${fila.valor_2026_txt}</span>
                </div>
                <div class="production-bar-compare">
                    <div class="production-bar-line">
                        <span>2025</span>
                        <div class="production-track"><i class="bar-2025" style="width:${ancho2025}%"></i></div>
                        <b>${fila.valor_2025_txt}</b>
                    </div>
                    <div class="production-bar-line">
                        <span>2026</span>
                        <div class="production-track"><i class="bar-2026" style="width:${ancho2026}%"></i></div>
                        <b>${fila.valor_2026_txt}</b>
                    </div>
                </div>
                <div class="production-delta ${clase}">
                    <strong>${fila.variacion_txt}</strong>
                    <small>${(Number(fila.variacion_pct) || 0) >= 0 ? "+" : ""}${(Number(fila.variacion_pct) || 0).toFixed(1)}%</small>
                </div>
            </div>
        `;
    }).join("");
}

function renderRankingProduccion(contenedor, filas, vacio){
    if(!contenedor) return;
    if(!filas || !filas.length){
        renderEstadoVacio(contenedor, vacio);
        return;
    }
    contenedor.innerHTML = filas.slice(0, 5).map((fila, index) => {
        const clase = Number(fila.variacion) >= 0 ? "up" : "down";
        const icono = iconoIndicadorProduccion(fila.indicador);
        return `
            <div class="production-rank-row ${clase}">
                <span>${index + 1}</span>
                <i class="fas ${icono}"></i>
                <strong>${escaparHtml(fila.indicador)}</strong>
                <b>${fila.variacion_txt}</b>
            </div>
        `;
    }).join("");
}

function renderResumenProduccion(){
    const indicadores = datosProduccionPolicial?.indicadores || [];
    const avances = indicadores.filter((fila) => Number(fila.variacion) > 0).length;
    const brechas = indicadores.filter((fila) => Number(fila.variacion) < 0).length;
    const porcentaje = indicadores.length ? Math.round((avances / indicadores.length) * 100) : 0;
    const estado = porcentaje >= 60 ? "Estable" : porcentaje >= 45 ? "Vigilancia" : "Atencion";
    const detalle = porcentaje >= 60 ? "Balance favorable del periodo" : porcentaje >= 45 ? "Seguimiento ejecutivo" : "Requiere acciones estrategicas";

    if(prodTotalIndicadores) prodTotalIndicadores.textContent = formatear(indicadores.length);
    if(prodIndicadoresMejoran) prodIndicadoresMejoran.textContent = formatear(avances);
    if(prodIndicadoresDisminuyen) prodIndicadoresDisminuyen.textContent = formatear(brechas);
    if(prodPctMejoran) prodPctMejoran.textContent = `${porcentaje}%`;
    if(prodSemaforo) prodSemaforo.textContent = estado;
    if(prodSemaforoDetalle) prodSemaforoDetalle.textContent = detalle;
}

function renderDashboardVisualProduccion(){
    const indicadores = datosProduccionPolicial?.indicadores || [];
    if(!indicadores.length){
        [prodDashboardBarras, prodDashboardBalance, prodDashboardBrief, prodChartColumns, prodChartCategory, prodChartLine, prodChartPct, prodChartDonut, prodChartBrief].forEach((contenedor) => {
            if(contenedor) renderEstadoVacio(contenedor, "Sin indicadores disponibles");
        });
        return;
    }

    const avances = indicadores.filter((fila) => Number(fila.variacion) > 0).length;
    const brechas = indicadores.filter((fila) => Number(fila.variacion) < 0).length;
    const porcentaje = indicadores.length ? Math.round((avances / indicadores.length) * 100) : 0;
    const principalAvance = (datosProduccionPolicial?.avances || [])[0];
    const principalBrecha = (datosProduccionPolicial?.brechas || [])[0];
    const operativos = buscarIndicadorProduccion("Operativos");
    const dinero = buscarIndicadorProduccion("Dinero incautado");
    const barras = obtenerIndicadoresProduccion([
        "Operativos",
        "Bandas criminales desarticuladas",
        "Captura de requisitoriados",
        "Armas de fuego incautadas",
        "Vehiculos recuperados"
    ]);
    const maximo = Math.max(...barras.map((fila) => Math.max(Number(fila.valor_2025) || 0, Number(fila.valor_2026) || 0)), 1);

    if(prodDashboardTexto){
        prodDashboardTexto.textContent = `${avances} indicadores mejoran y ${brechas} requieren seguimiento frente al acumulado 2025.`;
    }

    if(prodDashboardPulso){
        prodDashboardPulso.style.setProperty("--pulse", `${Math.min(porcentaje, 100) * 3.6}deg`);
        prodDashboardPulso.innerHTML = `<strong>${porcentaje}%</strong><span>mejora</span>`;
    }

    if(prodDashboardBarras){
        prodDashboardBarras.innerHTML = barras.map((fila) => {
            const ancho2025 = Math.max((Number(fila.valor_2025) / maximo) * 100, 2);
            const ancho2026 = Math.max((Number(fila.valor_2026) / maximo) * 100, 2);
            const clase = Number(fila.variacion) >= 0 ? "up" : "down";
            return `
                <div class="production-vertical-bar-row ${clase}">
                    <div class="production-vertical-label">
                        <i class="fas ${iconoIndicadorProduccion(fila.indicador)}"></i>
                        <strong>${escaparHtml(fila.indicador)}</strong>
                    </div>
                    <div class="production-vertical-measures">
                        <span><b>2025</b><i style="width:${ancho2025}%"></i><em>${fila.valor_2025_txt}</em></span>
                        <span><b>2026</b><i style="width:${ancho2026}%"></i><em>${fila.valor_2026_txt}</em></span>
                    </div>
                    <strong>${fila.variacion_txt}</strong>
                </div>
            `;
        }).join("");
    }

    if(prodDashboardBalance){
        prodDashboardBalance.innerHTML = `
            <div class="production-balance-item good">
                <i class="fas fa-arrow-trend-up"></i>
                <span>Mayor avance</span>
                <strong>${principalAvance ? escaparHtml(principalAvance.indicador) : "Sin dato"}</strong>
                <b>${principalAvance ? principalAvance.variacion_txt : "0"}</b>
            </div>
            <div class="production-balance-item bad">
                <i class="fas fa-arrow-trend-down"></i>
                <span>Mayor descenso</span>
                <strong>${principalBrecha ? escaparHtml(principalBrecha.indicador) : "Sin dato"}</strong>
                <b>${principalBrecha ? principalBrecha.variacion_txt : "0"}</b>
            </div>
            <div class="production-balance-item neutral">
                <i class="fas fa-clipboard-check"></i>
                <span>Operativos ejecutados</span>
                <strong>${operativos ? operativos.valor_2026_txt : "Sin dato"}</strong>
                <b>${operativos ? operativos.variacion_txt : "0"}</b>
            </div>
        `;
    }

    if(prodDashboardBrief){
        prodDashboardBrief.innerHTML = `
            <p><b>Resumen:</b> el tablero mide produccion policial acumulada nacional, no denuncias registradas.</p>
            <p><b>Impulso:</b> ${principalAvance ? principalAvance.indicador : "sin avance identificado"} lidera el crecimiento operativo.</p>
            <p><b>Atencion:</b> ${principalBrecha ? principalBrecha.indicador : "sin brecha identificada"} concentra la mayor reduccion.</p>
            <p><b>Referencia clave:</b> dinero incautado ${dinero ? dinero.valor_2026_txt : "sin dato"} en el periodo reportado.</p>
        `;
    }

    const columnas = obtenerIndicadoresProduccion([
        "Operativos",
        "Bandas criminales desarticuladas",
        "Detenidos nacionales",
        "Captura de requisitoriados",
        "Vehiculos recuperados",
        "Celulares incautados"
    ]);
    const maxColumnas = Math.max(...columnas.map((fila) => Math.max(Number(fila.valor_2025) || 0, Number(fila.valor_2026) || 0)), 1);

    if(prodChartColumns){
        prodChartColumns.innerHTML = `
            <div class="production-column-legend"><span><i></i>2025</span><span><i></i>2026</span></div>
            <div class="production-column-plot">
                ${columnas.map((fila) => {
                    const alto2025 = Math.max((Number(fila.valor_2025) / maxColumnas) * 100, 4);
                    const alto2026 = Math.max((Number(fila.valor_2026) / maxColumnas) * 100, 4);
                    return `
                        <div class="production-column-group">
                            <div class="production-column-bars">
                                <span class="year-2025" style="height:${alto2025}%"><b>${fila.valor_2025_txt}</b></span>
                                <span class="year-2026" style="height:${alto2026}%"><b>${fila.valor_2026_txt}</b></span>
                            </div>
                            <strong>${escaparHtml(fila.indicador)}</strong>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    const categorias = obtenerIndicadoresProduccion([
        "Operativos",
        "Papeletas impuestas IRNT",
        "PBC - ketes",
        "Detenidos nacionales",
        "Celulares incautados"
    ]);
    const maxCategoria = Math.max(...categorias.map((fila) => Number(fila.valor_2026) || 0), 1);
    if(prodChartCategory){
        prodChartCategory.innerHTML = categorias.map((fila) => {
            const ancho = Math.max((Number(fila.valor_2026) / maxCategoria) * 100, 4);
            return `
                <div class="production-horizontal-row">
                    <span>${escaparHtml(fila.indicador)}</span>
                    <i style="width:${ancho}%"></i>
                    <b>${fila.valor_2026_txt}</b>
                </div>
            `;
        }).join("");
    }

    const linea = columnas.map((fila) => Number(fila.variacion_pct) || 0);
    const minLinea = Math.min(...linea, 0);
    const maxLinea = Math.max(...linea, 1);
    const rangoLinea = Math.max(maxLinea - minLinea, 1);
    const anchoLinea = 620;
    const altoLinea = 176;
    const margenLinea = { left: 34, right: 24, top: 22, bottom: 36 };
    const areaLineaAncho = anchoLinea - margenLinea.left - margenLinea.right;
    const areaLineaAlto = altoLinea - margenLinea.top - margenLinea.bottom;
    const escalaYLinea = (valor) => margenLinea.top + areaLineaAlto - (((valor - minLinea) / rangoLinea) * areaLineaAlto);
    const yBaseLinea = escalaYLinea(0);
    const puntos = linea.map((valor, index) => {
        const x = margenLinea.left + (index * (areaLineaAncho / Math.max(linea.length - 1, 1)));
        const y = escalaYLinea(valor);
        return `${x},${y}`;
    }).join(" ");
    if(prodChartLine){
        const puntosSeparados = puntos.split(" ");
        prodChartLine.innerHTML = `
            <svg viewBox="0 0 ${anchoLinea} ${altoLinea}" role="img" aria-label="Linea de variacion porcentual">
                <line class="production-line-axis" x1="${margenLinea.left}" y1="${margenLinea.top}" x2="${margenLinea.left}" y2="${margenLinea.top + areaLineaAlto}"></line>
                <line class="production-line-axis" x1="${margenLinea.left}" y1="${margenLinea.top + areaLineaAlto}" x2="${margenLinea.left + areaLineaAncho}" y2="${margenLinea.top + areaLineaAlto}"></line>
                <line class="production-line-grid" x1="${margenLinea.left}" y1="${margenLinea.top + areaLineaAlto * .33}" x2="${margenLinea.left + areaLineaAncho}" y2="${margenLinea.top + areaLineaAlto * .33}"></line>
                <line class="production-line-grid" x1="${margenLinea.left}" y1="${margenLinea.top + areaLineaAlto * .66}" x2="${margenLinea.left + areaLineaAncho}" y2="${margenLinea.top + areaLineaAlto * .66}"></line>
                <line class="production-line-zero" x1="${margenLinea.left}" y1="${yBaseLinea}" x2="${margenLinea.left + areaLineaAncho}" y2="${yBaseLinea}"></line>
                <polyline points="${puntos}"></polyline>
                ${linea.map((valor, index) => {
                    const [x, y] = puntosSeparados[index].split(",");
                    return `
                        <g>
                            <circle cx="${x}" cy="${y}" r="4.6"></circle>
                            <text x="${x}" y="${Number(y) - 10}" text-anchor="middle">${valor >= 0 ? "+" : ""}${valor.toFixed(1)}%</text>
                        </g>
                    `;
                }).join("")}
            </svg>
            <div class="production-line-labels">
                ${columnas.map((fila) => `<span>${escaparHtml(fila.indicador.split(" ")[0])}</span>`).join("")}
            </div>
        `;
    }

    const tasas = [...indicadores]
        .filter((fila) => Number.isFinite(Number(fila.variacion_pct)))
        .sort((a, b) => Math.abs(Number(b.variacion_pct)) - Math.abs(Number(a.variacion_pct)))
        .slice(0, 6);
    const maxTasa = Math.max(...tasas.map((fila) => Math.abs(Number(fila.variacion_pct) || 0)), 1);
    if(prodChartPct){
        prodChartPct.innerHTML = tasas.map((fila) => {
            const alto = Math.max((Math.abs(Number(fila.variacion_pct) || 0) / maxTasa) * 100, 6);
            const clase = Number(fila.variacion_pct) >= 0 ? "up" : "down";
            return `
                <div class="production-rate-bar ${clase}">
                    <b>${Number(fila.variacion_pct).toFixed(0)}%</b>
                    <i style="height:${alto}%"></i>
                    <span>${escaparHtml(fila.indicador.split(" ")[0])}</span>
                </div>
            `;
        }).join("");
    }

    if(prodChartDonut){
        prodChartDonut.style.setProperty("--good", `${porcentaje * 3.6}deg`);
        prodChartDonut.innerHTML = `
            <div class="production-donut">
                <strong>${porcentaje}%</strong>
                <span>mejoran</span>
            </div>
            <div class="production-donut-detail">
                <p><i class="good"></i><b>${avances}</b> indicadores en avance</p>
                <p><i class="bad"></i><b>${brechas}</b> indicadores en descenso</p>
                <p><i class="neutral"></i><b>${indicadores.length}</b> indicadores evaluados</p>
            </div>
        `;
    }

    if(prodChartBrief){
        prodChartBrief.innerHTML = `
            <p><b>Produccion policial:</b> tablero acumulado nacional extraido del PDF diario.</p>
            <p><b>Mayor impulso:</b> ${principalAvance ? principalAvance.indicador : "sin dato"} con ${principalAvance ? principalAvance.variacion_txt : "0"}.</p>
            <p><b>Punto critico:</b> ${principalBrecha ? principalBrecha.indicador : "sin dato"} con ${principalBrecha ? principalBrecha.variacion_txt : "0"}.</p>
            <p><b>Lectura:</b> priorizar seguimiento sobre indicadores que disminuyen y sostener los avances operativos.</p>
        `;
    }
}

function renderMosaicoProduccion(){
    if(!produccionMosaico) return;
    const indicadores = datosProduccionPolicial?.indicadores || [];
    if(!indicadores.length){
        renderEstadoVacio(produccionMosaico, "Sin indicadores disponibles");
        return;
    }
    produccionMosaico.innerHTML = indicadores.map((fila) => {
        const variacion = Number(fila.variacion) || 0;
        const clase = variacion >= 0 ? "up" : "down";
        const icono = iconoIndicadorProduccion(fila.indicador);
        return `
            <article class="production-mini-card ${clase}">
                <i class="fas ${icono}"></i>
                <div>
                    <h3>${escaparHtml(fila.indicador)}</h3>
                    <div class="production-mini-years">
                        <span>2025 <b>${fila.valor_2025_txt}</b></span>
                        <span>2026 <b>${fila.valor_2026_txt}</b></span>
                    </div>
                    <strong>${fila.variacion_txt}</strong>
                </div>
            </article>
        `;
    }).join("");
}

function renderLecturaProduccion(){
    if(!produccionLectura) return;
    const indicadores = datosProduccionPolicial?.indicadores || [];
    const avances = indicadores.filter((fila) => Number(fila.variacion) > 0).length;
    const brechas = indicadores.filter((fila) => Number(fila.variacion) < 0).length;
    const dinero = buscarIndicadorProduccion("Dinero incautado");
    const operativos = buscarIndicadorProduccion("Operativos");
    const principalAvance = (datosProduccionPolicial?.avances || [])[0];
    const principalBrecha = (datosProduccionPolicial?.brechas || [])[0];
    const estabilidad = indicadores.length ? Math.round((avances / indicadores.length) * 100) : 0;

    produccionLectura.innerHTML = `
        <div class="production-reading-card">
            <span>Pulso operativo</span>
            <strong>${estabilidad}%</strong>
            <small>${avances} indicadores en avance y ${brechas} en descenso frente a 2025.</small>
        </div>
        <div class="production-reading-note">
            <i class="fas fa-circle-info"></i>
            <p>Esta pestaña mide <b>produccion policial</b>, no incidencia delictiva. El corte proviene del PDF diario y resume actividad operativa acumulada nacional.</p>
        </div>
        <div class="production-reading-note compact">
            <i class="fas fa-arrow-trend-up"></i>
            <p>Mayor avance: <b>${principalAvance ? principalAvance.indicador : "Sin dato"}</b>${principalAvance ? ` (${principalAvance.variacion_txt})` : ""}.</p>
        </div>
        <div class="production-reading-note compact danger">
            <i class="fas fa-triangle-exclamation"></i>
            <p>Mayor brecha: <b>${principalBrecha ? principalBrecha.indicador : "Sin dato"}</b>${principalBrecha ? ` (${principalBrecha.variacion_txt})` : ""}.</p>
        </div>
        <div class="production-reading-note compact">
            <i class="fas fa-chart-column"></i>
            <p>Operativos: <b>${operativos ? operativos.valor_2026_txt : "Sin dato"}</b>. Dinero incautado: <b>${dinero ? dinero.valor_2026_txt : "Sin dato"}</b>.</p>
        </div>
    `;
}

function renderTablaProduccion(){
    if(!produccionTabla) return;
    const filas = datosProduccionPolicial?.indicadores || [];
    if(!filas.length){
        produccionTabla.innerHTML = `<tr><td colspan="5">Sin indicadores disponibles</td></tr>`;
        return;
    }
    produccionTabla.innerHTML = filas.map((fila) => {
        const variacion = Number(fila.variacion) || 0;
        const clase = variacion >= 0 ? "positive" : "negative";
        const porcentaje = Number(fila.variacion_pct) || 0;
        return `
            <tr>
                <td>${fila.indicador}</td>
                <td>${fila.valor_2025_txt}</td>
                <td>${fila.valor_2026_txt}</td>
                <td class="${clase}">${fila.variacion_txt}</td>
                <td class="${clase}">${porcentaje >= 0 ? "+" : ""}${porcentaje.toFixed(1)}%</td>
            </tr>
        `;
    }).join("");
}

function renderProduccionPolicial(){
    if(!datosProduccionPolicial){
        [produccionBarras, produccionAvances, produccionBrechas].forEach((contenedor) => {
            if(contenedor) renderEstadoVacio(contenedor, "No se pudo cargar produccion policial");
        });
        return;
    }

    if(produccionPeriodo) produccionPeriodo.textContent = datosProduccionPolicial.periodo || "Periodo no identificado";
    if(produccionReporte) produccionReporte.textContent = datosProduccionPolicial.reporte || "Sin fecha";
    if(produccionReporteTop) produccionReporteTop.textContent = datosProduccionPolicial.reporte || "Sin fecha";

    pintarKpiProduccion(buscarIndicadorProduccion("Operativos"), prodOperativos, prodOperativosVar);
    pintarKpiProduccion(buscarIndicadorProduccion("Dinero incautado"), prodDinero, prodDineroVar);
    pintarKpiProduccion(buscarIndicadorProduccion("Bandas criminales desarticuladas"), prodBandas, prodBandasVar);
    pintarKpiProduccion(buscarIndicadorProduccion("Captura de requisitoriados"), prodRequisitoriados, prodRequisitoriadosVar);

    renderResumenProduccion();
    renderDashboardVisualProduccion();
    renderBarrasProduccion();
    renderRankingProduccion(produccionAvances, datosProduccionPolicial.avances, "Sin avances frente al periodo anterior");
    renderRankingProduccion(produccionBrechas, datosProduccionPolicial.brechas, "Sin brechas frente al periodo anterior");
    renderMosaicoProduccion();
    renderLecturaProduccion();
    renderTablaProduccion();
}

async function cargarProduccionPolicial(){
    try{
        if(!produccionPolicialCargada){
            datosProduccionPolicial = await cargarJson(`data/api/produccion_policial.json?v=${Date.now()}`);
            produccionPolicialCargada = true;
        }
        renderProduccionPolicial();
    }catch(error){
        console.error(error);
        datosProduccionPolicial = null;
        renderProduccionPolicial();
    }
}

function activarVista(vista){
    vistaActual = vista;
    const vistaPolicial = ["denuncias-comisaria", "hechos-jurisdiccion"].includes(vista);
    const ocultarContextoSidpol = ["produccion-policial", "comparador-delitos"].includes(vista);
    sidpolContextSections.forEach((section) => section.classList.toggle("is-hidden", ocultarContextoSidpol));
    sidpolSummaryCards.forEach((section) => {
        section.classList.toggle("is-hidden", vista !== "inicio");
    });
    if(vistaPolicial){
        modoPolicial = vista === "hechos-jurisdiccion" ? "hecho" : "registro";
        configurarModoPolicial();
    }
    menuItems.forEach((item) => item.classList.toggle("active", item.dataset.view === vista));

    const mostrarMapaDelito = ["inicio", "mapa-delito"].includes(vista);
    const mostrarAnalytics = vista === "inicio";
    const mostrarDetalle = vista === "inicio";
    const mostrarEjecutivo = vista === "inicio";

    viewSections.forEach((section) => {
        const nombre = section.dataset.section;
        const visible =
            (nombre === "mapa-delito" && mostrarMapaDelito) ||
            (nombre === "mapa-calor" && vista === "mapa-calor") ||
            (nombre === "regiones-policiales" && vistaPolicial) ||
            (nombre === "mapa-alertas" && vista === "alertas") ||
            (nombre === "analisis-temporal" && vista === "analisis-temporal") ||
            (nombre === "comparador-delitos" && vista === "comparador-delitos") ||
            (nombre === "analisis-predictivo" && vista === "analisis-predictivo") ||
            (nombre === "produccion-policial" && vista === "produccion-policial") ||
            (nombre === "dashboard-estrategico" && vista === "dashboard") ||
            (nombre === "executive" && mostrarEjecutivo) ||
            (nombre === "analytics" && mostrarAnalytics) ||
            (nombre === "detalle" && mostrarDetalle);

        section.classList.toggle("is-hidden", !visible);
    });

    if(vista === "mapa-calor"){
        cargarMapaCalor();
    }else if(vista === "dashboard"){
        renderDashboardEstrategico();
    }else if(vistaPolicial){
        cargarMapaPolicial();
    }else if(vista === "alertas"){
        cargarMapaAlertas();
    }else if(vista === "analisis-temporal"){
        cargarAnaliticaTemporal();
    }else if(vista === "comparador-delitos"){
        renderComparadorBianual();
    }else if(vista === "analisis-predictivo"){
        cargarAnalisisPredictivo();
    }else if(vista === "produccion-policial"){
        cargarProduccionPolicial();
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
    filtros.dia.value = "";
    filtros.fechaDesde.value = "";
    filtros.fechaHasta.value = "";
    filtros.departamento.value = "";
    filtros.provincia.value = "";
    filtros.distrito.value = "";
    filtros.delito.value = "";
    filtroRegionPolicial.value = "";
    filtroComisariaPolicial.value = "";
    if(policialCargado) llenarComisariasPoliciales();
    actualizarDashboard(true);
    mapa.setView(vistaPeru.centro, vistaPeru.zoom);
    if(["denuncias-comisaria", "hechos-jurisdiccion"].includes(vistaActual) && policialCargado){
        renderMapaPolicial();
    }
}

Object.values(filtros).forEach((select) => {
    select.addEventListener("change", async () => {
        if(fechasActivas() || filtros.dia.value){
            await cargarDatosDiarios();
        }
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
        }else if(["denuncias-comisaria", "hechos-jurisdiccion"].includes(vistaActual)){
            await cargarModalidadesModoPolicial();
            renderMapaPolicial();
        }else if(vistaActual === "alertas"){
            renderMapaAlertas();
        }else if(vistaActual === "analisis-temporal" && analiticaTemporalCargada){
            renderAnaliticaTemporal();
        }else if(vistaActual === "analisis-predictivo"){
            await cargarAnalisisPredictivo();
        }
    });
});

Object.entries(filtrosDashboard).forEach(([clave, selectDashboard]) => {
    if(!selectDashboard || !filtros[clave]) return;
    selectDashboard.addEventListener("change", () => {
        filtros[clave].value = selectDashboard.value;
        filtros[clave].dispatchEvent(new Event("change", { bubbles: true }));
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

document.getElementById("btnPolicialPeru").addEventListener("click", () => {
    if(!mapaPolicial) return;
    filtroRegionPolicial.value = "";
    filtroComisariaPolicial.value = "";
    llenarComisariasPoliciales();
    renderMapaPolicial();
    mapaPolicial.setView(vistaPeru.centro, vistaPeru.zoom);
});

filtroRegionPolicial.addEventListener("change", () => {
    filtroComisariaPolicial.value = "";
    llenarComisariasPoliciales();
    renderMapaPolicial();
});

filtroComisariaPolicial.addEventListener("change", () => renderMapaPolicial());

[filtroHorizontePredictivo, filtroEscenarioPredictivo].filter(Boolean).forEach((select) => {
    select.addEventListener("change", () => {
        if(vistaActual === "analisis-predictivo") renderAnalisisPredictivo();
    });
});

[comparadorAnioBase, comparadorAnioComparado, comparadorMesInicio, comparadorMesFin, comparadorDelito].filter(Boolean).forEach((select) => {
    select.addEventListener("change", renderComparadorBianual);
});

if(btnDescargarComparadorPdf){
    btnDescargarComparadorPdf.addEventListener("click", descargarComparadorPdf);
}

if(btnDescargarComparadorCsv){
    btnDescargarComparadorCsv.addEventListener("click", descargarComparadorCsv);
}

if(btnDescargarComparadorPng){
    btnDescargarComparadorPng.addEventListener("click", descargarComparadorPng);
}

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
    const label = item.querySelector("span")?.textContent?.trim() || item.dataset.view;
    item.dataset.label = label;
    item.addEventListener("click", () => activarVista(item.dataset.view));
});

if(btnToggleSidebar){
    aplicarEstadoSidebar(localStorage.getItem("sidebarColapsado") === "1");
    btnToggleSidebar.addEventListener("click", () => {
        aplicarEstadoSidebar(!document.body.classList.contains("sidebar-collapsed"));
    });
}

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
    inicializarComparadorBianual();

    statusDot.classList.add("ready");
    pintarEstadoDatos(datosTerritorio.length, metadata);
    actualizarDashboard(true);
    activarVista("inicio");
}).catch((error) => {
    estadoDatos.textContent = "No se pudieron cargar los datos";
    console.error(error);
});
