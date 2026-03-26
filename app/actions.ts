'use server';

import { parsePDF } from "@/lib/pdf-parser";
import { generateQuestions, transcribeAudio, evaluateAnswerWithSTAR, analyzeBodyLanguage } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { Question, VideoRecording, EnhancedEvaluation, BodyLanguageMetrics } from "@/lib/types";

export async function saveSession(
    questions: Question[],
    answers: string[],
    resumeText: string,
    jobDescription: string,
    videoUrls: VideoRecording[] = []
) {
    try {
        // Merge questions and answers for storage
        const sessionData = questions.map((q, i) => ({
            ...q,
            answer: answers[i] || ""
        }));

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert({
                questions: sessionData,
                resume_snapshot: resumeText,
                job_description: jobDescription,
                video_urls: videoUrls,
                analysis_status: videoUrls.length > 0 ? 'pending' : 'completed'
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { success: true, session: data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Save Session Error:", error);
        return { success: false, error: message };
    }
}

export async function generateInterviewQuestions(formData: FormData) {
    try {
        const file = formData.get('resume') as File;
        const jobDescription = formData.get('jobDescription') as string;

        if (!file) throw new Error("No resume uploaded");
        if (!jobDescription) throw new Error("No job description provided");

        // 1. Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const resumeText = await parsePDF(buffer);

        // 2. Generate Questions
        const questions = await generateQuestions(resumeText, jobDescription);

        return { success: true, questions: questions as Question[], resumeText };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in generateInterviewQuestions:", error);

        if (message.includes("429")) {
            return { success: false, error: "AI Service is busy (Quota Exceeded). Please try again in a minute." };
        }

        return { success: false, error: message };
    }
}
export async function evaluateSessionAnswers(sessionId: string) {
    try {
        const { data: session, error: fetchError } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError) throw new Error(fetchError.message);

        // Update status to processing
        await supabase
            .from('interview_sessions')
            .update({ analysis_status: 'processing' })
            .eq('id', sessionId);

        const enhancedEvaluations: EnhancedEvaluation[] = [];
        const videoUrls: VideoRecording[] = session.video_urls || [];
        const visualAnalysisMap: Record<number, BodyLanguageMetrics> = {};

        for (let i = 0; i < session.questions.length; i++) {
            const item = session.questions[i];

            // Content evaluation using STAR framework
            const starScore = await evaluateAnswerWithSTAR(item.content, item.answer);

            // Visual evaluation if video exists
            let visualMetrics: BodyLanguageMetrics | undefined;
            const videoRecord = videoUrls.find(v => v.questionIndex === i);

            if (videoRecord && videoRecord.url) {
                try {
                    // Fetch the video from the public URL
                    const response = await fetch(videoRecord.url);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        visualMetrics = await analyzeBodyLanguage(buffer, videoRecord.mimeType);
                        visualAnalysisMap[i] = visualMetrics;
                    } else {
                        console.error(`Failed to fetch video from URL: ${videoRecord.url}, status: ${response.status}`);
                    }
                } catch (error) {
                    console.error(`Failed to analyze video for question ${i}:`, error);
                    // Continue without visual metrics
                }
            }

            // Calculate combined score (70% content, 30% visual)
            let combinedScore = starScore.overallSTAR * 0.7;
            if (visualMetrics) {
                combinedScore += visualMetrics.overallPresence * 0.3;
            } else {
                // If no video, use 100% content score
                combinedScore = starScore.overallSTAR;
            }

            // Generate recommendations
            const recommendations: string[] = [];

            // STAR recommendations
            if (starScore.situation < 3) recommendations.push("Provide more context about the situation");
            if (starScore.task < 3) recommendations.push("Clearly define your specific responsibility");
            if (starScore.action < 3) recommendations.push("Explain the concrete actions you took in more detail");
            if (starScore.result < 3) recommendations.push("Include measurable outcomes and impact");

            // Visual recommendations
            if (visualMetrics) {
                if (visualMetrics.eyeContact < 3) recommendations.push("Maintain more consistent eye contact with the camera");
                if (visualMetrics.facialConfidence < 3) recommendations.push("Work on conveying confidence through facial expressions");
                if (visualMetrics.gestures < 3) recommendations.push("Use natural hand gestures to emphasize key points");
                if (visualMetrics.posture < 3) recommendations.push("Maintain an upright, confident posture");
                if (visualMetrics.headTouching < 3) recommendations.push("Reduce nervous self-touching (hair, face, neck) — keep hands relaxed and still");
                if (visualMetrics.speakingVolume < 3) recommendations.push("Speak louder and more clearly — project your voice with confidence");
            }

            enhancedEvaluations.push({
                questionIndex: i,
                question: item.content,
                answer: item.answer,
                videoUrl: videoRecord?.url,
                starScore,
                visualMetrics,
                combinedScore,
                recommendations
            });
        }

        // Update session with enhanced evaluations and visual analysis
        await supabase
            .from('interview_sessions')
            .update({
                enhanced_evaluations: enhancedEvaluations,
                visual_analysis: visualAnalysisMap,
                analysis_status: 'completed'
            })
            .eq('id', sessionId);

        return { success: true, evaluations: enhancedEvaluations };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Evaluation Error:", error);

        // Update status to failed
        await supabase
            .from('interview_sessions')
            .update({ analysis_status: 'failed' })
            .eq('id', sessionId);

        return { success: false, error: message };
    }
}

export async function transcribeAudioAction(formData: FormData) {
    try {
        const file = formData.get('audio') as File;
        if (!file) throw new Error("No audio file provided");

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'audio/webm';

        const text = await transcribeAudio(buffer, mimeType);
        return { success: true, text };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Transcription Action Error:", error);

        if (message.includes("429")) {
            return { success: false, error: "Transcription Service Busy. Please wait a moment." };
        }

        return { success: false, error: message };
    }
}

