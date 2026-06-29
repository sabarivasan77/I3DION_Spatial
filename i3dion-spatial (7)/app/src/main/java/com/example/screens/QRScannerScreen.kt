package com.example.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.text.TextStyle

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.storage.ProductEntity
import com.example.viewmodel.CatalogViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun QRScannerScreen(
    viewModel: CatalogViewModel,
    onNavigateToProduct: (String) -> Unit,
    onNavigateToAR: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    DisposableEffect(lifecycleOwner) {
        onDispose {
            try {
                val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
                val cameraProvider = cameraProviderFuture.get()
                cameraProvider.unbindAll()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (!isGranted) {
            Toast.makeText(context, "Camera permission needed for scanning barcodes", Toast.LENGTH_LONG).show()
        }
    }

    // Interactive simulator panel toggle
    var isSimPanelOpen by remember { mutableStateOf(false) }
    var selectedPresetPayload by remember { mutableStateOf("") }
    var inputCustomJson by remember { mutableStateOf("") }
    
    var scannedResultProduct by remember { mutableStateOf<ProductEntity?>(null) }
    var isProcessingPayload by remember { mutableStateOf(false) }

    // Dynamic scanning radar animation state
    var animationProgress by remember { mutableStateOf(0.0f) }
    LaunchedEffect(key1 = hasCameraPermission) {
        while (true) {
            delay(30)
            animationProgress += 0.02f
            if (animationProgress > 1.0f) {
                animationProgress = 0.0f
            }
        }
    }

    val preset1 = """{
  "id": "QR-COMP-202",
  "name": "Apex Pro Ultra Compressor",
  "category": "Air Compressors",
  "model": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb",
  "thumbnail": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-PNG/BoomBox_baseColor.png",
  "description": "Enterprise grade dual screw rotary compressor imported instantly via remote QR deployment."
}"""

    val preset2 = """{
  "id": "QR-BOT-901",
  "name": "Cylindrical Bottle Vessel",
  "category": "Process Equipment",
  "model": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
  "thumbnail": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-PNG/WaterBottle_baseColor.png",
  "description": "Stainless double-sealed vacuum bottle container simulated live under cryogenic telemetry."
}"""

    fun executePayloadAction(payload: String) {
        if (isProcessingPayload) return
        isProcessingPayload = true
        scope.launch {
            val product = viewModel.handleScannedQrCode(payload)
            delay(1000) // Aesthetic delay for high-tech scanning simulation
            isProcessingPayload = false
            if (product != null) {
                scannedResultProduct = product
                Toast.makeText(context, "Decrypted Payload: ${product.name} Loaded!", Toast.LENGTH_SHORT).show()
                // Automatically navigate to the 3D model download/specifications page
                onNavigateToProduct(product.id)
            } else {
                Toast.makeText(context, "Error: Invalid I3DION Spatial Payload Format", Toast.LENGTH_LONG).show()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .navigationBarsPadding()
            .statusBarsPadding()
            .testTag("qr_scanner_box")
    ) {
        // UNDERLAY: Actual Camera View or Ask Permission Prompt
        if (hasCameraPermission) {
            AndroidView(
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build()
                        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                        
                        // Real-time ML Kit Barcode Analyzer Use Case integration
                        val imageAnalysis = androidx.camera.core.ImageAnalysis.Builder()
                            .setBackpressureStrategy(androidx.camera.core.ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                            .build()
                        
                        imageAnalysis.setAnalyzer(
                            ContextCompat.getMainExecutor(ctx),
                            com.example.services.QrCodeAnalyzer { rawValue ->
                                executePayloadAction(rawValue)
                            }
                        )

                        try {
                            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                                cameraProvider.unbindAll()
                                preview.setSurfaceProvider(previewView.surfaceProvider)
                                cameraProvider.bindToLifecycle(
                                    lifecycleOwner, 
                                    cameraSelector, 
                                    preview, 
                                    imageAnalysis
                                )
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }, ContextCompat.getMainExecutor(ctx))
                    previewView
                },
                modifier = Modifier
                    .fillMaxSize()
            )
        } else {
            // Permission request screen inline
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(48.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "Camera Permission Required",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )

                Text(
                    text = "I3DION Spatial uses the device's camera to process QR codes, read metadata parameters, and project localized 1:1 models.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(vertical = 12.dp, horizontal = 16.dp),
                    lineHeight = 18.sp
                )

                Button(
                    onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.testTag("request_camera_btn")
                ) {
                    Text("Enable Viewfinder Stream", fontWeight = FontWeight.Bold)
                }
            }
        }

        // OVERLAY: Cyber Scanner Targeting Hud overlay
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasWidth = size.width
            val canvasHeight = size.height
            val boxSize = 260.dp.toPx()
            val left = (canvasWidth - boxSize) / 2
            val top = (canvasHeight - boxSize) / 2 - 40.dp.toPx()

            // Dim everything except scanner area mask
            drawRect(
                color = Color.Black.copy(alpha = 0.65f)
            )

            // Transparent viewfinder window cutout
            drawRoundRect(
                color = Color.Transparent,
                topLeft = Offset(left, top),
                size = Size(boxSize, boxSize),
                cornerRadius = CornerRadius(20f, 20f),
                blendMode = BlendMode.Clear
            )

            // Dynamic HUD laser scanline bar
            val scanLineY = top + (boxSize * animationProgress)
            drawLine(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color(0xFF38BDF8),
                        Color(0xFF0284C7),
                        Color(0xFF38BDF8),
                        Color.Transparent
                    )
                ),
                start = Offset(left + 8.dp.toPx(), scanLineY),
                end = Offset(left + boxSize - 8.dp.toPx(), scanLineY),
                strokeWidth = 3.dp.toPx()
            )

            // Border target frame brackets
            val bracketLength = 24.dp.toPx()
            val strokeWidth = 3.dp.toPx()
            val color = Color(0xFF38BDF8)

            // Top-left bracket
            drawLine(color, Offset(left, top), Offset(left + bracketLength, top), strokeWidth)
            drawLine(color, Offset(left, top), Offset(left, top + bracketLength), strokeWidth)

            // Top-right bracket
            drawLine(color, Offset(left + boxSize, top), Offset(left + boxSize - bracketLength, top), strokeWidth)
            drawLine(color, Offset(left + boxSize, top), Offset(left + boxSize, top + bracketLength), strokeWidth)

            // Bottom-left bracket
            drawLine(color, Offset(left, top + boxSize), Offset(left + bracketLength, top + boxSize), strokeWidth)
            drawLine(color, Offset(left, top + boxSize), Offset(left, top + boxSize - bracketLength), strokeWidth)

            // Bottom-right bracket
            drawLine(color, Offset(left + boxSize, top + boxSize), Offset(left + boxSize - bracketLength, top + boxSize), strokeWidth)
            drawLine(color, Offset(left + boxSize, top + boxSize), Offset(left + boxSize, top + boxSize - bracketLength), strokeWidth)
        }

        // TOP HEADER HUD OVERLAY
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF1E293B).copy(alpha = 0.85f))
                    .border(1.dp, Color(0xFF38BDF8).copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(imageVector = Icons.Default.Sensors, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(16.dp))
                    Text(
                        text = "I3DION DEPLOYMENT VIEWPORT",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        letterSpacing = 1.2.sp
                    )
                }
            }
        }

        // BOTTOM CONTROLS & HEADLESS SCAN SIMULATOR ACTION PILLS
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(bottom = 90.dp) // Cushion above navigation bar
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Success Card if model scanned successfully
            AnimatedVisibility(
                visible = scannedResultProduct != null,
                enter = slideInVertically(initialOffsetY = { itRec -> itRec }) + fadeIn(),
                exit = fadeOut()
            ) {
                scannedResultProduct?.let { product ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                        border = BorderStroke(1.dp, Color(0xFF22C55E)),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth().testTag("scan_result_card")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "VALID ASSET EXTRACTED", color = Color(0xFF22C55E), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                IconButton(onClick = { scannedResultProduct = null }, modifier = Modifier.size(24.dp)) {
                                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(text = product.name, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                            Text(text = product.description, color = Color(0xFF94A3B8), fontSize = 12.sp, maxLines = 2, modifier = Modifier.padding(top = 2.dp))

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = { onNavigateToProduct(product.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                                    modifier = Modifier.weight(1f).height(44.dp).testTag("scan_open_details_btn")
                                ) {
                                    Text("Specs Sheet", fontSize = 12.sp)
                                }

                                Button(
                                    onClick = { onNavigateToAR(product.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                                    modifier = Modifier.weight(1.2f).height(44.dp).testTag("scan_view_ar_btn")
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.ViewInAr, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Deploy to AR", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // High-fidelity Simulator trigger bar
            Button(
                onClick = { isSimPanelOpen = !isSimPanelOpen },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.4f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("scan_simulator_pane_toggle")
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.BugReport, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (isSimPanelOpen) "HIDE SCANNER SIMULATOR" else "OPEN SCAN PANE SIMULATOR (HEADLESS MODE)",
                        color = Color(0xFF38BDF8),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = if (isSimPanelOpen) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowUp,
                        contentDescription = null,
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // SIMULATOR PANE DRAWERS
            AnimatedVisibility(
                visible = isSimPanelOpen,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131C38).copy(alpha = 0.95f)),
                    border = BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .padding(16.dp)
                            .heightIn(max = 240.dp)
                            .verticalScroll(scrollState),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "DEVELOPMENT DEPLOYMENT UTILITY",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = Color(0xFF38BDF8),
                            letterSpacing = 1.sp
                        )

                        Text(
                            text = "Since webcam streaming inside automated headless environments cannot scan physical charts, use presets below to trigger real pipeline parsing.",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8),
                            lineHeight = 14.sp
                        )

                        // Preset buttons
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Preset 1: Apex Screw Compressor
                            Button(
                                onClick = {
                                    executePayloadAction(preset1)
                                    isSimPanelOpen = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                border = BorderStroke(1.dp, Color(0xFF334155)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().testTag("simulate_preset_compressor")
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Dns, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Inject Apex Pro Compressor (COMP-202)", fontSize = 11.sp, color = Color.White)
                                }
                            }

                            // Preset 2: Cylinder Bottle
                            Button(
                                onClick = {
                                    executePayloadAction(preset2)
                                    isSimPanelOpen = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                border = BorderStroke(1.dp, Color(0xFF334155)),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().testTag("simulate_preset_bottle")
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Layers, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Inject Cylinder Distillation Bottle (BOT-901)", fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }

                        // Custom JSON manual injection
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = "OR MANUAL JSON BLOCK INJECTION", fontSize = 10.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = inputCustomJson,
                            onValueChange = { inputCustomJson = it },
                            placeholder = { Text("Paste valid I3DION product JSON payload...", color = Color(0xFF64748B), fontSize = 11.sp) },
                            textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 11.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF38BDF8),
                                unfocusedBorderColor = Color(0xFF334155)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth().height(80.dp).testTag("custom_json_qr_input")
                        )

                        Button(
                            onClick = {
                                if (inputCustomJson.isNotBlank()) {
                                    executePayloadAction(inputCustomJson)
                                    isSimPanelOpen = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.align(Alignment.End).testTag("simulate_custom_json_btn")
                        ) {
                            Text("Inject Custom Payload", fontSize = 11.sp)
                        }
                    }
                }
            }

            if (isProcessingPayload) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(color = Color(0xFF38BDF8), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = "Decrypting pipeline package telemetry...", color = Color.White, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
