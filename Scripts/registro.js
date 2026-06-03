/* =============================================
   registro.js — Registro de alumnos
   ============================================= */

document.addEventListener("DOMContentLoaded", function () {
    // Si ya hay sesión, redirigir
    if (getSesion()) {
        window.location.href = "index.html";
        return;
    }

    // Toggle ver contraseña
    configurarToggle("toggle-p1", "reg-password");
    configurarToggle("toggle-p2", "reg-password2");

    // Indicador de fortaleza
    document.getElementById("reg-password").addEventListener("input", actualizarFortaleza);

    // Validación en tiempo real paso 1
    document.getElementById("reg-nombre").addEventListener("blur",     function () { validarNombre(true); });
    document.getElementById("reg-matricula").addEventListener("blur",  function () { validarMatricula(true); });
    document.getElementById("reg-correo").addEventListener("blur",     function () { validarCorreo(true); });

    // Envío del formulario (paso 2)
    document.getElementById("form-registro").addEventListener("submit", manejarRegistro);
});

/* ─── NAVEGACIÓN ENTRE PASOS ────────────────── */

function irPaso2() {
    // Validar paso 1 antes de avanzar
    const okNombre   = validarNombre(true);
    const okMatricula= validarMatricula(true);
    const okCorreo   = validarCorreo(true);
    if (!okNombre || !okMatricula || !okCorreo) return;

    // Animar transición
    document.getElementById("paso-1").classList.remove("active");
    document.getElementById("paso-2").classList.add("active");

    // Actualizar dots
    marcarPaso(1, "completo");
    marcarPaso(2, "active");
    marcarLinea(1, true);
}

function irPaso1() {
    document.getElementById("paso-2").classList.remove("active");
    document.getElementById("paso-1").classList.add("active");

    marcarPaso(1, "active");
    marcarPaso(2, "");
    marcarLinea(1, false);
}

function marcarPaso(num, estado) {
    const dot = document.getElementById("paso-dot-" + num);
    if (!dot) return;
    dot.classList.remove("active", "completo");
    if (estado) dot.classList.add(estado);
}

function marcarLinea(num, completa) {
    const lineas = document.querySelectorAll(".paso-linea");
    if (lineas[num - 1]) lineas[num - 1].classList.toggle("completa", completa);
}

/* ─── REGISTRO ──────────────────────────────── */

function manejarRegistro(e) {
    e.preventDefault();

    const pass1 = document.getElementById("reg-password").value;
    const pass2 = document.getElementById("reg-password2").value;
    const btn   = document.getElementById("btn-registrar");

    // Limpiar errores contraseña
    setError("err-password",  "");
    setError("err-password2", "");

    let hayError = false;

    if (!pass1 || pass1.length < 4) {
        setError("err-password", "La contraseña debe tener al menos 4 caracteres.");
        hayError = true;
    }

    if (pass1 !== pass2) {
        setError("err-password2", "Las contraseñas no coinciden.");
        hayError = true;
    }

    if (hayError) return;

    // Estado de carga
    btn.textContent = "Creando cuenta...";
    btn.classList.add("loading");
    btn.disabled = true;

    setTimeout(function () {
        const nombre    = document.getElementById("reg-nombre").value.trim();
        const matricula = document.getElementById("reg-matricula").value.trim();
        const correo    = document.getElementById("reg-correo").value.trim();

        // Crear usuario
        const usuarios = getUsuarios();
        const nuevo = {
            id:       generarId(usuarios),
            nombre:   nombre,
            correo:   correo,
            matricula: matricula,
            password: pass1,
            rol:      "alumno"
        };

        usuarios.push(nuevo);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        // Guardar sesión automáticamente
        guardarSesion(nuevo);

        // Mostrar paso 3 (éxito)
        document.getElementById("paso-2").classList.remove("active");
        document.getElementById("paso-3").classList.add("active");

        marcarPaso(2, "completo");
        marcarPaso(3, "active");
        marcarLinea(2, true);

        document.getElementById("exito-nombre").textContent = nombre.split(" ")[0];

    }, 700);
}

/* ─── VALIDACIONES PASO 1 ───────────────────── */

function validarNombre(mostrarError) {
    const val = document.getElementById("reg-nombre").value.trim();
    const input = document.getElementById("reg-nombre");

    if (!val || val.length < 3) {
        if (mostrarError) setError("err-nombre", "Ingresa tu nombre completo.");
        input.classList.remove("valid"); input.classList.add("invalid");
        return false;
    }
    setError("err-nombre", "");
    input.classList.remove("invalid"); input.classList.add("valid");
    return true;
}

function validarMatricula(mostrarError) {
    const val   = document.getElementById("reg-matricula").value.trim();
    const input = document.getElementById("reg-matricula");

    if (!val) {
        if (mostrarError) setError("err-matricula", "Ingresa tu matrícula.");
        input.classList.remove("valid"); input.classList.add("invalid");
        return false;
    }

    // Verificar que no esté en uso
    const existe = getUsuarios().some(function (u) { return u.matricula === val; });
    if (existe) {
        if (mostrarError) setError("err-matricula", "Esta matrícula ya está registrada.");
        input.classList.remove("valid"); input.classList.add("invalid");
        return false;
    }

    setError("err-matricula", "");
    input.classList.remove("invalid"); input.classList.add("valid");
    return true;
}

function validarCorreo(mostrarError) {
    const val   = document.getElementById("reg-correo").value.trim();
    const input = document.getElementById("reg-correo");

    if (!val || !val.includes("@") || !val.includes(".")) {
        if (mostrarError) setError("err-correo", "Ingresa un correo válido.");
        input.classList.remove("valid"); input.classList.add("invalid");
        return false;
    }

    // Verificar que no esté en uso
    const existe = getUsuarios().some(function (u) { return u.correo === val; });
    if (existe) {
        if (mostrarError) setError("err-correo", "Este correo ya tiene una cuenta.");
        input.classList.remove("valid"); input.classList.add("invalid");
        return false;
    }

    setError("err-correo", "");
    input.classList.remove("invalid"); input.classList.add("valid");
    return true;
}

/* ─── FORTALEZA DE CONTRASEÑA ───────────────── */

function actualizarFortaleza() {
    const pass  = document.getElementById("reg-password").value;
    const wrap  = document.getElementById("strength-wrap");
    const fill  = document.getElementById("strength-fill");
    const label = document.getElementById("strength-label");

    if (!pass) {
        wrap.style.display = "none";
        return;
    }

    wrap.style.display = "flex";

    let puntos = 0;
    if (pass.length >= 4)  puntos++;
    if (pass.length >= 8)  puntos++;
    if (/[A-Z]/.test(pass)) puntos++;
    if (/[0-9]/.test(pass)) puntos++;
    if (/[^A-Za-z0-9]/.test(pass)) puntos++;

    const niveles = [
        { pct: 20,  color: "#d9534f", texto: "Muy débil" },
        { pct: 40,  color: "#e07b2a", texto: "Débil"     },
        { pct: 60,  color: "#f0a050", texto: "Regular"   },
        { pct: 80,  color: "#4caf7d", texto: "Buena"     },
        { pct: 100, color: "#2d7a4f", texto: "Excelente" }
    ];

    const nivel = niveles[Math.min(puntos, niveles.length) - 1] || niveles[0];
    fill.style.width      = nivel.pct + "%";
    fill.style.background = nivel.color;
    label.textContent     = nivel.texto;
    label.style.color     = nivel.color;
}

/* ─── UTILIDADES ────────────────────────────── */

function configurarToggle(btnId, inputId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener("click", function () {
        const esPass    = input.type === "password";
        input.type      = esPass ? "text" : "password";
        btn.textContent = esPass ? "🙈" : "👁";
    });
}

function setError(id, mensaje) {
    const el = document.getElementById(id);
    if (el) el.textContent = mensaje;
}

function generarId(lista) {
    if (!lista || lista.length === 0) return 1;
    return Math.max.apply(null, lista.map(function (x) { return x.id; })) + 1;
}