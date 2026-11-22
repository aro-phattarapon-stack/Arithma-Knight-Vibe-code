import { CONFIG } from '../config.js';

/**
 * Handles unified keyboard, mouse, and touch inputs.
 * Normalizes screen-space pointer coordinates to 1920x1080 logical canvas space.
 */
export class Input {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;

    // Keys currently held down
    this.keys = new Set();
    // Keys pressed during this specific frame
    this.justPressedKeys = new Set();

    // Mouse & Touch states in logical canvas coordinates
    this.pointer = {
      x: CONFIG.CANVAS.WIDTH / 2,
      y: CONFIG.CANVAS.HEIGHT / 2,
      isDown: false,
      justClicked: false,
    };

    // Bind event handlers
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    this._attachListeners();
  }

  _attachListeners() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    this.canvas.addEventListener('mousedown', this._onPointerDown);
    window.addEventListener('mousemove', this._onPointerMove);
    window.addEventListener('mouseup', this._onPointerUp);

    this.canvas.addEventListener('touchstart', this._onPointerDown, { passive: false });
    window.addEventListener('touchmove', this._onPointerMove, { passive: false });
    window.addEventListener('touchend', this._onPointerUp);

    // Prevent accidental context menu on right click in game view
    this.canvas.addEventListener('contextmenu', this._onContextMenu);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousedown', this._onPointerDown);
    window.removeEventListener('mousemove', this._onPointerMove);
    window.removeEventListener('mouseup', this._onPointerUp);
    this.canvas.removeEventListener('touchstart', this._onPointerDown);
    window.removeEventListener('touchmove', this._onPointerMove);
    window.removeEventListener('touchend', this._onPointerUp);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    if (!this.keys.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.keys.add(e.code);

    // Prevent default scroll behaviors for arrow keys and spacebar
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  _updatePointerPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Convert display viewport pixels to logical 1920x1080 canvas coordinates
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.pointer.x = (clientX - rect.left) * scaleX;
    this.pointer.y = (clientY - rect.top) * scaleY;
  }

  _onPointerDown(e) {
    this.pointer.isDown = true;
    this.pointer.justClicked = true;

    if (e.touches && e.touches.length > 0) {
      this._updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      this._updatePointerPosition(e.clientX, e.clientY);
    }
  }

  _onPointerMove(e) {
    if (e.touches && e.touches.length > 0) {
      this._updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      this._updatePointerPosition(e.clientX, e.clientY);
    }
  }

  _onPointerUp() {
    this.pointer.isDown = false;
  }

  _onContextMenu(e) {
    e.preventDefault();
  }

  /**
   * Check if any key in the specified list is currently held down.
   * @param {string[]} keyCodes
   * @returns {boolean}
   */
  isAnyKeyDown(keyCodes) {
    return keyCodes.some((code) => this.keys.has(code));
  }

  /**
   * Check if any key in the specified list was pressed during this frame.
   * @param {string[]} keyCodes
   * @returns {boolean}
   */
  isAnyKeyJustPressed(keyCodes) {
    return keyCodes.some((code) => this.justPressedKeys.has(code));
  }

  /**
   * Clears single-frame trigger buffers at the end of every update tick.
   */
  resetPerFrame() {
    this.justPressedKeys.clear();
    this.pointer.justClicked = false;
  }
}
