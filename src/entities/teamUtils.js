/**
 * Utility functions and constants used by Team-related classes.
 * These helpers avoid hard dependencies on Phaser so they can be tested in isolation.
 */

/**
 * Mapping of relationship labels used for inter-team interactions.
 * The values are lower-cased to make it easier to serialize and compare them.
 */
export const TEAM_RELATIONSHIP = Object.freeze({
  ALLY: 'ally',
  ENEMY: 'enemy',
  NEUTRAL: 'neutral',
  UNKNOWN: 'unknown'
});

/**
 * Builds the initial relationship map for a team.
 * The map starts with the team considering itself an ally.
 *
 * @param {string} teamName - Name of the team the map belongs to.
 * @returns {Object} Relationship map keyed by team name.
 */
export function createRelationshipMap(teamName) {
  if (typeof teamName !== 'string' || teamName.trim() === '') {
    throw new Error('teamName must be a non-empty string.');
  }
  return { [teamName]: TEAM_RELATIONSHIP.ALLY };
}

/**
 * Validates the provided relationship value.
 * The function returns the canonical string on success and throws otherwise.
 *
 * @param {string} relationship - Relationship value to validate.
 * @returns {string} Normalized relationship value.
 */
export function assertValidRelationship(relationship) {
  const validValues = Object.values(TEAM_RELATIONSHIP);
  if (!validValues.includes(relationship)) {
    throw new Error(`Invalid relationship: ${relationship}`);
  }
  return relationship;
}

/**
 * Determines the point in `points` that is closest to the provided origin.
 * Points are expected to expose numeric `x` and `y` properties.
 *
 * @param {number} originX - X coordinate of the origin.
 * @param {number} originY - Y coordinate of the origin.
 * @param {Array<Object>} points - Collection of candidate points.
 * @returns {{ point: Object|null, distance: number }}
 *   The closest point alongside the computed distance. If `points` is empty, the
 *   returned point is `null` and the distance is `Infinity`.
 */
export function calculateClosestPoint(originX, originY, points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { point: null, distance: Infinity };
  }

  let closestPoint = null;
  let closestDistance = Infinity;

  for (const candidate of points) {
    if (candidate == null || typeof candidate.x !== 'number' || typeof candidate.y !== 'number') {
      continue; // Skip malformed entries instead of crashing the simulation.
    }
    const distance = Math.hypot(candidate.x - originX, candidate.y - originY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPoint = candidate;
    }
  }

  return { point: closestPoint, distance: closestDistance };
}
