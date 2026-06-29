package com.example.services

import android.content.Context
import android.util.Log
import com.google.ar.core.ArCoreApk
import com.google.ar.core.Session
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Enterprise service manager managing Google ARCore session state, checks, 
 * resource allocations, and lifecycle integrations.
 */
@Singleton
class ArCoreSessionManager @Inject constructor() {
    private var session: Session? = null

    /**
     * Checks if ARCore is supported and installed on the local device.
     */
    fun checkArCoreSupport(context: Context): ArCoreApk.Availability {
        return ArCoreApk.getInstance().checkAvailability(context)
    }

    /**
     * Instantiates or retrieves the existing ARCore session.
     */
    fun createSession(context: Context): Session? {
        if (session == null) {
            try {
                if (checkArCoreSupport(context).isSupported) {
                    session = Session(context)
                } else {
                    Log.w("ArCoreSessionManager", "ARCore is not supported on this device.")
                }
            } catch (e: Exception) {
                Log.e("ArCoreSessionManager", "Failed to create ARCore Session", e)
            }
        }
        return session
    }

    fun getSession(): Session? = session

    fun resumeSession() {
        try {
            session?.resume()
        } catch (e: Exception) {
            Log.e("ArCoreSessionManager", "Failed to resume ARCore Session", e)
        }
    }

    fun pauseSession() {
        try {
            session?.pause()
        } catch (e: Exception) {
            Log.e("ArCoreSessionManager", "Failed to pause ARCore Session", e)
        }
    }

    fun destroySession() {
        try {
            session?.close()
        } catch (e: Exception) {
            Log.e("ArCoreSessionManager", "Failed to destroy ARCore Session", e)
        }
        session = null
    }
}
