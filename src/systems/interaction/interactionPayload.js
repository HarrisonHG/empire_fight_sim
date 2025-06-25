import { CALLS } from '../calls.js';

/**
 * A pile of data sent to the target of the interaction.
 * @param {string} call - The call being made in the interaction, such as "Cleave" or "Heal".
 * @param {number} value - The value associated with the call, such as damage or healing amount.
 * @param {boolean} offensive - Whether the call is offensive or friendly
 */
export default class InteractionPayload {
  constructor(call, value, offensive) {
    if (call && !CALLS[call]) {
      throw new Error(`Call "${call}" is not defined in CALLS.`);
    }
    this.call = call; // The call being made
    this.value = value; // The value associated with the call
    this.offensive = offensive; // Whether the call is offensive or friendly
  }
}

