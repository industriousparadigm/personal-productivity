#!/bin/bash

echo "=== AI Date Parser Integration Demo ==="
echo "Current time: $(date)"
echo ""
echo "This test shows when AI is used vs local parsing"
echo "================================================="
echo ""

test_with_timing() {
    local input="$1"
    
    # Use time command for better compatibility
    local timing=$( { time curl -s -X POST http://localhost:3001/api/test-date-parser \
        -H "Content-Type: application/json" \
        -d "{\"input\": \"$input\"}" -o /tmp/response.json 2>/dev/null; } 2>&1 | grep real | awk '{print $2}' )
    
    local response=$(cat /tmp/response.json)
    
    # Convert time to milliseconds (rough estimate)
    local duration=$(echo "$timing" | sed 's/0m//' | sed 's/s//' | awk '{print int($1 * 1000)}')
    
    local human=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['human'])")
    
    if [ $duration -gt 300 ]; then
        echo "🤖 AI: \"$input\" → $human (${duration}ms)"
    else
        echo "⚡ Local: \"$input\" → $human (${duration}ms)"
    fi
}

echo "SIMPLE PATTERNS (parsed locally with chrono-node):"
echo "---------------------------------------------------"
test_with_timing "tomorrow"
test_with_timing "3pm"
test_with_timing "August 15"
test_with_timing "monday morning"
test_with_timing "this afternoon"

echo ""
echo "COMPLEX PATTERNS (require AI interpretation):"
echo "---------------------------------------------"
test_with_timing "by end of thursday workday"
test_with_timing "next friday COB"
test_with_timing "close of business Wednesday"
test_with_timing "end of month"

echo ""
echo "SPECIAL HANDLING (local with smart defaults):"
echo "---------------------------------------------"
test_with_timing "EOD"
test_with_timing "by Friday"
test_with_timing "next week"

echo ""
echo "Legend:"
echo "  ⚡ Local = Fast parsing with chrono-node (~20ms)"
echo "  🤖 AI = Anthropic Claude API call (~500-700ms)"
echo ""
echo "The AI is only called for complex phrases that need"
echo "business context understanding (workday, COB, etc.)"