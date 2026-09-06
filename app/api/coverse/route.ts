export async function POST(req: Request) {
  const { transcript } = await req.json();

  const systemPrompt = `You are a clinical history-taking assistant. The patient just said their symptom. Ask ONE short, relevant follow-up question using the SOCRATES framework (Site, Onset, Character, Radiation, Associations, Time course, Exacerbating/relieving factors, Severity). Keep it simple, one question only, no explanations.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nPatient said: "${transcript}"` }],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could you tell me more?";

  return Response.json({ reply });
}