const API = 'https://api.github.com';
const POR_PAGINA = 5;

const form = document.querySelector('#form-buscar');
const input = document.querySelector('#input-usuario');
const boton = document.querySelector('#btn-buscar');
const estado = document.querySelector('#estado');
const perfil = document.querySelector('#perfil');
const titulo = document.querySelector('#titulo-repos');
const repos = document.querySelector('#repos');

// Actividad 2
const orden = document.querySelector('#orden');
const bloqueOrden = document.querySelector('#bloque-orden');
const tituloLenguajes = document.querySelector('#titulo-lenguajes');
const listaLenguajes = document.querySelector('#lenguajes');

// Actividad 3
const btnMas = document.querySelector('#btn-mas');
const pie = document.querySelector('#pie');

// Usuario cuya búsqueda se mostró con éxito y última página de repositorios cargada
let usuarioActual = '';
let paginaActual = 1;

// Último valor del límite mostrado en el pie (para no retroceder si las
// respuestas de peticiones en paralelo llegan en desorden)
let limiteVisto = null;

// Actividad 3: mostrar en el pie cuántas peticiones quedan
function actualizarLimite(res) {
    const restantes = res.headers.get('x-ratelimit-remaining');
    if (restantes === null) return;
    const limite = res.headers.get('x-ratelimit-limit');
    const reinicio = res.headers.get('x-ratelimit-reset');
    const n = Number(restantes);

    // Se actualiza si es una nueva ventana de una hora o si el número bajó
    if (!limiteVisto || limiteVisto.reinicio !== reinicio || n < limiteVisto.restantes) {
        limiteVisto = { restantes: n, reinicio };
        pie.textContent = limite
            ? `Peticiones restantes: ${n} de ${limite} por hora`
            : `Peticiones restantes: ${n}`;
    }
}

// 1. Petición genérica con traducción de errores HTTP
async function obtenerJSON(url) {
    const res = await fetch(url);
    // Se lee la cabecera antes de revisar el estado: un 403 o un 404 también la traen
    actualizarLimite(res);
    if (res.status === 404) throw new Error('Usuario no encontrado');
    if (res.status === 403) {
        throw new Error('Límite de peticiones alcanzado');
    }
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json();
}

// Construye la URL de repositorios con URLSearchParams
function urlRepos(usuario, opciones) {
    const params = new URLSearchParams(opciones);
    return `${API}/users/${usuario}/repos?${params}`;
}

// 2. Pintar el perfil
function mostrarPerfil(u) {
    const img = document.createElement('img');
    img.src = u.avatar_url;
    img.alt = `Avatar de ${u.login}`;

    const nombre = document.createElement('h2');
    // si el usuario no registró un nombre, se muestra su login
    nombre.textContent = u.name ?? u.login;

    const datos = document.createElement('p');
    datos.textContent =
        `${u.public_repos} repositorios · ${u.followers} seguidores`;

    const enlace = document.createElement('a');
    enlace.href = u.html_url;
    enlace.target = '_blank';
    enlace.textContent = 'Ver en GitHub';

    const info = document.createElement('div');
    info.append(nombre, datos, enlace);
    perfil.replaceChildren(img, info);
    perfil.classList.remove('oculto');
}

// 3. Pintar la lista de repositorios
//    anexar = true: se añaden al final sin borrar los anteriores (Cargar más)
function mostrarRepos(lista, anexar = false) {
    if (!anexar) repos.innerHTML = '';
    lista.forEach(r => {
        const a = document.createElement('a');
        a.href = r.html_url;
        a.target = '_blank';
        a.textContent = r.name;

        const li = document.createElement('li');
        const lenguaje = r.language ?? 'sin lenguaje';
        li.append(a, ` - ${lenguaje} - ★ ${r.stargazers_count}`);
        repos.append(li);
    });
    titulo.classList.remove('oculto');
    bloqueOrden.classList.remove('oculto');
}

// Actividad 3: el botón se oculta si la API devolvió menos de cinco resultados
function actualizarBoton(cantidad) {
    btnMas.classList.toggle('oculto', cantidad < POR_PAGINA);
}

// 4. Actividad 2: contar repositorios por lenguaje
function contarLenguajes(lista) {
    const conteo = {};
    lista.forEach(r => {
        const lenguaje = r.language ?? 'Sin lenguaje';
        conteo[lenguaje] = (conteo[lenguaje] || 0) + 1;
    });
    // Convertir a arreglo [lenguaje, cantidad] y ordenar de mayor a menor
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]);
}

function mostrarLenguajes(lista) {
    const resumen = contarLenguajes(lista);
    listaLenguajes.replaceChildren();
    resumen.forEach(([lenguaje, cantidad]) => {
        const li = document.createElement('li');
        const palabra = cantidad === 1 ? 'repositorio' : 'repositorios';
        li.textContent = `${lenguaje}: ${cantidad} ${palabra}`;
        listaLenguajes.append(li);
    });
    tituloLenguajes.classList.remove('oculto');
}

function ocultarResultados() {
    perfil.classList.add('oculto');
    titulo.classList.add('oculto');
    tituloLenguajes.classList.add('oculto');
    bloqueOrden.classList.add('oculto');
    btnMas.classList.add('oculto');
    repos.innerHTML = '';
    listaLenguajes.innerHTML = '';
}

// 5. Evento submit: tres peticiones en paralelo
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = encodeURIComponent(input.value.trim());
    if (!usuario) return;

    boton.disabled = true;
    estado.className = '';
    estado.textContent = 'Buscando...';

    try {
        const [datosUsuario, datosRepos, todosLosRepos] = await Promise.all([
            obtenerJSON(`${API}/users/${usuario}`),
            // la primera página de 5 repositorios, según el orden elegido
            obtenerJSON(urlRepos(usuario, { sort: orden.value, per_page: POR_PAGINA, page: 1 })),
            // hasta 100 repositorios, solo para contar lenguajes
            obtenerJSON(urlRepos(usuario, { per_page: 100 }))
        ]);
        usuarioActual = usuario;
        paginaActual = 1;
        mostrarPerfil(datosUsuario);
        mostrarRepos(datosRepos);
        actualizarBoton(datosRepos.length);
        mostrarLenguajes(todosLosRepos);
        estado.textContent = '';
    } catch (error) {
        usuarioActual = '';
        ocultarResultados();
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        boton.disabled = false;
    }
});

// 6. Actividad 2: cambiar el orden vuelve a pedir la primera página
orden.addEventListener('change', async () => {
    if (!usuarioActual) return;

    estado.className = '';
    estado.textContent = 'Ordenando...';
    orden.disabled = true;
    btnMas.disabled = true;

    try {
        const datos = await obtenerJSON(
            urlRepos(usuarioActual, { sort: orden.value, per_page: POR_PAGINA, page: 1 })
        );
        paginaActual = 1;
        mostrarRepos(datos);          // reemplaza la lista
        actualizarBoton(datos.length);
        estado.textContent = '';
    } catch (error) {
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        orden.disabled = false;
        btnMas.disabled = false;
    }
});

// 7. Actividad 3: "Cargar más" trae la siguiente página y la añade a la lista
btnMas.addEventListener('click', async () => {
    if (!usuarioActual) return;

    estado.className = '';
    estado.textContent = 'Cargando más...';
    btnMas.disabled = true;
    orden.disabled = true;

    try {
        const siguiente = paginaActual + 1;
        const datos = await obtenerJSON(
            urlRepos(usuarioActual, { sort: orden.value, per_page: POR_PAGINA, page: siguiente })
        );
        paginaActual = siguiente;
        mostrarRepos(datos, true);    // anexa sin borrar los anteriores
        actualizarBoton(datos.length);
        estado.textContent = '';
    } catch (error) {
        estado.className = 'error';
        estado.textContent = error.message;
    } finally {
        btnMas.disabled = false;
        orden.disabled = false;
    }
});
