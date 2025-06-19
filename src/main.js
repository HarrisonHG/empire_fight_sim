// entry point: wires Phaser into the #app container
import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  scene: [ BattleScene ],
  physics: { default: 'arcade' },
};

const game = new Phaser.Game(config);
game.scene.start('BattleScene', { sceneWidth: config.width, sceneHeight: config.height });

console.log('🎉 Empite battle sim (bundled) is up! 🎉');
