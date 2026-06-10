"""Tests for Unity specialized tools."""

from __future__ import annotations

import pytest

from jarvis.tools.registry import Registry
from jarvis.tools.unity import register_unity_tools


@pytest.fixture
def unity_registry():
    from jarvis.security.gate import SecurityGate
    from jarvis.security.permissions import PermissionService

    gate = SecurityGate(
        PermissionService(["dev.generate"]),
        None,
        None,
    )
    reg = Registry(gate)
    register_unity_tools(reg)
    return reg


@pytest.mark.asyncio
async def test_generate_csharp_script(unity_registry) -> None:
    tool = unity_registry._tools["generate_csharp_script"]
    code = await tool[1]({
        "name": "PlayerController",
        "base": "MonoBehaviour",
        "visibility": "public",
        "fields": [{"type": "float", "name": "speed"}, {"type": "Rigidbody", "name": "rb"}],
        "start_body": "rb = GetComponent<Rigidbody>();",
        "update_body": "float move = Input.GetAxis(\"Horizontal\");",
        "methods": [],
    })
    assert "public class PlayerController : MonoBehaviour" in code
    assert "[SerializeField]" in code
    assert "private float speed;" in code
    assert "void Start()" in code
    assert "void Update()" in code


@pytest.mark.asyncio
async def test_generate_inventory_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_inventory_system"]
    code = await tool[1]({})
    assert "class InventorySystem" in code
    assert "public class InventoryItem" in code
    assert "AddItem" in code
    assert "RemoveItem" in code
    assert "GetQuantity" in code


@pytest.mark.asyncio
async def test_generate_npc_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_npc_system"]
    code = await tool[1]({})
    assert "class NPCController" in code
    assert "enum NPCState" in code
    assert "Talk()" in code
    assert "AssignTask" in code


@pytest.mark.asyncio
async def test_generate_quest_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_quest_system"]
    code = await tool[1]({})
    assert "class QuestManager" in code
    assert "class Quest" in code
    assert "class QuestObjective" in code
    assert "OnQuestCompleted" in code


@pytest.mark.asyncio
async def test_generate_farming_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_farming_system"]
    code = await tool[1]({})
    assert "class FarmingSystem" in code
    assert "PlantCrop" in code
    assert "HarvestCrop" in code


@pytest.mark.asyncio
async def test_generate_economy_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_economy_system"]
    code = await tool[1]({})
    assert "class EconomySystem" in code
    assert "CanAfford" in code
    assert "Spend" in code
    assert "ApplyInflation" in code


@pytest.mark.asyncio
async def test_generate_ai_system(unity_registry) -> None:
    tool = unity_registry._tools["generate_ai_system"]
    code = await tool[1]({})
    assert "class AIEnemy" in code
    assert "enum AIState" in code
    assert "ExecuteState" in code
    assert "NavMeshAgent" in code


@pytest.mark.asyncio
async def test_specs_registered(unity_registry) -> None:
    names = {s.name for s in unity_registry.specs()}
    assert "generate_csharp_script" in names
    assert "generate_inventory_system" in names
    assert "generate_npc_system" in names
    assert "generate_quest_system" in names
    assert "generate_farming_system" in names
    assert "generate_economy_system" in names
    assert "generate_ai_system" in names
