// Getting rid of the browser bars on phones.
//  - Android (Chrome etc.): the Fullscreen API works, so we go fullscreen + landscape on the first tap.
//  - iPhone: Safari only allows fullscreen for video, so the only way is "Add to Home Screen";
//    launched from the home screen the game runs with no browser UI. We show a tip explaining how.

const ua = navigator.userAgent;
const isAndroid = /Android/.test(ua);
// iPads report themselves as Macs, so a "Mac" with a touch screen is an iPad
const isIOS = !isAndroid && (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const standalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

function goFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
  if (document.fullscreenElement) return;
  const req = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
  if (!req) return;
  Promise.resolve(req({ navigationUI: 'hide' } as FullscreenOptions))
    .then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {
      /* not allowed here: fine, play on with the bars */
    });
}

export function initFullscreen() {
  if (!isTouch || standalone) return;

  if (!isIOS && document.fullscreenEnabled) {
    window.addEventListener('pointerdown', goFullscreen, { once: true });
  }

  let dismissed = false;
  try {
    dismissed = localStorage.getItem('bb-a2hs') === '1';
  } catch {
    /* ignore */
  }
  if (dismissed || !(isIOS || isAndroid)) return;
  const tip = document.getElementById('a2hs');
  const text = document.getElementById('a2hs-text');
  const close = document.getElementById('a2hs-close');
  if (!tip || !text || !close) return;
  text.textContent = isIOS
    ? 'For fullscreen: tap Share, then "Add to Home Screen", and play from the icon.'
    : 'Tip: menu ⋮ → "Add to Home screen" to install it as an app.';
  tip.hidden = false;
  close.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    tip.hidden = true;
    try {
      localStorage.setItem('bb-a2hs', '1');
    } catch {
      /* ignore */
    }
  });
}
