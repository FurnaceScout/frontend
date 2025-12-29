# Docker Deployment Guide

> **⚠️ DISCLAIMER**: FurnaceScout is an unofficial, community-built tool. It is not affiliated with, maintained by, or endorsed by the Foundry team or Paradigm.

This guide covers running FurnaceScout in Docker for development and production environments.

## Quick Start

### 1. Using Docker Compose (Recommended)

```bash
# Build and start FurnaceScout
docker-compose up -d

# View logs
docker-compose logs -f furnacescout

# Stop services
docker-compose down
```

Access FurnaceScout at: http://localhost:3000

### 2. Using Docker CLI

```bash
# Build the image
docker build -t furnacescout .

# Run the container
docker run -d \
  --name furnacescout \
  -p 3000:3000 \
  -e NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8545 \
  -v $(pwd):/foundry-project:ro \
  --add-host=host.docker.internal:host-gateway \
  furnacescout

# View logs
docker logs -f furnacescout

# Stop container
docker stop furnacescout
docker rm furnacescout
```

## Prerequisites

- Docker 20.10+ or Docker Desktop
- Docker Compose 2.0+ (optional but recommended)
- Anvil or another RPC endpoint running

## Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimization:

1. **deps**: Installs dependencies using Bun
2. **builder**: Builds the Next.js application
3. **runner**: Slim production image with only runtime dependencies

**Benefits**:
- Smaller final image (~200MB vs 1GB+)
- Faster deployments
- Better security (minimal attack surface)
- Non-root user execution

### Image Details

- **Base**: `oven/bun:1-slim`
- **Runtime**: Bun (faster than Node.js)
- **User**: Non-root (nextjs:nodejs)
- **Port**: 3000
- **Health Check**: Enabled (30s interval)

## Configuration

### Environment Variables

Create a `.env.docker` file (see `.env.docker.example`):

```env
# RPC endpoint
NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8545

# Node environment
NODE_ENV=production

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

Load environment file:

```bash
docker-compose --env-file .env.docker up -d
```

### Volume Mounts

Mount your Foundry project to enable deployment scanning:

```yaml
volumes:
  # Mount current directory (if FurnaceScout is in your Foundry project)
  - ./:/foundry-project:ro
  
  # Mount external Foundry project
  - /path/to/foundry/project:/foundry-project:ro
```

**Important**: Use `:ro` (read-only) for security.

## Network Configurations

### Option 1: Anvil on Host (Recommended)

**Setup**:
- Anvil runs on host machine
- FurnaceScout in Docker connects via `host.docker.internal`

**RPC URL**: `http://host.docker.internal:8545`

**Start Anvil**:
```bash
anvil --host 0.0.0.0
```

**Docker Compose**:
```yaml
services:
  furnacescout:
    environment:
      - NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8545
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**Pros**:
- Easy to restart Anvil without affecting FurnaceScout
- Better for development workflow
- Simpler debugging

### Option 2: Anvil in Docker

**Setup**:
- Both Anvil and FurnaceScout in Docker network
- Services communicate via service names

**RPC URL**: `http://anvil:8545`

**Docker Compose**:
```yaml
services:
  anvil:
    image: ghcr.io/foundry-rs/foundry:latest
    command: anvil --host 0.0.0.0 --chain-id 31337
    ports:
      - "8545:8545"
    networks:
      - furnacescout-network
  
  furnacescout:
    environment:
      - NEXT_PUBLIC_RPC_URL=http://anvil:8545
    networks:
      - furnacescout-network
```

**Pros**:
- Isolated environment
- Easy to deploy together
- Consistent across machines

### Option 3: Remote RPC

**Setup**:
- Connect to external RPC endpoint
- No Anvil needed

**RPC URL**: `https://your-rpc-endpoint.com`

**Note**: Foundry deployment scanning won't work with remote RPCs.

## Common Use Cases

### Development Setup

```bash
# Terminal 1: Start Anvil
anvil --host 0.0.0.0

# Terminal 2: Start FurnaceScout in Docker
docker-compose up -d

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# View in FurnaceScout
open http://localhost:3000/deployments
```

### Production Build

```bash
# Build optimized image
docker build --target runner -t furnacescout:latest .

# Run with production settings
docker run -d \
  --name furnacescout \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_RPC_URL=http://your-rpc:8545 \
  --restart unless-stopped \
  furnacescout:latest
```

### Multiple Foundry Projects

```bash
# Project 1
docker run -d \
  --name furnacescout-project1 \
  -p 3001:3000 \
  -v /path/to/project1:/foundry-project:ro \
  -e NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8545 \
  furnacescout

# Project 2
docker run -d \
  --name furnacescout-project2 \
  -p 3002:3000 \
  -v /path/to/project2:/foundry-project:ro \
  -e NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8546 \
  furnacescout
```

### CI/CD Integration

```yaml
# .github/workflows/docker.yml
name: Build Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t furnacescout:${{ github.sha }} .
      
      - name: Test container
        run: |
          docker run -d --name test -p 3000:3000 furnacescout:${{ github.sha }}
          sleep 10
          curl -f http://localhost:3000/ || exit 1
          docker stop test
```

## Troubleshooting

### Cannot connect to Anvil on host

**Symptoms**: "Failed to fetch" or "Connection refused" errors

**Solutions**:

1. **Linux**: Add host gateway
   ```bash
   docker run --add-host=host.docker.internal:host-gateway ...
   ```

2. **Check Anvil binding**:
   ```bash
   # Wrong (localhost only)
   anvil
   
   # Correct (accepts external connections)
   anvil --host 0.0.0.0
   ```

3. **Check firewall**:
   ```bash
   # Allow port 8545
   sudo ufw allow 8545
   ```

### Foundry files not found

**Symptoms**: "No deployments found" in /deployments page

**Solutions**:

1. **Verify mount path**:
   ```bash
   docker exec furnacescout ls -la /foundry-project
   ```

2. **Check volume mount**:
   ```yaml
   volumes:
     # Must point to Foundry project root
     - /absolute/path/to/project:/foundry-project:ro
   ```

3. **Ensure broadcast/ exists**:
   ```bash
   forge script ... --broadcast  # Creates broadcast/ directory
   ```

### Container won't start

**Symptoms**: Container exits immediately

**Solutions**:

1. **Check logs**:
   ```bash
   docker logs furnacescout
   ```

2. **Verify build**:
   ```bash
   docker build --no-cache -t furnacescout .
   ```

3. **Check port availability**:
   ```bash
   lsof -i :3000  # Check if port is in use
   ```

### Permission issues

**Symptoms**: "EACCES" or permission denied errors

**Solutions**:

1. **Volume permissions**:
   ```bash
   # Make readable
   chmod -R a+r /path/to/foundry/project
   ```

2. **SELinux (Linux)**:
   ```bash
   # Add :z flag
   -v /path/to/project:/foundry-project:ro,z
   ```

### Slow build times

**Solutions**:

1. **Use BuildKit**:
   ```bash
   DOCKER_BUILDKIT=1 docker build -t furnacescout .
   ```

2. **Leverage cache**:
   ```bash
   docker build --cache-from furnacescout:latest -t furnacescout .
   ```

3. **Clean Docker cache**:
   ```bash
   docker builder prune -a
   ```

## Performance Optimization

### Build Optimization

```dockerfile
# Use layer caching effectively
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
# Only then copy source code
COPY . .
```

### Runtime Optimization

1. **Resource limits**:
   ```yaml
   services:
     furnacescout:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
           reservations:
             memory: 512M
   ```

2. **Health checks**:
   ```yaml
   healthcheck:
     interval: 30s      # Check every 30s
     timeout: 10s       # Timeout after 10s
     retries: 3         # Retry 3 times
     start_period: 40s  # Wait 40s before first check
   ```

## Security Best Practices

1. **Non-root user**: Container runs as `nextjs` user (UID 1001)
2. **Read-only volumes**: Mount Foundry projects as `:ro`
3. **No secrets in image**: Use environment variables
4. **Minimal base image**: Uses `bun:1-slim` (smaller attack surface)
5. **Health checks**: Automatic container restart on failure

## Advanced Configuration

### Custom Dockerfile

```dockerfile
# Extend the base image
FROM furnacescout:latest

# Add custom tools
RUN apt-get update && apt-get install -y curl vim

# Custom entrypoint
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

### Docker Compose Overrides

Create `docker-compose.override.yml`:

```yaml
services:
  furnacescout:
    environment:
      - DEBUG=true
    volumes:
      - ./custom-config:/app/config
    ports:
      - "3001:3000"  # Different port
```

### Networking

```yaml
# Host network (direct host access)
services:
  furnacescout:
    network_mode: host
    environment:
      - NEXT_PUBLIC_RPC_URL=http://localhost:8545

# Custom network
networks:
  custom-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Monitoring

### Health Checks

```bash
# Manual health check
curl http://localhost:3000/

# Docker health status
docker inspect --format='{{.State.Health.Status}}' furnacescout
```

### Logs

```bash
# Follow logs
docker logs -f furnacescout

# Last 100 lines
docker logs --tail 100 furnacescout

# Since timestamp
docker logs --since 2024-01-01T00:00:00 furnacescout
```

### Metrics

```bash
# Container stats
docker stats furnacescout

# Resource usage
docker inspect furnacescout | jq '.[0].HostConfig.Memory'
```

## Cleanup

```bash
# Stop and remove container
docker-compose down

# Remove volumes
docker-compose down -v

# Remove image
docker rmi furnacescout

# Complete cleanup
docker system prune -a --volumes
```

## FAQ

**Q: Can I use this with Hardhat instead of Foundry?**  
A: Yes, but Foundry-specific features (deployment tracking) won't work. You'll still have full block explorer functionality.

**Q: Does this work on ARM (Apple Silicon)?**  
A: Yes, Bun supports ARM64. The image will build natively on Apple Silicon Macs.

**Q: Can I deploy this to production?**  
A: Yes, but FurnaceScout is designed for local development. For production, consider security hardening and proper RPC authentication.

**Q: What's the image size?**  
A: ~200-250MB for the final image (slim runtime with standalone Next.js build).

**Q: Can I run multiple instances?**  
A: Yes! Use different ports and container names. See "Multiple Foundry Projects" section.

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Docker Images](https://hub.docker.com/r/oven/bun)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Foundry Docker Images](https://github.com/foundry-rs/foundry/pkgs/container/foundry)

## Support

For issues:
1. Check logs: `docker logs furnacescout`
2. Verify configuration: `docker inspect furnacescout`
3. Test network: `docker exec furnacescout curl http://host.docker.internal:8545`
4. Open GitHub issue with logs and configuration

---

**Last Updated**: 2024  
**Docker Version**: 20.10+  
**Docker Compose Version**: 2.0+