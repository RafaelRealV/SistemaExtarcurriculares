

document.addEventListener("DOMContentLoaded", function () {
    cargarEstadisticas();
    cargarDestacadas();
    actualizarNavegacion();
});

// ─── ESTADÍSTICAS ───────────────────────────────

function cargarEstadisticas() {
    const stats = getEstadisticas();

    const elAct  = document.getElementById("total-actividades");
    const elIns  = document.getElementById("total-inscritos");
    const elOrg  = document.getElementById("total-organizadores");

    if (elAct) animarNumero(elAct, stats.totalActividades);
    if (elIns) animarNumero(elIns, stats.totalInscritos);
    if (elOrg) animarNumero(elOrg, stats.totalOrganizadores);
}

// Cuenta animada del 0 al número destino
function animarNumero(elemento, destino) {
    let actual = 0;
    const paso = Math.ceil(destino / 30);
    const intervalo = setInterval(function () {
        actual += paso;
        if (actual >= destino) {
            actual = destino;
            clearInterval(intervalo);
        }
        elemento.textContent = actual;
    }, 40);
}

// ─── ACTIVIDADES DESTACADAS ─────────────────────

function cargarDestacadas() {
    const contenedor = document.getElementById("destacadas-content");
    if (!contenedor) return;

    const actividades   = getActividades().filter(a => a.activa !== false);
    const sesion        = getSesion();

    // Mostrar máximo 4 actividades en el inicio
    const destacadas = actividades.slice(0, 3);

    if (destacadas.length === 0) {
        contenedor.innerHTML = '<p style="color:#aaa;text-align:center;padding:30px;">No hay actividades disponibles.</p>';
        return;
    }

    contenedor.innerHTML = destacadas.map(function (act) {
        return crearTarjetaHTML(act, sesion);
    }).join("");

    // Eventos de inscripción
    contenedor.querySelectorAll(".inscribirse-btn[data-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            manejarInscripcion(parseInt(btn.dataset.id), btn);
        });
    });
}

// ─── TARJETA HTML ───────────────────────────────

function crearTarjetaHTML(act, sesion) {
    const inscritos   = getInscritosPorActividad(act.id).length;
    const cuposLibres = act.cupo - inscritos;
    const lleno       = cuposLibres <= 0;
    const yaInscrito  = sesion && estaInscrito(sesion.id, act.id);
    const categoria   = act.categoria || "default";
    const emoji       = act.emoji || "📌";

    let badgeHTML = lleno
        ? '<span class="cupos-badge lleno">Lleno</span>'
        : '<span class="cupos-badge">' + cuposLibres + ' cupos</span>';

    let btnHTML;
    if (!sesion) {
        btnHTML = '<a href="login.html" class="inscribirse-btn">Inicia sesión para inscribirte</a>';
    } else if (sesion.rol === "organizador" || sesion.rol === "administrador") {
        btnHTML = '<a href="organizador.html" class="inscribirse-btn">Gestionar actividad</a>';
    } else if (yaInscrito) {
        btnHTML = '<button class="inscribirse-btn inscrito" data-id="' + act.id + '">✓ Inscrito — Cancelar</button>';
    } else if (lleno) {
        btnHTML = '<button class="inscribirse-btn lleno" disabled>Sin cupos</button>';
    } else {
        btnHTML = '<button class="inscribirse-btn" data-id="' + act.id + '">Inscribirme</button>';
    }

    return (
        '<div class="card">' +
            '<div class="card-banner ' + categoria + '">' +
                emoji + badgeHTML +
            '</div>' +
            '<div class="card-body">' +
                '<span class="card-tag">' + capitalize(categoria) + '</span>' +
                '<div class="card-title">' + act.nombre + '</div>' +
                '<div class="card-meta">' +
                    (act.dias ? '<span>📅 ' + act.dias + '</span>' : '') +
                    (act.hora ? '<span>🕓 ' + act.hora + '</span>' : '') +
                '</div>' +
                btnHTML +
            '</div>' +
        '</div>'
    );
}

// ─── INSCRIPCIÓN DESDE INICIO ───────────────────

function manejarInscripcion(idActividad, btn) {
    const sesion = getSesion();
    if (!sesion) {
        window.location.href = "login.html";
        return;
    }

    // Si ya estaba inscrito → cancelar
    if (estaInscrito(sesion.id, idActividad)) {
        if (confirm("¿Deseas cancelar tu inscripción?")) {
            cancelarInscripcion(sesion.id, idActividad);
            mostrarToast("Inscripción cancelada.", "info");
            cargarDestacadas();
            cargarEstadisticas();
        }
        return;
    }

    const resultado = inscribir(sesion.id, idActividad);
    if (resultado.ok) {
        mostrarToast(resultado.mensaje, "ok");
        cargarDestacadas();
        cargarEstadisticas();
    } else {
        mostrarToast(resultado.mensaje, "error");
    }
}

// ─── NAVEGACIÓN SEGÚN SESIÓN ────────────────────

function actualizarNavegacion() {
    const sesion = getSesion();
    const nav    = document.querySelector("nav");
    if (!nav) return;

    if (sesion) {
        // Reemplaza "Iniciar Sesión" por el nombre + cerrar sesión
        const linkLogin = nav.querySelector('a[href="login.html"]');
        if (linkLogin) {
            linkLogin.textContent = sesion.nombre.split(" ")[0];
            linkLogin.href = sesion.rol === "alumno" ? "perfil.html" : "organizador.html";
        }
    }
}

// ─── TOAST (notificación flotante) ──────────────

function mostrarToast(mensaje, tipo) {
    // Eliminar toast anterior si existe
    const anterior = document.getElementById("toast-notif");
    if (anterior) anterior.remove();

    const colores = {
        ok:    "#2d7a4f",
        error: "#d9534f",
        info:  "#5b8dd9"
    };

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

    // Animar entrada
    requestAnimationFrame(function () {
        toast.style.opacity   = "1";
        toast.style.transform = "translateY(0)";
    });

    // Animar salida
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