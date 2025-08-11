import Anthropic from '@anthropic-ai/sdk';
import { parseDate } from './date';
import { format, endOfDay, setHours, setMinutes } from 'date-fns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Uses AI to interpret ambiguous date/time inputs and return a proper deadline
 */
export async function parseCommitmentDeadline(input: string): Promise<Date> {
  const inputLower = input.toLowerCase();
  
  console.log('\n=== AI Date Parser Debug ===' );
  console.log('Input:', input);
  console.log('Current time:', new Date().toISOString());
  
  // Special handling for "next week" - don't let chrono handle it
  if (inputLower === 'next week' || inputLower === 'next monday') {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    const result = endOfDay(nextMonday);
    console.log('Special case: next week/monday ->', result.toISOString());
    return result;
  }
  
  // Check if we should use AI even if chrono might parse it
  // Complex phrases that need AI interpretation
  const needsAI = inputLower.includes('workday') || 
                  inputLower.includes('work day') ||
                  inputLower.includes('business hours') ||
                  inputLower.includes('cob') || // close of business
                  inputLower.includes('eow') || // end of week
                  inputLower.includes('eom'); // end of month
  
  if (needsAI) {
    console.log('Complex phrase detected, will use AI');
  }
  
  // For plain day names, force "this" prefix to get the upcoming day
  const dayNameMatch = inputLower.match(/^(by )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
  if (dayNameMatch && !needsAI) {
    const dayName = dayNameMatch[2];
    // Use "this [day]" to get the upcoming occurrence
    const chronoResult = parseDate(`this ${dayName}`);
    if (chronoResult) {
      const result = endOfDay(chronoResult);
      console.log('Plain day name ->', result.toISOString());
      return result;
    }
  }
  
  // First try chrono-node for standard formats (unless we need AI)
  const chronoResult = !needsAI ? parseDate(input) : null;
  console.log('Chrono result:', chronoResult ? chronoResult.toISOString() : 'null (skipped or failed)');
  
  // If chrono gives us a date, we need to be smart about the time
  if (chronoResult) {
    const now = new Date();
    
    // Check if user specified a specific time or time period
    const hasSpecificTime = /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(input) || 
                           /\d{1,2}:\d{2}/i.test(input) ||
                           /\b(morning|afternoon|evening|night)\b/i.test(input);
    
    // If no specific time mentioned and it's a day reference
    if (!hasSpecificTime) {
      // EOD or "end of day" always means 6 PM (end of work day)
      if (inputLower.includes('eod') || inputLower.includes('end of day')) {
        const result = new Date(chronoResult);
        result.setHours(18, 0, 0, 0); // 6 PM
        console.log('End of day pattern detected, setting to 6 PM:', result.toISOString());
        console.log('=== End Debug ===\n');
        return result;
      }
      
      // Common patterns that should default to 11:59 PM (true end of calendar day)
      if (inputLower.includes('today') || 
          inputLower.includes('tomorrow') || 
          inputLower.includes('by')) {
        const result = endOfDay(chronoResult);
        console.log('Calendar day pattern, setting to 11:59 PM:', result.toISOString());
        console.log('=== End Debug ===\n');
        return result;
      }
      
      // If it's just a day name or date, default to end of that day
      if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(inputLower) ||
          /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(inputLower) ||
          /^\d{1,2}(st|nd|rd|th)?$/i.test(inputLower)) {
        return endOfDay(chronoResult);
      }
      
      // Check if it's a day that already passed and should be next week
      if (/^(by )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(inputLower)) {
        // Compare dates without time to determine if it's a past day
        const chronoDay = new Date(chronoResult);
        chronoDay.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        
        // If the parsed date is before today, add a week
        if (chronoDay < today) {
          const nextWeek = new Date(chronoResult);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const result = endOfDay(nextWeek);
          console.log('Past day detected, moving to next week:', result.toISOString());
          console.log('=== End Debug ===\n');
          return result;
        }
        const result = endOfDay(chronoResult);
        console.log('Future day this week:', result.toISOString());
        console.log('=== End Debug ===\n');
        return result;
      }
    }
    
    console.log('Chrono parsed correctly, returning:', chronoResult.toISOString());
    console.log('=== End Debug ===\n');
    return chronoResult;
  }

  // If chrono can't parse it OR we need AI, use AI for complex interpretations
  if (!chronoResult || needsAI) {
    console.log('Calling Anthropic AI...');
    try {
      const currentDate = format(new Date(), 'yyyy-MM-dd HH:mm');
      const dayOfWeek = format(new Date(), 'EEEE');
    
    console.log('Sending to Anthropic:', input);
    const startTime = Date.now();
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0,
      system: `You are a date parser. Today is ${dayOfWeek}, ${currentDate}. 
Convert the user's input into an ISO datetime. Follow these rules:
- "today" or "by today" means today at 23:59
- "tomorrow" means tomorrow at 23:59
- "EOD" or "end of day" means 18:00 (6 PM) of that day
- "workday", "work day", or "business hours" means 18:00 (6 PM) of that day
- "end of [day] workday" means that day at 18:00 (6 PM)
- "COB" (close of business) means 18:00 (6 PM)
- "next week" means next Monday at 23:59
- "EOW" (end of week) means Friday at 18:00
- "EOM" (end of month) means last day of month at 23:59
- "by [day]" or just "[day]" means the NEXT occurrence of that day at 23:59
- If a day name is mentioned and it's already passed this week, use next week's occurrence
- If time isn't specified and no work context, default to 23:59 of that day
- Be reasonable about work hours (workday ends at 6pm, not midnight)

Respond ONLY with the ISO datetime string, nothing else.`,
      messages: [
        {
          role: 'user',
          content: input
        }
      ]
    });

    const aiDateStr = response.content[0].type === 'text' 
      ? response.content[0].text.trim() 
      : null;
    
    const elapsed = Date.now() - startTime;
    console.log(`Anthropic response (${elapsed}ms):`, aiDateStr);
      
    if (aiDateStr) {
      const aiDate = new Date(aiDateStr);
      if (!isNaN(aiDate.getTime())) {
        console.log('AI parsed date:', aiDate.toISOString());
        console.log('=== End Debug ===\n');
        return aiDate;
      }
    }
  } catch (error) {
    console.error('AI date parsing failed:', error);
  }
  }

  // Fallback: interpret common patterns ourselves
  console.log('Using fallback patterns');
  const now = new Date();
  
  if (inputLower.includes('today')) {
    return endOfDay(now);
  }
  
  if (inputLower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return endOfDay(tomorrow);
  }
  
  if (inputLower.includes('eod') || inputLower.includes('end of day')) {
    return setMinutes(setHours(now, 18), 0); // 6 PM today
  }
  
  if (inputLower.includes('next week')) {
    // Next Monday at 11:59 PM
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    return endOfDay(nextMonday);
  }
  
  // Last resort: return end of today
  const fallback = endOfDay(now);
  console.log('Final fallback:', fallback.toISOString());
  console.log('=== End Debug ===\n');
  return fallback;
}