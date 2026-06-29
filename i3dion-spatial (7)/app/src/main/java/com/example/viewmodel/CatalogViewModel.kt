package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.services.CacheManager
import com.example.services.DownloadState
import com.example.services.ModelDownloadService
import com.example.storage.AppDatabase
import com.example.storage.ProductEntity
import com.example.storage.ProductRepository
import com.example.storage.SessionManager
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class CatalogViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ProductRepository
    private val downloadService: ModelDownloadService
    val sessionManager = SessionManager(application)

    // Global map to track active downloads for different products simultaneously
    private val _downloadStates = MutableStateFlow<Map<String, DownloadState>>(emptyMap())
    val downloadStates: StateFlow<Map<String, DownloadState>> = _downloadStates.asStateFlow()

    private val _themeState = MutableStateFlow(sessionManager.isDarkMode)
    val isDarkModeState: StateFlow<Boolean> = _themeState.asStateFlow()

    fun setThemeMode(isDark: Boolean) {
        sessionManager.isDarkMode = isDark
        _themeState.value = isDark
    }

    // Expose all products reactively
    val allProducts: StateFlow<List<ProductEntity>>

    // Search query
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // Filtered products list reactively combining search and products
    val filteredProducts: StateFlow<List<ProductEntity>>

    init {
        val database = AppDatabase.getDatabase(application)
        repository = ProductRepository(database.productDao())
        downloadService = ModelDownloadService(application, repository)

        allProducts = repository.allProducts
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = emptyList()
            )

        filteredProducts = combine(allProducts, _searchQuery) { products, query ->
            if (query.isBlank()) {
                products
            } else {
                val lowercaseQuery = query.lowercase().trim()
                products.filter { product ->
                    product.name.lowercase().contains(lowercaseQuery) ||
                    product.category.lowercase().contains(lowercaseQuery) ||
                    product.description.lowercase().contains(lowercaseQuery) ||
                    product.specs.lowercase().contains(lowercaseQuery)
                }
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        // Seed data on a background coroutine
        viewModelScope.launch {
            repository.seedProductsIfEmpty()
            syncPhysicalDownloadedFiles()
        }
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    /**
     * Filters products by their specific category.
     */
    fun getProductsByCategory(categoryName: String): Flow<List<ProductEntity>> {
        return repository.getProductsByCategory(categoryName)
    }

    /**
     * Retrieves detail state of a single product.
     */
    fun getProductById(productId: String): Flow<ProductEntity?> {
        return repository.getProductById(productId)
    }

    /**
     * Toggles the favorite / watchlist status.
     */
    fun toggleFavorite(productId: String, currentStatus: Boolean) {
        viewModelScope.launch {
            repository.updateFavoriteStatus(productId, !currentStatus)
        }
    }

    /**
     * Start downloading model and updates database + in-memory states.
     */
    fun startDownload(productId: String, onComplete: (() -> Unit)? = null) {
        viewModelScope.launch {
            // Avoid downloading twice if already processing
            val currentState = _downloadStates.value[productId]
            if (currentState is DownloadState.Downloading) return@launch

            downloadService.downloadModel(productId).collect { state ->
                _downloadStates.value = _downloadStates.value.toMutableMap().apply {
                    put(productId, state)
                }
                if (state is DownloadState.Success) {
                    onComplete?.invoke()
                }
            }
        }
    }

    /**
     * Delete downloaded file cache for a product and update Room DB state
     */
    fun deleteDownload(productId: String) {
        viewModelScope.launch {
            val context = getApplication<Application>()
            val file = CacheManager.getModelFile(context, productId)
            if (file.exists()) {
                file.delete()
            }
            repository.updateDownloadStatus(productId, isDownloaded = false, localPath = null, fileSize = "4.5 MB", downloadDate = "")
            _downloadStates.value = _downloadStates.value.toMutableMap().apply {
                remove(productId)
            }
        }
    }

    /**
     * Parses a scanned QR payload, loads it into local Room database dynamically!
     * Supports valid JSON product configurations, plain-text product IDs, or URLs ending with a product ID.
     */
    suspend fun handleScannedQrCode(qrPayload: String): ProductEntity? {
        val trimmed = qrPayload.trim()

        // 1. Check if it is a JSON configuration payload
        try {
            val json = JSONObject(trimmed)
            val id = json.getString("id")
            val name = json.getString("name")
            val modelUrl = json.getString("model")
            val description = json.optString("description", "Dynamic Scanned Enterprise Asset")
            val thumbnail = json.optString("thumbnail", "")
            val category = json.optString("category", "Custom QR Products")

            val newProduct = ProductEntity(
                id = id,
                name = name,
                category = category,
                description = description,
                imageResName = "img_logo",
                modelUrl = modelUrl,
                isDownloaded = false,
                localModelPath = null,
                specs = "Serial Number: QR-$id|Input Protocol: Industrial Scan|Model URL: See Payload|Calibration Status: Verified Active",
                benefits = "On-demand AR Placement|Zero Site Storage Overhead|Instant Asset Inspection",
                documentName = "i3dion_${id.lowercase()}_datasheet.pdf",
                isFavorite = false,
                fileSize = "4.5 MB",
                downloadDate = "",
                isCustomQrScanned = true,
                thumbnailUrl = thumbnail
            )

            repository.insertSingleProduct(newProduct)
            return newProduct
        } catch (e: Exception) {
            // Not a JSON payload, move to other lookup strategies
        }

        // 2. Check if the payload is a URL and extract the product ID
        var potentialId = trimmed
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            try {
                val uri = android.net.Uri.parse(trimmed)
                val pathSegments = uri.pathSegments
                if (!pathSegments.isNullOrEmpty()) {
                    potentialId = pathSegments.last()
                }
            } catch (e: Exception) {
                // Fail-safe
            }
        }

        // 3. Look up by direct ID matching in local database repository
        val existingProduct = repository.getProductByIdOneShot(potentialId)
        if (existingProduct != null) {
            return existingProduct
        }

        // 4. Try case-insensitive matching against seeded IDs or names as a fallback
        val allProds = repository.allProducts.first()
        val match = allProds.find {
            it.id.equals(potentialId, ignoreCase = true) ||
            it.name.contains(potentialId, ignoreCase = true)
        }
        if (match != null) {
            return match
        }

        return null
    }

    /**
     * Synchronizes DB state with the actual physical files on disk in case of clearance.
     */
    private suspend fun syncPhysicalDownloadedFiles() {
        val context = getApplication<Application>()
        
        // Ensure the pre-cached cube asset is copied to the models cache directory
        val demoFile = CacheManager.getModelFile(context, "demo_cube")
        if (!demoFile.exists()) {
            try {
                context.assets.open("cube.glb").use { inputStream ->
                    demoFile.outputStream().use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
                android.util.Log.i("CatalogViewModel", "Pre-cached demo_cube.glb successfully copied from assets to cache disk.")
            } catch (e: Exception) {
                android.util.Log.e("CatalogViewModel", "Failed to copy pre-cached demo_cube.glb from assets: ${e.message}", e)
            }
        }

        val list = repository.allProducts.first()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        val todayStr = dateFormat.format(Date())
        for (product in list) {
            val existsOnDisk = CacheManager.isModelCached(context, product.id)
            if (existsOnDisk && (product.localModelPath == null || !product.isDownloaded)) {
                // Physical file exists, but DB is either missing the path or marked not downloaded -> synchronize DB
                val file = CacheManager.getModelFile(context, product.id)
                val sizeFormatted = String.format(Locale.getDefault(), "%.1f MB", file.length().toFloat() / (1024 * 1024))
                repository.updateDownloadStatus(
                    id = product.id,
                    isDownloaded = true,
                    localPath = file.absolutePath,
                    fileSize = if (product.id == "demo_cube") "1.6 KB" else if (sizeFormatted == "0.0 MB") "4.5 MB" else sizeFormatted,
                    downloadDate = if (product.id == "demo_cube") "Preloaded" else todayStr
                )
            } else if (product.isDownloaded && !existsOnDisk) {
                // DB says downloaded but physical file was deleted/missing, correct DB
                repository.updateDownloadStatus(product.id, isDownloaded = false, localPath = null, fileSize = "4.5 MB", downloadDate = "")
            }
        }
    }

    /**
     * Manual wipe of downloaded offline models cache.
     */
    fun clearAllDownloadedCache() {
        viewModelScope.launch {
            _downloadStates.value = emptyMap()
            val context = getApplication<Application>()
            CacheManager.clearCache(context)
            val list = repository.allProducts.first()
            for (product in list) {
                repository.updateDownloadStatus(product.id, isDownloaded = false, localPath = null, fileSize = "4.5 MB", downloadDate = "")
            }
        }
    }
}
