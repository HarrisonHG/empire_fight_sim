import { Call, CALLS } from '../calls.js';

/**
 * A pile of data sent to the target of the interaction.
 * @param {Call} call - The call being made in the interaction, such as "Cleave" or "Heal".
 * @param {number} value - The value associated with the call, such as damage or healing amount.
 * @param {boolean} offensive - Whether the call is offensive or friendly
 */
export default class InteractionPayload {
  constructor(call, value, offensive) {
    this.call = call; // The call being made
    this.value = value; // The value associated with the call
    this.offensive = offensive; // Whether the call is offensive or friendly
  }
}

