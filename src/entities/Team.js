import Phaser from 'phaser';
import Unit from './Unit.js';

export const TeamRelationship = Object.freeze({
    ALLY: 'ally',
    ENEMY: 'enemy',
    NEUTRAL: 'neutral',
    UNKNOWN: 'unknown'
});

/**
 * Represents a team of units in the game.
 */
export class Team extends Phaser.GameObjects.Group {
    /**
     * Create a new Team.
     * @param {Phaser.Scene} scene - The scene to which this team belongs.
     * @param {string} name - The name of the team.
     * @param {string} [colour] - The hex colour of the team, used for visual representation.
     * @param {Array} [units] - An array of unit objects that belong to this team.
     */
    constructor(scene, name, colour, units = []) {
        super(scene);

        this.scene = scene;
        this.name = name; // Name of the team
        this.colour = colour || '#888888'; // Default grey if no colour is provided
        this.units = units;
        this.teamRelationship = {}

        // Add each unit to the group
        units.forEach(unit => {
            this.add(unit);
        });
    }

    // --- ACCESSORS ---

    /**
     * Add a unit to the team.
     * @param {Unit} unit - The unit to add.
     */
    addUnit(unit) {
        unit.setColour(this.colour);
        this.units.push(unit);
        this.add(unit);
    }

    /**
     * Remove a unit from the team.
     * @param {Unit} unit - The unit to remove.
     */
    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index > -1) {
            this.units.splice(index, 1);
            this.remove(unit);
        }
    }

    /**
     * Get all units in the team.
     * @returns {Array} An array of units in the team.
     */
    getUnits() {
        return this.units;
    }

    /**
     * Add relationship with another team.
     * If the relationship already exists, it will be updated.
     * @param {string} team - The name of the other team.
     * @param {TeamRelationship} relationship - The relationship status (e.g., 'ally', 'enemy').
     */
    setRelationship(teamName, relationship) {
        if (!Object.values(TeamRelationship).includes(relationship)) {
            throw new Error(`Invalid relationship: ${relationship}`);
        }
        this.teamRelationship[teamName] = relationship;
    }

    /**
     * Get the relationship with another team.
     * @param {string} teamName - The name of the other team.
     * @returns {TeamRelationship} The relationship status with the specified team.
     */
    getRelationship(teamName) {
        return this.teamRelationship[teamName] || TeamRelationship.UNKNOWN;
    }

    // --- METHODS ---
    /**
     * Update the team colours.
     * @param {string} colour - The new hex colour for the team.
     */
    setColour(colour) {
        this.colour = colour;
        this.children.iterate(unit => {
            if (unit.setColour) {
                unit.setColour(colour);
            }
        });
    }
}