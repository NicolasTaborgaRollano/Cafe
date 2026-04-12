const API_URL = "https://cafe-uthx.onrender.com";

const cafesContainer = document.getElementById("cafesContainer");
const resultsInfo = document.getElementById("resultsInfo");
const cafeForm = document.getElementById("cafeForm");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const comentarioForm = document.getElementById("comentarioForm");
const comentarioTexto = document.getElementById("comentarioTexto");
const comentariosContainer = document.getElementById("comentariosContainer");

const authArea = document.getElementById("authActions");
const userBox = document.getElementById("userBox");
const userWelcome = document.getElementById("userWelcome");
const logoutBtn = document.getElementById("logoutBtn");

const openLoginBtn = document.getElementById("openLoginBtn");
const openRegisterBtn = document.getElementById("openRegisterBtn");

const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const closeRegisterModal = document.getElementById("closeRegisterModal");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


//const starsContainer = document.getElementById("starsContainer");
const stars = document.querySelectorAll(".star");

let cafeActualId = null;
let puntuacionSeleccionada = 0;

function getToken() {
  return localStorage.getItem("token");
}

function getUsuario() {
  const usuario = localStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
}

function setSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
  actualizarUIUsuario();
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  actualizarUIUsuario();
}

function actualizarUIUsuario() {
  const usuario = getUsuario();

  if (usuario) {
    authArea.classList.add("hidden");
    userBox.classList.remove("hidden");
    userWelcome.textContent = `Hola, ${usuario.nombre}`;
  } else {
    authArea.classList.remove("hidden");
    userBox.classList.add("hidden");
    userWelcome.textContent = "";
  }
}

function abrirModal(element) {
  element.classList.remove("hidden");
}

function cerrarModal(element) {
  element.classList.add("hidden");
}

function crearEstrellas() {
  const container = document.getElementById("ratingStars");

  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.innerHTML = "★";
    star.classList.add("star");
    star.dataset.value = i;

    // ⭐ HOVER (preview)
    star.addEventListener("mouseenter", () => {
      pintarEstrellas(i);
    });

    // ⭐ QUITAR HOVER
    star.addEventListener("mouseleave", () => {
      pintarEstrellas(puntuacionSeleccionada);
    });

    // ⭐ CLICK (guardar)
    star.addEventListener("click", async () => {
      const token = getToken();

      if (!token) {
            abrirModal(loginModal);        
            return;
      }

      puntuacionSeleccionada = i;
      pintarEstrellas(i);

      try {
        const response = await fetch(`${API_URL}/calificaciones`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            cafe_id: cafeActualId,
            puntuacion: i
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Error al calificar");
          return;
        }

        // 🔥 SIN ALERT MOLESTO
        mostrarMensaje("⭐ Calificación guardada");

        await obtenerCafes();

      } catch (error) {
        console.error(error);
        alert("Error al calificar");
      }
    });

    container.appendChild(star);
  }
}
function estrellasPromedio(valor) {
  const full = Math.floor(valor);
  const half = valor - full >= 0.5;
  let html = "";

  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += "★";
    else html += "☆";
  }

  return html;
}

function mostrarMensaje(texto) {
  const msg = document.createElement("div");
  msg.textContent = texto;

  msg.style.position = "fixed";
  msg.style.bottom = "20px";
  msg.style.right = "20px";
  msg.style.background = "#2d1f19";
  msg.style.color = "white";
  msg.style.padding = "12px 18px";
  msg.style.borderRadius = "12px";
  msg.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
  msg.style.zIndex = "9999";

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 2000);
}
async function obtenerCafes() {
  try {
    const response = await fetch(`${API_URL}/cafes`);
    const cafes = await response.json();
    renderizarCafes(cafes);
  } catch (error) {
    console.error("Error obteniendo cafés:", error);
    cafesContainer.innerHTML = `
      <div class="empty-state">
        Error cargando cafés. Verifica que el backend esté corriendo.
      </div>
    `;
    resultsInfo.textContent = "Error";
  }
}

function renderizarCafes(cafes) {
  if (!Array.isArray(cafes) || cafes.length === 0) {
    cafesContainer.innerHTML = `
      <div class="empty-state">
        No se encontraron cafés.
      </div>
    `;
    resultsInfo.textContent = "0 resultados";
    return;
  }

  resultsInfo.textContent = `${cafes.length} café(s) encontrados`;

  cafesContainer.innerHTML = cafes
    .map(
      (cafe) => `
        <div class="cafe-card">
          <img src="${API_URL}${cafe.imagen}" alt="${cafe.nombre}" />           <div class="cafe-card-body">
            <h4>${cafe.nombre}</h4>
            <p>${cafe.descripcion}</p>
            <div class="price-rating">
              <span class="price">BOB ${Number(cafe.precio).toFixed(2)}</span>
              <span class="rating">⭐ ${Number(cafe.rating || 0).toFixed(1)}</span>
            </div>
            <button onclick="verCafe(${cafe.id})">Ver detalles</button>
          </div>
        </div>
      `
    )
    .join("");
}

async function buscarCafes() {
  const texto = searchInput.value.trim();

  if (!texto) {
    obtenerCafes();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cafes/search/${encodeURIComponent(texto)}`);
    const cafes = await response.json();
    renderizarCafes(cafes);
  } catch (error) {
    console.error("Error buscando cafés:", error);
  }
}

cafeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const precio = document.getElementById("precio").value.trim();
  const imagenInput = document.getElementById("imagen");
  const imagenFile = imagenInput.files[0];

  if (!nombre || !descripcion || !precio || !imagenFile) {
    alert("Completa todos los campos y selecciona una imagen");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("descripcion", descripcion);
  formData.append("precio", precio);
  formData.append("imagen", imagenFile);

  try {
    const response = await fetch(`${API_URL}/cafes`, {
      method: "POST",
      body: formData
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      alert("El backend devolvió una respuesta no válida.");
      return;
    }

    if (!response.ok) {
      alert(data.error || "Error al agregar café");
      return;
    }

    cafeForm.reset();
    await obtenerCafes();
    alert("Café agregado correctamente");
  } catch (error) {
    console.error("Error insertando café:", error);
    alert("No se pudo subir el café");
  }
});

async function verCafe(id) {
  
  cafeActualId = id;
  puntuacionSeleccionada = 0;
  pintarEstrellas(0);

  try {
    const response = await fetch(`${API_URL}/cafes/${id}`);
    const cafe = await response.json();

    modalBody.innerHTML = `
  <div class="modal-cafe">
    <img src="${cafe.imagen}" alt="${cafe.nombre}" />
    <div class="modal-info">
      <h2>${cafe.nombre}</h2>
      <p><strong>Descripción:</strong> ${cafe.descripcion}</p>
      <p><strong>Precio:</strong> $${Number(cafe.precio).toFixed(2)}</p>
      <p><strong>Rating promedio:</strong> 
        ${estrellasPromedio(cafe.rating || 0)} (${Number(cafe.rating || 0).toFixed(1)})
      </p>
  </div>

  <div class="rating-box">
    <h3>Calificar este café</h3>
    <div id="ratingStars" class="rating-stars"></div>
  </div>
`;

    abrirModal(modal);
    
crearEstrellas(); // 👈 SIN NADA ADENTRO

    comentarioTexto.value = "";
    await cargarComentarios(id);
  } catch (error) {
    console.error("Error cargando detalle del café:", error);
  }
}

async function cargarTopCafes() {
  const res = await fetch(`${API_URL}/cafes/top`);
  const data = await res.json();

  document.getElementById("topCafes").innerHTML = data.map(cafe => `
    <div class="cafe-card">
      <img src="${cafe.imagen}" />
      <div class="cafe-card-body">
        <h4>${cafe.nombre}</h4>
        <p>${estrellasPromedio(cafe.rating)}</p>
      </div>
    </div>
  `).join("");
}

cargarTopCafes();
async function cargarComentarios(cafeId) {
  try {
    const response = await fetch(`${API_URL}/comentarios/${cafeId}`);
    const comentarios = await response.json();

    if (!Array.isArray(comentarios) || comentarios.length === 0) {
      comentariosContainer.innerHTML = `
        <div class="empty-state">
          Este café todavía no tiene comentarios.
        </div>
      `;
      return;
    }

    comentariosContainer.innerHTML = comentarios
      .map(
        (comentario) => `
          <div class="comentario-item">
            <div class="comentario-header">
              <strong>${comentario.cliente_nombre || "Usuario"}</strong>
              <small>${formatearFecha(comentario.creado)}</small>
            </div>
            <p>${comentario.comentario}</p>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error cargando comentarios:", error);
    comentariosContainer.innerHTML = `
      <div class="empty-state">
        No se pudieron cargar los comentarios.
      </div>
    `;
  }
}

comentarioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!cafeActualId) return;

  const token = getToken();

  if (!token) {
    alert("Debes iniciar sesión para comentar");
    return;
  }

  const texto = comentarioTexto.value.trim();

  if (!texto) {
    alert("Escribe un comentario");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        cafe_id: cafeActualId,
        comentario: texto
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error al agregar comentario");
      return;
    }

    comentarioTexto.value = "";
    await cargarComentarios(cafeActualId);
  } catch (error) {
    console.error("Error agregando comentario:", error);
    alert("No se pudo agregar el comentario");
  }
});

function pintarEstrellas(valor) {
  const stars = document.querySelectorAll(".star");

  stars.forEach((star) => {
    const val = Number(star.dataset.value);
    star.classList.toggle("active", val <= valor);
  });
}


stars.forEach((star) => {
  star.addEventListener("click", async () => {
    const token = getToken();

    if (!token) {
      alert("Debes iniciar sesión para calificar");
      return;
    }

    if (!cafeActualId) return;

    const valor = Number(star.dataset.value);
    puntuacionSeleccionada = valor;
    pintarEstrellas(valor);

    try {
      const response = await fetch(`${API_URL}/calificaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          cafe_id: cafeActualId,
          puntuacion: valor
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error al guardar calificación");
        return;
      }

      alert("Calificación guardada correctamente");
      await obtenerCafes();
      await verCafe(cafeActualId);
    } catch (error) {
      console.error("Error calificando café:", error);
      alert("No se pudo guardar la calificación");
    }
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const response = await fetch(`${API_URL}/clientes/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Error al iniciar sesión");
      return;
    }

    setSesion(data.token, data.cliente);
    loginForm.reset();
    cerrarModal(loginModal);
    alert("Inicio de sesión exitoso");
  } catch (error) {
    console.error("Error en login:", error);
    alert("No se pudo iniciar sesión");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("registerNombre").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  console.log("ENVIANDO:", { nombre, email, password });

  try {
    const response = await fetch("http://127.0.0.1:3000/clientes/registro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre, email, password })
    });

    console.log("STATUS:", response.status);

    const text = await response.text();
    document.body.innerHTML = text;

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("El backend devolvió algo raro");
      return;
    }

    if (!response.ok) {
      alert(data.error || "Error al registrarse");
      return;
    }

    alert("Registro exitoso 🔥");

  } catch (error) {
    console.error("ERROR REAL:", error);
    alert("No se pudo registrar el usuario");
  }
});

openLoginBtn.addEventListener("click", () => abrirModal(loginModal));
openRegisterBtn.addEventListener("click", () => abrirModal(registerModal));
closeLoginModal.addEventListener("click", () => cerrarModal(loginModal));
closeRegisterModal.addEventListener("click", () => cerrarModal(registerModal));
logoutBtn.addEventListener("click", () => {
  cerrarSesion();
  alert("Sesión cerrada");
});

searchBtn.addEventListener("click", buscarCafes);

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    buscarCafes();
  }
});

closeModal.addEventListener("click", () => {
  cerrarModal(modal);
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    cerrarModal(modal);
  }
});

loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    cerrarModal(loginModal);
  }
});

registerModal.addEventListener("click", (e) => {
  if (e.target === registerModal) {
    cerrarModal(registerModal);
  }
});

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleString("es-BO");
}

actualizarUIUsuario();
obtenerCafes();

window.verCafe = verCafe;