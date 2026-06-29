package com.example.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.geometry.Offset
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.viewmodel.CatalogViewModel
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    viewModel: CatalogViewModel,
    onNavigateToLogin: () -> Unit,
    onNavigateToSignup: () -> Unit,
    onCompleteDemo: () -> Unit
) {
    val sessionManager = viewModel.sessionManager
    var hasSeenDemoState by remember { mutableStateOf(sessionManager.hasSeenDemo) }
    var currentStep by remember { mutableStateOf(1) }

    // Stepper Variables
    var downloadProgress by remember { mutableStateOf(0f) }
    var isDownloading by remember { mutableStateOf(false) }
    var isDownloaded by remember { mutableStateOf(false) }

    // Simulated AR States
    var scaleValue by remember { mutableStateOf(1f) }
    var rotationValue by remember { mutableStateOf(45f) }
    var isPositionLocked by remember { mutableStateOf(false) }

    // Simulation effect for downloading the Demo Model
    LaunchedEffect(isDownloading) {
        if (isDownloading) {
            downloadProgress = 0f
            while (downloadProgress < 1.0f) {
                delay(120)
                downloadProgress += 0.08f
            }
            downloadProgress = 1.0f
            isDownloading = false
            isDownloaded = true
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        modifier = Modifier.testTag("welcome_screen_scaffold")
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Ambient grid background effect
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.06f),
                                Color.Transparent
                            )
                        )
                    )
            )

            if (!hasSeenDemoState) {
                // MULTI-STEP DEMO PROCESS
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp)
                        .navigationBarsPadding()
                        .statusBarsPadding(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top Progress Bar Dots
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        for (i in 1..5) {
                            Box(
                                modifier = Modifier
                                    .padding(horizontal = 4.dp)
                                    .size(width = if (currentStep == i) 24.dp else 8.dp, height = 8.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (currentStep == i) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.outline
                                    )
                            )
                        }
                    }

                    // Dynamic Transition Content based on step
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .padding(vertical = 12.dp)
                    ) {
                        AnimatedContent(
                            targetState = currentStep,
                            transitionSpec = {
                                if (targetState > initialState) {
                                    slideInHorizontally(animationSpec = tween(300)) { it } + fadeIn(animationSpec = tween(300)) togetherWith
                                            slideOutHorizontally(animationSpec = tween(300)) { -it } + fadeOut(animationSpec = tween(300))
                                } else {
                                    slideInHorizontally(animationSpec = tween(300)) { -it } + fadeIn(animationSpec = tween(300)) togetherWith
                                            slideOutHorizontally(animationSpec = tween(300)) { it } + fadeOut(animationSpec = tween(300))
                                }
                            },
                            label = "stepTransition"
                        ) { step ->
                            when (step) {
                                1 -> StepWelcome()
                                2 -> StepWhatIsI3dion()
                                3 -> StepTryDemoProduct(
                                    isDownloading = isDownloading,
                                    isDownloaded = isDownloaded,
                                    downloadProgress = downloadProgress,
                                    onStartDownload = { isDownloading = true }
                                )
                                4 -> StepTryARSim(
                                    scaleValue = scaleValue,
                                    rotationValue = rotationValue,
                                    isLocked = isPositionLocked,
                                    onScaleChange = { scaleValue = it },
                                    onRotationChange = { rotationValue = it },
                                    onToggleLock = { isPositionLocked = !isPositionLocked }
                                )
                                5 -> StepCompleteSetup()
                            }
                        }
                    }

                    // Bottom Navigation Buttons
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (currentStep > 1) {
                            OutlinedButton(
                                onClick = { currentStep-- },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .height(50.dp)
                                    .weight(1f)
                                    .padding(end = 6.dp)
                                    .testTag("onboarding_back_btn")
                            ) {
                                Text("Back", fontWeight = FontWeight.Bold)
                            }
                        }

                        Button(
                            onClick = {
                                if (currentStep < 5) {
                                    currentStep++
                                } else {
                                    // Complete flow
                                    sessionManager.hasSeenDemo = true
                                    sessionManager.isLoggedIn = true // Enable instant access to platform features
                                    hasSeenDemoState = true
                                    onCompleteDemo()
                                }
                            },
                            enabled = when (currentStep) {
                                3 -> isDownloaded
                                4 -> isPositionLocked
                                else -> true
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .height(50.dp)
                                .weight(if (currentStep > 1) 1.5f else 1f)
                                .padding(start = if (currentStep > 1) 6.dp else 0.dp)
                                .testTag("onboarding_next_btn")
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = when (currentStep) {
                                        3 -> if (isDownloaded) "Continue to AR Mode" else "Download model to proceed"
                                        4 -> if (isPositionLocked) "Go to Setup" else "Position & lock object"
                                        5 -> "Enter Platform"
                                        else -> "Continue"
                                    },
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(
                                    imageVector = if (currentStep == 5) Icons.Default.CheckCircle else Icons.AutoMirrored.Filled.ArrowForward,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            } else {
                // NORMAL PORTAL GATE (Seen demo before)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp)
                        .navigationBarsPadding()
                        .statusBarsPadding(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 48.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(110.dp)
                                .clip(RoundedCornerShape(26.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(26.dp))
                                .padding(2.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.img_logo),
                                contentDescription = "I3DION Spatial Logo",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(RoundedCornerShape(24.dp)),
                                contentScale = ContentScale.Crop
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Text(
                            text = "I3DION SPATIAL",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 4.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )

                        Text(
                            text = "INDUSTRIAL AR PRODUCT EXPERIENCE PLATFORM",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = MaterialTheme.colorScheme.primary,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                    ) {
                        Text(
                            text = "Welcome to Industrial AR",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Inspect, walk around, and measure enterprise machinery in 1:1 scale with military grade surface persistence. Access physical assets offline anywhere.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            lineHeight = 20.sp
                        )
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Button(
                            onClick = onNavigateToLogin,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("welcome_signin_button")
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Sign In to Enterprise", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                            }
                        }

                        OutlinedButton(
                            onClick = onNavigateToSignup,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("welcome_signup_button")
                        ) {
                            Text("Create Account", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        }

                        // Accessibility shortcut to replay demo
                        Text(
                            text = "Replay Introductory Demonstration",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .align(Alignment.CenterHorizontally)
                                .clickable { hasSeenDemoState = false; currentStep = 1 }
                                .padding(8.dp)
                        )
                    }
                }
            }
        }
    }
}

// ================= STEP COMPOSABLES =================

@Composable
fun StepWelcome() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(130.dp)
                .clip(RoundedCornerShape(32.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(32.dp))
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.img_logo),
                contentDescription = "Brand Emblem",
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(28.dp)),
                contentScale = ContentScale.Crop
            )
        }

        Spacer(modifier = Modifier.height(30.dp))

        Text(
            text = "Welcome to I3DION Spatial",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "This platform provides an Industrial AR Product Experience. Over the next few steps, we will synchronize your local sandbox environment and simulate placing an active 3D CAD model.",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
    }
}

@Composable
fun StepWhatIsI3dion() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(androidx.compose.foundation.rememberScrollState())
            .padding(horizontal = 8.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Transforming Field Assets",
            fontSize = 22.sp,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(20.dp))

        OnboardingFeatureRow(
            icon = Icons.Default.PrecisionManufacturing,
            title = "High-Fidelity CAD Engine",
            desc = "Synchronize real GLB models of turbines, generators, and compressors to walk through structural specs."
        )

        Spacer(modifier = Modifier.height(16.dp))

        OnboardingFeatureRow(
            icon = Icons.Default.Layers,
            title = "AR Floor plane Alignment",
            desc = "Military-grade spatial tracking scans horizontal planes to lock physical anchors and maintain scale."
        )

        Spacer(modifier = Modifier.height(16.dp))

        OnboardingFeatureRow(
            icon = Icons.Default.WifiOff,
            title = "Zero-Connectivity Storage",
            desc = "Full offline capability allows technical sales teams and managers to launch visualizers anytime."
        )
    }
}

@Composable
fun StepTryDemoProduct(
    isDownloading: Boolean,
    isDownloaded: Boolean,
    downloadProgress: Float,
    onStartDownload: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "1. Sync Demo Product",
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Every displayed device is supported by a real model file. Download this initial asset to register the CAD metadata.",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Demo product container
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(1.dp, RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.EnergySavingsLeaf,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(32.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Apex Pro Ultra Compressor",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Air Compressors • GLB CAD Layout",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "A dual screw rotary compressor providing direct scale deployment. Highly efficient floor footprint layout planning.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 16.sp
                )

                Spacer(modifier = Modifier.height(18.dp))

                Divider(color = MaterialTheme.colorScheme.outline)

                Spacer(modifier = Modifier.height(14.dp))

                if (!isDownloading && !isDownloaded) {
                    Button(
                        onClick = onStartDownload,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Download Demo Model", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else if (isDownloading) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Syncing CAD Blocks...", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                            Text("${(downloadProgress * 100).toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = { downloadProgress },
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.outline,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(CircleShape)
                        )
                    }
                } else if (isDownloaded) {
                    Surface(
                        color = Color(0xFF22C55E).copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, Color(0xFF22C55E)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Model Sandboxed & Ready", color = Color(0xFF22C55E), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StepTryARSim(
    scaleValue: Float,
    rotationValue: Float,
    isLocked: Boolean,
    onScaleChange: (Float) -> Unit,
    onRotationChange: (Float) -> Unit,
    onToggleLock: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "2. Active AR Placement",
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Walk around the product to inspect parts. Use physical scaling, touch rotations, and lock coordinates in spatial tracking.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Large simulated AR Camera box with plane target lines
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF0F172A)) // Underlay is 10% dark accent viewport
                .border(2.dp, if (isLocked) Color(0xFF22C55E) else MaterialTheme.colorScheme.primary, RoundedCornerShape(16.dp))
        ) {
            // Simulated Floor Grid (drawn with custom lines)
            Canvas(modifier = Modifier.fillMaxSize()) {
                val stepX = 40.dp.toPx()
                val stepY = 40.dp.toPx()
                for (x in 0..(this.size.width / stepX).toInt()) {
                    drawLine(
                        color = Color(0xFF38BDF8).copy(alpha = 0.08f),
                        start = Offset(x * stepX, 0f),
                        end = Offset(x * stepX, this.size.height),
                        strokeWidth = 1.dp.toPx()
                    )
                }
                for (y in 0..(this.size.height / stepY).toInt()) {
                    drawLine(
                        color = Color(0xFF38BDF8).copy(alpha = 0.08f),
                        start = Offset(0f, y * stepY),
                        end = Offset(this.size.width, y * stepY),
                        strokeWidth = 1.dp.toPx()
                    )
                }
            }

            // Animated Placement Targets
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Simulated rotating compressor preview representation
                Box(
                    modifier = Modifier
                        .size((110 * scaleValue).dp)
                        .graphicsLayer(rotationZ = rotationValue)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isLocked) Color(0xFF22C55E).copy(alpha = 0.15f) else Color(0xFF38BDF8).copy(alpha = 0.15f))
                        .border(1.5.dp, if (isLocked) Color(0xFF22C55E) else Color(0xFF38BDF8), RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.SettingsInputComponent,
                        contentDescription = null,
                        tint = if (isLocked) Color(0xFF22C55E) else Color(0xFF38BDF8),
                        modifier = Modifier.fillMaxSize(0.5f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (isLocked) "Position Anchored (Fixed)" else "Plane Plane Detected: Placing...",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isLocked) Color(0xFF22C55E) else Color(0xFF38BDF8)
                )
            }

            // Top-left small floating controller
            Surface(
                color = Color.Black.copy(alpha = 0.6f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .padding(10.dp)
                    .align(Alignment.TopStart)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(if (isLocked) Color(0xFF22C55E) else Color(0xFFF59E0B)))
                    Text(
                        text = if (isLocked) "ANCHOR LOCKED" else "POSITIONING",
                        color = Color.White,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            // Lock Action Button in bottom-right corner
            Button(
                onClick = onToggleLock,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isLocked) Color(0xFF22C55E) else MaterialTheme.colorScheme.primary,
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .padding(10.dp)
                    .align(Alignment.BottomEnd)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = if (isLocked) "Unlock" else "Lock Position", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Custom touch adjustments (Scale & Rotate sliders)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Scale: ${String.format("%.1fx", scaleValue)}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Rotation: ${rotationValue.toInt()}°", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Scale bar
                Slider(
                    value = scaleValue,
                    onValueChange = { if (!isLocked) onScaleChange(it) },
                    valueRange = 0.5f..2.0f,
                    modifier = Modifier.weight(1f)
                )

                // Rotation bar
                Slider(
                    value = rotationValue,
                    onValueChange = { if (!isLocked) onRotationChange(it) },
                    valueRange = 0f..360f,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun StepCompleteSetup() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .clip(CircleShape)
                .background(Color(0xFF22C55E).copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = Color(0xFF22C55E),
                modifier = Modifier.size(64.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Platform Core Ready",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Calibration complete. You are logged in with credential keys as 'Sabari S' for direct evaluation. Scan QR models, launch layouts, and save favorites instantly.",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
    }
}

@Composable
fun OnboardingFeatureRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    desc: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(1.dp, RoundedCornerShape(14.dp), clip = false)
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = desc,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 15.sp
            )
        }
    }
}
