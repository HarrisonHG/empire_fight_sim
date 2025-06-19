import Phaser from 'phaser';
import Unit from '../entities/Unit.js'; // Assuming Unit is defined in entities/Unit.js

export default class BattleScene extends Phaser.Scene {

  constructor() {
    super({ key: 'BattleScene' });  // unique scene key
  }

/**
 * Initialize the scene with data containing sceneWidth and sceneHeight.
 * @param {{ sceneWidth: number, sceneHeight: number }} data 
 */
  init(data) {
    this.sceneWidth = data.sceneWidth || 800;
    this.sceneHeight = data.sceneHeight || 600;
  }

  preload() {
    // Load assets here if needed
    // this.load.image('example', 'path/to/example.png');
  }

  create() {
    // Background setup
    this.cameras.main.setBackgroundColor(0x228B22); // grassy green

    // Add 3 units to the scene, // each with a different colour and position
    this.unit1 = new Unit(this, 100, 100, 10, 10, '#FF0000'); // Red
    this.unit2 = new Unit(this, 200, 100, 10, 10, '#00FF00'); // Green
    this.unit3 = new Unit(this, 300, 100, 10, 10, '#0000FF'); // Blue

    // Add units to the scene
    this.add.existing(this.unit1);
    this.add.existing(this.unit2);
    this.add.existing(this.unit3);
  }

  update(time, delta) {
    // Update logic goes here
  }
}
