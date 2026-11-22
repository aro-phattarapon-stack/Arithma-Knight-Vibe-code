import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const uiLayer = document.getElementById('ui-layer');

  if (!canvas || !uiLayer) {
    console.error('Failed to locate canvas or UI container elements.');
    return;
  }

  const game = new Game(canvas, uiLayer);
  game.start();

  // Expose game instance for debugging/inspection in developer tools
  window.__GAME__ = game;
});
