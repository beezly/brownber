// Keeps home-screen installs up to date. Phones often resume the app from memory instead of
// reloading it, so it could stay on an old version for days. We check version.json whenever the
// app is opened or comes back to the foreground (and every 15 minutes while open):
//  - on the title screen, a new version loads straight away;
//  - mid-game, an "UPDATE" button appears; tapping it saves and reloads.

declare const __BUILD_ID__: string;
export const BUILD_ID = __BUILD_ID__;

let checking = false;
let latest: string | null = null;

function inGame() {
  return document.body.classList.contains('ingame');
}

function apply() {
  if (!latest) return;
  // remember what we tried, so a stale cache can never cause a reload loop
  try {
    sessionStorage.setItem('bb-update-tried', latest);
  } catch {
    /* ignore */
  }
  // let the game save first (GameScene listens for this), then load a fresh URL:
  // the ?v= makes the browser fetch the new page instead of a cached copy
  window.dispatchEvent(new Event('bb-save-now'));
  const target = latest;
  setTimeout(() => location.replace(`${location.pathname}?v=${encodeURIComponent(target)}`), 50);
}

function alreadyTried(build: string) {
  try {
    return sessionStorage.getItem('bb-update-tried') === build;
  } catch {
    return false;
  }
}

function showBanner() {
  const btn = document.getElementById('update');
  if (!btn) return;
  btn.hidden = false;
}

async function check() {
  if (BUILD_ID === 'dev' || checking || !navigator.onLine) return;
  checking = true;
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { build } = (await res.json()) as { build: string };
    if (build && build !== BUILD_ID && !alreadyTried(build)) {
      latest = build;
      if (inGame()) showBanner();
      else apply();
    }
  } catch {
    /* offline or blocked: try again later */
  } finally {
    checking = false;
  }
}

export function initUpdates() {
  const btn = document.getElementById('update');
  btn?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    apply();
  });
  // when the player leaves the game for the title screen, apply a pending update
  new MutationObserver(() => {
    if (latest && !inGame()) apply();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  setTimeout(check, 3000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) check();
  });
  setInterval(check, 15 * 60 * 1000);
}
