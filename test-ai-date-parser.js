// Test script for AI date parser
// Run with: node test-ai-date-parser.js

require('dotenv').config({ path: '.env.local' });

async function testDateParser() {
  // Mock the environment for the parser
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-key';
  
  const { parseCommitmentDeadline } = require('./src/lib/utils/ai-date-parser.ts');
  
  const testCases = [
    'today',
    'by today',
    'today aug 11',
    'tomorrow',
    'tomorrow afternoon',
    'next week',
    'EOD',
    'end of day',
    'Monday',
    'next Monday',
    'in 2 hours',
    '3pm',
    '3pm tomorrow',
    'August 15',
    'Aug 15th',
    'by Friday',
  ];
  
  console.log('Testing AI Date Parser\n' + '='.repeat(50));
  console.log(`Current time: ${new Date().toISOString()}\n`);
  
  for (const input of testCases) {
    try {
      const result = await parseCommitmentDeadline(input);
      console.log(`Input: "${input}"`);
      console.log(`Result: ${result.toISOString()}`);
      console.log(`Human: ${result.toLocaleString()}`);
      console.log('-'.repeat(50));
    } catch (error) {
      console.log(`Input: "${input}"`);
      console.log(`Error: ${error.message}`);
      console.log('-'.repeat(50));
    }
  }
}

testDateParser().catch(console.error);