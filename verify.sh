#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CodeToday Platform - Setup Verification Script
# ═══════════════════════════════════════════════════════════════════════════════
# This script validates that all required files are in place and systems are
# operational after the v2.0 modernization update.
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🔍 CodeToday Platform - Verification Script"
echo "═══════════════════════════════════════════════════════════════════════════════"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper function
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description (NOT FOUND: $file)"
        ((CHECKS_FAILED++))
    fi
}

check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description (NOT FOUND: $dir)"
        ((CHECKS_FAILED++))
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "📦 BACKEND FILES"
echo "─────────────────────────────────────────────────────────────────────────────"

check_file "backend/app/cache.py" "In-memory cache layer"
check_file "backend/app/routes/sessions.py" "Session management endpoints"
check_file "backend/app/middleware/auth.py" "Auth middleware (updated)"
check_file "backend/app/middleware/csrf.py" "CSRF middleware (updated)"
check_file "backend/app/middleware/rate_limit.py" "Rate limit middleware (updated)"
check_file "backend/app/routes/auth.py" "Auth routes (updated)"
check_file "backend/app/__init__.py" "App initialization (updated)"
check_file "backend/config.py" "Configuration file"
check_file "backend/.env.example" "Environment template"
check_file "backend/requirements.txt" "Python dependencies"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🎨 FRONTEND FILES"
echo "─────────────────────────────────────────────────────────────────────────────"

check_file "frontend/src/utils/deviceManager.js" "Device manager utility"
check_file "frontend/src/services/sessionService.js" "Session service API"
check_file "frontend/src/context/AuthContext.jsx" "Auth context (updated)"
check_file "frontend/src/services/api.js" "API interceptors (updated)"
check_file "frontend/.env.example" "Environment template"
check_file "frontend/package.json" "NPM dependencies"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "📚 DOCUMENTATION"
echo "─────────────────────────────────────────────────────────────────────────────"

check_file "docs/ARCHITECTURE.md" "System architecture documentation"
check_file "docs/API.md" "API reference documentation"
check_file "DEPLOYMENT.md" "Deployment guide"
check_file "README.md" "Project README (updated)"
check_file "IMPLEMENTATION_SUMMARY.md" "Implementation summary"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🐳 DOCKER & CONFIG"
echo "─────────────────────────────────────────────────────────────────────────────"

check_file "docker-compose.yml" "Docker Compose configuration (updated)"
check_dir "sandbox" "Sandbox directory"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔍 CODE VALIDATION"
echo "─────────────────────────────────────────────────────────────────────────────"

# Check if cache.py has required methods
if grep -q "def set\|def get\|def incr" backend/app/cache.py; then
    echo -e "${GREEN}✓${NC} Cache has required methods (set, get, incr)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Cache missing required methods"
    ((CHECKS_FAILED++))
fi

# Check if AuthContext has BroadcastChannel
if grep -q "BroadcastChannel" frontend/src/context/AuthContext.jsx; then
    echo -e "${GREEN}✓${NC} AuthContext uses BroadcastChannel API"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} AuthContext missing BroadcastChannel"
    ((CHECKS_FAILED++))
fi

# Check if deviceManager exports functions
if grep -q "export function getDeviceId\|export function getDeviceName" frontend/src/utils/deviceManager.js; then
    echo -e "${GREEN}✓${NC} Device manager exports device functions"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Device manager missing exports"
    ((CHECKS_FAILED++))
fi

# Check if sessions.py has endpoints
if grep -q "@sessions_bp.route" backend/app/routes/sessions.py; then
    echo -e "${GREEN}✓${NC} Sessions blueprint has endpoints"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Sessions blueprint missing endpoints"
    ((CHECKS_FAILED++))
fi

# Check if api.py attaches device header
if grep -q "X-Device-ID" frontend/src/services/api.js; then
    echo -e "${GREEN}✓${NC} API interceptor attaches X-Device-ID header"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} API interceptor missing X-Device-ID header"
    ((CHECKS_FAILED++))
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔧 ENVIRONMENT CHECKS"
echo "─────────────────────────────────────────────────────────────────────────────"

# Check Python
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    echo -e "${GREEN}✓${NC} Python installed: $PYTHON_VERSION"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Python not found in PATH"
    ((CHECKS_FAILED++))
fi

# Check Node
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Node.js not found in PATH"
    ((CHECKS_FAILED++))
fi

# Check MongoDB
if command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB shell (mongosh) installed"
    ((CHECKS_PASSED++))
elif command -v mongo &> /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB shell (mongo) installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} MongoDB shell not found in PATH"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>&1)
    echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Docker not found (required for docker-compose)"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Docker Compose not found"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "📊 SUMMARY"
echo "─────────────────────────────────────────────────────────────────────────────"

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED))
PERCENTAGE=$((CHECKS_PASSED * 100 / TOTAL))

echo "Checks passed: $CHECKS_PASSED / $TOTAL ($PERCENTAGE%)"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Platform is ready.${NC}"
    exit 0
else
    echo -e "${RED}✗ $CHECKS_FAILED checks failed. See above for details.${NC}"
    exit 1
fi
