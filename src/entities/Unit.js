import Phaser from 'phaser';
import { Motion, MOTIONS, Action, ACTIONS, Stance, STANCES, CONDITIONS 
  } from '../systems/unitDecisionMaking.js';
import { STATUS, LIMB_HEALTH } from '../systems/status.js';
import { Team, TEAM_RELATIONSHIP } from './Team.js';
import InteractionPayload from '../systems/interaction/interactionPayload.js';
import { InteractionResult } from '../systems/interaction/interactionResult.js';
import { InteractionSystem } from '../systems/interaction/interactionSystem.js';

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

    // Movement
    this.moveSpeed = speed || 200; // Default speed in pixels per second
    this.tryingToMove = false;
    this.acceleration = 800;
    this.SLOW_MOVEMENT_DISTANCE = 50; // Distance at which to start slowing down
    this.CLOSE_ENOUGH = 10 // How close do we need to be to stop moving?

    // Decision making
    this.currentStance = STANCES.RELAXED; // Default stance
    this.currentAction = null;
    this.completedActions = []; // Array to hold completed actions in the current stance
    this.currentMotion = null; 
    this.completedMotions = []; // Array to hold completed motions in the current action
    this.targetUnit = null; // The unit we are currently targeting, if any
    this.MEMORY_SIZE = 20; // Backup value for how many actions and motions we remember
    this.rethinkTimer = 0; // Timer to control how often we rethink our actions in milliseconds.
    
    // Statistics and statuses
    this.range = size * 1.5; // How far can we reach with our attacks
    this.limbHealth = {
      leftArm: LIMB_HEALTH.OK,
      rightArm: LIMB_HEALTH.OK,
      leftLeg: LIMB_HEALTH.OK,
      rightLeg: LIMB_HEALTH.OK
    }
    this.statuses = []; // Array to hold statuses like 'paralysed', 'entangled', etc.

    // Gameplay properties
    this.team = null;
    this.id = Phaser.Utils.String.UUID(); // Unique identifier for the unit

    // Physics
    scene.physics.add.existing(this);
    scene.add.existing(this);
    this.body.setCircle(size*1.6);
    //this.body.setOffset((size/2)+5, (size/2)+5); // Center the circle
    this.body.setBounce(1);
    this.body.setCollideWorldBounds(true);
  }

  /**
   * Update the unit's state.
   * @param {number} time - The current time in milliseconds.
   * @param {number} delta - The time since the last update in milliseconds.
   */
  update(time, delta) {
    const pointer = this.scene.input.activePointer;

    // // if pointer is down *and* over the world
    // if (pointer.isDown && pointer.worldX && pointer.worldY) {
    //   this.moveTo(pointer.worldX, pointer.worldY)
    // }
    // else {
    //   this.standStill();
    // }

    this.rethinkTimer -= delta;

    if (this.rethinkTimer <= 0 || this.currentMotion === null) {
      this.chooseNextMotion();
    }
    this.currentMotion.execute(this, time, delta);

    if (this.currentMotion && typeof this.currentMotion.execute === 'function') {
      this.currentMotion.execute(this, time, delta);
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

  // --- ACCESSORS ---

  /**
   * Set the colour of the unit, by changing its tint.
   * @param {string} colour - Hex colour code, e.g. '#FF0000'.
   */
  setColour(colour) {
    this.colour = colour;
    this.setTint(Phaser.Display.Color.HexStringToColor(colour).color);
  }

  /**
   * Set the team of the unit.
   * This unit will also take on the team's colour.
   * @param {Team} team - The team to which this unit belongs.
   */
  setTeam(team) {
    if (!team || !team.name) {
      throw new Error('Invalid team provided. Must be an instance of Team.');
    }
    this.team = team;
    this.setColour(team.colour);
  }

  // --- THINKING ---

  /**
   * Choose the closest unit of the array
   * @param {Array<Unit>} units - Array of units to choose from.
   * @returns {Unit|null} The closest unit, or null if no units are provided.
   */
  chooseClosestUnit(units) {
    if (!Array.isArray(units) || units.length === 0) {
      console.warn('No units provided to choose from.');
      return null;
    }

    let closestUnit = null;
    let closestDistance = Infinity;

    for (const unit of units) {
      if (!(unit instanceof Unit)) {
        console.warn('Invalid unit in array, skipping.');
        continue;
      }
      const distance = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestUnit = unit;
      }
    }

    return closestUnit;
  }

  /**
   * Choose a stance for the unit to adopt.
   * This should be considered a luxury position for the unit. Most of the time,
   * unit should be assigned a stance by other units, or commanders etc.
   * @see STANCES for implemented stances.
   */
  chooseStance() {
    
    // If there are enemy units in , set stance to CHARGE
    const enemyUnits = this.scene.unitGroup.getChildren().filter(targetUnit => 
      this.team.getRelationship(targetUnit.team) == TEAM_RELATIONSHIP.ENEMY &&
      Phaser.Math.Distance.Between(this.x, this.y, targetUnit.x, targetUnit.y) < 1000 // debug value
    );
    if (enemyUnits.length > 0) {
      this.setStance(STANCES.CHARGE);
      this.targetUnit = this.chooseClosestUnit(enemyUnits);
      if (this.targetUnit) {
        console.log(`Unit ${this.id} targeting enemy unit: ${this.targetUnit.id}`);
      } else {
        console.warn(`Unit ${this.id} could not find a target unit.`);
      }
    }

    // Else, relax man, you've earned it.
    this.setStance(STANCES.RELAXED);
  }

  /**
   * Set the unit's current stance.
   * @param {Stance} stance - The stance to set.
   * @see STANCES for implemented stances.
   */
  setStance(stance) {
    if (!(stance instanceof Stance)) {
      throw new Error('Invalid stance provided. Must be an instance of Stance.');
    }
    this.completedActions = []; // Reset completed actions for the new stance
    this.completedMotions = []; // Reset completed motions for the new action
    this.currentStance = stance;
    console.log(`Unit ${this.id} set to stance: ${stance.name}`);
  }

  /**
   * Check if a condition is met for the unit.
   * @param {string} condition - The condition to check.
   * @param {any} [data] - Optional value to check against the condition.
   * @returns {boolean} True if the condition is met, false otherwise.
   */
  checkCondition(condition, data) {
    const handler = CONDITION_HANDLERS[condition];
    if (!handler) {
      console.warn(`Condition "${condition}" not implemented.`);
      return false;
    }
    return handler(this, data);
  }

  /**
   * Check if the conditions for an action are met.
   * @param {Action} action - The action to check conditions for.
   * @note All data for these conditions must be available from this unit.
   */
  checkActionConditions(action) {

    if (this.currentStance.enforcePrimaryActionOrder) {
      const primaryActions = this.currentStance.primaryActions;
      const actionIndex = primaryActions.indexOf(action);
      if (actionIndex > 0) {
        // Check if all previous actions exist in completedActions in correct order
        for (let i = 0; i < actionIndex; i++) {
          if (this.completedActions[i] !== primaryActions[i]) {
            return false;
          }
        }
      }
    } 

    // Prevent repeating the same action more times than the primaryActions reuiqre.
    const completedCount = this.completedActions.filter(a => a === action).length;
    const primaryCount = this.currentStance.primaryActions.filter(a => a === action).length;
    if (completedCount >= primaryCount) {
      return false;
    }

    for (const condition of action.conditions) {
      // Pass data[condition] if it exists, else undefined
      if (!this.checkCondition(condition)) {
        console.log(`Unit ${this.id} cannot perform action: ${action.name} due to condition: ${condition}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Choose the next action to perform based on the current stance.
   * @returns {Action} The next action to perform.
   */
  chooseNextAction() {

    this.completedMotions = [];
    if (this.currentAction)
      this.completedActions.push(this.currentAction);

    // Have we fulfulled the current stance?
    if (this.completedActions.length >= this.currentStance.primaryActions.length) {
      console.log(`Unit ${this.id} has completed its current stance: ${this.currentStance.name}`);
      this.chooseStance()
      return this.chooseNextAction();
    }

    // Loop through primary actions of the current stance and act on the first one
    // Who's conditions are met and not already completed.
    if (!this.currentStance || !this.currentStance.primaryActions.length) {
      console.warn(`Unit ${this.id} has no primary actions in current stance: ${this.currentStance.name}`);
      this.currentAction = ACTIONS.STAND; // Default to standing still
      return this.currentAction;
    }

    // Check primary actions first
    for (const action of this.currentStance.primaryActions) {
      if (this.checkActionConditions(action)) {
        this.currentAction = action;
        console.log(`Unit ${this.id} chose primary action: ${action.name}`);
        return action;
      }
    }

    // If no primary action is available, check supporting actions
    for (const action of this.currentStance.supportingActions) {
      if (this.checkActionConditions(action)) {
        this.currentAction = action;
        console.log(`Unit ${this.id} chose supporting action: ${action.name}`);
        return action;
      }
    }

    // If no actions are available, default to standing still
    this.currentAction = ACTIONS.STAND;
    console.log(`Unit ${this.id} has no valid actions, defaulting to stand.`);
  }

  /**
   * Choose the next motion to perform based on the current action and stance.
   * @returns {Motion} The next motion to perform.
   */
  chooseNextMotion() {

    if (this.currentMotion) {
      this.completedMotions.push(this.currentMotion);
    }
    
    // Go through motions in currentAction, pick the first not in completedMotions
    if (this.currentAction)
      for (let i = 0; i < this.currentAction.motions.length; i++) {
        if (!this.completedMotions[i]) {
          this.currentMotion = this.currentAction.motions[i];
          this.rethinkTimer = this.currentMotion.duration;
          return this.currentMotion;
        }
      }

    // If all motions are completed, pick a new action and try again
    this.chooseNextAction();
    return this.chooseNextMotion();
  }

  /**
   * Check whether the targetUnit is within range.
   * @param {Unit} [targetUnit] - The unit to check against. Defaults to the current target unit.
   * @returns {boolean} True if the target unit is within range, false otherwise.
   */
  isTargetInRange(targetUnit = this.targetUnit) {
    if (!targetUnit || !(targetUnit instanceof Unit)) {
      console.warn('Invalid target unit provided.');
      return false;
    }
    
    // Calculate distance to target unit
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetUnit.x, targetUnit.y);
    return distance <= this.range;
  }

  // --- MOVEMENT ---

  /**
   * Stop the unit from moving by slowing to a halt
   * This is called when the unit is close enough to its target or when it should stop moving.
   */
  standStill() {
    this.body.setAcceleration(0, 0); // Stop accelerating
    this.body.velocity.scale(0.8); // Drag not working :( here's a manual way to stop
    if (this.body.speed < this.CLOSE_ENOUGH) {
      this.body.setVelocity(0, 0);
    }
    this.tryingToMove = false;
  }

  /**
   * Move the unit towards a target coordinate.
   * @param {number} x - The target x-coordinate.
   * @param {number} y - The target y-coordinate.
   */
  moveTo(x, y) {
    
    // Calculate distance to target
    const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (distance < this.CLOSE_ENOUGH) {
      this.standStill();
      return; // We're close enough, no need to move
    }

    // Calculate max speed achievable
    let currentSpeed = this.moveSpeed; // Multipliers n shit to come.

    // We'll face the way we wish to move to.
    this.turnToFace(x, y)
    const angle = this.rotation;
    this.body.setAcceleration(
      Math.cos(angle) * this.acceleration,
      Math.sin(angle) * this.acceleration
    );

    // This belongs here (and not in the constructor) due to the constant changing
    // of speed from scene conditions
    const direction = new Phaser.Math.Vector2(x - this.x, y - this.y).normalize();
    this.body.setVelocity(direction.x * currentSpeed, direction.y * currentSpeed);

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

  // --- ACTIONS/MOTIONS ---

  strike(target = targetUnit) {

    // Not implemented yet. SOON!
    if (!this.isTargetInRange(target)) {
      console.warn(`Unit ${this.id} cannot strike, target is out of range.`);
      return;
    }

    response = InteractionSystem.interact(this, target, new InteractionPayload('Attack', 1));
    console.log(`Unit ${this.id} received interaction result: ${response.valueRecieved} with calls taken: ${response.callsTaken}`);

  }

  /**
   * Recieve an interaction payload from another unit.
   * @param {InteractionPayload} payload - The payload containing the call and value.
   */
  recieveInteraction(payload) {
    if (!(payload instanceof InteractionPayload)) {
      throw new Error("Invalid payload for interaction.");
    }
    console.log(`Unit ${this.id} received interaction: ${payload.call} with value: ${payload.value}`);

    // TODO: the rest of this stuff.
    // For now, just return a dummy InteractionResult
    const callsTaken = CALLS[payload.call] || null;
    const valueRecieved = payload.value || 0;
    return new InteractionResult(valueRecieved, callsTaken);
  }

  // --- GRAPHICS ---

  /**
   * Build the unit's graphics.
   * The sprite consists of:
   *  - Body: Indicating the health of the unit.
   *  - Face: Matches the stance of the unit.
   *  - Armour: Matches the armour the unit is wearing. (NOT IMPLEMENTED YET)
   * @note All statistics (HP, stance etc.) of the unit must be in place before this is called.
   */
  buildSprite() {

    
  }
}