import Phaser from "phaser";
import Unit from "../Unit";
import { Call, CALLS } from "../../systems/calls";

/**
 * Represents armour that units can wear.
 * Generally, armour provides bonus to HP and resists some CALLs.
 */
export default class Armour extends Phaser.GameObjects.Sprite {
    /**
     * Creates an instance of Armour.
     * @param {Phaser.Scene} scene - The scene to which this armour belongs.
     * @param {number} HP - The health points provided by the armour.
     * @param {Call[]} resistCalls - The calls that this armour resists.
     * @param {string} texture - The texture key for the armour sprite.
     * @param {Unit} ownerUnit - The unit that owns this armour.
     */
    constructor(scene, HP, resistCalls, texture, ownerUnit) {
        super(scene, ownerUnit.x, ownerUnit.y, texture);
        this.scene = scene;
        this.HP = HP; // Health points provided by the armour
        this.resistCalls = resistCalls; // Calls that this armour resists
        // Validate resistCalls to ensure they are Call instances
        if (!Array.isArray(resistCalls) || !resistCalls.every(call => call instanceof Call)) {
            throw new Error("resistCalls must be an array of Call instances.");
        }

        // Set the display size of the armour sprite
        this.setDisplaySize(ownerUnit.size, ownerUnit.size);
        this.setOrigin(0.5, 0.5);
        this.setDepth(ownerUnit.depth + 1);
        //this.setScale(ownerUnit.size);
        this.setScale(0.3);
        this.setPosition(ownerUnit.x, ownerUnit.y);2
        this.scene.add.existing(this);
        this.ownerUnit = ownerUnit; 
    }

    /**
     * Check if the provided call is resisted by this armour.
     * @param {Call} call - The call to check against the armour's resistances
     * @return {boolean} - True if the call is resisted, false otherwise.
     */
    resists(call) {
        return this.resistCalls.some(resistedCall => resistedCall.name === call.name);
    }

    /**
     * Updates the armour's position to match the owner's position.
     */
    update(time, delta) {
        this.setPosition(this.ownerUnit.x, this.ownerUnit.y);
        this.setRotation(this.ownerUnit.rotation);
    }
}