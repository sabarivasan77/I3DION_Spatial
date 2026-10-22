import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/domain/models/public_product.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';
import 'package:model_viewer_plus/model_viewer_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ModelViewerScreen extends ConsumerStatefulWidget {
  const ModelViewerScreen({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ModelViewerScreen> createState() => _ModelViewerScreenState();
}

class _ModelViewerScreenState extends ConsumerState<ModelViewerScreen> {
  late Future<PublicProduct> _productFuture;
  WebViewController? _controller;
  bool _autoRotate = true;
  bool _fullscreen = false;
  bool _modelLoaded = false;
  double _progress = 0;
  String? _viewerError;
  String? _controlError;
  int _viewerGeneration = 0;

  static const _viewerScript = '''
customElements.whenDefined('model-viewer').then(() => {
  const viewer = document.getElementById('i3dion-model');
  const reportLoaded = () => {
    I3DIONViewerStatus.postMessage(JSON.stringify({state: 'loaded'}));
  };
  viewer.addEventListener('progress', (event) => {
    I3DIONViewerStatus.postMessage(JSON.stringify({
      state: 'progress',
      progress: event.detail.totalProgress
    }));
  });
  viewer.addEventListener('load', reportLoaded, {once: true});
  viewer.addEventListener('error', () => {
    I3DIONViewerStatus.postMessage(JSON.stringify({state: 'error'}));
  });
  if (viewer.loaded) reportLoaded();
});
''';

  @override
  void initState() {
    super.initState();
    _productFuture = _loadProduct();
  }

  Future<PublicProduct> _loadProduct() =>
      ref.read(spatialRepositoryProvider).fetchProduct(widget.productId);

  @override
  void dispose() {
    if (_fullscreen) {
      unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge));
    }
    super.dispose();
  }

  void _onViewerStatus(JavaScriptMessage message) {
    try {
      final decoded = jsonDecode(message.message);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Unexpected viewer status.');
      }
      if (decoded['state'] == 'loaded') {
        if (mounted) setState(() => _modelLoaded = true);
      } else if (decoded['state'] == 'progress') {
        final value = double.tryParse(decoded['progress'] ?? '');
        if (value != null && mounted) {
          setState(() => _progress = value.clamp(0, 1));
        }
      } else if (decoded['state'] == 'error' && mounted) {
        setState(() => _viewerError = 'The published 3D model could not load.');
      }
    } on FormatException {
      if (mounted) {
        setState(
          () => _viewerError = 'The 3D viewer returned an invalid status.',
        );
      }
    }
  }

  Future<void> _runViewerCommand(String command) async {
    final controller = _controller;
    if (!_modelLoaded || controller == null) return;
    try {
      await controller.runJavaScript(command);
      if (mounted) setState(() => _controlError = null);
    } on Object {
      if (mounted) {
        setState(
          () => _controlError = 'A viewer control could not be applied.',
        );
      }
    }
  }

  Future<void> _toggleAutoRotate() async {
    final enabled = !_autoRotate;
    await _runViewerCommand(
      "document.getElementById('i3dion-model').autoRotate = $enabled;",
    );
    if (mounted && _controlError == null) {
      setState(() => _autoRotate = enabled);
    }
  }

  Future<void> _resetView() => _runViewerCommand(
    "(() => { const viewer = document.getElementById('i3dion-model'); "
    "viewer.cameraOrbit = '0deg 75deg 105%'; "
    "viewer.cameraTarget = 'auto'; viewer.jumpCameraToGoal(); })();",
  );

  Future<void> _toggleFullscreen() async {
    final fullscreen = !_fullscreen;
    await SystemChrome.setEnabledSystemUIMode(
      fullscreen ? SystemUiMode.immersiveSticky : SystemUiMode.edgeToEdge,
    );
    if (mounted) setState(() => _fullscreen = fullscreen);
  }

  void _retry() {
    setState(() {
      _modelLoaded = false;
      _progress = 0;
      _viewerError = null;
      _controlError = null;
      _viewerGeneration++;
      _productFuture = _loadProduct();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PublicProduct>(
      future: _productFuture,
      builder: (context, snapshot) {
        final product = snapshot.data;
        return Scaffold(
          appBar: _fullscreen
              ? null
              : AppBar(
                  title: Text(product?.name ?? 'Product'),
                  actions: [
                    IconButton(
                      tooltip: 'Toggle fullscreen',
                      onPressed: product == null ? null : _toggleFullscreen,
                      icon: const Icon(Icons.fullscreen_rounded),
                    ),
                  ],
                ),
          body: SafeArea(
            top: !_fullscreen,
            bottom: !_fullscreen,
            child: switch (snapshot.connectionState) {
              ConnectionState.waiting => const Center(
                child: CircularProgressIndicator(
                  semanticsLabel: 'Loading published product',
                ),
              ),
              _ when snapshot.hasError => _ViewerFailure(
                message: snapshot.error.toString(),
                onRetry: _retry,
              ),
              _ when product == null => _ViewerFailure(
                message: 'The I3DION API returned no product details.',
                onRetry: _retry,
              ),
              _ => _buildViewer(product),
            },
          ),
        );
      },
    );
  }

  Widget _buildViewer(PublicProduct product) {
    if (_viewerError case final error?) {
      return _ViewerFailure(message: error, onRetry: _retry);
    }
    return Column(
      children: [
        if (!_fullscreen)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
            child: Row(
              children: [
                const Icon(
                  Icons.cloud_done_rounded,
                  size: 18,
                  color: AppColors.success,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    product.category,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ),
                Text(
                  'Drag to orbit · pinch to zoom',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              ModelViewer(
                key: ValueKey(_viewerGeneration),
                id: 'i3dion-model',
                src: product.modelUrl.toString(),
                alt: product.name,
                ar: true,
                arModes: const ['scene-viewer', 'quick-look'],
                arScale: ArScale.auto,
                arPlacement: ArPlacement.floor,
                cameraControls: true,
                autoRotate: _autoRotate,
                cameraOrbit: '0deg 75deg 105%',
                exposure: 0.8,
                shadowIntensity: 0.8,
                backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                debugLogging: false,
                relatedJs: _viewerScript,
                javascriptChannels: {
                  JavascriptChannel(
                    'I3DIONViewerStatus',
                    onMessageReceived: _onViewerStatus,
                  ),
                },
                onWebViewCreated: (controller) {
                  _controller = controller;
                },
              ),
              if (!_modelLoaded)
                Center(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: SizedBox(
                        width: 220,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('Loading published model'),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(
                              value: _progress > 0 ? _progress : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              if (_fullscreen)
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton.filledTonal(
                    tooltip: 'Exit fullscreen',
                    onPressed: _toggleFullscreen,
                    icon: const Icon(Icons.fullscreen_exit_rounded),
                  ),
                ),
              if (_controlError case final error?)
                Align(
                  alignment: Alignment.topCenter,
                  child: MaterialBanner(
                    content: Text(error),
                    actions: [
                      TextButton(
                        onPressed: () => setState(() => _controlError = null),
                        child: const Text('Dismiss'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        if (!_fullscreen)
          _ViewerControls(
            autoRotate: _autoRotate,
            enabled: _modelLoaded,
            onAutoRotate: _toggleAutoRotate,
            onReset: _resetView,
            onFullscreen: _toggleFullscreen,
          ),
      ],
    );
  }
}

class _ViewerControls extends StatelessWidget {
  const _ViewerControls({
    required this.autoRotate,
    required this.enabled,
    required this.onAutoRotate,
    required this.onReset,
    required this.onFullscreen,
  });

  final bool autoRotate;
  final bool enabled;
  final VoidCallback onAutoRotate;
  final VoidCallback onReset;
  final VoidCallback onFullscreen;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ViewerControlButton(
                tooltip: autoRotate ? 'Stop rotation' : 'Auto-rotate',
                icon: Icons.threed_rotation_rounded,
                enabled: enabled,
                selected: autoRotate,
                onPressed: onAutoRotate,
              ),
              _ViewerControlButton(
                tooltip: 'Reset camera',
                icon: Icons.center_focus_weak_rounded,
                enabled: enabled,
                selected: false,
                onPressed: onReset,
              ),
              _ViewerControlButton(
                tooltip: 'Fullscreen',
                icon: Icons.fullscreen_rounded,
                enabled: enabled,
                selected: false,
                onPressed: onFullscreen,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ViewerControlButton extends StatelessWidget {
  const _ViewerControlButton({
    required this.tooltip,
    required this.icon,
    required this.enabled,
    required this.selected,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final bool enabled;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton.filledTonal(
      tooltip: tooltip,
      onPressed: enabled ? onPressed : null,
      isSelected: selected,
      icon: Icon(icon),
    );
  }
}

class _ViewerFailure extends StatelessWidget {
  const _ViewerFailure({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Card(
        margin: const EdgeInsets.all(24),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.cloud_off_rounded,
                size: 40,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Try again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
