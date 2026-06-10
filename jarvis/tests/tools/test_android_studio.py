"""Tests for Android Studio specialized tools."""

from __future__ import annotations

import pytest

from jarvis.tools.android_studio import register_android_studio_tools
from jarvis.tools.registry import Registry


@pytest.fixture
def android_registry():
    from jarvis.security.gate import SecurityGate
    from jarvis.security.permissions import PermissionService

    gate = SecurityGate(
        PermissionService(["dev.generate"]),
        None,
        None,
    )
    reg = Registry(gate)
    register_android_studio_tools(reg)
    return reg


@pytest.mark.asyncio
async def test_generate_kotlin_file(android_registry) -> None:
    tool = android_registry._tools["generate_kotlin_file"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "UserRepository",
        "kind": "class",
        "imports": ["kotlinx.coroutines.flow.Flow"],
        "properties": [{"visibility": "private", "mutable": "val", "name": "api", "type": "ApiService"}],
        "functions": [{"visibility": "public", "name": "getUsers", "params": "", "return_type": "Flow<List<User>>", "body": "return api.getUsers()"}],
    })
    assert "package com.example.app" in code
    assert "class UserRepository" in code
    assert "private val api: ApiService" in code
    assert "fun getUsers(): Flow<List<User>>" in code


@pytest.mark.asyncio
async def test_generate_compose_screen(android_registry) -> None:
    tool = android_registry._tools["generate_compose_screen"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "Login",
        "title": "Login",
        "viewModel": "LoginViewModel",
        "stateType": "LoginState",
        "fields": [{"name": "email", "label": "Email"}, {"name": "password", "label": "Password"}],
    })
    assert "@Composable" in code
    assert "LoginScreen" in code
    assert "OutlinedTextField" in code
    assert "hiltViewModel" in code


@pytest.mark.asyncio
async def test_generate_room_entity(android_registry) -> None:
    tool = android_registry._tools["generate_room_entity"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "User",
        "table": "users",
        "columns": [{"name": "email", "type": "String"}, {"name": "age", "type": "Int", "default": "0"}],
    })
    assert "@Entity(tableName = \"users\")" in code
    assert "data class User" in code
    assert "val email: String" in code
    assert "val age: Int = 0" in code


@pytest.mark.asyncio
async def test_generate_retrofit_service(android_registry) -> None:
    tool = android_registry._tools["generate_retrofit_service"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "User",
        "endpoint": "users",
        "responseType": "UserResponse",
        "requestType": "UserRequest",
        "entity": "User",
    })
    assert "interface UserService" in code
    assert '@GET("users")' in code
    assert "@POST" in code


@pytest.mark.asyncio
async def test_generate_hilt_module(android_registry) -> None:
    tool = android_registry._tools["generate_hilt_module"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "Network",
        "service": "UserService",
    })
    assert "@Module" in code
    assert "@InstallIn(SingletonComponent::class)" in code
    assert "fun provideUserService" in code


@pytest.mark.asyncio
async def test_generate_mvvm_viewmodel(android_registry) -> None:
    tool = android_registry._tools["generate_mvvm_viewmodel"]
    code = await tool[1]({
        "package": "com.example.app",
        "name": "Login",
        "repository": "LoginRepository",
    })
    assert "@HiltViewModel" in code
    assert "class LoginViewModel" in code
    assert "StateFlow<LoginState>" in code
    assert "viewModelScope.launch" in code


@pytest.mark.asyncio
async def test_specs_registered(android_registry) -> None:
    names = {s.name for s in android_registry.specs()}
    assert "generate_kotlin_file" in names
    assert "generate_compose_screen" in names
    assert "generate_room_entity" in names
    assert "generate_retrofit_service" in names
    assert "generate_hilt_module" in names
    assert "generate_mvvm_viewmodel" in names
