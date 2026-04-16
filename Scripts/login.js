inicializarDB();

function iniciarSesion() {
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    const resultado = login(correo, password);

    if (resultado.success) {
        redirigir(resultado.usuario);
    } else {
        document.getElementById("error").innerText = resultado.mensaje;
    }
}

function redirigir(usuario) {
    if (usuario.rol === "administrador") {
        window.location.href = "admin.html";
    } else if (usuario.rol === "organizador") {
        window.location.href = "organizador.html";
    } else {
        window.location.href = "catalogo.html";
    }
}