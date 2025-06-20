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
    this.load.image('unit', 'assets/unit.png'); // Load the unit sprite
    this.load.once('complete', () => {
      console.log('BattleScene assets preloaded');
    });    
  }

  create() {
    // Background setup
    this.cameras.main.setBackgroundColor(0x225822); // grassy green

    // Create an array to hold the units
    this.units = [
      new Unit(this, 100, 100, 40, 100, '#FF0000'), // Red
      new Unit(this, 200, 100, 40, 150, '#00FF00'), // Green
      new Unit(this, 300, 100, 40, 200, '#0000FF')  // Blue
    ];

    // Physics setup
    this.unitGroup = this.physics.add.group({ runChildUpdate: true });
    this.units.forEach(unit => {
      this.unitGroup.add(unit);
    });
    this.physics.add.collider(this.unitGroup, this.unitGroup, (u1, u2) => {
        [u1, u2].forEach(u => {
            // figure out the direction they’re facing
            const angle = u.rotation;
            // rebuild the full-speed velocity vector
            const vx = Math.cos(angle) * u.moveSpeed;
            const vy = Math.sin(angle) * u.moveSpeed;
            // re-apply it
            u.body.setVelocity(vx, vy);
        });
    });
    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight);
    this.physics.world.setBoundsCollision(true, true, true, true); // Enable world bounds collision
    this.physics.world.setFPS(60); // Set the physics world to run at 60 FPS

    
  }

  update(time, delta) {

  }
}
