package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.screens.*
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.CatalogViewModel
import com.example.services.ArCoreSessionManager
import com.example.services.CameraXLifecycleProvider
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var hiltArCoreSessionManager: ArCoreSessionManager

    @Inject
    lateinit var hiltCameraXLifecycleProvider: CameraXLifecycleProvider

    private val arCoreSessionManager by lazy {
        try { hiltArCoreSessionManager } catch (e: Throwable) { I3dionApplication.instance.arCoreSessionManager }
    }

    private val cameraXLifecycleProvider by lazy {
        try { hiltCameraXLifecycleProvider } catch (e: Throwable) { I3dionApplication.instance.cameraXLifecycleProvider }
    }

    private val catalogViewModel: CatalogViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val isDarkTheme by catalogViewModel.isDarkModeState.collectAsState()
            MyApplicationTheme(darkTheme = isDarkTheme) {
                val navController = rememberNavController()

                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "splash",
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // 1. Splash Screen with Auto-Login dispatcher checks
                        composable("splash") {
                            SplashScreen(
                                onNavigateToHome = {
                                    val destination = if (catalogViewModel.sessionManager.isLoggedIn) "mainshell" else "welcome"
                                    navController.navigate(destination) {
                                        popUpTo("splash") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 2. Welcome entry portal screen
                        composable(
                            route = "welcome",
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            },
                            exitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            }
                        ) {
                            WelcomeScreen(
                                viewModel = catalogViewModel,
                                onNavigateToLogin = { navController.navigate("login") },
                                onNavigateToSignup = { navController.navigate("signup") },
                                onCompleteDemo = {
                                    navController.navigate("mainshell") {
                                        popUpTo("welcome") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 3. Login Screen
                        composable(
                            route = "login",
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            },
                            popExitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Right,
                                    animationSpec = tween(400)
                                )
                            }
                        ) {
                            LoginScreen(
                                viewModel = catalogViewModel,
                                onBackToWelcome = { navController.popBackStack() },
                                onLoginSuccess = {
                                    navController.navigate("mainshell") {
                                        popUpTo("welcome") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 4. Signup Screen
                        composable(
                            route = "signup",
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            },
                            popExitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Right,
                                    animationSpec = tween(400)
                                )
                            }
                        ) {
                            SignupScreen(
                                viewModel = catalogViewModel,
                                onBackToWelcome = { navController.popBackStack() },
                                onSignupSuccess = {
                                    navController.navigate("mainshell") {
                                        popUpTo("welcome") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 5. MainShell Screen (Hosting Bottom navigation tabs)
                        composable(
                            route = "mainshell",
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Up,
                                    animationSpec = tween(450)
                                )
                            },
                            exitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Down,
                                    animationSpec = tween(450)
                                )
                            }
                        ) {
                            MainShellScreen(
                                viewModel = catalogViewModel,
                                onNavigateToProduct = { productId ->
                                    navController.navigate("productDetail/$productId")
                                },
                                onNavigateToAR = { productId ->
                                    navController.navigate("ar/$productId")
                                },
                                onNavigateToSettings = { navController.navigate("settings") },
                                onLogout = {
                                    catalogViewModel.sessionManager.logout()
                                    navController.navigate("welcome") {
                                        popUpTo("mainshell") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 6. Product Detail screen
                        composable(
                            route = "productDetail/{productId}",
                            arguments = listOf(navArgument("productId") { type = NavType.StringType }),
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            },
                            popExitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Right,
                                    animationSpec = tween(400)
                                )
                            }
                        ) { backStackEntry ->
                            val productId = backStackEntry.arguments?.getString("productId") ?: ""
                            ProductDetailScreen(
                                viewModel = catalogViewModel,
                                productId = productId,
                                onBackClick = { navController.popBackStack() },
                                onLaunchAr = { id ->
                                    navController.navigate("ar/$id")
                                }
                            )
                        }

                        // 7. AR Simulator Viewport Screen with real camera permission viewfinder
                        composable(
                            route = "ar/{productId}",
                            arguments = listOf(navArgument("productId") { type = NavType.StringType }),
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Up,
                                    animationSpec = tween(400)
                                )
                            },
                            popExitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Down,
                                    animationSpec = tween(400)
                                )
                            }
                        ) { backStackEntry ->
                            val productId = backStackEntry.arguments?.getString("productId") ?: ""
                            ARScreen(
                                viewModel = catalogViewModel,
                                productId = productId,
                                onBackClick = { navController.popBackStack() }
                            )
                        }

                        // 8. Settings Module Screen
                        composable(
                            route = "settings",
                            enterTransition = {
                                slideIntoContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Left,
                                    animationSpec = tween(400)
                                )
                            },
                            popExitTransition = {
                                slideOutOfContainer(
                                    AnimatedContentTransitionScope.SlideDirection.Right,
                                    animationSpec = tween(400)
                                )
                            }
                        ) {
                            SettingsScreen(
                                viewModel = catalogViewModel,
                                onBackClick = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        arCoreSessionManager.resumeSession()
    }

    override fun onPause() {
        super.onPause()
        arCoreSessionManager.pauseSession()
    }

    override fun onDestroy() {
        super.onDestroy()
        arCoreSessionManager.destroySession()
    }
}
