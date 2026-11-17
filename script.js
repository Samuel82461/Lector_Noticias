// Dirección de la API (Spaceflight News API, gratuita y sin clave)
const URL_API = "https://api.spaceflightnewsapi.net/v4/articles/?limit=10";

// Referencias a los elementos de la página
const contenedor = document.getElementById("noticias");
const estado = document.getElementById("estado");
const botonRefrescar = document.getElementById("btn-refrescar");

// Muestra un mensaje de estado (y lo marca como error si hace falta)
function mostrarEstado(texto, esError) {
  estado.textContent = texto;
  estado.className = esError ? "error" : "";
}

// Convierte la fecha del JSON (formato ISO) a un texto legible
function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  if (isNaN(fecha)) return "";
  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Comprueba que el enlace de la noticia sea una dirección http o https
function enlaceSeguro(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (error) {
    return false;
  }
}

// Crea en la página la tarjeta de una noticia a partir de un objeto del JSON
function crearNoticia(noticia) {
  const articulo = document.createElement("article");
  articulo.className = "noticia";

  if (noticia.image_url && enlaceSeguro(noticia.image_url)) {
    const imagen = document.createElement("img");
    imagen.src = noticia.image_url;
    imagen.alt = noticia.title;
    imagen.loading = "lazy";
    articulo.appendChild(imagen);
  }

  const contenido = document.createElement("div");
  contenido.className = "contenido";

  // El título es un botón: al hacer clic se muestra u oculta la noticia
  const titulo = document.createElement("h2");
  const botonTitulo = document.createElement("button");
  botonTitulo.type = "button";
  botonTitulo.className = "titulo-noticia";
  botonTitulo.textContent = noticia.title;
  botonTitulo.setAttribute("aria-expanded", "false");
  titulo.appendChild(botonTitulo);

  const datos = document.createElement("p");
  datos.className = "meta";
  datos.textContent = noticia.news_site + " · " + formatearFecha(noticia.published_at);

  // Parte que se despliega con el resumen y el enlace a la noticia completa
  const detalle = document.createElement("div");
  detalle.className = "detalle";
  detalle.hidden = true;

  const resumen = document.createElement("p");
  resumen.textContent = noticia.summary || "Esta noticia no tiene resumen.";
  detalle.appendChild(resumen);

  if (enlaceSeguro(noticia.url)) {
    const enlace = document.createElement("a");
    enlace.href = noticia.url;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Leer noticia completa";
    detalle.appendChild(enlace);
  }

  botonTitulo.addEventListener("click", function () {
    detalle.hidden = !detalle.hidden;
    botonTitulo.setAttribute("aria-expanded", String(!detalle.hidden));
  });

  contenido.appendChild(titulo);
  contenido.appendChild(datos);
  contenido.appendChild(detalle);
  articulo.appendChild(contenido);

  return articulo;
}

// Pide las noticias a la API con Fetch y las muestra en la página
async function cargarNoticias() {
  botonRefrescar.disabled = true;
  mostrarEstado("Cargando noticias...", false);

  try {
    const respuesta = await fetch(URL_API);

    // fetch no falla con errores HTTP (404, 500...), así que se revisa aquí
    if (!respuesta.ok) {
      throw new Error("La API respondió con el código " + respuesta.status);
    }

    // Se convierte el cuerpo de la respuesta de texto JSON a objeto de JavaScript
    const datos = await respuesta.json();
    const noticias = Array.isArray(datos.results) ? datos.results : [];

    contenedor.replaceChildren();

    if (noticias.length === 0) {
      mostrarEstado("No hay noticias disponibles por el momento.", false);
      return;
    }

    noticias.forEach(function (noticia) {
      contenedor.appendChild(crearNoticia(noticia));
    });

    const hora = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });
    mostrarEstado("Noticias actualizadas a las " + hora, false);
  } catch (error) {
    // Si ya había noticias en pantalla se conservan; solo se avisa del error
    mostrarEstado("No se pudieron cargar las noticias. Revisa tu conexión e inténtalo de nuevo.", true);
    console.error(error);
  } finally {
    botonRefrescar.disabled = false;
  }
}

// El botón refresca las noticias sin recargar la página
botonRefrescar.addEventListener("click", cargarNoticias);

// Carga inicial al abrir la página
cargarNoticias();
