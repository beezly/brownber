import Phaser from './phaser';
import { BootScene, TitleScene, SelectScene } from './MenuScenes';
import { GameScene } from './GameScene';
import { input } from './input';
import { unlockAudio as unlockSfx, isMuted, setMuted } from './sound';
import { refreshMusic } from './music';

const unlockAudio = () => {
  unlockSfx();
  refreshMusic();
};

input.init();

// Browsers only allow sound after the first tap or key press.
input.onFirstInteraction = unlockAudio;
window.addEventListener('pointerdown', unlockAudio, { once: true });

const muteBtn = document.getElementById('mute')!;
const syncMute = () => muteBtn.classList.toggle('off', isMuted());
syncMute();
muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setMuted(!isMuted());
  unlockAudio();
  syncMute();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    setMuted(!isMuted());
    refreshMusic();
    syncMute();
  }
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 256,
  height: 192,
  pixelArt: true,
  backgroundColor: '#1a1c2c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, SelectScene, GameScene],
});

// Dev-only hook for testing in the browser console.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
