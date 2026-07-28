#!/bin/bash
#
# Modular smoke test for API rate limiting
# Usage: ./test-rate-limits-modular.sh <base-url>
# Example:
#   ./test-rate-limits-modular.sh http://localhost:3000
#   ./test-rate-limits-modular.sh https://bookfly-app.netlify.app
#

# BASE="http://localhost:3000"
BASE="https://bookfly-app.netlify.app"
PASS=0
FAIL=0

# Helper function: send N requests, check that rate limit kicks in
# Arg1: HTTP method (GET, POST, PUT, DELETE)
# Arg2: URL path (e.g., /api/auth/login)
# Arg3: allowed requests per minute
# Arg4: (optional) request body as JSON string
rate_test() {
  local method="$1"
  local url="$2"
  local limit="$3"
  local body="$4"
  local count=$((limit * 2))          # double the limit to force 429

  echo "→ Testing $method $url (limit=${limit}/min, sending ${count} requests)"

  local got_429=0
  local i
  for ((i=1; i<=count; i++)); do
    if [ -z "$body" ]; then
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
    else
      status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" -d "$body" "$url")
    fi

    if [ "$status" == "429" ]; then
      got_429=1
      echo "  ✓ 429 at request #$i"
      break
    fi
  done

  if [ "$got_429" -eq 1 ]; then
    echo "  PASS"
    PASS=$((PASS + 1))
  else
    echo "  FAIL – No 429 received after ${count} requests"
    FAIL=$((FAIL + 1))
  fi
  echo
}

# ─────────────────────────────────────────────
# 1. Auth endpoints (already wrapped)
# ─────────────────────────────────────────────
rate_test POST "$BASE/api/auth/login"          10   '{"email":"a","password":"b"}'
rate_test POST "$BASE/api/auth/register"        5   '{"name":"x","email":"y","password":"z"}'
rate_test POST "$BASE/api/auth/logout"         30

# ─────────────────────────────────────────────
# 2. Chatbot (wrapped)
# ─────────────────────────────────────────────
rate_test POST "$BASE/api/chatbot"            30   '{"question":"hi"}'

# ─────────────────────────────────────────────
# 3. Admin – Users
# ─────────────────────────────────────────────
rate_test GET  "$BASE/api/admin/users"         30
rate_test POST "$BASE/api/admin/users"         30   '{"name":"x","email":"y","password":"z","role":"CLIENT"}'
rate_test PUT  "$BASE/api/admin/users/1"       30   '{"name":"x","email":"y","role":"CLIENT"}'
rate_test DELETE "$BASE/api/admin/users/1"     30

# ─────────────────────────────────────────────
# 4. Admin – Services
# ─────────────────────────────────────────────
rate_test GET  "$BASE/api/admin/services"      30
rate_test POST "$BASE/api/admin/services"      30   '{"name":"test","durationMin":30}'
rate_test PUT  "$BASE/api/admin/services/1"    30   '{"name":"updated","durationMin":60}'
rate_test DELETE "$BASE/api/admin/services/1"  30

# ─────────────────────────────────────────────
# 5. Admin – Appointments
# ─────────────────────────────────────────────
rate_test PUT    "$BASE/api/admin/appointments/1" 30   '{"status":"CONFIRMED"}'
rate_test DELETE "$BASE/api/admin/appointments/1" 30

# ─────────────────────────────────────────────
# 6. Pricing
# ─────────────────────────────────────────────
rate_test GET "$BASE/api/pricing/choose?plan=solo" 20

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo "──────────────────────────────"
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL