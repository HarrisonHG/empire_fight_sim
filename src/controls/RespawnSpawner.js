import RespawnPoint from '../entities/landmarks/RespawnPoint.js';

export default class RespawnSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams your scene.teams dictionary
   */
  constructor(scene, teams) {
    this.scene = scene;
    this.teams = teams;
  }

  /**
   * Spawn a respawn point for the supplied team at the pointer's world location.
   * @param {import('phaser').Input.Pointer} pointer
   * @param {string} teamKey
   */
  spawn(pointer, teamKey) {
    if (!teamKey) return;
    const team = this.teams[teamKey];
    if (!team) return;

    const x = pointer.worldX;
    const y = pointer.worldY;

    const respawnPoint = new RespawnPoint(this.scene, x, y, team.name);
    respawnPoint.place(x, y, this.scene);
    team.respawnPoints.push(respawnPoint);
  }
}

