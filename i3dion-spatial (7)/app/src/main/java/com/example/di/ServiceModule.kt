package com.example.di

import com.example.services.ArCoreSessionManager
import com.example.services.CameraXLifecycleProvider
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Standard Dagger Hilt Module providing lifecycle-bound and singleton-scoped
 * services for ARCore and CameraX throughout the application shell.
 */
@Module
@InstallIn(SingletonComponent::class)
object ServiceModule {

    @Provides
    @Singleton
    fun provideArCoreSessionManager(): ArCoreSessionManager {
        return ArCoreSessionManager()
    }

    @Provides
    @Singleton
    fun provideCameraXLifecycleProvider(): CameraXLifecycleProvider {
        return CameraXLifecycleProvider()
    }
}
