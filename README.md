# La Cronista DPP — edición interactiva

Sitio estático listo para GitHub Pages. Incluye la crónica **“¿Ciencia, técnica o arte? La batalla por el banquillo en Ciencias Económicas”**, fotografías del material original, notas breves intercaladas y animación de cambio de hoja.

## Publicar en GitHub Pages

1. Subir el contenido de esta carpeta a la raíz del repositorio.
2. En GitHub, abrir **Settings → Pages**.
3. En **Build and deployment**, elegir **Deploy from a branch**.
4. Seleccionar la rama `main` y la carpeta `/(root)`.
5. Guardar y esperar a que finalice el deployment.

No requiere PHP, Node.js, base de datos ni compilación.

## Archivos

- `index.html`: contenido editorial.
- `css/styles.css`: diseño del periódico y adaptación responsive.
- `js/app.js`: inicialización de la animación y navegación.
- `assets/`: fotografías y piezas gráficas optimizadas en WebP.

La animación de páginas usa `page-flip@2.0.7` desde jsDelivr. Si la librería no pudiera cargarse, el contenido pasa a una presentación estática como respaldo.
