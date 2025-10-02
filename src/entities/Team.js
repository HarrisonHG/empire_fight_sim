import Phaser from 'phaser';
import {
    TEAM_RELATIONSHIP,
    createRelationshipMap,
    assertValidRelationship,
    calculateClosestPoint
} from './teamUtils.js';

export { TEAM_RELATIONSHIP } from './teamUtils.js';

/**
 * @typedef {import('./Unit.js').default} Unit
 * @typedef {import('./landmarks/RespawnPoint.js').default} RespawnPoint
 * @typedef {import('./landmarks/RallyPoint.js').default} RallyPoint
 */

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
        /** @type {Record<string, TEAM_RELATIONSHIP>} */
        this.teamRelationship = createRelationshipMap(name);
        this.respawnPoints = [];
        this.rallyPoints = [];

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
        unit.setTeam(this);
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
     * @param {string} teamName - The name of the other team.
     * @param {TEAM_RELATIONSHIP} relationship - The relationship status (e.g., 'ally', 'enemy').
     */
    setRelationship(teamName, relationship) {
        assertValidRelationship(relationship);
        this.teamRelationship[teamName] = relationship;
    }

    /**
     * Get the relationship with another team.
     * @param {string} teamName - The name of the other team.
     * @returns {TEAM_RELATIONSHIP} The relationship status with the specified team.
     */
    getRelationship(teamName) {
        return this.teamRelationship[teamName] || TEAM_RELATIONSHIP.UNKNOWN;
    }

    /**
     * Get the respawn point closest to a given position.
     * @param {number} x - The x-coordinate to check against.
     * @param {number} y - The y-coordinate to check against.
     * @return {RespawnPoint|null} The closest respawn point, or null if none exist.
     */
    getClosestRespawnPoint(x, y) {
        const { point } = calculateClosestPoint(x, y, this.respawnPoints);
        return point;
    }

    /**
     * Get the rally point closest to a given position.
     * @param {number} x - The x-coordinate to check against.
     * @param {number} y - The y-coordinate to check against.
     * @return {RallyPoint|null} The closest rally point, or null
     */
    getClosestRallyPoint(x, y) {
        const { point } = calculateClosestPoint(x, y, this.rallyPoints);
        return point;
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
