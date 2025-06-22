/**
 * @file interactionSystem.js
 * This file defines the interaction system for units in the simulation.
 * It handles what happens when one unit wishes to interact (such as attack, heal or loot) another unit.
 */

import Unit from '../../entities/Unit.js';
import InteractionPayload from './interactionPayload.js'; // <-- FIXED: default import
import { InteractionResult } from './interactionResult.js';

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
   interact(sourceUnit, targetPayload, payload) {
    
    if (!(sourceUnit instanceof Unit)) {
      throw new Error("sourceUnit must be an instance of Unit.");
    }
    if (!(targetUnit instanceof Unit)) {
      throw new Error("targetUnit must be an instance of Unit.");
    }
    if (!(payload instanceof InteractionPayload)) {
      throw new Error("Invalid payload for interaction.");
    }

    return InteractionResult = targetUnit.recieveInteraction(payload);
  }

  // TODO: If you want to add external effects from this interaction, such as a random
  //        chance of a trauma being applied or moral drop for taken hits to nearby allies,
  //        you can do so here.
}

