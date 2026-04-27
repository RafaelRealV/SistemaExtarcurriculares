/* =============================================
   panel_admin.js — Panel Administrador
   Puede: gestionar actividades, organizadores,
   alumnos y ver reportes globales.
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    // Proteger: solo administrador
    const sesion = getSesion();
    if (sesion.rol !== "administrador") {
        alert("Acceso no autorizado.");
        window.location.href = "login.html";
        return;
    }

    // Datos en sidebar
    document.getElementById("sb-avatar").textContent = sesion.nombre.charAt(0).toUpperCase();
    document.getElementById("sb-nombre").textContent = sesion.nombre;

    // Cargar datos iniciales
    cargarOrganizadores();
    mostrarActividades();
    mostrarOrganizadores();
    mostrarAlumnos();
    cargarSelectReporte();
    cargarStatsGlobales();

    // Sistema de tabs
    document.querySelectorAll(".snav-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".snav-btn").forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");

            const sec = btn.dataset.seccion;
            document.querySelectorAll(".seccion").forEach(function (s) { s.classList.remove("active"); });
            document.getElementById("sec-" + sec).classList.add("active");

            const titulos = {
                actividades:   ["Actividades",        "Gestiona las actividades extracurriculares"],
                organizadores: ["Organizadores",      "Administra a los organizadores del sistema"],
                alumnos:       ["Alumnos",            "Administra a los alumnos registrados"],
                reportes:      ["Reportes globales",  "Estadísticas generales de todo el sistema"]
            };
            if (titulos[sec]) {
                document.getElementById("titulo-seccion").textContent = titulos[sec][0];
                document.getElementById("sub-seccion").textContent    = titulos[sec][1];
            }

            if (sec === "reportes") {
                cargarStatsGlobales();
                cargarSelectReporte();
            }
        });
    });
});

/* ══════════════════════════════════════════
   ACTIVIDADES
══════════════════════════════════════════ */

function cargarOrganizadores() {
    const select = document.getElementById("organizador");
    if (!select) return;
    select.innerHTML = "";
    getUsuarios()
        .filter(function (u) { return u.rol === "organizador" || u.rol === "administrador"; })
        .forEach(function (org) {
            select.innerHTML += '<option value="' + org.id + '">' + org.nombre + '</option>';
        });
}

function mostrarActividades() {
    const contenedor = document.getElementById("divListado");
    if (!contenedor) return;
    const actividades = getActividades();

    if (actividades.length === 0) {
        contenedor.innerHTML = '<p class="lista-vacia">No hay actividades registradas.</p>';
        return;
    }

    const emojiPorCat = { deporte:"⚽", arte:"🎨", ciencia:"🔬", cultura:"🎭", musica:"🎸" };

    contenedor.innerHTML = actividades.map(function (act) {
        const org      = getUsuarioPorId(act.id_organizador);
        const inscritos = getInscritosPorActividad(act.id).length;
        const emoji    = act.emoji || emojiPorCat[act.categoria] || "📌";
        const cat      = act.categoria || "default";

        return (
            '<div class="item-fila">' +
                '<div class="item-emoji ' + cat + '">' + emoji + '</div>' +
                '<div class="item-info">' +
                    '<div class="item-nombre">' + act.nombre + '</div>' +
                    '<div class="item-meta">' +
                        '<span class="item-tag">' + capitalize(cat) + '</span> · ' +
                        inscritos + '/' + act.cupo + ' inscritos' +
                        (org ? ' · ' + org.nombre : '') +
                    '</div>' +
                '</div>' +
                '<div class="item-acciones">' +
                    '<button class="btn-editar-item"   onclick="editarActividad('  + act.id + ')">Editar</button>' +
                    '<button class="btn-eliminar-item" onclick="eliminarActividad(' + act.id + ')">Eliminar</button>' +
                '</div>' +
            '</div>'
        );
    }).join("");
}

function guardarActividad() {
    let actividades   = getActividades();
    const id          = document.getElementById("idActividad").value;
    const nombre      = document.getElementById("nombre").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const cupo        = parseInt(document.getElementById("cupo").value);
    const organizador = parseInt(document.getElementById("organizador").value);
    const categoria   = document.getElementById("categoria").value;
    const dias        = document.getElementById("dias").value.trim();
    const hora        = document.getElementById("hora").value.trim();
    const emojiPorCat = { deporte:"⚽", arte:"🎨", ciencia:"🔬", cultura:"🎭", musica:"🎸" };

    if (!nombre || !descripcion || !cupo) {
        mostrarToast("Nombre, descripción y cupo son obligatorios.", "error");
        return;
    }

    if (id) {
        const act = actividades.find(function (a) { return a.id == id; });
        act.nombre = nombre; act.descripcion = descripcion; act.cupo = cupo;
        act.id_organizador = organizador; act.categoria = categoria;
        act.emoji = emojiPorCat[categoria] || "📌"; act.dias = dias; act.hora = hora;
        mostrarToast("Actividad actualizada.", "ok");
        document.getElementById("form-act-titulo").textContent = "➕ Nueva actividad";
    } else {
        actividades.push({
            id: generarId(actividades), nombre, descripcion, cupo,
            id_organizador: organizador, categoria,
            emoji: emojiPorCat[categoria] || "📌",
            dias, hora, activa: true
        });
        mostrarToast("Actividad creada.", "ok");
    }

    guardarActividades(actividades);
    limpiarFormulario();
    mostrarActividades();
    cargarSelectReporte();
}

function editarActividad(id) {
    const act = getActividadPorId(id);
    if (!act) return;
    document.getElementById("idActividad").value = act.id;
    document.getElementById("nombre").value      = act.nombre;
    document.getElementById("descripcion").value = act.descripcion;
    document.getElementById("cupo").value        = act.cupo;
    document.getElementById("organizador").value = act.id_organizador;
    document.getElementById("categoria").value   = act.categoria || "deporte";
    document.getElementById("dias").value        = act.dias || "";
    document.getElementById("hora").value        = act.hora || "";
    document.getElementById("form-act-titulo").textContent = "✏️ Editando actividad";
    activarSeccion("actividades");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function eliminarActividad(id) {
    const act = getActividadPorId(id);
    if (!confirm('¿Eliminar "' + (act ? act.nombre : "") + '"? También se borrarán sus inscripciones.')) return;
    guardarActividades(getActividades().filter(function (a) { return a.id !== id; }));
    guardarInscripciones(getInscripciones().filter(function (i) { return i.id_actividad !== id; }));
    mostrarToast("Actividad eliminada.", "info");
    mostrarActividades();
    cargarSelectReporte();
}

function limpiarFormulario() {
    ["idActividad","nombre","descripcion","cupo","dias","hora"].forEach(function (id) {
        document.getElementById(id).value = "";
    });
    document.getElementById("form-act-titulo").textContent = "➕ Nueva actividad";
}

/* ══════════════════════════════════════════
   ORGANIZADORES
══════════════════════════════════════════ */

function mostrarOrganizadores() {
    const contenedor = document.getElementById("divListadoOrg");
    if (!contenedor) return;
    const orgs = getUsuarios().filter(function (u) { return u.rol === "organizador"; });

    if (orgs.length === 0) {
        contenedor.innerHTML = '<p class="lista-vacia">No hay organizadores registrados.</p>';
        return;
    }

    contenedor.innerHTML = orgs.map(function (org) {
        const actCount = getActividadesPorOrganizador(org.id).length;
        return (
            '<div class="item-fila">' +
                '<div class="item-emoji user">👨‍🏫</div>' +
                '<div class="item-info">' +
                    '<div class="item-nombre">' + org.nombre + '</div>' +
                    '<div class="item-meta">' + (org.correo || "—") + ' · ' + actCount + ' actividad(es)</div>' +
                '</div>' +
                '<div class="item-acciones">' +
                    '<button class="btn-editar-item"   onclick="editarOrganizador('  + org.id + ')">Editar</button>' +
                    '<button class="btn-eliminar-item" onclick="eliminarOrganizador(' + org.id + ')">Eliminar</button>' +
                '</div>' +
            '</div>'
        );
    }).join("");
}

function guardarOrganizador() {
    let usuarios   = getUsuarios();
    const id       = document.getElementById("idOrganizador").value;
    const nombre   = document.getElementById("org-nombre").value.trim();
    const correo   = document.getElementById("org-correo").value.trim();
    const matricula= document.getElementById("org-matricula").value.trim();
    const password = document.getElementById("org-password").value;

    if (!nombre || !correo || !password) {
        mostrarToast("Nombre, correo y contraseña son obligatorios.", "error");
        return;
    }

    if (id) {
        const org = usuarios.find(function (u) { return u.id == id; });
        org.nombre = nombre; org.correo = correo; org.matricula = matricula;
        if (password) org.password = password;
        mostrarToast("Organizador actualizado.", "ok");
        document.getElementById("form-org-titulo").textContent = "➕ Nuevo organizador";
    } else {
        usuarios.push({ id: generarId(usuarios), nombre, correo, matricula, password, rol: "organizador" });
        mostrarToast("Organizador creado.", "ok");
    }

    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    limpiarFormularioOrganizador();
    mostrarOrganizadores();
    cargarOrganizadores();
}

function editarOrganizador(id) {
    const org = getUsuarioPorId(id);
    if (!org) return;
    document.getElementById("idOrganizador").value  = org.id;
    document.getElementById("org-nombre").value     = org.nombre;
    document.getElementById("org-correo").value     = org.correo || "";
    document.getElementById("org-matricula").value  = org.matricula || "";
    document.getElementById("org-password").value   = "";
    document.getElementById("form-org-titulo").textContent = "✏️ Editando organizador";
    activarSeccion("organizadores");
}

function eliminarOrganizador(id) {
    const org = getUsuarioPorId(id);
    if (!confirm('¿Eliminar al organizador "' + (org ? org.nombre : "") + '"?')) return;
    localStorage.setItem("usuarios", JSON.stringify(getUsuarios().filter(function (u) { return u.id !== id; })));
    mostrarToast("Organizador eliminado.", "info");
    mostrarOrganizadores();
    cargarOrganizadores();
}

function limpiarFormularioOrganizador() {
    ["idOrganizador","org-nombre","org-correo","org-matricula","org-password"].forEach(function (id) {
        document.getElementById(id).value = "";
    });
    document.getElementById("form-org-titulo").textContent = "➕ Nuevo organizador";
}

/* ══════════════════════════════════════════
   ALUMNOS
══════════════════════════════════════════ */

function mostrarAlumnos() {
    const contenedor = document.getElementById("divListadoAlm");
    if (!contenedor) return;
    const alumnos = getUsuarios().filter(function (u) { return u.rol === "alumno"; });

    if (alumnos.length === 0) {
        contenedor.innerHTML = '<p class="lista-vacia">No hay alumnos registrados.</p>';
        return;
    }

    contenedor.innerHTML = alumnos.map(function (a) {
        const inscCount = getInscripcionesPorAlumno(a.id).length;
        return (
            '<div class="item-fila">' +
                '<div class="item-emoji user">🎒</div>' +
                '<div class="item-info">' +
                    '<div class="item-nombre">' + a.nombre + '</div>' +
                    '<div class="item-meta">' + (a.matricula || a.correo || "—") + ' · ' + inscCount + ' inscripción(es)</div>' +
                '</div>' +
                '<div class="item-acciones">' +
                    '<button class="btn-editar-item"   onclick="editarAlumno('  + a.id + ')">Editar</button>' +
                    '<button class="btn-eliminar-item" onclick="eliminarAlumno(' + a.id + ')">Eliminar</button>' +
                '</div>' +
            '</div>'
        );
    }).join("");
}

function guardarAlumno() {
    let usuarios   = getUsuarios();
    const id       = document.getElementById("idAlumno").value;
    const nombre   = document.getElementById("alm-nombre").value.trim();
    const correo   = document.getElementById("alm-correo").value.trim();
    const matricula= document.getElementById("alm-matricula").value.trim();
    const password = document.getElementById("alm-password").value;

    if (!nombre || !correo || !password) {
        mostrarToast("Nombre, correo y contraseña son obligatorios.", "error");
        return;
    }

    if (id) {
        const alumno = usuarios.find(function (u) { return u.id == id; });
        alumno.nombre = nombre; alumno.correo = correo;
        alumno.matricula = matricula;
        if (password) alumno.password = password;
        mostrarToast("Alumno actualizado.", "ok");
        document.getElementById("form-alm-titulo").textContent = "➕ Nuevo alumno";
    } else {
        usuarios.push({ id: generarId(usuarios), nombre, correo, matricula, password, rol: "alumno" });
        mostrarToast("Alumno creado.", "ok");
    }

    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    limpiarFormularioAlumno();
    mostrarAlumnos();
}

function editarAlumno(id) {
    const alumno = getUsuarioPorId(id);
    if (!alumno) return;
    document.getElementById("idAlumno").value       = alumno.id;
    document.getElementById("alm-nombre").value     = alumno.nombre;
    document.getElementById("alm-correo").value     = alumno.correo || "";
    document.getElementById("alm-matricula").value  = alumno.matricula || "";
    document.getElementById("alm-password").value   = "";
    document.getElementById("form-alm-titulo").textContent = "✏️ Editando alumno";
    activarSeccion("alumnos");
}

function eliminarAlumno(id) {
    const alumno = getUsuarioPorId(id);
    if (!confirm('¿Eliminar al alumno "' + (alumno ? alumno.nombre : "") + '"?')) return;
    localStorage.setItem("usuarios", JSON.stringify(getUsuarios().filter(function (u) { return u.id !== id; })));
    mostrarToast("Alumno eliminado.", "info");
    mostrarAlumnos();
}

function limpiarFormularioAlumno() {
    ["idAlumno","alm-nombre","alm-correo","alm-matricula","alm-password"].forEach(function (id) {
        document.getElementById(id).value = "";
    });
    document.getElementById("form-alm-titulo").textContent = "➕ Nuevo alumno";
}

/* ══════════════════════════════════════════
   REPORTES GLOBALES
══════════════════════════════════════════ */

function cargarStatsGlobales() {
    const stats = getEstadisticas();
    const totalAsistencias = getAsistencias().filter(function (a) { return a.presente; }).length;
    const totalSesiones    = getAsistencias().length;
    const pctGlobal = totalSesiones > 0 ? Math.round((totalAsistencias / totalSesiones) * 100) : 0;

    const contenedor = document.getElementById("stats-globales");
    if (!contenedor) return;

    contenedor.innerHTML =
        tarjetaStat(stats.totalActividades,   "Actividades") +
        tarjetaStat(stats.totalInscritos,     "Inscripciones") +
        tarjetaStat(stats.totalOrganizadores, "Organizadores") +
        tarjetaStat(getUsuarios().filter(function (u) { return u.rol === "alumno"; }).length, "Alumnos") +
        tarjetaStat(pctGlobal + "%",          "Asistencia global");
}

function cargarSelectReporte() {
    const select = document.getElementById("reporte-actividad");
    if (!select) return;
    const actividades = getActividades().filter(function (a) { return a.activa !== false; });
    select.innerHTML = '<option value="">— Selecciona una actividad —</option>';
    actividades.forEach(function (act) {
        select.innerHTML += '<option value="' + act.id + '">' + act.nombre + '</option>';
    });
}

function generarReporte() {
    const idActividad = parseInt(document.getElementById("reporte-actividad").value);
    const contenedor  = document.getElementById("reporte-container");
    if (!contenedor) return;

    if (!idActividad) {
        contenedor.innerHTML = '<p class="lista-hint">Selecciona una actividad para ver su detalle.</p>';
        return;
    }

    const actividad   = getActividadPorId(idActividad);
    const inscritos   = getInscritosPorActividad(idActividad);
    const asistencias = getAsistencias().filter(function (a) { return a.id_actividad === idActividad; });
    const fechas      = [...new Set(asistencias.map(function (a) { return a.fecha; }))].sort();

    const totalPresentes = asistencias.filter(function (a) { return a.presente; }).length;
    const pctGeneral     = asistencias.length > 0
        ? Math.round((totalPresentes / asistencias.length) * 100) : 0;

    let html =
        '<div class="reporte-resumen">' +
            tarjetaStat(inscritos.length, "Alumnos inscritos") +
            tarjetaStat(fechas.length,    "Sesiones") +
            tarjetaStat(pctGeneral + "%", "Asistencia") +
        '</div>';

    // Tabla por alumno
    if (inscritos.length > 0) {
        const filas = inscritos.map(function (ins) {
            const alumno    = getUsuarioPorId(ins.id_alumno);
            if (!alumno) return "";
            const regAlumno = asistencias.filter(function (a) { return a.id_alumno === ins.id_alumno; });
            const presentes = regAlumno.filter(function (a) { return a.presente; }).length;
            const pct       = regAlumno.length > 0 ? Math.round((presentes / regAlumno.length) * 100) : null;
            const barColor  = pct === null ? "#ddd" : pct >= 75 ? "#4caf7d" : pct >= 50 ? "#f0a050" : "#d9534f";

            return (
                '<div class="reporte-fila">' +
                    '<div class="rf-avatar">' + alumno.nombre.charAt(0).toUpperCase() + '</div>' +
                    '<span class="rf-nombre">' + alumno.nombre + '</span>' +
                    '<div class="rf-bar-wrap"><div class="rf-bar" style="width:' + (pct || 0) + '%;background:' + barColor + ';"></div></div>' +
                    '<span class="rf-pct" style="color:' + barColor + ';">' + (pct !== null ? pct + "%" : "—") + '</span>' +
                    '<span style="font-size:12px;color:#aaa;">' + presentes + '/' + regAlumno.length + ' sesiones</span>' +
                '</div>'
            );
        }).join("");

        html +=
            '<div class="reporte-tabla-wrap">' +
                '<div class="reporte-tabla-header">' +
                    '<span>Asistencia por alumno — ' + (actividad ? actividad.nombre : "") + '</span>' +
                    '<button class="btn-exportar" onclick="exportarReporteCSV(' + idActividad + ')">⬇ Exportar CSV</button>' +
                '</div>' +
                filas +
            '</div>';
    }

    // Detalle por fecha
    if (fechas.length > 0) {
        html += '<div class="reporte-tabla-wrap"><div class="reporte-tabla-header"><span>Detalle por sesión</span></div>';
        fechas.forEach(function (fecha) {
            const reg       = asistencias.filter(function (a) { return a.fecha === fecha; });
            const presentes = reg.filter(function (a) { return a.presente; }).length;
            html +=
                '<div class="reporte-fila" style="flex-wrap:wrap;gap:8px;">' +
                    '<span style="font-weight:700;flex:1;">📅 ' + formatearFecha(fecha) + '</span>' +
                    '<span class="badge-presente">✓ ' + presentes + ' presentes</span>' +
                    '<span class="badge-ausente">✗ '  + (reg.length - presentes) + ' ausentes</span>' +
                '</div>';
        });
        html += '</div>';
    }

    if (inscritos.length === 0 && fechas.length === 0) {
        html += '<p class="lista-hint">Aún no hay datos para esta actividad.</p>';
    }

    contenedor.innerHTML = html;
}

function exportarReporteCSV(idActividad) {
    const actividad   = getActividadPorId(idActividad);
    const inscritos   = getInscritosPorActividad(idActividad);
    const asistencias = getAsistencias().filter(function (a) { return a.id_actividad === idActividad; });
    const fechas      = [...new Set(asistencias.map(function (a) { return a.fecha; }))].sort();

    let csv = "Alumno,Matrícula";
    fechas.forEach(function (f) { csv += "," + f; });
    csv += ",Total presentes,% Asistencia\n";

    inscritos.forEach(function (ins) {
        const alumno    = getUsuarioPorId(ins.id_alumno);
        if (!alumno) return;
        const regAlumno = asistencias.filter(function (a) { return a.id_alumno === ins.id_alumno; });
        const presentes = regAlumno.filter(function (a) { return a.presente; }).length;
        const pct       = regAlumno.length > 0 ? Math.round((presentes / regAlumno.length) * 100) : 0;

        let fila = '"' + alumno.nombre + '","' + (alumno.matricula || "") + '"';
        fechas.forEach(function (f) {
            const r = regAlumno.find(function (x) { return x.fecha === f; });
            fila += "," + (r ? (r.presente ? "P" : "A") : "—");
        });
        csv += fila + "," + presentes + "," + pct + "%\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "reporte_" + (actividad ? actividad.nombre.replace(/\s+/g, "_") : "actividad") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast("Reporte exportado.", "ok");
}

/* ══════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════ */

function generarId(lista) {
    if (!lista || lista.length === 0) return 1;
    return Math.max.apply(null, lista.map(function (x) { return x.id; })) + 1;
}

function activarSeccion(nombre) {
    document.querySelectorAll(".snav-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.seccion === nombre);
    });
    document.querySelectorAll(".seccion").forEach(function (s) {
        s.classList.toggle("active", s.id === "sec-" + nombre);
    });
}

function tarjetaStat(valor, label) {
    return (
        '<div class="reporte-stat">' +
            '<span class="reporte-stat-num">'   + valor + '</span>' +
            '<span class="reporte-stat-label">' + label + '</span>' +
        '</div>'
    );
}

function formatearFecha(fechaStr) {
    const d = new Date(fechaStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday:"short", year:"numeric", month:"short", day:"numeric" });
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function mostrarToast(mensaje, tipo) {
    const anterior = document.getElementById("toast-notif");
    if (anterior) anterior.remove();
    const colores = { ok:"#2d7a4f", error:"#d9534f", info:"#5b8dd9" };
    const toast   = document.createElement("div");
    toast.id = "toast-notif";
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position:"fixed", bottom:"28px", right:"28px",
        background: colores[tipo] || colores.info,
        color:"#fff", fontFamily:"'Nunito',sans-serif",
        fontWeight:"700", fontSize:"14px",
        padding:"13px 22px", borderRadius:"12px",
        boxShadow:"0 4px 18px rgba(0,0,0,.18)",
        zIndex:"9999", opacity:"0",
        transform:"translateY(10px)", transition:"all .3s ease"
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