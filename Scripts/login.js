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

    const form   = document.getElementById("login-form");
    if (form) {
        form.addEventListener("submit", manejarLogin);
    }
});

// ─── MANEJAR ENVÍO DEL FORMULARIO ───────────────

function manejarLogin(e) {
    e.preventDefault();

    const identificador = document.getElementById("matricula").value.trim();
    const password      = document.getElementById("password").value;
    const rolActivo     = obtenerRolSeleccionado();
    const btnLogin      = document.getElementById("btn-login");
    const errorMsg      = document.getElementById("error-msg");

    // Limpiar errores previos
    limpiarErrores();

    // Validaciones básicas
    let hayError = false;

    if (!identificador) {
        mostrarErrorCampo("err-matricula", "Ingresa tu matrícula o correo.");
        hayError = true;
    }

    if (!password) {
        mostrarErrorCampo("err-pass", "Ingresa tu contraseña.");
        hayError = true;
    }

    if (hayError) return;

    // Estado de carga
    btnLogin.textContent = "Verificando...";
    btnLogin.classList.add("loading");
    btnLogin.disabled = true;

    // Simular pequeña espera para que se vea la animación
    setTimeout(function () {
        const usuario = autenticarUsuario(identificador, password, rolActivo);

        if (!usuario) {
            // Credenciales incorrectas
            if (errorMsg) {
                errorMsg.style.display = "block";
                errorMsg.textContent   =
                    rolActivo
                        ? "Usuario, contraseña o rol incorrecto."
                        : "Usuario o contraseña incorrectos.";
            }
            btnLogin.textContent = "Iniciar sesión →";
            btnLogin.classList.remove("loading");
            btnLogin.disabled = false;

            // Agitar el formulario
            const box = document.querySelector(".login-box");
            if (box) {
                box.style.animation = "shake 0.4s ease";
                setTimeout(function () { box.style.animation = ""; }, 400);
            }
            return;
        }

        // ¡Éxito! Guardar sesión
        guardarSesion(usuario);

        // Texto del botón mientras redirige
        btnLogin.textContent = "¡Bienvenido, " + usuario.nombre.split(" ")[0] + "! →";

        setTimeout(function () {
            redirigirPorRol(usuario.rol);
        }, 600);

    }, 500);
}

// ─── ROL SELECCIONADO ───────────────────────────

function obtenerRolSeleccionado() {
    const form = document.getElementById("login-form");
    // Si el toggle de rol está activo en el HTML, lo lee del data-rol del form
    if (form && form.dataset.rol) {
        // "alumno" puede autenticarse, "organizador" requiere ese rol exacto
        return form.dataset.rol === "organizador" ? "organizador" : null;
    }
    // Sin toggle → acepta cualquier rol
    return null;
}

// ─── REDIRECCIÓN POR ROL ────────────────────────

function redirigirPorRol(rol) {
    switch (rol) {
        case "administrador":
        case "organizador":
            window.location.href = "organizador.html";
            break;
        case "alumno":
            window.location.href = "catalogo.html";
            break;
        default:
            window.location.href = "index.html";
            break;
    }
}

// ─── MANEJO DE ERRORES ──────────────────────────

function mostrarErrorCampo(idElemento, mensaje) {
    const el = document.getElementById(idElemento);
    if (el) el.textContent = mensaje;
}

function limpiarErrores() {
    const errores = document.querySelectorAll(".input-error");
    errores.forEach(function (el) { el.textContent = ""; });

    const errorMsg = document.getElementById("error-msg");
    if (errorMsg) errorMsg.style.display = "none";
}

/* ─── ANIMACIÓN DE SHAKE ────────────────────────
   Agrega esto a tu login_style.css si quieres
   la animación de error:

   @keyframes shake {
       0%, 100% { transform: translateX(0); }
       20%       { transform: translateX(-8px); }
       40%       { transform: translateX(8px); }
       60%       { transform: translateX(-5px); }
       80%       { transform: translateX(5px); }
   }
*/