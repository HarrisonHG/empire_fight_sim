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
   * @param {boolean} callTaken - Whether or not the call was taken (and implied "consumed").
   * @note No need to pass the units in question, as the interactionSystem will know
   *       which units were involved in the interaction. If this all goes async,
   *       we'll need to revisit this design.
   * @warning For future Harrison - Expect counter calls to be added here!
   */
    constructor(valueRecieved, callTaken) {    
        this.valueRecieved = valueRecieved;
        this.callTaken = callTaken;
    }
  }
