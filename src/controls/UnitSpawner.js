import Unit from '../entities/Unit.js';
import ButtonControl from './ButtonControl.js';

/**
 * A temporary, developer control for spawning units in the game.
 * Hold 1, 2, 3 etc and left click to spawn units.
 * This is not intended for production use and should be removed in the final version.
 */
export default class UnitSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams – your scene.teams dictionary
   * @param {import('phaser').Physics.Arcade.Group} group – the physics group to add to
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

    this.control = new ButtonControl(
      scene,
      this.keyToTeam,
      (pointer, teamKey) => this.trySpawn(pointer, teamKey)
    );

    scene.events.once('shutdown', this.destroy, this);
    scene.events.once('destroy', this.destroy, this);
  }

  /**
   * Called on every pointerdown
   * @param {import('phaser').Input.Pointer} pointer
   * @param {string} teamKey
   */
  trySpawn(pointer, teamKey) {
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

  destroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }
}
