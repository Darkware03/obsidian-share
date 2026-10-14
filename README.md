# Obsidian Share

**Obsidian Share** es una aplicación web minimalista y segura para crear y compartir documentos Markdown mediante enlaces públicos únicos.

## Funcionalidades
- Editor de Markdown en tiempo real con previsualización.
- Renderizado seguro de Markdown con protección contra XSS.
- Generación de enlaces públicos criptográficamente seguros.
- Diseño minimalista y moderno orientado a SaaS empresarial.
- Totalmente dockerizado, sin necesidad de dependencias locales.

## Arquitectura y Tecnologías
- **Frontend**: Vue 3 (Composition API, `<script setup>`), Vite, Tailwind CSS. Renderizado de Markdown mediante `markdown-it` y sanitización con `DOMPurify`.
- **Backend**: Node.js, Fastify, Zod (validación), y Prisma ORM. Generación de tokens seguros con `node:crypto`.
- **Base de datos**: PostgreSQL con migraciones de Prisma.
- **Infraestructura**: Docker Compose y Nginx como proxy inverso.

## Requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuración Inicial

1. Clona el repositorio o abre el proyecto en tu entorno local.
2. Crea el archivo de variables de entorno:

```bash
cp .env.example .env
```

*Nota: Modifica las variables en el archivo `.env` según tus necesidades de despliegue (como las contraseñas o el dominio base).*

## Arranque de la Aplicación

Para construir e iniciar todos los servicios en segundo plano, ejecuta:

```bash
docker compose up -d --build
```

Esto descargará las imágenes necesarias, instalará las dependencias dentro de los contenedores, ejecutará las migraciones de base de datos automáticamente, y levantará la aplicación.

## Acceso a la Aplicación

Una vez que los contenedores estén funcionando correctamente, la aplicación estará disponible en tu navegador en:

**http://localhost:8080**

## Detener el Sistema

Para detener los servicios sin perder los datos:

```bash
docker compose down
```
*(Nota: Si deseas eliminar todos los datos y volúmenes, puedes usar `docker compose down -v`, pero esto **borrará permanentemente** los documentos).*

## Configuración del Dominio (Producción)
Si deseas desplegar en un dominio público, asegúrate de actualizar la variable `PUBLIC_BASE_URL` en tu archivo `.env` para que apunte al dominio real (ej. `https://markdown.ejemplo.com`). Nginx está configurado para proxyar `/api` al backend, y servir los estáticos en `/`. Te sugerimos agregar soporte para HTTPS (TLS) configurando un proxy inverso frente a Nginx (por ejemplo, con Traefik, Caddy o Cloudflare).

## Persistencia y Copias de Seguridad
Los datos se almacenan en el volumen de Docker `pgdata`. Puedes respaldar PostgreSQL utilizando `pg_dump` conectándote al contenedor o respaldando el directorio físico del volumen dependiendo de la configuración de tu host.

## Limitaciones de Seguridad
- El límite de tamaño de documento es configurable vía `.env` (`MAX_MARKDOWN_BYTES`).
- Prevención de ataques automatizados a través del rate-limiting incorporado y control de tamaño.
- Nginx maneja las cabeceras de seguridad fundamentales (`CSP`, `X-Frame-Options`).
- Los tokens nunca se muestran en un formato predecible ni secuencial, minimizando enumeración de documentos.

## Actualización de Contenedores
Si realizas cambios en el código, reconstruye los contenedores:

```bash
docker compose up -d --build
```

## Solución de Errores Habituales
- **La base de datos no se conecta**: Asegúrate de que las credenciales en la URL (`DATABASE_URL`) correspondan a los parámetros de PostgreSQL (`POSTGRES_USER` y `POSTGRES_PASSWORD`).
- **Problemas de CORS en la API**: Verifica la configuración de la variable de entorno `PUBLIC_BASE_URL`.
# obsidian-share
