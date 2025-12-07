#!/bin/bash
# Script to ensure all files are committed and pushed

cd /Users/oosterhouse/oosterfolio

echo "Adding all files..."
git add -A

echo "Checking status..."
git status

echo "Committing..."
git commit -m "Complete update: animations, photo background, updated content, and all assets"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Check https://github.com/jameso107/oosterfolio"

