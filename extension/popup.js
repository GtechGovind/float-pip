'use strict';
const extensionAPI = globalThis.browser || globalThis.chrome;
function pickFrame(frames) {
  return frames.filter(frame => frame.result?.code === 'ready').sort((a,b) =>
    Number(Boolean(b.result.active))-Number(Boolean(a.result.active)) ||
    Number(Boolean(b.result.playing))-Number(Boolean(a.result.playing)) ||
    b.result.area-a.result.area)[0] || null;
}
async function scanFrames(tabId) {
  const frames = await extensionAPI.scripting.executeScript({target: {tabId, frameIds: [0]},
    func: floatPlayerTask, args: ['probe']});
  return {frames};
}

document.addEventListener('DOMContentLoaded', async () => {
  const button = document.getElementById('toggle');
  const refresh = document.getElementById('refresh');
  const status = document.getElementById('status');
  const detail = document.getElementById('detail');
  let tabId, selected;
  const messages = {
    opened: ['Your video is floating.', 'Keep the original tab open. Native PiP may not show site captions or overlays.'],
    closed: ['Back in the tab.', 'Open picture-in-picture again whenever you like.'],
    'no-video': ['No playable video found.', 'Start playback and scan again. For an embedded player, open its own page; cross-origin frames may need access we do not request.'],
    loading: ['The video is still loading.', 'Start playback, wait a moment, then scan again.'],
    'native-help': ['Use your browser’s PiP control.', 'PiP restrictions have been cleared. In Firefox, hover over the video and click its PiP icon, or Shift + right-click and choose Watch in Picture-in-Picture. Newer Firefox versions may support direct opening.'],
    gesture: ['One more click in the page.', 'Close this popup and click the Float PiP button on the video page within 30 seconds. Your browser requires a direct page gesture.'],
    policy: ['This player blocks PiP.', 'The page’s Permissions Policy or your browser settings prevent PiP. Try the original player page or its built-in PiP control.'],
    media: ['This video cannot use native PiP.', 'The media format, protected playback, or browser may prevent it. Try the player’s own PiP control.'],
    error: ['Could not open picture-in-picture.', 'The video may have changed. Scan again, or try the player’s built-in PiP control.']
  };
  const show = code => {
    const message = messages[code] || messages.error;
    status.textContent = message[0]; detail.textContent = message[1];
  };
  const scan = async () => {
    button.disabled = true; refresh.disabled = true; selected = null;
    status.textContent = 'Finding your video…'; detail.textContent = 'Checking the current tab only.';
    try {
      const result = await scanFrames(tabId);
      selected = pickFrame(result.frames);
      if (selected) {
        status.textContent = selected.result.active ? 'Your video is in PiP.' : 'Ready when you are.';
        detail.textContent = 'Uses the main visible video. Access stays limited to this tab.';
        button.textContent = selected.result.active ? 'Return video to tab' : 'Open picture-in-picture';
        button.disabled = false; button.focus();
      } else show(result.frames.some(frame=>frame.result?.code==='loading') ? 'loading' : 'no-video');
    } catch {
      status.textContent = 'This page cannot be accessed.';
      detail.textContent = 'Use a normal HTTPS video page. Browser pages, extension stores, and other protected pages cannot be scripted.';
    } finally {refresh.disabled = false;}
  };
  button.addEventListener('click', async () => {
    if (!selected) return;
    button.disabled = true; refresh.disabled = true;
    status.textContent = 'Opening picture-in-picture…';
    try {
      // Call immediately in the click handler to preserve activation where supported.
      const results = await extensionAPI.scripting.executeScript({target: {tabId, frameIds: [selected.frameId]},
        func: floatPlayerTask, args: ['toggle']});
      const code = results[0]?.result?.code || 'error';
      show(code);
      button.textContent = code === 'opened' ? 'Return video to tab' : 'Open picture-in-picture';
    } catch {show('error');}
    finally {button.disabled = false; refresh.disabled = false;}
  });
  refresh.addEventListener('click', scan);
  try {
    const [tab] = await extensionAPI.tabs.query({active: true, currentWindow: true});
    if (!tab?.id || !/^https?:\/\//i.test(tab.url || '')) {
      status.textContent = 'Open a video page first.';
      detail.textContent = 'Float PiP works on regular HTTP and HTTPS pages. Browser pages and extension stores are protected.';
      refresh.disabled = true;
      return;
    }
    tabId = tab.id; await scan();
  } catch {show('error');}
});
