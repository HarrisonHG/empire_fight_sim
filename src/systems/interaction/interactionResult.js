import Unit from '../../entities/Unit.js';
import { Call, CALLS } from '../calls.js';

/**
 * InteractionResult class represents the result of an interaction between two units.
 * This information is returned from the target unit to the source unit
 * after an interaction has been processed so that the source unit can do whatever it
 * pleases with the result, which I'm sure is very wholesome and not at all
 * violent or destructive.
 */
export class InteractionResult {
  /**
   * @param {number} valueRecieved - The value received by the target unit from the interaction.
   * @param {Unit} callsTaken - The calls taken by the target unit during the interaction.
   * @note No need to pass the units in question, as the interactionSystem will know
   *       which units were involved in the interaction. If this all goes async,
   *       we'll need to revisit this design.
   * @warning For future Harrison - Expect counter calls to be added here!
   */
    constructor(valueRecieved, callsTaken) {
        if (typeof valueRecieved !== 'number') {
        throw new Error("valueRecieved must be a number.");
        }
        if (!(callsTaken instanceof Unit)) {
        throw new Error("callsTaken must be an instance of Unit.");
        }
    
        this.valueRecieved = valueRecieved; // The value received by the target unit
        this.callsTaken = callsTaken; // The calls taken by the target unit
    }
  }
