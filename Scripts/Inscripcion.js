/**
 * Inscribe a un usuario en una actividad
 */
function inscribirse(idActividad) {

    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    let inscripciones = JSON.parse(localStorage.getItem("inscripciones"));
    let actividades = JSON.parse(localStorage.getItem("actividades"));

    // Buscar actividad
    const actividad = actividades.find(a => a.id === idActividad);

    // Validar cupo
    if (actividad.cupo <= 0) {
        alert("No hay cupo disponible");
        return;
    }

    // Validar inscripción duplicada
    const existe = inscripciones.find(i => 
        i.usuarioId === usuario.id && i.actividadId === idActividad
    );

    if (existe) {
        alert("Ya estás inscrito en esta actividad");
        return;
    }

    // Crear inscripción
    const nueva = {
        id: Date.now(),
        usuarioId: usuario.id,
        actividadId: idActividad
    };

    inscripciones.push(nueva);

    // Reducir cupo
    actividad.cupo--;

    // Guardar cambios
    localStorage.setItem("inscripciones", JSON.stringify(inscripciones));
    localStorage.setItem("actividades", JSON.stringify(actividades));

    alert("Inscripción realizada");

    // Recargar catálogo
    mostrarActividades();
}