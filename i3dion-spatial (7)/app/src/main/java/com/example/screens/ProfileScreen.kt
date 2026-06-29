package com.example.screens

import android.widget.Toast
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.R
import com.example.viewmodel.CatalogViewModel

@Composable
fun ProfileScreen(
    viewModel: CatalogViewModel,
    onNavigateToWatchlist: () -> Unit,
    onNavigateToDownloads: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    
    val allProducts by viewModel.allProducts.collectAsStateWithLifecycle()
    val favoritesCount = remember(allProducts) { allProducts.count { it.isFavorite } }
    val downloadsCount = remember(allProducts) { allProducts.count { it.isDownloaded } }

    var showEditProfile by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf(viewModel.sessionManager.userName) }
    var editPhone by remember { mutableStateOf(viewModel.sessionManager.userPhone) }

    var showChangePassword by remember { mutableStateOf(false) }
    var passwordCurrent by remember { mutableStateOf("") }
    var passwordNew by remember { mutableStateOf("") }

    var showAbout by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .testTag("profile_tab_view")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(bottom = 90.dp) // Cushion above bottom nav bar
        ) {
            // Header Core inside a dark accent card (the 10% ratio)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.secondary) // Dark Accent Element
                    .padding(vertical = 32.dp, horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Interactive Operator Avatar Placeholder
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0284C7).copy(alpha = 0.15f))
                        .clickable {
                            Toast.makeText(context, "Photo import available in deployment release.", Toast.LENGTH_SHORT).show()
                        }
                        .testTag("profile_avatar"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Engineering,
                        contentDescription = "User Avatar",
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(46.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = viewModel.sessionManager.userName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )

                Text(
                    text = viewModel.sessionManager.userEmail,
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    modifier = Modifier.padding(top = 2.dp)
                )

                Text(
                    text = "Phone: " + viewModel.sessionManager.userPhone,
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable { onNavigateToWatchlist() }
                    ) {
                        Text(
                            text = favoritesCount.toString(),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF38BDF8)
                        )
                        Text(
                            text = "Watchlist",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                    }

                    Box(modifier = Modifier.width(1.dp).height(36.dp).background(Color(0xFF334155)))

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.clickable { onNavigateToDownloads() }
                    ) {
                        Text(
                            text = downloadsCount.toString(),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF38BDF8)
                        )
                        Text(
                            text = "Downloads",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }

            // Options List with beautiful modern bright themed rows
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "OPERATOR HUB ACTIONS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                ProfileMenuRow(
                    icon = Icons.Default.Edit,
                    label = "Edit Profile",
                    onClick = {
                        editName = viewModel.sessionManager.userName
                        editPhone = viewModel.sessionManager.userPhone
                        showEditProfile = true
                    },
                    tag = "menu_edit_profile"
                )

                ProfileMenuRow(
                    icon = Icons.Default.LockReset,
                    label = "Change Password",
                    onClick = {
                        passwordCurrent = ""
                        passwordNew = ""
                        showChangePassword = true
                    },
                    tag = "menu_change_password"
                )

                ProfileMenuRow(
                    icon = Icons.Default.FavoriteBorder,
                    label = "My Watchlist",
                    onClick = onNavigateToWatchlist,
                    tag = "menu_watchlist"
                )

                ProfileMenuRow(
                    icon = Icons.Default.DownloadForOffline,
                    label = "Download Library",
                    onClick = onNavigateToDownloads,
                    tag = "menu_download_library"
                )

                ProfileMenuRow(
                    icon = Icons.Default.Settings,
                    label = "System Settings",
                    onClick = onNavigateToSettings,
                    tag = "menu_settings"
                )

                ProfileMenuRow(
                    icon = Icons.Default.Info,
                    label = "About I3DION Spatial",
                    onClick = { showAbout = true },
                    tag = "menu_about"
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Logout Action Row with high visual contrast red theme
                Button(
                    onClick = onLogout,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("profile_logout_button")
                ) {
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Logout, contentDescription = "Log Out", tint = Color(0xFFEF4444))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Log Out of Session", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }
        }

        // EDIT PROFILE DIALOG
        if (showEditProfile) {
            AlertDialog(
                onDismissRequest = { showEditProfile = false },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                title = { Text("Edit Operator Profile", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = editName,
                            onValueChange = { editName = it },
                            label = { Text("Operator Name") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("edit_profile_name_input")
                        )

                        OutlinedTextField(
                            value = editPhone,
                            onValueChange = { editPhone = it },
                            label = { Text("Contact Phone") },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("edit_profile_phone_input")
                        )
                    }
                },
                confirmButton = {
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        onClick = {
                            if (editName.isNotBlank() && editPhone.isNotBlank()) {
                                viewModel.sessionManager.userName = editName.trim()
                                viewModel.sessionManager.userPhone = editPhone.trim()
                                showEditProfile = false
                                Toast.makeText(context, "Profile updated", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Fields cannot be blank", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.testTag("edit_profile_save_btn")
                    ) {
                        Text("Save Changes")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showEditProfile = false }) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }

        // CHANGE PASSWORD DIALOG
        if (showChangePassword) {
            AlertDialog(
                onDismissRequest = { showChangePassword = false },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                title = { Text("Change Portal Password", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = passwordCurrent,
                            onValueChange = { passwordCurrent = it },
                            label = { Text("Current Password") },
                            visualTransformation = PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("change_pwd_current_input")
                        )

                        OutlinedTextField(
                            value = passwordNew,
                            onValueChange = { passwordNew = it },
                            label = { Text("New Secure Password") },
                            visualTransformation = PasswordVisualTransformation(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline
                            ),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth().testTag("change_pwd_new_input")
                        )
                    }
                },
                confirmButton = {
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        onClick = {
                            if (passwordCurrent.isNotBlank() && passwordNew.length >= 6) {
                                showChangePassword = false
                                Toast.makeText(context, "Portal authentication password updated", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Secure password must be at least 6 characters", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.testTag("change_pwd_save_btn")
                    ) {
                        Text("Update Security")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showChangePassword = false }) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }

        // ABOUT POPUP DIALOG - enterprise specifications
        if (showAbout) {
            AlertDialog(
                onDismissRequest = { showAbout = false },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(id = R.drawable.img_logo),
                            contentDescription = null,
                            modifier = Modifier.size(28.dp).padding(end = 8.dp)
                        )
                        Text("I3DION Spatial System", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface)
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Industrial AR Product Experience Platform",
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontSize = 14.sp
                        )
                        
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline)
                        
                        Text(
                            text = "Version: 2.4.0-Enterprise\n" +
                                    "Build Date: June 2026\n" +
                                    "Target Environment: Android SDK 36\n" +
                                    "Spatial Engine: ARCore v1.45 Compatible",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 18.sp
                        )

                        Text(
                            text = "Company: I3DION Systems Inc.\n" +
                                    "Official Portal: www.i3dion.com\n" +
                                    "Support Contact: support@i3dion.com",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary,
                            lineHeight = 18.sp
                        )
                    }
                },
                confirmButton = {
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        onClick = { showAbout = false }
                    ) {
                        Text("Standard Close", color = Color.White)
                    }
                }
            )
        }
    }
}

@Composable
fun ProfileMenuRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
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
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
        }

        Spacer(modifier = Modifier.width(16.dp))

        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.weight(1f)
        )

        Icon(
            imageVector = Icons.Default.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
