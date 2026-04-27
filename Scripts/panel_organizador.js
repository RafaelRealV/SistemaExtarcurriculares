let sesionOrg = null;

document.addEventListener("DOMContentLoaded", function () {
    // Proteger: solo organizadores
    sesionOrg = getSesion();
    if (!sesionOrg || sesionOrg.rol !== "organizador") {
        alert("Acceso no autorizado.");
        window.location.href = "login.html";
        return;
    }

    // Datos en el sidebar
    document.getElementById("sb-avatar").textContent = sesionOrg.nombre.charAt(0).toUpperCase();
    document.getElementById("sb-nombre").textContent = sesionOrg.nombre;

    // Cargar secciones
    cargarMisActividades();
    cargarSelectLista();
    cargarSelectReporte();
    ponerFechaHoy();

    // Tabs
    document.querySelectorAll(".snav-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".snav-btn").forEach(function (b) { b.classList.remove("active"); });
            btn.classList.add("active");

            const sec = btn.dataset.seccion;
            document.querySelectorAll(".seccion").forEach(function (s) { s.classList.remove("active"); });
            document.getElementById("sec-" + sec).classList.add("active");

            const titulos = {
                "mis-actividades": ["Mis actividades",  "Actividades que tienes asignadas"],
                "lista":           ["Tomar lista",      "Registra la asistencia de una sesión"],
                "reportes":        ["Reportes",         "Consulta la asistencia de tus actividades"]
            };
            if (titulos[sec]) {
                document.getElementById("titulo-seccion").textContent = titulos[sec][0];
                document.getElementById("sub-seccion").textContent    = titulos[sec][1];
            }

            if (sec === "lista")    cargarSelectLista();
            if (sec === "reportes") cargarSelectReporte();
        });
    });
});

/* ─── MIS ACTIVIDADES ─────────────────────── */

function cargarMisActividades() {
    const contenedor  = document.getElementById("mis-actividades-grid");
    if (!contenedor) return;

    const misActs = getActividadesPorOrganizador(sesionOrg.id).filter(function (a) {
        return a.activa !== false;
    });

    if (misActs.length === 0) {
        contenedor.innerHTML =
            '<div class="lista-hint" style="text-align:center;padding:60px 20px;">' +
                '<span style="font-size:36px;display:block;margin-bottom:10px;">📋</span>' +
                'No tienes actividades asignadas aún.' +
            '</div>';
        return;
    }

    const emojiPorCat = { deporte:"⚽", arte:"🎨", ciencia:"🔬", cultura:"🎭", musica:"🎸" };

    contenedor.innerHTML = misActs.map(function (act) {
        const inscritos   = getInscritosPorActividad(act.id).length;
        const cuposLibres = act.cupo - inscritos;
        const porcentaje  = Math.min(Math.round((inscritos / act.cupo) * 100), 100);
        const barColor    = porcentaje >= 100 ? "#aaa" : porcentaje >= 75 ? "#e07b2a" : "#4caf7d";
        const emoji       = act.emoji || emojiPorCat[act.categoria] || "📌";
        const cat         = act.categoria || "default";

        // Sesiones registradas
        const sesiones = [...new Set(
            getAsistencias()
                .filter(function (a) { return a.id_actividad === act.id; })
                .map(function (a) { return a.fecha; })
        )].length;

        return (
            '<div class="mis-act-card">' +
                '<div class="mac-banner ' + cat + '">' + emoji +
                    '<span class="cupos-badge' + (cuposLibres <= 0 ? " lleno" : "") + '">' +
                        (cuposLibres <= 0 ? "Lleno" : cuposLibres + " cupos") +
                    '</span>' +
                '</div>' +
                '<div class="mac-body">' +
                    '<span class="mac-tag">' + capitalize(cat) + '</span>' +
                    '<div class="mac-nombre">' + act.nombre + '</div>' +
                    '<div class="mac-meta">' +
                        (act.dias ? '<span>📅 ' + act.dias + '</span>' : '') +
                        (act.hora ? '<span>🕓 ' + act.hora + '</span>' : '') +
                    '</div>' +
                    '<div class="mac-stats">' +
                        '<span>👥 ' + inscritos + '/' + act.cupo + ' inscritos</span>' +
                        '<span>📆 ' + sesiones + ' sesiones</span>' +
                    '</div>' +
                    '<div class="mac-bar-wrap">' +
                        '<div class="mac-bar" style="width:' + porcentaje + '%;background:' + barColor + ';"></div>' +
                    '</div>' +
                    '<div class="mac-btns">' +
                        '<button class="mac-btn-lista" onclick="irTomarLista(' + act.id + ')">✅ Tomar lista</button>' +
                        '<button class="mac-btn-reporte" onclick="irReporte(' + act.id + ')">📊 Ver reporte</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }).join("");
}

function irTomarLista(idActividad) {
    document.querySelectorAll(".snav-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.seccion === "lista");
    });
    document.querySelectorAll(".seccion").forEach(function (s) {
        s.classList.toggle("active", s.id === "sec-lista");
    });
    document.getElementById("titulo-seccion").textContent = "Tomar lista";
    document.getElementById("sub-seccion").textContent    = "Registra la asistencia de una sesión";

    cargarSelectLista();
    ponerFechaHoy();

    setTimeout(function () {
        const select = document.getElementById("lista-actividad");
        if (select) {
            select.value = idActividad;
            cargarAlumnosLista();
        }
    }, 50);
}

function irReporte(idActividad) {
    document.querySelectorAll(".snav-btn").forEach(function (b) {
        b.classList.toggle("active", b.dataset.seccion === "reportes");
    });
    document.querySelectorAll(".seccion").forEach(function (s) {
        s.classList.toggle("active", s.id === "sec-reportes");
    });
    document.getElementById("titulo-seccion").textContent = "Reportes";
    document.getElementById("sub-seccion").textContent    = "Consulta la asistencia de tus actividades";

    cargarSelectReporte();

    setTimeout(function () {
        const select = document.getElementById("reporte-actividad");
        if (select) {
            select.value = idActividad;
            generarReporte();
        }
    }, 50);
}

/* ─── TOMAR LISTA ─────────────────────────── */

function cargarSelectLista() {
    const select = document.getElementById("lista-actividad");
    if (!select) return;

    const misActs = getActividadesPorOrganizador(sesionOrg.id).filter(function (a) {
        return a.activa !== false;
    });

    select.innerHTML = '<option value="">— Selecciona una actividad —</option>';
    misActs.forEach(function (act) {
        select.innerHTML += '<option value="' + act.id + '">' + act.nombre + '</option>';
    });
}

function ponerFechaHoy() {
    const input = document.getElementById("lista-fecha");
    if (input) input.value = new Date().toISOString().split("T")[0];
}

function cargarAlumnosLista() {
    const idActividad = parseInt(document.getElementById("lista-actividad").value);
    const fecha       = document.getElementById("lista-fecha").value;
    const contenedor  = document.getElementById("lista-container");
    if (!contenedor) return;

    if (!idActividad || !fecha) {
        contenedor.innerHTML = '<p class="lista-hint">Selecciona una actividad y una fecha para tomar lista.</p>';
        return;
    }

    // Verificar que esta actividad le pertenece
    const actividad = getActividadPorId(idActividad);
    if (!actividad || actividad.id_organizador !== sesionOrg.id) {
        contenedor.innerHTML = '<p class="lista-hint">No tienes acceso a esta actividad.</p>';
        return;
    }

    const inscritos    = getInscritosPorActividad(idActividad);
    const registrosHoy = getAsistenciasPorFecha(idActividad, fecha);

    if (inscritos.length === 0) {
        contenedor.innerHTML = '<p class="lista-hint">No hay alumnos inscritos en esta actividad.</p>';
        return;
    }

    const filasHTML = inscritos.map(function (ins) {
        const alumno = getUsuarioPorId(ins.id_alumno);
        if (!alumno) return "";

        const regHoy   = registrosHoy.find(function (r) { return r.id_alumno === ins.id_alumno; });
        const presente = regHoy ? regHoy.presente : true;

        return (
            '<div class="alumno-fila">' +
                '<div class="alumno-avatar">' + alumno.nombre.charAt(0).toUpperCase() + '</div>' +
                '<div class="alumno-nombre">' + alumno.nombre + '</div>' +
                '<div class="alumno-mat">'    + (alumno.matricula || alumno.correo || "—") + '</div>' +
                '<label class="check-asistencia">' +
                    '<input type="checkbox" data-alumno="' + alumno.id + '" ' + (presente ? "checked" : "") + '>' +
                    'Presente' +
                '</label>' +
            '</div>'
        );
    }).join("");

    contenedor.innerHTML =
        '<div class="lista-tabla-wrap">' +
            '<div class="lista-tabla-header">' +
                '<span class="lista-tabla-titulo">' + actividad.nombre + ' — ' + formatearFecha(fecha) + '</span>' +
                '<button class="btn-guardar-lista" onclick="guardarListaDelDia()">💾 Guardar lista</button>' +
            '</div>' +
            filasHTML +
        '</div>';
}

function guardarListaDelDia() {
    const idActividad = parseInt(document.getElementById("lista-actividad").value);
    const fecha       = document.getElementById("lista-fecha").value;
    if (!idActividad || !fecha) return;

    const checkboxes = document.querySelectorAll('#lista-container input[type="checkbox"]');
    const registros  = [];
    checkboxes.forEach(function (cb) {
        registros.push({ id_alumno: parseInt(cb.dataset.alumno), presente: cb.checked });
    });

    guardarListaAsistencia(idActividad, fecha, registros);
    mostrarToast("Lista guardada correctamente.", "ok");
    cargarAlumnosLista();
    cargarMisActividades(); // actualizar contador de sesiones
}

/* ─── REPORTES ────────────────────────────── */

function cargarSelectReporte() {
    const select = document.getElementById("reporte-actividad");
    if (!select) return;

    const misActs = getActividadesPorOrganizador(sesionOrg.id).filter(function (a) {
        return a.activa !== false;
    });

    select.innerHTML = '<option value="">— Selecciona una actividad —</option>';
    misActs.forEach(function (act) {
        select.innerHTML += '<option value="' + act.id + '">' + act.nombre + '</option>';
    });
}

function generarReporte() {
    const idActividad = parseInt(document.getElementById("reporte-actividad").value);
    const contenedor  = document.getElementById("reporte-container");
    if (!contenedor) return;

    if (!idActividad) {
        contenedor.innerHTML = '<p class="lista-hint">Selecciona una actividad para ver el reporte.</p>';
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
            tarjetaStat(inscritos.length,    "Alumnos inscritos") +
            tarjetaStat(fechas.length,       "Sesiones registradas") +
            tarjetaStat(pctGeneral + "%",    "Asistencia general") +
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
            const ausentes  = reg.length - presentes;
            html +=
                '<div class="reporte-fila" style="flex-wrap:wrap;gap:8px;">' +
                    '<span style="font-weight:700;flex:1;">📅 ' + formatearFecha(fecha) + '</span>' +
                    '<span class="badge-presente">✓ ' + presentes + ' presentes</span>' +
                    '<span class="badge-ausente">✗ '  + ausentes  + ' ausentes</span>' +
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
        fila += "," + presentes + "," + pct + "%";
        csv += fila + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = "reporte_" + (actividad ? actividad.nombre.replace(/\s+/g, "_") : "actividad") + ".csv";
    link.click();
    URL.revokeObjectURL(url);
    mostrarToast("Reporte exportado.", "ok");
}

/* ─── UTILIDADES ──────────────────────────── */

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