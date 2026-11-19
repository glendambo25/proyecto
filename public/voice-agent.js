/*
 * voice-agent.js: a floating voice assistant that talks with the user and helps them move around the web app.
 * It can read what is on screen, take the user to another page, point at things, scroll, click and fill fields.
 *
 * Voice and brain: OpenAI Realtime (WebRTC). The browser never sees the API key: it asks your server for a
 * short-lived key (see server/session.js). If voice cannot start, the agent still works by text.
 *
 * Install: set window.VoiceAgentConfig (optional, see below) and load this script on every page:
 *   <script>window.VoiceAgentConfig = { language: 'es', pages: [...], context: '...' };</script>
 *   <script src="/voice-agent.js" defer></script>
 *
 * Config (all optional):
 *   sessionUrl   endpoint that returns { value: "<ephemeral key>" }        default '/api/session'
 *   language     'es' | 'en' | ...                                           default 'es'
 *   name         what the assistant is called on screen                      default 'Asistente'
 *   context      what the app is and what the assistant should know (plain text, goes into the prompt)
 *   pages        [{ url, title, description }]  the pages it may take the user to
 *   navigate     function (url) for single-page apps (e.g. url => router.push(url)); without it, pages
 *                open inside the call (a full-screen frame) so the conversation is never cut
 *   blocked      RegExp of button texts it must never click (sending, paying, deleting...)
 *   onEvent      function (event) called with every step (for analytics or memory)
 *   debug        true: logs every Realtime event in the console (also ?vadebug=1 in the URL)
 *
 * Arrival additions (on top of voice-agent-kit, logic otherwise unchanged):
 *   tools        extra app tools: [{ definition: <Realtime function tool>, run: async (args) => result }]
 *   rules        extra lines appended to the instructions (string[])
 *   speak        language instruction, e.g. 'Speak English.' (overrides the default)
 */
(function () {
  try { if (window.top !== window && window.top.__voiceAgent) return; } catch (e) {}
  if (window.__voiceAgent) return; window.__voiceAgent = true;

  var C = Object.assign({
    sessionUrl: '/api/session', language: 'es', name: 'Asistente', context: '', pages: [], navigate: null,
    blocked: /\b(enviar|send|submit|pagar|pay|comprar|buy|confirmar pago|borrar|eliminar|delete|remove|firmar|sign|guardar|save)\b/i,
    onEvent: null, debug: false, tools: [], rules: [], speak: ''
  }, window.VoiceAgentConfig || {});
  var EXTRA = {}; (C.tools || []).forEach(function (t) { EXTRA[t.definition.name] = t.run; });
  var ES = C.language === 'es';
  var T = function (en, es) { return ES ? es : en; };
  var DBG = C.debug || /vadebug/.test(location.search);
  function log() { if (DBG) console.log.apply(console, ['[voice-agent]'].concat([].slice.call(arguments))); }
  function emit(type, data) { var e = Object.assign({ type: type, ts: new Date().toISOString(), page: location.pathname }, data || {}); try { C.onEvent && C.onEvent(e); } catch (x) {} }
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------------- UI: floating button + panel ---------------- */
  var css = document.createElement('style');
  css.textContent =
    '.va-root{position:fixed;right:20px;bottom:20px;z-index:2147483600;font:14px/1.45 system-ui,-apple-system,sans-serif;color:#111;display:flex;flex-direction:column;align-items:flex-end;gap:10px}' +
    '.va-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:12px 18px;background:#111;color:#fff;font:600 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}' +
    '.va-dot{width:10px;height:10px;border-radius:50%;background:#888}' +
    '.va-root[data-s=listening] .va-dot{background:#2fb67c}.va-root[data-s=speaking] .va-dot{background:#4c8dff;animation:va-p 1s infinite}.va-root[data-s=connecting] .va-dot{background:#f0b429;animation:va-p .7s infinite}' +
    '@keyframes va-p{50%{opacity:.3}}' +
    '.va-panel{width:min(340px,calc(100vw - 40px));background:#fff;border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.22);padding:12px;display:none}' +
    '.va-root.open .va-panel{display:block}' +
    '.va-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:grab;touch-action:none;user-select:none}.va-head b{flex:1}.va-head small{color:#666}' +
    '.va-root.dragging .va-head{cursor:grabbing}' +
    '.va-ic{display:grid;place-items:center;width:28px;height:28px;border:1px solid #ddd;border-radius:999px;background:#fff;cursor:pointer;font:600 13px system-ui,sans-serif;color:inherit;padding:0}' +
    '.va-root.min .va-lines,.va-root.min .va-form{display:none}.va-root.min .va-head{margin-bottom:0}' +
    '.va-lines{max-height:220px;overflow:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:8px}' +
    '.va-l{margin:0;padding:6px 9px;border-radius:10px;max-width:92%}.va-l.u{align-self:flex-end;background:#f0f0f3}.va-l.a{background:#eef5ff}.va-l.s{align-self:center;color:#777;font-size:12px;background:none}' +
    '.va-form{display:flex;gap:6px}.va-in{flex:1;border:1px solid #ddd;border-radius:8px;padding:8px}.va-sm{border:1px solid #ddd;background:#fff;border-radius:8px;padding:8px 10px;cursor:pointer}' +
    '.va-mark{outline:3px solid #ff3b30!important;outline-offset:3px!important;border-radius:4px;transition:outline .2s}';
  document.head.appendChild(css);

  var root = document.createElement('div'); root.className = 'va-root'; root.dataset.s = 'idle';
  root.innerHTML =
    '<section class="va-panel" aria-label="' + esc(C.name) + '"><div class="va-head"><span class="va-dot"></span><b>' + esc(C.name) + '</b><small class="va-st"></small>' +
    '<button class="va-ic va-min" type="button" title="' + T('Minimise', 'Minimizar') + '" aria-label="' + T('Minimise', 'Minimizar') + '">–</button>' +
    '<button class="va-ic va-x" type="button" title="' + T('Hang up and close', 'Colgar y cerrar') + '" aria-label="' + T('Hang up and close', 'Colgar y cerrar') + '">✕</button></div>' +
    '<div class="va-lines"><p class="va-l s">' + T('Talk or type. I can show you around and help you fill things in; you always press send yourself.', 'Habla o escribe. Te enseño la web y te ayudo a rellenar cosas; enviar siempre lo pulsas tú.') + '</p></div>' +
    '<form class="va-form"><input class="va-in" placeholder="' + T('Type a question…', 'Escribe una pregunta…') + '"><button class="va-sm" type="submit">↵</button></form></section>' +
    '<button class="va-btn" type="button"><span class="va-dot"></span><span class="va-bt">🎙️ ' + T('Talk', 'Hablar') + '</span></button>';
  var lines = root.querySelector('.va-lines'), stEl = root.querySelector('.va-st'), btnText = root.querySelector('.va-bt');
  function state(s, text) { root.dataset.s = s; stEl.textContent = text || ''; }
  function line(who, text) {
    if (!text) return;
    var p = document.createElement('p'); p.className = 'va-l ' + who; p.textContent = text;
    lines.appendChild(p); while (lines.children.length > 40) lines.removeChild(lines.firstChild); lines.scrollTop = 1e9;
  }
  function mountUI() { document.body.appendChild(root); }
  if (document.body) mountUI(); else document.addEventListener('DOMContentLoaded', mountUI);

  /* ---------------- the screen: in-call frame so navigating never cuts the call ---------------- */
  var FRAME = null;
  function D() { try { return FRAME && FRAME.contentDocument && FRAME.contentDocument.body ? FRAME.contentDocument : document; } catch (e) { return document; } }
  function openPage(url) {
    return new Promise(function (resolve) {
      if (C.navigate) { try { C.navigate(url); } catch (e) {} setTimeout(resolve, 700); return; }
      if (!FRAME) {
        FRAME = document.createElement('iframe');
        FRAME.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:2147483000;background:#fff';
        document.body.appendChild(FRAME); document.body.appendChild(root);
      }
      FRAME.onload = function () { resolve(); };
      FRAME.src = url; setTimeout(resolve, 6000);
    });
  }
  function leaveFrame() {
    // On hang-up the user stays on the page the assistant took them to.
    if (!FRAME) return; var u = null; try { u = FRAME.contentWindow.location.href; } catch (e) {}
    FRAME.remove(); FRAME = null; if (u && u !== location.href) location.href = u;
  }
  function visible(n) { return n && !root.contains(n) && n.offsetParent !== null; }
  function readScreen() {
    var d = D(), out = [], seen = {};
    d.querySelectorAll('h1,h2,h3,h4,p,li,td,th,label,button,a,[role=tab],[role=button],input,select,textarea').forEach(function (n) {
      if (!visible(n)) return;
      var inNav = n.closest('nav,header,footer,aside,[role=navigation]');
      var t = /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)
        ? (n.type === 'password' ? '' : '[field ' + fieldLabel(n) + (n.value ? ' = ' + n.value : '') + ']')
        : (n.innerText || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 220 || seen[t]) return; seen[t] = 1;
      out.push((inNav ? '[menu] ' : '') + (/^(BUTTON|A)$/.test(n.tagName) || /tab|button/.test(n.getAttribute('role') || '') ? '[button] ' : '') + t);
    });
    return { title: d.title, path: (d.location || location).pathname, content: out.join('\n').slice(0, 4000) };
  }
  function fieldLabel(n) {
    var d = D(), lab = n.id && d.querySelector('label[for="' + n.id + '"]');
    return [lab && lab.innerText, n.getAttribute('aria-label'), n.placeholder, n.name].filter(Boolean).join(' / ').replace(/\s+/g, ' ').slice(0, 80);
  }
  function find(text, sel) {
    var q = norm(text).trim(), best = null, len = 1e9; if (!q) return null;
    D().querySelectorAll(sel).forEach(function (n) {
      if (!visible(n)) return;
      var t = norm(n.innerText || n.value || n.getAttribute('aria-label') || n.placeholder || '');
      if (t && t.indexOf(q) >= 0 && t.length < len) { best = n; len = t.length; }
    });
    return best;
  }
  function mark(n) { try { n.scrollIntoView({ behavior: 'smooth', block: 'center' }); n.classList.add('va-mark'); setTimeout(function () { n.classList.remove('va-mark'); }, 2600); } catch (e) {} }
  function addMarkStyle() { try { var d = D(); if (d !== document && !d.getElementById('va-mark-css')) { var s = d.createElement('style'); s.id = 'va-mark-css'; s.textContent = '.va-mark{outline:3px solid #ff3b30!important;outline-offset:3px!important;border-radius:4px}'; d.head.appendChild(s); } } catch (e) {} }

  /* ---------------- tools the model can use ---------------- */
  var TOOLS = [
    { type: 'function', name: 'go_to_page', description: 'Take the user to another page of the app. Use it as soon as another page answers what they asked better than the current one.', parameters: { type: 'object', properties: { url: { type: 'string', description: 'one of the listed page urls' }, reason: { type: 'string' } }, required: ['url'] } },
    { type: 'function', name: 'read_screen', description: 'Read what is on the current screen (headings, text, buttons, form fields). Call it before explaining what is on screen or helping with a form.', parameters: { type: 'object', properties: {} } },
    { type: 'function', name: 'point_at', description: 'Scroll to and highlight a text on screen, to show the user where something is.', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
    { type: 'function', name: 'scroll', description: 'Scroll the current page.', parameters: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'] } }, required: ['direction'] } },
    { type: 'function', name: 'click', description: 'Click a button, tab or link by its visible text, to open a section or a step. Never for sending, paying, signing, saving or deleting: the user does that.', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
    { type: 'function', name: 'fill_field', description: 'Write a value the user just told you into a form field, found by its label. Never passwords. The user reviews and submits.', parameters: { type: 'object', properties: { field: { type: 'string' }, value: { type: 'string' } }, required: ['field', 'value'] } }
  ];
  function instructions() {
    var pages = (C.pages || []).map(function (p) { return '- ' + p.url + ': ' + p.title + (p.description ? '. ' + p.description : ''); }).join('\n');
    return [
      'You are ' + C.name + ', a voice assistant inside this web app. You talk with the user and move the screen for them.',
      C.context ? 'About the app: ' + C.context : '',
      (C.speak || ('Speak ' + (ES ? 'Spanish from Spain' : 'in the user\'s language') + '.')) + ' Short answers: one or two sentences, no lists, no markdown, no URLs read aloud.',
      'Do things instead of describing them: if another page helps, call go_to_page; to explain the screen or a form, call read_screen first and answer only with what is really there; use point_at to show where.',
      'You can open sections with click and fill a field with fill_field when the user gives you the value. Never send, submit, pay, sign, save or delete anything: tell the user which button to press and let them do it.',
      'Do not invent requirements, deadlines, fees or legal facts that are not on screen or in the app context; if you do not know, say so and show the closest page.',
      'Do not repeat what the user said. Do not end with "anything else?".',
      pages ? 'Pages:\n' + pages : '',
      (C.rules || []).join('\n'),
      'The user is now on: ' + location.pathname
    ].filter(Boolean).join('\n');
  }
  (C.tools || []).forEach(function (t) { TOOLS.push(Object.assign({ type: 'function' }, t.definition)); });
  function runTool(name, a) {
    if (EXTRA[name]) { emit('tool', { name: name }); return Promise.resolve().then(function () { return EXTRA[name](a || {}); }).catch(function (e) { return { ok: false, error: String(e && e.message || e) }; }); }
    if (name === 'read_screen') return Promise.resolve(readScreen());
    if (name === 'go_to_page') {
      var url = String(a.url || '');
      try { var u = new URL(url, location.href); if (u.origin !== location.origin) return Promise.resolve({ ok: false, error: 'only pages of this app' }); url = u.pathname + u.search + u.hash; } catch (e) { return Promise.resolve({ ok: false, error: 'bad url' }); }
      line('s', '→ ' + ((C.pages || []).filter(function (p) { return p.url === url; })[0] || { title: url }).title);
      emit('navigate', { url: url, reason: a.reason });
      return openPage(url).then(function () { addMarkStyle(); return { ok: true, now_on: url, screen: readScreen().content.slice(0, 1500) }; });
    }
    if (name === 'point_at') { var n = find(a.text, 'h1,h2,h3,h4,p,li,td,th,label,button,a,span,div'); if (!n) return Promise.resolve({ ok: false, error: 'not on screen' }); addMarkStyle(); mark(n); emit('point', { text: a.text }); return Promise.resolve({ ok: true }); }
    if (name === 'scroll') {
      var w = D().defaultView || window, h = w.innerHeight * 0.8;
      if (a.direction === 'top') w.scrollTo({ top: 0, behavior: 'smooth' }); else if (a.direction === 'bottom') w.scrollTo({ top: 1e7, behavior: 'smooth' });
      else w.scrollBy({ top: a.direction === 'up' ? -h : h, behavior: 'smooth' });
      return new Promise(function (r) { setTimeout(function () { r({ ok: true, screen: readScreen().content.slice(0, 1200) }); }, 600); });
    }
    if (name === 'click') {
      var b = find(a.text, 'button,a,[role=tab],[role=button],summary,label,input[type=button]');
      if (!b) return Promise.resolve({ ok: false, error: 'no button with that text', screen: readScreen().content.slice(0, 800) });
      var label = (b.innerText || b.value || a.text || '').trim();
      if (C.blocked.test(label) || b.type === 'submit') { addMarkStyle(); mark(b); emit('blocked_click', { text: label }); return Promise.resolve({ ok: false, error: 'the user must press this one themselves; it is highlighted', button: label }); }
      addMarkStyle(); mark(b); emit('click', { text: label });
      return new Promise(function (r) { setTimeout(function () { b.click(); setTimeout(function () { r({ ok: true, clicked: label, screen: readScreen().content.slice(0, 1200) }); }, 700); }, 400); });
    }
    if (name === 'fill_field') {
      var q = norm(a.field), f = null;
      D().querySelectorAll('input,textarea,select').forEach(function (n) { if (!f && visible(n) && n.type !== 'password' && n.type !== 'hidden' && norm(fieldLabel(n)).indexOf(q) >= 0) f = n; });
      if (!f) return Promise.resolve({ ok: false, error: 'no field like that on screen' });
      var W = D().defaultView || window;
      addMarkStyle(); mark(f); f.focus();
      if (f.tagName === 'SELECT') { var opt = [].filter.call(f.options, function (o) { return norm(o.text).indexOf(norm(a.value)) >= 0; })[0]; if (opt) f.value = opt.value; }
      else { var setter = Object.getOwnPropertyDescriptor(W[f.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype, 'value').set; setter.call(f, a.value); }
      f.dispatchEvent(new W.Event('input', { bubbles: true })); f.dispatchEvent(new W.Event('change', { bubbles: true }));
      emit('fill', { field: a.field });
      return Promise.resolve({ ok: true, note: 'filled; the user reviews and submits' });
    }
    return Promise.resolve({ ok: false, error: 'unknown tool' });
  }

  /* ---------------- OpenAI Realtime over WebRTC ---------------- */
  var RT = null, busy = false, pending = [], spokeAt = 0;
  var GRACE_MS = 1200, ACTS = { go_to_page: 1, click: 1, fill_field: 1 };
  var STOP = /^(para|parar|stop|espera|calla|callate|silencio|wait|hold on)\b/i;
  var PRE = null;
  function preload() {
    if (PRE && Date.now() - PRE.at < 40000) return PRE.p;
    var p = fetch(C.sessionUrl, { method: 'POST' }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.value) throw new Error(j.error || ('session ' + r.status)); return j; }); });
    PRE = { at: Date.now(), p: p }; p.catch(function () { PRE = null; }); return p;
  }
  function send(o) { if (RT && RT.dc.readyState === 'open') { log('>>', o.type); RT.dc.send(JSON.stringify(o)); } }
  // Only one response at a time: requests made while the model is talking wait for it to finish.
  function respond(extra) { if (busy) { pending.push(extra || {}); return; } busy = true; send(Object.assign({ type: 'response.create' }, extra && extra.response ? { response: extra.response } : {})); }
  function toolOutput(callId, out) { send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(out) } }); }
  function onTool(name, args, callId) {
    var go = function () { runTool(name, args).then(function (out) { toolOutput(callId, out); respond(); }); };
    if (!ACTS[name]) return go();
    var asked = Date.now();
    // Margin before acting: if the user keeps talking right after asking, the action is dropped.
    setTimeout(function () {
      if (!RT) return;
      if (spokeAt > asked) { log('held', name); toolOutput(callId, { ok: false, held: 'the user kept talking; follow what they say now' }); return; }
      go();
    }, GRACE_MS);
  }
  function start() {
    state('connecting', T('Connecting…', 'Conectando…'));
    var pc = new RTCPeerConnection(), audio = new Audio(); audio.autoplay = true;
    pc.ontrack = function (e) { audio.srcObject = e.streams[0]; };
    var dc = pc.createDataChannel('oai-events'), done = {};
    RT = { pc: pc, dc: dc, mic: null };
    dc.onopen = function () {
      send({ type: 'session.update', session: { type: 'realtime', instructions: instructions(), tools: TOOLS, tool_choice: 'auto',
        audio: { input: { noise_reduction: { type: 'near_field' }, transcription: { model: 'gpt-4o-mini-transcribe', language: C.language },
          turn_detection: { type: 'semantic_vad', eagerness: 'low', create_response: true, interrupt_response: true } } } } });
      state('listening', T('Listening', 'Te escucho'));
      respond({ response: { instructions: T('Greet the user in one short sentence and ask what they need help with.', 'Saluda en una frase corta y pregunta en qué le ayudas.') } });
      emit('call_start');
    };
    dc.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (DBG && !/delta/.test(m.type)) log('<<', m.type, m.error || '');
      switch (m.type) {
        case 'response.created': busy = true; break;
        case 'response.done': busy = false; if (pending.length) { var nx = pending.shift(); respond(nx); } break;
        case 'input_audio_buffer.speech_started': spokeAt = Date.now(); state('listening', T('Listening', 'Te escucho')); break;
        case 'output_audio_buffer.started': state('speaking', T('Speaking', 'Hablando')); break;
        case 'output_audio_buffer.stopped': state('listening', T('Listening', 'Te escucho')); break;
        case 'conversation.item.input_audio_transcription.completed':
          if (m.transcript && m.transcript.trim()) {
            var t = m.transcript.trim(); line('u', t); emit('user_said', { text: t });
            if (STOP.test(t)) { send({ type: 'response.cancel' }); send({ type: 'output_audio_buffer.clear' }); }
          }
          break;
        case 'response.output_audio_transcript.done': if (m.transcript) { line('a', m.transcript); emit('assistant_said', { text: m.transcript }); } break;
        case 'response.function_call_arguments.done':
          if (done[m.call_id]) break; done[m.call_id] = 1;
          var args = {}; try { args = JSON.parse(m.arguments || '{}'); } catch (e) {}
          log('tool', m.name, args); onTool(m.name, args, m.call_id); break;
        case 'error':
          if (m.error && /active response/i.test(m.error.message || '')) break; // handled by the queue
          console.warn('[voice-agent] error:', m.error && m.error.message);
      }
    };
    var key = preload(); PRE = null;
    // Without a microphone (denied or none) it still works by text, with spoken answers.
    var mic = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).catch(function () { return null; })
      : Promise.resolve(null);
    return Promise.all([key, mic])
      .then(function (r) {
        RT.mic = r[1];
        if (r[1]) pc.addTrack(r[1].getTracks()[0]); else { pc.addTransceiver('audio', { direction: 'recvonly' }); line('s', T('No microphone: type and I will answer out loud.', 'Sin micrófono: escribe y te contesto en voz alta.')); }
        return pc.createOffer().then(function (o) { return pc.setLocalDescription(o).then(function () {
          return fetch('https://api.openai.com/v1/realtime/calls', { method: 'POST', body: o.sdp, headers: { Authorization: 'Bearer ' + r[0].value, 'Content-Type': 'application/sdp' } });
        }); });
      })
      .then(function (res) { if (!res.ok) return res.text().then(function (t) { throw new Error('realtime ' + res.status + ' ' + t.slice(0, 160)); }); return res.text(); })
      .then(function (sdp) { return pc.setRemoteDescription({ type: 'answer', sdp: sdp }); })
      .catch(function (e) { console.warn('[voice-agent] voice unavailable:', e.message); stop(true); line('s', T('I could not connect right now. Try again in a moment.', 'No he podido conectarme. Prueba otra vez en un momento.')); throw e; });
  }
  function stop(keepFrame) {
    if (RT) { try { RT.mic && RT.mic.getTracks().forEach(function (t) { t.stop(); }); RT.pc.close(); } catch (e) {} RT = null; emit('call_end'); }
    busy = false; pending = []; state('idle', ''); btnText.textContent = '🎙️ ' + T('Talk', 'Hablar');
    if (!keepFrame) { leaveFrame(); root.classList.remove('open', 'min'); }
  }

  /* Panel controls (Arrival): close, minimise, drag anywhere on screen. */
  root.querySelector('.va-x').addEventListener('click', function () { if (RT) stop(); else root.classList.remove('open', 'min'); });
  root.querySelector('.va-min').addEventListener('click', function () { root.classList.toggle('min'); });
  var drag = null, off = { x: 0, y: 0 };
  function place(x, y) {
    var r = root.getBoundingClientRect(), bx = r.left - off.x, by = r.top - off.y;
    // keep the whole assistant on screen
    x = Math.min(Math.max(x, 8 - bx), window.innerWidth - r.width - 8 - bx);
    y = Math.min(Math.max(y, 8 - by), window.innerHeight - r.height - 8 - by);
    off = { x: x, y: y }; root.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }
  root.querySelector('.va-head').addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    drag = { sx: e.clientX, sy: e.clientY, ox: off.x, oy: off.y }; root.classList.add('dragging');
    try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
  });
  window.addEventListener('pointermove', function (e) { if (drag) place(drag.ox + e.clientX - drag.sx, drag.oy + e.clientY - drag.sy); });
  window.addEventListener('pointerup', function () { drag = null; root.classList.remove('dragging'); });

  /* ---------------- wiring ---------------- */
  var btn = root.querySelector('.va-btn');
  btn.addEventListener('pointerenter', function () { if (!RT) preload().catch(function () {}); });
  btn.addEventListener('click', function () {
    if (RT) { stop(); return; }
    root.classList.add('open'); btnText.textContent = '■ ' + T('Hang up', 'Colgar');
    start().catch(function () {});
  });
  root.querySelector('.va-form').addEventListener('submit', function (e) {
    e.preventDefault(); var i = root.querySelector('.va-in'), t = i.value.trim(); if (!t) return; i.value = '';
    line('u', t); emit('user_typed', { text: t });
    if (RT && RT.dc.readyState === 'open') { send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: t }] } }); respond(); }
    else { root.classList.add('open'); btnText.textContent = '■ ' + T('Hang up', 'Colgar'); start().then(function () {
      var w = setInterval(function () { if (RT && RT.dc.readyState === 'open') { clearInterval(w); send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: t }] } }); respond(); } }, 200);
      setTimeout(function () { clearInterval(w); }, 8000);
    }).catch(function () {}); }
  });
  window.VoiceAgent = { start: function () { if (!RT) { root.classList.add('open'); return start(); } }, stop: stop, readScreen: readScreen };
  if (DBG) window.VoiceAgent._tool = runTool;
})();
