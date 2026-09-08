const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

export async function POST(req: Request) {
  const { transcript, history } = await req.json();

  const systemPrompt = `You are a clinical history-taking assistant conducting a patient intake interview. Ask ONE short, clear follow-up question at a time using the SOCRATES framework (Site, Onset, Character, Radiation, Associations, Time course, Exacerbating and relieving factors, Severity).

Rules:
- Ask only ONE question per response, as a plain conversational sentence.
- Keep it under 20 words.
- Never use markdown, asterisks, bullet points, or headers. Plain text only.
- Never repeat a question you have already asked in this conversation.
- Base your next question on everything the patient has said so far.
- Once you have gathered site, onset, character, severity, and any radiation or triggers, respond with exactly: "Thank you, I have everything I need for now."`;

  const contents = Array.isArray(history)
    ? history.map((msg: { role: string; text: string }) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      }))
    : [];

  // Try keys until one works
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const key = API_KEYS[currentKeyIndex % API_KEYS.length];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (response.status === 429) {
      console.warn(`[converse] Key #${currentKeyIndex + 1} rate limited. Switching to next key...`);
      currentKeyIndex++;
      continue;
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Could you tell me more?";
    return Response.json({ reply });
  }

  // All keys failed
  return Response.json({ reply: "I'm having trouble connecting. Could you repeat that?" });
}
