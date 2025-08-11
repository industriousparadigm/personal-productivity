import { parseDate, formatCommitmentDate, getDaysOverdue } from './date';

// Simple test runner
function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${description}`);
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(error);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Tests
console.log('Running date utility tests...\n');

test('parseDate should parse "today"', () => {
  const result = parseDate('today');
  assert(result !== null, 'Should return a date');
  const today = new Date();
  assert(result?.getDate() === today.getDate(), 'Should be today');
});

test('parseDate should parse "tomorrow"', () => {
  const result = parseDate('tomorrow');
  assert(result !== null, 'Should return a date');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert(result?.getDate() === tomorrow.getDate(), 'Should be tomorrow');
});

test('parseDate should parse "Friday"', () => {
  const result = parseDate('Friday');
  assert(result !== null, 'Should return a date');
  assert(result?.getDay() === 5, 'Should be Friday (day 5)');
});

test('getDaysOverdue should return 0 for future dates', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const days = getDaysOverdue(futureDate);
  assert(days === 0, 'Should be 0 for future dates');
});

test('getDaysOverdue should return positive number for past dates', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 3);
  const days = getDaysOverdue(pastDate);
  assert(days === 3, 'Should be 3 days overdue');
});

test('formatCommitmentDate should format today correctly', () => {
  const today = new Date();
  today.setHours(14, 0, 0, 0);
  const formatted = formatCommitmentDate(today);
  assert(formatted.includes('Today at'), 'Should include "Today at"');
});

console.log('\nAll tests completed!');