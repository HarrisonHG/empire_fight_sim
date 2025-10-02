import { Call, CALLS } from '../calls.js';

/**
 * A pile of data sent to the target of the interaction.
 * @param {Call} call - The call being made in the interaction, such as "Cleave" or "Heal".
 * @param {number} value - The value associated with the call, such as damage or healing amount.
 * @param {boolean} offensive - Whether the call is offensive or friendly
 */
export default class InteractionPayload {
  constructor(call, value, offensive) {
    if (call !== null && !(call instanceof Call)) {
      throw new Error('call must be null or an instance of Call.');
    }
    if (typeof value !== 'number') {
      throw new Error('value must be a number.');
    }
    if (typeof offensive !== 'boolean') {
      throw new Error('offensive must be a boolean.');
    }

    this.call = call; // The call being made
    this.value = value; // The value associated with the call
    this.offensive = offensive; // Whether the call is offensive or friendly
  }
}

