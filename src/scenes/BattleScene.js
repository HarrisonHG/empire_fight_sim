import Phaser from 'phaser';
import Unit from '../entities/Unit.js';
import { TEAM_RELATIONSHIP, Team } from '../entities/Team.js';

import UnitSpawner from '../controls/UnitSpawner.js';
import RespawnSpawner from '../controls/RespawnSpawner.js';
import RallyPointSpawner from '../controls/RallyPointSpawner.js';

export default class BattleScene extends Phaser.Scene {

  constructor() {
    super({ key: 'BattleScene' });  // unique scene key
    this.registerSpawnerControls = this.registerSpawnerControls.bind(this);
    this.updateSpawnerHud = this.updateSpawnerHud.bind(this);
    this.setTeamIndex = this.setTeamIndex.bind(this);
    this.cycleType = this.cycleType.bind(this);
    this.cycleArmour = this.cycleArmour.bind(this);
    this.cycleWeapon = this.cycleWeapon.bind(this);
    this.toggleHelmet = this.toggleHelmet.bind(this);
    this.resetSpawnSelection = this.resetSpawnSelection.bind(this);
    this.handleSpawnPointer = this.handleSpawnPointer.bind(this);
    this.cleanupInput = this.cleanupInput.bind(this);
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

    // Spawners wired through custom key controls
    this.unit_spawner = new UnitSpawner(this, this.teams, this.unitGroup);
    this.respawn_spawner = new RespawnSpawner(this, this.teams);
    this.rally_spawner = new RallyPointSpawner(this, this.teams);

    this.spawnState = {
      teamKeys: ['playerDawn', 'playerNevvar', 'monsterJotun'],
      teamIndex: 0,
      types: ['unit', 'respawn', 'rally'],
      typeIndex: -1,
      currentType: null,
      armourOptions: ['none', 'magic', 'light', 'medium', 'heavy'],
      weaponOptions: ['sword', 'spear', 'bigAxe'],
      armourIndex: 0,
      weaponIndex: 0,
      helmet: false,
      loadoutInitialized: false,
    };

    const hudStyle = {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 8 },
    };
    this.spawnerBox = this.add.text(this.sceneWidth - 12, this.sceneHeight - 12, '', hudStyle)
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setLineSpacing(4)
      .setInteractive({ useHandCursor: false });
    this.spawnerBox.setData('uiBlock', true);

    this._pointerHandlers = [];
    this._keyboardHandlers = [];
    this._uiPointerBlock = false;

    this.updateSpawnerHud();
    this.registerSpawnerControls();

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
    backBtn.setData('uiBlock', true);
    backBtn.on('pointerdown', (pointer) => {
      if (pointer?.event) {
        pointer.event.stopPropagation?.();
        pointer.event.stopImmediatePropagation?.();
      }
      this._uiPointerBlock = true;
      this.scene.start('MainMenuScene', { sceneWidth: this.sceneWidth, sceneHeight: this.sceneHeight });
    });
  }

  registerSpawnerControls() {
    const addKey = (eventName, handler) => {
      const wrapped = (evt) => {
        if (evt && evt.repeat) return;
        handler(evt);
      };
      this.input.keyboard.on(eventName, wrapped);
      this._keyboardHandlers.push([eventName, wrapped]);
    };

    addKey('keydown-ONE', () => this.setTeamIndex(0));
    addKey('keydown-TWO', () => this.setTeamIndex(1));
    addKey('keydown-THREE', () => this.setTeamIndex(2));
    addKey('keydown-NUMPAD_ONE', () => this.setTeamIndex(0));
    addKey('keydown-NUMPAD_TWO', () => this.setTeamIndex(1));
    addKey('keydown-NUMPAD_THREE', () => this.setTeamIndex(2));

    addKey('keydown-T', () => this.cycleType());
    addKey('keydown-A', () => this.cycleArmour());
    addKey('keydown-W', () => this.cycleWeapon());
    addKey('keydown-H', () => this.toggleHelmet());
    addKey('keydown-ESC', () => this.resetSpawnSelection());

    const pointerHandler = (pointer) => this.handleSpawnPointer(pointer);
    this.input.on('pointerup', pointerHandler);
    this._pointerHandlers.push(['pointerup', pointerHandler]);

    const gameobjectDown = (pointer, gameObject) => {
      if (gameObject?.getData && gameObject.getData('uiBlock')) {
        this._uiPointerBlock = true;
      }
    };
    this.input.on('gameobjectdown', gameobjectDown);
    this._pointerHandlers.push(['gameobjectdown', gameobjectDown]);

    this.events.once('shutdown', this.cleanupInput, this);
    this.events.once('destroy', this.cleanupInput, this);
  }

  updateSpawnerHud() {
    const state = this.spawnState;
    const typeLabels = {
      unit: 'Unit',
      respawn: 'Respawn',
      rally: 'Spawn Flag',
    };
    const armourLabels = {
      none: 'None',
      magic: 'Magic',
      light: 'Light',
      medium: 'Medium',
      heavy: 'Heavy',
    };
    const weaponLabels = {
      sword: 'Sword & Shield',
      spear: 'Spear',
      bigAxe: 'Two-Handed Axe',
    };

    const teamKey = this.getCurrentTeamKey();
    const teamName = teamKey ? this.teams[teamKey]?.name ?? teamKey : 'None';
    const currentTypeLabel = state.currentType ? typeLabels[state.currentType] : 'None';

    const lines = [];
    lines.push('Spawner');
    lines.push(`T: Type -> ${currentTypeLabel}`);
    lines.push(`1 / 2 / 3: Team -> ${teamName}`);

    if (state.currentType === 'unit') {
      const armour = armourLabels[state.armourOptions[state.armourIndex] ?? 'none'] ?? 'None';
      const weapon = weaponLabels[state.weaponOptions[state.weaponIndex] ?? 'sword'] ?? 'Sword & Shield';
      const helmet = state.helmet ? 'On' : 'Off';
      lines.push(`A: Armour -> ${armour}`);
      lines.push(`W: Weapon -> ${weapon}`);
      lines.push(`H: Helmet -> ${helmet}`);
    } else {
      lines.push('A: Armour -> (units only)');
      lines.push('W: Weapon -> (units only)');
      lines.push('H: Helmet -> (units only)');
    }

    lines.push('');
    if (state.currentType) {
      lines.push(`Next Spawn: ${currentTypeLabel} (${teamName})`);
    } else {
      lines.push('Next Spawn: None (press T)');
    }
    lines.push('Esc: Clear selection');
    lines.push('Click: Place');

    this.spawnerBox.setText(lines.join('\n'));
  }

  setTeamIndex(index) {
    if (!this.spawnState) return;
    if (index < 0 || index >= this.spawnState.teamKeys.length) return;
    this.spawnState.teamIndex = index;
    this.updateSpawnerHud();
  }

  cycleType() {
    const state = this.spawnState;
    if (!state) return;
    state.typeIndex = (state.typeIndex + 1) % state.types.length;
    state.currentType = state.types[state.typeIndex];
    if (state.currentType === 'unit' && !state.loadoutInitialized) {
      state.armourIndex = state.armourOptions.indexOf('none');
      if (state.armourIndex < 0) state.armourIndex = 0;
      state.weaponIndex = state.weaponOptions.indexOf('sword');
      if (state.weaponIndex < 0) state.weaponIndex = 0;
      state.helmet = false;
      state.loadoutInitialized = true;
    }
    this.updateSpawnerHud();
  }

  cycleArmour() {
    const state = this.spawnState;
    if (!state || state.currentType !== 'unit') return;
    state.armourIndex = (state.armourIndex + 1) % state.armourOptions.length;
    state.loadoutInitialized = true;
    this.updateSpawnerHud();
  }

  cycleWeapon() {
    const state = this.spawnState;
    if (!state || state.currentType !== 'unit') return;
    state.weaponIndex = (state.weaponIndex + 1) % state.weaponOptions.length;
    state.loadoutInitialized = true;
    this.updateSpawnerHud();
  }

  toggleHelmet() {
    const state = this.spawnState;
    if (!state || state.currentType !== 'unit') return;
    state.helmet = !state.helmet;
    state.loadoutInitialized = true;
    this.updateSpawnerHud();
  }

  resetSpawnSelection() {
    const state = this.spawnState;
    if (!state) return;
    state.typeIndex = -1;
    state.currentType = null;
    state.armourIndex = 0;
    state.weaponIndex = 0;
    state.helmet = false;
    state.loadoutInitialized = false;
    state.teamIndex = 0;
    this.updateSpawnerHud();
  }

  getCurrentTeamKey() {
    if (!this.spawnState) return null;
    return this.spawnState.teamKeys[this.spawnState.teamIndex] ?? null;
  }

  getUnitLoadout() {
    const state = this.spawnState;
    if (!state) {
      return { armour: 'none', weapon: 'sword', helmet: false };
    }
    const armour = state.armourOptions[state.armourIndex] ?? 'none';
    const weapon = state.weaponOptions[state.weaponIndex] ?? 'sword';
    return {
      armour,
      weapon,
      helmet: Boolean(state.helmet),
    };
  }

  handleSpawnPointer(pointer) {
    if (pointer.button !== 0) {
      return;
    }
    if (this._uiPointerBlock) {
      this._uiPointerBlock = false;
      return;
    }
    if (!this.spawnState || !this.spawnState.currentType) {
      return;
    }

    const teamKey = this.getCurrentTeamKey();
    if (!teamKey) return;

    switch (this.spawnState.currentType) {
      case 'unit':
        this.unit_spawner.spawn(pointer, teamKey, this.getUnitLoadout());
        break;
      case 'respawn':
        this.respawn_spawner.spawn(pointer, teamKey);
        break;
      case 'rally':
        this.rally_spawner.spawn(pointer, teamKey);
        break;
      default:
        break;
    }
  }

  cleanupInput() {
    if (this._keyboardHandlers) {
      for (const [eventName, handler] of this._keyboardHandlers) {
        this.input.keyboard.off(eventName, handler);
      }
      this._keyboardHandlers.length = 0;
    }
    if (this._pointerHandlers) {
      for (const [eventName, handler] of this._pointerHandlers) {
        this.input.off(eventName, handler);
      }
      this._pointerHandlers.length = 0;
    }
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
