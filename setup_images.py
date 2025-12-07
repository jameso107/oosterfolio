#!/usr/bin/env python3
import os
import shutil
import glob

# Create images directory
images_dir = os.path.join(os.path.dirname(__file__), 'images')
os.makedirs(images_dir, exist_ok=True)

# Source directory
source_dir = '/Users/oosterhouse/Desktop/website pics'

# Copy all image files
count = 0
for ext in ['*.jpg', '*.png', '*.JPG', '*.PNG']:
    pattern = os.path.join(source_dir, ext)
    for file in glob.glob(pattern):
        try:
            shutil.copy2(file, images_dir)
            count += 1
            print(f"Copied: {os.path.basename(file)}")
        except Exception as e:
            print(f"Error copying {file}: {e}")

print(f"\n✅ Successfully copied {count} images to {images_dir}")
print(f"📁 Images folder: {images_dir}")

