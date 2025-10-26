import { describe, expect, it, vi } from 'vitest';
import ButtonControl from '../src/controls/ButtonControl.js';

function createSceneStub() {
  const listeners = {};
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
      },
      on: vi.fn((event, handler) => {
        listeners[event] = handler;
      }),
      off: vi.fn((event, handler) => {
        if (listeners[event] === handler) {
          delete listeners[event];
        }
      }),
    },
  };

  scene.emit = (event, pointer) => {
    if (listeners[event]) {
      listeners[event](pointer);
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
});
