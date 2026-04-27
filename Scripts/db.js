/* =============================================
   db.js — Base de datos con localStorage
   Sistema de Actividades Extracurriculares
   ============================================= */
///localStorage.clear();

// ─── INICIALIZAR DATOS ──────────────────────────
function inicializarDB() {
  // USUARIOS
  if (!localStorage.getItem("usuarios")) {
    const usuarios = [
      {
        id: 1,
        nombre: "Admin",
        correo: "admin@test.com",
        password: "1234",
        rol: "administrador",
        matricula: "admin",
      },
      {
        id: 2,
        nombre: "Profe García",
        correo: "profe@test.com",
        password: "1234",
        rol: "organizador",
        matricula: "org001",
      },
      {
        id: 3,
        nombre: "Luis Martínez",
        correo: "luis@test.com",
        password: "1234",
        rol: "alumno",
        matricula: "2024001",
      },
      {
        id: 4,
        nombre: "Ana López",
        correo: "ana@test.com",
        password: "1234",
        rol: "alumno",
        matricula: "2024002",
      },
    ];
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }

  // ACTIVIDADES
  if (!localStorage.getItem("actividades")) {
    const actividades = [
      {
        id: 1,
        nombre: "Fútbol",
        descripcion: "Torneo escolar de fútbol varonil.",
        cupo: 10,
        id_organizador: 2,
        categoria: "deporte",
        emoji: "⚽",
        dias: "Lun · Mié",
        hora: "4:00 PM",
        activa: true,
      },
      {
        id: 2,
        nombre: "Danza",
        descripcion: "Clases de baile folclórico y contemporáneo.",
        cupo: 15,
        id_organizador: 2,
        categoria: "arte",
        emoji: "💃",
        dias: "Martes · Jueves",
        hora: "3:30 PM",
        activa: true,
      },
      {
        id: 3,
        nombre: "Robótica",
        descripcion: "Construcción y programación de robots.",
        cupo: 12,
        id_organizador: 2,
        categoria: "ciencia",
        emoji: "🤖",
        dias: "Miércoles",
        hora: "5:00 PM",
        activa: true,
      },
      {
        id: 4,
        nombre: "Teatro",
        descripcion: "Expresión corporal y obras teatrales.",
        cupo: 8,
        id_organizador: 2,
        categoria: "cultura",
        emoji: "🎭",
        dias: "Viernes",
        hora: "4:00 PM",
        activa: true,
      },
    ];
    localStorage.setItem("actividades", JSON.stringify(actividades));
  }

  // INSCRIPCIONES
  if (!localStorage.getItem("inscripciones")) {
    localStorage.setItem("inscripciones", JSON.stringify([]));
  }

  // ASISTENCIAS
  if (!localStorage.getItem("asistencias")) {
    localStorage.setItem("asistencias", JSON.stringify([]));
  }
}

// ─── USUARIOS ───────────────────────────────────

function getUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function getUsuarioPorId(id) {
  return getUsuarios().find((u) => u.id === id) || null;
}

// Busca por matrícula o correo + password + rol opcional
function autenticarUsuario(identificador, password, rol) {
  const usuarios = getUsuarios();
  return (
    usuarios.find(
      (u) =>
        (u.matricula === identificador || u.correo === identificador) &&
        u.password === password &&
        (rol ? u.rol === rol : true),
    ) || null
  );
}

// ─── ACTIVIDADES ────────────────────────────────

function getActividades() {
  return JSON.parse(localStorage.getItem("actividades")) || [];
}

function getActividadPorId(id) {
  return getActividades().find((a) => a.id === id) || null;
}

function getActividadesPorOrganizador(idOrg) {
  return getActividades().filter((a) => a.id_organizador === idOrg);
}

function guardarActividades(actividades) {
  localStorage.setItem("actividades", JSON.stringify(actividades));
}

// ─── INSCRIPCIONES ──────────────────────────────

function getInscripciones() {
  return JSON.parse(localStorage.getItem("inscripciones")) || [];
}

function guardarInscripciones(inscripciones) {
  localStorage.setItem("inscripciones", JSON.stringify(inscripciones));
}

function getInscritosPorActividad(idActividad) {
  return getInscripciones().filter((i) => i.id_actividad === idActividad);
}

function getInscripcionesPorAlumno(idAlumno) {
  return getInscripciones().filter((i) => i.id_alumno === idAlumno);
}

function estaInscrito(idAlumno, idActividad) {
  return getInscripciones().some(
    (i) => i.id_alumno === idAlumno && i.id_actividad === idActividad,
  );
}

// Inscribir alumno — devuelve { ok, mensaje }
function inscribir(idAlumno, idActividad) {
  const actividad = getActividadPorId(idActividad);
  if (!actividad) return { ok: false, mensaje: "Actividad no encontrada." };

  if (estaInscrito(idAlumno, idActividad))
    return { ok: false, mensaje: "Ya estás inscrito en esta actividad." };

  const inscritos = getInscritosPorActividad(idActividad).length;
  if (inscritos >= actividad.cupo)
    return { ok: false, mensaje: "No hay cupos disponibles." };

  const inscripciones = getInscripciones();
  inscripciones.push({
    id: Date.now(),
    id_alumno: idAlumno,
    id_actividad: idActividad,
    fecha: new Date().toISOString(),
  });
  guardarInscripciones(inscripciones);
  return { ok: true, mensaje: "¡Inscripción exitosa!" };
}

// Cancelar inscripción
function cancelarInscripcion(idAlumno, idActividad) {
  const restantes = getInscripciones().filter(
    (i) => !(i.id_alumno === idAlumno && i.id_actividad === idActividad),
  );
  guardarInscripciones(restantes);
}

// ─── ASISTENCIAS ────────────────────────────────

function getAsistencias() {
  return JSON.parse(localStorage.getItem("asistencias")) || [];
}

function guardarAsistencias(asistencias) {
  localStorage.setItem("asistencias", JSON.stringify(asistencias));
}

function getAsistenciasPorFecha(idActividad, fecha) {
  return getAsistencias().filter(
    (a) => a.id_actividad === idActividad && a.fecha === fecha,
  );
}

// registros = [{ id_alumno, presente: true/false }]
function guardarListaAsistencia(idActividad, fecha, registros) {
  // Elimina registros previos del mismo día para reemplazarlos
  let asistencias = getAsistencias().filter(
    (a) => !(a.id_actividad === idActividad && a.fecha === fecha),
  );
  registros.forEach((r) => {
    asistencias.push({
      id: Date.now() + Math.random(),
      id_actividad: idActividad,
      fecha: fecha,
      id_alumno: r.id_alumno,
      presente: r.presente,
    });
  });
  guardarAsistencias(asistencias);
}

// ─── SESIÓN ─────────────────────────────────────

function getSesion() {
  return JSON.parse(localStorage.getItem("sec_sesion")) || null;
}

function guardarSesion(usuario) {
  localStorage.setItem("sec_sesion", JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem("sec_sesion");
  window.location.href = "login.html";
}

// Redirige al login si no hay sesión
function requiereLogin() {
  if (!getSesion()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// Redirige al inicio si el rol no corresponde
function requiereRol(rol) {
  const sesion = getSesion();
  if (!sesion || sesion.rol !== rol) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// ─── ESTADÍSTICAS GENERALES ─────────────────────

function getEstadisticas() {
  const actividades = getActividades().filter((a) => a.activa !== false);
  const inscripciones = getInscripciones();
  const organizadores = getUsuarios().filter(
    (u) => u.rol === "organizador" || u.rol === "administrador",
  );
  return {
    totalActividades: actividades.length,
    totalInscritos: inscripciones.length,
    totalOrganizadores: organizadores.length,
  };
}

// ─── ARRANCAR ───────────────────────────────────
inicializarDB();
