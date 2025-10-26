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
    
    // Spawner HUD (bottom-right)
    const hudStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 8, y: 6 } };
    this.spawnerBox = this.add.text(this.sceneWidth - 8, this.sceneHeight - 8, 'Spawner: None', hudStyle)
      .setOrigin(1, 1)
      .setScrollFactor(0);
    this._activeSpawnerSource = null; // 'unit' | 'respawn' | 'rally' | null
    this._spawners = new Map();
    const spawnerLabels = {
      unit: 'Unit',
      respawn: 'Respawn',
      rally: 'Rally',
    };

    const updateSpawnerDisplay = (type, teamKey) => {
      if (!teamKey) {
        if (this._activeSpawnerSource === type) {
          this._activeSpawnerSource = null;
          this.spawnerBox.setText('Spawner: None');
        }
        return;
      }
      const team = this.teams[teamKey];
      const teamName = team ? team.name : teamKey;
      this._activeSpawnerSource = type;
      this.spawnerBox.setText(`Spawner: ${spawnerLabels[type]} - ${teamName}`);
    };

    const makeSelectionHandler = (type) => (teamKey) => {
      if (teamKey) {
        for (const [otherType, otherSpawner] of this._spawners.entries()) {
          if (otherType !== type && otherSpawner.clearSelection) {
            otherSpawner.clearSelection();
          }
        }
      }
      updateSpawnerDisplay(type, teamKey);
    };

    // Input handling with sticky selection + HUD updates
    this.unit_spawner = new UnitSpawner(this, this.teams, this.unitGroup, makeSelectionHandler('unit'));
    this._spawners.set('unit', this.unit_spawner);
    this.respawn_spawner = new RespawnSpawner(this, this.teams, makeSelectionHandler('respawn'));
    this._spawners.set('respawn', this.respawn_spawner);
    this.rally_spawner = new RallyPointSpawner(this, this.teams, makeSelectionHandler('rally'));
    this._spawners.set('rally', this.rally_spawner);

    // Small UI button to return to the main menu
    const backBtnStyle = {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 8, y: 4 },
    };
    const backHover = { backgroundColor: '#666666' };
    const backBtn = this.add.text(8, 8, 'Menu', backBtnStyle)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);
    backBtn.on('pointerover', () => backBtn.setStyle(backHover));
    backBtn.on('pointerout', () => backBtn.setStyle({ backgroundColor: backBtnStyle.backgroundColor }));
    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene', { sceneWidth: this.sceneWidth, sceneHeight: this.sceneHeight });
    });
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
