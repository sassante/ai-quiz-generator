export type SourceType = "topic" | "notes"
export type QuestionType = "multiple-choice" | "true-false" | "short-answer"
export type Difficulty = "easy" | "medium" | "hard"

export type QuizQuestion = {
  type: QuestionType
  prompt: string
  options: string[]
  correctAnswer: string
  acceptedAnswers: string[]
  explanation: string
}

export type GeneratedQuiz = {
  questions: QuizQuestion[]
}
