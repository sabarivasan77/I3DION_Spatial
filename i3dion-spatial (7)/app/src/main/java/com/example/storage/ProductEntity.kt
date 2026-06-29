package com.example.storage

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val description: String,
    val imageResName: String,
    val modelUrl: String,
    val isDownloaded: Boolean = false,
    val localModelPath: String? = null,
    val specs: String, // Split by pipe '|'
    val benefits: String, // Split by pipe '|'
    val documentName: String,
    val isFavorite: Boolean = false,
    val fileSize: String = "4.5 MB",
    val downloadDate: String = "",
    val isCustomQrScanned: Boolean = false,
    val thumbnailUrl: String = ""
)
