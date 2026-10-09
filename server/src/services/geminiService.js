// Gemini Vision service: classifies the idol material from a photo.
//
// The model is constrained three ways so its output can never be arbitrary:
//  1. A strict system instruction and prompt.
//  2. A JSON response schema with an enum for `material`.
//  3. Server-side validation (zod). Anything that fails validation, or is not
//     confident enough, becomes UNKNOWN and the user is asked to verify manually.
import { ApiError, GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/index.js';
import { AppError, unavailable } from '../utils/errors.js';

// ---- Tuneable constants ----------------------------------------------------
export const CONFIDENCE_THRESHOLD = 0.6; // below this the result becomes UNKNOWN
export const MATERIALS = ['CLAY', 'PLASTER_OF_PARIS', 'UNKNOWN'];
// -----------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = [
  'You are a careful visual inspector for a civic environmental app.',
  'You look at one photograph and judge what a Ganesh idol is made of.',
  'You must answer ONLY with the requested JSON. Never add other text.',
  'A photograph alone often cannot distinguish clay from plaster of Paris. Be honest about that.',
  'If the image is not clearly a Ganesh idol, or the material cannot be judged, answer UNKNOWN.',
].join(' ');

const PROMPT = `Classify the material of the Ganesh idol in this photo.

Allowed values for "material": "CLAY", "PLASTER_OF_PARIS", "UNKNOWN".

Visual cues to consider (use only what is visible):
- Natural unpainted clay: matte, earthy brown/grey surface, visible hand-finished texture, sometimes small cracks, little or no glossy paint.
- Plaster of Paris: very smooth, bright, chalky or glossy finish, sharp moulded details, heavy synthetic or metallic paint, uniform surface.

Rules:
- If the image is not a Ganesh idol, set "isGaneshaIdol" to false and "material" to "UNKNOWN".
- If you are unsure, use "UNKNOWN".
- "confidence" is a number from 0 to 1 for your chosen material.
- "explanation" is one or two short plain sentences naming the visible cues.
- "visibleCues" lists up to 4 short cue phrases.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isGaneshaIdol: { type: Type.BOOLEAN },
    material: { type: Type.STRING, enum: MATERIALS },
    confidence: { type: Type.NUMBER },
    explanation: { type: Type.STRING },
    visibleCues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['isGaneshaIdol', 'material', 'confidence', 'explanation', 'visibleCues'],
  propertyOrdering: ['isGaneshaIdol', 'material', 'confidence', 'explanation', 'visibleCues'],
};

const responseValidator = z.object({
  isGaneshaIdol: z.boolean(),
  material: z.enum(MATERIALS),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1).max(600),
  visibleCues: z.array(z.string().max(120)).max(8).default([]),
});

let client;
const getClient = () => {
  if (!config.gemini.apiKey) {
    throw unavailable(
      'GEMINI_NOT_CONFIGURED',
      'Automatic idol recognition is not configured. Please choose the material manually.',
    );
  }
  client ??= new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
};

/** Turns raw model text into a validated, safe classification. Exported for tests. */
export function parseClassification(rawText) {
  const unusable = {
    material: 'UNKNOWN',
    confidence: 0,
    explanation: 'The recognition result could not be read. Please choose the material manually.',
    visibleCues: [],
    requiresManualVerification: true,
    validated: false,
  };

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return unusable;
  }
  const result = responseValidator.safeParse(parsed);
  if (!result.success) return unusable;

  const { isGaneshaIdol, material, confidence, explanation, visibleCues } = result.data;

  if (!isGaneshaIdol) {
    return {
      material: 'UNKNOWN',
      confidence,
      explanation: 'This photo does not clearly show a Ganesh idol. Please retake it or choose the material manually.',
      visibleCues,
      requiresManualVerification: true,
      validated: true,
    };
  }
  if (material === 'UNKNOWN' || confidence < CONFIDENCE_THRESHOLD) {
    return {
      material: 'UNKNOWN',
      confidence,
      explanation,
      visibleCues,
      requiresManualVerification: true,
      validated: true,
    };
  }
  return { material, confidence, explanation, visibleCues, requiresManualVerification: false, validated: true };
}

export async function classifyIdol({ buffer, mimeType }) {
  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: buffer.toString('base64') } },
            { text: PROMPT },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        abortSignal: AbortSignal.timeout(config.gemini.timeoutMs),
      },
    });
  } catch (error) {
    throw mapGeminiError(error);
  }

  const result = parseClassification(response.text ?? '');
  return { ...result, model: config.gemini.model };
}

function mapGeminiError(error) {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new AppError(429, 'GEMINI_RATE_LIMITED', 'Recognition is busy right now. Please choose the material manually or retry shortly.');
    }
    if (error.status === 401 || error.status === 403) {
      return new AppError(502, 'GEMINI_AUTH', 'Recognition service rejected the API key. Please choose the material manually.');
    }
    if (error.status === 404) {
      return new AppError(502, 'GEMINI_MODEL', 'The configured Gemini model was not found. Check GEMINI_MODEL.');
    }
  }
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return new AppError(504, 'GEMINI_TIMEOUT', 'Recognition took too long. Please retry or choose the material manually.');
  }
  return new AppError(502, 'GEMINI_FAILED', 'Recognition failed. Please choose the material manually.');
}
