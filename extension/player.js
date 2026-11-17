/* This function is serialized by scripting.executeScript. Keep dependencies inside it. */
async function floatPlayerTask(mode) {
  'use strict';
  const key = '__floatPipControllerV1';
  const collect = (root, roots = [], videos = []) => {
    roots.push(root);
    videos.push(...root.querySelectorAll('video'));
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) collect(element.shadowRoot, roots, videos);
      if (element.tagName === 'IFRAME') {
        try { if (element.contentDocument) collect(element.contentDocument, roots, videos); }
        catch { /* Cross-origin players need their own page; no extra permissions. */ }
      }
    }
    return {roots, videos};
  };
  const visibleArea = video => {
    const box = video.getBoundingClientRect();
    let rect = {left: box.left, top: box.top, right: box.right, bottom: box.bottom};
    let node = video, owner = video.ownerDocument || document;
    const clip = (bounds, x = true, y = true) => {
      if (x) {rect.left = Math.max(rect.left, bounds.left); rect.right = Math.min(rect.right, bounds.right);}
      if (y) {rect.top = Math.max(rect.top, bounds.top); rect.bottom = Math.min(rect.bottom, bounds.bottom);}
    };
    while (node) {
      const view = owner.defaultView || globalThis;
      const style = view.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' ||
          Number(style.opacity) === 0 || (node.checkVisibility &&
          !node.checkVisibility({checkOpacity: true, checkVisibilityCSS: true}))) return 0;
      clip({left: 0, top: 0, right: view.innerWidth, bottom: view.innerHeight});
      let ancestor = node.parentElement || node.getRootNode?.().host;
      while (ancestor) {
        const css = view.getComputedStyle(ancestor);
        const clipsX = /hidden|clip|scroll|auto/.test(css.overflowX);
        const clipsY = /hidden|clip|scroll|auto/.test(css.overflowY);
        if (clipsX || clipsY) clip(ancestor.getBoundingClientRect(), clipsX, clipsY);
        ancestor = ancestor.parentElement || ancestor.getRootNode?.().host;
      }
      if (rect.right <= rect.left || rect.bottom <= rect.top) return 0;
      if (owner === document) break;
      const frame = view.frameElement;
      if (!frame) return 0;
      const bounds = frame.getBoundingClientRect();
      const sx = bounds.width / (frame.offsetWidth || bounds.width || 1);
      const sy = bounds.height / (frame.offsetHeight || bounds.height || 1);
      const left = bounds.left + (frame.clientLeft || 0) * sx;
      const top = bounds.top + (frame.clientTop || 0) * sy;
      rect = {left: left + rect.left * sx, right: left + rect.right * sx,
        top: top + rect.top * sy, bottom: top + rect.bottom * sy};
      node = frame; owner = frame.ownerDocument;
    }
    return Math.max(0, rect.right-rect.left) * Math.max(0, rect.bottom-rect.top);
  };
  const choose = videos => {
    const candidates = [];
    let loading = false;
    for (const video of videos) {
      const area = visibleArea(video);
      if (!area) continue;
      if (!video.readyState || !video.videoWidth) { loading = true; continue; }
      candidates.push({video, area, playing: !video.paused && !video.ended});
    }
    candidates.sort((a,b) => Number(b.playing)-Number(a.playing) || b.area-a.area);
    return candidates[0] || {loading};
  };
  const found = collect(document);
  const selected = choose(found.videos);
  const activeDocument = found.roots.find(root => root.pictureInPictureElement);
  const current = activeDocument?.pictureInPictureElement;
  if (mode === 'probe') {
    if (current) return {code: 'ready', area: Number.MAX_SAFE_INTEGER, playing: true, active: true};
    return selected.video ? {code: 'ready', area: selected.area, playing: selected.playing} :
      {code: selected.loading ? 'loading' : 'no-video'};
  }
  if (mode !== 'toggle') return {code: 'error'};
  if (current && activeDocument.exitPictureInPicture) {
    try { await activeDocument.exitPictureInPicture(); return {code: 'closed'}; }
    catch { return {code: 'error'}; }
  }
  if (!selected.video) return {code: selected.loading ? 'loading' : 'no-video'};

  // One observer per activated document, including accessible open shadow roots.
  let state = globalThis[key];
  if (!state) {
    state = {roots: new WeakSet(), timer: null, helper: null};
    const refresh = () => {
      if (state.timer !== null) clearTimeout(state.timer);
      state.timer = null;
      const {roots, videos} = collect(document);
      for (const root of roots) {
        if (!state.roots.has(root)) {
          state.observer.observe(root, {childList: true, subtree: true, attributes: true,
            attributeFilter: ['disablepictureinpicture']});
          state.roots.add(root);
          root.addEventListener?.('load', () => {
            if (state.timer === null) state.timer = setTimeout(refresh, 150);
          }, true);
        }
      }
      for (const video of videos) {
        if (video.hasAttribute('disablepictureinpicture')) video.removeAttribute('disablepictureinpicture');
        if (video.disablePictureInPicture === true) video.disablePictureInPicture = false;
      }
    };
    state.observer = new MutationObserver(() => {
      if (state.timer === null) state.timer = setTimeout(refresh, 150);
    });
    state.refresh = refresh;
    globalThis[key] = state;
    addEventListener('pagehide', event => {
      if (!event.persisted) { state.observer.disconnect(); clearTimeout(state.timer); state.helper?.remove(); }
    }, {once: true});
  }
  state.refresh();
  const video = selected.video;
  if (typeof video.requestPictureInPicture !== 'function') return {code: 'native-help'};
  if ((video.ownerDocument || document).pictureInPictureEnabled === false) return {code: 'policy'};
  try {
    await video.requestPictureInPicture();
    state.helper?.remove();
    return {code: 'opened'};
  } catch (error) {
    if (error.name === 'SecurityError') return {code: 'policy'};
    if (error.name === 'NotSupportedError') return {code: 'media'};
    if (error.name === 'InvalidStateError') return {code: 'loading'};
    if (error.name !== 'NotAllowedError') return {code: 'error'};
    // Some browsers don't carry the popup gesture through executeScript.
    // A direct click in the page grants activation without relaxing any policies.
    state.helper?.remove();
    const host = document.createElement('div');
    host.style.cssText = 'all:initial!important;position:fixed!important;top:20px!important;right:20px!important;z-index:2147483647!important;';
    const shadow = host.attachShadow({mode: 'open'});
    const style = document.createElement('style');
    style.textContent = ':host{color-scheme:dark}section{font:14px/1.5 system-ui;background:#142435;color:#fff;padding:16px;border:1px solid #4b6678;border-radius:16px;box-shadow:0 8px 32px #0006;max-width:280px}button{font:inherit;cursor:pointer;padding:9px 12px;border-radius:8px;border:0;margin:6px 6px 0 0;background:#a4f1d1;color:#102c25}p{margin:0 0 8px}';
    const panel = document.createElement('section');
    panel.setAttribute('aria-label', 'Float PiP');
    const text = document.createElement('p');
    text.textContent = 'Float PiP — click below to open the video.';
    const open = document.createElement('button'); open.textContent = 'Open picture-in-picture';
    const close = document.createElement('button'); close.textContent = 'Dismiss';
    open.addEventListener('click', async () => {
      const next = choose(collect(document).videos).video;
      if (!next) {text.textContent = 'Start the video, then try again.'; return;}
      state.refresh();
      try {await next.requestPictureInPicture(); host.remove();}
      catch {text.textContent = 'The player or browser blocked PiP. Try its built-in PiP control.';}
    });
    close.addEventListener('click', () => host.remove());
    panel.append(text, open, close); shadow.append(style, panel);
    document.documentElement.append(host); state.helper = host;
    setTimeout(() => host.remove(), 30000);
    return {code: 'gesture'};
  }
}
