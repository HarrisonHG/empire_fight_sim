import Phaser from 'phaser';
import { Motion, MOTIONS, Action, ACTIONS, Stance, STANCES, CONDITIONS 
  } from '../systems/unitDecisionMaking.js';
import { STATUS, LIMB_HEALTH } from '../systems/status.js';
import { Team, TEAM_RELATIONSHIP } from './Team.js';
import InteractionPayload from '../systems/interaction/interactionPayload.js';
import { InteractionResult } from '../systems/interaction/interactionResult.js';
import { InteractionSystem } from '../systems/interaction/interactionSystem.js';
import { CALLS } from '../systems/calls.js';
import OneHanded from './equipment/weapons/OneHanded.js';
import Spear from './equipment/weapons/Spear.js';
import TwoHanded from './equipment/weapons/TwoHanded.js';
import Shield from './equipment/defence/Shield.js';

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
    super(scene, x, y, 'empty');
    this.scene = scene;

    // Movement
    this.moveSpeed = speed || 200; // Default speed in pixels per second
    this.tryingToMove = false;
    this.acceleration = 800;
    this.SLOW_MOVEMENT_DISTANCE = size; // Distance at which to start slowing down
    this.CLOSE_ENOUGH = size/2

    // Decision making
    this.currentStance = STANCES.RELAXED; // Default stance
    this.currentAction = null;
    this.completedActions = []; // Array to hold completed actions in the current stance
    this.currentMotion = null; 
    this.completedMotions = []; // Array to hold completed motions in the current action
    this.targetUnit = null; // The unit we are currently targeting, if any
    this.MEMORY_SIZE = 20; // Backup value for how many actions and motions we remember
    this.rethinkTimer = 0; // Timer to control how often we rethink our actions in milliseconds.
    this.ATTACK_COOLDOWN = MOTIONS.STRIKE.duration; // Cooldown for attacks in milliseconds

    // Statistics and statuses
    this.maxHp = 2;
    this.hp = this.maxHp;
    this.limbHealth = {
      leftArm: LIMB_HEALTH.OK,
      rightArm: LIMB_HEALTH.OK,
      leftLeg: LIMB_HEALTH.OK,
      rightLeg: LIMB_HEALTH.OK
    }
    this.statuses = []; // Array to hold statuses like 'paralysed', 'entangled', etc.
    this.isAlive = true; // Is the unit alive? Used for health checks and interactions.
    this.equipment = []; // Array to hold usable equipment like weapons, shields, etc.
    const weaponClasses = [OneHanded, Spear, TwoHanded];
    //const weaponClasses = [Spear];
    let weaponRoll = Math.floor(Math.random() * weaponClasses.length);
    const weaponClass = weaponClasses[weaponRoll];
    this.equipment = [
      new weaponClass(scene, this.x-5, this.y+20, this)
    ]
    if (weaponClass === OneHanded) {
      this.equipment.push(new Shield(scene, this.x+5, this.y+20, this));
    }   
    this.currentWeapon = this.equipment[0]; // Default to the first weapon in the equipment array
    
    // TODO: SKill levels n shit!
    this.maxParryRate = 0.8
    this.minParryRate = 0.1
    this.parryRecoveryRate = 0.3 // Percentage of how much "parry rate" is recovered per second.
    if (this.equipment.some(eq => eq instanceof Shield)) {
      this.parryRecoveryRate += 0.2;
    }
    this.currentParryRate = this.minParryRate; // Who spawns into life with perfect defence?
    this.parryDamage = 0.5 // How much parry chance "damage" is taken when struck
    
    // Gameplay properties
    this.team = null;
    this.id = Phaser.Utils.String.UUID(); // Unique identifier for the unit

    // Init visuals
    this.setDisplaySize(size, size);
    this.name = this.id.substring(0, 4);

    // Physics
    scene.physics.add.existing(this);
    scene.add.existing(this);
    this.body.setCircle(size*1.6);
    this.body.setBounce(1);
    this.body.setCollideWorldBounds(true);

    // Visuals
    this.colour = colour || '#888888'; // Default grey
    this.originalColour = this.colour; // Store the original colour for resetting
    this.setColour(this.colour);
    this.viz = scene.add.container(x, y);    
    this.baseVisual = scene.add.image(0, 0, 'body')
      .setDisplaySize(size, size);
    this.faceVisual = scene.add.image(0, 0, 'smile')
      .setDisplaySize(size, size)
      .setDepth(1);
    this.viz.add([ this.baseVisual, this.faceVisual ]);

    if ( scene.sys.game.config.physics.arcade.debug ) {
      // Add a translucent circle to visualize the unit's range
      this.reachCircle = scene.add.graphics();
      this.reachCircle.fillStyle(Phaser.Display.Color.HexStringToColor(this.colour).color, 0.15);
      this.reachCircle.fillCircle(0, 0, this.currentWeapon.REACH);
      this.reachCircle.setDepth(-1); // Behind the unit
      this.viz.add(this.reachCircle);

      // Health bars are useful for debugging, but not for gameplay.
      this.barBG = scene.add.rectangle(0, -size/2 - 6, size, 4, 0x000000);
      this.bar = scene.add.rectangle(
        -size/2, -size/2 - 6,
        size, 4, 0xff0000
      ).setOrigin(0, 0.5);
      this.viz.add([this.barBG, this.bar]);

      // Parry bar (green) to visualize current parry rate
      this.parryBarBG = scene.add.rectangle(0, -size/2 - 12, size, 4, 0x003300);
      this.parryBar = scene.add.rectangle(
        -size/2, -size/2 - 12,
        size, 4, 0x00ff00
      ).setOrigin(0, 0.5);
      this.viz.add([this.parryBarBG, this.parryBar]);

      // Add a text label for the unit's name, centered on the unit
      this.nameText = scene.add.text(0, 0, this.name, {
        fontFamily: 'Arial',
        fontSize: Math.round(size / 2.5),
        color: '#000000',
        align: 'center',
        stroke: '#ffffff',
        strokeThickness: 0
      }).setOrigin(0.5, 0.5).setDepth(2);
      this.viz.add(this.nameText);
    }

  }

  /**
   * Update the unit's state.
   * @param {number} time - The current time in milliseconds.
   * @param {number} delta - The time since the last update in milliseconds.
   */
  update(time, delta) {
    const pointer = this.scene.input.activePointer;   

    this.rethinkTimer -= delta;

    if (this.rethinkTimer <= 0 || this.currentMotion === null) {
      this.chooseNextMotion();
    }

    this.currentMotion.execute(this, time, delta);

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

    if (this.currentParryRate < this.maxParryRate) {
      this.currentParryRate = Math.min(
        this.maxParryRate,
        this.currentParryRate + this.parryRecoveryRate * (delta / 1000)
      );
    }
    
    this.syncVisuals()
  }

  // --- ACCESSORS ---

  /**
   * Set the colour of the unit, by changing its tint.
   * @param {string} colour - Hex colour code, e.g. '#FF0000'.
   */
  setColour(colour) {
    this.colour = colour;
    if (this.baseVisual) {
      this.baseVisual.setTint(Phaser.Display.Color.HexStringToColor(colour).color);
    }
  }

  /**
   * Add a shade of tint to the unit's colour.
   * Does not alter the original colour, but adds a tint on top of it.
   * @param {string} tint - Hex colour code, e.g. '#FF0000'.
   */
  addTint(tint) {
    // Apply an additional dark tint to the existing colour to indicate death
    const baseColor = Phaser.Display.Color.HexStringToColor(this.colour);
    const newTint = Phaser.Display.Color.IntegerToColor(tint);
    const tinted = Phaser.Display.Color.Interpolate.ColorWithColor(
      baseColor,
      newTint,
      1,
      0.5
    );
    const tintVal = Phaser.Display.Color.GetColor(tinted.r, tinted.g, tinted.b);
    this.baseVisual.setTint(tintVal);
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

  /**
   * If viz is set, return its rotation. If not, return the unit's rotation.
   * @returns {number} The rotation of the unit or its visual representation.
   */
  getRotation() {
    if (this.baseVisual && this.baseVisual.rotation !== undefined) {
      return this.baseVisual.rotation;
    }
    return this.rotation;
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
   * Choose the closest unit on an enemy team.
   * @returns {Unit|null} The closest enemy unit, or null if no enemies are
   * found.
   */
  chooseClosestEnemyUnit() {
    // If there are enemy units in the world, set stance to CHARGE
    const enemyUnits = this.scene.unitGroup.getChildren().filter(targetUnit => 
      this.team.getRelationship(targetUnit.team.name) == TEAM_RELATIONSHIP.ENEMY &&
      targetUnit.isAlive && // Only consider alive units
      targetUnit !== this && // Don't target ourselves
      Phaser.Math.Distance.Between(this.x, this.y, targetUnit.x, targetUnit.y) < 1000 // debug value
    );
    if (enemyUnits.length > 0) {
      this.targetUnit = this.chooseClosestUnit(enemyUnits);
      if (this.targetUnit) {
        console.debug(`Unit ${this.id} targeting enemy unit: ${this.targetUnit.id}`);
        return this.targetUnit;
      } else {
        console.debug(`Unit ${this.id} could not find a target unit.`);
        return null;
      }
    }
  }

  /**
   * Choose a stance for the unit to adopt.
   * This should be considered a luxury position for the unit. Most of the time,
   * unit should be assigned a stance by other units, or commanders etc.
   * @see STANCES for implemented stances.
   */
  chooseStance() {

    // If the unit is dead, it will respawn (if there's a respawn point) or stay dead.
    if (!this.isAlive) {
      const closestRespawnPoint = this.team.getClosestRespawnPoint(this.x, this.y);
      if (closestRespawnPoint) {
        console.debug(`Unit ${this.id} is dead, respawning at closest respawn point.`);
        this.targetUnit = closestRespawnPoint; // This is fine. Totally fine.
        
        this.body.checkCollision.none = true; // Disable collision checks while respawning
        this.body.enable = true;
        this.viz.setDepth(0);

        this.setStance(STANCES.RESPAWN);
      }
      else {
        console.debug(`Unit ${this.id} is dead, no respawn point available.`);
        this.setStance(STANCES.DEAD);
      }
      return;
    }

    // If there are enemy units in the world, set stance to CHARGE
    // const enemyUnits = this.scene.unitGroup.getChildren().filter(targetUnit => 
    //   this.team.getRelationship(targetUnit.team.name) == TEAM_RELATIONSHIP.ENEMY &&
    //   targetUnit.isAlive && // Only consider alive units
    //   targetUnit !== this && // Don't target ourselves
    //   Phaser.Math.Distance.Between(this.x, this.y, targetUnit.x, targetUnit.y) < 1000 // debug value
    // );
    // if (enemyUnits.length > 0) {
    //   this.setStance(STANCES.CHARGE);
    //   this.targetUnit = this.chooseClosestUnit(enemyUnits);
    //   if (this.targetUnit) {
    //     console.debug(`Unit ${this.id} targeting enemy unit: ${this.targetUnit.id}`);
    //   } else {
    //     console.debug(`Unit ${this.id} could not find a target unit.`);
    //   }
    //   return;
    // }

    const closestEnemyUnit = this.chooseClosestEnemyUnit();
    if (closestEnemyUnit) {
      this.setStance(STANCES.CHARGE);
      this.targetUnit = closestEnemyUnit;
      return;
    }

    // No enemies? Rally to the rally point.
    this.closestRallyPoint = this.team.getClosestRallyPoint(this.x, this.y);
    if (this.closestRallyPoint) {
      console.debug(`Unit ${this.id} found closest rally point: ${this.closestRallyPoint.team}`);
      this.targetUnit = this.closestRallyPoint;
      this.setStance(STANCES.RALLY);
      return;
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
    this.currentAction = null; // Reset current action for the new stance
    this.currentStance = stance;
    console.debug(`Unit ${this.id} set to stance: ${stance.name}`);

    // Set the visuals based on the stance
    let newFace = stance.faceImage || 'smile'; // Default to smile if no face image is provided
    this.faceVisual.setTexture(newFace);
    this.faceVisual.setDisplaySize(this.displayWidth, this.displayWidth);
  }

  /**
   * Check if a condition is met for the unit.
   * @param {Object} condition - The condition to check (must be in CONDITIONS).
   * @returns {boolean} True if the condition is met, false otherwise.
   */
  checkCondition(condition) {
    if (!condition || typeof condition.handler !== 'function') {
      console.warn(`Condition "${condition}" not implemented.`);
      return false;
    }
    const debug_val = condition.handler(this);
    return condition.handler(this);
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
    const primaryCount = this.currentStance.primaryActions.filter(a => a === action).length;
    if (primaryCount > 0) {
      const completedCount = this.completedActions.filter(a => a === action).length;
      if (completedCount >= primaryCount) {
        return false;
      }
    }
    // Else, this is not a primary action and so can be repeated as needed.

    for (const condition of action.conditions) {
      // Pass data[condition] if it exists, else undefined
      if (!this.checkCondition(condition)) {
        console.debug(`Unit ${this.id} cannot perform action: ${action.name} due to condition: ${condition}`);
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

    this.completedMotions = []; // Reset completed motions for the new action
    this.currentMotion = null; // Reset current motion for the new action

    if (this.currentAction && this.currentStance.primaryActions.includes(this.currentAction)) {
      // We only care about tracking primary actions as they are the goal of the stance.
      // Secondary actions will be repeated infitiely until the primary actions are completed.
      console.debug(`Unit ${this.id} completed action: ${this.currentAction.name}`);
      this.completedActions.push(this.currentAction);
    }

    // Have we fulfulled the current stance?
    if (this.completedActions.length >= this.currentStance.primaryActions.length) {
      console.debug(`Unit ${this.id} has completed its current stance: ${this.currentStance.name}`);
      this.chooseStance()
      return this.chooseNextAction();
    }

    // Loop through primary actions of the current stance and act on the first one
    // Who's conditions are met and not already completed.
    if (!this.currentStance || !this.currentStance.primaryActions.length) {
      console.debug(`Unit ${this.id} has no primary actions in current stance: ${this.currentStance.name}`);
      this.currentAction = ACTIONS.RELAX; // Default to standing still
      return this.currentAction;
    }

    // Check primary actions first
    for (const action of this.currentStance.primaryActions) {
      if (this.checkActionConditions(action)) {
        this.currentAction = action;
        console.debug(`Unit ${this.id} chose primary action: ${action.name}`);
        return action;
      }
    }

    // If no primary action is available, check supporting actions
    for (const action of this.currentStance.supportingActions) {
      if (this.checkActionConditions(action)) {
        this.currentAction = action;
        console.debug(`Unit ${this.id} chose supporting action: ${action.name}`);
        return action;
      }
    }

    // If no actions are available, default to standing still
    this.currentAction = ACTIONS.RELAX;
    console.debug(`Unit ${this.id} has no valid actions, defaulting to stand.`);
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
    let distance = Phaser.Math.Distance.Between(this.x, this.y, targetUnit.x, targetUnit.y);
    distance -= targetUnit.displayWidth / 2; // Adjust for the target unit's size
    return distance <= this.currentWeapon.REACH;
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
    
    let closeEnough = this.CLOSE_ENOUGH;

    // No point chasing a dead unit
    if (this.targetUnit instanceof Unit) {
      if (!this.targetUnit.isAlive && 
          this.targetUnit.team &&
          this.team.getRelationship(this.targetUnit.team.name) === TEAM_RELATIONSHIP.ENEMY &&
          this.currentStance === STANCES.CHARGE) {
        // Reapplying this stance should trigger the unit to choose a new target
        console.debug(`Unit ${this.id} is chasing a dead enemy unit, rethinking`);
        const closestEnemyUnit = this.chooseClosestEnemyUnit();
        if (closestEnemyUnit) {
          this.targetUnit = closestEnemyUnit;
          this.setStance(STANCES.CHARGE);
        }
      }

      closeEnough = this.targetUnit.displayWidth / 2 + this.CLOSE_ENOUGH;
    }
    else if (this.targetUnit instanceof Phaser.GameObjects.Zone) {
      closeEnough = this.targetUnit.size / 2 + this.CLOSE_ENOUGH;
    }

    const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    if (distance < closeEnough) {
      this.standStill();
      this.chooseNextMotion();
      return; 
    }

    // Calculate max speed achievable
    let currentSpeed = this.moveSpeed;
    if (!this.isAlive)
      currentSpeed /= 2;

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
    this.baseVisual.setRotation(angle);
    this.faceVisual.setRotation(angle);
  }

  /**
   * Lay down dead. No moving, just dead.
   * 
   */

  // --- ACTIONS/MOTIONS ---

  /**
   * Attack the target with a melee weapon
   * @param {Unit} target 
   * @returns 
   */
  strike(target = this.targetUnit) {

    this.standStill(); // Stop moving before striking

    // Not implemented yet. SOON!
    if (!this.isTargetInRange(target)) {
      console.warn(`Unit ${this.id} cannot strike, target is out of range.`);
      return;
    }

    this.turnToFace(target.x, target.y); // Face the target before striking
    this.currentWeapon.thrust();

    // Max parry rate is reduced while the unit is striking.
    let oldMaxParryRate = this.maxParryRate;
    this.maxParryRate /= 2;
    this.currentParryRate = Math.min(this.currentParryRate, this.maxParryRate);

    setTimeout(() => {
      const response = InteractionSystem.interact(this, target, new InteractionPayload(null, 1, true));
      console.debug(`Unit ${this.id} received interaction result: ${response.valueRecieved} with call taken: ${response.callTaken}`);
      this.maxParryRate = oldMaxParryRate;
    }, this.currentWeapon.ATTACK_TIME_START);

  
    this.rethinkTimer = this.ATTACK_COOLDOWN; // Set cooldown for the next attack
    // TODO: Maybe handle stepping back and forth. But for now, just stand still.
    this.completedMotions.push(MOTIONS.STRIKE); // Mark the strike motion as completed
    this.currentMotion = MOTIONS.IDLE; // Reset current motion after striking    
  }

  /**
   * Come alive again at a respawn point.
   * This is the monster respawn kind, not the healed-to-life kind.
   */
  respawn() {
    if (this.isAlive) {
      console.warn(`Unit ${this.id} is already alive, cannot respawn.`);
      return;
    }

    this.isAlive = true;
    this.hp = this.maxHp; // Reset health to max
    this.body.enable = true; // Re-enable physics body
    this.body.checkCollision.none = false; // Re-enable collision checks

    this.baseVisual.clearTint();
    if (this.team) {
      this.setColour(this.team.colour);
    }
    else {
      this.setColour(this.originalColour);
    }
    this.faceVisual.setTexture('smile');
    this.viz.setDepth(0);
    this.targetUnit = null; // Clear the target unit (which was the respawn point)
    this.standStill(); // Stop any movement
    this.chooseStance()
    this.rethinkTimer = 0; // Reset rethink to act immediately
    console.debug(`Unit ${this.id} has respawned.`);
  }

  /**
   * Recieve an interaction payload from another unit.
   * @param {InteractionPayload} payload - The payload containing the call and value.
   */
  recieveInteraction(payload) {
    if (!(payload instanceof InteractionPayload)) {
      throw new Error("Invalid payload for interaction.");
    }
    console.debug(`Unit ${this.id} received interaction: ${payload.call} with value: ${payload.value}`);

    let damageTaken = 0;
    if (payload.offensive) {
      
      // Parry attempt an attack
      const roll = Math.random();
      if (roll > this.currentParryRate) {
        this.hp -= payload.value;
      }
      else {
        console.debug(`Unit ${this.id} parried the attack (${roll}<${this.currentParryRate}!`);

        for (const item of this.equipment) {
          if (typeof item.parry === 'function') {
            item.parry();
          }
        }
      }

      // Parry or naw, folks get spooked at getting attacked.
      this.currentParryRate = Math.max(
        this.minParryRate,
        this.currentParryRate - this.parryDamage
      );
    }

    // Check if the unit is dead
    if (this.hp <= 0) {
      this.isAlive = false;
      
      console.debug(`Unit ${this.id} has died.`);
      this.hp = 0;
      this.setStance(STANCES.DEAD);
      this.layDead();
    }
    else {
      // If the unit is not dead, trigger the unit to rethink its actions.
      this.rethinkTimer = Math.min(this.rethinkTimer, 1000);
    }

    // TODO: the rest of this stuff.
    // For now, just return a dummy InteractionResult
    const callTaken = true;
    const valueRecieved = payload.value;
    return new InteractionResult(valueRecieved, callTaken);
  }

  /**
   * Lay down dead.
   * This is the monster respawn kind, not the healed-to-life kind.
   */
  layDead() {
    if (this.isAlive) {
      console.warn(`Unit ${this.id} is alive, cannot lay dead.`);
      return;
    }

    this.addTint('#FF0000'); // Add a red tint to indicate death
    this.faceVisual.setTexture('dead'); // Change face to dead
    this.body.setVelocity(0, 0); // Stop all movement

    // Body is not on the floor and can be stepped over.
    this.body.checkCollision.none = true;
    this.body.enable = false;
    this.viz.setDepth(-1000);
  }

  // --- GRAPHICS ---

  /**
   * Resync the visuals of the unit.
   * This is a light call to shift the visuals around
   * and update the health bar.
   * Any state changes, such as a new stance, are responsible for setting new visuals.
   */
  syncVisuals() {

    // move the container to the body’s position
    this.viz.setPosition(this.x, this.y);
    this.viz.setRotation(this.rotation);

    if ( this.scene.sys.game.config.physics.arcade.debug ) {
      // update health‐bar width
      const w = this.baseVisual.displayWidth;
      const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
      this.bar.width = w * pct;
      1
      this.bar.setVisible(this.isAlive); // Hide the health bar if dead
      this.barBG.setVisible(this.isAlive); // Hide the health bar background if dead

      // update parry bar width
      const parryPct = Phaser.Math.Clamp(this.currentParryRate, 0, 1);
      this.parryBar.width = w * parryPct;
      this.parryBar.setVisible(this.isAlive); // Hide the parry bar if dead
      this.parryBarBG.setVisible(this.isAlive); // Hide the parry bar background

      this.nameText.setPosition(0, this.displayHeight - 10);
    }

    for (const item of this.equipment) {
      if (typeof item.update === 'function') {
        item.update();
      }
    }
  }

}