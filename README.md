# empire_fight_sim

A web-based fight simulator using empire larp fight rules

# TODO

1. X Create a team entity that units can be part of.
    - This will determine respawn rate, location, colour, allies, enemies.
2. Spawn units on 1+click, 2+click etc.
3. Move units towards enemy teams.
4. Introduce HP.
5. Introduce "Action" obj. Start with attack, which is just hit unit within range.
6. Introduce dying and dead status.
7. Handle team respawning and introduce respawn points.
8. Put in graphics for HP (<75%, <50%, <25%), faces for action.
9. Put in graphic and animation for attack.

What do?

Goal - Mission statement for the battle.
    - Is this one needed?

Stance - A desired action and what actions are needed to achieve it
    - Relax
        - Actions: move, stand
        - Good: Regain morale, Regain stamina
        - Bad: Low defence rate, movespeed low
    - Hunt
        - Actions: ChooseTarget (lonely unit within range), move, attack
        - Good: Effective targetting
        - Bad: Time consuming
    - Harass
        - Actions: move, attack, counter
        - Good: None
        - Bad: None
    - Surround
        - Actions: ChooseTarget (Nearest untargetted enemy), move, attack
        - Good: Effective targetting
        - Bad: High stamina cost
    - Charge
        - Actions: move, attack
        - Good: movespeed high, Multi-attack
        - Bad: High stamina cost
    - Defend
        - Actions: move, shield, counter
        - Good: High defend rate
        - Bad: Low attack rate, slow movespeed
    - Rally
        - Actions: ChooseTarget (Banner or highest ranking ally), move, stand
        - Good: Regain morale
        - Bad: low attack rate
    - Heal
        - Actions: ChooseTarget(down ally), move, < physick actions >
        - Good: Regain morale, low stamina usage
        - Bad: near-zero defence rate, near-zero attack rate
    - Retreat
        - Actions: move
        - Good: Fast movespeed
        - Bad: high stamina cost, near-zero defence rate, near-zero attack rate

Action - A series of motions used to create a neutral-to-neutral sequence
    - ChooseTarget
    - Attack
    - Move
    - Save
    - Shield
    - Chirurgeon
    - PhysickHerb
    - PhysickLimb
    - PhysickTrauma
    - Counter
    - Spell
    - Stand

Motion - Individual movements that make up actions
    - Target
    - Move
    - Strike
    - Shoot
    - PickUp
    - Unequip
    - Equip
    - Consume
    - Channel (spell/healing/etc)
    - WindUp (Hero stuff)
    - Nothing
