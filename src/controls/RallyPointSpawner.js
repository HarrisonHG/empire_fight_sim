import Phaser from "phaser";
import { Team } from "../entities/Team.js";
import RallyPoint from "../entities/landmarks/RallyPoint.js";

/**
 * A temporary, developer control for spawning respawn points in the game.
 * Hold numpad 1, 2, 3 etc and left click to spawn respawn points.
 * This is not intended for production use and should be removed in the final version.
 */
export default class RallyPointSpawner {
  /**
   * @param {Phaser.Scene} scene
   * @param {Object.<string,Team>} teams      – your scene.teams dictionary
   */
  constructor(scene, teams) {
    this.scene = scene;
    this.teams = teams;

    // map Phaser key names → your team keys in scene.teams
    this.keyToTeam = {
      NUMPAD_FOUR:   'playerDawn',
      NUMPAD_FIVE:   'playerNevvar',
      NUMPAD_SIX:   'monsterJotun',
    };

    // install keyboard listeners for Numpad1/2/3
    this.keys = scene.input.keyboard.addKeys('NUMPAD_FOUR,NUMPAD_FIVE,NUMPAD_SIX');
    scene.input.on('pointerdown', this.trySpawn, this);
  }

  /**
   * Called on every pointerdown
   * @param {Phaser.Input.Pointer} pointer
   */
  trySpawn(pointer) {
    // figure out which key is currently down
    const { NUMPAD_FOUR, NUMPAD_FIVE, NUMPAD_SIX } = this.keys;
    let teamKey = null;
    if (NUMPAD_FOUR.isDown)   teamKey = this.keyToTeam.NUMPAD_FOUR;
    if (NUMPAD_FIVE.isDown)   teamKey = this.keyToTeam.NUMPAD_FIVE;
    if (NUMPAD_SIX.isDown) teamKey = this.keyToTeam.NUMPAD_SIX;
    if (!teamKey) return;

    // spawn parameters
    const team = this.teams[teamKey];
    
    // worldX/worldY give us canvas→world coords
    const x = pointer.worldX;
    const y = pointer.worldY;

    const rallyPoint = new RallyPoint(this.scene, x, y, team.name);
    rallyPoint.place(x, y, this.scene);
    team.rallyPoints.push(rallyPoint);
  }
}