from tests.js_runner import run_js_expression, run_js_expect_error

CALLS_IMPORT = "import { Call, CALLS } from './src/systems/calls.js';"


def test_call_constructor_sets_expected_properties():
    prelude = "const call = new Call('Test', 'Desc', 'Heroic', 2, 5, 10);"
    result = run_js_expression(
        "({ name: call.name, description: call.description, category: call.category, castingTime: call.castingTime, duration: call.duration, value: call.value })",
        imports=[CALLS_IMPORT],
        prelude=prelude,
    )
    assert result == {
        'name': 'Test',
        'description': 'Desc',
        'category': 'Heroic',
        'castingTime': 2,
        'duration': 5,
        'value': 10,
    }


def test_call_constructor_validates_inputs():
    completed = run_js_expect_error(
        "new Call('', 'Desc', 'Heroic', 0, 0, 0);",
        imports=[CALLS_IMPORT],
    )
    assert 'Call name must be a non-empty string' in completed.stderr


def test_calls_catalog_contains_expected_entries():
    result = run_js_expression(
        "({ cleave: CALLS.CLEAVE.name, impaleCasting: CALLS.IMPALE.castingTime, strikeCategory: CALLS.STRIKEDOWN.category })",
        imports=[CALLS_IMPORT],
    )
    assert result == {
        'cleave': 'Cleave',
        'impaleCasting': 1,
        'strikeCategory': 'Heroic',
    }


def test_calls_are_unique_instances():
    result = run_js_expression(
        "CALLS.CLEAVE !== CALLS.IMPALE",
        imports=[CALLS_IMPORT],
    )
    assert result is True
