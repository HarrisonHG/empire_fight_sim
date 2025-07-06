import Phaser from "phaser";
import Unit from "../../Unit.js";

/**
 * A shield that can be used by units to block attacks.
 * @extends Phaser.GameObjects.Sprite
 */
export default class Shield extends Phaser.GameObjects.Sprite {

    /**
     * Creates a new shield.
     * @param {Phaser.Scene} scene - The scene to which the shield belongs.
     * @param {number} x - The x coordinate of the shield's position.
     * @param {number} y - The y coordinate of the shield's position.
     * @param {Unit} ownerUnit - The unit that owns (or is currently wielding) this shield. 
     */
    constructor(scene, x, y, ownerUnit) {
        super(scene, x, y, 'shield');
        this.setOrigin(0.5, 0.5);
        this.scene.add.existing(this);
        this.ownerUnit = ownerUnit; // The unit that owns this shield
        this.setDepth(100); // Ensure the shield is drawn above other entities
        this.setScale(0.5);

        this.originalColour = '0xFFFFFF'; // Default color of the shield
        this.setTint(this.originalColour); // Set the initial color of the shield
        this.activeLevel = 1.0; // Used to
        this.recoveryRate = 0.3; // Percentage of active level to recover per second
    }

    /**
     * Place the shield in the world.
     * @param {number} x - The x coordinate to place the shield.
     * @param {number} y - The y coordinate to place the shield.
     */
    place(x, y) {
        this.setPosition(x, y);
    }

    /**
     * Take a hit, showing fx and reducing the shield's active level.
     * @param {number} damage - The amount of damage to apply to the shield.
     * @param {Phaser.Math.Vector2} direction - The direction from which the hit came.
     * @param {boolean} [showFx=true] - Whether to show hit effects.
     */
    parry(damage, direction, showFx = true) {

        if (damage < 0 || damage > 1) {
            throw new Error("Damage must be between 0 and 1.");
        }

        if (showFx) {
            // Show hit effects (e.g., flash the shield)
            this.setTint(0xFF0000); // Flash red on hit
            this.scene.time.delayedCall(100, () => {
                this.setTint(this.originalColour); // Reset color after a short delay
            });
        }

        // Reduce the active level of the shield
        this.activeLevel -= damage;
        if (this.activeLevel <= 0) {
            this.activeLevel = 0;
        }

        const forwardDistance = 10;
        const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
        const dx = Math.cos(angle) * forwardDistance;
        const dy = Math.sin(angle) * forwardDistance;

        this.scene.tweens.add({
            targets: this,
            x: this.x + dx,
            y: this.y + dy,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    /**
     * Update the shield's position to follow its owner unit.
     * @param {number} time - Current time in milliseconds.
     * @param {number} delta - Time since the last update in milliseconds.
     */
    update(time, delta) {
        if (this.ownerUnit) {
            if (!this.ownerUnit.isAlive) {
                this.setVisible(false);
            } else {
                this.setVisible(true);
                const angle = this.ownerUnit.getRotation ? this.ownerUnit.getRotation() : this.ownerUnit.rotation;
                // Offset so the shield is held in front of the unit
                this.x = this.ownerUnit.x + Math.cos(angle) * 25;
                this.y = this.ownerUnit.y + Math.sin(angle) * 25;
                this.rotation = angle;
            }

            if (this.activeLevel < 1.0) {
                this.activeLevel += this.recoveryRate * (delta / 1000);
                if (this.activeLevel > 1.0) {
                    this.activeLevel = 1.0;
                }
            }

            // Update the shield's tint based on the active level
            const tintColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.HexStringToColor(this.originalColour),
                Phaser.Display.Color.HexStringToColor('0x444444'), // Red color for low active level
                1.0,
                this.activeLevel
            );
        }
    }
}