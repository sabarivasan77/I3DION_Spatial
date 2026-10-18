import os
from PIL import Image
import numpy as np

img_path = r"C:\Users\sabar\.gemini\antigravity-ide\brain\4519b0f6-4265-4ce5-a65c-f4a711fcce9f\.user_uploaded\media_1792318659853.jpg"
orig = Image.open(img_path).convert('RGB')
arr = np.array(orig)

out_dir = r"frontend/public/assets/logos"
os.makedirs(out_dir, exist_ok=True)

# The 6 products in exact order from the master image:
products = [
    {'key': 'hub', 'name': 'I3DION Spatial Hub', 'col': 0, 'cy': 536},
    {'key': 'vault', 'name': 'I3DION Spatial Vault', 'col': 1, 'cy': 536},
    {'key': 'engine', 'name': 'I3DION Spatial Engine', 'col': 2, 'cy': 532},
    {'key': 'lens', 'name': 'I3DION Spatial Lens', 'col': 3, 'cy': 535},
    {'key': 'studio', 'name': 'I3DION Omni Studio', 'col': 4, 'cy': 535},
    {'key': 'flow', 'name': 'I3DION Flow', 'col': 5, 'cy': 530},
]

for p in products:
    i = p['col']
    cx = int((i + 0.5) * 170.66)
    cy = p['cy']
    
    # 150x150 crop centered on icon
    half_size = 75
    
    x1 = cx - half_size
    x2 = cx + half_size
    y1 = cy - half_size
    y2 = cy + half_size
    
    crop = orig.crop((x1, y1, x2, y2))
    crop_arr = np.array(crop).astype(float)
    
    # Save standard cropped version (card background)
    crop.save(os.path.join(out_dir, f"{p['key']}-card.png"), quality=100)
    
    # Background color estimation from the 4 outer corners
    corners = np.concatenate([
        crop_arr[:12, :12].reshape(-1, 3),
        crop_arr[:12, -12:].reshape(-1, 3),
        crop_arr[-12:, :12].reshape(-1, 3),
        crop_arr[-12:, -12:].reshape(-1, 3)
    ], axis=0)
    bg_color = np.median(corners, axis=0)
    
    # Calculate distance from background in color space
    diff = crop_arr - bg_color
    dist = np.sqrt(np.sum(diff ** 2, axis=2))
    
    # Soft alpha matte with smooth antialiased edges
    alpha = np.clip((dist - 12.0) / (34.0 - 12.0), 0.0, 1.0)
    
    rgba = np.zeros((crop.height, crop.width, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(crop_arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)
    
    trans_img = Image.fromarray(rgba, 'RGBA')
    trans_img.save(os.path.join(out_dir, f"{p['key']}.png"))
    
    # Also save double resolution smoothed
    badge_512 = trans_img.resize((256, 256), Image.Resampling.LANCZOS)
    badge_512.save(os.path.join(out_dir, f"{p['key']}-256.png"))
    
    # Crop the full top card as well (banner / vertical card)
    col_x1 = int(i * 170.66)
    col_x2 = int((i + 1) * 170.66)
    top_card = orig.crop((col_x1, 0, col_x2, 340))
    top_card.save(os.path.join(out_dir, f"{p['key']}-card-full.png"))

    print(f"Extracted {p['key']} successfully.")

print("All 6 product logos extracted and saved into frontend/public/assets/logos/!")
