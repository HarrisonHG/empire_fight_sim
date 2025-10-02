# Codebase Review

This repository already contains the foundations of an Empire LARP fight simulator, but a few structural adjustments will make it easier to extend and maintain.

## Architecture

- **Tight coupling to Phaser:** Core game rules (relationships between teams, distance calculations, etc.) live inside Phaser classes. This makes it hard to test or reuse them without a rendering context. Extracting lightweight utility modules (for example, the new `teamUtils.js`) lets us verify behavioural rules without spinning up the game engine.
- **Randomised constructor state:** `Unit` builds a random equipment and armour loadout in its constructor. Randomness in constructors hinders deterministic simulations and automated testing. Consider injecting RNG utilities or providing explicit configuration objects so tests (and future balancing tools) can control state.
- **Inconsistent error handling:** Several systems throw generic `Error` instances with terse messages. Standardising these into domain-specific errors will make debugging easier and allow the UI to respond more gracefully.
- **Constructor hygiene:** While reviewing the combat systems we found multiple constructors that either ignored parameters or left dependent objects in an unusable state (e.g. `Call` dropped the `category` field and `Unit` never persisted its `size`, so armour could not scale correctly). Strengthening invariants and validating arguments inside constructors prevents these latent bugs from resurfacing during gameplay.

## Documentation

- Most files include docstrings, but the high-level README still reads like a brainstorming document. Converting the TODO items into roadmap issues (or a `docs/roadmap.md`) would help collaborators understand the current priorities.
- The new utilities module demonstrates an approach for documenting invariants (e.g., relationship validation). Mirroring that style for the decision-making system would clarify many open TODOs.

## Testing

- Before these changes there were no automated tests. The new `pytest` suite demonstrates how to run integrity checks against ESM modules via Node. Extending this approach to other pure-logic subsystems (calls, status effects, respawn logic) would quickly expand coverage without needing a browser.
- Continuous integration was missing. The GitHub Actions workflow now installs Python/Node dependencies and executes the pytest suite on every pull request.
- Validation logic now exists for calls, interaction payloads, and interaction results, and the accompanying regression tests highlight how to exercise these modules without instantiating Phaser scenes. Continue this pattern for other exported APIs so that every public contract has direct coverage.

## Next Steps

1. Isolate additional deterministic logic into utility modules (e.g., stance/action state machines) to enable headless testing.
2. Introduce configuration-driven unit loadouts to remove ad-hoc random rolls from constructors.
3. Expand tests to cover interaction payload validation and ensure future refactors cannot regress combat rules.
4. Audit remaining constructors (equipment, scenes, AI state machines) to confirm they validate parameters and preserve critical properties needed by collaborators.
5. Replace ad-hoc console debugging with structured logging utilities so automated tests can assert on side-effects without parsing stdout.
