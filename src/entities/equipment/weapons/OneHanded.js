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
     * @param {Unit} ownerUnit - The unit that owns (or is currently wielding) this weapon. 
     */
    constructor(scene, x, y, ownerUnit) {
        super(scene, x, y, 'sword');
        this.setOrigin(0.1, 0.5);
        this.scene.add.existing(this);
        this.ownerUnit = ownerUnit; // The unit that owns this weapon
        this.setDepth(100); // Ensure the weapon is drawn above other entities
        this.setScale(0.5); 

        this.REACH = ownerUnit.width * 0.6; // Scale the reach from the unit's width
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
        if (this.attacking) return; // Prevent overlapping thrusts
        this.attacking = true;

        // Get current position and angle from update()
        const startX = this.x;
        const startY = this.y;
        const baseAngle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;

        // Add a 15 degree (PI/12 radians) counter-clockwise turn for the thrust
        const thrustAngle = baseAngle - Math.PI / 12;

        const thrustDistance = this.REACH * 0.5;
        const targetX = this.ownerUnit.x + Math.cos(thrustAngle + Math.PI / 2) * 
            (this.ownerUnit.width * 0.14) + Math.cos(thrustAngle) * thrustDistance;
        const targetY = this.ownerUnit.y + Math.sin(thrustAngle + Math.PI / 2) * 
            (this.ownerUnit.width * 0.14) + Math.sin(thrustAngle) * thrustDistance;

        // Tween forward with rotation
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            rotation: thrustAngle - 0.1,
            duration: this.ATTACK_TIME_START,
            ease: 'Back.easeIn',
            onComplete: () => {
            // Tween back to original position and rotation
            this.scene.tweens.add({
                targets: this,
                x: startX,
                y: startY,
                rotation: baseAngle - 0.1,
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
                const handOffset = this.ownerUnit.width * 0.14; // adjust as needed for hand position
                const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
                // Offset to the right side (perpendicular to facing direction)
                const sideAngle = angle + Math.PI / 2;
                this.x = this.ownerUnit.x + Math.cos(sideAngle) * handOffset;
                this.y = this.ownerUnit.y + Math.sin(sideAngle) * handOffset;
                this.rotation = angle-0.1;
                this.setRotation(this.rotation);
            }    
        }
    }
}