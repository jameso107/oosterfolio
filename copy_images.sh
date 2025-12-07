#!/bin/bash

# Create images directory if it doesn't exist
mkdir -p images

# Copy all image files from website pics folder
SOURCE_DIR="/Users/oosterhouse/Desktop/website pics"
DEST_DIR="images"

# Copy jpg files
find "$SOURCE_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.png" \) -exec cp {} "$DEST_DIR/" \;

echo "Images copied to $DEST_DIR/"
ls -1 "$DEST_DIR" | wc -l | xargs echo "Total images:"

