/**
 * Handles mapping held keyboard keys to pointer interactions for Phaser scenes.
 */
export default class ButtonControl {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, string>} keyBindings mapping of Phaser key names to domain identifiers.
   * @param {(pointer: import('phaser').Input.Pointer, bindingValue: string, keyName: string) => void} onPointerDown
   * @param {string} [pointerEvent='pointerdown']
   */
  constructor(scene, keyBindings, onPointerDown, pointerEvent = 'pointerdown', options = {}) {
    this.scene = scene;
    this.keyBindings = keyBindings;
    this.onPointerDown = onPointerDown;
    this.pointerEvent = pointerEvent;
    this.mode = options.mode || 'hold'; // 'hold' | 'sticky'
    this.onSelectionChange = options.onSelectionChange || null;
    this.clearKeys = options.clearKeys || ['ESC'];

    this.keyNames = Object.keys(this.keyBindings);
    this.keys = scene.input.keyboard.addKeys(this.keyNames.join(','));

    this.handlePointer = this.handlePointer.bind(this);
    scene.input.on(this.pointerEvent, this.handlePointer);

    this.selected = null; // { keyName, value } for sticky mode
    this._keyListeners = [];
    if (this.mode === 'sticky') {
      // Listen for specific bound key presses to set selection
      for (const keyName of this.keyNames) {
        const evt = `keydown-${keyName}`;
        const fn = () => {
          this.selected = { keyName, value: this.keyBindings[keyName] };
          if (this.onSelectionChange) this.onSelectionChange(this.selected.value, keyName);
        };
        scene.input.keyboard.on(evt, fn);
        this._keyListeners.push([evt, fn]);
      }
      // Clear selection on configured clear keys (default: ESC)
      for (const clearName of this.clearKeys) {
        const evt = `keydown-${clearName}`;
        const fn = () => {
          if (!this.selected) return;
          this.selected = null;
          if (this.onSelectionChange) this.onSelectionChange(null, clearName);
        };
        scene.input.keyboard.on(evt, fn);
        this._keyListeners.push([evt, fn]);
      }
    }
  }

  /**
   * Determine which binding is currently active.
   * @returns {{ keyName: string, value: string } | null}
   */
  getActiveBinding() {
    for (const keyName of this.keyNames) {
      const key = this.keys[keyName];
      if (key && key.isDown) {
        return { keyName, value: this.keyBindings[keyName] };
      }
    }
    return null;
  }

  /**
   * Internal pointer handler used to forward to the provided callback.
   * @param {import('phaser').Input.Pointer} pointer
   */
  handlePointer(pointer) {
    let binding = null;
    if (this.mode === 'sticky') {
      binding = this.selected;
    } else {
      binding = this.getActiveBinding();
    }
    if (!binding) return;
    this.onPointerDown(pointer, binding.value, binding.keyName);
  }

  /**
   * Clear the sticky selection if present.
   * @param {boolean} [notify=true]
   */
  clearSelection(notify = true) {
    if (this.mode !== 'sticky') return;
    if (!this.selected) {
      return;
    }
    this.selected = null;
    if (notify && this.onSelectionChange) {
      this.onSelectionChange(null, null);
    }
  }

  /**
   * Detach the pointer listener from the scene.
   */
  destroy() {
    this.scene.input.off(this.pointerEvent, this.handlePointer);
    if (this._keyListeners && this._keyListeners.length) {
      for (const [evt, fn] of this._keyListeners) {
        this.scene.input.keyboard.off(evt, fn);
      }
      this._keyListeners = [];
    }
  }
}
