"use client"

import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { BookOpen, Brain, Check, ChevronDown, Clipboard, FileText, GraduationCap, Loader2, Sparkles, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_TEXT_LENGTH = 60_000

async function extractText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (["txt", "md", "markdown"].includes(extension ?? "")) return file.text()
  if (extension === "docx") {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1)
      const content = await page.getTextContent()
      return content.items.map((item) => "str" in item ? item.str : "").join(" ")
    }))
    return pages.join("\n\n")
  }
  throw new Error("Choose a PDF, DOCX, TXT, or Markdown file.")
}

type Result = { quiz: string; notes: string }

export default function QuizGenerator() {
  const [input, setInput] = useState("")
  const [numQuestions, setNumQuestions] = useState(10)
  const [result, setResult] = useState<Result | null>(null)
  const [activeTab, setActiveTab] = useState<"quiz" | "notes">("quiz")
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const [error, setError] = useState("")
  const [billingRequired, setBillingRequired] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file?: File) => {
    if (!file) return
    setFileError("")
    setError("")
    if (file.size > MAX_FILE_SIZE) {
      setFileError("This file is larger than 15 MB. Choose a smaller file.")
      return
    }
    try {
      const text = (await extractText(file)).trim()
      if (!text) throw new Error("We couldn’t find selectable text in this file. Try a text-based PDF or paste your notes instead.")
      setInput(text.slice(0, MAX_TEXT_LENGTH))
      setFileName(file.name)
      setResult(null)
    } catch (caught) {
      setFileError(caught instanceof Error ? caught.message : "We couldn’t read that file. Try another one.")
    }
  }

  const generate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setError("")
    setBillingRequired(false)
    setResult(null)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), numQuestions }),
      })
      const data = await response.json()
      if (!response.ok) {
        setBillingRequired(data.code === "AI_GATEWAY_BILLING_REQUIRED")
        throw new Error(data.error || "Couldn’t generate your study set. Please try again.")
      }
      setBillingRequired(false)
      setResult({ quiz: data.quiz, notes: data.notes })
      setActiveTab("quiz")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyContent = async () => {
    if (!result) return
    await navigator.clipboard.writeText(activeTab === "quiz" ? result.quiz : result.notes)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#20241f]">
      <header className="border-b border-[#e8e9e3] bg-[#f7f7f4]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Studywise home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d4437] text-white"><Brain size={19} /></span>
            <span>studywise<span className="text-[#789185]">.</span></span>
          </a>
          <div className="hidden items-center gap-2 text-sm text-[#66736c] sm:flex"><Sparkles size={15} className="text-[#b8843b]" /> Your personal AI study partner</div>
          <a href="#workspace" className="rounded-full border border-[#dfe2da] px-4 py-2 text-sm font-medium transition hover:bg-white">Start studying</a>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:grid-cols-[1fr_330px] lg:gap-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce6dc] bg-[#eff4ec] px-3 py-1.5 text-xs font-semibold text-[#315744]"><span className="h-1.5 w-1.5 rounded-full bg-[#699578]" /> TURN YOUR MATERIAL INTO MOMENTUM</div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">Study smarter.<br /><span className="font-serif font-normal italic text-[#66816c]">Remember more.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#737a72] sm:text-lg">Drop in your class notes or a study file. Get a thoughtful summary and a fresh quiz, made just for what you need to learn.</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#59635b]"><span className="flex items-center gap-2"><Check size={15} className="text-[#4e795d]" /> Notes to study guide</span><span className="flex items-center gap-2"><Check size={15} className="text-[#4e795d]" /> Quizzes with answers</span></div>
        </div>
        <div className="relative hidden lg:block"><div className="absolute inset-5 rounded-full bg-[#e7eee4] blur-2xl" /><Card className="relative rotate-2 border-[#e7e8e2] bg-white shadow-[0_24px_80px_-38px_rgba(27,58,42,.25)]"><CardContent className="p-6"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.16em] text-[#7e877e]">Your study set</span><span className="rounded-full bg-[#eff4ec] px-2.5 py-1 text-[11px] font-medium text-[#4e725a]">READY</span></div><div className="mb-3 flex items-center gap-3 rounded-xl bg-[#f6f7f3] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8efe6] text-[#4b7254]"><FileText size={18} /></span><div><p className="text-sm font-medium">Cell_Biology_Notes.pdf</p><p className="mt-0.5 text-xs text-[#899087]">12 pages · 8 min read</p></div></div><div className="space-y-3 rounded-xl border border-[#eceee8] p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-[#78827a]">Quick check</p><p className="text-sm leading-5">What is the primary role of the mitochondria?</p><div className="rounded-lg border border-[#a6bca6] bg-[#f3f7f1] p-2.5 text-xs text-[#45664c]">A · Producing ATP through cellular respiration</div><div className="flex justify-between pt-1 text-[11px] text-[#8a9189]"><span>Question 3 of 10</span><span>30% complete</span></div></div></CardContent></Card></div>
      </section>

      <section id="workspace" className="mx-auto grid max-w-6xl scroll-mt-6 gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[.95fr_1.05fr]">
        <Card className="h-fit overflow-hidden border-[#e6e7e0] bg-white shadow-[0_8px_34px_-24px_rgba(35,55,38,.2)]">
          <CardHeader className="pb-4"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2e9] text-[#43664b]"><BookOpen size={19} /></div><CardTitle className="text-xl tracking-tight">Start with your material</CardTitle><CardDescription className="leading-5">Upload a file or paste your notes to build a personal study set.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="study-file" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#69736b]">Upload a file</Label>
              <input ref={inputRef} id="study-file" type="file" accept=".pdf,.docx,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" className="sr-only" onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = "" }} aria-describedby="file-help file-error" />
              <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]) }} className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#cfd7cc] bg-[#fafbf8] px-4 py-5 text-center transition hover:border-[#78957c] hover:bg-[#f5f8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#456b50]" aria-label="Choose or drop a PDF, Word, text, or Markdown file">
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2e9] text-[#4d7153]"><Upload size={17} /></span><span className="text-sm font-medium">Drop your file here or <span className="text-[#42674a] underline underline-offset-2">browse files</span></span><span id="file-help" className="mt-1.5 text-xs text-[#899087]">PDF, DOCX, TXT, Markdown · up to 15 MB</span>
              </button>
              {fileName && <div className="mt-2 flex items-center justify-between rounded-lg bg-[#f1f4ef] px-3 py-2 text-xs text-[#526a56]"><span className="flex min-w-0 items-center gap-2"><FileText size={14} /><span className="truncate">{fileName}</span></span><button type="button" onClick={() => { setFileName(""); setInput("") }} aria-label="Remove uploaded file" className="rounded p-1 hover:bg-white"><X size={14} /></button></div>}
              {fileError && <p id="file-error" role="alert" className="mt-2 text-xs text-red-700">{fileError}</p>}
            </div>
            <div className="relative flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.15em] text-[#9a9f98]"><span className="h-px flex-1 bg-[#eceee8]" />or paste your notes<span className="h-px flex-1 bg-[#eceee8]" /></div>
            <div className="space-y-2"><Label htmlFor="study-notes" className="text-xs font-semibold uppercase tracking-wider text-[#69736b]">Study material</Label><Textarea id="study-notes" placeholder="Paste lecture notes, a chapter, or a topic you’re learning…" value={input} onChange={(event) => { setInput(event.target.value); if (fileName) setFileName("") }} rows={7} maxLength={MAX_TEXT_LENGTH} className="min-h-36 resize-y rounded-xl border-[#e4e7e0] bg-[#fdfdfb] text-sm leading-6 placeholder:text-[#a1a59e] focus-visible:ring-[#6c8a70]" /><div className="flex justify-between text-[11px] text-[#92988f]"><span>{input.length > 0 ? `${input.trim().split(/\s+/).length.toLocaleString()} words` : "Your material stays in this session"}</span><span>{input.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}</span></div></div>
            <div className="flex items-center justify-between rounded-xl border border-[#eceee8] bg-[#fafbf8] px-4 py-3"><div><Label htmlFor="question-count" className="text-sm font-medium">Quiz length</Label><p className="mt-0.5 text-xs text-[#858d83]">Choose how much to practice</p></div><div className="relative"><select id="question-count" value={numQuestions} onChange={(event) => setNumQuestions(Number(event.target.value))} className="appearance-none rounded-lg border border-[#e1e5dd] bg-white py-2 pl-3 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c8a70]">{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} questions</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c847b]" /></div></div>
            <Button onClick={generate} disabled={!input.trim() || isLoading} className="h-12 w-full rounded-xl bg-[#244c3c] text-sm font-semibold text-white shadow-sm hover:bg-[#1d4032] disabled:opacity-45">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building your study set…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate my study set</>}</Button>
            {error && <div role="alert" className="rounded-xl border border-[#ead7b7] bg-[#fcf8ef] p-3 text-sm text-[#765826]"><p>{error}</p>{billingRequired && <a className="mt-1 inline-block font-medium underline underline-offset-2" href="https://vercel.com/sandra-asantes-projects/~/ai" target="_blank" rel="noreferrer">Open AI Gateway settings</a>}</div>}
            <p className="text-center text-[11px] leading-4 text-[#969b93]">Your uploaded file is read locally in your browser. Only extracted text is sent to create your study set.</p>
          </CardContent>
        </Card>

        <Card className="min-h-[460px] border-[#e6e7e0] bg-white shadow-[0_8px_34px_-24px_rgba(35,55,38,.2)]">
          <CardHeader className="pb-0"><div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f0e4] text-[#a47a3c]"><GraduationCap size={20} /></div><CardTitle className="text-xl tracking-tight">Your study space</CardTitle><CardDescription>{result ? "A fresh set, made from your material." : "Your notes and quiz will appear here, ready when you are."}</CardDescription></CardHeader>
          <CardContent className="pt-5">
            {result ? <><div className="mb-5 flex items-center justify-between border-b border-[#eceee8]"><div className="flex gap-5" role="tablist" aria-label="Study set content">{(["quiz", "notes"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => { setActiveTab(tab); setCopied(false) }} className={`relative pb-3 text-sm font-medium capitalize transition ${activeTab === tab ? "text-[#315b43] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#4b7757]" : "text-[#858d83] hover:text-[#46544a]"}`}>{tab === "quiz" ? "Practice quiz" : "Study notes"}</button>)}</div><Button variant="outline" size="sm" onClick={() => void copyContent()} className="mb-2 h-8 gap-1.5 rounded-lg border-[#e4e7e0] text-xs">{copied ? <Check size={13} /> : <Clipboard size={13} />}{copied ? "Copied" : "Copy"}</Button></div><div role="tabpanel" className="prose prose-sm max-w-none text-[#414941] prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-[#263c2e] prose-p:leading-7 prose-strong:text-[#293b2e] prose-li:leading-6 prose-hr:border-[#eceee8]"><ReactMarkdown>{activeTab === "quiz" ? result.quiz : result.notes}</ReactMarkdown></div></> : <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e8e1] bg-[#fafbf8] px-8 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2e9] text-[#517459]"><FileText size={24} /></div><p className="text-sm font-medium text-[#4d5c50]">A little more clarity, one upload away.</p><p className="mt-2 max-w-xs text-sm leading-6 text-[#8a9288]">Add your class material to make a custom quiz and concise study notes.</p><div className="mt-5 flex items-center gap-2 text-xs text-[#8e968c]"><span className="rounded-full bg-white px-2.5 py-1">Key takeaways</span><span className="rounded-full bg-white px-2.5 py-1">Answer key</span></div></div>}
          </CardContent>
        </Card>
      </section>
      <footer className="border-t border-[#e8e9e3]"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-[#8a9189] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-medium text-[#526356]">studywise.</span><span>Made for curious minds and better study sessions.</span></div></footer>
    </main>
  )
}
