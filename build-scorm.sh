#!/bin/bash

# SCORM Package Builder for EduMaterial AI
# This script creates a SCORM 1.2 compliant package for Moodle

echo "🎓 Building SCORM Package for EduMaterial AI..."

# Define the package name
PACKAGE_NAME="edumaterial-ai-scorm"
BUILD_DIR="scorm-package"

# Clean up previous build
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning up previous build..."
    rm -rf "$BUILD_DIR"
fi

# Create build directory
echo "📁 Creating package structure..."
mkdir -p "$BUILD_DIR"

# Copy necessary files
echo "📋 Copying files..."
cp "index.html" "$BUILD_DIR/"
cp "index.css" "$BUILD_DIR/"
cp "app.js" "$BUILD_DIR/"
cp "scorm-api.js" "$BUILD_DIR/"
cp "imsmanifest.xml" "$BUILD_DIR/"
cp -r "js" "$BUILD_DIR/"
cp -r "css" "$BUILD_DIR/"

# Create the ZIP package
echo "📦 Creating SCORM package..."
cd "$BUILD_DIR"
zip -r "../${PACKAGE_NAME}.zip" ./*
cd ..

# Clean up build directory
echo "🧹 Cleaning up..."
rm -rf "$BUILD_DIR"

echo "✅ SCORM package created successfully!"
echo "📦 Package location: ${PACKAGE_NAME}.zip"
echo ""
echo "📚 To import into Moodle:"
echo "   1. Go to your Moodle course"
echo "   2. Turn editing on"
echo "   3. Click 'Add an activity or resource'"
echo "   4. Select 'SCORM package'"
echo "   5. Upload ${PACKAGE_NAME}.zip"
echo "   6. Configure settings and save"
echo ""
echo "🎉 Done!"
