import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:i3dion_spatial_hub_mobile/features/explore/providers.dart';

class ProductLikeButton extends ConsumerStatefulWidget {
  const ProductLikeButton({required this.productId, super.key});

  final String productId;

  @override
  ConsumerState<ProductLikeButton> createState() => _ProductLikeButtonState();
}

class _ProductLikeButtonState extends ConsumerState<ProductLikeButton> {
  bool? _liked;
  bool _isBusy = false;

  @override
  void initState() {
    super.initState();
    _loadLikeStatus();
  }

  Future<void> _loadLikeStatus() async {
    if (_isBusy) return;
    setState(() => _isBusy = true);
    try {
      final liked = await ref
          .read(hubReactionRepositoryProvider)
          .isProductLiked(widget.productId);
      if (mounted) setState(() => _liked = liked);
    } on Exception catch (error) {
      if (mounted) _showMessage(error.toString());
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _toggleLike() async {
    if (_isBusy) return;
    setState(() => _isBusy = true);
    try {
      final liked = _liked ?? false;
      await ref
          .read(hubReactionRepositoryProvider)
          .setProductLiked(widget.productId, liked: !liked);
      if (mounted) setState(() => _liked = !liked);
    } on Exception catch (error) {
      if (mounted) _showMessage(error.toString());
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: _liked == true ? 'Unlike product' : 'Like product',
      onPressed: _isBusy
          ? null
          : _liked == null
          ? _loadLikeStatus
          : _toggleLike,
      icon: _isBusy
          ? const SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(
              _liked == true
                  ? Icons.favorite_rounded
                  : Icons.favorite_border_rounded,
              color: _liked == true ? Colors.red : null,
            ),
    );
  }
}
