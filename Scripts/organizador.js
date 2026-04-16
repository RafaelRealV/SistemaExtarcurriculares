/**
 * Carga las actividades del organizador
 */
function cargarActividadesOrganizador() {

    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const actividades = JSON.parse(localStorage.getItem("actividades"));

    const contenedor = document.getElementById("actividades");

    contenedor.innerHTML = "";

    // Filtrar actividades del organizador
    const misActividades = actividades.filter(a => a.id_organizador === usuario.id);

    if (misActividades.length === 0) {
        contenedor.innerHTML = "<p>No tienes actividades asignadas.</p>";
        return;
    }

    // Mostrar actividades
    misActividades.forEach(act => {
        contenedor.innerHTML += `
            <div class="card">
                <h3>${act.nombre}</h3>
                <p>${act.descripcion}</p>

                <button onclick="verInscritos(${act.id})">
                    Ver inscritos
                </button>
            </div>
        `;
    });
}

/**
 * Muestra los estudiantes inscritos en una actividad
 */
function verInscritos(idActividad) {

    const inscripciones = JSON.parse(localStorage.getItem("inscripciones"));
    const usuarios = JSON.parse(localStorage.getItem("usuarios"));

    const contenedor = document.getElementById("inscritos");

    contenedor.innerHTML = "<h4>Lista de estudiantes</h4>";

    const lista = inscripciones.filter(i => i.actividadId === idActividad);

    if (lista.length === 0) {
        contenedor.innerHTML += "<p>No hay inscritos.</p>";
        return;
    }

    lista.forEach(insc => {

        const usuario = usuarios.find(u => u.id === insc.usuarioId);

        contenedor.innerHTML += `
            <div class="card">
                <p>${usuario.nombre}</p>

                <button onclick="registrarAsistencia(${insc.id})">
                    Registrar asistencia
                </button>

                <button onclick="generarConstancia(${insc.id})">
                    Generar constancia
                </button>
            </div>
        `;
    });
}

/**
 * Marca asistencia del estudiante
 */
function registrarAsistencia(idInscripcion) {

    let asistencias = JSON.parse(localStorage.getItem("asistencias")) || [];

    const existe = asistencias.find(a => a.inscripcionId === idInscripcion);

    if (existe) {
        alert("La asistencia ya fue registrada");
        return;
    }

    const nueva = {
        id: Date.now(),
        inscripcionId: idInscripcion,
        asistencia: true
    };

    asistencias.push(nueva);

    localStorage.setItem("asistencias", JSON.stringify(asistencias));

    alert("Asistencia registrada");
}

/**
 * Genera constancia si hay asistencia
 */
function generarConstancia(idInscripcion) {

    let asistencias = JSON.parse(localStorage.getItem("asistencias")) || [];
    let constancias = JSON.parse(localStorage.getItem("constancias")) || [];

    const asistencia = asistencias.find(a => a.inscripcionId === idInscripcion);

    if (!asistencia) {
        alert("El estudiante no tiene asistencia registrada");
        return;
    }

    const existe = constancias.find(c => c.inscripcionId === idInscripcion);

    if (existe) {
        alert("La constancia ya fue generada");
        return;
    }

    const nueva = {
        id: Date.now(),
        inscripcionId: idInscripcion,
        fecha: new Date().toLocaleDateString()
    };

    constancias.push(nueva);

    localStorage.setItem("constancias", JSON.stringify(constancias));

    alert("Constancia generada");
}