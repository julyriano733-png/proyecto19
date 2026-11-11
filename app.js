

// ---------- 1. VARIABLES ----------

// true  = usa datos de ejemplo (para probar la interfaz sin Reddit)
// false = pide los datos reales a Reddit (lo que pide el PDF)
const MODO_DEMO = true;

// Nombre con el que guardamos los carriles en localStorage
const CLAVE_STORAGE = "carriles-reddit";

// Lista con los nombres de los subreddits que el usuario tiene ahora.
// Es "let" porque cambia (se agregan y se borran carriles).
let carriles = [];

// Buscamos los elementos del HTML por su id y los guardamos en variables
const contenedorCarriles = document.getElementById("carriles");
const btnMas = document.getElementById("btn-mas");
const modal = document.getElementById("modal");
const formulario = document.getElementById("formulario");
const inputSubreddit = document.getElementById("nombre-subreddit");
const mensajeError = document.getElementById("mensaje-error");
const btnCancelar = document.getElementById("btn-cancelar");

// ---------- 2. LOCALSTORAGE (guardar y leer carriles) ----------

// Guarda la lista de carriles en el navegador.
// localStorage solo guarda TEXTO, por eso usamos JSON.stringify
// (convierte la lista en texto JSON, por ejemplo '["javascript","python"]').
function guardarCarriles() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(carriles));
}

// Lee la lista guardada. Si no hay nada (o está dañado), devuelve una lista vacía.
function leerCarriles() {
  const texto = localStorage.getItem(CLAVE_STORAGE); // devuelve null si no existe
  if (texto === null) {
    return [];
  }
  try {
    // JSON.parse convierte el texto JSON de nuevo en una lista de verdad
    const lista = JSON.parse(texto);
    if (Array.isArray(lista)) {//serciora que sea de tipo lista osea un arreglo
      return lista;
    }
    return [];
  } catch (error) {
    // Si el texto estaba dañado, parse falla y caemos aquí
    return [];
  }
}

// ---------- 3. LIMPIAR EL NOMBRE ----------

// Convierte "  /r/JavaScript " en "javascript"
function limpiarNombre(texto) {
  let nombre = texto.trim().toLowerCase(); // quita espacios y pasa a minúsculas
  nombre = nombre.replace("/r/", "");      // quita "/r/" si lo escribió
  nombre = nombre.replace("r/", "");       // quita "r/" si lo escribió
  return nombre;
}

// ---------- 4. DATOS DE EJEMPLO (solo para MODO_DEMO) ----------

// Crea datos falsos con la MISMA forma que el JSON de Reddit:
// { data: { children: [ { data: { title, author, score, permalink } } ] } }
// Así el resto del código funciona igual con datos reales o falsos.
function crearDatosDeEjemplo(nombre) {
  const hijos = [];
  for (let i = 1; i <= 8; i++) {
    hijos.push({//agrega un obj nuevo a la lista en cada vuleta
      data: {
        title: "[DEMO] Publicación de ejemplo " + i + " de r/" + nombre,
        author: "usuario_demo" + i,
        score: i * 37,//puntaje multiplicado
        permalink: "/r/" + nombre + "/"//enlace flso
      }
    });
  }
  return { data: { children: hijos } }; //organizacion de reddit
}

// ---------- 5. PEDIR LOS POSTS A REDDIT ----------

// "async" permite usar "await" dentro. Devuelve la lista de posts,
// o lanza un Error con un mensaje claro si algo sale mal.
async function pedirPosts(nombre) {// async acciones toman tiempo,no trabar

  // En modo demo no hablamos con Reddit
  if (MODO_DEMO) {
    return crearDatosDeEjemplo(nombre).data.children;
  }

  // 1) Hacer la petición. Si no hay internet o el navegador la bloquea,
  //    fetch lanza un error y lo atrapamos con catch.
  let respuesta;
  try {
    // encodeURIComponent protege caracteres raros; ?limit=15 pide máximo 15 posts
    respuesta = await fetch(
      "https://www.reddit.com/r/" + encodeURIComponent(nombre) + ".json?limit=15"
    );// si falla red
  } catch (error) {
    throw new Error(//alerta controlada
      "No se pudo conectar con Reddit. Revisa tu internet; también puede ser que el navegador bloquee la petición."
    );
  }

  // 2) Revisar el código de estado de la respuesta
  if (respuesta.status === 404) {//codigo NO ENCONTRADO ,alerta controlada
    throw new Error("El subreddit r/" + nombre + " no existe.");
  }
  if (respuesta.status === 403) {//PROHIBIDO
    throw new Error(
      "Reddit rechazó la petición (403). Puede ser un subreddit privado o que Reddit ya no permita leer su .json sin iniciar sesión."
    );
  }
  if (respuesta.status === 429) {//DEMASIADASPETICIONES
    throw new Error("Hiciste demasiadas peticiones a Reddit (429). Espera un minuto.");
  }
  if (!respuesta.ok) {// sio la repuesta no esta bien

    throw new Error("Reddit respondió con el error " + respuesta.status + ".");
  }

  // 3) Convertir el texto JSON en objetos.
  //    Si Reddit mandó una página HTML en vez de JSON, .json() falla.
  let datos;
  try {
    datos = await respuesta.json();//espera mili segundos,tranforma en objeto
  } catch (error) {
    throw new Error("Reddit no devolvió datos en formato JSON.");
  }

  // 4) Revisar que traiga posts
  if (!datos.data || !datos.data.children || datos.data.children.length === 0) {
    throw new Error("r/" + nombre + " no existe o no tiene publicaciones.");
  }

  return datos.data.children;
}

// ---------- 6. DIBUJAR EN PANTALLA ----------

// Muestra un mensaje de texto dentro de un carril ("Cargando..." o un error)
function mostrarMensaje(zonaPosts, texto, esError) {
  zonaPosts.textContent = "";                 // vacía lo que había
  const p = document.createElement("p");      // crea un <p>
  p.className = "mensaje";//css mensaje
  if (esError) {//true
    p.classList.add("error");    // le suma la clase roja
  }
  p.textContent = texto;//escribe frase
  zonaPosts.appendChild(p);     // lo mete en el carril
}

// Dibuja un post por cada elemento de la lista
function dibujarPosts(zonaPosts, posts) {
  zonaPosts.textContent = ""; // borra el "Cargando..." o los posts anteriores

  for (let i = 0; i < posts.length; i++) {
    // En el JSON, cada elemento trae sus datos dentro de ".data"
    const post = posts[i].data;

    // Fila del post
    const fila = document.createElement("div");
    fila.className = "post";//conecta con mi archivo de estilos css

    // Votos (score = votos a favor menos en contra)
    const voto = document.createElement("div");
    voto.className = "voto";//pone la clase CSS voto
    voto.textContent = "▲ " + post.score;

    // Enlace con el título.
    const enlace = document.createElement("a");
    enlace.href = "https://www.reddit.com" + post.permalink;
    enlace.target = "_blank";//nueva pestaña
    enlace.rel = "noopener noreferrer";//evita q reddit tenga control en mi pagina
    enlace.textContent = post.title;//da el titulo real de la publicacion

    // Autor
    const autor = document.createElement("div");
    autor.className = "autor";
    autor.textContent = "por u/" + post.author;

    // Caja que agrupa título y autor
    const textos = document.createElement("div");
    textos.className = "textos";
    textos.appendChild(enlace);//agupa esto en el div
    textos.appendChild(autor);

    // Armamos la fila: votos + textos, y la metemos en el carril
    fila.appendChild(voto);
    fila.appendChild(textos);
    zonaPosts.appendChild(fila);
  }
}

// recarga los posts de un carril, mostrando estados de carga y error
async function cargarPosts(nombre, zonaPosts) {
  mostrarMensaje(zonaPosts, "Cargando publicaciones...", false); // estado de carga
  try {
    const posts = await pedirPosts(nombre);   // espera a Reddit
    dibujarPosts(zonaPosts, posts);           // si todo salió bien, los dibuja
  } catch (error) {
    // si pedirPosts lanzó un Error, mostramos su mensaje
    mostrarMensaje(zonaPosts, error.message, true);
  }
}

// ---------- 7. CREAR Y ELIMINAR CARRILES ----------

// Construye la columna completa de un subreddit.
// Devuelve la zona donde irán los posts.
function crearCarril(nombre) {
  // Caja principal del carril
  const carril = document.createElement("section");
  carril.className = "carril";

  // Encabezado con el nombre y el menú
  const encabezado = document.createElement("div");
  encabezado.className = "carril-encabezado";

  const titulo = document.createElement("h2");
  titulo.textContent = "/r/" + nombre;

  const btnMenu = document.createElement("button");
  btnMenu.className = "btn-menu";
  btnMenu.textContent = "⋮";

  // Menú desplegable (empieza oculto)
  const menu = document.createElement("div");
  menu.className = "menu oculto";

  const btnRefrescar = document.createElement("button");
  btnRefrescar.textContent = "Refresh";

  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "Delete";

  menu.appendChild(btnRefrescar);
  menu.appendChild(btnEliminar);

  // Zona de posts
  const zonaPosts = document.createElement("div");
  zonaPosts.className = "zona-posts";

  // Armamos todo de adentro hacia afuera
  encabezado.appendChild(titulo);
  encabezado.appendChild(btnMenu);
  encabezado.appendChild(menu);
  carril.appendChild(encabezado);
  carril.appendChild(zonaPosts);
  contenedorCarriles.appendChild(carril);

  // Eventos de los botones. Estas funciones "recuerdan" nombre, zonaPosts,
  // menu y carril porque se crearon dentro de crearCarril.
  btnMenu.addEventListener("click", function () {
    menu.classList.toggle("oculto"); // si está oculto lo muestra, y al revés
  });

  btnRefrescar.addEventListener("click", function () {
    menu.classList.add("oculto");    // cierra el menú
    cargarPosts(nombre, zonaPosts);  // vuelve a pedir los datos
  });

  btnEliminar.addEventListener("click", function () {
    eliminarCarril(nombre, carril);
  });

  return zonaPosts;
}

// Quita el carril de la pantalla y de la lista guardada
function eliminarCarril(nombre, elementoCarril) {
  elementoCarril.remove(); // lo borra de la página

  // Armamos una lista nueva sin ese nombre
  const nuevaLista = [];
  for (let i = 0; i < carriles.length; i++) {
    if (carriles[i] !== nombre) {
      nuevaLista.push(carriles[i]);
    }
  }
  carriles = nuevaLista;
  guardarCarriles(); // actualiza localStorage
}

// ---------- 8. POPUP Y FORMULARIO ----------

function abrirModal() {
  modal.classList.remove("oculto");  // muestra el popup
  inputSubreddit.value = "";         // limpia el campo
  mensajeError.textContent = "";     // limpia mensajes viejos
  inputSubreddit.focus();            // deja el cursor listo para escribir, titilando
}

function cerrarModal() {
  modal.classList.add("oculto");//vuelve a esconder
}

// Se ejecuta cuando el usuario enter en formulario
async function manejarFormulario(evento) {
  evento.preventDefault(); // evita que la página se recargue

  const nombre = limpiarNombre(inputSubreddit.value);//inputSubredit.. lo q da el usuario,
  //y pasa por limpiar nombre y quita espacios etcx

  // Validaciones simples
  if (nombre === "") {
    mensajeError.textContent = "Escribe el nombre de un subreddit.";
    return; // return corta la función aquí
  }
  if (carriles.includes(nombre)) {
    mensajeError.textContent = "Ese carril ya existe.";
    return;
  }

  mensajeError.textContent = "Verificando que el subreddit exista...";

  try {
    // Pedimos los posts: si el subreddit no existe, esto lanza un Error
    const posts = await pedirPosts(nombre);

    // Si llegamos aquí, sí existe: lo guardamos y dibujamos el carril
    carriles.push(nombre);
    guardarCarriles();
    const zonaPosts = crearCarril(nombre);
    dibujarPosts(zonaPosts, posts);
    cerrarModal();
  } catch (error) {
    // Mostramos el problema dentro del popup
    mensajeError.textContent = error.message;
  }
}

// ---------- 9. EVENTOS ----------
btnMas.addEventListener("click", abrirModal);//ejecuta abrir modal , ventane emergente
btnCancelar.addEventListener("click", cerrarModal);
formulario.addEventListener("submit", manejarFormulario);

// ---------- 10. INICIO ----------
// Se ejecuta al abrir la página: reconstruye los carriles guardados
function iniciar() {
  if (MODO_DEMO) {//true or false 
    document.getElementById("aviso").classList.remove("oculto");
    //interruptor de datos falsos
  }
//restaura las columnas q agrege antes y no pierde info
  carriles = leerCarriles();
  for (let i = 0; i < carriles.length; i++) {
    const zonaPosts = crearCarril(carriles[i]);
    cargarPosts(carriles[i], zonaPosts);
  }
}

iniciar(); // arrancamos la app , como darle play