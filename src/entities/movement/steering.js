const EPSILON = 1e-6;

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (length < EPSILON) {
    return { x: 0, y: 0, length: 0 };
  }
  return { x: x / length, y: y / length, length };
}

function distanceBetween(a, b) {
  if (!a || !b) {
    return Infinity;
  }
  const dx = (a.x ?? 0) - (b.x ?? 0);
  const dy = (a.y ?? 0) - (b.y ?? 0);
  return Math.hypot(dx, dy);
}

/**
 * Calculate a separation vector that nudges the unit away from neighbours that
 * are inside the desired personal space.
 *
 * @param {{x:number,y:number,radius?:number}} self - The position (and radius)
 * of the moving unit.
 * @param {Array<{x:number,y:number,radius?:number}>} neighbours - Units to
 * consider when keeping distance.
 * @param {number} personalSpace - Additional gap to maintain between radii.
 * @returns {{x:number,y:number}} A vector pointing away from nearby neighbours.
 */
export function computeSeparationVector(self, neighbours, personalSpace) {
  if (!self || !Array.isArray(neighbours) || neighbours.length === 0 || personalSpace <= 0) {
    return { x: 0, y: 0 };
  }

  const selfRadius = self.radius ?? 0;
  let totalX = 0;
  let totalY = 0;

  for (const neighbour of neighbours) {
    if (!neighbour) continue;
    const dx = (self.x ?? 0) - (neighbour.x ?? 0);
    const dy = (self.y ?? 0) - (neighbour.y ?? 0);
    const distance = Math.hypot(dx, dy);
    if (distance < EPSILON) {
      continue;
    }

    const neighbourRadius = neighbour.radius ?? 0;
    const desiredDistance = selfRadius + neighbourRadius + personalSpace;
    if (distance >= desiredDistance) {
      continue;
    }

    const weight = (desiredDistance - distance) / desiredDistance;
    const away = normalizeVector(dx, dy);
    totalX += away.x * weight;
    totalY += away.y * weight;
  }

  const result = normalizeVector(totalX, totalY);
  if (result.length <= EPSILON) {
    return { x: 0, y: 0 };
  }
  const intensity = Math.min(1, result.length);
  return { x: result.x * intensity, y: result.y * intensity };
}

/**
 * Calculate a lateral avoidance vector that biases movement to the side of any
 * blocker that sits in front of the unit.
 *
 * @param {{x:number,y:number,radius?:number}} self - The moving unit.
 * @param {Array<{x:number,y:number,radius?:number}>} blockers - Units or
 * objects that can block movement.
 * @param {{x:number,y:number}} desiredDirection - Current desired direction of
 * travel (need not be normalised).
 * @param {{x:number,y:number}} target - Location the unit is trying to reach.
 * @param {{personalSpace?:number,stepDistance?:number}} [options] - Steering
 * configuration.
 * @returns {{x:number,y:number}} A vector encouraging movement around blockers.
 */
export function computeLateralAvoidance(
  self,
  blockers,
  desiredDirection,
  target,
  options = {}
) {
  if (!self || !desiredDirection) {
    return { x: 0, y: 0 };
  }

  const direction = normalizeVector(desiredDirection.x ?? 0, desiredDirection.y ?? 0);
  if (direction.length < EPSILON) {
    return { x: 0, y: 0 };
  }

  if (!Array.isArray(blockers) || blockers.length === 0) {
    return { x: 0, y: 0 };
  }

  const personalSpace = options.personalSpace ?? 0;
  const stepDistance = Math.max(options.stepDistance ?? personalSpace ?? 1, 1);
  const selfRadius = self.radius ?? 0;

  let lateralX = 0;
  let lateralY = 0;

  for (const blocker of blockers) {
    if (!blocker) continue;
    const offsetX = (blocker.x ?? 0) - (self.x ?? 0);
    const offsetY = (blocker.y ?? 0) - (self.y ?? 0);
    const distance = Math.hypot(offsetX, offsetY);
    if (distance < EPSILON) {
      continue;
    }

    const blockerRadius = blocker.radius ?? 0;
    const avoidDistance = selfRadius + blockerRadius + personalSpace;
    if (distance >= avoidDistance) {
      continue;
    }

    const toBlocker = { x: offsetX / distance, y: offsetY / distance };
    const forwardness = direction.x * toBlocker.x + direction.y * toBlocker.y;
    if (forwardness <= 0) {
      continue; // Blocker is behind or exactly perpendicular.
    }

    const perpLeft = { x: -direction.y, y: direction.x };
    const forwardStep = {
      x: (self.x ?? 0) + direction.x * stepDistance,
      y: (self.y ?? 0) + direction.y * stepDistance
    };
    const leftStep = {
      x: forwardStep.x + perpLeft.x * stepDistance,
      y: forwardStep.y + perpLeft.y * stepDistance
    };
    const rightStep = {
      x: forwardStep.x - perpLeft.x * stepDistance,
      y: forwardStep.y - perpLeft.y * stepDistance
    };

    const leftDistance = distanceBetween(leftStep, target);
    const rightDistance = distanceBetween(rightStep, target);

    let side;
    if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance) &&
        Math.abs(leftDistance - rightDistance) > 1e-3) {
      side = leftDistance < rightDistance ? 1 : -1;
    } else {
      const cross = direction.x * offsetY - direction.y * offsetX;
      side = cross >= 0 ? -1 : 1;
    }

    const intensity = ((avoidDistance - distance) / avoidDistance) * forwardness;
    lateralX += perpLeft.x * side * intensity;
    lateralY += perpLeft.y * side * intensity;
  }

  const result = normalizeVector(lateralX, lateralY);
  if (result.length <= EPSILON) {
    return { x: 0, y: 0 };
  }
  const magnitude = Math.min(1, result.length);
  return { x: result.x * magnitude, y: result.y * magnitude };
}

export default {
  computeSeparationVector,
  computeLateralAvoidance
};
