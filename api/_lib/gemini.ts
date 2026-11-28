import { z } from 'zod';

/**
 * GeminiResponseEnvelopeSchema.
 */
export const GeminiResponseEnvelopeSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z
            .array(
              z.object({
                text: z.string().max(8192, 'Gemini response text exceeds maximum cap'),
              }),
            )
            .min(1),
        }),
      }),
    )
    .min(1),
});

/**
 * Calls Google Gemini REST endpoint requesting JSON mode.
 */
export async function callGeminiJsonMode(
  prompt: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<unknown> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error('Gemini API request failed');
  }

  let rawJson: unknown;
  try {
    rawJson = await res.json();
  } catch {
    throw new Error('Malformed upstream JSON from Gemini API');
  }

  const envelopeParse = GeminiResponseEnvelopeSchema.safeParse(rawJson);
  if (!envelopeParse.success) {
    throw new Error('Malformed Gemini response envelope');
  }

  const text = envelopeParse.data.candidates[0].content.parts[0].text;
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(text);
  } catch {
    throw new Error('Gemini response part is not valid JSON');
  }

  return parsedContent;
}
