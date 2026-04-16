// Inicializar datos si no existen
function inicializarDB() {
    if (!localStorage.getItem("usuarios")) {
        const usuarios = [
            { id: 1, nombre: "Admin", correo: "admin@test.com", password: "1234", rol: "administrador" },
            { id: 2, nombre: "Profe", correo: "profe@test.com", password: "1234", rol: "organizador" }
        ];
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }

    if (!localStorage.getItem("actividades")) {
        const actividades = [
            { id: 1, nombre: "Futbol", descripcion: "Torneo escolar", cupo: 10, id_organizador: 2 },
            { id: 2, nombre: "Danza", descripcion: "Clases de baile", cupo: 15, id_organizador: 2 }
        ];
        localStorage.setItem("actividades", JSON.stringify(actividades));
    }


    if (!localStorage.getItem("inscripciones")) {
        localStorage.setItem("inscripciones", JSON.stringify([]));
    }
}

