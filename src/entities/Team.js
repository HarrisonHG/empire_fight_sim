import Phaser from 'phaser';
import Unit from './Unit.js';
import RespawnPoint from './landmarks/RespawnPoint.js';
import RallyPoint from './landmarks/RallyPoint.js';

export const TEAM_RELATIONSHIP = Object.freeze({
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
        this.teamRelationship[name] = TEAM_RELATIONSHIP.ALLY; // Default relationship with itself
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
        if (!Object.values(TEAM_RELATIONSHIP).includes(relationship)) {
            throw new Error(`Invalid relationship: ${relationship}`);
        }
        this.teamRelationship[teamName] = relationship;
    }

    /**
     * Get the relationship with another team.
     * @param {string} teamName - The name of the other team.
     * @returns {TEAM_RELATIONSHIP} The relationship status with the specified team.
     */
    getRelationship(teamName) {
        let debug_val = this.teamRelationship[teamName]
        return this.teamRelationship[teamName] || TEAM_RELATIONSHIP.UNKNOWN;
    }

    /**
     * Get the respawn point closest to a given position.
     * @param {number} x - The x-coordinate to check against.
     * @param {number} y - The y-coordinate to check against.
     * @return {RespawnPoint|null} The closest respawn point, or null if none exist.
     */
    getClosestRespawnPoint(x, y) {
        if (this.respawnPoints.length === 0) {
            return null; // No respawn points available
        }
        let closestPoint = null;
        let closestDistance = Infinity;
        this.respawnPoints.forEach(respawnPoint => {
            const distance = Phaser.Math.Distance.Between(x, y, respawnPoint.x, respawnPoint.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = respawnPoint;
            }
        });
        return closestPoint;
    }

    /**
     * Get the rally point closest to a given position.
     * @param {number} x - The x-coordinate to check against.
     * @param {number} y - The y-coordinate to check against.
     * @return {RallyPoint|null} The closest rally point, or null
     */
    getClosestRallyPoint(x, y) {
        if (this.rallyPoints.length === 0) {
            return null; // No rally points available
        }
        let closestPoint = null;
        let closestDistance = Infinity;
        this.rallyPoints.forEach(rallyPoint => {
            const distance = Phaser.Math.Distance.Between(x, y, rallyPoint.x, rallyPoint.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = rallyPoint;
            }
        });
        return closestPoint;
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