"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BookOpen, Brain } from "lucide-react"
import ReactMarkdown from "react-markdown"

export default function QuizGenerator() {
  const [input, setInput] = useState("")
  const [numQuestions, setNumQuestions] = useState(10)
  const [quiz, setQuiz] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const generateQuiz = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: input.trim(),
          numQuestions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()
      setQuiz(data.quiz)
    } catch (error) {
      console.error("Error generating quiz:", error)
      setQuiz("Error generating quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Quiz Generator</h1>
          </div>
          <p className="text-lg text-gray-600">Transform your study notes into interactive quizzes instantly</p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Create Your Quiz
            </CardTitle>
            <CardDescription>
              Paste your study notes or enter a topic, and I'll generate a comprehensive quiz for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Study Notes or Topic</Label>
              <Textarea
                id="input"
                placeholder="Paste your study notes here or enter a topic like 'World War II', 'Photosynthesis', 'JavaScript Functions', etc."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Input
                id="numQuestions"
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number.parseInt(e.target.value) || 10)}
                className="w-32"
              />
            </div>

            <Button onClick={generateQuiz} disabled={!input.trim() || isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Quiz */}
        {quiz && (
          <Card>
            <CardHeader>
              <CardTitle>Your Generated Quiz</CardTitle>
              <CardDescription>Review your quiz below. You can copy the content or generate a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-white p-6 rounded-lg border">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  }}
                >
                  {quiz}
                </ReactMarkdown>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(quiz)}>
                  Copy Quiz
                </Button>
                <Button variant="outline" onClick={() => setQuiz("")}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
