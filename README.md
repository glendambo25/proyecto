# Arrival (nombre provisional) — MVP

> **You move. We handle the paperwork.**

Prototipo móvil (web app / PWA) que ayuda a quien se muda a otro país con el papeleo de la llegada: checklist personalizado y ordenado con dependencias, fuente oficial + fecha de verificación en cada paso, asistente IA (texto y **voz**), chats, guía de ciudad y vista para la oficina internacional. Toda la app está en inglés.

## Arrancar

```bash
npm install
cp .env.example .env.local   # opcional: claves
npm run dev                  # http://localhost:3000
```

- Sin claves, **todo funciona**: el asistente responde en modo offline (busca en el contenido verificado y cita fuente + fecha) y el botón de voz avisa de que no puede conectar.
- `ANTHROPIC_API_KEY` activa el asistente con Claude (`claude-opus-5-5`, respuestas estructuradas y solo desde el contenido verificado).
- `OPENAI_API_KEY` activa el agente de voz (OpenAI Realtime, del `voice-agent-kit`).
- Despliegue: Vercel (importar el repo y añadir las variables de entorno).

## Estructura

| Ruta | Qué es |
|---|---|
| `content/*.json` | Trámites por ciudad (Turin, Milan, Munich, Luxembourg, New York) con `dependsOn`, `officialSourceUrl`, `lastVerified`, `verificationStatus`, `appliesTo`… y perfiles demo (`personas.json`) |
| `lib/content.ts` | Genera el checklist por nacionalidad/motivo y lo ordena según dependencias |
| `lib/assistant.ts` + `app/api/assistant` | Asistente: Claude con salida estructurada (cita ids de trámites; la app pinta fuente y fecha desde los datos) + modo offline |
| `public/voice-agent.js` + `app/api/session` | Agente de voz del `voice-agent-kit` (ver `docs/voice-agent-kit/LEEME.md`), ampliado con herramientas de la app: `get_my_checklist` y `ask_verified_assistant` |
| `app/onboarding, home, tasks, city, chat, profile, plans, office` | Pantallas |

## Qué es simulado
- Chats con personas (conversaciones de ejemplo), pagos ("Do it for me", Premium: solo registran interés), valoraciones de lugares, cohorte de la vista de oficina.
- Precios de planes = hipótesis del piloto. Horas ahorradas = estimación por paso (hipótesis).
- Estado y métricas en `localStorage` del navegador; sin datos personales reales.

## Fuentes pendientes de verificar (TODO: verify)
Marcadas en la app con ⚠. Ver campo `todo` en `content/*.json`: guichet.lu (registro UE en Luxemburgo), Comune di Milano (anagrafe, 403), páginas del Departamento de Estado de EE. UU. / DS-160 / embajada (403), SSA, seguro J-1, PoliTo incoming exchange (404), seguro para no UE en Italia, contratos de alquiler, SIM y cuenta bancaria en Italia, ATM Milano, notificación de desplazamiento (p. ej. Polonia), cancelación de residencia en Turín.
