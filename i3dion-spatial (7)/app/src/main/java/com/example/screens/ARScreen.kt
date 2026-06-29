package com.example.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.R
import com.example.storage.ProductEntity
import com.example.ui.theme.*
import com.example.viewmodel.CatalogViewModel
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun ARScreen(
    viewModel: CatalogViewModel,
    productId: String,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val allProducts by viewModel.allProducts.collectAsStateWithLifecycle()
    val product = remember(allProducts, productId) { allProducts.find { it.id == productId } }

    DisposableEffect(Unit) {
        onDispose {
            try {
                val cameraProviderFuture = androidx.camera.lifecycle.ProcessCameraProvider.getInstance(context)
                val cameraProvider = cameraProviderFuture.get()
                cameraProvider.unbindAll()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // State of Camera Permission
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
    }

    // Dynamic Permission flow trigger on launching screen
    LaunchedEffect(key1 = true) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    if (!hasCameraPermission) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .testTag("camera_permission_denied_view"),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFF59E0B).copy(alpha = 0.08f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Camera,
                        contentDescription = "Camera Permission Alert",
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = stringResource(R.string.camera_permission_required),
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.SansSerif,
                    letterSpacing = (-0.5).sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = stringResource(R.string.camera_permission_rationale),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("grant_camera_permission_button")
                ) {
                    Text(
                        text = "Grant Permission",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                TextButton(onClick = onBackClick) {
                    Text(text = "Cancel & Go Back", color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                }
            }
        }
    } else {
        if (product != null) {
            ARViewport(
                product = product,
                onBackClick = onBackClick
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
fun ARViewport(
    product: ProductEntity,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val density = LocalDensity.current

    // Positioning states for rendering simulation
    var rotationAngle by remember { mutableStateOf(180f) }
    var scaleFactor by remember { mutableStateOf(1.0f) }
    var isLocked by remember { mutableStateOf(false) }

    // Toggle states for sliders in clean floating system
    var showRotationSlider by remember { mutableStateOf(false) }
    var showScaleSlider by remember { mutableStateOf(false) }

    // AR Stages: "Scanning" -> "Placed"
    var arStage by remember { mutableStateOf("Scanning") }

    // Animation for pulsing radar scan reticle
    val infiniteTransition = rememberInfiniteTransition(label = "AR Scanner")
    val pulseProgress by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "Pulsing"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(arStage) {
                if (arStage == "Scanning") {
                    detectTapGestures {
                        arStage = "Placed"
                    }
                }
            }
            .testTag("ar_viewport")
    ) {
        // 1) REAL LIVE DEVICE CAMERA BACK-UNDERLAY
        val lifecycleOwner = LocalLifecycleOwner.current
        AndroidView(
            factory = { ctx ->
                val previewView = androidx.camera.view.PreviewView(ctx)
                val cameraProviderFuture = androidx.camera.lifecycle.ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = androidx.camera.core.Preview.Builder().build()
                    val cameraSelector = androidx.camera.core.CameraSelector.DEFAULT_BACK_CAMERA
                    try {
                        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            cameraProvider.unbindAll()
                            preview.setSurfaceProvider(previewView.surfaceProvider)
                            cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // 2) SURFACE DETECTION GRAPHICS (Reticle Scanning)
        if (arStage == "Scanning") {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.size(180.dp)) {
                    val cx = size.width / 2f
                    val cy = size.height / 2f
                    val radius = 70.dp.toPx() * pulseProgress

                    // Outlined target circular reticle
                    drawCircle(
                        color = Color(0xFF38BDF8).copy(alpha = 0.5f),
                        radius = radius,
                        center = Offset(cx, cy),
                        style = Stroke(
                            width = 1.5.dp.toPx(),
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 12f), 0f)
                        )
                    )

                    // Solid central anchor guide dot
                    drawCircle(
                        color = Color(0xFF38BDF8),
                        radius = 4.dp.toPx(),
                        center = Offset(cx, cy)
                    )

                    // Reticle brackets
                    val lineLength = 15.dp.toPx()
                    val offset = radius * 0.707f // cos(45deg)
                    
                    // Top-Left corner
                    drawLine(Color(0xFF38BDF8), Offset(cx - offset, cy - offset), Offset(cx - offset + lineLength, cy - offset), strokeWidth = 2.dp.toPx())
                    drawLine(Color(0xFF38BDF8), Offset(cx - offset, cy - offset), Offset(cx - offset, cy - offset + lineLength), strokeWidth = 2.dp.toPx())

                    // Top-Right corner
                    drawLine(Color(0xFF38BDF8), Offset(cx + offset, cy - offset), Offset(cx + offset - lineLength, cy - offset), strokeWidth = 2.dp.toPx())
                    drawLine(Color(0xFF38BDF8), Offset(cx + offset, cy - offset), Offset(cx + offset, cy - offset + lineLength), strokeWidth = 2.dp.toPx())

                    // Bottom-Left corner
                    drawLine(Color(0xFF38BDF8), Offset(cx - offset, cy + offset), Offset(cx - offset + lineLength, cy + offset), strokeWidth = 2.dp.toPx())
                    drawLine(Color(0xFF38BDF8), Offset(cx - offset, cy + offset), Offset(cx - offset, cy + offset - lineLength), strokeWidth = 2.dp.toPx())

                    // Bottom-Right corner
                    drawLine(Color(0xFF38BDF8), Offset(cx + offset, cy + offset), Offset(cx + offset - lineLength, cy + offset), strokeWidth = 2.dp.toPx())
                    drawLine(Color(0xFF38BDF8), Offset(cx + offset, cy + offset), Offset(cx + offset, cy + offset - lineLength), strokeWidth = 2.dp.toPx())
                }
            }
        }

        // 3) REAL GLB MODEL RENDERING OVERLAY (TRANSPARENT WEBVIEW)
        if (arStage == "Placed") {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("ar_product_hologram"),
                contentAlignment = Alignment.Center
            ) {
                AndroidView(
                    factory = { ctx ->
                        WebView(ctx).apply {
                            settings.apply {
                                javaScriptEnabled = true
                                domStorageEnabled = true
                                allowFileAccess = true
                                allowContentAccess = true
                                loadsImagesAutomatically = true
                            }
                            setBackgroundColor(0) // Transparent to overlay on camera stream!
                            webViewClient = WebViewClient()
                            webChromeClient = WebChromeClient()
                        }
                    },
                    update = { webView ->
                        val htmlContent = """
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                              <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>
                              <style>
                                body {
                                  margin: 0;
                                  padding: 0;
                                  width: 100vw;
                                  height: 100vh;
                                  overflow: hidden;
                                  background-color: transparent !important;
                                }
                                model-viewer {
                                  width: 100%;
                                  height: 100%;
                                  background-color: transparent !important;
                                  --poster-color: transparent !important;
                                }
                              </style>
                            </head>
                            <body>
                              <model-viewer 
                                id="viewer"
                                src="${product.modelUrl}"
                                alt="${product.name}"
                                camera-controls
                                interaction-prompt="none"
                                shadow-intensity="1.5"
                                shadow-softness="0.8"
                                exposure="1.0"
                                environment-image="neutral"
                                auto-rotate>
                              </model-viewer>
                              <script>
                                const viewer = document.getElementById('viewer');
                                window.updateRotation = function(deg) {
                                  viewer.cameraOrbit = deg + "deg 75deg auto";
                                };
                                window.updateScale = function(scale) {
                                  viewer.style.transform = "scale(" + scale + ")";
                                };
                                window.setLocked = function(locked) {
                                  if (locked) {
                                    viewer.removeAttribute('camera-controls');
                                  } else {
                                    viewer.setAttribute('camera-controls', '');
                                  }
                                };
                              </script>
                            </body>
                            </html>
                        """.trimIndent()
                        webView.loadDataWithBaseURL("https://arvr.google.com", htmlContent, "text/html", "UTF-8", null)
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Render live state changes onto the WebView running JavaScript updates
                val webView = remember { mutableStateOf<WebView?>(null) }
                LaunchedEffect(rotationAngle, scaleFactor, isLocked) {
                    webView.value?.evaluateJavascript(
                        "if (window.updateRotation) { window.updateRotation($rotationAngle); window.updateScale($scaleFactor); window.setLocked($isLocked); }",
                        null
                    )
                }
            }
        }

        // 4) CLEAN IMMERSIVE HUD HELPERS (Minimal Pills, No Debug clutter)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(top = 16.dp, start = 16.dp, end = 16.dp)
                .align(Alignment.TopCenter)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Return navigation trigger (48dp Touch Target)
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.6f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                        .clickable { onBackClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Exit AR Session",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }

                // Small sleek status information pill
                Box(
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(24.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(24.dp))
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (isLocked) Color(0xFF22C55E) else Color(0xFF38BDF8))
                        )
                        Text(
                            text = if (arStage == "Scanning") "SCANNING SURFACE..." else if (isLocked) "POSITION LOCKED" else "INTERACTIVE MODEL",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }

        // 5) MINIMAL FLOATING CONTROLS CONSOLE (Occupies ~10% screen space, bottom-center)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp, start = 16.dp, end = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Optional mini control slider drawers (Rotate/Scale dynamic adjustments)
            AnimatedVisibility(
                visible = showRotationSlider && arStage == "Placed" && !isLocked,
                enter = fadeIn() + slideInVertically { it / 2 },
                exit = fadeOut() + slideOutVertically { it / 2 }
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.75f)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.RotateRight, "Rotate Indicator", tint = Color.White, modifier = Modifier.size(16.dp))
                        Slider(
                            value = rotationAngle,
                            onValueChange = { rotationAngle = it },
                            valueRange = 0f..360f,
                            colors = SliderDefaults.colors(
                                thumbColor = Color.White,
                                activeTrackColor = Color.White,
                                inactiveTrackColor = Color.White.copy(alpha = 0.2f)
                            ),
                            modifier = Modifier.weight(1f).testTag("rotation_slider")
                        )
                        Text(
                            text = "${rotationAngle.toInt()}°",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            AnimatedVisibility(
                visible = showScaleSlider && arStage == "Placed" && !isLocked,
                enter = fadeIn() + slideInVertically { it / 2 },
                exit = fadeOut() + slideOutVertically { it / 2 }
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.75f)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.ZoomIn, "Scale Indicator", tint = Color.White, modifier = Modifier.size(16.dp))
                        Slider(
                            value = scaleFactor,
                            onValueChange = { scaleFactor = it },
                            valueRange = 0.3f..2.5f,
                            colors = SliderDefaults.colors(
                                thumbColor = Color.White,
                                activeTrackColor = Color.White,
                                inactiveTrackColor = Color.White.copy(alpha = 0.2f)
                            ),
                            modifier = Modifier.weight(1f).testTag("scale_slider")
                        )
                        Text(
                            text = "${(scaleFactor * 100).toInt()}%",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Minimal Instructions overlay
            Box(
                modifier = Modifier
                    .background(Color.Black.copy(alpha = 0.65f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(
                    text = when (arStage) {
                        "Scanning" -> "Move camera to find a flat surface and tap to place"
                        else -> if (isLocked) "Position locked. Press Lock button to edit again." else "Pinch to scale, drag to orbit model"
                    },
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            // FLOATING CIRCULAR CONTROL BUTTON BAR (48dp+ interactive components)
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Exit AR Screen (Back)
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.65f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                        .clickable { onBackClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                        contentDescription = "Exit AR viewport",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                if (arStage == "Placed") {
                    // Lock / Unlock Transform Toggle
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(if (isLocked) Color(0xFF22C55E) else Color.Black.copy(alpha = 0.65f))
                            .border(1.dp, if (isLocked) Color.Transparent else Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable {
                                isLocked = !isLocked
                                if (isLocked) {
                                    showRotationSlider = false
                                    showScaleSlider = false
                                }
                            }
                            .testTag("lock_toggle_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                            contentDescription = "Toggle locked position status",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    if (!isLocked) {
                        // Rotation Slider Toggle Trigger
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (showRotationSlider) Color(0xFF38BDF8) else Color.Black.copy(alpha = 0.65f))
                                .border(1.dp, if (showRotationSlider) Color.Transparent else Color.White.copy(alpha = 0.15f), CircleShape)
                                .clickable {
                                    showRotationSlider = !showRotationSlider
                                    showScaleSlider = false
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.RotateRight,
                                contentDescription = "Show rotate model controller",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        // Scale Slider Toggle Trigger
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (showScaleSlider) Color(0xFF38BDF8) else Color.Black.copy(alpha = 0.65f))
                                .border(1.dp, if (showScaleSlider) Color.Transparent else Color.White.copy(alpha = 0.15f), CircleShape)
                                .clickable {
                                    showScaleSlider = !showScaleSlider
                                    showRotationSlider = false
                                }
                                .testTag("real_scale_button"),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AspectRatio,
                                contentDescription = "Show scale model controller",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    // Native ARCore Scene Viewer Trigger
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.65f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable {
                                launchNativeSceneViewer(context, product)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.OpenInNew,
                            contentDescription = "Launch official device-native ARCore scene viewer session",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Reset Placement Trigger
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.65f))
                            .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                            .clickable {
                                rotationAngle = 180f
                                scaleFactor = 1.0f
                                isLocked = false
                                showRotationSlider = false
                                showScaleSlider = false
                                arStage = "Scanning"
                            }
                            .testTag("reset_ar_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Reset scanning system and clear coordinates",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Triggers official system-native Google ARCore Scene Viewer launcher.
 * Seamlessly transitions to physical 1:1 scale tracking inside the device core.
 */
fun launchNativeSceneViewer(context: Context, product: ProductEntity) {
    try {
        val sceneViewerUri = Uri.parse("https://arvr.google.com/scene-viewer/1.0").buildUpon()
            .appendQueryParameter("file", product.modelUrl)
            .appendQueryParameter("mode", "ar_only")
            .appendQueryParameter("title", product.name)
            .appendQueryParameter("resizable", "true")
            .build()

        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = sceneViewerUri
            setPackage("com.google.ar.core")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        
        context.startActivity(intent)
    } catch (e: Exception) {
        Toast.makeText(
            context,
            "Launching system AR viewer... Device compatibility and connection required.",
            Toast.LENGTH_LONG
        ).show()
    }
}
