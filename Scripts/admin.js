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
  contenedor.innerHTML = "<h3>📋 Actividades</h3>";

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
/*
    * Guarda una nueva actividad, actualiza una existente y eliminar una actividad existente  
 */
function guardarActividad() {

    let actividades = JSON.parse(localStorage.getItem("actividades"));

    const id = document.getElementById("idActividad").value;
    const nombre = document.getElementById("nombre").value;
    const descripcion = document.getElementById("descripcion").value;
    const cupo = parseInt(document.getElementById("cupo").value);
    const organizador = parseInt(document.getElementById("organizador").value);

    if (!nombre || !descripcion || !cupo) {
        alert("Todos los campos son obligatorios");
        return;
    }

    if (id) {
        // EDITAR
        const actividad = actividades.find(a => a.id == id);

        actividad.nombre = nombre;
        actividad.descripcion = descripcion;
        actividad.cupo = cupo;
        actividad.id_organizador = organizador;

        alert("Actividad actualizada");

    } else {
        // CREAR
        const nueva = {
            id: generarId(actividades),
            nombre,
            descripcion,
            cupo,
            id_organizador: organizador
        };

        actividades.push(nueva);

        alert("Actividad creada");
    }

    localStorage.setItem("actividades", JSON.stringify(actividades));

    limpiarFormulario();
    mostrarActividades();
}
// Genera el id de una nueva actividad sumando 1 al id más alto existente
function generarId(actividades) {
    if (actividades.length === 0) return 1;
    return Math.max(...actividades.map(act => act.id)) + 1;
}


// solo limpia el formulario, no toca la base de datos ni la lista
function limpiarFormulario() {
    document.getElementById("idActividad").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("cupo").value = "";
    document.getElementById("organizador").value = "";
}


function editarActividad(id) {

    const actividades = JSON.parse(localStorage.getItem("actividades"));

    const actividad = actividades.find(a => a.id === id);

    document.getElementById("idActividad").value = actividad.id;
    document.getElementById("nombre").value = actividad.nombre;
    document.getElementById("descripcion").value = actividad.descripcion;
    document.getElementById("cupo").value = actividad.cupo;
    document.getElementById("organizador").value = actividad.id_organizador;
}

function eliminarActividad(id) {
    let actividades = JSON.parse(localStorage.getItem("actividades"));
    actividades = actividades.filter(a => a.id !== id);
    localStorage.setItem("actividades", JSON.stringify(actividades));
    mostrarActividades();
}





/*
*
----------administracionde Organizadores----------------
*
*/     
    const usuarios = JSON.parse(localStorage.getItem("usuarios"));
    const organizadores = usuarios.filter((u) => u.rol === "organizador");
    const contenedor = document.getElementById("divListado");
/*
  cargar los Organizadoes en la lista
*/

function listaOrganizadores() {
    contenedor.innerHTML = "";
    contenedor.innerHTML = "<h3>📋 Organizadores</h3>";
    organizadores.forEach((org) => {
        contenedor.innerHTML += `
            <div class="actividad">
                <a>${org.nombre}</a>
                <button onclick="editarOrganizador(${org.id})">
                    Editar
                </button>
                <button onclick="eliminarOrganizador(${org.id})">
                    Eliminar
                </button>
            </div>
        `;
    });
}

function guardarOrganizador() {
    const id = document.getElementById("idOrganizador").value;
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    if (!nombre || !correo || !password) {
        alert("Todos los campos son obligatorios");
        return;
    }

    if (id) {
        // EDITAR
        const organizador = organizadores.find(o => o.id == id);
        organizador.nombre = nombre;
        organizador.correo = correo;
        organizador.password = password;
        alert("Organizador actualizado");
    } else {
        // CREAR
        const nuevo = {
            id: generarId(usuarios),
            nombre,
            correo,
            rol: "organizador",
            password
            
        };
        usuarios.push(nuevo);
        alert("Organizador creado");
    }
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    limpiarFormularioOrganizador();
    listaOrganizadores();

}
// Lismpia el formulario de organidares.
function limpiarFormularioOrganizador() {
    document.getElementById("idOrganizador").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("password").value = "";
}

function editarOrganizador(id) {
    const organizador = organizadores.find(o => o.id === id);
    document.getElementById("idOrganizador").value = organizador.id;
    document.getElementById("nombre").value = organizador.nombre;
    document.getElementById("correo").value = organizador.correo;
    document.getElementById("password").value = organizador.password;
}
function eliminarOrganizador(id) {
    let elimUsuarios = JSON.parse(localStorage.getItem("usuarios"));
    elimUsuarios = elimUsuarios.filter(u => u.id !== id);
    localStorage.setItem("usuarios", JSON.stringify(elimUsuarios));
    listaOrganizadores();
}





/*
*
----------------administracion de Alumnos----------------
*
*/ 

const alumnos = usuarios.filter((u) => u.rol === "alumno");

/* Cargar los alumnos en la lista */
function listaAlumnos() {
    contenedor.innerHTML = "";
    contenedor.innerHTML = "<h3>📋 Alumnos</h3>";
    alumnos.forEach((alumno) => {
        contenedor.innerHTML += `
            <div class="actividad">
                <a>${alumno.nombre}</a>
                <button onclick="editarAlumno(${alumno.id})">
                    Editar
                </button>
                <button onclick="eliminarAlumno(${alumno.id})">
                    Eliminar
                </button>
            </div>
        `;
    });
}

/* boton de guardar alumno */
function guardarAlumno() {
    const id = document.getElementById("idAlumno").value;
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    if (!nombre || !correo || !password) {
        alert("Todos los campos son obligatorios");
        return;
    }

    if (id) {
        // EDITAR
        const alumno = alumnos.find(a => a.id == id);
        alumno.nombre = nombre;
        alumno.correo = correo;
        alumno.password = password;
        alert("Alumno actualizado");
    }else {
        // CREAR
        const nuevo = {
            id: generarId(usuarios),
            nombre,
            correo,
            rol: "alumno",
            password
        };
        usuarios.push(nuevo);
        alert("Alumno creado");
    }
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    limpiarFormularioAlumno();
    listaAlumnos();

}

function limpiarFormularioAlumno() {
    document.getElementById("idAlumno").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("password").value = "";
}

function editarAlumno(id) {
    const alumno = alumnos.find(a => a.id === id);
    document.getElementById("idAlumno").value = alumno.id;
    document.getElementById("nombre").value = alumno.nombre;
    document.getElementById("correo").value = alumno.correo;
    document.getElementById("password").value = alumno.password;
}
function eliminarAlumno(id) {
    let elimUsuarios = JSON.parse(localStorage.getItem("usuarios"));
    elimUsuarios = elimUsuarios.filter(u => u.id !== id);
    localStorage.setItem("usuarios", JSON.stringify(elimUsuarios));
    listaAlumnos();
}
