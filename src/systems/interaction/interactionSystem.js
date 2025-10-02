/**
 * @file interactionSystem.js
 * This file defines the interaction system for units in the simulation.
 * It handles what happens when one unit wishes to interact (such as attack, heal or loot) another unit.
 */

import InteractionPayload from './interactionPayload.js'; // <-- FIXED: default import
import { InteractionResult } from './interactionResult.js';

function assertUnitLike(entity, name) {
  if (!entity || typeof entity.recieveInteraction !== 'function') {
    throw new Error(`${name} must provide a recieveInteraction(payload) method.`);
  }
  return entity;
}

function assertInteractionResult(result) {
  if (result instanceof InteractionResult) {
    return result;
  }
  if (result && typeof result.valueRecieved === 'number' && typeof result.callTaken === 'boolean') {
    return result;
  }
  throw new Error('Interactions must return an InteractionResult.');
}

/**
 * Interaction System
 * This system handles interactions between units, such as attacks, healing, and looting.
 */
export const InteractionSystem = {
  /**
   * Processes an interaction between two units.
   * @param {Unit} sourceUnit - The unit initiating the interaction.
   * @param {Unit} targetUnit - The unit being interacted with.
   * @param {InteractionPayload} payload - The payload containing the interaction details.
   * @returns {InteractionResult} - The result of the interaction.
   */
   interact(sourceUnit, targetUnit, payload) {
    
    assertUnitLike(sourceUnit, 'sourceUnit');
    assertUnitLike(targetUnit, 'targetUnit');
    if (!(payload instanceof InteractionPayload)) {
      throw new Error("Invalid payload for interaction.");
    }

    const result = targetUnit.recieveInteraction(payload);
    return assertInteractionResult(result);
  }

  // TODO: If you want to add external effects from this interaction, such as a random
  //        chance of a trauma being applied or moral drop for taken hits to nearby allies,
  //        you can do so here.
}

