#!/bin/bash
# =============================================================================
# AWS EC2 Instance Setup Script for SWE5006-Jiraffe
# =============================================================================
# Safe to run multiple times (fully idempotent).
#
#   chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
#
# Recommended instance: t3.xlarge (4 vCPU, 16 GB RAM) with 50 GB gp3 EBS
# Minimum instance:     t3.large  (2 vCPU, 8 GB RAM)  with 30 GB gp3 EBS
# =============================================================================

set -euo pipefail

echo "============================================"
echo "  SWE5006-Jiraffe EC2 Setup (HTTPS)"
echo "============================================"

# --- System updates ---
echo "[1/8] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# --- Docker ---
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    apt-get install -y ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "  Docker already installed, skipping."
fi

systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# --- Kernel tuning for SonarQube (Elasticsearch) ---
echo "[3/8] Configuring kernel parameters for SonarQube..."
sysctl -w vm.max_map_count=524288
sysctl -w fs.file-max=131072

if [ ! -f /etc/sysctl.d/99-sonarqube.conf ]; then
    cat > /etc/sysctl.d/99-sonarqube.conf <<EOF
vm.max_map_count=524288
fs.file-max=131072
EOF
else
    echo "  /etc/sysctl.d/99-sonarqube.conf already exists, skipping."
fi
sysctl --system

if ! grep -q "sonarqube.*nofile.*131072" /etc/security/limits.conf 2>/dev/null; then
    cat >> /etc/security/limits.conf <<EOF
sonarqube   -   nofile   131072
sonarqube   -   nproc    8192
EOF
else
    echo "  limits.conf already configured, skipping."
fi

# --- Create application directory ---
echo "[4/8] Setting up application directory..."
mkdir -p /opt/jiraffe
chown ubuntu:ubuntu /opt/jiraffe

# --- Create .env template (only if it doesn't exist) ---
echo "[5/8] Creating environment file template..."
if [ ! -f /opt/jiraffe/.env ]; then
    cat > /opt/jiraffe/.env <<'ENVFILE'
# =============================================================================
# Application
# =============================================================================
# Replace YOUR_EC2_PUBLIC_IP with your actual EC2 public IP address
NEXTAUTH_SECRET=CHANGE_ME_TO_A_STRONG_RANDOM_SECRET
NEXTAUTH_URL=https://YOUR_EC2_PUBLIC_IP

# =============================================================================
# SonarQube PostgreSQL
# =============================================================================
SONAR_JDBC_PASSWORD=CHANGE_ME_TO_A_STRONG_PASSWORD

# =============================================================================
# Docker Image (auto-updated by CI/CD pipeline)
# =============================================================================
# Replace YOUR_GITHUB_USER with your GitHub username (lowercase)
APP_IMAGE=ghcr.io/YOUR_GITHUB_USER/swe5006-jiraffe:latest

# =============================================================================
# GitHub PAT for pulling private GHCR images
# =============================================================================
# Create at: https://github.com/settings/tokens
# Scope needed: read:packages
GH_PAT=ghp_CHANGE_ME
GH_USERNAME=YOUR_GITHUB_USERNAME
ENVFILE
    chmod 600 /opt/jiraffe/.env
else
    echo "  /opt/jiraffe/.env already exists, NOT overwriting."
    echo "  Delete it first if you want a fresh template."
fi

# --- Swap file (helps on smaller instances) ---
echo "[6/8] Creating swap file (2 GB)..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
else
    echo "  Swap file already exists, skipping."
fi

# --- Firewall (UFW) ---
echo "[7/8] Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP  (Caddy – redirects to HTTPS)
ufw allow 443/tcp   # HTTPS (Caddy – App & SonarQube)
ufw delete allow 3000/tcp 2>/dev/null || true
ufw delete allow 9000/tcp 2>/dev/null || true
ufw --force enable

# --- Summary ---
echo "[8/8] Setup complete!"
echo ""
echo "============================================"
echo "  NEXT STEPS"
echo "============================================"
echo ""
echo "1. EDIT /opt/jiraffe/.env – replace all placeholder values:"
echo "   nano /opt/jiraffe/.env"
echo "   - NEXTAUTH_SECRET  → run: openssl rand -base64 32"
echo "   - NEXTAUTH_URL     → https://YOUR_EC2_PUBLIC_IP"
echo "   - SONAR_JDBC_PASSWORD → any strong password"
echo "   - APP_IMAGE        → ghcr.io/yourusername/swe5006-jiraffe:latest"
echo "   - GH_PAT           → your GitHub Personal Access Token"
echo "   - GH_USERNAME       → your GitHub username (lowercase)"
echo ""
echo "2. COPY files to the server (from your local machine):"
echo "     scp -i key.pem docker-compose.prod.yml ubuntu@IP:/opt/jiraffe/"
echo "     scp -i key.pem Caddyfile ubuntu@IP:/opt/jiraffe/"
echo ""
echo "3. START services:"
echo "     cd /opt/jiraffe"
echo "     docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. ACCESS your services:"
echo "   App:       https://YOUR_EC2_PUBLIC_IP"
echo "   SonarQube: https://YOUR_EC2_PUBLIC_IP/sonar"
echo "   (Browser will show security warning – click Advanced > Proceed)"
echo ""
echo "5. SONARQUBE first login:"
echo "   Default: admin / admin → CHANGE THE PASSWORD"
echo "   Create project token: My Account > Security > Generate Tokens"
echo ""
echo "6. CREATE a GitHub PAT (for private repo GHCR access):"
echo "   https://github.com/settings/tokens/new"
echo "   Scopes: read:packages, write:packages"
echo ""
echo "7. ADD GitHub repo secrets (Settings > Secrets > Actions):"
echo "   - GH_PAT             = your PAT from step 6"
echo "   - GH_USERNAME         = your GitHub username"
echo "   - SONAR_TOKEN         = token from step 5"
echo "   - SONAR_HOST_URL      = https://YOUR_EC2_PUBLIC_IP/sonar"
echo "   - AWS_EC2_HOST        = YOUR_EC2_PUBLIC_IP"
echo "   - AWS_EC2_USER        = ubuntu"
echo "   - AWS_EC2_SSH_KEY     = contents of your .pem private key"
echo "   - STAGING_URL         = https://YOUR_EC2_PUBLIC_IP"
echo ""
echo "8. AWS Security Group inbound rules:"
echo "   - Port 22  (SSH)   – your IP only"
echo "   - Port 80  (HTTP)  – 0.0.0.0/0 (redirects to HTTPS)"
echo "   - Port 443 (HTTPS) – 0.0.0.0/0"
echo ""
echo "============================================"
