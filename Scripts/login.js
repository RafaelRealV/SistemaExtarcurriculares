/* =============================================
   login.js — Autenticación
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    // Si ya hay sesión activa, redirigir directamente
    const sesion = getSesion();
    if (sesion) {
        redirigirPorRol(sesion.rol);
        return;
    }

    const form = document.getElementById("login-form");
    if (form) form.addEventListener("submit", manejarLogin);
});

/* ─── MANEJAR ENVÍO ─────────────────────────── */

function manejarLogin(e) {
    e.preventDefault();

    const identificador = document.getElementById("matricula").value.trim();
    const password      = document.getElementById("password").value;
    const rolActivo     = obtenerRolSeleccionado();
    const btnLogin      = document.getElementById("btn-login");
    const errorMsg      = document.getElementById("error-msg");

    limpiarErrores();

    let hayError = false;
    if (!identificador) { mostrarErrorCampo("err-matricula", "Ingresa tu matrícula o correo."); hayError = true; }
    if (!password)       { mostrarErrorCampo("err-pass",      "Ingresa tu contraseña.");         hayError = true; }
    if (hayError) return;

    btnLogin.textContent = "Verificando...";
    btnLogin.classList.add("loading");
    btnLogin.disabled = true;

    setTimeout(function () {
        const usuario = autenticarUsuario(identificador, password, rolActivo);

        if (!usuario) {
            if (errorMsg) {
                errorMsg.style.display = "block";
                errorMsg.textContent   = rolActivo
                    ? "Usuario, contraseña o rol incorrecto."
                    : "Usuario o contraseña incorrectos.";
            }
            btnLogin.textContent = "Iniciar sesión →";
            btnLogin.classList.remove("loading");
            btnLogin.disabled = false;

            const box = document.querySelector(".login-box");
            if (box) {
                box.style.animation = "shake 0.4s ease";
                setTimeout(function () { box.style.animation = ""; }, 400);
            }
            return;
        }

        guardarSesion(usuario);
        btnLogin.textContent = "¡Bienvenido, " + usuario.nombre.split(" ")[0] + "! →";

        setTimeout(function () { redirigirPorRol(usuario.rol); }, 600);

    }, 500);
}

/* ─── ROL SELECCIONADO ─────────────────────── */

function obtenerRolSeleccionado() {
    const form = document.getElementById("login-form");
    if (form && form.dataset.rol === "organizador") return "organizador";
    return null; // acepta cualquier rol
}

/* ─── REDIRECCIÓN POR ROL ──────────────────── */

function redirigirPorRol(rol) {
    switch (rol) {
        case "administrador":
            window.location.href = "administrador.html";
            break;
        case "organizador":
            window.location.href = "organizador.html";
            break;
        case "alumno":
        default:
            window.location.href = "index.html";
            break;
    }
}

/* ─── ERRORES ───────────────────────────────── */

function mostrarErrorCampo(id, mensaje) {
    const el = document.getElementById(id);
    if (el) el.textContent = mensaje;
}

function limpiarErrores() {
    document.querySelectorAll(".input-error").forEach(function (el) { el.textContent = ""; });
    const err = document.getElementById("error-msg");
    if (err) err.style.display = "none";
}