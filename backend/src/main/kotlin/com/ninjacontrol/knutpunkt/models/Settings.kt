package com.ninjacontrol.knutpunkt.models

import kotlinx.serialization.Serializable

@Serializable
data class Setting(
    val key: String,
    val value: String,
    val description: String? = null
)

@Serializable
data class SettingsResponse(
    val settings: List<Setting>
)
