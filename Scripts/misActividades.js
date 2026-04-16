/**
 * Muestra las actividades en las que el usuario está inscrito
 */
function cargarMisActividades() {

    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const inscripciones = JSON.parse(localStorage.getItem("inscripciones"));
    const actividades = JSON.parse(localStorage.getItem("actividades"));

    const contenedor = document.getElementById("lista");

    contenedor.innerHTML = "";

    // Filtrar inscripciones del usuario
    const misInscripciones = inscripciones.filter(i => i.usuarioId === usuario.id);

    // Si no tiene actividades
    if (misInscripciones.length === 0) {
        contenedor.innerHTML = "<p>No estás inscrito en ninguna actividad.</p>";
        return;
    }

    // Mostrar cada actividad
    misInscripciones.forEach(insc => {

        const actividad = actividades.find(a => a.id === insc.actividadId);

        contenedor.innerHTML += `
            <div class="card">
                <h3>${actividad.nombre}</h3>
                <p>${actividad.descripcion}</p>

                <button onclick="cancelarInscripcion(${insc.id})">
                    Cancelar inscripción
                </button>
            </div>
        `;
    });
}

/**
 * Cancela la inscripción de una actividad
 */
function cancelarInscripcion(idInscripcion) {

    let inscripciones = JSON.parse(localStorage.getItem("inscripciones"));
    let actividades = JSON.parse(localStorage.getItem("actividades"));

    // Buscar inscripción
    const insc = inscripciones.find(i => i.id === idInscripcion);

    // Buscar actividad relacionada
    const actividad = actividades.find(a => a.id === insc.actividadId);

    // Confirmación
    const confirmar = confirm("¿Seguro que deseas cancelar la inscripción?");
    if (!confirmar) return;

    // Eliminar inscripción
    inscripciones = inscripciones.filter(i => i.id !== idInscripcion);

    // Liberar cupo
    actividad.cupo++;

    // Guardar cambios
    localStorage.setItem("inscripciones", JSON.stringify(inscripciones));
    localStorage.setItem("actividades", JSON.stringify(actividades));

    alert("Inscripción cancelada");

    // Recargar lista
    cargarMisActividades();
}