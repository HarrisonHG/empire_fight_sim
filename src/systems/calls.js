
/**
 * Defines a Call in Empire. Ie, the things you yell at people and what they mean.
 */
export class Call {
    /**
     * Creates a new Call instance.
     * @param {string} name - The name of the call.
     * @param {string} description - What the call does (in quick mechanical speak).
     * @param {string} category - Empire's classification, such as "heroic" or "magical".
     * @param {number} castingTime - How long it takes to cast the spell or the effect in seconds.
     * @param {number} duration - How long the effect lasts in seconds. 0 indicates no duration.
     *  - And -1 indicates "until fixed"
     * @param {number} value - The value of the call, such as damage or healing amount.
     * @see {@link https://www.profounddecisions.co.uk/empire-wiki/Calls|Empire Calls Wiki} */
  constructor(name, description, castingTime, duration, value) {
    this.name = name;
    this.description = description;
    this.castingTime = castingTime;
    this.duration = duration;
    this.value = this.value;
  }
}

/**
 * The difinitive list of calls in Empire.
 * @note We will not be including the safety calls in this list, as they are not
 *       part of the game mechanics, per se.
 */
export const CALLS = {
    CLEAVE: new Call (
        "Cleave",
        "Powerful strike that breaks limbs and insta-downs foes with light armour or less.",
        "Heroic",
        1, // Casting time
        -1, // Duration
        1 // Value
    ),
    IMPALE: new Call (
        "Impale",
        "Very powerful strike that breaks limbs and insta-downs foes with medium armour or less.",
        "Heroic",
        1, // Casting time
        -1, // Duration
        1 // Value
    ),
    STRIKEDOWN: new Call (
        "Strike-Down",
        "Un-parry-able heavy strike that knocks you on your arse.",
        "Heroic",
        1, // Casting time
        0, // Duration
        1 // Value
    ),
    EXECUTE: new Call (
        "Execute",
        "Finish off a dying opponent to sned them back to the labrynth.",
        "Heroic",
        5, // Casting time
        -1, // Duration
        0 // Value
    ),
    CURSE: new Call (
        "Curse",
        "Bad joo-joo is happening. Go see a ref.",
        "Magical",
        30, // Casting time
        -1, // Duration in seconds
        0 // Value
    ),
    ENTANGLE: new Call (
        "Entangle",
        "You are rooted to the spot and cannot move.",
        "Magical",
        30, // Casting time
        10, // Duration in seconds
        0 // Value
    ),
    PARALYSE: new Call (
        "Paralyse",
        "You cannot move at all",
        "Magical",
        30, // Casting time
        10, // Duration in seconds
        0 // Value
    ),
    REPEL: new Call (
        "Repel",
        "You are pushed back for a short time, or 20ft, whichever is quicker.",
        "Magical",
        30, // Casting time
        10, // Duration in seconds
        0 // Value
    ),
    SHATTER: new Call (
        "Shatter",
        "You are hit with a powerful magical force that breaks your armour or weapons.",
        "Magical",
        30, // Casting time
        -1, // Duration in seconds
        0 // Value
    ),
    VENOM: new Call (
        "Venom",
        "You are poisoned and will have a very short count-down to death if you are dying.",
        "Magical",
        30, // Casting time
        -1, // Duration in seconds
        0 // Value
    ),
    WEAKNESS: new Call (
        "Weakness",
        "You are weakened and cannot use any shouts apart from safety ones.",
        "Magical",
        30, // Casting time
        -1, // Duration in seconds
        0 // Value
    )
};

