/**
 * Carga usuarios con rol organizador en el select
 */
function cargarOrganizadores() {
  const usuarios = JSON.parse(localStorage.getItem("usuarios"));
  const select = document.getElementById("organizador");

  select.innerHTML = "";

  const organizadores = usuarios.filter((u) => u.rol === "organizador");

  organizadores.forEach((org) => {
    select.innerHTML += `
            <option value="${org.id}">
                ${org.nombre}
            </option>
        `;
  });
}
/**
 * Muestra las actividades en la lista
 */

function mostrarActividades() {
  const actividades = JSON.parse(localStorage.getItem("actividades"));
  const usuarios = JSON.parse(localStorage.getItem("usuarios"));

  const contenedor = document.getElementById("divListado");
  contenedor.innerHTML = "";

  actividades.forEach((act) => {
    const organizador = usuarios.find((u) => u.id === act.id_organizador);

    contenedor.innerHTML += `
            <div class="actividad">
                <a>${act.nombre}</a>
              
                <button onclick="editarActividad(${act.id})">
                    Editar
                </button>

                <button onclick="eliminarActividad(${act.id})">
                    Eliminar
                </button>
            </div>
        `;
  });
}
