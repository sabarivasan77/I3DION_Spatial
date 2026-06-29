package com.example.services

import android.content.Context
import java.io.File

class CacheManager {

    companion object {
        private const val MODELS_DIR = "models"

        /**
         * Get the local folder dedicated to storing downloaded models.
         */
        fun getModelsDirectory(context: Context): File {
            val dir = File(context.filesDir, MODELS_DIR)
            if (!dir.exists()) {
                dir.mkdirs()
            }
            return dir
        }

        /**
         * Returns the local File reference for a given product ID.
         */
        fun getModelFile(context: Context, productId: String): File {
            val dir = getModelsDirectory(context)
            return File(dir, "$productId.glb")
        }

        /**
         * Verifies if the 3D model for this product ID actually exists offline.
         */
        fun isModelCached(context: Context, productId: String): Boolean {
            val file = getModelFile(context, productId)
            return file.exists() && file.isFile && file.length() > 0
        }

        /**
         * Writes a simulated high-quality 3D model binary representation into local cache.
         */
        fun writeModelMockToCache(context: Context, productId: String): String {
            val file = getModelFile(context, productId)
            // Save mock content to stand in for a real GLB file (usually 10KB dummy data)
            file.writeText("GLTF_BINARY_MODEL_DATA_MOCK_PLAINTEXT_ID_$productId")
            return file.absolutePath
        }

        /**
         * Clear all cached models.
         */
        fun clearCache(context: Context) {
            val dir = getModelsDirectory(context)
            if (dir.exists()) {
                dir.deleteRecursively()
            }
        }
    }
}
