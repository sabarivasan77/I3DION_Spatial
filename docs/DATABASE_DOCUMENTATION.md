# I3DION Spatial Database Schema Documentation

## Core Tables

### `companies`
- Holds tenant information.
- Columns: `id`, `name`, `created_at`

### `users`
- Stores authentication credentials and role definitions.
- Columns: `id`, `company_id`, `name`, `email`, `password_hash`, `role`, `reset_token_hash`

### `user_sessions`
- Manages secure JWT session tokens and revocations.
- Columns: `token_hash`, `user_id`, `expires_at`, `revoked_at`

## Product Management

### `products`
- Stores primary metadata for industrial products.
- Columns: `id`, `company_id`, `name`, `category`, `status`, `views`, `leads`, `image_url`, `specs` (JSONB)

### `files`
- Records files uploaded to MinIO associated with products (models, documents, imagery).
- Columns: `id`, `company_id`, `product_id`, `category`, `original_name`, `object_key`, `url`, `mime_type`

## Sales Catalogs

### `catalogs`
- Custom curated groupings of products for presentations.
- Columns: `id`, `company_id`, `name`, `status`, `slug`

### `catalog_products`
- Join table associating products to catalogs.
- Columns: `catalog_id`, `product_id`, `sort_order`

## Lead Capture & Analytics

### `leads`
- Contact details collected from public product experiences.
- Columns: `id`, `company_id`, `name`, `email`, `phone`, `company`, `product_id`, `status`, `score`, `source`

### `analytics_events`
- Granular tracking of interactions (AR view, document download, link click).
- Columns: `id`, `company_id`, `event_type`, `product_id`, `catalog_id`, `metadata` (JSONB)

### `qr_codes`
- Stores generated QR tracking codes pointing to public experiences.
- Columns: `id`, `company_id`, `entity_type`, `entity_id`, `target_url`, `qr_data_url`
