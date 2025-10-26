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
  constructor(scene, keyBindings, onPointerDown, pointerEvent = 'pointerdown') {
    this.scene = scene;
    this.keyBindings = keyBindings;
    this.onPointerDown = onPointerDown;
    this.pointerEvent = pointerEvent;

    this.keyNames = Object.keys(this.keyBindings);
    this.keys = scene.input.keyboard.addKeys(this.keyNames.join(','));

    this.handlePointer = this.handlePointer.bind(this);
    scene.input.on(this.pointerEvent, this.handlePointer);
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
    const activeBinding = this.getActiveBinding();
    if (!activeBinding) {
      return;
    }
    this.onPointerDown(pointer, activeBinding.value, activeBinding.keyName);
  }

  /**
   * Detach the pointer listener from the scene.
   */
  destroy() {
    this.scene.input.off(this.pointerEvent, this.handlePointer);
  }
}
