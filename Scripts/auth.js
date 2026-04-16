function login(correo, password) {
    const usuarios = JSON.parse(localStorage.getItem("usuarios"));

    const usuario = usuarios.find(u => u.correo === correo && u.password === password);

    if (usuario) {
        localStorage.setItem("usuarioActual", JSON.stringify(usuario));
        return true;
    } else {
        return false;
    }
}