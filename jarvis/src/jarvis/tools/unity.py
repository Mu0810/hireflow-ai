"""Unity specialized tool module.

Generates C# scripts for game systems (inventory, NPC, quest, farming, economy,
AI) using Jinja2 templates.
"""

from __future__ import annotations

from jinja2 import Template

from ..core.errors import ToolError
from .registry import Registry, tool_spec


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
_CSHARP_SCRIPT = Template(
    """using System.Collections;
using System.Collections.Generic;
using UnityEngine;

{{ visibility }} class {{ name }} : {{ base }} {
    {% for field in fields %}
    [SerializeField]
    private {{ field.type }} {{ field.name }};
    {% endfor %}

    void Start() {
        {{ start_body | indent(8) }}
    }

    void Update() {
        {{ update_body | indent(8) }}
    }

    {% for method in methods %}
    {{ method.visibility }} {{ method.return_type }} {{ method.name }}({{ method.params }}) {
        {{ method.body | indent(8) }}
    }
    {% endfor %}
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_INVENTORY_SYSTEM = Template(
    """using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class InventoryItem {
    public string itemId;
    public string displayName;
    public int quantity;
    public int maxStack;
}

public class InventorySystem : MonoBehaviour {
    [SerializeField] private List<InventoryItem> items = new();

    public event Action OnInventoryChanged;

    public bool AddItem(string itemId, string displayName, int quantity = 1, int maxStack = 99) {
        var existing = items.Find(i => i.itemId == itemId);
        if (existing != null && existing.quantity + quantity <= existing.maxStack) {
            existing.quantity += quantity;
            OnInventoryChanged?.Invoke();
            return true;
        }
        items.Add(new InventoryItem {
            itemId = itemId,
            displayName = displayName,
            quantity = quantity,
            maxStack = maxStack,
        });
        OnInventoryChanged?.Invoke();
        return true;
    }

    public bool RemoveItem(string itemId, int quantity = 1) {
        var existing = items.Find(i => i.itemId == itemId);
        if (existing == null || existing.quantity < quantity) return false;
        existing.quantity -= quantity;
        if (existing.quantity <= 0) items.Remove(existing);
        OnInventoryChanged?.Invoke();
        return true;
    }

    public int GetQuantity(string itemId) {
        var existing = items.Find(i => i.itemId == itemId);
        return existing?.quantity ?? 0;
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_NPC_SYSTEM = Template(
    """using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

public class NPCController : MonoBehaviour {
    [SerializeField] private string npcName = "NPC";
    [SerializeField] private float walkSpeed = 3.5f;
    [SerializeField] private float detectionRadius = 10f;

    private NavMeshAgent agent;
    private Transform player;

    public enum NPCState { Idle, Walking, Talking, Working }
    public NPCState CurrentState { get; private set; } = NPCState.Idle;

    void Start() {
        agent = GetComponent<NavMeshAgent>();
        agent.speed = walkSpeed;
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    void Update() {
        if (player == null) return;
        float distance = Vector3.Distance(transform.position, player.position);
        if (distance <= detectionRadius && CurrentState != NPCState.Talking) {
            agent.SetDestination(player.position);
            CurrentState = NPCState.Walking;
        }
    }

    public void Talk() {
        CurrentState = NPCState.Talking;
        Debug.Log($"{npcName}: Hello, traveler!");
    }

    public void AssignTask(Vector3 destination) {
        agent.SetDestination(destination);
        CurrentState = NPCState.Working;
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_QUEST_SYSTEM = Template(
    """using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class Quest {
    public string questId;
    public string title;
    public string description;
    public bool isCompleted;
    public List<QuestObjective> objectives = new();
}

[Serializable]
public class QuestObjective {
    public string objectiveId;
    public string description;
    public int requiredAmount;
    public int currentAmount;
    public bool IsComplete => currentAmount >= requiredAmount;
}

public class QuestManager : MonoBehaviour {
    [SerializeField] private List<Quest> activeQuests = new();
    [SerializeField] private List<Quest> completedQuests = new();

    public event Action<Quest> OnQuestCompleted;

    public void StartQuest(Quest quest) {
        activeQuests.Add(quest);
    }

    public void UpdateObjective(string questId, string objectiveId, int amount = 1) {
        var quest = activeQuests.Find(q => q.questId == questId);
        if (quest == null) return;
        var obj = quest.objectives.Find(o => o.objectiveId == objectiveId);
        if (obj == null) return;
        obj.currentAmount += amount;
        CheckQuestCompletion(quest);
    }

    private void CheckQuestCompletion(Quest quest) {
        if (quest.objectives.TrueForAll(o => o.IsComplete)) {
            quest.isCompleted = true;
            activeQuests.Remove(quest);
            completedQuests.Add(quest);
            OnQuestCompleted?.Invoke(quest);
        }
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_FARMING_SYSTEM = Template(
    """using System.Collections;
using UnityEngine;

public class FarmingSystem : MonoBehaviour {
    [SerializeField] private float growthSpeed = 1f;
    [SerializeField] private GameObject cropPrefab;

    public void PlantCrop(Vector3 position) {
        Instantiate(cropPrefab, position, Quaternion.identity);
    }

    public void HarvestCrop(GameObject crop) {
        Destroy(crop);
    }

    public void WaterCrop(GameObject crop) {
        crop.transform.localScale *= 1.1f;
    }

    public void FertilizeCrop(GameObject crop) {
        growthSpeed *= 1.5f;
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_ECONOMY_SYSTEM = Template(
    """using System;
using UnityEngine;

public class EconomySystem : MonoBehaviour {
    [SerializeField] private float playerGold = 100f;
    [SerializeField] private float inflationRate = 0.02f;

    public event Action<float> OnGoldChanged;

    public bool CanAfford(float amount) => playerGold >= amount;

    public bool Spend(float amount) {
        if (!CanAfford(amount)) return false;
        playerGold -= amount;
        OnGoldChanged?.Invoke(playerGold);
        return true;
    }

    public void Earn(float amount) {
        playerGold += amount;
        OnGoldChanged?.Invoke(playerGold);
    }

    public void ApplyInflation() {
        playerGold *= (1f - inflationRate);
        OnGoldChanged?.Invoke(playerGold);
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_AI_SYSTEM = Template(
    """using UnityEngine;
using UnityEngine.AI;

public class AIEnemy : MonoBehaviour {
    [SerializeField] private float detectionRange = 15f;
    [SerializeField] private float attackRange = 2f;
    [SerializeField] private float moveSpeed = 5f;

    private NavMeshAgent agent;
    private Transform player;
    private AIState currentState = AIState.Patrol;

    public enum AIState { Patrol, Chase, Attack, Retreat }

    void Start() {
        agent = GetComponent<NavMeshAgent>();
        agent.speed = moveSpeed;
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
    }

    void Update() {
        if (player == null) return;
        float distance = Vector3.Distance(transform.position, player.position);
        currentState = distance switch {
            > detectionRange => AIState.Patrol,
            > attackRange => AIState.Chase,
            _ => AIState.Attack,
        };
        ExecuteState(distance);
    }

    private void ExecuteState(float distance) {
        switch (currentState) {
            case AIState.Patrol:
                // TODO: patrol logic
                break;
            case AIState.Chase:
                agent.SetDestination(player.position);
                break;
            case AIState.Attack:
                agent.isStopped = true;
                Debug.Log("Attacking player!");
                break;
        }
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------
def register_unity_tools(registry: Registry) -> None:
    async def generate_csharp_script(args: dict) -> str:
        try:
            code = _CSHARP_SCRIPT.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_inventory_system(_args: dict) -> str:
        return _INVENTORY_SYSTEM.render()

    async def generate_npc_system(_args: dict) -> str:
        return _NPC_SYSTEM.render()

    async def generate_quest_system(_args: dict) -> str:
        return _QUEST_SYSTEM.render()

    async def generate_farming_system(_args: dict) -> str:
        return _FARMING_SYSTEM.render()

    async def generate_economy_system(_args: dict) -> str:
        return _ECONOMY_SYSTEM.render()

    async def generate_ai_system(_args: dict) -> str:
        return _AI_SYSTEM.render()

    registry.register(
        tool_spec(
            "generate_csharp_script",
            "Generate a basic C# MonoBehaviour script for Unity.",
            {"type": "object", "properties": {"name": {"type": "string"}, "base": {"type": "string", "default": "MonoBehaviour"}}, "required": ["name"]},
            capability="dev.generate",
        ),
        generate_csharp_script,
    )
    registry.register(
        tool_spec(
            "generate_inventory_system",
            "Generate a complete C# inventory system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_inventory_system,
    )
    registry.register(
        tool_spec(
            "generate_npc_system",
            "Generate a complete C# NPC controller system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_npc_system,
    )
    registry.register(
        tool_spec(
            "generate_quest_system",
            "Generate a complete C# quest manager system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_quest_system,
    )
    registry.register(
        tool_spec(
            "generate_farming_system",
            "Generate a complete C# farming system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_farming_system,
    )
    registry.register(
        tool_spec(
            "generate_economy_system",
            "Generate a complete C# economy system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_economy_system,
    )
    registry.register(
        tool_spec(
            "generate_ai_system",
            "Generate a complete C# AI enemy system for Unity.",
            {"type": "object", "properties": {}},
            capability="dev.generate",
        ),
        generate_ai_system,
    )
