// entry point: wires Phaser into the #app container
import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import ControlsScene from './scenes/ControlsScene.js';

const config = {
  type: Phaser.AUTO,
  width: Math.max(window.innerWidth - 1, 1),
  height: Math.max(window.innerHeight - 1, 1),
  parent: 'app',
  scene: [ MainMenuScene, ControlsScene, BattleScene ],
  physics: {
    default: 'arcade',
    arcade: {
      debug: true,
      debugBodyColor: 0xff00ff,
    }
  }
};

const game = new Phaser.Game(config);
game.scene.start('MainMenuScene', { sceneWidth: config.width, sceneHeight: config.height });

console.log('🎉 Empire battle sim (bundled) is up! 🎉');
