import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Call OpenAI with retry logic
 */
export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-5-nano-2025-08-07',
  jsonMode: boolean = false,
  maxRetries: number = 3
): Promise<string> {
  const client = getOpenAIClient();

  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 500,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      lastError = error;

      // Log detailed error information
      if (error.status) {
        console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, {
          status: error.status,
          message: error.message,
          type: error.type,
        });
      } else {
        console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, error.message);
      }

      // Don't retry on 4xx errors (except 429 rate limit)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Call OpenAI and parse JSON response
 */
export async function callOpenAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'gpt-5-nano-2025-08-07'
): Promise<T> {
  const response = await callOpenAI(systemPrompt, userPrompt, model, true);

  // Handle empty or whitespace-only responses
  if (!response || !response.trim()) {
    throw new Error('Empty response from OpenAI');
  }

  try {
    // First, try to parse the response directly
    return JSON.parse(response);
  } catch (firstError) {
    try {
      // Extract JSON from response (sometimes wrapped in markdown or has extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON object found in response');
    } catch (secondError) {
      console.error('Failed to parse JSON response:', response.substring(0, 200));
      throw new Error('Invalid JSON response from OpenAI');
    }
  }
}
