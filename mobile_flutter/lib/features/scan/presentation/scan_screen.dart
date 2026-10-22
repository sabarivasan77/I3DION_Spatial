import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:i3dion_spatial_hub_mobile/app/theme.dart';
import 'package:i3dion_spatial_hub_mobile/config/app_config.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/data/scan_history_repository.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/domain/content_link.dart';
import 'package:i3dion_spatial_hub_mobile/features/scan/scanner_session.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter/services.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _history = ScanHistoryRepository();
  late final MobileScannerController _scannerController;
  late final ContentLinkValidator _validator;
  bool _handlingCode = false;
  bool _torchEnabled = false;
  String? _scanMessage;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      autoStart: false,
      detectionSpeed: DetectionSpeed.noDuplicates,
      formats: const [BarcodeFormat.qrCode],
    );
    ScannerSession.isActive.addListener(_handleSessionChanged);
    _validator = ContentLinkValidator(
      allowedHosts: AppConfig.current.qrAllowedHosts,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ScannerSession.isActive.value) _startScanner();
    });
  }

  @override
  void dispose() {
    ScannerSession.isActive.removeListener(_handleSessionChanged);
    _scannerController.dispose();
    super.dispose();
  }

  void _handleSessionChanged() {
    if (ScannerSession.isActive.value) {
      _startScanner();
    } else {
      _scannerController.stop();
    }
  }

  Future<void> _startScanner() async {
    try {
      await _scannerController.start();
    } on MobileScannerException {
      if (mounted) {
        _showMessage('Camera access is required to scan QR codes.');
      }
    }
  }

  Future<void> _handleCapture(BarcodeCapture capture) async {
    if (_handlingCode) return;
    final rawValue = capture.barcodes
        .map((barcode) => barcode.rawValue)
        .whereType<String>()
        .firstOrNull;
    if (rawValue == null) {
      _showMessage('No readable I3DION link was found in that QR code.');
      return;
    }
    await _handleValue(rawValue);
  }

  Future<void> _handleValue(String value) async {
    if (_handlingCode) return;
    final result = _validator.validate(value);
    if (!result.isAccepted) {
      await _scannerController.stop();
      if (!mounted) return;
      setState(() {
        _scanMessage = result.errorMessage;
        _handlingCode = true;
      });
      await _showRejectedLink(result.errorMessage!);
      return;
    }

    final link = result.content!;
    setState(() {
      _handlingCode = true;
      _scanMessage = null;
    });
    try {
      await _history.add(link);
    } on StateError {
      if (mounted) {
        _showMessage('Link verified, but scan history could not be saved.');
      }
    } on PlatformException {
      if (mounted) {
        _showMessage('Link verified, but scan history could not be saved.');
      }
    }
    if (!mounted) return;
    await _scannerController.stop();
    if (!mounted) return;
    await _showVerifiedLink(link);
  }

  Future<void> _showRejectedLink(String message) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.link_off_rounded,
                color: Theme.of(context).colorScheme.error,
                size: 30,
              ),
              const SizedBox(height: 12),
              Text(
                'QR code not accepted',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(message),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Scan again'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (mounted) await _restartScanner();
  }

  Future<void> _showVerifiedLink(ContentLink link) async {
    final shouldOpen = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.verified_user_rounded,
                color: AppColors.success,
                size: 30,
              ),
              const SizedBox(height: 12),
              Text(
                'I3DION link verified',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                '${link.kind.displayName} · ${link.id}',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'The link stays inside the app. Only approved I3DION content '
                'links can be opened.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(true),
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: const Text('Open content'),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Keep scanning'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (!mounted) return;
    if (shouldOpen == true) {
      ScannerSession.isActive.value = false;
      context.go(link.location);
    } else {
      _restartScanner();
    }
  }

  Future<void> _restartScanner() async {
    if (!mounted) return;
    setState(() {
      _handlingCode = false;
      _scanMessage = null;
    });
    if (ScannerSession.isActive.value) await _startScanner();
  }

  Future<void> _importFromGallery() async {
    try {
      final image = await ImagePicker().pickImage(source: ImageSource.gallery);
      if (image == null || !mounted) return;
      final capture = await _scannerController.analyzeImage(image.path);
      if (capture == null || capture.barcodes.isEmpty) {
        _showMessage('No QR code was found in that image.');
        return;
      }
      await _handleCapture(capture);
    } on MobileScannerBarcodeException {
      if (mounted) _showMessage('No QR code was found in that image.');
    } on MobileScannerException {
      if (mounted) {
        _showMessage('This image could not be scanned on this device.');
      }
    } on UnsupportedError {
      if (mounted) {
        _showMessage('Scanning a saved image is not supported on this device.');
      }
    } on PlatformException {
      if (mounted) _showMessage('The selected image could not be opened.');
    }
  }

  Future<void> _toggleTorch() async {
    try {
      await _scannerController.toggleTorch();
      if (mounted) {
        setState(() {
          _torchEnabled = !_torchEnabled;
        });
      }
    } on MobileScannerException {
      if (mounted) _showMessage('The camera torch is not available.');
    }
  }

  Future<void> _showHistory() async {
    await _scannerController.stop();
    if (!mounted) return;
    final router = GoRouter.of(context);
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _HistorySheet(
        history: _history,
        onOpen: (link) {
          Navigator.of(context).pop();
          ScannerSession.isActive.value = false;
          router.go(link.location);
        },
        onCleared: () {
          if (mounted) setState(() {});
        },
      ),
    );
    if (mounted && ScannerSession.isActive.value) await _startScanner();
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Scan I3DION QR'),
        actions: [
          IconButton(
            tooltip: 'Scan history',
            onPressed: _showHistory,
            icon: const Icon(Icons.history_rounded),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                MobileScanner(
                  controller: _scannerController,
                  onDetect: _handleCapture,
                  onDetectError: (error, stackTrace) {
                    _showMessage('The camera could not read this QR code.');
                  },
                  errorBuilder: (context, error) {
                    final permissionDenied =
                        error.errorCode ==
                        MobileScannerErrorCode.permissionDenied;
                    return _CameraErrorView(
                      title: permissionDenied
                          ? 'Camera access is off'
                          : 'Camera unavailable',
                      message: permissionDenied
                          ? 'Allow camera access to scan a QR code.'
                          : 'The scanner could not start. You can still scan '
                                'an image from your gallery.',
                      onRetry: _restartScanner,
                    );
                  },
                ),
                IgnorePointer(
                  child: Center(
                    child: Container(
                      width: 264,
                      height: 264,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white, width: 3),
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 20,
                  left: 24,
                  right: 24,
                  child: Text(
                    _scanMessage ?? 'Center an I3DION QR code in the frame',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      shadows: const [
                        Shadow(color: Colors.black, blurRadius: 8),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 28,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _ScannerAction(
                        tooltip: 'Choose an image',
                        icon: Icons.photo_library_outlined,
                        onPressed: _importFromGallery,
                      ),
                      const SizedBox(width: 28),
                      _ScannerAction(
                        tooltip: _torchEnabled
                            ? 'Turn torch off'
                            : 'Turn torch on',
                        icon: _torchEnabled
                            ? Icons.flash_on_rounded
                            : Icons.flash_off_rounded,
                        onPressed: _toggleTorch,
                      ),
                    ],
                  ),
                ),
                if (_handlingCode && _scanMessage == null)
                  Container(
                    color: Colors.black.withValues(alpha: 0.35),
                    alignment: Alignment.center,
                    child: const CircularProgressIndicator(color: Colors.white),
                  ),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            color: theme.colorScheme.surface,
            padding: const EdgeInsets.fromLTRB(24, 18, 24, 22),
            child: Text(
              'Links are checked before they open. Other websites and '
              'unsupported QR codes are blocked.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerAction extends StatelessWidget {
  const _ScannerAction({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: tooltip,
      child: IconButton.filledTonal(
        tooltip: tooltip,
        onPressed: onPressed,
        icon: Icon(icon),
        style: IconButton.styleFrom(
          minimumSize: const Size(56, 56),
          backgroundColor: Colors.white.withValues(alpha: 0.18),
          foregroundColor: Colors.white,
        ),
      ),
    );
  }
}

class _CameraErrorView extends StatelessWidget {
  const _CameraErrorView({
    required this.title,
    required this.message,
    required this.onRetry,
  });

  final String title;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.deepNavy,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.no_photography_outlined,
                color: Colors.white,
                size: 44,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: onRetry,
                child: const Text('Retry camera'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HistorySheet extends StatefulWidget {
  const _HistorySheet({
    required this.history,
    required this.onOpen,
    required this.onCleared,
  });

  final ScanHistoryRepository history;
  final ValueChanged<ContentLink> onOpen;
  final VoidCallback onCleared;

  @override
  State<_HistorySheet> createState() => _HistorySheetState();
}

class _HistorySheetState extends State<_HistorySheet> {
  late Future<List<ContentLink>> _items;
  bool _clearing = false;

  @override
  void initState() {
    super.initState();
    _items = widget.history.load();
  }

  Future<void> _clearHistory() async {
    setState(() => _clearing = true);
    try {
      await widget.history.clear();
      if (!mounted) return;
      setState(() {
        _clearing = false;
        _items = widget.history.load();
      });
      widget.onCleared();
    } on StateError {
      if (!mounted) return;
      setState(() => _clearing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Scan history could not be cleared.')),
      );
    } on PlatformException {
      if (!mounted) return;
      setState(() => _clearing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Scan history could not be cleared.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Recent scans',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: _clearing ? null : _clearHistory,
                  child: const Text('Clear'),
                ),
              ],
            ),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 420),
              child: FutureBuilder<List<ContentLink>>(
                future: _items,
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('Scan history could not be loaded.'),
                    );
                  }
                  if (!snapshot.hasData) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(),
                    );
                  }
                  final items = snapshot.data!;
                  if (items.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('Your verified QR scans will appear here.'),
                    );
                  }
                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final link = items[index];
                      return ListTile(
                        leading: const Icon(Icons.qr_code_2_rounded),
                        title: Text('${link.kind.displayName} · ${link.id}'),
                        subtitle: Text(link.host ?? 'I3DION link'),
                        onTap: () => widget.onOpen(link),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
