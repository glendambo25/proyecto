# Agente de voz para navegar una web

Un botón flotante, «🎙️ Hablar», que abre un asistente de voz en cualquier página de la web. El usuario le habla (o le escribe) y el asistente:

- **contesta con voz natural**, en español por defecto;
- **lee lo que hay en pantalla** y explica solo lo que de verdad aparece;
- **lleva al usuario a la página adecuada** según lo que pregunta, sin cortar la conversación;
- **señala** en pantalla dónde está cada cosa (scroll y marco rojo);
- **abre secciones** pulsando botones y pestañas;
- **rellena campos** de un formulario con lo que el usuario le dicta.

**Nunca envía, paga, firma, guarda ni borra nada.** Si hace falta, resalta el botón y le dice al usuario que lo pulse él.

Funciona con OpenAI Realtime (voz y razonamiento en tiempo real, por WebRTC). La clave de OpenAI se queda en el servidor; el navegador solo recibe una clave temporal.

## Archivos

| Archivo | Qué es |
|---|---|
| `voice-agent.js` | El agente completo: botón, panel, voz y herramientas. Un solo script, sin dependencias. |
| `server/session.js` | Endpoint del servidor que da al navegador la clave temporal (`POST /api/session`). |
| `example.html` | Página de ejemplo para probarlo. |

## Instalación (15 minutos)

1. **Servidor.** Copia `server/session.js` como endpoint `POST /api/session`. En Vercel o Next.js, guárdalo como `api/session.js` tal cual. En Express: `app.post('/api/session', handler)`. Añade la variable de entorno `OPENAI_API_KEY`. Recomendable: añadir ahí vuestro control de usuario logueado para que nadie de fuera gaste crédito.
2. **Web.** Sirve `voice-agent.js` como fichero estático y cárgalo en todas las páginas, antes de `</body>`:

```html
<script>
  window.VoiceAgentConfig = {
    language: 'es',
    name: 'Asistente',
    context: 'Qué es la web y qué puede hacer el usuario en ella, en dos o tres frases.',
    pages: [
      { url: '/', title: 'Inicio', description: 'Resumen y primeros pasos' },
      { url: '/tramites', title: 'Trámites', description: 'Lista de trámites y en qué paso va cada uno' },
      { url: '/documentos', title: 'Documentos', description: 'Subir y revisar documentos' }
    ]
  };
</script>
<script src="/voice-agent.js" defer></script>
```

3. **Prueba.** Abre la web en Chrome, pulsa «Hablar», acepta el micrófono y pregunta algo como «llévame a mis documentos». Para ver qué hace por dentro, añade `?vadebug=1` a la URL y abre la consola (F12).

## Configuración

| Opción | Para qué | Por defecto |
|---|---|---|
| `sessionUrl` | Dónde está el endpoint de la clave temporal | `/api/session` |
| `language` | Idioma de la voz y de los textos | `es` |
| `name` | Nombre del asistente en pantalla | `Asistente` |
| `context` | Lo que el asistente debe saber de la web (va en sus instrucciones) | vacío |
| `pages` | Páginas a las que puede llevar al usuario: `{ url, title, description }` | `[]` |
| `navigate` | **Apps de una sola página (React, Vue…):** función que cambia de ruta, p. ej. `url => router.push(url)` | sin ella, abre la página dentro de la llamada |
| `blocked` | Expresión regular con los textos de botón que nunca pulsa | enviar, pagar, firmar, guardar, borrar… |
| `onEvent` | Función que recibe cada paso (`navigate`, `click`, `fill`, `user_said`…) para analítica o memoria | ninguna |
| `debug` | Muestra en la consola todos los eventos de voz | `false` |

Desde código: `VoiceAgent.start()`, `VoiceAgent.stop()` y `VoiceAgent.readScreen()`.

## Cómo está hecho (lo aprendido)

- **La conversación no se corta al navegar.** En una web normal, cambiar de página recarga y corta la llamada. Por eso, mientras se habla, las páginas se abren en un marco a pantalla completa dentro de la misma página. Al colgar, el usuario se queda en la página donde estaba. En apps de una sola página se usa `navigate` y no hace falta el marco.
- **Margen antes de actuar.** Las acciones (navegar, pulsar, rellenar) esperan 1,2 s. Si el usuario sigue hablando en ese tiempo, no se hacen.
- **«Para» o «espera» lo callan al momento.**
- **Una respuesta cada vez.** Si pide hablar mientras ya habla, la petición espera a que termine. Evita el error «Conversation already has an active response».
- **Detección de turnos tranquila** (`semantic_vad`, `eagerness: low`), con supresión de ruido y de eco: no corta frases a la mitad.
- **Arranque rápido.** La clave temporal se pide al pasar el ratón por el botón, antes del clic.
- **Sin micrófono también funciona:** se le escribe y contesta en voz alta.
- **Solo páginas de la propia web.** No navega a otros dominios ni lee campos de contraseña.

## Requisitos y límites

- Chrome, Edge o Safari actuales, con HTTPS (el micrófono no funciona en HTTP, salvo en localhost).
- El navegador exige un clic del usuario antes de usar audio y micrófono: el botón «Hablar» es ese clic.
- El marco para navegar solo funciona con páginas del mismo dominio que la web.
- Coste: se paga por minuto de audio de OpenAI Realtime. Conviene limitar `/api/session` a usuarios logueados.
- Los nombres de modelo (`gpt-realtime`, `gpt-4o-mini-transcribe`) y la voz (`marin`) pueden cambiar; se ajustan con `REALTIME_MODEL` y `REALTIME_VOICE` en el servidor.

## Prompt para pasárselo a vuestro asistente de código

> Integra el agente de voz de esta carpeta en nuestra web. Lee primero `LEEME.md`. 1) Crea el endpoint `POST /api/session` a partir de `server/session.js` en nuestro backend, con la variable `OPENAI_API_KEY` y protegido por nuestro login. 2) Sirve `voice-agent.js` como estático y cárgalo en el layout común de todas las páginas. 3) Rellena `window.VoiceAgentConfig` con nuestras páginas reales (url, título y una descripción de una línea de cada una) y un `context` de dos o tres frases sobre la web. Si somos una app de una sola página, pasa `navigate` con nuestro router. 4) No cambies la lógica de `voice-agent.js`, solo la configuración.
