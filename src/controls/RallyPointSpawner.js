import RallyPoint from "../entities/landmarks/RallyPoint.js";
import ButtonControl from "./ButtonControl.js";

/**
 * A temporary, developer control for spawning respawn points in the game.
 * Hold numpad 1, 2, 3 etc and left click to spawn respawn points.
 * This is not intended for production use and should be removed in the final version.
 */
export default class RallyPointSpawner {
  /**
   * @param {import('phaser').Scene} scene
   * @param {Record<string, import('../entities/Team.js').Team>} teams – your scene.teams dictionary
   */
  constructor(scene, teams, onSelectionChange = null) {
    this.scene = scene;
    this.teams = teams;

    // map Phaser key names → your team keys in scene.teams
    this.keyToTeam = {
      NUMPAD_FOUR:   'playerDawn',
      NUMPAD_FIVE:   'playerNevvar',
      NUMPAD_SIX:   'monsterJotun',
    };

    this.control = new ButtonControl(
      scene,
      this.keyToTeam,
      (pointer, teamKey) => this.trySpawn(pointer, teamKey),
      'pointerdown',
      { mode: 'sticky', onSelectionChange }
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

    const rallyPoint = new RallyPoint(this.scene, x, y, team.name);
    rallyPoint.place(x, y, this.scene);
    team.rallyPoints.push(rallyPoint);
  }
  
  clearSelection() {
    if (this.control && typeof this.control.clearSelection === 'function') {
      this.control.clearSelection();
    }
  }
  
  destroy() {
    if (this.control) {
      this.control.destroy();
      this.control = null;
    }
  }
}
