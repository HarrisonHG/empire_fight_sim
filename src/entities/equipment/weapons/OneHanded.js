import Phaser from "phaser";
import Unit from "../../Unit.js";

/**
 * A one-handed weapon that can be used by units.
 * @extends Phaser.GameObjects.Sprite
 */
export default class OneHanded extends Phaser.GameObjects.Sprite {

    /**
     * Creates a new one-handed weapon.
     * @param {Phaser.Scene} scene - The scene to which the weapon belongs.
     * @param {number} x - The x coordinate of the weapon's position.
     * @param {number} y - The y coordinate of the weapon's position.
     * @param {string} texture - The texture key for the weapon's sprite.
     * @param {Unit} ownerUnit - The unit that owns (or is currently wielding) this weapon. 
     */
    constructor(scene, x, y, texture, ownerUnit) {
        super(scene, x, y, texture);
        this.setOrigin(0.1, 0.5);
        this.scene.add.existing(this);
        this.ownerUnit = ownerUnit; // The unit that owns this weapon
        this.setDepth(100); // Ensure the weapon is drawn above other entities
        this.setScale(0.5); 

        this.REACH = ownerUnit.width * 0.6; // Scale the reach from the unit's width
        this.ATTACK_TIME = 200; // Time in milliseconds to complete an attack
        this.attacking = false; // Is the weapon currently attacking?
    }

    /**
     * Place the weapon in the world.
     * @param {number} x - The x coordinate to place the weapon.
     * @param {number} y - The y coordinate to place the weapon.
     */
    place(x, y) {
        this.setPosition(x, y);
    }

    /**
     * Thrust the weapon in a specific direction.
     * @param {Phaser.Math.Vector2} direction - The direction to thrust the weapon.
     */
    thrust() {
        this.attacking = true;
        this.scene.time.delayedCall(this.ATTACK_TIME, () => {
            this.attacking = false; // Reset attacking state after the attack duration
        })
    }

    /**
     * Update the weapon's position to follow its owner unit.
     */
    update() {

        if (this.ownerUnit) {     

            if (!this.ownerUnit.isAlive) {
                this.setVisible(false);
                this.attacking = false; // Reset attacking state
            }
            else if (this.attacking) {
                this.setVisible(true);
                const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
                this.x = this.ownerUnit.x + Math.cos(angle) * this.REACH * 0.25;
                this.y = this.ownerUnit.y + Math.sin(angle) * this.REACH * 0.25;
                this.rotation = angle;
                this.setRotation(this.rotation);
            }
            else {
                this.setVisible(true);
                // Offset so the weapon is held in the unit's right hand
                const handOffset = this.ownerUnit.width * 0.12; // adjust as needed for hand position
                const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
                // Offset to the right side (perpendicular to facing direction)
                const sideAngle = angle + Math.PI / 2;
                this.x = this.ownerUnit.x + Math.cos(sideAngle) * handOffset;
                this.y = this.ownerUnit.y + Math.sin(sideAngle) * handOffset;
                this.rotation = angle-0.5;
                this.setRotation(this.rotation);
            }    
        }
    }
}