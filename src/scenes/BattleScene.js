import Phaser from 'phaser';
import Unit from '../entities/Unit.js';
import { TEAM_RELATIONSHIP, Team } from '../entities/Team.js';

import UnitSpawner from '../controls/unitSpawner.js';
import RespawnSpawner from '../controls/RespawnSpawner.js';
import RallyPointSpawner from '../controls/RallyPointSpawner.js';

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

  /**
   * Preload assets for the scene.
   * This is where you load images, sprites, etc.
   */
  preload() {
    // Load assets here if needed
    // this.load.image('example', 'path/to/example.png');
    this.load.image('empty',         'assets/unit/empty.png');

    this.load.image('respawn_point',  'assets/building/respawn_flag.png');
    this.load.image('rally_point',  'assets/building/respawn_flag.png');

    this.load.image('body',         'assets/unit/body.png');
    this.load.image('smile',        'assets/unit/smile.png');
    this.load.image('dead',         'assets/unit/dead.png');
    this.load.image('angry_shout',  'assets/unit/angry_shout.png');
    this.load.image('unit',         'assets/unit.png'); // Backup

    this.load.image('sword',        'assets/equipment/weapons/sword.png');
    this.load.image('spear',        'assets/equipment/weapons/spear.png');
    this.load.image('bigAxe',       'assets/equipment/weapons/bigAxe.png');

    this.load.image('shield',       'assets/equipment/defence/shield.png');

    this.load.image('helmet',       'assets/equipment/armour/helmet.png');
    this.load.image('lightArmour',  'assets/equipment/armour/light.png');
    this.load.image('mediumArmour', 'assets/equipment/armour/medium.png');
    this.load.image('heavyArmour',  'assets/equipment/armour/heavy.png');
    this.load.image('magicArmour',  'assets/equipment/armour/magic.png');

    this.load.once('complete', () => {
      console.log('BattleScene assets preloaded');
    });
  }

  /**
   * Create the scene.
   * This is where you set up the game objects, physics, etc.
   */
  create() {
    // Background setup
    this.cameras.main.setBackgroundColor(0x225822); // grassy green

    // Entity setup
    this.teams = {
      playerDawn: new Team(this, 'Dawn', '#1188FF'),
      playerNevvar: new Team(this, 'Nevvar', '#22FF22'),
      monsterJotun: new Team(this, 'Jotun', '#FF2222')
    };
    this.teams.playerDawn.setRelationship(this.teams.playerNevvar.name, TEAM_RELATIONSHIP.ALLY);
    this.teams.playerDawn.setRelationship(this.teams.monsterJotun.name, TEAM_RELATIONSHIP.ENEMY);
    this.teams.playerNevvar.setRelationship(this.teams.playerDawn.name, TEAM_RELATIONSHIP.ALLY);
    this.teams.playerNevvar.setRelationship(this.teams.monsterJotun.name, TEAM_RELATIONSHIP.ENEMY);
    this.teams.monsterJotun.setRelationship(this.teams.playerDawn.name, TEAM_RELATIONSHIP.ENEMY);
    this.teams.monsterJotun.setRelationship(this.teams.playerNevvar.name, TEAM_RELATIONSHIP.ENEMY);

    // Create an array to hold the units
    this.units = {
    };

    // Object pooling setup, including physics
    this.unitGroup = this.physics.add.group({ runChildUpdate: true });
    Object.values(this.units).forEach(unit => {
      this.unitGroup.add(unit);
    });

    this.physics.add.collider(this.unitGroup, this.unitGroup, (u1, u2) => {
        [u1, u2].forEach(u => {
            if (u.tryingToMove) {
              const angle = u.rotation;
              const vx = Math.cos(angle) * u.moveSpeed;
              const vy = Math.sin(angle) * u.moveSpeed;
              u.body.setVelocity(vx, vy);
            }
        });
    });

    // Scene physics
    this.physics.world.setBounds(0, 0, this.sceneWidth, this.sceneHeight);
    this.physics.world.setBoundsCollision(true, true, true, true); // Enable world bounds collision
    this.physics.world.setFPS(60); // Set the physics world to run at 60 FPS
    
    // Input handling
    this.unit_spawner = new UnitSpawner(this, this.teams, this.unitGroup);
    this.respawn_spawner = new RespawnSpawner(this, this.teams);
    this.rally_spawner = new RallyPointSpawner(this, this.teams);
  }

  /**
   * Update the scene.
   * This is where you handle input, animations, etc.
   * Developer note: You do not need to call update on each unit in a group that
   * has runChildUpdate set to true.
   * @param {number} time - Current time in milliseconds
   * @param {number} delta - Time since last frame in milliseconds
   */
  update(time, delta) {
    
  }
}
