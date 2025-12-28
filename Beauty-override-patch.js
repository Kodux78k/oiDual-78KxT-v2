<style id="TEXT_BEAUTY_V3">
:root{
  --txt-card: color-mix(in oklab, var(--panel, #0e1220) 92%, black);
  --txt-bd: color-mix(in oklab, var(--ink, #e8ecf6) 16%, transparent);
  --txt-shadow: 0 6px 24px rgba(0,0,0,.25), inset 0 0 0 1px var(--txt-bd);
  --chip-bg: linear-gradient(42deg, var(--grad-a, #7effa1), var(--grad-b, #67e6ff));
  --chip-ink: #000;
  --paren-ink: color-mix(in oklab, var(--ink, #e8ecf6) 92%, white);
}

/* Tipografia base do texto corrido (aplicamos quando detectado bloco .flow-text) */
.flow-text p{
  text-wrap: pretty;
  line-height: 1.65;
  letter-spacing: .01em;
  margin: .65rem 0;
  hyphens: auto;
}

/* Heading leve detectado por “Titulo:” */
.flow-text .kv-head{
  font-weight: 800;
  letter-spacing:.02em;
  margin: 1.2rem 0 .4rem;
}

/* Parênteses → realce sutil */
.span-paren{
  padding: .05rem .35rem;
  border-radius: .55rem;
  border: 1px solid var(--txt-bd);
  color: var(--paren-ink);
  background: color-mix(in oklab, var(--txt-card) 86%, transparent);
}

/* Chips (colchetes) clicáveis */
.chip, .chip-btn{
  display:inline-grid; place-items:center;
  padding:.25rem .6rem; border-radius:999px;
  background: var(--chip-bg); color: var(--chip-ink);
  font-weight: 700; letter-spacing:.02em;
  box-shadow: 0 2px 10px rgba(0,0,0,.35);
  cursor: pointer; user-select: none;
}
.chip + .chip{ margin-left:.35rem; }

/* Pergunta → card */
.q-card{
  background: var(--txt-card);
  border: 1px solid var(--txt-bd);
  box-shadow: var(--txt-shadow);
  border-radius: 14px;
  padding: .85rem 1rem;
  margin: .9rem 0;
  display:grid; grid-template-columns:auto 1fr; gap:.65rem; align-items:start;
}
.q-card .q-ico{
  inline-size:1.65rem; block-size:1.65rem; border-radius:50%;
  display:grid; place-items:center; font-weight:800; color:#000;
  background: var(--chip-bg);
}
.q-card .q-body{ line-height:1.55; }

/* Overlay de copiar nas listas (usa .list-card do patch anterior) */
.list-card{ position:relative; }
.list-card .copy-badge{
  position:absolute; top:.35rem; right:.35rem;
  font-size:.8rem; padding:.2rem .45rem; border-radius:999px;
  background: color-mix(in oklab, #fff 12%, var(--txt-card));
  border: 1px solid var(--txt-bd);
  color: var(--ink, #e8ecf6); opacity:.65; transition:.2s; user-select:none;
}
.list-card:hover .copy-badge{ opacity:1; }

/* Área que receberá HTML “desescapado” */
.raw-html-card{
  background: var(--txt-card); border: 1px dashed var(--txt-bd);
  border-radius: 14px; padding: .85rem 1rem; margin: .9rem 0;
}
.raw-html-card .raw-note{ color: color-mix(in oklab, var(--ink) 62%, transparent); font-size:.85em; margin-bottom:.35rem; }
</style>

<script id="TEXT_BEAUTY_V3_SCRIPT">
(function(){
  if(window.__TEXT_BEAUTY_V3_LOADED__) return;
  window.__TEXT_BEAUTY_V3_LOADED__ = true;

  function _safeSpeakLocal(msg){
    try{
      // prefer App.speakText if available (handled by global speak helper)
      if(window.Infodox && typeof window.Infodox.speakViaApp === 'function') {
        return window.Infodox.speakViaApp(msg);
      }
      const u = new SpeechSynthesisUtterance(String(msg||''));
      u.lang = 'pt-BR'; u.rate = 1.05;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }catch(e){ console.warn('[Beauty] local speak fail', e); }
  }

  function processInline(root=document){
    root.querySelectorAll('.msg-block.ai').forEach(block=>{
      if(block.dataset._beauty_md) return;
      try{
        const raw = block.dataset.raw || block.innerText || '';
        if(typeof marked !== 'undefined' && /[#_*`]/.test(raw)){
          block.innerHTML = marked.parse(raw);
        }
      }catch(e){}
      block.dataset._beauty_md = '1';
    });
  }

  function beautifyFlow(root=document){
    root.querySelectorAll('.msg-block.ai pre').forEach(pre=>{
      if(pre.dataset._beauty_code) return;
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.textContent = 'Copiar Código';
      btn.onclick = (ev)=>{
        ev.stopPropagation();
        try{
          const code = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
          navigator.clipboard.writeText(code);
          btn.textContent = 'Copiado!';
          _safeSpeakLocal('Código copiado para a área de transferência.');
          setTimeout(()=>{ btn.textContent = 'Copiar Código'; }, 1600);
        }catch(err){ console.warn(err); }
      };
      pre.style.position = 'relative';
      pre.appendChild(btn);
      pre.dataset._beauty_code = '1';
    });
  }

  function enableCopyLists(root=document){
    root.querySelectorAll('.msg-block.ai ul, .msg-block.ai ol').forEach(list=>{
      if(list.dataset._beauty_list) return;
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.style.margin = '8px';
      btn.textContent = 'Copiar Lista';
      btn.onclick = ()=>{
        const txt = Array.from(list.querySelectorAll('li')).map(li=>li.innerText).join('\n');
        navigator.clipboard.writeText(txt);
        _safeSpeakLocal('Lista copiada.');
        btn.textContent = 'Copiado!';
        setTimeout(()=>btn.textContent='Copiar Lista', 1400);
      };
      list.parentNode.insertBefore(btn, list);
      list.dataset._beauty_list = '1';
    });
  }

  function renderRawHTML(root=document){
    root.querySelectorAll('.msg-block[data-raw]').forEach(block=>{
      if(block.dataset._beauty_raw) return;
      const raw = block.dataset.raw || '';
      if(/<\s*(div|img|p|table|section|iframe)/i.test(raw)){
        try{
          const tmp = document.createElement('div');
          tmp.innerHTML = raw; // assume trusted input; sanitize if necessary
          block.innerHTML = tmp.innerHTML;
        }catch(e){}
      }
      block.dataset._beauty_raw = '1';
    });
  }

  window.__TEXT_BEAUTY_V3__ = { processInline, beautifyFlow, enableCopyLists, renderRawHTML };

  document.addEventListener('infodx:rendered', (e)=>{
    const node = e && e.detail && e.detail.node ? e.detail.node : document;
    try{ processInline(node); renderRawHTML(node); beautifyFlow(node); enableCopyLists(node); }catch(err){ console.warn(err); }
  });

  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=> document.dispatchEvent(new CustomEvent('infodx:rendered', {detail:{node:document}})), 60));
  window.__TEXT_BEAUTY_V3_RUN__ = (sel) => {
    const root = sel ? document.querySelector(sel) : document;
    processInline(root); renderRawHTML(root); beautifyFlow(root); enableCopyLists(root);
  };
})();
</script>

<script id="TRINITY_OVERRIDE">
(function(){
  if(window.TrinityTTS && window.TrinityTTS.__loaded) return;
  window.TrinityTTS = window.TrinityTTS || {};
  window.TrinityTTS.__loaded = true;

  // robust speak helper is installed in Infodox later; reference if present
  function _localSpeak(text, opts){
    try{
      if(window.Infodox && typeof window.Infodox.speakViaApp === 'function') return window.Infodox.speakViaApp(text, opts);
      // fallback to SpeechSynthesis
      const u = new SpeechSynthesisUtterance(String(text||''));
      u.lang = (opts && opts.lang) || 'pt-BR';
      u.rate = (opts && opts.rate) || 1.05;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }catch(e){ console.warn('[Trinity] localSpeak fail', e); }
  }

  window.TrinityTTS.injectJokers = function(rootSelector){
    const root = rootSelector ? document.querySelector(rootSelector) : document;
    if(!root) return;
    root.querySelectorAll('.msg-block.ai').forEach(block=>{
      if(block.dataset.trinityAttached) return;
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.title = 'Ler com Trinity';
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1v22"/></svg>';
      btn.onclick = ()=> {
        const text = block.dataset.raw || block.innerText || '';
        _localSpeak(text, {lang:'pt-BR', rate:1.05});
      };
      const tools = block.querySelector('.msg-tools');
      if(tools) tools.insertBefore(btn, tools.firstChild);
      else block.appendChild(btn);
      block.dataset.trinityAttached = '1';
    });
  };

  window.TrinityTTS.attachPlayable = function(rootSelector){
    return window.TrinityTTS.injectJokers(rootSelector);
  };

  window.TrinityTTS.speak = function(text, opts){
    _localSpeak(text, opts || {});
  };

  document.addEventListener('infodx:rendered', (e)=>{
    try{ window.TrinityTTS.injectJokers('#chat-container'); }catch(e){}
  });
})();
</script>

<script id="INFODOX_EMBED_LOADER">
(function(){
  'use strict';
  // Speech queue + adaptive App.speakText caller
  window.Infodox = window.Infodox || {};
  window.Infodox._speechQueue = window.Infodox._speechQueue || [];
  window.Infodox._speakFlushing = false;

  // Tries multiple signatures for App.speakText, with fallbacks
  window.Infodox.speakViaApp = function(text, opts){
    try{
      // if App exists and likely ready, try common signatures
      if(window.App && typeof window.App.speakText === 'function'){
        try{ 
          // 1) common: App.speakText(text)
          App.speakText(text);
          return true;
        }catch(e1){
          try{
            // 2) App.speakText({text:...})
            App.speakText({ text });
            return true;
          }catch(e2){
            try{
              // 3) App.speakText(text, opts)
              App.speakText(text, opts || {});
              return true;
            }catch(e3){
              console.warn('[Infodox] App.speakText called but failed on all signatures', e1, e2, e3);
            }
          }
        }
      }
    }catch(e){
      console.warn('[Infodox] error while calling App.speakText', e);
    }
    // fallback to native speechSynthesis
    try{
      const u = new SpeechSynthesisUtterance(String(text||''));
      u.lang = (opts && opts.lang) || 'pt-BR';
      u.rate = (opts && opts.rate) || 1.05;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      return true;
    }catch(e){ console.warn('[Infodox] speechSynthesis fallback failed', e); }
    return false;
  };

  // If App is not yet present, queue the speak requests
  window.Infodox.enqueueSpeak = function(text, opts){
    window.Infodox._speechQueue.push({text, opts});
    // try flushing now (if App is already there)
    window.Infodox._tryFlushSpeechQueue();
  };

  window.Infodox._tryFlushSpeechQueue = function(){
    if(window.Infodox._speakFlushing) return;
    if(!window.Infodox._speechQueue.length) return;
    if(!(window.App && typeof window.App.speakText === 'function')){
      // wait for App; set a watcher up to 3s
      if(!window.Infodox._watchInstalled){
        window.Infodox._watchInstalled = true;
        let tries = 0;
        const iv = setInterval(()=>{
          tries++;
          if(window.App && typeof window.App.speakText === 'function'){
            clearInterval(iv);
            window.Infodox._flushSpeechQueue();
          } else if (tries > 30) { // ~3s
            clearInterval(iv);
            window.Infodox._flushSpeechQueue(); // try flush with fallback
          }
        }, 100);
      }
      return;
    }
    window.Infodox._flushSpeechQueue();
  };

  window.Infodox._flushSpeechQueue = function(){
    if(window.Infodox._speakFlushing) return;
    window.Infodox._speakFlushing = true;
    while(window.Infodox._speechQueue.length){
      const item = window.Infodox._speechQueue.shift();
      try{ window.Infodox.speakViaApp(item.text, item.opts); }catch(e){ console.warn(e); }
    }
    window.Infodox._speakFlushing = false;
  };

  // convenience wrapper: tries to speak now or enqueues
  function safeSpeak(msg){
    try{
      if(window.App && typeof window.App.speakText === 'function'){
        return window.Infodox.speakViaApp(msg);
      } else {
        return window.Infodox.enqueueSpeak(msg);
      }
    }catch(e){
      console.warn('[Infodox] safeSpeak error', e);
      try{ const u = new SpeechSynthesisUtterance(String(msg||'')); window.speechSynthesis.speak(u); }catch(e2){}
    }
  }

  // event firing helper
  function fireRendered(node){
    document.dispatchEvent(new CustomEvent('infodx:rendered', { detail: { node: node || document } }));
  }

  // initial kick after DOM ready
  document.addEventListener('DOMContentLoaded', ()=> {
    setTimeout(()=> {
      fireRendered(document);
      try{ safeSpeak('Módulos Infodose carregados.'); }catch(e){}
    }, 90);
  });

  // Observe new messages (dynamic renderers)
  const target = document.getElementById('chat-container') || document.body;
  const mo = new MutationObserver((mut)=>{
    for(const m of mut){
      if(!m.addedNodes) continue;
      for(const n of m.addedNodes){
        if(n.nodeType !== 1) continue;
        if(n.matches && n.matches('.msg-block')) {
          fireRendered(n);
        }
      }
    }
  });
  mo.observe(target, { childList:true, subtree:true });

  function runPostRender(node){
    try{
      if(window.__TEXT_BEAUTY_V3_RUN__) window.__TEXT_BEAUTY_V3_RUN__('#chat-container');
      if(window.__TEXT_BEAUTY_V3__) {
        window.__TEXT_BEAUTY_V3__.processInline(document);
        window.__TEXT_BEAUTY_V3__.beautifyFlow(document);
        window.__TEXT_BEAUTY_V3__.enableCopyLists(document);
        window.__TEXT_BEAUTY_V3__.renderRawHTML(document);
      }
      if(window.TrinityTTS && typeof window.TrinityTTS.injectJokers === 'function'){
        window.TrinityTTS.injectJokers('#chat-container');
      }
    }catch(e){ console.warn('[INFODOX_EMBED_LOADER] post render error', e); }
  }

  document.addEventListener('infodx:rendered', (e)=> runPostRender(e && e.detail ? e.detail.node : document));

  // expose manual entrypoint
  window.Infodox.runAll = function(rootSelector){
    const root = rootSelector ? document.querySelector(rootSelector) : document;
    runPostRender(root);
    try{ safeSpeak('Rotina Infodose executada.'); }catch(e){}
  };

  // expose safeSpeak publicly
  window.Infodox.safeSpeak = safeSpeak;

  console.info('[INFODOX PATCH] Loaded (robust speak + beauty + trinity).');
})();
</script>

<!-- ============================
   FIM DO PATCH
   ============================ -->
