# Checklist antes de la demo

Guion: [`docs/demo-script.md`](demo-script.md).

## El día antes

- [ ] **Claves en `.env.local`** (en la raíz del repo; nunca en git ni por chat):
  ```
  ANTHROPIC_API_KEY=...   # asistente con Claude. Sin ella: "Offline mode", con fuente igualmente
  OPENAI_API_KEY=...      # agente de voz (OpenAI Realtime). Sin ella: voz de respaldo del navegador
  ```
  Opcionales: `ANTHROPIC_MODEL` (por defecto `claude-opus-5-5`), `REALTIME_MODEL` (`gpt-realtime`), `REALTIME_VOICE` (`marin`) y `DEMO_ASSISTANT_TIMEOUT_MS` (por defecto 12000: pasado ese tiempo, el modo demo usa la respuesta en caché u offline).
- [ ] `npm install` y `npm run dev`. Abre `http://localhost:3000/onboarding?demo=priya`.
- [ ] **Ensayo completo con las claves puestas** (dos veces, desde ↺ Reset). Así se guardan las respuestas reales de Claude en `.demo-cache/assistant.json`: si mañana falla la red, la demo las reproduce como *Cached answer (demo)*. Haz exactamente las preguntas del guion.
- [ ] **Grabación de respaldo:** graba un ensayo bueno (Windows: `Win + Alt + R` con la Xbox Game Bar, u OBS) y tenla abierta en otra pestaña o escritorio.
- [ ] Haz también un ensayo **sin red** (Wi-Fi apagado) para ver la voz de respaldo y la respuesta en caché u offline. Así no te pillan por sorpresa.

## 30 minutos antes

- [ ] **Navegador:** Chrome actualizado, una sola ventana, zoom al 100 %, sin extensiones que pinten la página, marcadores ocultos. Notificaciones del sistema en *No molestar*.
- [ ] **Micrófono:** abre la app en `http://localhost:3000` (el micro solo funciona en localhost o https). Candado → Micrófono → **Permitir**. En Windows: Configuración → Privacidad → Micrófono → permitir a Chrome. Elige el micro bueno, no el de la webcam si está lejos.
- [ ] **Audio:** volumen alto y salida por el altavoz que oiga la sala. Prueba que se oye la voz del agente.
- [ ] **Red:** Wi-Fi del sitio probado y el **hotspot del móvil** preparado como plan B. La voz en directo necesita red; el resto funciona en local.
- [ ] **Vista:** móvil (F12 → modo dispositivo → 375 × 812) o escritorio. Decide una y no la cambies a mitad.
- [ ] **↺ Reset** en el dock (borde izquierdo). Comprueba que estás en el onboarding y que Priya aparece la primera de la lista.
- [ ] Ten el guion abierto en otro dispositivo, no en la pantalla compartida.

## Durante

- Si una escena falla: **punto rojo del dock → número de escena**. Si falla todo: **↺ Reset** (5 s) o pon la grabación.
- La voz tarda unos segundos en conectar. Si no conecta en ~9 s, sale sola la **voz de respaldo**: toca la pregunta sugerida.
- No pulses *Add to my calendar*: descarga un archivo.

## Después

- Para salir del modo demo, abre `?demo=off` en cualquier página o, en el dock, punto rojo → *Exit demo mode*.

## Cómo funciona el modo demo

| Qué | Cómo |
|---|---|
| Activar | `?demo=priya` en cualquier ruta (`?demo=1` es un alias) |
| Reiniciar | botón ↺ del dock, o `?demo=priya&reset=1` |
| Salir | `?demo=off` |
| Estado ideal | `lib/demo.ts`: Priya llegó hace 21 días, con visado, sin contrato, y la TIE vence en 9 días |
| Respaldo del asistente | `app/api/assistant/route.ts` + `lib/demo-cache.ts`: en directo (≤ 12 s) → caché del ensayo → offline verificado. Solo con la cookie `arrival-demo=1`. |
| Respaldo de voz | `public/voice-agent.js`, bloque *DEMO MODE fallback*: tiempo límite de 9 s → voz del navegador con la misma respuesta verificada |
| Fuera de modo demo | Todo se comporta como antes; no se aplican tiempos límite ni caché |
