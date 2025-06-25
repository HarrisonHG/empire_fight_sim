import Phaser from "phaser";
import RespawnPoint from "../entities/landmarks/RespawnPoint.js";
import { Team } from "../entities/Team.js";

/**
 * A temporary, developer control for spawning respawn points in the game.
 * Hold numpad 1, 2, 3 etc and left click to spawn respawn points.
 * This is not intended for production use and should be removed in the final version.
 */
export default class RespawnSpawner {
  /**
   * @param {Phaser.Scene} scene
   * @param {Object.<string,Team>} teams      – your scene.teams dictionary
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

    // install keyboard listeners for Numpad1/2/3
    this.keys = scene.input.keyboard.addKeys('NUMPAD_ONE,NUMPAD_TWO,NUMPAD_THREE');
    scene.input.on('pointerdown', this.trySpawn, this);
  }

  /**
   * Called on every pointerdown
   * @param {Phaser.Input.Pointer} pointer
   */
  trySpawn(pointer) {
    // figure out which key is currently down
    const { NUMPAD_ONE, NUMPAD_TWO, NUMPAD_THREE } = this.keys;
    let teamKey = null;
    if (NUMPAD_ONE.isDown)   teamKey = this.keyToTeam.NUMPAD_ONE;
    if (NUMPAD_TWO.isDown)   teamKey = this.keyToTeam.NUMPAD_TWO;
    if (NUMPAD_THREE.isDown) teamKey = this.keyToTeam.NUMPAD_THREE;
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
}