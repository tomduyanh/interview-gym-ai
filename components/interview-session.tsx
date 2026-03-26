'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { saveSession, evaluateSessionAnswers } from '@/app/actions'
import { Loader2 } from 'lucide-react'
import { Question, VideoRecording, EnhancedEvaluation } from '@/lib/types'
import { AnswerRecorder } from './media-recorder'

interface InterviewSessionProps {
    questions: Question[];
    resumeText: string;
    jobDescription: string;
    onCompleted: (evaluations: EnhancedEvaluation[]) => void;
}

export function InterviewSession({ questions, resumeText, jobDescription, onCompleted }: InterviewSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))
    const [videoUrls, setVideoUrls] = useState<VideoRecording[]>([])
    const [sessionId, setSessionId] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [isProcessingRecord, setIsProcessingRecord] = useState(false)

    // Generate temporary sessionId on mount for video uploads
    useEffect(() => {
        setSessionId(`temp-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    }, []);


    if (!questions || questions.length === 0) {
        return <div className="p-8 text-center">No questions generated. Please try again or check the server logs.</div>;
    }

    const currentQ = questions[currentIndex]

    if (!currentQ) {
        return <div className="p-8 text-center text-red-500">Error loading question at index {currentIndex}.</div>;
    }

    const progress = ((currentIndex + 1) / questions.length) * 100

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setLoading(true)
            try {
                const saveResult = await saveSession(questions, answers, resumeText, jobDescription, videoUrls);
                if (saveResult.success && saveResult.session) {
                    const evalResult = await evaluateSessionAnswers(saveResult.session.id);
                    if (evalResult.success && evalResult.evaluations) {
                        onCompleted(evalResult.evaluations);
                    } else {
                        alert(`Failed to evaluate answers: ${evalResult.error}`);
                    }
                } else {
                    alert(`Failed to save session: ${saveResult.error}`);
                }
            } catch (e) {
                console.error("Failed to complete session:", e)
                alert("An error occurred during completion.");
            } finally {
                setLoading(false)
            }
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1)
    }

    if (loading) {
        return (
            <Card className="max-w-xl mx-auto text-center p-12 space-y-6">
                <div className="flex justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl">Evaluating Your Performance...</CardTitle>
                <CardDescription>
                    Our AI coach is analyzing your answers using the STAR framework
                    {videoUrls.length > 0 && ' and evaluating your body language from the video recordings'}
                    . This may take a moment.
                </CardDescription>
            </Card>
        )
    }


    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in-50 duration-500">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Interview Session</h2>
                    <span className="text-sm text-muted-foreground font-medium w-32 text-right">Question {currentIndex + 1} of {questions.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="border-2 shadow-sm">
                <CardHeader className="space-y-4">
                    <div className="flex justify-between items-start">
                        <Badge variant={currentQ.type === 'technical' ? 'default' : 'secondary'} className="uppercase tracking-wider">
                            {currentQ.type}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl leading-relaxed font-semibold">{currentQ.content}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        className="min-h-[250px] text-lg p-6 resize-none focus-visible:ring-1 focus-visible:ring-primary/20 border-muted"
                        placeholder="Type your answer here..."
                        value={answers[currentIndex]}
                        onChange={(e) => {
                            const newAnswers = [...answers];
                            newAnswers[currentIndex] = e.target.value;
                            setAnswers(newAnswers);
                        }}
                    />

                    <div className="mt-6 flex justify-center">
                        <AnswerRecorder
                            sessionId={sessionId}
                            questionIndex={currentIndex}
                            onTranscriptionComplete={(text) => {
                                const newAnswers = [...answers];
                                // Append transcription to existing text or replace if empty
                                const currentText = newAnswers[currentIndex] || '';
                                newAnswers[currentIndex] = currentText ? `${currentText} ${text}` : text;
                                setAnswers(newAnswers);
                            }}
                            onVideoUploaded={(videoRecording) => {
                                setVideoUrls(prev => {
                                    // Remove any existing video for this question and add new one
                                    const filtered = prev.filter(v => v.questionIndex !== currentIndex);
                                    return [...filtered, videoRecording];
                                });
                            }}
                            onProcessingChange={setIsProcessingRecord}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/5 p-6 border-t">
                    <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2">
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button onClick={handleNext} disabled={isProcessingRecord} className="gap-2 px-8">
                        {isProcessingRecord ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : currentIndex === questions.length - 1 ? (
                            'Finish & Evaluate'
                        ) : (
                            <>Next Question <ChevronRight className="h-4 w-4" /></>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
