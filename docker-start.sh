#!/usr/bin/env bash

# IronScout Docker Quick Start Script
# This script helps you quickly get IronScout running in Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_RPC_URL="http://host.docker.internal:8545"
DEFAULT_PORT=3000
CONTAINER_NAME="ironscout"

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   IronScout Docker Launcher${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker is running
check_docker_running() {
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Anvil is running
check_anvil() {
    print_info "Checking for Anvil on localhost:8545..."
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        http://localhost:8545 &> /dev/null; then
        print_success "Anvil is running on localhost:8545"
        return 0
    else
        print_warning "Anvil is not running on localhost:8545"
        return 1
    fi
}

# Stop existing container
stop_existing() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Stopping existing ${CONTAINER_NAME} container..."
        docker stop ${CONTAINER_NAME} &> /dev/null || true
        docker rm ${CONTAINER_NAME} &> /dev/null || true
        print_success "Removed existing container"
    fi
}

# Build Docker image
build_image() {
    print_info "Building IronScout Docker image..."
    if docker build -t ironscout:latest . > /tmp/ironscout-build.log 2>&1; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        echo "Check /tmp/ironscout-build.log for details"
        exit 1
    fi
}

# Start container
start_container() {
    local rpc_url=$1
    local port=$2
    local project_path=$3

    print_info "Starting IronScout container..."

    # Build docker run command
    local docker_cmd="docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${port}:3000 \
        -e NEXT_PUBLIC_RPC_URL=${rpc_url} \
        -e NODE_ENV=production \
        -e NEXT_TELEMETRY_DISABLED=1"

    # Add host gateway for non-Mac/Windows systems
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        docker_cmd="${docker_cmd} --add-host=host.docker.internal:host-gateway"
    fi

    # Add volume mount if project path is provided
    if [[ -n "$project_path" ]]; then
        docker_cmd="${docker_cmd} -v ${project_path}:/foundry-project:ro"
    else
        # Mount current directory by default
        docker_cmd="${docker_cmd} -v $(pwd):/foundry-project:ro"
    fi

    # Add restart policy
    docker_cmd="${docker_cmd} --restart unless-stopped"

    # Run the container
    docker_cmd="${docker_cmd} ironscout:latest"

    if eval $docker_cmd; then
        print_success "IronScout container started"
        return 0
    else
        print_error "Failed to start container"
        return 1
    fi
}

# Wait for container to be healthy
wait_for_health() {
    local port=$1
    print_info "Waiting for IronScout to be ready..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:${port}/ > /dev/null 2>&1; then
            print_success "IronScout is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    print_warning "Health check timeout. Container may still be starting..."
    return 1
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -r, --rpc-url URL       RPC endpoint URL (default: ${DEFAULT_RPC_URL})
    -p, --port PORT         Port to expose (default: ${DEFAULT_PORT})
    -d, --project-dir PATH  Foundry project directory to mount
    -b, --build             Force rebuild of Docker image
    -s, --stop              Stop the running container
    -l, --logs              Show container logs
    -c, --compose           Use docker-compose instead
    -h, --help              Show this help message

Examples:
    # Basic start (Anvil on host)
    $0

    # Custom RPC endpoint
    $0 --rpc-url http://localhost:9545

    # Custom port
    $0 --port 3001

    # Mount specific Foundry project
    $0 --project-dir /path/to/my/foundry/project

    # Force rebuild
    $0 --build

    # Use docker-compose
    $0 --compose
EOF
}

# Main function
main() {
    local rpc_url=$DEFAULT_RPC_URL
    local port=$DEFAULT_PORT
    local project_path=""
    local force_build=false
    local use_compose=false
    local show_logs=false
    local stop_only=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--rpc-url)
                rpc_url="$2"
                shift 2
                ;;
            -p|--port)
                port="$2"
                shift 2
                ;;
            -d|--project-dir)
                project_path="$2"
                shift 2
                ;;
            -b|--build)
                force_build=true
                shift
                ;;
            -s|--stop)
                stop_only=true
                shift
                ;;
            -l|--logs)
                show_logs=true
                shift
                ;;
            -c|--compose)
                use_compose=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    print_header

    # Handle stop-only
    if [ "$stop_only" = true ]; then
        stop_existing
        print_success "IronScout stopped"
        exit 0
    fi

    # Handle logs-only
    if [ "$show_logs" = true ]; then
        print_info "Showing IronScout logs (Ctrl+C to exit)..."
        docker logs -f ${CONTAINER_NAME}
        exit 0
    fi

    # Perform checks
    check_docker
    check_docker_running

    # Check for Anvil (warning only)
    if ! check_anvil; then
        print_info "You can start Anvil with: anvil --host 0.0.0.0"
        echo ""
        read -p "Continue without Anvil? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi

    # Use docker-compose if requested
    if [ "$use_compose" = true ]; then
        print_info "Using docker-compose..."
        if [ ! -f "docker-compose.yml" ]; then
            print_error "docker-compose.yml not found"
            exit 1
        fi
        docker-compose up -d
        print_success "Started with docker-compose"
        docker-compose ps
        exit 0
    fi

    # Stop existing container
    stop_existing

    # Build or rebuild image
    if [ "$force_build" = true ] || ! docker images | grep -q "ironscout"; then
        build_image
    else
        print_info "Using existing Docker image (use --build to rebuild)"
    fi

    # Start container
    if start_container "$rpc_url" "$port" "$project_path"; then
        echo ""
        # Wait for health check
        wait_for_health "$port"

        echo ""
        print_success "🚀 IronScout is running!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}  URL:${NC}         http://localhost:${port}"
        echo -e "${GREEN}  RPC:${NC}         ${rpc_url}"
        echo -e "${GREEN}  Container:${NC}   ${CONTAINER_NAME}"
        if [[ -n "$project_path" ]]; then
            echo -e "${GREEN}  Project:${NC}     ${project_path}"
        else
            echo -e "${GREEN}  Project:${NC}     $(pwd)"
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Useful commands:"
        echo "  View logs:       docker logs -f ${CONTAINER_NAME}"
        echo "  Stop container:  docker stop ${CONTAINER_NAME}"
        echo "  Restart:         docker restart ${CONTAINER_NAME}"
        echo "  Stop script:     $0 --stop"
        echo "  Show logs:       $0 --logs"
        echo ""
    else
        print_error "Failed to start IronScout"
        echo "Check logs with: docker logs ${CONTAINER_NAME}"
        exit 1
    fi
}

# Run main function
main "$@"
