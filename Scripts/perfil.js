/* =============================================
   perfil.js — Página de perfil del alumno
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    // Proteger la página: si no hay sesión, redirigir al login
    if (!requiereLogin()) return;

    const sesion = getSesion();

    cargarDatosPerfil(sesion);
    cargarActividadesInscritas(sesion);
    cargarAsistencias(sesion);
    llenarFormEdicion(sesion);
    iniciarTabs();
    iniciarFormEdicion(sesion);
    iniciarTogglePasswords();

    // Botón "Editar perfil" de la tarjeta abre el tab de edición
    const btnEditar = document.getElementById("btn-editar-perfil");
    if (btnEditar) {
        btnEditar.addEventListener("click", function () {
            activarTab("editar");
        });
    }
});

// ─── DATOS DEL PERFIL ───────────────────────────

function cargarDatosPerfil(sesion) {
    // Avatar con inicial del nombre
    const avatar = document.getElementById("avatar-inicial");
    if (avatar) avatar.textContent = sesion.nombre.charAt(0).toUpperCase();

    setText("perfil-nombre",    sesion.nombre);
    setText("perfil-rol",       capitalizeRol(sesion.rol));
    setText("perfil-matricula", "Matrícula: " + (sesion.matricula || "—"));

    // Stats
    const inscritas   = getInscripcionesPorAlumno(sesion.id).length;
    const asistencias = getAsistencias().filter(
        a => a.id_alumno === sesion.id && a.presente === true
    ).length;

    setText("stat-inscritas",   inscritas);
    setText("stat-asistencias", asistencias);
}

// ─── ACTIVIDADES INSCRITAS ──────────────────────

function cargarActividadesInscritas(sesion) {
    const contenedor = document.getElementById("lista-actividades");
    if (!contenedor) return;

    const inscripciones = getInscripcionesPorAlumno(sesion.id);

    if (inscripciones.length === 0) {
        contenedor.innerHTML =
            '<div class="vacio">' +
                '<span>📋</span>' +
                '<p>Aún no estás inscrito en ninguna actividad.<br>' +
                '<a href="catalogo.html">Ver catálogo de actividades</a></p>' +
            '</div>';
        return;
    }

    contenedor.innerHTML = inscripciones.map(function (ins) {
        const act = getActividadPorId(ins.id_actividad);
        if (!act) return "";

        const categoria = act.categoria || "default";
        const emoji     = act.emoji || "📌";
        const fecha     = new Date(ins.fecha).toLocaleDateString("es-MX", {
            year: "numeric", month: "long", day: "numeric"
        });

        return (
            '<div class="act-item">' +
                '<div class="act-emoji ' + categoria + '">' + emoji + '</div>' +
                '<div class="act-info">' +
                    '<span class="act-tag">' + capitalize(categoria) + '</span>' +
                    '<div class="act-nombre">' + act.nombre + '</div>' +
                    '<div class="act-meta">' +
                        (act.dias ? '<span>📅 ' + act.dias + '</span>' : '') +
                        (act.hora ? '<span>🕓 ' + act.hora + '</span>' : '') +
                        '<span>Inscrito el ' + fecha + '</span>' +
                    '</div>' +
                '</div>' +
                '<button class="btn-cancelar-ins" data-id="' + act.id + '">Cancelar inscripción</button>' +
            '</div>'
        );
    }).join("");

    // Eventos cancelar inscripción
    contenedor.querySelectorAll(".btn-cancelar-ins").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const idActividad = parseInt(btn.dataset.id);
            const act = getActividadPorId(idActividad);
            if (!confirm('¿Deseas cancelar tu inscripción en "' + (act ? act.nombre : "esta actividad") + '"?')) return;

            cancelarInscripcion(sesion.id, idActividad);
            mostrarToast("Inscripción cancelada.", "info");
            cargarActividadesInscritas(sesion);
            cargarDatosPerfil(sesion);
        });
    });
}

// ─── HISTORIAL DE ASISTENCIAS ───────────────────

function cargarAsistencias(sesion) {
    const contenedor = document.getElementById("lista-asistencias");
    if (!contenedor) return;

    const inscripciones = getInscripcionesPorAlumno(sesion.id);

    if (inscripciones.length === 0) {
        contenedor.innerHTML =
            '<div class="vacio"><span>✅</span><p>Aún no hay registros de asistencia.</p></div>';
        return;
    }

    // Agrupar asistencias por actividad
    let html = "";
    let hayRegistros = false;

    inscripciones.forEach(function (ins) {
        const act = getActividadPorId(ins.id_actividad);
        if (!act) return;

        const registros = getAsistencias().filter(
            a => a.id_actividad === ins.id_actividad && a.id_alumno === sesion.id
        );

        if (registros.length === 0) return;
        hayRegistros = true;

        const presentes = registros.filter(r => r.presente).length;
        const pct       = Math.round((presentes / registros.length) * 100);

        html +=
            '<div class="asist-grupo">' +
                '<div class="asist-grupo-header">' +
                    '<span class="asist-grupo-nombre">' + (act.emoji || "📌") + ' ' + act.nombre + '</span>' +
                    '<span class="asist-pct">' + pct + '% asistencia</span>' +
                '</div>';

        // Ordenar por fecha descendente
        registros.sort(function (a, b) {
            return new Date(b.fecha) - new Date(a.fecha);
        });

        registros.forEach(function (r) {
            const fecha = new Date(r.fecha).toLocaleDateString("es-MX", {
                weekday: "long", year: "numeric", month: "long", day: "numeric"
            });
            html +=
                '<div class="asist-fila">' +
                    '<span class="asist-fecha">📅 ' + capitalize(fecha) + '</span>' +
                    (r.presente
                        ? '<span class="badge-presente">✓ Presente</span>'
                        : '<span class="badge-ausente">✗ Ausente</span>') +
                '</div>';
        });

        html += '</div>';
    });

    if (!hayRegistros) {
        contenedor.innerHTML =
            '<div class="vacio"><span>✅</span><p>Aún no hay registros de asistencia.</p></div>';
        return;
    }

    contenedor.innerHTML = html;
}

// ─── FORMULARIO DE EDICIÓN ──────────────────────

function llenarFormEdicion(sesion) {
    setVal("edit-nombre",    sesion.nombre);
    setVal("edit-correo",    sesion.correo);
    setVal("edit-matricula", sesion.matricula || "");
}

function iniciarFormEdicion(sesion) {
    const form = document.getElementById("form-editar");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        limpiarErroresEdicion();

        const nombre    = document.getElementById("edit-nombre").value.trim();
        const correo    = document.getElementById("edit-correo").value.trim();
        const pass1     = document.getElementById("edit-password").value;
        const pass2     = document.getElementById("edit-password2").value;

        let hayError = false;

        if (!nombre) {
            setError("err-nombre", "El nombre no puede estar vacío.");
            hayError = true;
        }

        if (!correo || !correo.includes("@")) {
            setError("err-correo", "Ingresa un correo válido.");
            hayError = true;
        }

        if (pass1 && pass1.length < 4) {
            setError("err-password", "La contraseña debe tener al menos 4 caracteres.");
            hayError = true;
        }

        if (pass1 && pass1 !== pass2) {
            setError("err-password2", "Las contraseñas no coinciden.");
            hayError = true;
        }

        if (hayError) return;

        // Actualizar en localStorage
        const usuarios = getUsuarios();
        const idx = usuarios.findIndex(u => u.id === sesion.id);
        if (idx === -1) return;

        usuarios[idx].nombre = nombre;
        usuarios[idx].correo = correo;
        if (pass1) usuarios[idx].password = pass1;

        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        // Actualizar sesión activa
        const sesionActualizada = Object.assign({}, sesion, {
            nombre: nombre,
            correo: correo
        });
        guardarSesion(sesionActualizada);

        mostrarToast("¡Datos actualizados correctamente!", "ok");
        cargarDatosPerfil(sesionActualizada);

        // Limpiar campos de contraseña
        document.getElementById("edit-password").value  = "";
        document.getElementById("edit-password2").value = "";
    });

    // Botón cancelar → volver a actividades
    const btnCancelar = document.getElementById("btn-cancelar-editar");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", function () {
            llenarFormEdicion(getSesion());
            limpiarErroresEdicion();
            activarTab("actividades");
        });
    }
}

function limpiarErroresEdicion() {
    ["err-nombre", "err-correo", "err-password", "err-password2"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

// ─── TOGGLE CONTRASEÑAS ─────────────────────────

function iniciarTogglePasswords() {
    configurarToggle("toggle-pass-perfil",  "edit-password");
    configurarToggle("toggle-pass2-perfil", "edit-password2");
}

function configurarToggle(btnId, inputId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", function () {
        const esPass = input.type === "password";
        input.type   = esPass ? "text" : "password";
        btn.textContent = esPass ? "🙈" : "👁";
    });
}

// ─── SISTEMA DE TABS ────────────────────────────

function iniciarTabs() {
    document.querySelectorAll(".pnav-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            activarTab(btn.dataset.tab);
        });
    });
}

function activarTab(tabId) {
    // Botones del nav
    document.querySelectorAll(".pnav-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.tab === tabId);
    });

    // Paneles
    document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("active", p.id === "tab-" + tabId);
    });
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
        boxShadow:    "0 4px 18px rgba(0,0,0,.18)",
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
    }, 3200);
}

// ─── UTILIDADES ─────────────────────────────────

function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function setVal(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor;
}

function setError(id, mensaje) {
    const el = document.getElementById(id);
    if (el) el.textContent = mensaje;
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeRol(rol) {
    const roles = {
        alumno:          "Alumno",
        organizador:     "Organizador",
        administrador:   "Administrador"
    };
    return roles[rol] || capitalize(rol);
}