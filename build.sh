#!/bin/bash
# Build script for Vercel deployment
set -e

echo "Installing dependencies..."
npm ci

echo "Building application..."
npx --yes vite build

echo "Build completed successfully!"
