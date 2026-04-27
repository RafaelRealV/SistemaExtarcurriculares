/**
 Función para registrar un nuevo usuario
 */
function registrarUsuario() {

    // Obtener valores del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value.trim();

    const mensaje = document.getElementById("mensaje");

    // Validar campos vacíos
    if (!nombre || !correo || !password) {
        mensaje.innerText = "Todos los campos son obligatorios";
        return;
    }

    // Obtener usuarios existentes
    let usuarios = JSON.parse(localStorage.getItem("usuarios"));

    // Verificar si el correo ya existe
    const existe = usuarios.find(u => u.correo === correo);

    if (existe) {
        mensaje.innerText = "El correo ya está registrado";
        return;
    }

    // Crear nuevo usuario
    const nuevoUsuario = {
        id: Date.now(), // ID único basado en timestamp
        nombre: nombre,
        correo: correo,
        password: password,
        rol: "estudiante"   
    };

    // Guardar usuario
    usuarios.push(nuevoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Mensaje de éxito
    mensaje.style.color = "green";
    mensaje.innerText = "Usuario registrado correctamente";

    // Limpiar campos
    document.getElementById("nombre").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("password").value = "";

    // Redirigir después de 2 segundos
    setTimeout(() => {
        window.location.href = "login.html";
    }, 2000);
}