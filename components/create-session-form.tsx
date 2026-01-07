'use client'
import { useState } from 'react'
import { generateInterviewQuestions } from '@/app/actions'
import { ResumeUpload } from './resume-upload'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Question } from '@/lib/types'

export type SessionContext = {
    questions: Question[];
    resumeText: string;
    jobDescription: string;
}

export function CreateSessionForm({ onSuccess }: { onSuccess: (data: SessionContext) => void }) {
    const [file, setFile] = useState<File | null>(null)
    const [jd, setJd] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!file || !jd) {
            setError("Please provide both a resume and a job description.");
            return;
        }
        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jd);

        const result = await generateInterviewQuestions(formData);
        setLoading(false);

        if (result.success) {
            onSuccess({
                questions: result.questions || [],
                resumeText: result.resumeText || "",
                jobDescription: jd || ""
            });
        } else {
            setError(result.error || "An unknown error occurred");
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>New Interview Session</CardTitle>
                <CardDescription>Upload your resume and paste the job description to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <ResumeUpload onChange={setFile} />
                <div className="grid w-full gap-1.5">
                    <Label htmlFor="jd">Job Description</Label>
                    <Textarea
                        id="jd"
                        placeholder="Paste the job description here..."
                        className="min-h-[150px]"
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                    />
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? 'Analyzing Profile & Generating Questions...' : 'Start Interview'}
                </Button>
            </CardContent>
        </Card>
    )
}
