package com.example.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.example.R
import com.example.components.AppHeader
import com.example.components.ProductCard
import com.example.services.DownloadState
import com.example.storage.ProductEntity
import com.example.viewmodel.CatalogViewModel

@Composable
fun HomeScreen(
    viewModel: CatalogViewModel,
    onProductClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val products by viewModel.allProducts.collectAsStateWithLifecycle()
    val filteredProducts by viewModel.filteredProducts.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val downloadStates by viewModel.downloadStates.collectAsStateWithLifecycle()

    var showOverviewDialog by remember { mutableStateOf(false) }
    var selectedCategoryIndex by remember { mutableStateOf(0) }

    // Industrial filter chips with real domain targets
    val filterChips = remember {
        listOf(
            "All Assets",
            "Compressors",
            "Pumps",
            "Generators",
            "Machinery",
            "Automation",
            "Process Equip"
        )
    }

    val activeProducts = remember(products, filteredProducts, searchQuery, selectedCategoryIndex) {
        val baseList = if (searchQuery.isNotBlank()) filteredProducts else products
        val selectedChipTarget = when (selectedCategoryIndex) {
            1 -> "Air Compressors"
            2 -> "Pumps"
            3 -> "Generators"
            4 -> "Industrial Machinery"
            5 -> "Automation Systems"
            6 -> "Process Equipment"
            else -> "All"
        }
        if (selectedChipTarget == "All") {
            baseList
        } else {
            baseList.filter { it.category.equals(selectedChipTarget, ignoreCase = true) }
        }
    }

    Scaffold(
        topBar = {
            AppHeader(
                showBackButton = false,
                showDeleteCache = true,
                onDeleteCacheClick = { 
                    viewModel.clearAllDownloadedCache()
                    Toast.makeText(context, "All downloaded offline caches deleted.", Toast.LENGTH_SHORT).show()
                },
                showSearchAction = false,
                onSearchClick = {}
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier.testTag("home_screen")
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(bottom = 90.dp), // Clear bottom navigation bar
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Enterprise Hero section with sleek industrial accent (#0F172A)
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                        .background(MaterialTheme.colorScheme.secondary, RoundedCornerShape(20.dp)) // 10% Dark Accent
                        .padding(20.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF38BDF8).copy(alpha = 0.15f))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "I3DION SPATIAL ENTERPRISE",
                            color = Color(0xFF38BDF8),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Spatial AR Engine",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Instantly position, scale, and inspect heavy-machinery models in physical space with offline caching.",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8),
                        lineHeight = 18.sp
                    )
                }
            }

            // GLOBAL SEARCH INPUT BAR
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.updateSearchQuery(it) },
                    placeholder = { Text("Search equipment, specs, models...", color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f), fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = MaterialTheme.colorScheme.onBackground,
                        unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .testTag("global_home_search_input")
                )
            }

            // HORIZONTAL DYNAMIC CATEGORY CHOICES ROW (PREMIUM GRAPHICAL)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Filter by Specification Type",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(start = 20.dp, end = 20.dp)
                    )

                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        itemsIndexed(filterChips) { index, chipName ->
                            val isSelected = selectedCategoryIndex == index
                            val chipBg = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                            val chipText = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            val chipBorderColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(30.dp))
                                    .background(chipBg)
                                    .border(1.dp, chipBorderColor, RoundedCornerShape(30.dp))
                                    .clickable { selectedCategoryIndex = index }
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = chipName,
                                    color = chipText,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            // REAL-TIME PRODUCT CATALOG LIST (Main Visual Section)
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Equipment Catalog (${activeProducts.size})",
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 16.sp
                    )

                    Text(
                        text = "Real-time Telemetry Enabled",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            if (activeProducts.isEmpty()) {
                item {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(46.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No industrial assets matching state parameters found.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                items(activeProducts, key = { it.id }) { product ->
                    val currentState = downloadStates[product.id] ?: DownloadState.Idle

                    Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                        ProductCard(
                            product = product,
                            downloadState = currentState,
                            onViewDetail = { onProductClick(product.id) },
                            onDownloadClick = { viewModel.startDownload(product.id) },
                            onArClick = { onProductClick(product.id) }, // Guide user through detailed specifications first
                            isFavorite = product.isFavorite,
                            onFavoriteClick = { viewModel.toggleFavorite(product.id, product.isFavorite) }
                        )
                    }
                }
            }

            // Quick Platform Info Row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                        .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(12.dp))
                        .clickable { showOverviewDialog = true }
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.SupportAgent,
                        contentDescription = "Help",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Tap to review the offline client sandbox guide & SDK stats.",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f)
                    )
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }

    if (showOverviewDialog) {
        AlertDialog(
            onDismissRequest = { showOverviewDialog = false },
            icon = { Icon(Icons.Default.Construction, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
            title = { Text("System Sandbox Calibration", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface) },
            text = {
                Text(
                    text = "This I3DION Spatial client runs standard local sandbox caching using Room Database persistence. If you initiate scans or remote model downloads, files are sandboxed and fully operational for placement simulation without active internet connectivity.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                Button(
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    onClick = { showOverviewDialog = false }
                ) {
                    Text("Calibrated Close")
                }
            },
            containerColor = MaterialTheme.colorScheme.surface
        )
    }
}
