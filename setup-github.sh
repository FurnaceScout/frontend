#!/bin/bash

# FurnaceScout GitHub Integration Script
# This script helps you integrate the FurnaceScout block explorer into the GitHub repository

set -e  # Exit on error

echo "🔥 FurnaceScout GitHub Integration"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install git first.${NC}"
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install bun first.${NC}"
    echo "Visit: https://bun.sh/"
    exit 1
fi

echo -e "${GREEN}✓ Git found${NC}"
echo -e "${GREEN}✓ Bun found${NC}"
echo ""

# Get current directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"
echo ""

# Ask user which method they prefer
echo "Choose integration method:"
echo "1) Push from current directory (recommended if you're in ironscout/)"
echo "2) Clone repository and copy files"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo -e "${YELLOW}Method 1: Pushing from current directory${NC}"
    echo ""

    # Check if already a git repo
    if [ -d ".git" ]; then
        echo -e "${YELLOW}⚠ This directory is already a git repository${NC}"
        read -p "Do you want to remove existing .git and start fresh? (y/n): " remove_git

        if [ "$remove_git" = "y" ]; then
            rm -rf .git
            echo -e "${GREEN}✓ Removed existing git repository${NC}"
        else
            echo -e "${YELLOW}Keeping existing git repository...${NC}"
        fi
    fi

    # Initialize git if needed
    if [ ! -d ".git" ]; then
        echo "Initializing git repository..."
        git init
        echo -e "${GREEN}✓ Git initialized${NC}"
    fi

    # Add remote
    echo "Adding GitHub remote..."
    git remote remove origin 2>/dev/null || true
    git remote add origin https://github.com/FurnaceScout/frontend.git
    echo -e "${GREEN}✓ Remote added${NC}"

    # Install dependencies
    echo ""
    echo "Installing dependencies..."
    if bun install; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi

    # Add all files
    echo ""
    echo "Adding files to git..."
    git add .
    echo -e "${GREEN}✓ Files staged${NC}"

    # Commit
    echo ""
    echo "Creating commit..."
    git commit -m "Initial commit: FurnaceScout block explorer

- Next.js 16 with App Router
- Viem for blockchain interaction
- Contract interaction with read/write functions
- Block, transaction, and address explorer
- Transaction decoding with ABI support
- Wallet integration via Wagmi
- Modern UI with Tailwind CSS v4
- Real-time block and transaction updates
- ABI upload and management
- Dark mode support"

    echo -e "${GREEN}✓ Commit created${NC}"

    # Create main branch
    git branch -M main

    # Ask if they want to push now
    echo ""
    read -p "Push to GitHub now? (y/n): " push_now

    if [ "$push_now" = "y" ]; then
        echo "Pushing to GitHub..."
        if git push -u origin main; then
            echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
        else
            echo -e "${RED}❌ Failed to push. You may need to authenticate or check permissions.${NC}"
            echo "Try running: git push -u origin main"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping push. Run this command when ready:${NC}"
        echo "  git push -u origin main"
    fi

elif [ "$choice" = "2" ]; then
    echo ""
    echo -e "${YELLOW}Method 2: Clone and copy${NC}"
    echo ""

    # Ask for destination
    read -p "Enter destination directory name (default: furnacescout): " dest_dir
    dest_dir=${dest_dir:-furnacescout}

    if [ -d "$dest_dir" ]; then
        echo -e "${RED}❌ Directory $dest_dir already exists${NC}"
        exit 1
    fi

    # Clone repository
    echo "Cloning GitHub repository..."
    if git clone https://github.com/FurnaceScout/frontend.git "$dest_dir"; then
        echo -e "${GREEN}✓ Repository cloned${NC}"
    else
        echo -e "${RED}❌ Failed to clone repository${NC}"
        exit 1
    fi

    cd "$dest_dir"

    # Copy files (excluding .git and node_modules)
    echo ""
    echo "Copying files from $CURRENT_DIR..."

    # Create directories
    mkdir -p app lib public

    # Copy all necessary files
    cp -r "$CURRENT_DIR/app/"* app/ 2>/dev/null || true
    cp -r "$CURRENT_DIR/lib/"* lib/ 2>/dev/null || true
    cp -r "$CURRENT_DIR/public/"* public/ 2>/dev/null || true

    # Copy config files
    cp "$CURRENT_DIR/package.json" . 2>/dev/null || true
    cp "$CURRENT_DIR/.gitignore" . 2>/dev/null || true
    cp "$CURRENT_DIR/.env.local" . 2>/dev/null || true
    cp "$CURRENT_DIR/README.md" . 2>/dev/null || true
    cp "$CURRENT_DIR/next.config.mjs" . 2>/dev/null || true
    cp "$CURRENT_DIR/postcss.config.mjs" . 2>/dev/null || true
    cp "$CURRENT_DIR/jsconfig.json" . 2>/dev/null || true
    cp "$CURRENT_DIR/biome.json" . 2>/dev/null || true

    echo -e "${GREEN}✓ Files copied${NC}"

    # Install dependencies
    echo ""
    echo "Installing dependencies..."
    if bun install; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi

    # Test build
    echo ""
    read -p "Test the build locally before pushing? (y/n): " test_build

    if [ "$test_build" = "y" ]; then
        echo "Starting development server..."
        echo "Press Ctrl+C when done testing"
        echo ""
        bun dev &
        DEV_PID=$!

        echo ""
        echo -e "${GREEN}Dev server running at http://localhost:3000${NC}"
        echo "Press Enter when you're done testing..."
        read

        kill $DEV_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Dev server stopped${NC}"
    fi

    # Git add and commit
    echo ""
    echo "Committing changes..."
    git add .
    git commit -m "Initial commit: FurnaceScout block explorer"
    echo -e "${GREEN}✓ Changes committed${NC}"

    # Ask if they want to push
    echo ""
    read -p "Push to GitHub now? (y/n): " push_now

    if [ "$push_now" = "y" ]; then
        echo "Pushing to GitHub..."
        if git push origin main; then
            echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"
        else
            echo -e "${RED}❌ Failed to push${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping push. Run this command when ready:${NC}"
        echo "  cd $dest_dir && git push origin main"
    fi

else
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}🔥 Integration Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Start Anvil: anvil"
echo "2. Start dev server: bun dev"
echo "3. Open http://localhost:3000"
echo ""
echo "📖 Read INTEGRATION_GUIDE.md for more details"
echo "📖 Read README.md for usage instructions"
echo ""
echo -e "${GREEN}Happy exploring with FurnaceScout! 🔥${NC}"
