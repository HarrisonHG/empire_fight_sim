import json
import math

import pytest

from tests.js_runner import run_js_expression, run_js_expect_error

MODULE_IMPORT = "import { createRelationshipMap, assertValidRelationship, calculateClosestPoint } from './src/entities/teamUtils.js';"


def test_create_relationship_map_initialises_self_as_ally():
    result = run_js_expression("createRelationshipMap('Wintermark')", imports=[MODULE_IMPORT])
    assert result == {'Wintermark': 'ally'}


def test_create_relationship_map_rejects_blank_team_name():
    completed = run_js_expect_error("createRelationshipMap('');", imports=[MODULE_IMPORT])
    assert 'teamName must be a non-empty string' in completed.stderr


def test_assert_valid_relationship_accepts_known_value():
    result = run_js_expression("assertValidRelationship('enemy')", imports=[MODULE_IMPORT])
    assert result == 'enemy'


def test_assert_valid_relationship_rejects_unknown_value():
    completed = run_js_expect_error("assertValidRelationship('bestie');", imports=[MODULE_IMPORT])
    assert 'Invalid relationship' in completed.stderr


def test_calculate_closest_point_returns_expected_point():
    points = [
        {'name': 'north', 'x': 10, 'y': 100},
        {'name': 'south', 'x': 10, 'y': -20},
        {'name': 'home', 'x': 0, 'y': 0},
    ]
    result = run_js_expression(
        f"calculateClosestPoint(5, -5, {json.dumps(points)})",
        imports=[MODULE_IMPORT],
    )
    assert result['point']['name'] == 'home'
    assert result['distance'] == pytest.approx((5**2 + 5**2) ** 0.5)


def test_calculate_closest_point_handles_empty_collection():
    result = run_js_expression(
        "calculateClosestPoint(0, 0, [])",
        imports=[MODULE_IMPORT],
    )
    assert result['point'] is None
    assert math.isinf(result['distance'])


def test_calculate_closest_point_skips_malformed_entries():
    points = [
        None,
        {'name': 'bad'},
        {'name': 'usable', 'x': 1, 'y': 1},
    ]
    result = run_js_expression(
        f"calculateClosestPoint(0, 0, {json.dumps(points)})",
        imports=[MODULE_IMPORT],
    )
    assert result['point']['name'] == 'usable'
