import Phaser from 'phaser';

import * as Utility from '../utility.js';

/**
 * Represents one "person" on the field.
 */
export default class Unit extends Phaser.GameObjects.Sprite {
  /**
   * Create a new Unit.
   * @param {Phaser.Scene} scene - The scene to which this unit belongs.
   * @param {number} x - The x-coordinate of the unit.
   * @param {number} y - The y-coordinate of the unit.
   * @param {number} height - The height of the unit.
   * @param {number} width - The width of the unit.
   * @param {string} [colour] - Hex colour of the unit, e.g. '#FF0000' for red.
   */
  constructor(scene, x, y, height, width, colour) {

    super(scene, x, y, 'unit');

    this.scene = scene;
    this.setOrigin(0.5, 0.5); // Center the sprite
    this.setDisplaySize(height, width); // Set a default size for the unit
    this.colour = colour || '#FFFFFF'; // Default white
    this.setColour(this.colour); // Set initial colour
    Utility.loadOnce('unit', 'png', scene, this);

    scene.add.existing(this);
  }

  /**
   * Set the colour of the unit.
   * @param {string} colour - Hex colour code, e.g. '#FF0000'.
   */
  setColour(colour) {
    this.colour = colour;
    this.setTint(Phaser.Display.Color.HexStringToColor(colour).color);
  }
}