# Buscador de perfiles GitHub

Aplicación web que consulta la API REST pública de GitHub y muestra el
perfil de un usuario y sus repositorios más recientes.

## Qué hace
- Busca un usuario y muestra su avatar, nombre, repositorios y seguidores.
- Lista sus repositorios y permite ordenarlos por `updated`, `created` o `full_name`.
- Muestra un resumen de los lenguajes más usados.
- Botón "Cargar más" para traer los siguientes cinco repositorios.
- Muestra en el pie cuántas peticiones quedan (`x-ratelimit-remaining`).
- Maneja errores: usuario no encontrado (404) y límite de peticiones (403).

## Sitio publicado
https://francesco-cloud1.github.io/buscador-github/

## Cómo ejecutarlo localmente
Abrir la carpeta en Visual Studio Code y ejecutar `index.html` con la
extensión Live Server.

## Tecnologías
HTML, CSS, JavaScript (fetch, async/await, Promise.all) y la API REST de GitHub.

## Seguridad
La aplicación no usa ningún token de acceso: consume solo endpoints
públicos (límite de 60 peticiones por hora).

## Autor
Francesco Gabriel Canal Acevedo — Desarrollo de Software I, UNSAAC