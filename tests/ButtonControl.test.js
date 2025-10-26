import { describe, expect, it, vi } from 'vitest';
import ButtonControl from '../src/controls/ButtonControl.js';

function createSceneStub() {
  const pointerListeners = {};
  const keyboardListeners = {};
  const keys = {};

  const scene = {
    input: {
      keyboard: {
        addKeys: vi.fn((names) => {
          for (const name of names.split(',')) {
            keys[name] = { isDown: false };
          }
          return keys;
        }),
        on: vi.fn((event, handler) => {
          keyboardListeners[event] = handler;
        }),
        off: vi.fn((event, handler) => {
          if (keyboardListeners[event] === handler) {
            delete keyboardListeners[event];
          }
        }),
      },
      on: vi.fn((event, handler) => {
        pointerListeners[event] = handler;
      }),
      off: vi.fn((event, handler) => {
        if (pointerListeners[event] === handler) {
          delete pointerListeners[event];
        }
      }),
    },
  };

  scene.emit = (event, pointer) => {
    if (pointerListeners[event]) {
      pointerListeners[event](pointer);
    }
  };

  scene.emitKey = (event) => {
    if (keyboardListeners[event]) {
      keyboardListeners[event]();
    }
  };

  scene.setKeyState = (keyName, value) => {
    if (keys[keyName]) {
      keys[keyName].isDown = value;
    }
  };

  return scene;
}

describe('ButtonControl', () => {
  it('triggers callback when a bound key is held', () => {
    const scene = createSceneStub();
    const callback = vi.fn();
    const control = new ButtonControl(
      scene,
      { ONE: 'playerDawn', TWO: 'playerNevvar' },
      callback
    );

    scene.setKeyState('TWO', true);
    const pointer = { worldX: 10, worldY: 20 };
    scene.emit('pointerdown', pointer);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(pointer, 'playerNevvar', 'TWO');

    control.destroy();
  });

  it('ignores pointer events when no keys are active', () => {
    const scene = createSceneStub();
    const callback = vi.fn();
    const control = new ButtonControl(scene, { ONE: 'team' }, callback);

    const pointer = { worldX: 5, worldY: 6 };
    scene.emit('pointerdown', pointer);

    expect(callback).not.toHaveBeenCalled();

    control.destroy();
  });

  it('removes listener when destroyed', () => {
    const scene = createSceneStub();
    const callback = vi.fn();
    const control = new ButtonControl(scene, { ONE: 'team' }, callback);

    control.destroy();

    expect(scene.input.off).toHaveBeenCalledTimes(1);

    scene.setKeyState('ONE', true);
    scene.emit('pointerdown', { worldX: 0, worldY: 0 });

    expect(callback).not.toHaveBeenCalled();
  });

  it('supports sticky selection that persists until cleared', () => {
    const scene = createSceneStub();
    const callback = vi.fn();
    const selectionSpy = vi.fn();
    const control = new ButtonControl(
      scene,
      { ONE: 'playerDawn', TWO: 'playerNevvar' },
      callback,
      'pointerdown',
      { mode: 'sticky', onSelectionChange: selectionSpy }
    );

    scene.emitKey('keydown-ONE');
    expect(selectionSpy).toHaveBeenLastCalledWith('playerDawn', 'ONE');

    const pointer = { worldX: 1, worldY: 2 };
    scene.emit('pointerdown', pointer);
    scene.emit('pointerdown', pointer);
    expect(callback).toHaveBeenCalledTimes(2);

    scene.emitKey('keydown-ESC');
    expect(selectionSpy).toHaveBeenLastCalledWith(null, 'ESC');

    scene.emit('pointerdown', pointer);
    expect(callback).toHaveBeenCalledTimes(2);

    scene.emitKey('keydown-TWO');
    expect(selectionSpy).toHaveBeenLastCalledWith('playerNevvar', 'TWO');

    scene.emit('pointerdown', pointer);
    expect(callback).toHaveBeenCalledTimes(3);

    control.clearSelection();
    expect(selectionSpy).toHaveBeenLastCalledWith(null, null);

    scene.emit('pointerdown', pointer);
    expect(callback).toHaveBeenCalledTimes(3);

    control.destroy();
    expect(scene.input.keyboard.off).toHaveBeenCalled();
  });
});
