
const URL_BASE = "https://jsonplaceholder.typicode.com/users/";

//  carriles en localStorage
const CLAVE_STORAGE = "carriles-usuarios";

let carriles = [];


const contenedorCarriles = document.getElementById("carriles");
const btnMas = document.getElementById("btn-mas");
const modal = document.getElementById("modal");
const formulario = document.getElementById("formulario");
const inputUsuario = document.getElementById("numero-usuario");
const mensajeError = document.getElementById("mensaje-error");
const btnCancelar = document.getElementById("btn-cancelar");

// ---------- 2. LOCALSTORAGE (guardar y leer carriles) ----------

// Guarda la lista de carriles en el navegador.
// localStorage solo guarda TEXTO, por eso usamos JSON.stringify
function guardarCarriles() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(carriles));
}

// 
function leerCarriles() {
  const texto = localStorage.getItem(CLAVE_STORAGE); // Guarda en texto carriles-usuarios
  if (texto === null) {
    return [];//nada
  }
  try {
    // JSON.parse convierte el texto JSON de nuevo en una lista de verdad
    const lista = JSON.parse(texto);
    if (Array.isArray(lista)) {//¿Array es Array?
      return lista;
    }
    return [];
  } catch (error) {//texto dañado
    return [];
  }
}

// ---------- 3. PEDIR EL USUARIO A LA API ----------

async function pedirUsuario(numero) {// async acciones toman tiempo,no trabar

  let respuesta;
  try {
    respuesta = await fetch(URL_BASE + numero);//fetch busca en la web,link y usuario
  } catch (error) {
    throw new Error("No se pudo conectar. Revisa tu internet.");//alerta controlada
  }

 
  if (respuesta.status === 404) {// NO ENCONTRADO
    throw new Error("El usuario " + numero + " no existe (solo hay del 1 al 10).");
  }
  if (!respuesta.ok) {// respuesta no verdadera
    throw new Error("El servidor respondió con el error " + respuesta.status + ".");
  }

  // 3) Convertir JSON  en arreglo
  return await respuesta.json();
}

// ---------- 4. DIBUJAR EN PANTALLA ----------


function mostrarMensaje(zonaDatos, texto, esError) {
  zonaDatos.textContent = "";                 // vacía lo que había
  const p = document.createElement("p");      
  p.className = "mensaje";//css mensaje
  if (esError) {//true
    p.classList.add("error"); //CSS rojo
  }
  p.textContent = texto;//escribe 
  zonaDatos.appendChild(p);     // mete p en zona datos
}

// Crea UNA fila con una etiqueta y un valor. Ejemplo: "Correo" y "a@b.com".

function crearFila(etiqueta, valor) {
  const fila = document.createElement("div");
  fila.className = "dato";//css

  const textoEtiqueta = document.createElement("div");
  textoEtiqueta.className = "etiqueta";
  textoEtiqueta.textContent = etiqueta;

  const textoValor = document.createElement("div");
  textoValor.className = "valor";
  textoValor.textContent = valor;

  fila.appendChild(textoEtiqueta);//mete textoetiqueta en fila
  fila.appendChild(textoValor);
  return fila;
}

// Dibuja los datos del usuario, una fila debajo de otra.

function dibujarUsuario(zonaDatos, usuario) {
  zonaDatos.textContent = ""; // borra el "Cargando..." o lo que había antes

  zonaDatos.appendChild(crearFila("Nombre", usuario.name));
  zonaDatos.appendChild(crearFila("Usuario", "@" + usuario.username));
  zonaDatos.appendChild(crearFila("Correo", usuario.email));
  zonaDatos.appendChild(crearFila("Teléfono", usuario.phone));
  zonaDatos.appendChild(crearFila("Ciudad", usuario.address.city));
  zonaDatos.appendChild(crearFila("Empresa", usuario.company.name));
  zonaDatos.appendChild(crearFila("Sitio web", usuario.website));
}

// recarga los datos de un carril, mostrando estados de carga y error
async function cargarUsuario(numero, zonaDatos) {
  mostrarMensaje(zonaDatos, "Cargando datos...", false); // estado de carga
  try {
    const usuario = await pedirUsuario(numero);   // espera a la API
    dibujarUsuario(zonaDatos, usuario);           // si todo salió bien, lo dibuja
  } catch (error) {
    mostrarMensaje(zonaDatos, error.message, true);
  }
}

// ---------- 5. CREAR Y ELIMINAR CARRILES ----------

function crearCarril(numero) {
 
  const carril = document.createElement("section");
  carril.className = "carril";

  // Encabezado con el nombre y el menú
  const encabezado = document.createElement("div");
  encabezado.className = "carril-encabezado";

  const titulo = document.createElement("h2");
  titulo.textContent = "Usuario " + numero;

  const btnMenu = document.createElement("button");
  btnMenu.className = "btn-menu";
  btnMenu.textContent = "⋮";

  // Menú desplegable 
  const menu = document.createElement("div");
  menu.className = "menu oculto";

  const btnRefrescar = document.createElement("button");
  btnRefrescar.textContent = "Refresh";

  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "Delete";

  menu.appendChild(btnRefrescar);//mete btn en menu
  menu.appendChild(btnEliminar);

  // Zona de datos
  const zonaDatos = document.createElement("div");
  zonaDatos.className = "zona-datos";

  // Armamos todo de adentro hacia afuera
  encabezado.appendChild(titulo);//mete titulo en encabezado
  encabezado.appendChild(btnMenu);
  encabezado.appendChild(menu);
  carril.appendChild(encabezado);
  carril.appendChild(zonaDatos);
  contenedorCarriles.appendChild(carril);

  
  btnMenu.addEventListener("click", function () {
    menu.classList.toggle("oculto"); // si está oculto lo muestra, y al revés
  });

  btnRefrescar.addEventListener("click", function () {
    menu.classList.add("oculto");      // cierra el menú
    cargarUsuario(numero, zonaDatos);  // vuelve a pedir los datos
  });

  btnEliminar.addEventListener("click", function () {
    eliminarCarril(numero, carril);
  });

  return zonaDatos;
}

// Quita el carril de la pantalla y de la lista guardada
function eliminarCarril(numero, elementoCarril) {
  elementoCarril.remove(); // lo borra de la página

  // Armamos una lista nueva sin ese número
  const nuevaLista = [];
  for (let i = 0; i < carriles.length; i++) {
    if (carriles[i] !== numero) {
      nuevaLista.push(carriles[i]);
    }
  }
  carriles = nuevaLista;
  guardarCarriles(); // actualiza localStorage
}

// ---------- 6. POPUP Y FORMULARIO ----------

function abrirModal() {
  modal.classList.remove("oculto");  // muestra el popup
  inputUsuario.value = "";           // limpia el campo
  mensajeError.textContent = "";     // limpia mensajes viejos
  inputUsuario.focus();              // deja el cursor listo para escribir, titilando
}

function cerrarModal() {
  modal.classList.add("oculto");//vuelve a esconder
}

// Se ejecuta cuando el usuario da enter en el formulario
async function manejarFormulario(evento) {
  evento.preventDefault(); // evita que la página se recargue

  const numero = inputUsuario.value.trim();//lo que escribió el usuario, sin espacios

  // Validaciones simples
  if (numero === "" || isNaN(numero)) {//vacío, o no es un número (isNaN)
    mensajeError.textContent = "Escribe un número, por ejemplo 1.";
    return; // return corta la función aquí
  }
  if (carriles.includes(numero)) {
    mensajeError.textContent = "Ese carril ya existe.";
    return;
  }

  mensajeError.textContent = "Buscando el usuario...";

  try {
//pedimos datos de ususario con su numero
    const usuario = await pedirUsuario(numero);

    // Si llegamos aquí, sí existe: lo guardamos y dibujamos el carril
    carriles.push(numero);//guarda num en carriles
    guardarCarriles();
    const zonaDatos = crearCarril(numero);
    dibujarUsuario(zonaDatos, usuario);
    cerrarModal();
  } catch (error) {
    // Mostramos el problema dentro del popup
    mensajeError.textContent = error.message;
  }
}

// ---------- 7. EVENTOS ----------
btnMas.addEventListener("click", abrirModal);//ejecuta abrir modal , ventana emergente
btnCancelar.addEventListener("click", cerrarModal);
formulario.addEventListener("submit", manejarFormulario);

// ---------- 8. INICIO ----------
// Se ejecuta al abrir la página: reconstruye los carriles guardados
function iniciar() {
  //restaura las columnas que agregué antes y no pierde info
  carriles = leerCarriles();
  for (let i = 0; i < carriles.length; i++) {
    const zonaDatos = crearCarril(carriles[i]);
    cargarUsuario(carriles[i], zonaDatos);
  }
}

iniciar(); // arrancamos la app , como darle play