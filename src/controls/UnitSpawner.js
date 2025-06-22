import Phaser from 'phaser';
import Unit from '../entities/Unit.js';
import { Team } from '../entities/Team.js';

/**
 * A temporary, developer control for spawning units in the game.
 * Hold 1, 2, 3 etc and left click to spawn units.
 * This is not intended for production use and should be removed in the final version.
 */
export default class UnitSpawner {
  /**
   * @param {Phaser.Scene} scene
   * @param {Object.<string,Team>} teams      – your scene.teams dictionary
   * @param {Phaser.Physics.Arcade.Group} group – the physics group to add to
   */
  constructor(scene, teams, group) {
    this.scene     = scene;
    this.teams     = teams;
    this.unitGroup = group;

    // map Phaser key names → your team keys in scene.teams
    this.keyToTeam = {
      ONE:   'playerDawn',
      TWO:   'playerNevvar',
      THREE: 'monsterJotun',
    };

    // install keyboard listeners for Digit1/2/3
    this.keys = scene.input.keyboard.addKeys('ONE,TWO,THREE');

    // on any click, maybe spawn
    scene.input.on('pointerdown', this.trySpawn, this);
  }

  /**
   * Called on every pointerdown
   * @param {Phaser.Input.Pointer} pointer
   */
  trySpawn(pointer) {
    // figure out which key is currently down
    const { ONE, TWO, THREE } = this.keys;
    let teamKey = null;
    if (ONE.isDown)   teamKey = this.keyToTeam.ONE;
    if (TWO.isDown)   teamKey = this.keyToTeam.TWO;
    if (THREE.isDown) teamKey = this.keyToTeam.THREE;
    if (!teamKey) return;  // no valid key held

    // spawn parameters
    const size  = 40;
    const speed = 150;
    const team  = this.teams[teamKey];
    const colour= team.colour;

    // worldX/worldY give us canvas→world coords
    const x = pointer.worldX;
    const y = pointer.worldY;

    // 1) instantiate
    const unit = new Unit(this.scene, x, y, size, speed, colour);

    // 2) register with team (sets tint + internal list)
    team.addUnit(unit);

    // 3) register with your physics group (so collisions & updates fire)
    this.unitGroup.add(unit);
  }
}
