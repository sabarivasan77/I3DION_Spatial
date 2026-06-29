package com.example

import android.app.Application
import com.example.services.ArCoreSessionManager
import com.example.services.CameraXLifecycleProvider
import dagger.hilt.android.HiltAndroidApp

/**
 * Custom Application class initialized with Dagger Hilt annotations.
 * Includes a robust thread-safe service locator fallback to guarantee 
 * seamless execution across all Android Gradle Plugin variants.
 */
@HiltAndroidApp
class I3dionApplication : Application() {

    // Singleton references used for direct manual DI/Service Location fallback
    val arCoreSessionManager: ArCoreSessionManager by lazy { ArCoreSessionManager() }
    val cameraXLifecycleProvider: CameraXLifecycleProvider by lazy { CameraXLifecycleProvider() }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: I3dionApplication
            private set
    }
}
