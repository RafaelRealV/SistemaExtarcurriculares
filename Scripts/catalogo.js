/**
 * Muestra todas las actividades disponibles
 */
function mostrarActividades() {

    const actividades = JSON.parse(localStorage.getItem("actividades"));
    const contenedor = document.getElementById("lista");

    contenedor.innerHTML = "";

    actividades.forEach(act => {

        contenedor.innerHTML += `
            <div class="card">
                <h3>${act.nombre}</h3>
                <p>${act.descripcion}</p>
                <p>Cupo disponible: ${act.cupo}</p>

                <button onclick="inscribirse(${act.id})">
                    Inscribirse
                </button>
            </div>
        `;
    });
}