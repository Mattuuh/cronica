# Periódico interactivo para GitHub Pages

Ejemplo estático de un periódico digital con efecto de cambio de hoja física.

## Tecnología

- HTML5
- CSS3
- JavaScript vanilla
- StPageFlip 2.0.7 cargado desde jsDelivr
- Sin backend
- Sin npm
- Sin proceso de compilación

## Publicarlo en GitHub Pages

1. Creá un repositorio en GitHub.
2. Subí todo el contenido de esta carpeta a la raíz del repositorio.
3. En GitHub ingresá a **Settings > Pages**.
4. En **Build and deployment**, seleccioná **Deploy from a branch**.
5. Elegí la rama `main` y la carpeta `/ (root)`.
6. Guardá los cambios.

Después de que GitHub complete el despliegue, el sitio quedará disponible en una URL similar a:

`https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`

## Personalización

### Texto

Todo el contenido del periódico se encuentra en `index.html`. Cada hoja es un elemento:

```html
<article class="page">
    ...
</article>
```

La portada y la contratapa usan `data-density="hard"` para que se comporten como tapas rígidas.

### Fotografías

Los bloques grises con el texto `FOTOGRAFÍA PRINCIPAL` o `FOTO DE ARCHIVO` son placeholders. Podés reemplazarlos por imágenes:

```html
<img class="real-photo" src="assets/mi-foto.jpg" alt="Descripción de la fotografía">
```

Luego agregá al CSS:

```css
.real-photo {
    width: 100%;
    height: 190px;
    object-fit: cover;
}
```

### Publicidades

Las publicidades son HTML/CSS y pueden reemplazarse por imágenes, texto, logos o enlaces.

## Estructura

```text
periodico-github-pages/
├── .nojekyll
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
```

## Nota sobre StPageFlip

El proyecto carga StPageFlip desde jsDelivr. Esto simplifica el despliegue en GitHub Pages. Si querés eliminar esa dependencia externa, descargá `page-flip.browser.min.js` versión 2.0.7, guardalo dentro de `js/` y reemplazá la etiqueta `<script>` correspondiente en `index.html`.
