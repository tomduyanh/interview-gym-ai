'use client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, AlertTriangle, MessageSquare, Award, RefreshCcw } from 'lucide-react'
import { Evaluation } from '@/lib/types'

export interface InterviewReportProps {
    evaluations: Evaluation[];
}

export function InterviewReport({ evaluations }: InterviewReportProps) {
    const averageScore = evaluations.reduce((acc, curr) => {
        const { clarity, relevance, star_score } = curr.evaluation;
        return acc + (clarity + relevance + star_score) / 3;
    }, 0) / evaluations.length;

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-700">
            {/* Summary Hero */}
            <Card className="bg-primary/5 border-none shadow-none text-center p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="h-32 w-32" />
                </div>
                <CardHeader>
                    <CardTitle className="text-4xl font-extrabold tracking-tight">Interview Performance Report</CardTitle>
                    <CardDescription className="text-lg">Based on your recent mock session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center items-center space-x-4">
                        <div className="text-6xl font-black text-primary">{averageScore.toFixed(1)}</div>
                        <div className="text-left">
                            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Overall Rank</div>
                            <div className="text-xl font-semibold">
                                {averageScore >= 4.5 ? 'Excellent' : averageScore >= 3.5 ? 'Good' : 'Needs Work'}
                            </div>
                        </div>
                    </div>
                    <div className="max-w-md mx-auto">
                        <Progress value={averageScore * 20} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6">
                <h3 className="text-2xl font-bold px-1">Detailed Breakdown</h3>
                {evaluations.map((item, index) => (
                    <Card key={index} className="overflow-hidden border-2 transition-all hover:border-primary/20">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-muted-foreground uppercase">Question {index + 1}</div>
                                    <CardTitle className="text-lg font-semibold leading-snug">{item.question}</CardTitle>
                                </div>
                                <Badge variant="outline" className="h-8 px-3 text-lg font-bold border-2">
                                    {((item.evaluation.clarity + item.evaluation.relevance + item.evaluation.star_score) / 3).toFixed(1)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-6">
                                {/* Scores Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-muted-foreground">Clarity</span>
                                            <span className={`font-bold ${getScoreColor(item.evaluation.clarity)}`}>{item.evaluation.clarity}/5</span>
                                        </div>
                                        <Progress value={item.evaluation.clarity * 20} className="h-1.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-muted-foreground">Relevance</span>
                                            <span className={`font-bold ${getScoreColor(item.evaluation.relevance)}`}>{item.evaluation.relevance}/5</span>
                                        </div>
                                        <Progress value={item.evaluation.relevance * 20} className="h-1.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-muted-foreground">STAR Structure</span>
                                            <span className={`font-bold ${getScoreColor(item.evaluation.star_score)}`}>{item.evaluation.star_score}/5</span>
                                        </div>
                                        <Progress value={item.evaluation.star_score * 20} className="h-1.5" />
                                    </div>
                                </div>

                                {/* Answer & Critique */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2 text-sm font-bold uppercase text-muted-foreground">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Your Answer</span>
                                        </div>
                                        <div className="bg-muted/10 p-4 rounded-lg text-sm italic leading-relaxed text-muted-foreground border">
                                            "{item.answer}"
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2 text-sm font-bold uppercase text-primary">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>AI Coach Comments</span>
                                        </div>
                                        <div className="text-sm leading-relaxed p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            {item.evaluation.critique}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <CardFooter className="justify-center pt-8">
                <Button
                    size="lg"
                    className="h-14 px-8 rounded-full text-lg font-bold gap-2 shadow-xl hover:shadow-primary/20 transition-all"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCcw className="h-5 w-5" /> Retake Interview
                </Button>
            </CardFooter>
        </div>
    );
}
