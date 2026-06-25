import os
import re

file_path = "d:/I3DION COMPANY FILES/i3dion-spatial/frontend/src/pages/Pages.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We'll just write the full content with different exports.
# To keep it simple and ensure no missing imports, we'll write the same big file 
# but only export specific components in each new file, and strip out the V2 features.

# Actually, the simplest way is to replace App.tsx to remove V2 features, 
# and delete the V2 components from Pages.tsx to shrink it.
