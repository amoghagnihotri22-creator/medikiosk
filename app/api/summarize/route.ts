const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

async function callGeminiWithRetry(
  prompt: string,
  apiKey: string,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      }
    );

    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = Math.min(40, (attempt + 1) * 20);
      console.warn(
        `[summarize] Rate limited (429). Retrying in ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})...`
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[summarize] Gemini API HTTP error:", response.status, errBody);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) {
      console.error("[summarize] Empty Gemini response:", JSON.stringify(data));
      throw new Error("Empty Gemini response");
    }
    return text;
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: Request) {
  const { transcript, ocrResult } = await req.json();

  const conversationText = Array.isArray(transcript)
    ? transcript
        .map((m: { role: string; text: string }) => `${m.role === "patient" ? "Patient" : "AI"}: ${m.text}`)
        .join("\n")
    : "";

  const ocrText = ocrResult
    ? `Extracted from uploaded document: ${JSON.stringify(ocrResult.extractedFields)}`
    : "No document was uploaded.";

  const prompt = `You are a clinical summarization assistant. Based on the conversation transcript and any document data below, produce a STRICT JSON object with exactly these fields:

{
  "chiefComplaint": "one sentence describing the main complaint",
  "symptoms": [{ "name": "", "onset": "", "severity": "", "notes": "" }],
  "medications": [{ "name": "", "dosage": "", "frequency": "" }],
  "allergies": [{ "substance": "", "reaction": "" }],
  "pastConditions": [{ "condition": "", "diagnosedDate": "" }],
  "aiSummary": "a 2-3 sentence clinical summary",
  "flags": [{ "type": "urgent" | "review" | "incomplete", "message": "" }]
}

Only include an "urgent" flag if there are genuine red-flag symptoms (e.g. chest pain, breathing difficulty, severe trauma). Return ONLY the JSON object, no markdown, no explanation, no code fences.

CONVERSATION:
${conversationText}

DOCUMENT DATA:
${ocrText}`;

  let parsed;
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    let text = await callGeminiWithRetry(prompt, apiKey);

    // Strip markdown code fences
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

    // Extract JSON object if wrapped in extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    parsed = JSON.parse(text);
  } catch (err) {
    console.error("[summarize] Failed to get/parse AI summary:", err);
    parsed = {
      chiefComplaint: "Summary generation failed — see raw transcript.",
      symptoms: [],
      medications: [],
      allergies: [],
      pastConditions: [],
      aiSummary: null,
      flags: [{ type: "incomplete", message: "Automatic summary could not be generated." }],
    };
  }

  return Response.json(parsed);
}
