import { gateway, generateText } from "ai"

const MAX_INPUT_LENGTH = 60_000

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Please add study material before generating." }, { status: 400 })
    }

    const { input, numQuestions } = body as { input?: unknown; numQuestions?: unknown }
    if (typeof input !== "string" || !input.trim()) {
      return Response.json({ error: "Please add study material before generating." }, { status: 400 })
    }
    if (input.length > MAX_INPUT_LENGTH) {
      return Response.json({ error: "Your study material is too long. Please use 60,000 characters or fewer." }, { status: 413 })
    }
    if (typeof numQuestions !== "number" || !Number.isInteger(numQuestions) || numQuestions < 5 || numQuestions > 20) {
      return Response.json({ error: "Choose between 5 and 20 quiz questions." }, { status: 400 })
    }

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash"),
      system: `You are a careful, encouraging study coach. Base every detail only on the provided source. Create a concise study guide and an accurate quiz. Return only valid JSON with this exact shape: {"notes":"markdown string","quiz":"markdown string"}. In notes, include a descriptive heading, a brief overview, and 4-7 key takeaways or terms. In quiz, create exactly ${numQuestions} numbered questions; use a mix of multiple-choice (four options, one correct) and short-answer prompts, and finish with a clearly separated answer key. Do not invent facts not supported by the source. Keep explanations concise.`,
      prompt: `Create study notes and a ${numQuestions}-question quiz from this source material:\n\n${input.trim()}`,
      maxOutputTokens: 5000,
    })

    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    const generated: unknown = JSON.parse(cleaned)
    if (!generated || typeof generated !== "object" || typeof (generated as { notes?: unknown }).notes !== "string" || typeof (generated as { quiz?: unknown }).quiz !== "string") {
      throw new Error("The model returned an invalid study set")
    }

    return Response.json({ notes: (generated as { notes: string }).notes, quiz: (generated as { quiz: string }).quiz })
  } catch (error) {
    console.error("Study set generation failed:", error)
    if (error instanceof Error && error.message.includes("valid credit card on file")) {
      return Response.json({ error: "AI Gateway billing is required before this app can generate a study set.", code: "AI_GATEWAY_BILLING_REQUIRED" }, { status: 503 })
    }
    return Response.json({ error: "We couldn’t create your study set right now. Please try again." }, { status: 500 })
  }
}
