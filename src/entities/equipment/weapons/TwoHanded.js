import Phaser from "phaser";
import Unit from "../../Unit.js";

/**
 * A Big weapon that can be used by units.
 * @extends Phaser.GameObjects.Sprite
 */
export default class TwoHanded extends Phaser.GameObjects.Sprite {

    /**
     * Creates a new two-handed weapon.
     * @param {Phaser.Scene} scene - The scene to which the weapon belongs.
     * @param {number} x - The x coordinate of the weapon's position.
     * @param {number} y - The y coordinate of the weapon's position.
     * @param {Unit} ownerUnit - The unit that owns (or is currently wielding) this weapon. 
     */
    constructor(scene, x, y, ownerUnit) {
        super(scene, x, y, 'bigAxe');
        this.setOrigin(0.3, 0.5);
        this.scene.add.existing(this);
        this.ownerUnit = ownerUnit; // The unit that owns this weapon
        this.setDepth(100); // Ensure the weapon is drawn above other entities
        this.setScale(0.65);

        this.REACH = ownerUnit.width * 0.8; // Scale the reach from the unit's width
        this.ATTACK_TIME_START = 160; // First part of the attack animation. Ends in contact.
        this.ATTACK_TIME_END = 240; // Second part of the attack animation
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
        // Prevent overlapping thrusts
        // Yes, possible race condition here, but this is a simple game and the 
        // animation is for pretty value only.
        if (this.attacking) return;
        this.attacking = true; 

        const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
        const thrustDistance = this.REACH * 0.5;

        // Calculate target position for thrust
        const targetX = this.ownerUnit.x + Math.cos(angle) * thrustDistance;
        const targetY = this.ownerUnit.y + Math.sin(angle) * thrustDistance;

        // Tween forward
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            rotation: angle,
            duration: this.ATTACK_TIME_START,
            ease: 'Back.easeIn',
            onComplete: () => {
            // Tween back
            this.scene.tweens.add({
                targets: this,
                x: this.ownerUnit.x + Math.cos(angle) * this.REACH * 0.25,
                y: this.ownerUnit.y + Math.sin(angle) * this.REACH * 0.25,
                rotation: angle + 1.4,
                duration: this.ATTACK_TIME_END,
                ease: 'Expo.easeInOut',
                onComplete: () => {
                this.attacking = false;
                }
            });
            }
        });
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
            else {
                this.setVisible(true);
                // Offset so the weapon is held in the unit's right hand
                const handOffset = this.ownerUnit.width * 0.171; // adjust as needed for hand position
                const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
                // Offset to the right side (perpendicular to facing direction)
                const sideAngle = angle + Math.PI * 1.91;
                this.x = this.ownerUnit.x + Math.cos(sideAngle) * handOffset;
                this.y = this.ownerUnit.y + Math.sin(sideAngle) * handOffset;
                this.rotation = angle + 1.4;
                this.setRotation(this.rotation);
            }     
        }
    }
}