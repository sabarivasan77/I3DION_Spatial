package com.example.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.components.AppHeader
import com.example.components.ProductCard
import com.example.services.DownloadState
import com.example.storage.ProductEntity
import com.example.ui.theme.*
import com.example.viewmodel.CatalogViewModel

@Composable
fun ProductListScreen(
    viewModel: CatalogViewModel,
    categoryName: String,
    onBackClick: () -> Unit,
    onProductClick: (String) -> Unit,
    onLaunchAr: (String) -> Unit
) {
    // Collect products reactively and filter them by category
    val allProducts by viewModel.allProducts.collectAsStateWithLifecycle()
    val downloadStates by viewModel.downloadStates.collectAsStateWithLifecycle()

    val filteredProducts = remember(allProducts, categoryName) {
        allProducts.filter { it.category.equals(categoryName, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            AppHeader(
                title = categoryName,
                showBackButton = true,
                onBackClick = onBackClick,
                showSearchAction = false
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = Modifier.testTag("product_list_screen")
    ) { innerPadding ->
        if (filteredProducts.isEmpty()) {
            // Seeding or loading delay handling
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(24.dp)
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Loading industrial machinery specs...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Header category note
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(
                                elevation = 1.dp,
                                shape = RoundedCornerShape(16.dp),
                                clip = false
                            )
                            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "SERIES OVERVIEW",
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Showing matching spatial models engineered for direct layout planning. Offline support enabled.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 18.sp
                        )
                    }
                }

                // Render matching cards
                items(filteredProducts, key = { it.id }) { product ->
                    val currentState = downloadStates[product.id] ?: DownloadState.Idle

                    ProductCard(
                        product = product,
                        downloadState = currentState,
                        onViewDetail = { onProductClick(product.id) },
                        onDownloadClick = { viewModel.startDownload(product.id) },
                        onArClick = { onLaunchAr(product.id) },
                        isFavorite = product.isFavorite,
                        onFavoriteClick = { viewModel.toggleFavorite(product.id, product.isFavorite) }
                    )
                }
            }
        }
    }
}
