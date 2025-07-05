import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { input, numQuestions } = await req.json()

    if (!input || !numQuestions) {
      return Response.json({ error: "Input and number of questions are required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert quiz generator. Your job is to create educational quizzes based on study notes or topics provided by students.

INSTRUCTIONS:
1. Generate exactly ${numQuestions} questions based on the provided content
2. Mix question types: approximately 60% multiple-choice and 40% short-answer
3. For multiple-choice questions:
   - Provide exactly 4 options labeled A, B, C, D
   - Make sure only one answer is clearly correct
   - Include plausible but incorrect distractors
4. For short-answer questions:
   - Ask for specific facts, definitions, or brief explanations
   - Provide the expected answer
5. Create an answer key at the end listing all correct answers
6. Format everything in clean Markdown

FORMATTING REQUIREMENTS:
- Start with "# Quiz" as the main heading
- Number each question (1., 2., 3., etc.)
- For multiple-choice: list options as A) B) C) D)
- End with "## Answer Key" section
- Use clear, professional language
- Ensure questions test understanding, not just memorization`,
      prompt: `Create a ${numQuestions}-question quiz based on the following content:

${input}

Generate a well-structured quiz that tests key concepts and understanding of this material.`,
    })

    return Response.json({ quiz: text })
  } catch (error) {
    console.error("Error generating quiz:", error)
    return Response.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
