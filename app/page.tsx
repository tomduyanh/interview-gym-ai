'use client'
import { useState } from 'react'
import { CreateSessionForm, SessionContext } from '@/components/create-session-form'
import { InterviewSession } from '@/components/interview-session'
import { InterviewReport } from '@/components/interview-report'
import { Evaluation } from '@/lib/types'
import { BrainCircuit } from 'lucide-react'

export default function Home() {
  const [sessionData, setSessionData] = useState<SessionContext | null>(null)
  const [evaluationResults, setEvaluationResults] = useState<Evaluation[] | null>(null)

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col items-center text-center space-y-4 pt-8">
          <div className="p-3 bg-primary/10 rounded-full">
            <BrainCircuit className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">InterviewGym AI</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bridge the gap between your resume and your specific target job.
            Upload your resume and the job description to generate a personalized tech & behavioral interview.
          </p>
        </header>

        <div className="w-full">
          {evaluationResults ? (
            <InterviewReport evaluations={evaluationResults} />
          ) : sessionData ? (
            <InterviewSession
              questions={sessionData.questions}
              resumeText={sessionData.resumeText}
              jobDescription={sessionData.jobDescription}
              onCompleted={setEvaluationResults}
            />
          ) : (
            <CreateSessionForm onSuccess={setSessionData} />
          )}
        </div>
      </div>
    </main>
  )
}
