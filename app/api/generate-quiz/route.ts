import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const MAX_INPUT_LENGTH = 60_000

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Add OPENAI_API_KEY to the project environment to use GPT.", code: "OPENAI_API_KEY_REQUIRED" }, { status: 503 })
  }

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
      model: openai("gpt-6-luna"),
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
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined
    if (statusCode === 401) {
      return Response.json({ error: "OpenAI didn’t accept this API key. Check OPENAI_API_KEY in the project environment settings." }, { status: 503 })
    }
    if (statusCode === 429) {
      return Response.json({ error: "OpenAI reached an account usage or rate limit. Check your API billing and limits, then try again." }, { status: 503 })
    }
    return Response.json({ error: "We couldn’t create your study set right now. Please try again." }, { status: 500 })
  }
}
