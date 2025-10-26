import Unit from '../entities/Unit.js';

/**
 * Responsible for instantiating units with a configured loadout.
 */
export default class UnitSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams your scene.teams dictionary
   * @param {import('phaser').Physics.Arcade.Group} group the physics group to add to
   */
  constructor(scene, teams, group) {
    this.scene = scene;
    this.teams = teams;
    this.unitGroup = group;
  }

  /**
   * Spawn a unit for the given team at the pointer's world position.
   * @param {import('phaser').Input.Pointer} pointer
   * @param {string} teamKey
   * @param {{ armour: string, weapon: string, helmet: boolean }} loadout
   */
  spawn(pointer, teamKey, loadout) {
    if (!teamKey) return;

    const team = this.teams[teamKey];
    if (!team) return;

    const size = 40;
    const speed = 150;
    const colour = team.colour;
    const x = pointer.worldX;
    const y = pointer.worldY;

    const unit = new Unit(this.scene, x, y, size, speed, colour, loadout);
    team.addUnit(unit);
    this.unitGroup.add(unit);
  }
}

