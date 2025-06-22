import Unit from '../entities/Unit.js';
import { STATUS, LIMB_HEALTH } from '../systems/status.js';

/**
 * Decision Making System
 * This system handles the decision-making process for units in the simulation.
 * Broadly, it is broken down into 4 "sizes" of decisions:
 * 1. Goal Decisions: High-level decisions that define the overall strategy of the unit.
 * 2. Stance: A desired action or series of actions and what actions are needed to achieve it.
 *     - Comes with positive and negative effects, generally.
 * 3. Action: A series of motions used to create a single complete action.
 * 4. Motion: A single motion that is part of an action.
 *     - This is the most basic level of decision-making, often involving simple
 *       movements or animations.
 * 
 * At any level, an unit is executing a motion, which is part of an action,
 * which is part of a stance. Goals are a work in progress.
 */


/**
 * Conditions for actions to be performed, with descriptions and handler functions.
 */
export const CONDITIONS = {
  RANGE: {
    description: "Check if the target is within range",
    handler: (unit) => {
      CONDITIONS.TARGET_EXISTS.handler(unit) &&
      unit.targetUnit.range > 0 &&
      unit.isTargetInRange()
    }
  },
  TARGET_EXISTS: {
    description: "Check if a target exists",
    handler: (unit) =>
      unit.targetUnit && 
      unit.targetUnit.x !== undefined && 
      unit.targetUnit.y !== undefined
  },
  TARGET_IN_LOS: {
    description: "Check if the target is in line of sight",
    handler: (unit) =>
      CONDITIONS.TARGET_EXISTS.handler(unit) &&
      true // Placeholder for actual line of sight logic
  },
  CAN_MOVE: {
    description: "Check if the agent can move",
    handler: (unit) =>
      CONDITIONS.HAVE_2_LEGS.handler(unit) &&
      !unit.statuses.includes(STATUS.PARALYSED) &&
      !unit.statuses.includes(STATUS.ENTANGLED) &&
      !unit.statuses.includes(STATUS.DYING) &&
      !unit.statuses.includes(STATUS.DEAD)
  },
  CAN_ATTACK: {
    description: "Check if the agent can attack",
    handler: (unit) =>
      CONDITIONS.HAVE_WEAPON.handler(unit) &&
      CONDITIONS.HAVE_1_ARM.handler(unit)
  },
  HAVE_WEAPON: {
    description: "Check if the agent has a weapon",
    handler: (unit) => true // Placeholder
  },
  HAVE_2_ARMS: {
    description: "Check if the agent has two arms",
    handler: (unit) =>
      unit.limbHealth.leftArm === LIMB_HEALTH.OK &&
      unit.limbHealth.rightArm === LIMB_HEALTH.OK
  },
  HAVE_1_ARM: {
    description: "Check if the agent has one arm",
    handler: (unit) =>
      unit.limbHealth.leftArm === LIMB_HEALTH.OK ||
      unit.limbHealth.rightArm === LIMB_HEALTH.OK
  },
  HAVE_2_LEGS: {
    description: "Check if the agent has two legs",
    handler: (unit) =>
      unit.limbHealth.leftLeg === LIMB_HEALTH.OK &&
      unit.limbHealth.rightLeg === LIMB_HEALTH.OK
  },
  HAVE_1_LEG: {
    description: "Check if the agent has one leg",
    handler: (unit) =>
      unit.limbHealth.leftLeg === LIMB_HEALTH.OK ||
      unit.limbHealth.rightLeg === LIMB_HEALTH.OK
  }
};

/**
 * Motion: A single motion that is part of an action.
 * Motions are the most basic level of decision-making, often involving simple
 * movements or animations.
 * Motions can be interrupted by thoughts, but not by other motions or actions.
 */
export class Motion {
  /**
   * Creates a new motion.
   * @param {string} name - The name of the motion.
   * @param {string} description - A brief description of the motion.
   * @param {number} duration - The duration of the motion in milliseconds.
   * @param {function(Unit,number,number):void} executionFunction - A function that executes the motion.
   * @see {@link Unit} for the expected parameter type.
   */
  constructor(name, description, duration, executionFunction) {
    this.name = name; // Name of the motion
    this.description = description; // Description of the motion
    this.duration = duration; // Duration of the motion in milliseconds
    if (typeof duration !== "number" || duration <= 0) {
      throw new Error("duration must be a positive number.");
    }

    if (typeof executionFunction !== "function" || executionFunction.length !== 3) {
      throw new Error("executionFunction must be a function that parameters Unit, time, delta.");
    }
    this.execute = executionFunction; // Function to execute the motion
  }
}

/**
 * A list of predefined motions that units can perform.
 */
export const MOTIONS = {
    CHOOSE_TARGET: new Motion(
        "Choose Target",
        "Unit selects a target to engage with.",
        1, // ms. Do something on the next frame
        (unit, time, delta) => {
          // The unit will decide which target to engage with based on its current state.
          return
        }
    ),
    MOVE_TO: new Motion(
        "Move To",
        "Unit moves towards a specified position in the world.",
        500, // ms. Moving to a target means you should think actively.
        (unit, time, delta) => {
          unit.moveTo(unit.targetUnit.x, unit.targetUnit.y);
        }
    ),
    STEP_FORWARD: new Motion(
        "Step Forward",
        "Unit steps forward to close distance or reposition.",
        200, // ms. One short step.
        (unit, time, delta) => {
          unit.moveTo(unit.targetUnit.x, unit.targetUnit.y); // TODO: Handle single step
        }
    ),
    STEP_BACKWARD: new Motion(
        "Step Backward",
        "Unit steps backward to create distance or evade.",
        200, // ms. One short step.
        (unit, time, delta) => {
          console.log("RETREAT HAS NOT BEEN IMPLEMENTED. ONLY CHARGE!") // TODO: Handle single step back
        }
    ),
    STRIKE: new Motion(
        "Strike",
        "Unit swings or thrusts their melee weapon.",
        1000, // ms. Max DPS in Empire is 1 second
        (unit, time, delta) => {
          unit.strike();
        }
    ),
    IDLE: new Motion(
        "Idle",
        "Unit remains in a neutral stance, ready for action.",
        2000, // ms. 2 seconds to react while relaxed
        (unit, time, delta) => {
          // Idle motion does nothing, but can be used to reset state or animations
          unit.standStill();
        }
    ),
};

/**
 * Action: A series of motions that make up a complete action.
 * These are a predefined series of motions that cannot be interrupted by thought.
 * They should still remain vulnerable to external factors, such as being interrupted 
 */
export class Action {
  constructor(name, description, motions = [], conditions = []) {
    this.name = name; // Name of the action
    this.description = description; // Description of the action
    this.motions = motions; // Array of motions that make up the action
    this.conditions = conditions; // Conditions that must be met to perform this action
  }
}

/**
 * A list of predefined actions that units can perform.
 */
export const ACTIONS = {
    MOVE_TO_TARGET: new Action(
        "Move To Target",
        "Unit moves towards a target position.",
        [MOTIONS.CHOOSE_TARGET, MOTIONS.MOVE_TO],
        [CONDITIONS.TARGET_EXISTS, CONDITIONS.CAN_MOVE]
    ),
    ATTACK: new Action(
        "Attack",
        "Unit attacks a target with a melee weapon.",
        [MOTIONS.CHOOSE_TARGET, MOTIONS.STRIKE],
        [CONDITIONS.TARGET_EXISTS, CONDITIONS.TARGET_IN_LOS, CONDITIONS.HAVE_WEAPON, 
            CONDITIONS.CAN_ATTACK, CONDITIONS.RANGE]
    ),
    STAND: new Action(
        "Stand",
        "Unit stands still, ready for action.",
        [MOTIONS.IDLE],
        []
    ),
};

/**
 * Stance: A desired action or series of actions that an unit wants to achieve.
 * A stance is a higher-level decision that encompasses multiple actions and motions.
 * Stances should aim to be completed by the unit whenever uninterupted, but CAN be
 * interupted by thoughts and emergency decisions by the unit.
 */
export class Stance {
  constructor(name, description, primaryActions = [], enforcePrimaryActionOrder = true, 
      supportingActions = [], faceImage = null) {
    this.name = name; // Name of the stance
    this.description = description; // Description of the stance
    this.primaryActions = primaryActions // Actions that this stance wants to achieve
    this.enforcePrimaryActionOrder = enforcePrimaryActionOrder; // Whether the primary actions should be enforced in order
    this.supportingActions = supportingActions; // Supporting actions that help achieve the primary actions
    this.faceImage = faceImage; // Optional image tag to represent the stance visually
  }
}

export const STANCES = {
    CHARGE: new Stance(
        "Charge",
        "Unit runs in to attack the target quickly with little regard for personal safety.",
        [ACTIONS.ATTACK],
        false,
        [ACTIONS.MOVE_TO_TARGET],
        'angry_shout'
    ),
    RELAXED: new Stance(
        "Relaxed",
        "Unit is in a neutral state, regaining energy and morale until something comes near.",
        [ACTIONS.STAND],
        false,
        [],
        'smile'
    ),
};
