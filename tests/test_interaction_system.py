from tests.js_runner import run_js_expression, run_js_expect_error

INTERACTION_IMPORTS = [
    "import InteractionPayload from './src/systems/interaction/interactionPayload.js';",
    "import { InteractionResult } from './src/systems/interaction/interactionResult.js';",
    "import { InteractionSystem } from './src/systems/interaction/interactionSystem.js';",
    "import { Call } from './src/systems/calls.js';",
]


def test_interaction_payload_validates_arguments():
    completed = run_js_expect_error(
        "new InteractionPayload({}, 1, true);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'call must be null or an instance of Call' in completed.stderr

    completed = run_js_expect_error(
        "new InteractionPayload(null, 'bad', true);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'value must be a number' in completed.stderr

    completed = run_js_expect_error(
        "new InteractionPayload(null, 1, 'bad');",
        imports=INTERACTION_IMPORTS,
    )
    assert 'offensive must be a boolean' in completed.stderr


def test_interaction_payload_allows_null_call():
    result = run_js_expression(
        "({ call: payload.call, value: payload.value, offensive: payload.offensive })",
        imports=INTERACTION_IMPORTS,
        prelude="const payload = new InteractionPayload(null, 5, true);",
    )
    assert result == {'call': None, 'value': 5, 'offensive': True}


def test_interaction_result_validates_arguments():
    completed = run_js_expect_error(
        "new InteractionResult('bad', true);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'valueRecieved must be a number' in completed.stderr

    completed = run_js_expect_error(
        "new InteractionResult(1, 'bad');",
        imports=INTERACTION_IMPORTS,
    )
    assert 'callTaken must be a boolean' in completed.stderr


def test_interaction_system_interact_returns_result():
    prelude = """
    const sourceUnit = { recieveInteraction() { throw new Error('source should not receive'); } };
    const targetUnit = {
      logs: [],
      recieveInteraction(payload) {
        this.logs.push(payload.value);
        return new InteractionResult(payload.value * 2, true);
      }
    };
    const payload = new InteractionPayload(null, 3, true);
    const outcome = InteractionSystem.interact(sourceUnit, targetUnit, payload);
    """
    result = run_js_expression(
        "({ value: outcome.valueRecieved, callTaken: outcome.callTaken, log: targetUnit.logs })",
        imports=INTERACTION_IMPORTS,
        prelude=prelude,
    )
    assert result == {'value': 6, 'callTaken': True, 'log': [3]}


def test_interaction_system_requires_unit_like_objects():
    completed = run_js_expect_error(
        "const payload = new InteractionPayload(null, 1, true);\nInteractionSystem.interact({}, { recieveInteraction() { return new InteractionResult(0, false); } }, payload);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'sourceUnit must provide a recieveInteraction' in completed.stderr

    completed = run_js_expect_error(
        "const payload = new InteractionPayload(null, 1, true);\nInteractionSystem.interact({ recieveInteraction() { return new InteractionResult(0, false); } }, {}, payload);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'targetUnit must provide a recieveInteraction' in completed.stderr


def test_interaction_system_requires_interaction_result():
    completed = run_js_expect_error(
        "const payload = new InteractionPayload(null, 1, true);\nInteractionSystem.interact({ recieveInteraction() { return new InteractionResult(0, false); } }, { recieveInteraction() { return {}; } }, payload);",
        imports=INTERACTION_IMPORTS,
    )
    assert 'Interactions must return an InteractionResult' in completed.stderr
