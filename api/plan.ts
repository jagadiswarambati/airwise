import { AIPlanInput, AIPlanOutput } from '../src/ai/schema';
import { validateAIPlanOutput } from '../src/ai/validator';
import { buildPlanPrompt } from '../src/ai/prompts/planPrompt';

export interface PlanApiResponse {
  success: boolean;
  plan?: AIPlanOutput;
  fallback?: boolean;
  message?: string;
  error?: unknown;
}

/**
 * Serverless API handler for /api/plan
 * Enforces server-side Gemini invocation, zero client secret exposure,
 * strict schema validation, one retry on error, and fallback.
 */
export async function handlePlanRequest(input: AIPlanInput): Promise<PlanApiResponse> {
  const provider = process.env.LLM_PROVIDER || 'none';
  const apiKey = process.env.GEMINI_API_KEY;

  if (provider === 'none' || !apiKey) {
    return {
      success: false,
      fallback: true,
      message: 'LLM_PROVIDER is none or API key is not configured',
    };
  }

  const prompt = buildPlanPrompt(input);

  try {
    const rawResult = await callGeminiJsonMode(prompt, apiKey);
    const validation = validateAIPlanOutput(rawResult, input);

    if (validation.valid) {
      return {
        success: true,
        plan: validation.output,
      };
    }

    // Validation failed: retry ONCE with error feedback
    const retryPrompt = `${prompt}\n\n=== PREVIOUS ATTEMPT FAILED SAFETY VALIDATION ===
Error: ${validation.error.message} (${validation.error.code})
Please fix this violation and generate valid strict JSON meeting all rules.`;

    const retryResult = await callGeminiJsonMode(retryPrompt, apiKey);
    const retryValidation = validateAIPlanOutput(retryResult, input);

    if (retryValidation.valid) {
      return {
        success: true,
        plan: retryValidation.output,
      };
    }

    // Both attempts failed: graceful fallback
    return {
      success: false,
      fallback: true,
      error: retryValidation.error,
      message: 'AI output failed safety validation twice; falling back to deterministic plan',
    };
  } catch (err: unknown) {
    return {
      success: false,
      fallback: true,
      error: err instanceof Error ? err.message : 'Unknown error',
      message: 'Failed to contact LLM service; falling back to deterministic plan',
    };
  }
}

/**
 * Calls Google Gemini REST endpoint requesting JSON mode.
 * Uses native fetch (Node 18+).
 */
async function callGeminiJsonMode(prompt: string, apiKey: string): Promise<unknown> {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(text);
}

