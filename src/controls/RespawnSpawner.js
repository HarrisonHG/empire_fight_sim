import RespawnPoint from "../entities/landmarks/RespawnPoint.js";
import ButtonControl from "./ButtonControl.js";

/**
 * A temporary, developer control for spawning respawn points in the game.
 * Hold numpad 1, 2, 3 etc and left click to spawn respawn points.
 * This is not intended for production use and should be removed in the final version.
 */
export default class RespawnSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams – your scene.teams dictionary
   */
  constructor(scene, teams) {
    this.scene = scene;
    this.teams = teams;

    // map Phaser key names → your team keys in scene.teams
    this.keyToTeam = {
      NUMPAD_ONE:   'playerDawn',
      NUMPAD_TWO:   'playerNevvar',
      NUMPAD_THREE: 'monsterJotun',
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
    if (!teamKey) return;

    // spawn parameters
    const team = this.teams[teamKey];
    
    // worldX/worldY give us canvas→world coords
    const x = pointer.worldX;
    const y = pointer.worldY;

    // 1) instantiate respawn point
    const respawnPoint = new RespawnPoint(this.scene, x, y, team.name);
    respawnPoint.place(x, y, this.scene);
    team.respawnPoints.push(respawnPoint);
  }
  
  destroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }
}
