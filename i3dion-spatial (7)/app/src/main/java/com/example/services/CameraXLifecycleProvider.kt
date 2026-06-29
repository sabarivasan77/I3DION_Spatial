package com.example.services

import android.content.Context
import androidx.camera.lifecycle.ProcessCameraProvider
import com.google.common.util.concurrent.ListenableFuture
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Handles integration and resolution of the CameraX ProcessCameraProvider.
 * Injected into components requiring camera lifecycles to guarantee clean,
 * single-source-of-truth binding states.
 */
@Singleton
class CameraXLifecycleProvider @Inject constructor() {
    fun getCameraProviderFuture(context: Context): ListenableFuture<ProcessCameraProvider> {
        return ProcessCameraProvider.getInstance(context)
    }
}
