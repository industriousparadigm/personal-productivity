#!/bin/bash

# Test various date inputs
echo "Testing AI Date Parser"
echo "Current time: $(date)"
echo "======================================"

test_date() {
    echo ""
    echo "Testing: \"$1\""
    curl -s -X POST http://localhost:3001/api/test-date-parser \
        -H "Content-Type: application/json" \
        -d "{\"input\": \"$1\"}" | python3 -m json.tool
    echo "--------------------------------------"
}

# Test various inputs
test_date "today"
test_date "by today"
test_date "today aug 11"
test_date "tomorrow"
test_date "tomorrow afternoon"
test_date "next week"
test_date "EOD"
test_date "end of day"
test_date "Monday"
test_date "next Monday"
test_date "in 2 hours"
test_date "3pm"
test_date "3pm tomorrow"
test_date "August 15"
test_date "by Friday"