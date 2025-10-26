import RallyPoint from '../entities/landmarks/RallyPoint.js';

export default class RallyPointSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams your scene.teams dictionary
   */
  constructor(scene, teams) {
    this.scene = scene;
    this.teams = teams;
  }

  /**
   * Spawn a rally point for the supplied team at the pointer's world location.
   * @param {import('phaser').Input.Pointer} pointer
   * @param {string} teamKey
   */
  spawn(pointer, teamKey) {
    if (!teamKey) return;
    const team = this.teams[teamKey];
    if (!team) return;

    const x = pointer.worldX;
    const y = pointer.worldY;

    const rallyPoint = new RallyPoint(this.scene, x, y, team.name);
    rallyPoint.place(x, y, this.scene);
    team.rallyPoints.push(rallyPoint);
  }
}

