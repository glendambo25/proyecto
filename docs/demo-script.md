# Demo de Arrival: guion (3:45)

**Historia:** Priya Nair, 22 años, india, estudiante de máster en la Universidad Pontificia Comillas (Madrid). Llegó hace 21 días. Tiene el visado, vive en una habitación temporal sin contrato y le quedan **9 días** para pedir la TIE.

**Público:** inversor (K Fund) y universidad (oficina internacional).

**Tesis en una frase:** *"El papeleo de llegada está en el orden correcto, con fuente oficial en cada paso, y la universidad ve quién está en riesgo antes de que sea tarde."*

> Las fechas de Priya son relativas al día de la demo: siempre "llegó hace 21 días" y "TIE en 9 días". La fecha exacta que verás en pantalla cambia cada día.

---

## Arranque (antes de que entre nadie)

1. `npm run dev` en la carpeta del repo.
2. Abre **`http://localhost:3000/onboarding?demo=priya`** en Chrome. Activa el modo demo y aparece el **dock** en el borde izquierdo: un punto rojo para elegir escena y **↺ Reset** para reiniciar.
3. Pulsa **↺ Reset**. Vuelves al onboarding con todo limpio.
4. Para enseñar el móvil: DevTools (F12) → modo dispositivo → 375 × 812. Para escritorio, ventana completa. El guion vale para los dos.

Si algo falla en cualquier momento: punto rojo del dock → número de escena. Si se rompe del todo: **↺ Reset** y empiezas en 5 segundos.

---

## Escena 1 · Onboarding (0:00–0:25)

**Pantalla:** `/onboarding`.

**Di:**
> "Cada año llegan a España estudiantes de fuera de la UE [TODO: verify. Pon aquí la cifra con fuente, por ejemplo la de la tesis del CEO; si no la tienes, no digas ninguna]. Lo primero que les pasa no es la universidad: es el papeleo. Visado, TIE, padrón, banco… cada trámite depende de otro y nadie les dice en qué orden."
>
> "Arrival les pregunta tres cosas: de dónde vienes, a qué ciudad vas y para qué. Con eso arma su checklist."

**Clic:** baja hasta *Or open a demo traveller* → **Priya Nair · Indian** (fila MAD).

> No rellenes el formulario en directo: es el paso lento. Señala las tres preguntas y abre a Priya.

## Escena 2 · Lo siguiente que tienes que hacer (0:25–0:50)

**Pantalla:** `/home`.

**Di:**
> "Esta es Priya. Llegó a Madrid hace tres semanas para un máster en Comillas. Lleva 6 de 11 pasos, y Arrival le dice cuál es el siguiente: **el alojamiento**."

**Clic:** nada. Señala la tarjeta **NEXT STOP · Accommodation in Madrid** y baja a **Your itinerary**: los 6 pasos hechos, *Accommodation* en curso y *Address registration* con **BLOCKED**.

## Escena 3 · Dependencias (0:50–1:20)

**Clic:** en el itinerario, **Address registration**, que abre `/tasks/padron`.

**Di:**
> "¿Por qué el alojamiento va primero? Porque el **empadronamiento**, que es obligatorio para todo el que vive en España, exige un documento que demuestre que vives en esa casa, normalmente el contrato. Sin contrato no hay padrón."
>
> "Y aquí es donde están las estafas: pagar una fianza por un piso que no existe. Por eso Arrival avisa antes de pagar."

**Señala:** *Waiting for an earlier step* y el gráfico **Accommodation in Madrid ⇢ padrón**. Abajo, la fuente: **Ayuntamiento de Madrid, verificada el 19 Nov 2026**.

> ⚠️ **No digas "sin NIE no hay cuenta bancaria".** No tenemos fuente oficial que lo diga: la del Banco de España para la cuenta de pago básica pide "pasaporte o TIE". Las dependencias verificadas son **visado → TIE** y **alojamiento → padrón**.

## Escena 4 · Asistente con cita oficial (1:20–1:55)

**Clic:** pestaña **Chat** → **AI assistant** (o el dock: escena 4). Escribe o pega:

```
What do I need to bring to my TIE appointment?
```

**Di mientras responde:**
> "El asistente no busca en internet. Solo responde con el contenido que nuestro equipo ha verificado, y cada respuesta trae la fuente oficial y la fecha en que se comprobó."

**Señala:** el bloque **OFFICIAL SOURCE · VERIFIED 19 NOV 2026 · Policía Nacional**. Si sale **Offline mode** o **Cached answer (demo)**, ver "Qué es real y qué es simulado".

> "Y cuando no tiene fuente, lo dice. Por ejemplo, el importe exacto de la tasa de la TIE todavía no lo hemos verificado, y no se lo inventa."

## Escena 5 · Agente de voz (1:55–2:35)

**Clic:** botón morado del micrófono (abajo a la derecha). En escritorio también vale **Talk (voice)** en la barra lateral.

**Di en voz alta, en inglés y despacio:**
```
Can I register on the padrón before I have a rental contract?
```

**Lo que pasa:** el agente consulta la misma base verificada, responde por voz y nombra la fuente (Ayuntamiento de Madrid). La pregunta y la respuesta también quedan en el chat del asistente.

**Di:**
> "Muchos estudiantes no dominan el español ni el inglés administrativo. Pueden preguntar hablando, con las mismas fuentes verificadas."

**Si la voz no conecta en ~9 segundos**, el panel dice *"Live voice is unavailable… switching to the backup voice"* y muestra dos botones de pregunta. Toca **"Can I register on the padrón before I have a rental contract?"**: responde con la voz del navegador y la misma respuesta verificada. Di:
> "Si cae la red, la app no se cuelga: pasa a una voz de respaldo."

Cierra el panel con ✕.

## Escena 6 · Aviso de plazo (2:35–2:55)

**Clic:** **Home** → tarjeta **Deadlines** (o dock: escena 6).

**Di:**
> "Y el reloj corre. La TIE hay que pedirla en el plazo de un mes desde la entrada en España. Priya llegó el [fecha de llegada] y le quedan **9 días**: el [fecha que se ve, ≈ …]. Puede añadirlo al calendario con un aviso dos días antes."

**Señala:** la fila roja **Foreigner identity card (TIE)** y el botón **Add to my calendar (.ics)**. No lo pulses: descarga un archivo.

## Escena 7 · Kit local (2:55–3:15)

**Clic:** dock, escena 7 (o **Local kit** en la barra lateral de escritorio).

**Di:**
> "Cuando lo legal está en marcha, viene el día a día: el abono joven de transporte por 10 euros al mes, la cuenta de pago básica que los bancos están obligados a ofrecer, y el padrón online."
>
> "Aquí entra el modelo de partners: SIM, mentores locales… Lo que veis abajo es una maqueta."

**Señala:** el cartel rojo **Demo mock**. Las tarjetas de arriba son oficiales y verificadas; las de partners, simuladas.

## Escena 8 · Vista de la universidad (3:15–3:45)

**Clic:** dock, escena 8 (o **Office view**).

**Di:**
> "Ahora cambiemos de silla. Esto es lo que ve la oficina internacional de Comillas: 24 alumnos de fuera de la UE, cuántos han llegado, cuántos tienen ya la TIE… y **quién está en riesgo esta semana**."
>
> "La primera es Priya, en directo desde este móvil: TIE en 9 días y sin contrato. Los demás: uno con el plazo de la TIE vencido hace dos días, otro que llega en tres semanas y aún no tiene visado. La oficina puede actuar **antes** de que el alumno tenga un problema legal."

**Clic:** **Nudge** en una fila (cambia a *Nudged (demo)*; no se envía nada).

**Cierre (3:45):**
> "Para el estudiante, Arrival le quita semanas de incertidumbre. Para la universidad, es la primera herramienta que le dice qué alumnos están en riesgo de incumplir un plazo legal. Empezamos en Madrid con alumnos de fuera de la UE."

---

## Qué es real y qué es simulado

| En pantalla | Real o simulado |
|---|---|
| Checklist de Madrid, orden, dependencias, plazos, fuentes y fechas de verificación | **Real**: `content/madrid.json`, verificado el 2026-11-19. Lo pendiente sale con ⚠ / `TODO: verify`. |
| Respuesta del asistente | **Real**. Con `ANTHROPIC_API_KEY` responde Claude solo desde el contenido verificado. Sin clave, sin red o si tarda más de 12 s: *Cached answer (demo)* (la respuesta real de un ensayo, en `.demo-cache/`) o *Offline mode* (búsqueda en el contenido verificado, con fuente). |
| Agente de voz | **Real** con `OPENAI_API_KEY` (OpenAI Realtime). **Voz de respaldo simulada** si no conecta en 9 s: voz del navegador y la misma respuesta verificada. |
| Priya Nair (persona, fechas, progreso) | **Simulada**: personaje ficticio. Fechas relativas al día de la demo (`lib/demo.ts`). |
| Cohorte de Comillas y alumnos en riesgo | **Simulada**: 23 alumnos con seudónimo. Las **reglas** de riesgo son reales (TIE en un mes, visado ≥ 2 meses antes, padrón con contrato). La fila de Priya es en directo. |
| Kit local: tarjetas oficiales | **Reales** (CRTM, Banco de España, Ayuntamiento de Madrid). |
| Kit local: partners (SIM, mentor) | **Simulado.** No hay partners, precios ni acuerdos. |
| Botón *Nudge* | **Simulado.** No envía nada. |
| Métricas del piloto (parte baja de *Office view*) | Eventos reales de este navegador; el resto de la cohorte de esa sección es simulado (ya lo dice la propia pantalla). |

## Preguntas probables

- **"¿Y si la ley cambia?"** Cada paso tiene fuente y fecha de verificación, y lo que no está verificado sale marcado. [Añade aquí la frecuencia de reverificación cuando esté decidida.]
- **"¿Inventa respuestas?"** No. Solo usa el contenido verificado, y si no hay fuente, dice "I don't have a verified official source for this yet" y ofrece un asesor.
- **"¿Pide cita por mí?"** No. Arrival nunca pide citas ni envía nada en nombre del alumno.

Detalles técnicos del modo demo: `lib/demo.ts`, `lib/demo-cache.ts`, `components/DemoDock.tsx`, `components/DemoOfficePanel.tsx`, `app/kit/page.tsx` y el bloque *DEMO MODE* de `public/voice-agent.js`. Checklist previa: [`docs/demo-checklist.md`](demo-checklist.md).
