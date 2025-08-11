#!/bin/bash

echo "=== AI Date Parser Integration Demo ==="
echo "Shows when AI is used vs local parsing"
echo "======================================"
echo ""

# Test function that shows input and output
test_parse() {
    local input="$1"
    echo -n "\"$input\" → "
    
    curl -s -X POST http://localhost:3001/api/test-date-parser \
        -H "Content-Type: application/json" \
        -d "{\"input\": \"$input\"}" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d['human'])"
}

echo "SIMPLE PATTERNS (fast, ~20ms, parsed locally):"
echo "----------------------------------------------"
test_parse "tomorrow"
test_parse "3pm"
test_parse "August 15"
test_parse "monday morning"
test_parse "this afternoon"

echo ""
echo "COMPLEX PATTERNS (slower, ~500ms, require AI):"
echo "----------------------------------------------"
test_parse "by end of thursday workday"
test_parse "next friday COB"
test_parse "end of month"

echo ""
echo "SPECIAL HANDLING (fast, with smart defaults):"
echo "---------------------------------------------"
test_parse "EOD"
test_parse "by Friday"
test_parse "next week"

echo ""
echo "Check server logs to see debug output showing:"
echo "  - When AI is called vs chrono-node"
echo "  - What gets sent to Anthropic"
echo "  - Response times for each method"