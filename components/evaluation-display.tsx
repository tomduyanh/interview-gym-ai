'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedEvaluation } from '@/lib/types'
import { Eye, MessageSquare } from 'lucide-react'

interface EvaluationDisplayProps {
    evaluations: EnhancedEvaluation[]
}

export function EvaluationDisplay({ evaluations }: EvaluationDisplayProps) {
    if (!evaluations || evaluations.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No evaluations available yet.
            </div>
        )
    }

    // Calculate overall scores
    const overallContentScore = evaluations.reduce((sum, e) => sum + e.starScore.overallSTAR, 0) / evaluations.length
    const hasVisualMetrics = evaluations.some(e => e.visualMetrics)
    const overallVisualScore = hasVisualMetrics
        ? evaluations.filter(e => e.visualMetrics).reduce((sum, e) => sum + (e.visualMetrics?.overallPresence || 0), 0) /
        evaluations.filter(e => e.visualMetrics).length
        : 0
    const overallCombinedScore = evaluations.reduce((sum, e) => sum + e.combinedScore, 0) / evaluations.length

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in-50 duration-500">
            {/* Overall Score Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">
                        Interview Performance Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-6xl font-bold text-primary">
                            {overallCombinedScore.toFixed(1)}<span className="text-3xl text-muted-foreground">/5.0</span>
                        </div>
                        <p className="text-muted-foreground">Overall Score</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Content (STAR)</h3>
                            </div>
                            <div className="text-2xl font-bold">{overallContentScore.toFixed(1)}/5.0</div>
                            <Progress value={overallContentScore * 20} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">70% weight</p>
                        </Card>

                        {hasVisualMetrics && (
                            <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">Visual Presence</h3>
                                </div>
                                <div className="text-2xl font-bold">{overallVisualScore.toFixed(1)}/5.0</div>
                                <Progress value={overallVisualScore * 20} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">30% weight</p>
                            </Card>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Question-by-Question Breakdown */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Question-by-Question Analysis</h2>
                {evaluations.map((evaluation, index) => (
                    <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <div className="flex justify-between items-start gap-4">
                                <CardTitle className="text-lg">
                                    Question {index + 1}: {evaluation.question}
                                </CardTitle>
                                <Badge variant="outline" className="shrink-0">
                                    Score: {evaluation.combinedScore.toFixed(1)}/5.0
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Video Player if available */}
                            {evaluation.videoUrl && (
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                    <video
                                        src={evaluation.videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                </div>
                            )}

                            {/* Answer Text */}
                            <div>
                                <h4 className="font-semibold mb-2">Your Answer:</h4>
                                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                    {evaluation.answer || "No answer provided"}
                                </p>
                            </div>

                            {/* STAR + Visual Tabs */}
                            <Tabs defaultValue="star" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="star">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        STAR Analysis
                                    </TabsTrigger>
                                    <TabsTrigger value="visual" disabled={!evaluation.visualMetrics}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visual Metrics
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="star" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <MetricBar
                                            label="Situation"
                                            score={evaluation.starScore.situation}
                                            description="Context setting"
                                        />
                                        <MetricBar
                                            label="Task"
                                            score={evaluation.starScore.task}
                                            description="Responsibility definition"
                                        />
                                        <MetricBar
                                            label="Action"
                                            score={evaluation.starScore.action}
                                            description="Actions taken"
                                        />
                                        <MetricBar
                                            label="Result"
                                            score={evaluation.starScore.result}
                                            description="Measurable impact"
                                        />
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Feedback
                                        </h5>
                                        <p className="text-sm">{evaluation.starScore.critique}</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="visual" className="space-y-4 mt-4">
                                    {evaluation.visualMetrics && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <MetricBar
                                                    label="Eye Contact"
                                                    score={evaluation.visualMetrics.eyeContact}
                                                    description="Camera engagement"
                                                />
                                                <MetricBar
                                                    label="Facial Confidence"
                                                    score={evaluation.visualMetrics.facialConfidence}
                                                    description="Expression & engagement"
                                                />
                                                <MetricBar
                                                    label="Gestures"
                                                    score={evaluation.visualMetrics.gestures}
                                                    description="Hand movement appropriateness"
                                                />
                                                <MetricBar
                                                    label="Posture"
                                                    score={evaluation.visualMetrics.posture}
                                                    description="Body composure"
                                                />
                                                <MetricBar
                                                    label="Head Touching"
                                                    score={evaluation.visualMetrics.headTouching}
                                                    description="Nervous self-touching (5 = none)"
                                                />
                                                <MetricBar
                                                    label="Speaking Volume"
                                                    score={evaluation.visualMetrics.speakingVolume}
                                                    description="Clarity & voice projection"
                                                />
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
                                                <h5 className="font-semibold mb-2 flex items-center gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    Visual Presence Feedback
                                                </h5>
                                                <p className="text-sm">{evaluation.visualMetrics.feedback}</p>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Recommendations */}
                            {evaluation.recommendations.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                                        💡 Recommendations
                                    </h5>
                                    <ul className="space-y-2">
                                        {evaluation.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function MetricBar({ label, score, description }: { label: string; score: number; description: string }) {
    const percentage = (score / 5) * 100
    const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-blue-500' : score >= 2 ? 'bg-yellow-500' : 'bg-red-500'

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <div>
                    <span className="font-medium text-sm">{label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({description})</span>
                </div>
                <span className="text-sm font-bold">{score.toFixed(1)}/5</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full ${color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
