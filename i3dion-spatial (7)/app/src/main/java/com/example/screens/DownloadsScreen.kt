package com.example.screens

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.example.R
import com.example.storage.ProductEntity
import com.example.viewmodel.CatalogViewModel

@Composable
fun DownloadsScreen(
    viewModel: CatalogViewModel,
    onNavigateToProduct: (String) -> Unit,
    onNavigateToAR: (String) -> Unit,
    onExploreClick: () -> Unit
) {
    val context = LocalContext.current
    val allProducts by viewModel.allProducts.collectAsStateWithLifecycle()
    val downloadedProducts = remember(allProducts) { allProducts.filter { it.isDownloaded } }

    var showDeleteConfirmDialog by remember { mutableStateOf<ProductEntity?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .testTag("downloads_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            // Header Title
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Download Library",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${downloadedProducts.size} Industrial Models Cached Offline",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                // Quick clear button
                if (downloadedProducts.isNotEmpty()) {
                    IconButton(
                        onClick = {
                            viewModel.clearAllDownloadedCache()
                            Toast.makeText(context, "All downloaded offline contents wiped.", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.testTag("clear_all_downloads_btn")
                    ) {
                        Icon(imageVector = Icons.Default.DeleteForever, contentDescription = "Clear All Caches", tint = Color(0xFFEF4444))
                    }
                }
            }

            if (downloadedProducts.isEmpty()) {
                // Empty state view
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .shadow(elevation = 2.dp, shape = RoundedCornerShape(24.dp))
                            .clip(RoundedCornerShape(24.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.img_logo),
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = "No Offline Models Yet",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Text(
                        text = "Once you download products, you can view them instantly in high-fidelity AR without any network connection.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 32.dp),
                        lineHeight = 18.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )

                    Button(
                        onClick = onExploreClick,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .padding(top = 16.dp)
                            .testTag("downloads_explore_btn")
                    ) {
                        Text("Browse Catalog", fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                // Models List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentPadding = PaddingValues(bottom = 90.dp), // Cushion above bottom navigation bar
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(downloadedProducts, key = { it.id }) { product ->
                        DownloadItemCard(
                            product = product,
                            onOpen = { onNavigateToProduct(product.id) },
                            onAR = { onNavigateToAR(product.id) },
                            onDelete = { showDeleteConfirmDialog = product }
                        )
                    }
                }
            }
        }

        // CONFIRM DELETE DIALOG
        showDeleteConfirmDialog?.let { product ->
            AlertDialog(
                onDismissRequest = { showDeleteConfirmDialog = null },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                title = { Text("Delete Cached Model?", fontWeight = FontWeight.Bold) },
                text = {
                    Text("Are you sure you want to remove the cached GLB file for \"${product.name}\"? This clears offline AR accessibility.")
                },
                confirmButton = {
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                        onClick = {
                            viewModel.deleteDownload(product.id)
                            showDeleteConfirmDialog = null
                            Toast.makeText(context, "${product.name} cache removed", Toast.LENGTH_SHORT).show()
                        }
                    ) {
                        Text("Delete Cache")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirmDialog = null }) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            )
        }
    }
}

@Composable
fun DownloadItemCard(
    product: ProductEntity,
    onOpen: () -> Unit,
    onAR: () -> Unit,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 1.dp, shape = RoundedCornerShape(14.dp), clip = false)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
            .clickable { onOpen() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Thumbnail image
        Box(
            modifier = Modifier
                .size(70.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            val drawableId = when (product.imageResName) {
                "img_compressor" -> R.drawable.img_compressor
                "img_pump" -> R.drawable.img_pump
                "img_generator" -> R.drawable.img_generator
                else -> R.drawable.img_logo
            }

            if (product.isCustomQrScanned && product.thumbnailUrl.isNotBlank()) {
                AsyncImage(
                    model = product.thumbnailUrl,
                    contentDescription = product.name,
                    contentScale = ContentScale.Inside,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Image(
                    painter = painterResource(id = drawableId),
                    contentDescription = product.name,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        Spacer(modifier = Modifier.width(14.dp))

        // Core dynamic descriptors
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = product.name,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Text(
                text = product.category,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.primary
            )

            Row(
                modifier = Modifier.padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Size Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = product.fileSize.ifEmpty { "4.5 MB" },
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                // Date stamp
                Text(
                    text = "Saved: " + product.downloadDate.ifEmpty { "Today" },
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Action icons
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // View in AR Button
            IconButton(
                onClick = onAR,
                colors = IconButtonDefaults.iconButtonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.size(36.dp).testTag("download_card_ar_btn_${product.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.ViewInAr,
                    contentDescription = "AR View",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }

            // Trash Cache Button
            IconButton(
                onClick = onDelete,
                colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.1f)),
                modifier = Modifier.size(36.dp).testTag("download_card_delete_btn_${product.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "Delete Model",
                    tint = Color(0xFFEF4444),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
