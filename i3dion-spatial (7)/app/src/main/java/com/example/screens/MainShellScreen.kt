package com.example.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.viewmodel.CatalogViewModel

@Composable
fun MainShellScreen(
    viewModel: CatalogViewModel,
    onNavigateToProduct: (String) -> Unit,
    onNavigateToAR: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
    initialTab: Int = 0
) {
    var selectedTab by remember { mutableStateOf(initialTab) }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .testTag("main_shell_screen"),
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.secondary, // 10% Dark Accent Navigation Element
                contentColor = Color(0xFF94A3B8),
                tonalElevation = 8.dp,
                modifier = Modifier.testTag("app_bottom_nav_bar")
            ) {
                // Tab 0: Home Click
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(imageVector = Icons.Default.Hexagon, contentDescription = "Home") }, // Hexagon style matching tech logo
                    label = { Text("Home") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        indicatorColor = Color(0xFF0284C7).copy(alpha = 0.2f),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B)
                    ),
                    modifier = Modifier.testTag("nav_home_tab")
                )

                // Tab 1: Watchlist Click
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(imageVector = Icons.Default.FavoriteBorder, contentDescription = "Watchlist") },
                    label = { Text("Watchlist") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        indicatorColor = Color(0xFF0284C7).copy(alpha = 0.2f),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B)
                    ),
                    modifier = Modifier.testTag("nav_watchlist_tab")
                )

                // Tab 2: Scan QR Click
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(imageVector = Icons.Default.QrCodeScanner, contentDescription = "Scan QR") },
                    label = { Text("Scan QR") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        indicatorColor = Color(0xFF0284C7).copy(alpha = 0.2f),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B)
                    ),
                    modifier = Modifier.testTag("nav_scanner_tab")
                )

                // Tab 3: Downloads Click
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(imageVector = Icons.Default.DownloadForOffline, contentDescription = "Downloads") },
                    label = { Text("Downloads") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        indicatorColor = Color(0xFF0284C7).copy(alpha = 0.2f),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B)
                    ),
                    modifier = Modifier.testTag("nav_downloads_tab")
                )

                // Tab 4: Profile Click
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(imageVector = Icons.Default.PersonOutline, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF38BDF8),
                        selectedTextColor = Color(0xFF38BDF8),
                        indicatorColor = Color(0xFF0284C7).copy(alpha = 0.2f),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B)
                    ),
                    modifier = Modifier.testTag("nav_profile_tab")
                )
            }
        }
    ) { insets ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = insets.calculateBottomPadding())
        ) {
            when (selectedTab) {
                0 -> {
                    HomeScreen(
                        viewModel = viewModel,
                        onProductClick = onNavigateToProduct,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                1 -> {
                    WatchlistScreen(
                        viewModel = viewModel,
                        onNavigateToProduct = onNavigateToProduct,
                        onBackClick = { selectedTab = 0 }
                    )
                }
                2 -> {
                    QRScannerScreen(
                        viewModel = viewModel,
                        onNavigateToProduct = onNavigateToProduct,
                        onNavigateToAR = onNavigateToAR
                    )
                }
                3 -> {
                    DownloadsScreen(
                        viewModel = viewModel,
                        onNavigateToProduct = onNavigateToProduct,
                        onNavigateToAR = onNavigateToAR,
                        onExploreClick = { selectedTab = 0 }
                    )
                }
                4 -> {
                    ProfileScreen(
                        viewModel = viewModel,
                        onNavigateToWatchlist = { selectedTab = 1 },
                        onNavigateToDownloads = { selectedTab = 3 },
                        onNavigateToSettings = onNavigateToSettings,
                        onLogout = onLogout
                    )
                }
            }
        }
    }
}
