inicializarDB();

function mostrarDestacadas() {
    const actividades = JSON.parse(localStorage.getItem("actividades"));
    const contenedor = document.getElementById("destacadas");

    contenedor.innerHTML = "";

    actividades.slice(0, 3).forEach(act => {
        contenedor.innerHTML += `
            <div class="card">
                <h3>${act.nombre}</h3>
                <p>${act.descripcion}</p>
                <p>Cupo: ${act.cupo}</p>
                <a href="catalogo.html">Ver más</a>
            </div>
        `;
    });
}

mostrarDestacadas();
