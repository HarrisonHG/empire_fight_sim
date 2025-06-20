import Phaser from 'phaser';

/**
 * Represents one "person" on the field.
 */
export default class Unit extends Phaser.Physics.Arcade.Sprite {
  /**
   * Create a new Unit.
   * @param {Phaser.Scene} scene - The scene to which this unit belongs.
   * @param {number} x - The x-coordinate of the unit.
   * @param {number} y - The y-coordinate of the unit.
   * @param {number} size - The diameter of the unit.
   * @param {number} [speed] - The movement speed of the unit in pixels per second.
   * @param {string} [colour] - Hex colour of the unit, e.g. '#FF0000' for red.
   */
  constructor(scene, x, y, size, speed, colour) {
    super(scene, x, y, 'unit');

    // Init visuals
    this.scene = scene;
    this.setOrigin(0.5, 0.5); // Center the sprite
    this.setDisplaySize(size, size);
    this.colour = colour || '#888888'; // Default grey
    this.setColour(this.colour);

    this.moveSpeed = speed || 200; // Default speed in pixels per second
    this.tryingToMove = false;
    this.acceleration = 800;

    // Interaction
    scene.physics.add.existing(this);
    scene.add.existing(this);

    this.body.setCircle(size*1.6);
    //this.body.setOffset((size/2)+5, (size/2)+5); // Center the circle
    this.body.setBounce(1);
    this.body.setCollideWorldBounds(true);
  }

  /**
   * Set the colour of the unit.
   * @param {string} colour - Hex colour code, e.g. '#FF0000'.
   */
  setColour(colour) {
    this.colour = colour;
    this.setTint(Phaser.Display.Color.HexStringToColor(colour).color);
  }

  moveTo(x, y) {
    // Calculate speed
    let currentSpeed = this.moveSpeed // Multipliers n shit to come.
    this.turnToFace(x, y)
    const angle = this.rotation; // same as what faceTowards set
    this.body.setAcceleration(
      Math.cos(angle) * this.acceleration,
      Math.sin(angle) * this.acceleration
    );
    this.body.setMaxVelocity(currentSpeed, currentSpeed)

    const v = this.body.velocity;
    const speed = v.length();
    if (speed > currentSpeed) {
      const ratio = currentSpeed / speed;
      this.body.setVelocity(v.x * ratio, v.y * ratio);
    }

    this.tryingToMove = true
  }

  /**
   * Rotate the sprite to face a world coordinate.
   * @param {number} targetX
   * @param {number} targetY
   */
  turnToFace(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(angle);
  }

  /**
   * Update the unit's state.
   * @param {number} time - The current time in milliseconds.
   * @param {number} delta - The time since the last update in milliseconds.
   */
  update(time, delta) {
    const pointer = this.scene.input.activePointer;

    // if pointer is down *and* over the world
    if (pointer.isDown && pointer.worldX && pointer.worldY) {
      this.moveTo(pointer.worldX, pointer.worldY)
    }
    else {
      // Don't want to move? slow to a halt
      this.body.setAcceleration(0, 0); // Stop accelerating
      this.body.velocity.scale(0.8); // Drag not working :( here's a manual way to stop
      if (this.body.speed < 20) {
        this.body.setVelocity(0, 0);
      }
      this.tryingToMove = false;
    }

    // No matter the desired movement, we need to check bounds
    // to ensure the unit stays within the world bounds.
    const halfSize = this.displayWidth / 2;
    // Check X bounds
    if (
      this.x + halfSize > this.scene.physics.world.bounds.right ||
      this.x - halfSize < this.scene.physics.world.bounds.left
    ) {
      this.x = Phaser.Math.Clamp(
      this.x,
      this.scene.physics.world.bounds.left + halfSize,
      this.scene.physics.world.bounds.right - halfSize
      );
      this.body.setVelocityX(0);
    }

    // Check Y bounds
    if (
      this.y + halfSize > this.scene.physics.world.bounds.bottom ||
      this.y - halfSize < this.scene.physics.world.bounds.top
    ) {
      this.y = Phaser.Math.Clamp(
      this.y,
      this.scene.physics.world.bounds.top + halfSize,
      this.scene.physics.world.bounds.bottom - halfSize
      );
      this.body.setVelocityY(0);
    }
  }
}