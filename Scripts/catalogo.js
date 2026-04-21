/* =============================================
   catalogo.js — Catálogo de actividades
   ============================================= */

let actividadesFiltradas = [];

document.addEventListener("DOMContentLoaded", function () {
    actualizarNavCatalogo();
    cargarCatalogo();
    iniciarFiltros();
    iniciarBuscador();
});

// ─── CARGAR CATÁLOGO ────────────────────────────

function cargarCatalogo(filtroCategoria, textoBusqueda) {
    const contenedor = document.getElementById("catalogo");
    const conteo     = document.getElementById("conteo");
    const sinRes     = document.getElementById("sin-resultados");
    if (!contenedor) return;

    const sesion      = getSesion();
    let actividades   = getActividades().filter(a => a.activa !== false);

    // Filtrar por categoría
    if (filtroCategoria && filtroCategoria !== "todas") {
        actividades = actividades.filter(a => a.categoria === filtroCategoria);
    }

    // Filtrar por texto
    if (textoBusqueda && textoBusqueda.trim() !== "") {
        const texto = textoBusqueda.trim().toLowerCase();
        actividades = actividades.filter(a =>
            a.nombre.toLowerCase().includes(texto) ||
            (a.descripcion && a.descripcion.toLowerCase().includes(texto)) ||
            (a.categoria && a.categoria.toLowerCase().includes(texto))
        );
    }

    actividadesFiltradas = actividades;

    // Actualizar conteo
    if (conteo) {
        conteo.textContent = actividades.length + " actividad" +
            (actividades.length !== 1 ? "es" : "") + " disponible" +
            (actividades.length !== 1 ? "s" : "") + " · Semestre 2026";
    }

    // Sin resultados
    if (actividades.length === 0) {
        contenedor.innerHTML = "";
        if (sinRes) sinRes.style.display = "block";
        return;
    }

    if (sinRes) sinRes.style.display = "none";

    contenedor.innerHTML = actividades.map(function (act) {
        return crearTarjetaCatalogoHTML(act, sesion);
    }).join("");

    // Eventos en botones de inscripción
    contenedor.querySelectorAll(".inscribirse-btn[data-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            manejarInscripcionCatalogo(parseInt(btn.dataset.id), btn);
        });
    });
}

// ─── TARJETA HTML CATÁLOGO ──────────────────────

function crearTarjetaCatalogoHTML(act, sesion) {
    const inscritos   = getInscritosPorActividad(act.id).length;
    const cuposLibres = act.cupo - inscritos;
    const lleno       = cuposLibres <= 0;
    const yaInscrito  = sesion && estaInscrito(sesion.id, act.id);
    const categoria   = act.categoria || "default";
    const emoji       = act.emoji || "📌";

    const badgeHTML = lleno
        ? '<span class="cupos-badge lleno">Lleno</span>'
        : '<span class="cupos-badge">' + cuposLibres + ' cupos</span>';

    let btnHTML;
    if (!sesion) {
        btnHTML = '<a href="login.html" class="inscribirse-btn">Inicia sesión</a>';
    } else if (sesion.rol === "organizador" || sesion.rol === "administrador") {
        btnHTML = '<a href="organizador.html" class="inscribirse-btn">Gestionar</a>';
    } else if (yaInscrito) {
        btnHTML = '<button class="inscribirse-btn inscrito" data-id="' + act.id + '">✓ Inscrito — Cancelar</button>';
    } else if (lleno) {
        btnHTML = '<button class="inscribirse-btn lleno" disabled>Sin cupos</button>';
    } else {
        btnHTML = '<button class="inscribirse-btn" data-id="' + act.id + '">Inscribirme</button>';
    }

    // Barra de progreso de cupos
    const porcentaje = Math.min(Math.round((inscritos / act.cupo) * 100), 100);
    const barColor   = porcentaje >= 100 ? "#aaa" : porcentaje >= 75 ? "#e07b2a" : "#4caf7d";

    const barraHTML =
        '<div style="margin-bottom:12px;">' +
            '<div style="display:flex;justify-content:space-between;font-size:11px;color:#aaa;margin-bottom:4px;">' +
                '<span>' + inscritos + ' / ' + act.cupo + ' inscritos</span>' +
                '<span>' + porcentaje + '%</span>' +
            '</div>' +
            '<div style="height:5px;background:#f0f0f0;border-radius:10px;overflow:hidden;">' +
                '<div style="height:100%;width:' + porcentaje + '%;background:' + barColor + ';border-radius:10px;transition:width .4s;"></div>' +
            '</div>' +
        '</div>';

    return (
        '<div class="card">' +
            '<div class="card-banner ' + categoria + '">' +
                emoji + badgeHTML +
            '</div>' +
            '<div class="card-body">' +
                '<span class="card-tag">' + capitalize(categoria) + '</span>' +
                '<div class="card-title">' + act.nombre + '</div>' +
                (act.descripcion
                    ? '<div class="card-desc">' + act.descripcion + '</div>'
                    : '') +
                '<div class="card-meta">' +
                    (act.dias ? '<span>📅 ' + act.dias + '</span>' : '') +
                    (act.hora ? '<span>🕓 ' + act.hora + '</span>' : '') +
                '</div>' +
                barraHTML +
                btnHTML +
            '</div>' +
        '</div>'
    );
}

// ─── INSCRIPCIÓN DESDE CATÁLOGO ─────────────────

function manejarInscripcionCatalogo(idActividad, btn) {
    const sesion = getSesion();
    if (!sesion) {
        window.location.href = "login.html";
        return;
    }

    // Si ya estaba inscrito → cancelar
    if (estaInscrito(sesion.id, idActividad)) {
        if (confirm("¿Deseas cancelar tu inscripción en esta actividad?")) {
            cancelarInscripcion(sesion.id, idActividad);
            mostrarToast("Inscripción cancelada.", "info");
            refrescarCatalogo();
        }
        return;
    }

    const resultado = inscribir(sesion.id, idActividad);
    if (resultado.ok) {
        mostrarToast(resultado.mensaje, "ok");
        refrescarCatalogo();
    } else {
        mostrarToast(resultado.mensaje, "error");
    }
}

// Recarga con los filtros actuales
function refrescarCatalogo() {
    const catActivo = document.querySelector(".filter-btn.active");
    const busqueda  = document.getElementById("buscador");
    cargarCatalogo(
        catActivo ? catActivo.dataset.cat : "todas",
        busqueda   ? busqueda.value : ""
    );
}

// ─── FILTROS POR CATEGORÍA ──────────────────────

function iniciarFiltros() {
    const botones = document.querySelectorAll(".filter-btn");
    botones.forEach(function (btn) {
        btn.addEventListener("click", function () {
            botones.forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");
            refrescarCatalogo();
        });
    });
}

// ─── BUSCADOR ───────────────────────────────────

function iniciarBuscador() {
    const input = document.getElementById("buscador");
    if (!input) return;

    let timer;
    input.addEventListener("input", function () {
        clearTimeout(timer);
        // Pequeño delay para no buscar en cada letra
        timer = setTimeout(function () {
            refrescarCatalogo();
        }, 250);
    });
}

// ─── NAVEGACIÓN SEGÚN SESIÓN ────────────────────

function actualizarNavCatalogo() {
    const sesion = getSesion();
    const nav    = document.querySelector("nav");
    if (!nav || !sesion) return;

    const linkCta = nav.querySelector("a.cta");
    if (linkCta) {
        linkCta.textContent = sesion.nombre.split(" ")[0];
        linkCta.href = sesion.rol === "alumno" ? "perfil.html" : "organizador.html";
    }
}

// ─── TOAST ──────────────────────────────────────

function mostrarToast(mensaje, tipo) {
    const anterior = document.getElementById("toast-notif");
    if (anterior) anterior.remove();

    const colores = { ok: "#2d7a4f", error: "#d9534f", info: "#5b8dd9" };

    const toast = document.createElement("div");
    toast.id = "toast-notif";
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position:     "fixed",
        bottom:       "28px",
        right:        "28px",
        background:   colores[tipo] || colores.info,
        color:        "#fff",
        fontFamily:   "'Nunito', sans-serif",
        fontWeight:   "700",
        fontSize:     "14px",
        padding:      "14px 22px",
        borderRadius: "12px",
        boxShadow:    "0 4px 18px rgba(0,0,0,0.18)",
        zIndex:       "9999",
        opacity:      "0",
        transform:    "translateY(10px)",
        transition:   "all 0.3s ease"
    });

    document.body.appendChild(toast);
    requestAnimationFrame(function () {
        toast.style.opacity   = "1";
        toast.style.transform = "translateY(0)";
    });
    setTimeout(function () {
        toast.style.opacity   = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

// ─── UTILIDADES ─────────────────────────────────

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}