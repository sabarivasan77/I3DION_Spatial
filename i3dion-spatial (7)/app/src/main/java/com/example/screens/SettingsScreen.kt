package com.example.screens

import androidx.compose.ui.draw.clip

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.viewmodel.CatalogViewModel

@Composable
fun SettingsScreen(
    viewModel: CatalogViewModel,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var isDarkState by remember { mutableStateOf(viewModel.sessionManager.isDarkMode) }
    var isNotifsEnabled by remember { mutableStateOf(viewModel.sessionManager.notificationsEnabled) }
    var languageState by remember { mutableStateOf(viewModel.sessionManager.selectedLanguage) }

    var showLanguageDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .testTag("settings_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    text = "System Settings",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            // Options List
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .verticalScroll(scrollState),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "INTERFACE & PREFERENCES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    letterSpacing = 1.5.sp
                )

                // Theme selection
                SettingsSwitchRow(
                    icon = Icons.Default.DarkMode,
                    label = "System Dark Theme",
                    description = "Optimizes for extreme contrast in low-light fields",
                    checked = isDarkState,
                    onCheckedChange = {
                        isDarkState = it
                        viewModel.sessionManager.isDarkMode = it
                        Toast.makeText(context, "Theme changes saved", Toast.LENGTH_SHORT).show()
                    },
                    tag = "setting_dark_theme_switch"
                )

                // Language selection
                SettingsClickRow(
                    icon = Icons.Default.Language,
                    label = "Language Selection",
                    value = languageState,
                    onClick = { showLanguageDialog = true },
                    tag = "setting_language_row"
                )

                // Notifications Toggle
                SettingsSwitchRow(
                    icon = Icons.Default.Notifications,
                    label = "Real-time Notifications",
                    description = "Alert when background model downloads complete",
                    checked = isNotifsEnabled,
                    onCheckedChange = {
                        isNotifsEnabled = it
                        viewModel.sessionManager.notificationsEnabled = it
                    },
                    tag = "setting_notif_switch"
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "CACHE & DATA MANAGEMENT",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    letterSpacing = 1.5.sp
                )

                // Clear Cache
                SettingsClickRow(
                    icon = Icons.Default.DeleteSweep,
                    label = "Clear Downloads Content",
                    value = "Wipe all",
                    onClick = {
                        viewModel.clearAllDownloadedCache()
                        Toast.makeText(context, "All downloaded offline GLB caches wiped successfully.", Toast.LENGTH_LONG).show()
                    },
                    tag = "setting_clear_downloads"
                )

                // Privacy settings
                SettingsClickRow(
                    icon = Icons.Default.PrivacyTip,
                    label = "Privacy & Policy Guidelines",
                    value = "Read doc",
                    onClick = { showPrivacyDialog = true },
                    tag = "setting_privacy"
                )
            }
        }

        // LANGUAGE SELECTION DIALOG
        if (showLanguageDialog) {
            val languages = listOf("English", "Spanish/Español", "German/Deutsch", "French/Français", "Japanese/日本語")
            AlertDialog(
                onDismissRequest = { showLanguageDialog = false },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                title = { Text("Select Portal Language", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        languages.forEach { lang ->
                            Surface(
                                color = if (lang.startsWith(languageState)) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else Color.Transparent,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        languageState = lang.substringBefore("/")
                                        viewModel.sessionManager.selectedLanguage = languageState
                                        showLanguageDialog = false
                                        Toast.makeText(context, "Language switched to $languageState", Toast.LENGTH_SHORT).show()
                                    }
                                    .padding(vertical = 12.dp, horizontal = 16.dp)
                            ) {
                                Text(text = lang, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                },
                confirmButton = {}
            )
        }

        // PRIVACY SETTINGS POPUP
        if (showPrivacyDialog) {
            AlertDialog(
                onDismissRequest = { showPrivacyDialog = false },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                title = { Text("Privacy & Security Protocols", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "By deploying models on I3DION Spatial, environmental scan data processed during camera-view localization remains isolated on your physical device. No spatial grids or points are transmitted to cloud registries.",
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                        Text(
                            text = "Models cached offline are sandboxed inside standard app storage registries.",
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                    }
                },
                confirmButton = {
                    Button(onClick = { showPrivacyDialog = false }) {
                        Text("Acknowledged")
                    }
                }
            )
        }
    }
}

@Composable
fun SettingsSwitchRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    tag: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 1.dp, shape = RoundedCornerShape(12.dp), clip = false)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
            .padding(16.dp)
            .testTag(tag),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = label, color = MaterialTheme.colorScheme.onBackground, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text(text = description, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
            }
        }

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = MaterialTheme.colorScheme.primary
            )
        )
    }
}

@Composable
fun SettingsClickRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    onClick: () -> Unit,
    tag: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 1.dp, shape = RoundedCornerShape(12.dp), clip = false)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(16.dp)
            .testTag(tag),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Text(text = label, color = MaterialTheme.colorScheme.onBackground, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = value, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 13.sp)
            Icon(imageVector = Icons.Default.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
