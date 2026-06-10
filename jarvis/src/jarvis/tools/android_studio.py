"""Android Studio specialized tool module.

Generates Kotlin code, Jetpack Compose UI, Room entities, Retrofit services,
Hilt modules, and MVVM scaffolding using Jinja2 templates.
"""

from __future__ import annotations

from jinja2 import Template

from ..core.errors import ToolError
from .registry import Registry, tool_spec


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
_KOTLIN_FILE = Template(
    """package {{ package }}

{% for imp in imports %}
import {{ imp }}
{% endfor %}

{{ annotations | join('\n') }}
{{ visibility }} {{ kind }} {{ name }}{% if super %} : {{ super }}{% endif %} {
    {% for p in properties %}
    {{ p.visibility }} {{ p.mutable }} {{ p.name }}: {{ p.type }}{% if p.default %} = {{ p.default }}{% endif %}
    {% endfor %}

    {% for f in functions %}
    {{ f.visibility }} fun {{ f.name }}({{ f.params }}): {{ f.return_type }} {
        {{ f.body | indent(8) }}
    }
    {% endfor %}
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_COMPOSE_SCREEN = Template(
    """package {{ package }}

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun {{ name }}Screen(
    modifier: Modifier = Modifier,
    viewModel: {{ viewModel }} = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    {{ name }}Content(
        state = state,
        modifier = modifier,
    )
}

@Composable
private fun {{ name }}Content(
    state: {{ stateType }},
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "{{ title }}",
            style = MaterialTheme.typography.headlineMedium,
        )
        {% for field in fields %}
        OutlinedTextField(
            value = state.{{ field.name }},
            onValueChange = { /* TODO */ },
            label = { Text("{{ field.label }}") },
            modifier = Modifier.fillMaxWidth(),
        )
        {% endfor %}
        Button(
            onClick = { /* TODO */ },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Submit")
        }
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_ROOM_ENTITY = Template(
    """package {{ package }}

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "{{ table }}")
data class {{ name }}(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    {% for col in columns %}
    val {{ col.name }}: {{ col.type }}{% if col.default %} = {{ col.default }}{% endif %},
    {% endfor %}
)
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_RETROFIT_SERVICE = Template(
    """package {{ package }}

import retrofit2.http.*
import retrofit2.Response

interface {{ name }}Service {
    @GET("{{ endpoint }}")
    suspend fun get{{ entity }}(): Response<{{ responseType }}>

    @POST("{{ endpoint }}")
    suspend fun create{{ entity }}(
        @Body request: {{ requestType }},
    ): Response<{{ responseType }}>
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_HILT_MODULE = Template(
    """package {{ package }}

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object {{ name }}Module {
    @Provides
    @Singleton
    fun provide{{ service }}(
        // dependencies
    ): {{ service }} {
        return {{ service }}Impl()
    }
}
""",
    trim_blocks=True,
    lstrip_blocks=True,
)

_MVVM_VIEWMODEL = Template(
    """package {{ package }}

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class {{ name }}State(
    val isLoading: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class {{ name }}ViewModel @Inject constructor(
    private val repository: {{ repository }},
) : ViewModel() {

    private val _state = MutableStateFlow({{ name }}State())
    val state: StateFlow<{{ name }}State> = _state

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                // TODO: fetch data
                _state.value = _state.value.copy(isLoading = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
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
def register_android_studio_tools(registry: Registry) -> None:
    async def generate_kotlin_file(args: dict) -> str:
        try:
            code = _KOTLIN_FILE.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_compose_screen(args: dict) -> str:
        try:
            code = _COMPOSE_SCREEN.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_room_entity(args: dict) -> str:
        try:
            code = _ROOM_ENTITY.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_retrofit_service(args: dict) -> str:
        try:
            code = _RETROFIT_SERVICE.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_hilt_module(args: dict) -> str:
        try:
            code = _HILT_MODULE.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    async def generate_mvvm_viewmodel(args: dict) -> str:
        try:
            code = _MVVM_VIEWMODEL.render(**args)
            return code
        except Exception as exc:
            raise ToolError(f"Template render failed: {exc}") from exc

    registry.register(
        tool_spec(
            "generate_kotlin_file",
            "Generate a Kotlin class or object file from a template.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "kind": {"type": "string"}}, "required": ["package", "name", "kind"]},
            capability="dev.generate",
        ),
        generate_kotlin_file,
    )
    registry.register(
        tool_spec(
            "generate_compose_screen",
            "Generate a Jetpack Compose screen with Material3 and ViewModel.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "title": {"type": "string"}}, "required": ["package", "name", "title"]},
            capability="dev.generate",
        ),
        generate_compose_screen,
    )
    registry.register(
        tool_spec(
            "generate_room_entity",
            "Generate a Room @Entity data class.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "table": {"type": "string"}}, "required": ["package", "name", "table"]},
            capability="dev.generate",
        ),
        generate_room_entity,
    )
    registry.register(
        tool_spec(
            "generate_retrofit_service",
            "Generate a Retrofit service interface.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "endpoint": {"type": "string"}}, "required": ["package", "name", "endpoint"]},
            capability="dev.generate",
        ),
        generate_retrofit_service,
    )
    registry.register(
        tool_spec(
            "generate_hilt_module",
            "Generate a Hilt Dagger @Module.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "service": {"type": "string"}}, "required": ["package", "name", "service"]},
            capability="dev.generate",
        ),
        generate_hilt_module,
    )
    registry.register(
        tool_spec(
            "generate_mvvm_viewmodel",
            "Generate an MVVM ViewModel with StateFlow and Hilt.",
            {"type": "object", "properties": {"package": {"type": "string"}, "name": {"type": "string"}, "repository": {"type": "string"}}, "required": ["package", "name", "repository"]},
            capability="dev.generate",
        ),
        generate_mvvm_viewmodel,
    )
